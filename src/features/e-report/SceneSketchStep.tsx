import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { renderSceneSketchDataUrl } from "../../lib/photoAssist";
import { createId, nowIso } from "../../lib/utils";
import type { SceneSketchSuggestion } from "../../types";

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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

function directionGlyph(direction: SceneSketchSuggestion["vehicleAState"]["direction"]) {
  if (direction === "left") {
    return "↰";
  }
  if (direction === "right") {
    return "↱";
  }
  if (direction === "parking") {
    return "⊔";
  }
  if (direction === "merge") {
    return "⇢";
  }
  return "↑";
}

function DirectionButtons({
  title,
  value,
  onChange,
  readOnly = false
}: {
  title: string;
  value: SceneSketchSuggestion["vehicleAState"]["direction"];
  onChange: (value: SceneSketchSuggestion["vehicleAState"]["direction"]) => void;
  readOnly?: boolean;
}) {
  const options: Array<SceneSketchSuggestion["vehicleAState"]["direction"]> = [
    "straight",
    "left",
    "right",
    "parking",
    "merge"
  ];

  return (
    <div className="space-y-2">
      <div className="text-sm text-white/60">{title}</div>
      <div className="grid grid-cols-5 gap-2">
        {options.map((option) => (
          <button
            key={option}
            className={`rounded-[16px] border px-2 py-3 text-sm transition ${
              value === option
                ? "border-accent/45 bg-accent/18 text-white"
                : "border-white/10 bg-white/5 text-white/65"
            }`}
            disabled={readOnly}
            onClick={() => onChange(option)}
            type="button"
          >
            {directionGlyph(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

function movementGlyph(direction: SceneSketchSuggestion["vehicleAState"]["direction"]) {
  switch (direction) {
    case "backward":
    case "parking":
      return "\u2193";
    case "left":
      return "\u2190";
    case "right":
      return "\u2192";
    case "uturn":
    case "merge":
      return "U";
    default:
      return "\u2191";
  }
}

function MovementButtons({
  title,
  value,
  onChange,
  readOnly = false
}: {
  title: string;
  value: SceneSketchSuggestion["vehicleAState"]["direction"];
  onChange: (value: SceneSketchSuggestion["vehicleAState"]["direction"]) => void;
  readOnly?: boolean;
}) {
  const options: Array<{
    label: string;
    value: SceneSketchSuggestion["vehicleAState"]["direction"];
  }> = [
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
                : "border-white/10 bg-white/5 text-white/65"
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

function LaneTypeButtons({
  value,
  onChange,
  readOnly = false
}: {
  value: SceneSketchSuggestion["laneType"];
  onChange: (value: SceneSketchSuggestion["laneType"]) => void;
  readOnly?: boolean;
}) {
  const options: Array<{
    label: string;
    value: SceneSketchSuggestion["laneType"];
  }> = [
    { label: "Pravac", value: "straight" },
    { label: "Raskrsnica", value: "intersection" },
    { label: "Parking", value: "parking" },
    { label: "Kruzni tok", value: "roundabout" }
  ];

  return (
    <div className="space-y-2">
      <span className="text-sm text-white/60">Podloga puta</span>
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
    </div>
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

    const lngSpan = 0.012 / Math.pow(2, mapZoom - 14);
    const latSpan = lngSpan * 0.94;

    return `https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.longitude - lngSpan}%2C${mapCenter.latitude - latSpan}%2C${mapCenter.longitude + lngSpan}%2C${mapCenter.latitude + latSpan}&layer=mapnik&marker=${mapCenter.latitude}%2C${mapCenter.longitude}`;
  }, [mapCenter.latitude, mapCenter.longitude, mapZoom]);

  useEffect(() => {
    setMapZoom(sceneSketch.mapZoom ?? 20);
  }, [sceneSketch.mapZoom]);

  useEffect(() => {
    setMapCenter({
      latitude: sceneSketch.mapCenterLatitude ?? latitude ?? 0,
      longitude: sceneSketch.mapCenterLongitude ?? longitude ?? 0
    });
  }, [
    latitude,
    longitude,
    sceneSketch.mapCenterLatitude,
    sceneSketch.mapCenterLongitude
  ]);

  const commit = (next: SceneSketchSuggestion) => {
    onChange({
      ...next,
      mapZoom,
      mapCenterLatitude: mapCenter.latitude,
      mapCenterLongitude: mapCenter.longitude,
      svgDataUrl: renderSceneSketchDataUrl(next, locationLabel)
    });
  };

  const buildFinalSketchDataUrl = async (next: SceneSketchSuggestion) => {
    if (!gpsMapUrl || !mapCenter.latitude || !mapCenter.longitude) {
      return renderSceneSketchDataUrl(next, locationLabel);
    }

    try {
      const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${mapCenter.latitude},${mapCenter.longitude}&zoom=${mapZoom}&size=720x680&maptype=mapnik`;
      const mapImage = await loadImage(staticMapUrl);
      const canvas = document.createElement("canvas");
      canvas.width = 720;
      canvas.height = 680;
      const context = canvas.getContext("2d");

      if (!context) {
        return renderSceneSketchDataUrl(next, locationLabel);
      }

      context.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(11,13,18,0.12)";
      context.fillRect(0, 0, canvas.width, canvas.height);

      const scaleX = canvas.width / 360;
      const scaleY = canvas.height / 340;
      const drawVehicle = (
        label: "A" | "B",
        color: string,
        arrowColor: string,
        state: SceneSketchSuggestion["vehicleAState"]
      ) => {
        context.save();
        context.translate(state.x * scaleX, state.y * scaleY);
        context.rotate((state.rotation * Math.PI) / 180);
        context.fillStyle = color;
        context.beginPath();
        context.roundRect(-18 * scaleX, -34 * scaleY, 36 * scaleX, 68 * scaleY, 16 * scaleX);
        context.fill();
        context.fillStyle = "rgba(255,255,255,0.2)";
        context.beginPath();
        context.roundRect(-12 * scaleX, -22 * scaleY, 24 * scaleX, 26 * scaleY, 9 * scaleX);
        context.fill();
        context.restore();

        context.fillStyle = "#FFFFFF";
        context.font = `700 ${16 * scaleX}px Arial`;
        context.textAlign = "center";
        context.fillText(label, state.x * scaleX, state.y * scaleY + 52 * scaleY);

        context.strokeStyle = arrowColor;
        context.lineWidth = 4 * scaleX;
        context.lineCap = "round";
        context.beginPath();
        const arrowX = state.x * scaleX;
        const arrowY = (state.y - 44) * scaleY;
        if (state.direction === "backward" || state.direction === "parking") {
          context.moveTo(arrowX, arrowY);
          context.lineTo(arrowX, arrowY + 42 * scaleY);
        } else if (state.direction === "left") {
          context.moveTo(arrowX, arrowY);
          context.bezierCurveTo(
            arrowX - 16 * scaleX,
            arrowY - 6 * scaleY,
            arrowX - 24 * scaleX,
            arrowY - 24 * scaleY,
            arrowX - 18 * scaleX,
            arrowY - 40 * scaleY
          );
        } else if (state.direction === "right") {
          context.moveTo(arrowX, arrowY);
          context.bezierCurveTo(
            arrowX + 16 * scaleX,
            arrowY - 6 * scaleY,
            arrowX + 24 * scaleX,
            arrowY - 24 * scaleY,
            arrowX + 18 * scaleX,
            arrowY - 40 * scaleY
          );
        } else if (state.direction === "uturn" || state.direction === "merge") {
          context.moveTo(arrowX, arrowY);
          context.bezierCurveTo(
            arrowX + 24 * scaleX,
            arrowY - 10 * scaleY,
            arrowX + 28 * scaleX,
            arrowY - 46 * scaleY,
            arrowX,
            arrowY - 54 * scaleY
          );
          context.bezierCurveTo(
            arrowX - 20 * scaleX,
            arrowY - 54 * scaleY,
            arrowX - 22 * scaleX,
            arrowY - 34 * scaleY,
            arrowX - 8 * scaleX,
            arrowY - 24 * scaleY
          );
        } else {
          context.moveTo(arrowX, arrowY);
          context.lineTo(arrowX, arrowY - 42 * scaleY);
        }
        context.stroke();
      };

      drawVehicle("A", "#FF5A5F", "#FF9A9D", next.vehicleAState);
      drawVehicle("B", "#2F80FF", "#7CB2FF", next.vehicleBState);

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

      context.fillStyle = "rgba(255,255,255,0.72)";
      context.font = `24px Arial`;
      context.textAlign = "left";
      context.fillText(locationLabel || "Skica nezgode", 20, 28);

      return canvas.toDataURL("image/png");
    } catch {
      return renderSceneSketchDataUrl(next, locationLabel);
    }
  };

  const pointFromEvent = (event: PointerEvent | React.PointerEvent<HTMLDivElement>) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 360, 24, 336),
      y: clamp(((event.clientY - rect.top) / rect.height) * 340, 24, 316)
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
  }, [commit, dragTarget, drawMode, drawingPathId, pointFromEvent, sceneSketch]);

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
            {drawMode ? "Crtanje ukljuceno" : "Crtaj rucno"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <div
            ref={boardRef}
            className="relative mx-auto h-[340px] w-[360px] overflow-hidden rounded-[28px] border border-white/10 bg-[#0B0D12]"
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
                  className="pointer-events-none absolute inset-0 h-full w-full border-0 opacity-85"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={gpsMapUrl}
                  title="GPS podloga skice nezgode"
                />
                <div className="absolute inset-0 bg-[#0B0D12]/12" />
              </>
            ) : null}
            <div className="absolute inset-0">
              {!gpsMapUrl && sceneSketch.laneType === "intersection" ? (
                <>
                  <div className="absolute left-[132px] top-0 h-full w-24 rounded-[18px] bg-slate-800/95" />
                  <div className="absolute left-0 top-[122px] h-24 w-full rounded-[18px] bg-slate-800/95" />
                </>
              ) : !gpsMapUrl && sceneSketch.laneType === "parking" ? (
                <>
                  <div className="absolute left-[132px] top-0 h-full w-24 rounded-[18px] bg-slate-800/95" />
                  {[52, 102, 152, 202, 252].map((top) => (
                    <div
                      key={top}
                      className="absolute left-[84px] h-px w-12 bg-slate-300/45"
                      style={{ top }}
                    />
                  ))}
                </>
              ) : !gpsMapUrl && sceneSketch.laneType === "roundabout" ? (
                <>
                  <div className="absolute left-[96px] top-[86px] h-[168px] w-[168px] rounded-full bg-slate-800/95" />
                  <div className="absolute left-[116px] top-[106px] h-[128px] w-[128px] rounded-full border-2 border-dashed border-white/30" />
                  <div className="absolute left-[144px] top-[134px] h-[72px] w-[72px] rounded-full bg-[#0B0D12]" />
                </>
              ) : !gpsMapUrl ? (
                <div className="absolute left-[132px] top-0 h-full w-24 rounded-[18px] bg-slate-800/95" />
              ) : null}

              {!gpsMapUrl && sceneSketch.decorations.centerLine ? (
                sceneSketch.laneType === "intersection" ? (
                  <>
                    <div className="absolute left-[178px] top-0 h-full w-1 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.35)_0_50%,transparent_50%_100%)] bg-[length:4px_18px]" />
                    <div className="absolute left-0 top-[168px] h-1 w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.35)_0_50%,transparent_50%_100%)] bg-[length:18px_4px]" />
                  </>
                ) : (
                  <div className="absolute left-[178px] top-0 h-full w-1 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.35)_0_50%,transparent_50%_100%)] bg-[length:4px_18px]" />
                )
              ) : null}

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
            </div>

            <button
              className="absolute h-16 w-10 -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-[#FF5A5F] text-sm font-semibold text-white shadow-lg"
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
                top: sceneSketch.vehicleAState.y - 52,
                transform: "translate(-50%, -50%)"
              }}
            >
              {movementGlyph(sceneSketch.vehicleAState.direction)}
            </div>

            <button
              className="absolute h-16 w-10 -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-[#2F80FF] text-sm font-semibold text-white shadow-lg"
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
                top: sceneSketch.vehicleBState.y - 52,
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
              ×
            </button>

            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 360 340">
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

            <div className="absolute left-4 top-4 text-xs text-white/45">
              {locationLabel || "Top-down skica bez GPS mape"}
            </div>
            {gpsMapUrl ? (
              <div className="absolute right-4 top-4 space-y-2 rounded-[20px] border border-white/10 bg-[#0B0D12]/72 px-2 py-2 backdrop-blur">
                <div className="flex items-center justify-center gap-2">
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:opacity-40"
                    disabled={mapZoom <= 16}
                    onClick={() => setMapZoom((current) => Math.max(16, current - 1))}
                    type="button"
                  >
                    -
                  </button>
                  <span className="min-w-[44px] text-center text-xs text-white/65">Z{mapZoom}</span>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-white transition hover:bg-white/10 disabled:opacity-40"
                    disabled={mapZoom >= 22}
                    onClick={() => setMapZoom((current) => Math.min(22, current + 1))}
                    type="button"
                  >
                    +
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span />
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-white transition hover:bg-white/10"
                    onClick={() =>
                      setMapCenter((current) => ({
                        ...current,
                        latitude: current.latitude + 0.00008 / Math.pow(2, mapZoom - 18)
                      }))
                    }
                    type="button"
                  >
                    ↑
                  </button>
                  <span />
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-white transition hover:bg-white/10"
                    onClick={() =>
                      setMapCenter((current) => ({
                        ...current,
                        longitude: current.longitude - 0.00012 / Math.pow(2, mapZoom - 18)
                      }))
                    }
                    type="button"
                  >
                    ←
                  </button>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] text-white/80 transition hover:bg-white/10"
                    onClick={() =>
                      setMapCenter({
                        latitude: sceneSketch.mapCenterLatitude ?? latitude ?? 0,
                        longitude: sceneSketch.mapCenterLongitude ?? longitude ?? 0
                      })
                    }
                    type="button"
                  >
                    GPS
                  </button>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-white transition hover:bg-white/10"
                    onClick={() =>
                      setMapCenter((current) => ({
                        ...current,
                        longitude: current.longitude + 0.00012 / Math.pow(2, mapZoom - 18)
                      }))
                    }
                    type="button"
                  >
                    →
                  </button>
                  <span />
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-white transition hover:bg-white/10"
                    onClick={() =>
                      setMapCenter((current) => ({
                        ...current,
                        latitude: current.latitude - 0.00008 / Math.pow(2, mapZoom - 18)
                      }))
                    }
                    type="button"
                  >
                    ↓
                  </button>
                  <span />
                </div>
              </div>
            ) : null}
          </div>
        </div>

      </Card>

      <Card className="space-y-4 border border-white/10">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {gpsMapUrl ? (
            <div className="rounded-[18px] border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-sm text-white/75">
              GPS podloga
            </div>
          ) : (
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
          )}
          <div className="space-y-2">
            <span className="text-sm text-white/60">Rucno crtanje</span>
            <div className="grid grid-cols-2 gap-2">
              <Button disabled={readOnly || sceneSketch.drawPaths.length === 0} onClick={() => commit({ ...sceneSketch, status: "pending", drawPaths: sceneSketch.drawPaths.slice(0, -1) })} type="button" variant="secondary">
                Obrisi poslednje
              </Button>
              <Button disabled={readOnly || sceneSketch.drawPaths.length === 0} onClick={() => commit({ ...sceneSketch, status: "pending", drawPaths: [] })} type="button" variant="secondary">
                Reset crteza
              </Button>
            </div>
          </div>
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
          title="Smer vozila A"
          value={sceneSketch.vehicleAState.direction}
        />

        <div className="grid grid-cols-2 gap-3">
          <Button disabled={readOnly} onClick={() => commit({ ...sceneSketch, status: "pending", vehicleAState: { ...sceneSketch.vehicleAState, rotation: sceneSketch.vehicleAState.rotation - 15 } })} type="button" variant="secondary">
            Rotiraj A -
          </Button>
          <Button disabled={readOnly} onClick={() => commit({ ...sceneSketch, status: "pending", vehicleAState: { ...sceneSketch.vehicleAState, rotation: sceneSketch.vehicleAState.rotation + 15 } })} type="button" variant="secondary">
            Rotiraj A +
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
          title="Smer vozila B"
          value={sceneSketch.vehicleBState.direction}
        />

        <div className="grid grid-cols-2 gap-3">
          <Button disabled={readOnly} onClick={() => commit({ ...sceneSketch, status: "pending", vehicleBState: { ...sceneSketch.vehicleBState, rotation: sceneSketch.vehicleBState.rotation - 15 } })} type="button" variant="secondary">
            Rotiraj B -
          </Button>
          <Button disabled={readOnly} onClick={() => commit({ ...sceneSketch, status: "pending", vehicleBState: { ...sceneSketch.vehicleBState, rotation: sceneSketch.vehicleBState.rotation + 15 } })} type="button" variant="secondary">
            Rotiraj B +
          </Button>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-white/60">Dodatni elementi skice</div>
          <div className="flex flex-wrap gap-2">
            <DecorationToggle active={sceneSketch.decorations.stop} label="STOP" onToggle={() => commit({ ...sceneSketch, status: "pending", decorations: { ...sceneSketch.decorations, stop: !sceneSketch.decorations.stop } })} readOnly={readOnly} />
            <DecorationToggle active={sceneSketch.decorations.trafficLight} label="Semafor" onToggle={() => commit({ ...sceneSketch, status: "pending", decorations: { ...sceneSketch.decorations, trafficLight: !sceneSketch.decorations.trafficLight } })} readOnly={readOnly} />
            <DecorationToggle active={sceneSketch.decorations.crosswalk} label="Pesacki prelaz" onToggle={() => commit({ ...sceneSketch, status: "pending", decorations: { ...sceneSketch.decorations, crosswalk: !sceneSketch.decorations.crosswalk } })} readOnly={readOnly} />
            <DecorationToggle active={sceneSketch.decorations.priority} label="Prvenstvo" onToggle={() => commit({ ...sceneSketch, status: "pending", decorations: { ...sceneSketch.decorations, priority: !sceneSketch.decorations.priority } })} readOnly={readOnly} />
            <DecorationToggle active={sceneSketch.decorations.parkedVehicle} label="Parkirano vozilo" onToggle={() => commit({ ...sceneSketch, status: "pending", decorations: { ...sceneSketch.decorations, parkedVehicle: !sceneSketch.decorations.parkedVehicle } })} readOnly={readOnly} />
            <DecorationToggle active={sceneSketch.decorations.curb} label="Ivicnjak" onToggle={() => commit({ ...sceneSketch, status: "pending", decorations: { ...sceneSketch.decorations, curb: !sceneSketch.decorations.curb } })} readOnly={readOnly} />
            <DecorationToggle active={sceneSketch.decorations.centerLine} label="Razdelna linija" onToggle={() => commit({ ...sceneSketch, status: "pending", decorations: { ...sceneSketch.decorations, centerLine: !sceneSketch.decorations.centerLine } })} readOnly={readOnly} />
          </div>
        </div>
      </Card>

      <Card className="space-y-4 border border-accent/20 bg-accent/8">
        <div className="text-xs uppercase tracking-[0.26em] text-accent">Finalna skica</div>
        {gpsMapUrl ? (
          <div className="overflow-x-auto">
            <div className="relative mx-auto h-[340px] w-[360px] overflow-hidden rounded-[24px] border border-white/10 bg-[#0B0D12]">
              <iframe
                className="pointer-events-none absolute inset-0 h-full w-full border-0 opacity-85"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={gpsMapUrl}
                title="Finalni pregled GPS skice"
              />
              <div className="absolute inset-0 bg-[#0B0D12]/12" />

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

              <div
                className="absolute h-16 w-10 -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-[#FF5A5F] text-sm font-semibold text-white shadow-lg"
                style={{
                  left: sceneSketch.vehicleAState.x,
                  top: sceneSketch.vehicleAState.y,
                  transform: `translate(-50%, -50%) rotate(${sceneSketch.vehicleAState.rotation}deg)`
                }}
              >
                <div className="flex h-full w-full items-center justify-center">A</div>
              </div>
              <div
                className="pointer-events-none absolute text-xl text-red-200"
                style={{
                  left: sceneSketch.vehicleAState.x,
                  top: sceneSketch.vehicleAState.y - 52,
                  transform: "translate(-50%, -50%)"
                }}
              >
                {movementGlyph(sceneSketch.vehicleAState.direction)}
              </div>

              <div
                className="absolute h-16 w-10 -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-[#2F80FF] text-sm font-semibold text-white shadow-lg"
                style={{
                  left: sceneSketch.vehicleBState.x,
                  top: sceneSketch.vehicleBState.y,
                  transform: `translate(-50%, -50%) rotate(${sceneSketch.vehicleBState.rotation}deg)`
                }}
              >
                <div className="flex h-full w-full items-center justify-center">B</div>
              </div>
              <div
                className="pointer-events-none absolute text-xl text-blue-200"
                style={{
                  left: sceneSketch.vehicleBState.x,
                  top: sceneSketch.vehicleBState.y - 52,
                  transform: "translate(-50%, -50%)"
                }}
              >
                {movementGlyph(sceneSketch.vehicleBState.direction)}
              </div>

              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-yellow-300"
                style={{
                  left: sceneSketch.impactPoint.x,
                  top: sceneSketch.impactPoint.y
                }}
              >
                X
              </div>

              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 360 340">
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

              <div className="absolute left-4 top-4 text-xs text-white/55">
                {locationLabel || "Skica nezgode"}
              </div>
            </div>
          </div>
        ) : (
          <img alt="Pregled skice" className="w-full rounded-[24px] bg-[#0B0D12]" src={sketchPreview} />
        )}
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
              summary: hasGps
                ? "Rucno potvrdjena skica sa GPS podlogom."
                : "Rucno potvrdjena skica bez GPS podloge."
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
