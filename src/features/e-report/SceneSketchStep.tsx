import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { createId, nowIso } from "../../lib/utils";
import type { SceneSketchSuggestion } from "../../types";

const BOARD_SIZE = 720;
const MIN_ZOOM = 17;
const MAX_ZOOM = 23;

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
type SketchDirection = SceneSketchSuggestion["vehicleAState"]["direction"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cloneSketch(sketch: SceneSketchSuggestion): SceneSketchSuggestion {
  return {
    ...sketch,
    vehicleAState: { ...sketch.vehicleAState },
    vehicleBState: { ...sketch.vehicleBState },
    impactPoint: { ...sketch.impactPoint },
    decorations: { ...sketch.decorations },
    drawPaths: sketch.drawPaths.map((path) => ({
      ...path,
      points: path.points.map((point) => ({ ...point }))
    }))
  };
}

function getMapSpan(zoom: number) {
  const lngSpan = 0.012 / Math.pow(2, zoom - 14);
  const latSpan = lngSpan * 0.94;

  return { lngSpan, latSpan };
}

function longitudeToTile(longitude: number, zoom: number) {
  return ((longitude + 180) / 360) * Math.pow(2, zoom);
}

function latitudeToTile(latitude: number, zoom: number) {
  const radians = (latitude * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  );
}

function getTileUrl(zoom: number, x: number, y: number) {
  const subdomain = ["a", "b", "c"][(x + y) % 3];
  return `https://${subdomain}.tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Neuspesno ucitavanje slike."));
    image.src = src;
  });
}

async function fetchMapDataUrl(latitude: number, longitude: number, zoom: number) {
  const tileSize = 256;
  const boardPixels = BOARD_SIZE;
  const scale = boardPixels / 360;
  const n = Math.pow(2, zoom);
  const tileX = longitudeToTile(longitude, zoom);
  const tileY = latitudeToTile(latitude, zoom);
  const centerPixelX = tileX * tileSize;
  const centerPixelY = tileY * tileSize;
  const half = boardPixels / 2;
  const minTileX = Math.floor((centerPixelX - half) / tileSize) - 1;
  const maxTileX = Math.floor((centerPixelX + half) / tileSize) + 1;
  const minTileY = Math.floor((centerPixelY - half) / tileSize) - 1;
  const maxTileY = Math.floor((centerPixelY + half) / tileSize) + 1;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(boardPixels * scale);
  canvas.height = Math.round(boardPixels * scale);
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas nije dostupan za pripremu GPS podloge.");
  }

  context.fillStyle = "#101722";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const drawTasks: Array<Promise<boolean>> = [];

  for (let x = minTileX; x <= maxTileX; x += 1) {
    for (let y = minTileY; y <= maxTileY; y += 1) {
      if (y < 0 || y >= n) {
        continue;
      }

      const wrappedX = ((x % n) + n) % n;
      const destX = (x * tileSize - (centerPixelX - half)) * scale;
      const destY = (y * tileSize - (centerPixelY - half)) * scale;

      drawTasks.push(
        loadImage(getTileUrl(zoom, wrappedX, y)).then((image) => {
          context.drawImage(
            image,
            Math.round(destX),
            Math.round(destY),
            Math.ceil(tileSize * scale) + 1,
            Math.ceil(tileSize * scale) + 1
          );
          return true;
        }).catch(() => false)
      );
    }
  }

  const drawnTiles = await Promise.all(drawTasks);
  if (!drawnTiles.some(Boolean)) {
    throw new Error("GPS podloga trenutno nije dostupna.");
  }

  return canvas.toDataURL("image/png");
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawFallbackMap(context: CanvasRenderingContext2D, sketch: SceneSketchSuggestion) {
  context.fillStyle = "#0F1725";
  context.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

  context.fillStyle = "#172234";
  context.strokeStyle = "rgba(143,166,199,0.18)";
  context.lineWidth = 2;

  if (sketch.laneType === "intersection") {
    drawRoundedRect(context, 90, 0, 180, BOARD_SIZE, 36);
    context.fill();
    drawRoundedRect(context, 0, 250, BOARD_SIZE, 180, 36);
    context.fill();
  } else if (sketch.laneType === "parking") {
    drawRoundedRect(context, 110, 0, 140, BOARD_SIZE, 32);
    context.fill();
    context.strokeStyle = "rgba(255,255,255,0.24)";
    for (let index = 0; index < 5; index += 1) {
      context.beginPath();
      context.moveTo(24, 120 + index * 96);
      context.lineTo(110, 120 + index * 96);
      context.stroke();
    }
  } else if (sketch.laneType === "roundabout") {
    context.beginPath();
    context.arc(360, 360, 220, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(255,255,255,0.22)";
    context.setLineDash([18, 12]);
    context.beginPath();
    context.arc(360, 360, 150, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
  } else {
    drawRoundedRect(context, 250, 0, 220, BOARD_SIZE, 36);
    context.fill();
  }

  if (sketch.decorations.centerLine) {
    context.strokeStyle = "rgba(255,255,255,0.28)";
    context.lineWidth = 4;
    context.setLineDash([20, 12]);
    context.beginPath();
    context.moveTo(360, 20);
    context.lineTo(360, BOARD_SIZE - 20);
    context.stroke();
    context.setLineDash([]);
  }
}

function directionGlyph(direction: SketchDirection) {
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

function drawDirectionArrow(
  context: CanvasRenderingContext2D,
  state: SceneSketchSuggestion["vehicleAState"],
  color: string
) {
  const x = state.x * 2;
  const y = state.y * 2;
  const startY = y - 72;

  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 8;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();

  switch (state.direction) {
    case "backward":
    case "parking":
      context.moveTo(x, startY);
      context.lineTo(x, startY + 78);
      break;
    case "left":
      context.moveTo(x, startY + 34);
      context.bezierCurveTo(x - 26, startY + 26, x - 48, startY, x - 54, startY - 24);
      break;
    case "right":
      context.moveTo(x, startY + 34);
      context.bezierCurveTo(x + 26, startY + 26, x + 48, startY, x + 54, startY - 24);
      break;
    case "uturn":
    case "merge":
      context.moveTo(x, startY + 44);
      context.bezierCurveTo(x + 40, startY + 28, x + 48, startY - 32, x, startY - 50);
      context.bezierCurveTo(x - 32, startY - 50, x - 36, startY - 14, x - 12, startY + 4);
      break;
    default:
      context.moveTo(x, startY + 76);
      context.lineTo(x, startY);
      break;
  }

  context.stroke();

  const headX =
    state.direction === "left"
      ? x - 54
      : state.direction === "right"
        ? x + 54
        : state.direction === "uturn" || state.direction === "merge"
          ? x - 12
          : x;
  const headY =
    state.direction === "backward" || state.direction === "parking"
      ? startY + 78
      : state.direction === "left" || state.direction === "right"
        ? startY - 24
        : state.direction === "uturn" || state.direction === "merge"
          ? startY + 4
          : startY;

  context.beginPath();
  context.moveTo(headX, headY);
  context.lineTo(headX - 10, headY + 18);
  context.lineTo(headX + 10, headY + 18);
  context.closePath();
  context.fill();
  context.restore();
}

function drawVehicle(
  context: CanvasRenderingContext2D,
  label: "A" | "B",
  state: SceneSketchSuggestion["vehicleAState"],
  bodyColor: string,
  arrowColor: string
) {
  const x = state.x * 2;
  const y = state.y * 2;

  context.save();
  context.translate(x, y);
  context.rotate((state.rotation * Math.PI) / 180);
  context.fillStyle = bodyColor;
  drawRoundedRect(context, -26, -48, 52, 96, 24);
  context.fill();
  context.fillStyle = "rgba(255,255,255,0.18)";
  drawRoundedRect(context, -16, -28, 32, 42, 12);
  context.fill();
  context.fillStyle = "rgba(255,255,255,0.16)";
  drawRoundedRect(context, -18, -42, 36, 14, 8);
  context.fill();
  context.restore();

  context.save();
  context.fillStyle = "#FFFFFF";
  context.font = "700 28px Arial";
  context.textAlign = "center";
  context.fillText(label, x, y + 74);
  context.restore();

  drawDirectionArrow(context, state, arrowColor);
}

function drawDecorations(context: CanvasRenderingContext2D, sketch: SceneSketchSuggestion) {
  context.save();

  if (sketch.decorations.stop) {
    context.fillStyle = "#D24949";
    context.beginPath();
    context.arc(118, 100, 22, 0, Math.PI * 2);
    context.fill();
  }

  if (sketch.decorations.trafficLight) {
    context.fillStyle = "rgba(0,0,0,0.7)";
    drawRoundedRect(context, 580, 90, 28, 70, 14);
    context.fill();
  }

  if (sketch.decorations.crosswalk) {
    context.fillStyle = "rgba(255,255,255,0.7)";
    for (let index = 0; index < 6; index += 1) {
      context.fillRect(246 + index * 18, 430, 8, 36);
    }
  }

  if (sketch.decorations.priority) {
    context.translate(126, 540);
    context.rotate(Math.PI / 4);
    context.fillStyle = "#F1C64C";
    context.fillRect(-14, -14, 28, 28);
    context.setTransform(1, 0, 0, 1, 0, 0);
  }

  if (sketch.decorations.parkedVehicle) {
    context.fillStyle = "#7B88A0";
    drawRoundedRect(context, 84, 316, 36, 90, 18);
    context.fill();
  }

  if (sketch.decorations.curb) {
    context.strokeStyle = "rgba(220,228,240,0.75)";
    context.lineWidth = 8;
    context.beginPath();
    context.moveTo(42, 636);
    context.lineTo(678, 636);
    context.stroke();
  }

  context.restore();
}

async function renderSketchDataUrl(
  sketch: SceneSketchSuggestion,
  locationLabel: string | null,
  mapDataUrl: string | null
) {
  const canvas = document.createElement("canvas");
  canvas.width = BOARD_SIZE;
  canvas.height = BOARD_SIZE;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas nije dostupan za skicu.");
  }

  context.fillStyle = "#0B0D12";
  context.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

  if (mapDataUrl) {
    const mapImage = await loadImage(mapDataUrl);
    context.drawImage(mapImage, 0, 0, BOARD_SIZE, BOARD_SIZE);
    context.fillStyle = "rgba(11,13,18,0.34)";
    context.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);
  } else {
    drawFallbackMap(context, sketch);
  }

  drawDecorations(context, sketch);

  context.save();
  context.strokeStyle = "#F7FAFF";
  context.lineWidth = 5;
  context.lineCap = "round";
  context.lineJoin = "round";
  sketch.drawPaths.forEach((path) => {
    if (path.points.length < 2) {
      return;
    }
    context.beginPath();
    context.moveTo(path.points[0].x * 2, path.points[0].y * 2);
    path.points.slice(1).forEach((point) => {
      context.lineTo(point.x * 2, point.y * 2);
    });
    context.stroke();
  });
  context.restore();

  drawVehicle(context, "A", sketch.vehicleAState, "#FF5A5F", "#FF9EA3");
  drawVehicle(context, "B", sketch.vehicleBState, "#3D82F6", "#8DB7FF");

  context.save();
  context.strokeStyle = "#F7CC45";
  context.lineWidth = 8;
  context.beginPath();
  context.moveTo(sketch.impactPoint.x * 2 - 20, sketch.impactPoint.y * 2 - 20);
  context.lineTo(sketch.impactPoint.x * 2 + 20, sketch.impactPoint.y * 2 + 20);
  context.moveTo(sketch.impactPoint.x * 2 + 20, sketch.impactPoint.y * 2 - 20);
  context.lineTo(sketch.impactPoint.x * 2 - 20, sketch.impactPoint.y * 2 + 20);
  context.stroke();
  context.restore();

  if (locationLabel) {
    context.save();
    context.fillStyle = "rgba(255,255,255,0.85)";
    context.font = "500 22px Arial";
    context.fillText(locationLabel, 22, 34);
    context.restore();
  }

  return canvas.toDataURL("image/png");
}

function VehicleMarker({
  color,
  label,
  state,
  onPointerDown
}: {
  color: string;
  label: "A" | "B";
  state: SceneSketchSuggestion["vehicleAState"];
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <>
      <button
        className="absolute h-[52px] w-[32px] -translate-x-1/2 -translate-y-1/2 rounded-[14px] border border-white/15 shadow-[0_12px_24px_rgba(0,0,0,0.28)]"
        onPointerDown={onPointerDown}
        style={{
          left: state.x,
          top: state.y,
          transform: `translate(-50%, -50%) rotate(${state.rotation}deg)`,
          background: color
        }}
        type="button"
      >
        <span className="absolute inset-x-[6px] top-[6px] h-[16px] rounded-[8px] bg-white/20" />
      </button>
      <div
        className="pointer-events-none absolute -translate-x-1/2 rounded-full bg-black/35 px-2 py-1 text-sm font-semibold text-white"
        style={{ left: state.x, top: state.y + 42 }}
      >
        {label}
      </div>
      <div
        className="pointer-events-none absolute -translate-x-1/2 text-[26px] font-bold"
        style={{ left: state.x, top: state.y - 52, color: label === "A" ? "#FF9EA3" : "#8DB7FF" }}
      >
        {directionGlyph(state.direction)}
      </div>
    </>
  );
}

function DirectionPicker({
  label,
  value,
  onChange,
  readOnly
}: {
  label: string;
  value: SketchDirection;
  onChange: (direction: SketchDirection) => void;
  readOnly: boolean;
}) {
  const options: Array<{ glyph: string; label: string; value: SketchDirection }> = [
    { glyph: "↑", label: "Napred", value: "forward" },
    { glyph: "↓", label: "Nazad", value: "backward" },
    { glyph: "←", label: "Levo", value: "left" },
    { glyph: "→", label: "Desno", value: "right" },
    { glyph: "U", label: "Polukruzno", value: "uturn" }
  ];

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-white/75">{label}</div>
      <div className="grid grid-cols-5 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            className={`rounded-[18px] border px-2 py-3 text-center transition ${
              value === option.value
                ? "border-accent/50 bg-accent/16 text-white"
                : "border-white/10 bg-white/5 text-white/72"
            }`}
            disabled={readOnly}
            onClick={() => onChange(option.value)}
            type="button"
          >
            <div className="text-lg font-semibold">{option.glyph}</div>
            <div className="mt-1 text-[11px] leading-none">{option.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DecorationChip({
  active,
  label,
  onClick,
  readOnly
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  readOnly: boolean;
}) {
  return (
    <button
      className={`rounded-full border px-3 py-2 text-sm transition ${
        active ? "border-accent/50 bg-accent/16 text-white" : "border-white/10 bg-white/5 text-white/68"
      }`}
      disabled={readOnly}
      onClick={onClick}
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
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorSketch, setEditorSketch] = useState(() => cloneSketch(sceneSketch));
  const [drawMode, setDrawMode] = useState(false);
  const [drawingPathId, setDrawingPathId] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [mapZoom, setMapZoom] = useState(sceneSketch.mapZoom ?? 20);
  const [mapCenter, setMapCenter] = useState({
    latitude: sceneSketch.mapCenterLatitude ?? latitude ?? 0,
    longitude: sceneSketch.mapCenterLongitude ?? longitude ?? 0
  });
  const [mapImageDataUrl, setMapImageDataUrl] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const previewImage = sceneSketch.svgDataUrl;

  useEffect(() => {
    setEditorSketch(cloneSketch(sceneSketch));
    setMapZoom(sceneSketch.mapZoom ?? 20);
    setMapCenter({
      latitude: sceneSketch.mapCenterLatitude ?? latitude ?? 0,
      longitude: sceneSketch.mapCenterLongitude ?? longitude ?? 0
    });
  }, [sceneSketch, latitude, longitude]);

  useEffect(() => {
    if (!isEditorOpen || !hasGps || !mapCenter.latitude || !mapCenter.longitude) {
      setMapImageDataUrl(null);
      return;
    }

    let cancelled = false;
    setIsMapLoading(true);
    setMapError(null);

    void fetchMapDataUrl(mapCenter.latitude, mapCenter.longitude, mapZoom)
      .then((dataUrl) => {
        if (!cancelled) {
          setMapImageDataUrl(dataUrl);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error(error);
          setMapImageDataUrl(null);
          setMapError("GPS podloga trenutno nije dostupna.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsMapLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasGps, isEditorOpen, mapCenter.latitude, mapCenter.longitude, mapZoom]);

  const canSave = useMemo(() => Boolean(editorSketch.drawPaths.length || editorSketch.status !== "idle" || hasGps), [editorSketch.drawPaths.length, editorSketch.status, hasGps]);

  const updateSketch = (updater: (current: SceneSketchSuggestion) => SceneSketchSuggestion) => {
    setEditorSketch((current) => ({
      ...updater(current),
      status: "pending"
    }));
  };

  const startEditor = () => {
    setEditorSketch(cloneSketch(sceneSketch));
    setMapZoom(sceneSketch.mapZoom ?? 20);
    setMapCenter({
      latitude: sceneSketch.mapCenterLatitude ?? latitude ?? 0,
      longitude: sceneSketch.mapCenterLongitude ?? longitude ?? 0
    });
    setDrawMode(false);
    setDrawingPathId(null);
    setDragTarget(null);
    setIsEditorOpen(true);
  };

  const nudgeMap = (axis: "latitude" | "longitude", direction: -1 | 1) => {
    const { latSpan, lngSpan } = getMapSpan(mapZoom);
    setMapCenter((current) => ({
      ...current,
      [axis]:
        axis === "latitude"
          ? current.latitude + latSpan * 0.32 * direction
          : current.longitude + lngSpan * 0.32 * direction
    }));
  };

  const pointerToBoardPoint = (clientX: number, clientY: number) => {
    const bounds = boardRef.current?.getBoundingClientRect();
    if (!bounds) {
      return null;
    }

    const x = clamp(((clientX - bounds.left) / bounds.width) * 360, 26, 334);
    const y = clamp(((clientY - bounds.top) / bounds.height) * 360, 26, 334);
    return { x, y };
  };

  const handlePointerDown = (target: DragTarget, event: ReactPointerEvent) => {
    if (readOnly) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setDragTarget(target);
  };

  const handleBoardPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (readOnly || !drawMode) {
      return;
    }

    const point = pointerToBoardPoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    const pathId = createId("sketch");
    setDrawingPathId(pathId);
    updateSketch((current) => ({
      ...current,
      drawPaths: [...current.drawPaths, { id: pathId, points: [point] }]
    }));
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const point = pointerToBoardPoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    if (drawMode && drawingPathId) {
      updateSketch((current) => ({
        ...current,
        drawPaths: current.drawPaths.map((path) =>
          path.id === drawingPathId ? { ...path, points: [...path.points, point] } : path
        )
      }));
      return;
    }

    if (!dragTarget) {
      return;
    }

    updateSketch((current) => {
      if (dragTarget === "impact") {
        return {
          ...current,
          impactPoint: point
        };
      }

      if (dragTarget === "vehicleA") {
        return {
          ...current,
          vehicleAState: {
            ...current.vehicleAState,
            ...point
          }
        };
      }

      return {
        ...current,
        vehicleBState: {
          ...current.vehicleBState,
          ...point
        }
      };
    });
  };

  const handlePointerUp = () => {
    setDragTarget(null);
    setDrawingPathId(null);
  };

  const confirmSketch = async () => {
    const next: SceneSketchSuggestion = {
      ...editorSketch,
      mapZoom,
      mapCenterLatitude: hasGps ? mapCenter.latitude : null,
      mapCenterLongitude: hasGps ? mapCenter.longitude : null,
      status: "confirmed",
      confirmedAt: nowIso()
    };

    try {
      const dataUrl = await renderSketchDataUrl(next, locationLabel, mapImageDataUrl);
      onChange({
        ...next,
        svgDataUrl: dataUrl
      });
      onSaveSketchImage(dataUrl);
      setIsEditorOpen(false);
    } catch (error) {
      console.error(error);
      setMapError("Skica nije sacuvana. Pokusaj ponovo.");
    }
  };

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-[30px] font-semibold text-white">Kreiraj skicu nezgode</h2>

        <Card className="space-y-4">
          {previewImage ? (
            <img alt="Skica nezgode" className="w-full rounded-[24px] border border-white/10 bg-[#0B0D12]" src={previewImage} />
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-4 py-10 text-center text-white/45">
              Skica jos nije sacuvana
            </div>
          )}

          {locationLabel ? <div className="text-sm text-white/55">{locationLabel}</div> : null}

          {!readOnly ? (
            <Button onClick={startEditor} type="button">
              {previewImage ? "Otvori editor skice" : "Napravi skicu"}
            </Button>
          ) : null}
        </Card>
      </div>

      {isEditorOpen ? (
        <div className="fixed inset-0 z-50 bg-[#0B0D12] text-white">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col px-4 pb-5 pt-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button className="text-sm text-white/60" onClick={() => setIsEditorOpen(false)} type="button">
                Nazad
              </button>
              <div className="text-sm text-white/55">{locationLabel || "Rucna podloga skice"}</div>
              <Button fullWidth={false} onClick={confirmSketch} type="button">
                Sacuvaj skicu
              </Button>
            </div>

            <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="flex min-h-0 flex-col">
                <div
                  className="relative mx-auto w-full max-w-[760px] flex-1 overflow-hidden rounded-[30px] border border-white/10 bg-[#0B0D12]"
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  ref={boardRef}
                >
                  <div
                    className="relative h-full min-h-[58vh] w-full overflow-hidden"
                    onPointerDown={handleBoardPointerDown}
                  >
                    {mapImageDataUrl ? (
                      <img
                        alt="GPS podloga skice"
                        className="absolute inset-0 h-full w-full object-cover"
                        src={mapImageDataUrl}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[#0F1725]" />
                    )}

                    {mapImageDataUrl ? <div className="absolute inset-0 bg-[#0B0D12]/30" /> : null}
                    {!mapImageDataUrl ? (
                      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 360">
                        {editorSketch.laneType === "intersection" ? (
                          <>
                            <rect fill="#172234" height="360" rx="18" width="90" x="135" y="0" />
                            <rect fill="#172234" height="90" rx="18" width="360" x="0" y="135" />
                          </>
                        ) : editorSketch.laneType === "parking" ? (
                          <rect fill="#172234" height="360" rx="18" width="70" x="145" y="0" />
                        ) : editorSketch.laneType === "roundabout" ? (
                          <circle cx="180" cy="180" fill="#172234" r="110" />
                        ) : (
                          <rect fill="#172234" height="360" rx="18" width="110" x="125" y="0" />
                        )}
                        {editorSketch.decorations.centerLine ? (
                          <line
                            stroke="rgba(255,255,255,0.28)"
                            strokeDasharray="12 8"
                            strokeWidth="2"
                            x1="180"
                            x2="180"
                            y1="14"
                            y2="346"
                          />
                        ) : null}
                      </svg>
                    ) : null}

                    {isMapLoading ? (
                      <div className="absolute inset-x-0 top-4 z-20 flex justify-center">
                        <div className="rounded-full border border-white/10 bg-black/45 px-4 py-2 text-sm text-white/75">
                          Ucitavam mapu...
                        </div>
                      </div>
                    ) : null}

                    {mapError ? (
                      <div className="absolute inset-x-0 top-4 z-20 flex justify-center">
                        <div className="rounded-full border border-amber-400/25 bg-black/55 px-4 py-2 text-sm text-amber-100">
                          {mapError}
                        </div>
                      </div>
                    ) : null}

                    {hasGps ? (
                      <>
                        <button
                          className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-black/45 px-3 py-3 text-lg text-white"
                          onClick={() => nudgeMap("longitude", -1)}
                          type="button"
                        >
                          ←
                        </button>
                        <button
                          className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-black/45 px-3 py-3 text-lg text-white"
                          onClick={() => nudgeMap("longitude", 1)}
                          type="button"
                        >
                          →
                        </button>
                        <button
                          className="absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-3 py-3 text-lg text-white"
                          onClick={() => nudgeMap("latitude", 1)}
                          type="button"
                        >
                          ↑
                        </button>
                        <button
                          className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-3 py-3 text-lg text-white"
                          onClick={() => nudgeMap("latitude", -1)}
                          type="button"
                        >
                          ↓
                        </button>
                        <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
                          <button
                            className="rounded-full border border-white/10 bg-black/45 px-3 py-3 text-lg text-white"
                            disabled={mapZoom >= MAX_ZOOM}
                            onClick={() => setMapZoom((current) => clamp(current + 1, MIN_ZOOM, MAX_ZOOM))}
                            type="button"
                          >
                            +
                          </button>
                          <button
                            className="rounded-full border border-white/10 bg-black/45 px-3 py-3 text-lg text-white"
                            disabled={mapZoom <= MIN_ZOOM}
                            onClick={() => setMapZoom((current) => clamp(current - 1, MIN_ZOOM, MAX_ZOOM))}
                            type="button"
                          >
                            −
                          </button>
                        </div>
                      </>
                    ) : null}

                    {editorSketch.drawPaths.length > 0 ? (
                      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 360 360">
                        {editorSketch.drawPaths.map((path) => (
                          <polyline
                            key={path.id}
                            fill="none"
                            points={path.points.map((point) => `${point.x},${point.y}`).join(" ")}
                            stroke="#F7FAFF"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                          />
                        ))}
                      </svg>
                    ) : null}

                    <VehicleMarker
                      color="#FF5A5F"
                      label="A"
                      onPointerDown={(event) => handlePointerDown("vehicleA", event)}
                      state={editorSketch.vehicleAState}
                    />
                    <VehicleMarker
                      color="#3D82F6"
                      label="B"
                      onPointerDown={(event) => handlePointerDown("vehicleB", event)}
                      state={editorSketch.vehicleBState}
                    />

                    <button
                      className="absolute -translate-x-1/2 -translate-y-1/2 text-[34px] font-bold text-[#F7CC45]"
                      onPointerDown={(event) => handlePointerDown("impact", event)}
                      style={{ left: editorSketch.impactPoint.x, top: editorSketch.impactPoint.y }}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 overflow-y-auto rounded-[28px] border border-white/10 bg-card p-4">
                <div className="flex items-center gap-2">
                  <Button
                    className={drawMode ? "" : ""}
                    fullWidth={false}
                    onClick={() => setDrawMode((current) => !current)}
                    type="button"
                    variant={drawMode ? "primary" : "secondary"}
                  >
                    {drawMode ? "Olovka ukljucena" : "Olovka"}
                  </Button>
                  <Button
                    disabled={editorSketch.drawPaths.length === 0}
                    fullWidth={false}
                    onClick={() =>
                      updateSketch((current) => ({
                        ...current,
                        drawPaths: current.drawPaths.slice(0, -1)
                      }))
                    }
                    type="button"
                    variant="secondary"
                  >
                    Obrisi potez
                  </Button>
                  <Button
                    disabled={editorSketch.drawPaths.length === 0}
                    fullWidth={false}
                    onClick={() =>
                      updateSketch((current) => ({
                        ...current,
                        drawPaths: []
                      }))
                    }
                    type="button"
                    variant="secondary"
                  >
                    Reset
                  </Button>
                </div>

                {!hasGps ? (
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
                    GPS nije dostupan, pa skicu pravis na rucnoj podlozi.
                  </div>
                ) : null}

                {!hasGps ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Pravac", value: "straight" as const },
                      { label: "Raskrsnica", value: "intersection" as const },
                      { label: "Parking", value: "parking" as const },
                      { label: "Kruzni tok", value: "roundabout" as const }
                    ].map((option) => (
                      <button
                        key={option.value}
                        className={`rounded-[18px] border px-3 py-3 text-sm transition ${
                          editorSketch.laneType === option.value
                            ? "border-accent/50 bg-accent/16 text-white"
                            : "border-white/10 bg-white/5 text-white/72"
                        }`}
                        onClick={() =>
                          updateSketch((current) => ({
                            ...current,
                            laneType: option.value
                          }))
                        }
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}

                <DirectionPicker
                  label="Smer vozila A"
                  onChange={(direction) =>
                    updateSketch((current) => ({
                      ...current,
                      vehicleAState: {
                        ...current.vehicleAState,
                        direction
                      }
                    }))
                  }
                  readOnly={readOnly}
                  value={editorSketch.vehicleAState.direction}
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                    onClick={() =>
                      updateSketch((current) => ({
                        ...current,
                        vehicleAState: {
                          ...current.vehicleAState,
                          rotation: current.vehicleAState.rotation - 15
                        }
                      }))
                    }
                    type="button"
                  >
                    ↺ Rotiraj A
                  </button>
                  <button
                    className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                    onClick={() =>
                      updateSketch((current) => ({
                        ...current,
                        vehicleAState: {
                          ...current.vehicleAState,
                          rotation: current.vehicleAState.rotation + 15
                        }
                      }))
                    }
                    type="button"
                  >
                    ↻ Rotiraj A
                  </button>
                </div>

                <DirectionPicker
                  label="Smer vozila B"
                  onChange={(direction) =>
                    updateSketch((current) => ({
                      ...current,
                      vehicleBState: {
                        ...current.vehicleBState,
                        direction
                      }
                    }))
                  }
                  readOnly={readOnly}
                  value={editorSketch.vehicleBState.direction}
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                    onClick={() =>
                      updateSketch((current) => ({
                        ...current,
                        vehicleBState: {
                          ...current.vehicleBState,
                          rotation: current.vehicleBState.rotation - 15
                        }
                      }))
                    }
                    type="button"
                  >
                    ↺ Rotiraj B
                  </button>
                  <button
                    className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                    onClick={() =>
                      updateSketch((current) => ({
                        ...current,
                        vehicleBState: {
                          ...current.vehicleBState,
                          rotation: current.vehicleBState.rotation + 15
                        }
                      }))
                    }
                    type="button"
                  >
                    ↻ Rotiraj B
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <DecorationChip
                    active={editorSketch.decorations.stop}
                    label="STOP"
                    onClick={() =>
                      updateSketch((current) => ({
                        ...current,
                        decorations: { ...current.decorations, stop: !current.decorations.stop }
                      }))
                    }
                    readOnly={readOnly}
                  />
                  <DecorationChip
                    active={editorSketch.decorations.trafficLight}
                    label="Semafor"
                    onClick={() =>
                      updateSketch((current) => ({
                        ...current,
                        decorations: { ...current.decorations, trafficLight: !current.decorations.trafficLight }
                      }))
                    }
                    readOnly={readOnly}
                  />
                  <DecorationChip
                    active={editorSketch.decorations.crosswalk}
                    label="Prelaz"
                    onClick={() =>
                      updateSketch((current) => ({
                        ...current,
                        decorations: { ...current.decorations, crosswalk: !current.decorations.crosswalk }
                      }))
                    }
                    readOnly={readOnly}
                  />
                  <DecorationChip
                    active={editorSketch.decorations.priority}
                    label="Prvenstvo"
                    onClick={() =>
                      updateSketch((current) => ({
                        ...current,
                        decorations: { ...current.decorations, priority: !current.decorations.priority }
                      }))
                    }
                    readOnly={readOnly}
                  />
                  <DecorationChip
                    active={editorSketch.decorations.parkedVehicle}
                    label="Parkirano"
                    onClick={() =>
                      updateSketch((current) => ({
                        ...current,
                        decorations: { ...current.decorations, parkedVehicle: !current.decorations.parkedVehicle }
                      }))
                    }
                    readOnly={readOnly}
                  />
                  <DecorationChip
                    active={editorSketch.decorations.curb}
                    label="Ivicnjak"
                    onClick={() =>
                      updateSketch((current) => ({
                        ...current,
                        decorations: { ...current.decorations, curb: !current.decorations.curb }
                      }))
                    }
                    readOnly={readOnly}
                  />
                  <DecorationChip
                    active={editorSketch.decorations.centerLine}
                    label="Razdelna linija"
                    onClick={() =>
                      updateSketch((current) => ({
                        ...current,
                        decorations: { ...current.decorations, centerLine: !current.decorations.centerLine }
                      }))
                    }
                    readOnly={readOnly}
                  />
                </div>

                <Button disabled={!canSave} onClick={confirmSketch} type="button">
                  Potvrdi skicu
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
