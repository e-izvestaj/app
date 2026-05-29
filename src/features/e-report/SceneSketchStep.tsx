import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { renderSceneSketchDataUrl } from "../../lib/photoAssist";
import { createId, nowIso } from "../../lib/utils";
import type { SceneSketchSuggestion } from "../../types";

const BOARD_WIDTH = 360;
const BOARD_HEIGHT = 340;
const MIN_ZOOM = 16;
const MAX_ZOOM = 24;

type Props = {
  sceneSketch: SceneSketchSuggestion;
  locationLabel: string | null;
  hasGps: boolean;
  latitude?: number;
  longitude?: number;
  onChange: (sceneSketch: SceneSketchSuggestion) => void;
  onSaveSketchImage: (dataUrl: string) => void;
  readOnly?: boolean;
};

type DragTarget = "vehicleA" | "vehicleB" | "impact" | null;
type Direction = SceneSketchSuggestion["vehicleAState"]["direction"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getMapSpan(zoom: number) {
  const lngSpan = 0.012 / Math.pow(2, zoom - 14);
  const latSpan = lngSpan * 0.94;

  return { lngSpan, latSpan };
}

function getEmbedMapUrl(latitude: number, longitude: number, zoom: number) {
  const { lngSpan, latSpan } = getMapSpan(zoom);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - lngSpan}%2C${latitude - latSpan}%2C${longitude + lngSpan}%2C${latitude + latSpan}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}

function getStaticMapUrl(latitude: number, longitude: number, zoom: number) {
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=${zoom}&size=960x900&maptype=mapnik`;
}

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Neuspesno ucitavanje mape."));
    image.src = src;
  });
}

function drawFallbackRoad(
  context: CanvasRenderingContext2D,
  sketch: SceneSketchSuggestion,
  scaleX: number,
  scaleY: number
) {
  context.fillStyle = "#101722";
  context.strokeStyle = "rgba(47,128,255,0.18)";
  context.lineWidth = 2 * scaleX;

  const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
    context.beginPath();
    context.roundRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY, radius * scaleX);
    context.fill();
    context.stroke();
  };

  if (sketch.laneType === "intersection") {
    drawRoundedRect(26, 24, 308, 292, 28);
    context.fillStyle = "#1A2230";
    context.beginPath();
    context.roundRect(132 * scaleX, 24 * scaleY, 96 * scaleX, 292 * scaleY, 18 * scaleX);
    context.fill();
    context.beginPath();
    context.roundRect(26 * scaleX, 122 * scaleY, 308 * scaleX, 96 * scaleY, 18 * scaleX);
    context.fill();
  } else if (sketch.laneType === "parking") {
    drawRoundedRect(26, 24, 308, 292, 28);
    context.fillStyle = "#1A2230";
    context.beginPath();
    context.roundRect(134 * scaleX, 24 * scaleY, 92 * scaleX, 292 * scaleY, 18 * scaleX);
    context.fill();
    context.strokeStyle = "rgba(143,166,199,0.55)";
    context.lineWidth = 1;
    [68, 118, 168, 218, 268].forEach((top) => {
      context.beginPath();
      context.moveTo(90 * scaleX, top * scaleY);
      context.lineTo(132 * scaleX, top * scaleY);
      context.stroke();
    });
  } else if (sketch.laneType === "roundabout") {
    drawRoundedRect(26, 24, 308, 292, 28);
    context.fillStyle = "#1A2230";
    context.beginPath();
    context.arc(180 * scaleX, 170 * scaleY, 74 * scaleX, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(255,255,255,0.28)";
    context.setLineDash([10 * scaleX, 8 * scaleY]);
    context.beginPath();
    context.arc(180 * scaleX, 170 * scaleY, 54 * scaleX, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = "#101722";
    context.beginPath();
    context.arc(180 * scaleX, 170 * scaleY, 34 * scaleX, 0, Math.PI * 2);
    context.fill();
  } else {
    drawRoundedRect(26, 24, 308, 292, 28);
    context.fillStyle = "#1A2230";
    context.beginPath();
    context.roundRect(132 * scaleX, 24 * scaleY, 96 * scaleX, 292 * scaleY, 18 * scaleX);
    context.fill();
  }

  if (sketch.decorations.centerLine) {
    context.strokeStyle = "rgba(255,255,255,0.3)";
    context.lineWidth = 2 * scaleX;
    context.setLineDash([10 * scaleX, 8 * scaleY]);
    context.beginPath();
    context.moveTo(180 * scaleX, 24 * scaleY);
    context.lineTo(180 * scaleX, 316 * scaleY);
    context.stroke();
    context.setLineDash([]);
  }
}

function drawDecorations(
  context: CanvasRenderingContext2D,
  sketch: SceneSketchSuggestion,
  scaleX: number,
  scaleY: number
) {
  if (sketch.decorations.crosswalk) {
    context.fillStyle = "rgba(255,255,255,0.72)";
    for (let index = 0; index < 6; index += 1) {
      context.fillRect((120 + index * 9) * scaleX, 214 * scaleY, 3 * scaleX, 14 * scaleY);
    }
  }

  if (sketch.decorations.stop) {
    context.fillStyle = "#C83B3B";
    context.beginPath();
    context.arc(64 * scaleX, 72 * scaleY, 14 * scaleX, 0, Math.PI * 2);
    context.fill();
  }

  if (sketch.decorations.trafficLight) {
    context.fillStyle = "rgba(0,0,0,0.72)";
    context.beginPath();
    context.roundRect(272 * scaleX, 70 * scaleY, 18 * scaleX, 48 * scaleY, 10 * scaleX);
    context.fill();
  }

  if (sketch.decorations.priority) {
    context.save();
    context.translate(60 * scaleX, 246 * scaleY);
    context.rotate(Math.PI / 4);
    context.fillStyle = "#F4C84A";
    context.fillRect(0, 0, 18 * scaleX, 18 * scaleY);
    context.restore();
  }

  if (sketch.decorations.parkedVehicle) {
    context.fillStyle = "#7C8AA5";
    context.beginPath();
    context.roundRect(54 * scaleX, 146 * scaleY, 18 * scaleX, 44 * scaleY, 10 * scaleX);
    context.fill();
  }

  if (sketch.decorations.curb) {
    context.strokeStyle = "rgba(191,200,215,0.7)";
    context.lineWidth = 5 * scaleX;
    context.beginPath();
    context.moveTo(44 * scaleX, 302 * scaleY);
    context.lineTo(318 * scaleX, 302 * scaleY);
    context.stroke();
  }
}

function drawDirectionArrow(
  context: CanvasRenderingContext2D,
  state: SceneSketchSuggestion["vehicleAState"],
  color: string,
  scaleX: number,
  scaleY: number
) {
  const x = state.x * scaleX;
  const y = (state.y - 40) * scaleY;

  context.strokeStyle = color;
  context.lineWidth = 4 * scaleX;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();

  switch (state.direction) {
    case "backward":
    case "parking":
      context.moveTo(x, y);
      context.lineTo(x, y + 38 * scaleY);
      break;
    case "left":
      context.moveTo(x, y);
      context.bezierCurveTo(
        x - 16 * scaleX,
        y - 6 * scaleY,
        x - 24 * scaleX,
        y - 24 * scaleY,
        x - 18 * scaleX,
        y - 40 * scaleY
      );
      break;
    case "right":
      context.moveTo(x, y);
      context.bezierCurveTo(
        x + 16 * scaleX,
        y - 6 * scaleY,
        x + 24 * scaleX,
        y - 24 * scaleY,
        x + 18 * scaleX,
        y - 40 * scaleY
      );
      break;
    case "uturn":
    case "merge":
      context.moveTo(x, y);
      context.bezierCurveTo(
        x + 24 * scaleX,
        y - 10 * scaleY,
        x + 28 * scaleX,
        y - 46 * scaleY,
        x,
        y - 54 * scaleY
      );
      context.bezierCurveTo(
        x - 20 * scaleX,
        y - 54 * scaleY,
        x - 22 * scaleX,
        y - 34 * scaleY,
        x - 8 * scaleX,
        y - 24 * scaleY
      );
      break;
    default:
      context.moveTo(x, y);
      context.lineTo(x, y - 38 * scaleY);
      break;
  }

  context.stroke();
}

function drawVehicle(
  context: CanvasRenderingContext2D,
  label: "A" | "B",
  state: SceneSketchSuggestion["vehicleAState"],
  bodyColor: string,
  arrowColor: string,
  scaleX: number,
  scaleY: number
) {
  context.save();
  context.translate(state.x * scaleX, state.y * scaleY);
  context.rotate((state.rotation * Math.PI) / 180);
  context.fillStyle = bodyColor;
  context.beginPath();
  context.roundRect(-16 * scaleX, -28 * scaleY, 32 * scaleX, 56 * scaleY, 14 * scaleX);
  context.fill();
  context.fillStyle = "rgba(255,255,255,0.22)";
  context.beginPath();
  context.roundRect(-10 * scaleX, -18 * scaleY, 20 * scaleX, 20 * scaleY, 8 * scaleX);
  context.fill();
  context.restore();

  context.fillStyle = "#FFFFFF";
  context.font = `700 ${16 * scaleX}px Arial`;
  context.textAlign = "center";
  context.fillText(label, state.x * scaleX, state.y * scaleY + 42 * scaleY);

  drawDirectionArrow(context, state, arrowColor, scaleX, scaleY);
}

function movementGlyph(direction: Direction) {
  switch (direction) {
    case "backward":
    case "parking":
      return "↓";
    case "left":
      return "←";
    case "right":
      return "→";
    case "uturn":
    case "merge":
      return "U";
    default:
      return "↑";
  }
}

function MovementButtons({
  title,
  value,
  onChange,
  readOnly = false
}: {
  title: string;
  value: Direction;
  onChange: (value: Direction) => void;
  readOnly?: boolean;
}) {
  const options: Array<{ label: string; value: Direction }> = [
    { label: "Napred", value: "forward" },
    { label: "Nazad", value: "backward" },
    { label: "Levo", value: "left" },
    { label: "Desno", value: "right" },
    { label: "Polukruzno", value: "uturn" }
  ];

  return (
    <div className="space-y-2">
      <div className="text-sm text-white/60">{title}</div>
      <div className="grid grid-cols-5 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            className={`rounded-[16px] border px-2 py-3 text-sm transition ${
              value === option.value
                ? "border-accent/45 bg-accent/18 text-white"
                : "border-white/10 bg-white/5 text-white/70"
            }`}
            disabled={readOnly}
            onClick={() => onChange(option.value)}
            type="button"
          >
            <div className="text-lg">{movementGlyph(option.value)}</div>
            <div className="mt-1 text-[11px] leading-none">{option.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function LaneTypeButtons({
  value,
  onChange,
  readOnly = false
}: {
  value: SceneSketchSuggestion["laneType"];
  onChange: (value: SceneSketchSuggestion["laneType"]) => void;
  readOnly?: boolean;
}) {
  const options: Array<{ label: string; value: SceneSketchSuggestion["laneType"] }> = [
    { label: "Pravac", value: "straight" },
    { label: "Raskrsnica", value: "intersection" },
    { label: "Parking", value: "parking" },
    { label: "Kruzni tok", value: "roundabout" }
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          className={`rounded-[16px] border px-3 py-3 text-sm transition ${
            value === option.value
              ? "border-accent/45 bg-accent/18 text-white"
              : "border-white/10 bg-white/5 text-white/70"
          }`}
          disabled={readOnly}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function DecorationToggle({
  label,
  active,
  onToggle,
  readOnly = false
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  readOnly?: boolean;
}) {
  return (
    <button
      className={`rounded-full border px-3 py-2 text-sm transition ${
        active ? "border-accent/45 bg-accent/18 text-white" : "border-white/10 bg-white/5 text-white/65"
      }`}
      disabled={readOnly}
      onClick={onToggle}
      type="button"
    >
      {label}
    </button>
  );
}

export default function SceneSketchStep({
  sceneSketch,
  locationLabel,
  hasGps,
  latitude,
  longitude,
  onChange,
  onSaveSketchImage,
  readOnly = false
}: Props) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [drawingPathId, setDrawingPathId] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(sceneSketch.mapZoom ?? 20);
  const [mapCenter, setMapCenter] = useState(() => ({
    latitude: sceneSketch.mapCenterLatitude ?? latitude ?? 0,
    longitude: sceneSketch.mapCenterLongitude ?? longitude ?? 0
  }));

  const sketchPreview = useMemo(
    () => sceneSketch.svgDataUrl || renderSceneSketchDataUrl(sceneSketch, locationLabel),
    [locationLabel, sceneSketch]
  );

  const gpsMapUrl = useMemo(() => {
    if (!mapCenter.latitude || !mapCenter.longitude) {
      return null;
    }

    return getEmbedMapUrl(mapCenter.latitude, mapCenter.longitude, mapZoom);
  }, [mapCenter.latitude, mapCenter.longitude, mapZoom]);

  useEffect(() => {
    setMapZoom(sceneSketch.mapZoom ?? 20);
  }, [sceneSketch.mapZoom]);

  useEffect(() => {
    setMapCenter({
      latitude: sceneSketch.mapCenterLatitude ?? latitude ?? 0,
      longitude: sceneSketch.mapCenterLongitude ?? longitude ?? 0
    });
  }, [latitude, longitude, sceneSketch.mapCenterLatitude, sceneSketch.mapCenterLongitude]);

  const commit = (next: SceneSketchSuggestion) => {
    onChange({
      ...next,
      mapZoom,
      mapCenterLatitude: mapCenter.latitude,
      mapCenterLongitude: mapCenter.longitude,
      svgDataUrl:
        next.status === "confirmed" && next.svgDataUrl
          ? next.svgDataUrl
          : renderSceneSketchDataUrl(next, locationLabel)
    });
  };

  const buildFinalSketchDataUrl = async (next: SceneSketchSuggestion) => {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 900;
    const context = canvas.getContext("2d");

    if (!context) {
      return renderSceneSketchDataUrl(next, locationLabel);
    }

    const scaleX = canvas.width / BOARD_WIDTH;
    const scaleY = canvas.height / BOARD_HEIGHT;

    if (hasGps && mapCenter.latitude && mapCenter.longitude) {
      try {
        const mapImage = await loadImage(getStaticMapUrl(mapCenter.latitude, mapCenter.longitude, mapZoom));
        context.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
        context.fillStyle = "rgba(11,13,18,0.08)";
        context.fillRect(0, 0, canvas.width, canvas.height);
      } catch {
        context.fillStyle = "#0B0D12";
        context.fillRect(0, 0, canvas.width, canvas.height);
        drawFallbackRoad(context, next, scaleX, scaleY);
      }
    } else {
      context.fillStyle = "#0B0D12";
      context.fillRect(0, 0, canvas.width, canvas.height);
      drawFallbackRoad(context, next, scaleX, scaleY);
    }

    drawDecorations(context, next, scaleX, scaleY);
    drawVehicle(context, "A", next.vehicleAState, "#FF5A5F", "#FF9A9D", scaleX, scaleY);
    drawVehicle(context, "B", next.vehicleBState, "#2F80FF", "#7CB2FF", scaleX, scaleY);

    context.strokeStyle = "#FFD54A";
    context.lineWidth = 5 * scaleX;
    context.beginPath();
    context.moveTo((next.impactPoint.x - 10) * scaleX, (next.impactPoint.y - 10) * scaleY);
    context.lineTo((next.impactPoint.x + 10) * scaleX, (next.impactPoint.y + 10) * scaleY);
    context.moveTo((next.impactPoint.x - 10) * scaleX, (next.impactPoint.y + 10) * scaleY);
    context.lineTo((next.impactPoint.x + 10) * scaleX, (next.impactPoint.y - 10) * scaleY);
    context.stroke();

    context.strokeStyle = "#FFFFFF";
    context.lineWidth = 3 * scaleX;
    context.lineJoin = "round";
    context.lineCap = "round";
    next.drawPaths
      .filter((path) => path.points.length > 1)
      .forEach((path) => {
        context.beginPath();
        path.points.forEach((point, index) => {
          if (index === 0) {
            context.moveTo(point.x * scaleX, point.y * scaleY);
          } else {
            context.lineTo(point.x * scaleX, point.y * scaleY);
          }
        });
        context.stroke();
      });

    if (locationLabel) {
      context.fillStyle = "rgba(255,255,255,0.72)";
      context.font = "24px Arial";
      context.textAlign = "left";
      context.fillText(locationLabel, 20, 28);
    }

    return canvas.toDataURL("image/png");
  };

  const pointFromEvent = (event: PointerEvent | React.PointerEvent<HTMLDivElement>) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * BOARD_WIDTH, 24, 336),
      y: clamp(((event.clientY - rect.top) / rect.height) * BOARD_HEIGHT, 24, 316)
    };
  };

  useEffect(() => {
    if (!dragTarget && !drawingPathId) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const nextPoint = pointFromEvent(event);

      if (drawMode && drawingPathId) {
        commit({
          ...sceneSketch,
          status: "pending",
          drawPaths: sceneSketch.drawPaths.map((path) =>
            path.id === drawingPathId
              ? {
                  ...path,
                  points: [...path.points, nextPoint]
                }
              : path
          )
        });
        return;
      }

      if (dragTarget === "vehicleA") {
        commit({
          ...sceneSketch,
          status: "pending",
          vehicleAState: {
            ...sceneSketch.vehicleAState,
            x: nextPoint.x,
            y: nextPoint.y
          }
        });
      } else if (dragTarget === "vehicleB") {
        commit({
          ...sceneSketch,
          status: "pending",
          vehicleBState: {
            ...sceneSketch.vehicleBState,
            x: nextPoint.x,
            y: nextPoint.y
          }
        });
      } else if (dragTarget === "impact") {
        commit({
          ...sceneSketch,
          status: "pending",
          impactPoint: nextPoint
        });
      }
    };

    const handlePointerUp = () => {
      setDragTarget(null);
      setDrawingPathId(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [commit, dragTarget, drawMode, drawingPathId, sceneSketch]);

  return (
    <div className="space-y-4">
      <h2 className="text-[30px] font-semibold text-white">Kreiraj skicu nezgode</h2>

      <Card className="space-y-4 border border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.26em] text-white/40">Skica</div>
          <button
            className={`rounded-full border px-4 py-2 text-sm transition ${
              drawMode ? "border-accent/45 bg-accent/18 text-white" : "border-white/10 bg-white/5 text-white/70"
            }`}
            disabled={readOnly}
            onClick={() => setDrawMode((current) => !current)}
            type="button"
          >
            {drawMode ? "Crtanje" : "Crtaj"}
          </button>
        </div>

        <div
          ref={boardRef}
          className="relative mx-auto h-[460px] w-full max-w-[520px] overflow-hidden rounded-[30px] border border-white/10 bg-[#0B0D12]"
          onPointerDown={(event) => {
            if (readOnly || !drawMode) {
              return;
            }

            const point = pointFromEvent(event);
            const pathId = createId("path");
            setDrawingPathId(pathId);
            commit({
              ...sceneSketch,
              status: "pending",
              drawPaths: [...sceneSketch.drawPaths, { id: pathId, points: [point] }]
            });
          }}
        >
          {gpsMapUrl ? (
            <>
              <iframe
                className="pointer-events-none absolute inset-0 h-full w-full border-0 opacity-90"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={gpsMapUrl}
                title="GPS podloga skice nezgode"
              />
              <div className="absolute inset-0 bg-[#0B0D12]/10" />
            </>
          ) : (
            <div className="absolute inset-0">
              <img alt="Skica puta" className="hidden" src={renderSceneSketchDataUrl(sceneSketch, null)} />
              <div className="absolute inset-0 bg-[#0B0D12]" />
              <div className="absolute inset-0">
                {sceneSketch.laneType === "intersection" ? (
                  <>
                    <div className="absolute left-[132px] top-0 h-full w-24 rounded-[18px] bg-slate-800/95" />
                    <div className="absolute left-0 top-[122px] h-24 w-full rounded-[18px] bg-slate-800/95" />
                  </>
                ) : sceneSketch.laneType === "parking" ? (
                  <>
                    <div className="absolute left-[132px] top-0 h-full w-24 rounded-[18px] bg-slate-800/95" />
                    {[68, 118, 168, 218, 268].map((top) => (
                      <div key={top} className="absolute left-[90px] h-px w-10 bg-slate-300/45" style={{ top }} />
                    ))}
                  </>
                ) : sceneSketch.laneType === "roundabout" ? (
                  <>
                    <div className="absolute left-[96px] top-[86px] h-[168px] w-[168px] rounded-full bg-slate-800/95" />
                    <div className="absolute left-[116px] top-[106px] h-[128px] w-[128px] rounded-full border-2 border-dashed border-white/30" />
                    <div className="absolute left-[144px] top-[134px] h-[72px] w-[72px] rounded-full bg-[#0B0D12]" />
                  </>
                ) : (
                  <div className="absolute left-[132px] top-0 h-full w-24 rounded-[18px] bg-slate-800/95" />
                )}
                {sceneSketch.decorations.centerLine ? (
                  <div className="absolute left-[178px] top-0 h-full w-1 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.35)_0_50%,transparent_50%_100%)] bg-[length:4px_18px]" />
                ) : null}
              </div>
            </div>
          )}

          {sceneSketch.decorations.crosswalk ? (
            <div className="absolute left-[120px] top-[214px] flex gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-4 w-3 rounded-sm bg-white/70" />
              ))}
            </div>
          ) : null}
          {sceneSketch.decorations.stop ? (
            <div className="absolute left-[64px] top-[72px] flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-[9px] font-semibold text-white">
              STOP
            </div>
          ) : null}
          {sceneSketch.decorations.trafficLight ? (
            <div className="absolute left-[276px] top-[76px] flex h-12 w-5 flex-col items-center justify-around rounded-full bg-black/70">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
          ) : null}
          {sceneSketch.decorations.priority ? (
            <div className="absolute left-[60px] top-[246px] h-5 w-5 rotate-45 border-2 border-white bg-amber-300" />
          ) : null}
          {sceneSketch.decorations.parkedVehicle ? (
            <div className="absolute left-[58px] top-[150px] flex h-12 w-6 items-center justify-center rounded-[10px] bg-slate-500 text-[10px] text-white">
              P
            </div>
          ) : null}
          {sceneSketch.decorations.curb ? (
            <div className="absolute bottom-9 left-10 h-1 w-[280px] rounded-full bg-slate-200/70" />
          ) : null}

          <button
            className="absolute h-14 w-8 -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-[#FF5A5F] text-sm font-semibold text-white shadow-lg"
            disabled={readOnly || drawMode}
            onPointerDown={() => setDragTarget("vehicleA")}
            style={{
              left: sceneSketch.vehicleAState.x,
              top: sceneSketch.vehicleAState.y,
              transform: `translate(-50%, -50%) rotate(${sceneSketch.vehicleAState.rotation}deg)`
            }}
            type="button"
          >
            A
          </button>
          <div
            className="pointer-events-none absolute text-xl text-red-200"
            style={{
              left: sceneSketch.vehicleAState.x,
              top: sceneSketch.vehicleAState.y - 46,
              transform: "translate(-50%, -50%)"
            }}
          >
            {movementGlyph(sceneSketch.vehicleAState.direction)}
          </div>

          <button
            className="absolute h-14 w-8 -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-[#2F80FF] text-sm font-semibold text-white shadow-lg"
            disabled={readOnly || drawMode}
            onPointerDown={() => setDragTarget("vehicleB")}
            style={{
              left: sceneSketch.vehicleBState.x,
              top: sceneSketch.vehicleBState.y,
              transform: `translate(-50%, -50%) rotate(${sceneSketch.vehicleBState.rotation}deg)`
            }}
            type="button"
          >
            B
          </button>
          <div
            className="pointer-events-none absolute text-xl text-blue-200"
            style={{
              left: sceneSketch.vehicleBState.x,
              top: sceneSketch.vehicleBState.y - 46,
              transform: "translate(-50%, -50%)"
            }}
          >
            {movementGlyph(sceneSketch.vehicleBState.direction)}
          </div>

          <button
            className="absolute -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-yellow-300"
            disabled={readOnly || drawMode}
            onPointerDown={() => setDragTarget("impact")}
            style={{
              left: sceneSketch.impactPoint.x,
              top: sceneSketch.impactPoint.y
            }}
            type="button"
          >
            X
          </button>

          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}>
            {sceneSketch.drawPaths
              .filter((path) => path.points.length > 1)
              .map((path) => (
                <polyline
                  key={path.id}
                  fill="none"
                  points={path.points.map((point) => `${point.x},${point.y}`).join(" ")}
                  stroke="white"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity="0.85"
                  strokeWidth="3"
                />
              ))}
          </svg>

          {locationLabel ? <div className="absolute left-4 top-4 text-xs text-white/50">{locationLabel}</div> : null}

          {gpsMapUrl ? (
            <>
              <div className="absolute right-4 top-4 flex flex-col items-center gap-2 rounded-[20px] border border-white/10 bg-[#0B0D12]/72 px-2 py-2 backdrop-blur">
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:opacity-40"
                  disabled={mapZoom >= MAX_ZOOM}
                  onClick={() => setMapZoom((current) => Math.min(MAX_ZOOM, current + 1))}
                  type="button"
                >
                  +
                </button>
                <span className="min-w-[44px] text-center text-xs text-white/65">Z{mapZoom}</span>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:opacity-40"
                  disabled={mapZoom <= MIN_ZOOM}
                  onClick={() => setMapZoom((current) => Math.max(MIN_ZOOM, current - 1))}
                  type="button"
                >
                  -
                </button>
              </div>

              <button
                className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0B0D12]/72 text-sm text-white backdrop-blur transition hover:bg-white/10"
                onClick={() =>
                  setMapCenter((current) => ({
                    ...current,
                    longitude: current.longitude - 0.00016 / Math.pow(2, mapZoom - 18)
                  }))
                }
                type="button"
              >
                ←
              </button>
              <button
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0B0D12]/72 text-sm text-white backdrop-blur transition hover:bg-white/10"
                onClick={() =>
                  setMapCenter((current) => ({
                    ...current,
                    longitude: current.longitude + 0.00016 / Math.pow(2, mapZoom - 18)
                  }))
                }
                type="button"
              >
                →
              </button>
              <button
                className="absolute left-1/2 top-2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0B0D12]/72 text-sm text-white backdrop-blur transition hover:bg-white/10"
                onClick={() =>
                  setMapCenter((current) => ({
                    ...current,
                    latitude: current.latitude + 0.00012 / Math.pow(2, mapZoom - 18)
                  }))
                }
                type="button"
              >
                ↑
              </button>
              <button
                className="absolute bottom-2 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0B0D12]/72 text-sm text-white backdrop-blur transition hover:bg-white/10"
                onClick={() =>
                  setMapCenter((current) => ({
                    ...current,
                    latitude: current.latitude - 0.00012 / Math.pow(2, mapZoom - 18)
                  }))
                }
                type="button"
              >
                ↓
              </button>
            </>
          ) : null}
        </div>
      </Card>

      <Card className="space-y-4 border border-white/10">
        {!gpsMapUrl ? (
          <LaneTypeButtons
            onChange={(laneType) =>
              commit({
                ...sceneSketch,
                status: "pending",
                laneType
              })
            }
            readOnly={readOnly}
            value={sceneSketch.laneType}
          />
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Button
            disabled={readOnly || sceneSketch.drawPaths.length === 0}
            onClick={() =>
              commit({
                ...sceneSketch,
                status: "pending",
                drawPaths: sceneSketch.drawPaths.slice(0, -1)
              })
            }
            type="button"
            variant="secondary"
          >
            Obrisi poslednje
          </Button>
          <Button
            disabled={readOnly || sceneSketch.drawPaths.length === 0}
            onClick={() =>
              commit({
                ...sceneSketch,
                status: "pending",
                drawPaths: []
              })
            }
            type="button"
            variant="secondary"
          >
            Reset crteza
          </Button>
        </div>

        <MovementButtons
          onChange={(direction) =>
            commit({
              ...sceneSketch,
              status: "pending",
              vehicleAState: {
                ...sceneSketch.vehicleAState,
                direction
              }
            })
          }
          readOnly={readOnly}
          title="Vozilo A"
          value={sceneSketch.vehicleAState.direction}
        />

        <div className="grid grid-cols-2 gap-3">
          <Button
            disabled={readOnly}
            onClick={() =>
              commit({
                ...sceneSketch,
                status: "pending",
                vehicleAState: {
                  ...sceneSketch.vehicleAState,
                  rotation: sceneSketch.vehicleAState.rotation - 15
                }
              })
            }
            type="button"
            variant="secondary"
          >
            A ulevo
          </Button>
          <Button
            disabled={readOnly}
            onClick={() =>
              commit({
                ...sceneSketch,
                status: "pending",
                vehicleAState: {
                  ...sceneSketch.vehicleAState,
                  rotation: sceneSketch.vehicleAState.rotation + 15
                }
              })
            }
            type="button"
            variant="secondary"
          >
            A udesno
          </Button>
        </div>

        <MovementButtons
          onChange={(direction) =>
            commit({
              ...sceneSketch,
              status: "pending",
              vehicleBState: {
                ...sceneSketch.vehicleBState,
                direction
              }
            })
          }
          readOnly={readOnly}
          title="Vozilo B"
          value={sceneSketch.vehicleBState.direction}
        />

        <div className="grid grid-cols-2 gap-3">
          <Button
            disabled={readOnly}
            onClick={() =>
              commit({
                ...sceneSketch,
                status: "pending",
                vehicleBState: {
                  ...sceneSketch.vehicleBState,
                  rotation: sceneSketch.vehicleBState.rotation - 15
                }
              })
            }
            type="button"
            variant="secondary"
          >
            B ulevo
          </Button>
          <Button
            disabled={readOnly}
            onClick={() =>
              commit({
                ...sceneSketch,
                status: "pending",
                vehicleBState: {
                  ...sceneSketch.vehicleBState,
                  rotation: sceneSketch.vehicleBState.rotation + 15
                }
              })
            }
            type="button"
            variant="secondary"
          >
            B udesno
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <DecorationToggle
            active={sceneSketch.decorations.stop}
            label="STOP"
            onToggle={() =>
              commit({
                ...sceneSketch,
                status: "pending",
                decorations: { ...sceneSketch.decorations, stop: !sceneSketch.decorations.stop }
              })
            }
            readOnly={readOnly}
          />
          <DecorationToggle
            active={sceneSketch.decorations.trafficLight}
            label="Semafor"
            onToggle={() =>
              commit({
                ...sceneSketch,
                status: "pending",
                decorations: {
                  ...sceneSketch.decorations,
                  trafficLight: !sceneSketch.decorations.trafficLight
                }
              })
            }
            readOnly={readOnly}
          />
          <DecorationToggle
            active={sceneSketch.decorations.crosswalk}
            label="Prelaz"
            onToggle={() =>
              commit({
                ...sceneSketch,
                status: "pending",
                decorations: {
                  ...sceneSketch.decorations,
                  crosswalk: !sceneSketch.decorations.crosswalk
                }
              })
            }
            readOnly={readOnly}
          />
          <DecorationToggle
            active={sceneSketch.decorations.priority}
            label="Prvenstvo"
            onToggle={() =>
              commit({
                ...sceneSketch,
                status: "pending",
                decorations: {
                  ...sceneSketch.decorations,
                  priority: !sceneSketch.decorations.priority
                }
              })
            }
            readOnly={readOnly}
          />
          <DecorationToggle
            active={sceneSketch.decorations.parkedVehicle}
            label="Parkirano"
            onToggle={() =>
              commit({
                ...sceneSketch,
                status: "pending",
                decorations: {
                  ...sceneSketch.decorations,
                  parkedVehicle: !sceneSketch.decorations.parkedVehicle
                }
              })
            }
            readOnly={readOnly}
          />
          <DecorationToggle
            active={sceneSketch.decorations.curb}
            label="Ivicnjak"
            onToggle={() =>
              commit({
                ...sceneSketch,
                status: "pending",
                decorations: { ...sceneSketch.decorations, curb: !sceneSketch.decorations.curb }
              })
            }
            readOnly={readOnly}
          />
          {!gpsMapUrl ? (
            <DecorationToggle
              active={sceneSketch.decorations.centerLine}
              label="Razdelna linija"
              onToggle={() =>
                commit({
                  ...sceneSketch,
                  status: "pending",
                  decorations: {
                    ...sceneSketch.decorations,
                    centerLine: !sceneSketch.decorations.centerLine
                  }
                })
              }
              readOnly={readOnly}
            />
          ) : null}
        </div>
      </Card>

      <Card className="space-y-4 border border-accent/20 bg-accent/8">
        <img alt="Pregled skice" className="w-full rounded-[24px] bg-[#0B0D12]" src={sketchPreview} />
        <Button
          disabled={readOnly}
          onClick={async () => {
            const next = {
              ...sceneSketch,
              status: "confirmed" as const,
              mapZoom,
              mapCenterLatitude: mapCenter.latitude,
              mapCenterLongitude: mapCenter.longitude,
              confirmedAt: nowIso(),
              summary: hasGps ? "Potvrdjena skica sa GPS podlogom." : "Potvrdjena skica."
            };
            const dataUrl = await buildFinalSketchDataUrl(next);
            onSaveSketchImage(dataUrl);
            onChange({
              ...next,
              svgDataUrl: dataUrl
            });
          }}
          type="button"
        >
          Potvrdi skicu
        </Button>
      </Card>
    </div>
  );
}
