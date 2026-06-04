import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toPng } from "html-to-image";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { createId, nowIso } from "../../lib/utils";
import type { SceneSketchSuggestion } from "../../types";

const BOARD_VIEW_SIZE = 360;
const EXPORT_SIZE = 900;
const MIN_ZOOM = 16;
const MAX_ZOOM = 22;
const VEHICLE_ICON_A_SRC = `${import.meta.env.BASE_URL}sketch-car-a.png`;
const VEHICLE_ICON_B_SRC = `${import.meta.env.BASE_URL}sketch-car-b.png`;

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
type VehicleKey = "A" | "B";
type BoardPoint = { x: number; y: number };
const MAP_OVERLAY_Z_INDEX = 1000;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeRotation(rotation: number) {
  return ((rotation % 360) + 360) % 360;
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
  return { latSpan, lngSpan };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Neuspesno ucitavanje podloge za skicu."));
    image.src = src;
  });
}

async function waitForLeafletTiles(container: HTMLElement) {
  const tiles = Array.from(
    container.querySelectorAll<HTMLImageElement>("img.leaflet-tile")
  );

  await Promise.all(
    tiles.map(async (tile) => {
      if (!tile.complete) {
        await new Promise<void>((resolve) => {
          const done = () => resolve();
          tile.addEventListener("load", done, { once: true });
          tile.addEventListener("error", done, { once: true });
        });
      }

      if (typeof tile.decode === "function") {
        try {
          await tile.decode();
        } catch {
          // ignore decode failures and let export attempt proceed
        }
      }
    })
  );
}

async function exportCurrentSketchToPng(container: HTMLElement) {
  await waitForLeafletTiles(container);

  return toPng(container, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#0B0D12"
  });
}

function directionSymbol(direction: SketchDirection) {
  switch (direction) {
    case "left":
      return "↰";
    case "right":
      return "↱";
    case "uturn":
      return "↶";
    default:
      return "↑";
  }
}

function directionRotation(direction: SketchDirection) {
  switch (direction) {
    case "backward":
      return 270;
    case "left":
      return 90;
    case "right":
      return 90;
    case "uturn":
      return 90;
    default:
      return 90;
  }
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

function drawFallbackRoad(
  context: CanvasRenderingContext2D,
  sketch: SceneSketchSuggestion,
  size: number
) {
  context.fillStyle = "#101826";
  context.fillRect(0, 0, size, size);
  context.fillStyle = "#1B2637";

  if (sketch.laneType === "intersection") {
    drawRoundedRect(context, size * 0.38, 0, size * 0.24, size, 28);
    context.fill();
    drawRoundedRect(context, 0, size * 0.38, size, size * 0.24, 28);
    context.fill();
  } else if (sketch.laneType === "parking") {
    drawRoundedRect(context, size * 0.4, 0, size * 0.2, size, 28);
    context.fill();
  } else if (sketch.laneType === "roundabout") {
    context.beginPath();
    context.arc(size / 2, size / 2, size * 0.28, 0, Math.PI * 2);
    context.fill();
  } else {
    drawRoundedRect(context, size * 0.35, 0, size * 0.3, size, 28);
    context.fill();
  }

  if (sketch.decorations.centerLine) {
    context.save();
    context.strokeStyle = "rgba(255,255,255,0.34)";
    context.lineWidth = 4;
    context.setLineDash([16, 10]);
    context.beginPath();
    context.moveTo(size / 2, 18);
    context.lineTo(size / 2, size - 18);
    context.stroke();
    context.restore();
  }
}

function drawDirectionArrow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number,
  direction: SketchDirection,
  color: string,
  scale: number
) {
  const angle = (rotation * Math.PI) / 180;
  const startDistance = 30 * scale;
  const length = 54 * scale;
  const startX = x + Math.sin(angle) * startDistance;
  const startY = y - Math.cos(angle) * startDistance;
  const endX = x + Math.sin(angle) * (startDistance + length);
  const endY = y - Math.cos(angle) * (startDistance + length);

  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = 5 * scale;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();

  if (direction === "left" || direction === "right") {
    const side = direction === "left" ? -1 : 1;
    const curveX = x + Math.cos(angle) * side * 44 * scale;
    const curveY = y + Math.sin(angle) * side * 44 * scale;
    context.moveTo(startX, startY);
    context.quadraticCurveTo(curveX, curveY, endX + Math.cos(angle) * side * 26, endY + Math.sin(angle) * side * 26);
    context.stroke();
  } else if (direction === "backward") {
    const backX = x - Math.sin(angle) * 52 * scale;
    const backY = y + Math.cos(angle) * 52 * scale;
    context.moveTo(startX, startY);
    context.lineTo(backX, backY);
    context.stroke();
  } else if (direction === "uturn") {
    context.arc(x, y - 44 * scale, 28 * scale, Math.PI * 0.1, Math.PI * 1.55);
    context.stroke();
  } else {
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();
  }

  context.restore();
}

function drawVehicle(
  context: CanvasRenderingContext2D,
  label: VehicleKey,
  state: SceneSketchSuggestion["vehicleAState"],
  color: string,
  directionColor: string,
  icon: HTMLImageElement,
  scale = 1
) {
  const x = state.x * scale;
  const y = state.y * scale;
  drawDirectionArrow(context, x, y, state.rotation, state.direction, directionColor, scale);

  context.save();
  context.translate(x, y);
  context.rotate((state.rotation * Math.PI) / 180);
  const width = 108 * scale;
  const height = 54 * scale;
  context.drawImage(icon, -width / 2, -height / 2, width, height);
  context.restore();

  context.save();
  context.fillStyle = "rgba(255,255,255,0.96)";
  context.font = `700 ${Math.round(18 * scale)}px Arial`;
  context.textAlign = "center";
  context.fillText(label, x, y + 42 * scale);
  context.restore();
}

function drawImpactMarker(
  context: CanvasRenderingContext2D,
  point: BoardPoint,
  scale = 1
) {
  const x = point.x * scale;
  const y = point.y * scale;
  context.save();
  context.strokeStyle = "#000000";
  context.lineWidth = 6 * scale;
  context.beginPath();
  context.moveTo(x - 16 * scale, y - 16 * scale);
  context.lineTo(x + 16 * scale, y + 16 * scale);
  context.moveTo(x + 16 * scale, y - 16 * scale);
  context.lineTo(x - 16 * scale, y + 16 * scale);
  context.stroke();
  context.restore();
}

function drawDecorations(context: CanvasRenderingContext2D, sketch: SceneSketchSuggestion, size: number) {
  context.save();

  if (sketch.decorations.stop) {
    context.fillStyle = "#D24E4E";
    context.beginPath();
    context.arc(size * 0.18, size * 0.18, size * 0.045, 0, Math.PI * 2);
    context.fill();
  }

  if (sketch.decorations.trafficLight) {
    context.fillStyle = "rgba(0,0,0,0.72)";
    drawRoundedRect(context, size * 0.78, size * 0.14, size * 0.04, size * 0.11, 10);
    context.fill();
  }

  if (sketch.decorations.crosswalk) {
    context.fillStyle = "rgba(255,255,255,0.76)";
    for (let index = 0; index < 6; index += 1) {
      context.fillRect(size * 0.28 + index * size * 0.04, size * 0.72, size * 0.02, size * 0.08);
    }
  }

  if (sketch.decorations.priority) {
    context.save();
    context.translate(size * 0.16, size * 0.76);
    context.rotate(Math.PI / 4);
    context.fillStyle = "#F1C64C";
    context.fillRect(-10, -10, 20, 20);
    context.restore();
  }

  if (sketch.decorations.parkedVehicle) {
    context.fillStyle = "#7B88A0";
    drawRoundedRect(context, size * 0.12, size * 0.54, size * 0.05, size * 0.12, 8);
    context.fill();
  }

  if (sketch.decorations.curb) {
    context.strokeStyle = "rgba(220,228,240,0.78)";
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(size * 0.08, size * 0.9);
    context.lineTo(size * 0.92, size * 0.9);
    context.stroke();
  }

  context.restore();
}

async function renderSketchPng(
  sketch: SceneSketchSuggestion,
  locationLabel: string | null
) {
  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_SIZE;
  canvas.height = EXPORT_SIZE;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas nije dostupan za izvoz skice.");
  }

  drawFallbackRoad(context, sketch, EXPORT_SIZE);

  const [vehicleAImage, vehicleBImage] = await Promise.all([
    loadImage(VEHICLE_ICON_A_SRC),
    loadImage(VEHICLE_ICON_B_SRC)
  ]);

  drawDecorations(context, sketch, EXPORT_SIZE);

  if (sketch.drawPaths.length > 0) {
    context.save();
    context.strokeStyle = "#F7FAFF";
    context.lineWidth = 6;
    context.lineCap = "round";
    context.lineJoin = "round";
    sketch.drawPaths.forEach((path) => {
      if (path.points.length < 2) {
        return;
      }
      context.beginPath();
      context.moveTo(
        path.points[0].x * (EXPORT_SIZE / BOARD_VIEW_SIZE),
        path.points[0].y * (EXPORT_SIZE / BOARD_VIEW_SIZE)
      );
      path.points.slice(1).forEach((point) => {
        context.lineTo(
          point.x * (EXPORT_SIZE / BOARD_VIEW_SIZE),
          point.y * (EXPORT_SIZE / BOARD_VIEW_SIZE)
        );
      });
      context.stroke();
    });
    context.restore();
  }

  drawVehicle(
    context,
    "A",
    sketch.vehicleAState,
    "#FF4E5C",
    "#FF9AA2",
    vehicleAImage,
    EXPORT_SIZE / BOARD_VIEW_SIZE
  );
  drawVehicle(
    context,
    "B",
    sketch.vehicleBState,
    "#2F78FF",
    "#8DB7FF",
    vehicleBImage,
    EXPORT_SIZE / BOARD_VIEW_SIZE
  );
  drawImpactMarker(context, sketch.impactPoint, EXPORT_SIZE / BOARD_VIEW_SIZE);

  if (locationLabel) {
    context.save();
    context.fillStyle = "rgba(11,13,18,0.62)";
    drawRoundedRect(context, 18, 18, Math.min(700, locationLabel.length * 15 + 34), 42, 18);
    context.fill();
    context.fillStyle = "rgba(255,255,255,0.92)";
    context.font = "600 22px Arial";
    context.fillText(locationLabel, 32, 45);
    context.restore();
  }

  if (sketch.mapCenterLatitude && sketch.mapCenterLongitude) {
    const gpsLine = `${sketch.mapCenterLatitude.toFixed(5)}, ${sketch.mapCenterLongitude.toFixed(5)}`;
    context.save();
    context.fillStyle = "rgba(255,255,255,0.8)";
    context.font = "500 18px Arial";
    context.fillText(gpsLine, 30, EXPORT_SIZE - 24);
    context.restore();
  }

  return canvas.toDataURL("image/png");
}

function VehicleMarker({
  label,
  color,
  selected,
  state,
  onPointerDown,
  onSelect
}: {
  label: VehicleKey;
  color: string;
  selected: boolean;
  state: SceneSketchSuggestion["vehicleAState"];
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onSelect: () => void;
}) {
  const left = `${(state.x / BOARD_VIEW_SIZE) * 100}%`;
  const top = `${(state.y / BOARD_VIEW_SIZE) * 100}%`;
  const vehicleIcon = label === "A" ? VEHICLE_ICON_A_SRC : VEHICLE_ICON_B_SRC;

  return (
    <>
      <button
        className="pointer-events-auto absolute h-[54px] w-[108px] -translate-x-1/2 -translate-y-1/2 touch-none"
        onClick={onSelect}
        onPointerDown={onPointerDown}
        style={{
          left,
          top,
          zIndex: MAP_OVERLAY_Z_INDEX,
          transform: `translate(-50%, -50%) rotate(${state.rotation}deg)`,
          filter: selected
            ? "drop-shadow(0 10px 24px rgba(0,0,0,0.34)) drop-shadow(0 0 0.75rem rgba(255,255,255,0.18))"
            : "drop-shadow(0 10px 24px rgba(0,0,0,0.34))"
        }}
        type="button"
      >
        <img
          alt={`Auto ${label}`}
          className={`pointer-events-none h-full w-full object-contain ${selected ? "scale-105" : ""}`}
          src={vehicleIcon}
        />
      </button>
      <div
        className="pointer-events-none absolute -translate-x-1/2 rounded-full bg-black/55 px-2 py-1 text-[11px] font-bold text-white"
        style={{
          left,
          top: `calc(${top} + 28px)`,
          zIndex: MAP_OVERLAY_Z_INDEX
        }}
      >
        {label}
      </div>
      <div
        className="pointer-events-none absolute -translate-x-1/2 text-[66px] font-black leading-none"
        style={{
          left,
          top,
          transform: `translate(-50%, -50%) rotate(${state.rotation + directionRotation(state.direction)}deg) translate(0, -52px)`,
          color: label === "A" ? "#FF9AA2" : "#8DB7FF",
          zIndex: MAP_OVERLAY_Z_INDEX
        }}
      >
        {directionSymbol(state.direction)}
      </div>
    </>
  );
}

function DirectionPicker({
  value,
  onChange
}: {
  value: SketchDirection;
  onChange: (value: SketchDirection) => void;
}) {
  const options: Array<{ value: SketchDirection; symbol: string; label: string }> = [
    { value: "forward", symbol: "↑", label: "Napred" },
    { value: "backward", symbol: "↓", label: "Nazad" },
    { value: "left", symbol: "↰", label: "Levo" },
    { value: "right", symbol: "↱", label: "Desno" },
    { value: "uturn", symbol: "↶", label: "Polukruzno" }
  ];

  return (
    <div className="grid grid-cols-5 gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          className={`rounded-[18px] border px-2 py-3 text-center transition ${
            value === option.value
              ? "border-accent/55 bg-accent/18 text-white"
              : "border-white/10 bg-white/5 text-white/72"
          }`}
          onClick={() => onChange(option.value)}
          type="button"
        >
          <div className="text-lg font-semibold">{option.symbol}</div>
          <div className="mt-1 text-[11px] leading-none">{option.label}</div>
        </button>
      ))}
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
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorSketch, setEditorSketch] = useState(() => cloneSketch(sceneSketch));
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleKey>("A");
  const [isMobileVehicleSheetOpen, setIsMobileVehicleSheetOpen] = useState(false);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [drawingPathId, setDrawingPathId] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(sceneSketch.mapZoom ?? 18);
  const [mapCenter, setMapCenter] = useState({
    latitude: sceneSketch.mapCenterLatitude ?? latitude ?? 0,
    longitude: sceneSketch.mapCenterLongitude ?? longitude ?? 0
  });
  const boardRef = useRef<HTMLDivElement | null>(null);
  const sketchContainerRef = useRef<HTMLDivElement | null>(null);
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const previewImage = sceneSketch.svgDataUrl || null;
  const selectedState =
    selectedVehicle === "A" ? editorSketch.vehicleAState : editorSketch.vehicleBState;
  const isPointerInteractionActive = dragTarget !== null || drawingPathId !== null;

  const hasLiveMap = useMemo(
    () => Boolean(hasGps && mapCenter.latitude && mapCenter.longitude),
    [hasGps, mapCenter.latitude, mapCenter.longitude]
  );

  useEffect(() => {
    if (isEditorOpen) {
      return;
    }

    setEditorSketch(cloneSketch(sceneSketch));
    setMapZoom(sceneSketch.mapZoom ?? 18);
    setMapCenter({
      latitude: sceneSketch.mapCenterLatitude ?? latitude ?? 0,
      longitude: sceneSketch.mapCenterLongitude ?? longitude ?? 0
    });
  }, [isEditorOpen, sceneSketch, latitude, longitude]);

  useEffect(() => {
    if (!isEditorOpen || !hasGps || !mapHostRef.current) {
      return;
    }

    if (!leafletMapRef.current) {
      const map = L.map(mapHostRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: false,
        keyboard: false,
        touchZoom: true,
        tapHold: false,
        zoomSnap: 1,
        zoomDelta: 1,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        subdomains: ["a", "b", "c"],
        crossOrigin: true,
        maxNativeZoom: 19,
        maxZoom: MAX_ZOOM,
      }).addTo(map);

      map.on("moveend zoomend", () => {
        const center = map.getCenter();
        const nextZoom = map.getZoom();
        setMapCenter((current) => {
          if (
            Math.abs(current.latitude - center.lat) < 0.000001 &&
            Math.abs(current.longitude - center.lng) < 0.000001
          ) {
            return current;
          }
          return { latitude: center.lat, longitude: center.lng };
        });
        setMapZoom((current) => (current === nextZoom ? current : nextZoom));
      });

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;
    map.setView([mapCenter.latitude, mapCenter.longitude], mapZoom, { animate: false });
    window.setTimeout(() => map.invalidateSize(false), 0);
  }, [hasGps, isEditorOpen, mapCenter.latitude, mapCenter.longitude, mapZoom]);

  useEffect(() => {
    if (isEditorOpen) {
      return;
    }

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }
  }, [isEditorOpen]);

  useEffect(() => {
    if (!isEditorOpen || !isMobileVehicleSheetOpen || isPointerInteractionActive) {
      return;
    }

    leafletMapRef.current?.dragging.disable();
    leafletMapRef.current?.touchZoom.disable();

    return () => {
      leafletMapRef.current?.dragging.enable();
      leafletMapRef.current?.touchZoom.enable();
    };
  }, [isEditorOpen, isMobileVehicleSheetOpen, isPointerInteractionActive]);

  const updateSketch = (updater: (current: SceneSketchSuggestion) => SceneSketchSuggestion) => {
    setEditorSketch((current) => ({
      ...updater(current),
      status: "pending"
    }));
  };

  const getBoardPoint = (clientX: number, clientY: number) => {
    const bounds = boardRef.current?.getBoundingClientRect();
    if (!bounds) {
      return null;
    }

    return {
      x: clamp(((clientX - bounds.left) / bounds.width) * BOARD_VIEW_SIZE, 18, 342),
      y: clamp(((clientY - bounds.top) / bounds.height) * BOARD_VIEW_SIZE, 18, 342)
    };
  };

  const openEditor = () => {
    setEditorSketch(cloneSketch(sceneSketch));
    setSelectedVehicle("A");
    setIsMobileVehicleSheetOpen(false);
    setDrawMode(false);
    setDrawingPathId(null);
    setDragTarget(null);
    setExportError(null);
    setMapZoom(sceneSketch.mapZoom ?? 18);
    setMapCenter({
      latitude: sceneSketch.mapCenterLatitude ?? latitude ?? 0,
      longitude: sceneSketch.mapCenterLongitude ?? longitude ?? 0
    });
    setIsEditorOpen(true);
  };

  const rotateSelected = (delta: number) => {
    updateSketch((current) => ({
      ...current,
      [selectedVehicle === "A" ? "vehicleAState" : "vehicleBState"]: {
        ...(selectedVehicle === "A" ? current.vehicleAState : current.vehicleBState),
        rotation: normalizeRotation(
          (selectedVehicle === "A" ? current.vehicleAState.rotation : current.vehicleBState.rotation) +
            delta
        )
      }
    }));
  };

  const setDirection = (direction: SketchDirection) => {
    updateSketch((current) => ({
      ...current,
      [selectedVehicle === "A" ? "vehicleAState" : "vehicleBState"]: {
        ...(selectedVehicle === "A" ? current.vehicleAState : current.vehicleBState),
        direction
      }
    }));
  };

  const selectVehicle = (vehicle: VehicleKey, openMobileSheet = false) => {
    setSelectedVehicle(vehicle);
    if (openMobileSheet) {
      setIsMobileVehicleSheetOpen(true);
    }
  };

  const nudgeMap = (latDirection: number, lngDirection: number) => {
    const { latSpan, lngSpan } = getMapSpan(mapZoom);
    setMapCenter((current) => ({
      latitude: current.latitude + latSpan * latDirection,
      longitude: current.longitude + lngSpan * lngDirection
    }));
  };

  const handleDraggablePointerDown = (
    target: DragTarget,
    event: ReactPointerEvent<HTMLButtonElement>
  ) => {
    if (readOnly) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (target === "vehicleA") {
      selectVehicle("A", true);
    }
    if (target === "vehicleB") {
      selectVehicle("B", true);
    }
    leafletMapRef.current?.dragging.disable();
    leafletMapRef.current?.touchZoom.disable();
    leafletMapRef.current?.doubleClickZoom.disable();
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragTarget(target);
  };

  const handleBoardPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drawMode || readOnly) {
      return;
    }

    const point = getBoardPoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }

    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const pathId = createId("sketch");
    setDrawingPathId(pathId);
    updateSketch((current) => ({
      ...current,
      drawPaths: [...current.drawPaths, { id: pathId, points: [point] }]
    }));
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== null && activePointerIdRef.current !== event.pointerId) {
      return;
    }

    const point = getBoardPoint(event.clientX, event.clientY);
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

    if (dragTarget === "impact") {
      updateSketch((current) => ({
        ...current,
        impactPoint: point
      }));
      return;
    }

    if (dragTarget === "vehicleA") {
      updateSketch((current) => ({
        ...current,
        vehicleAState: {
          ...current.vehicleAState,
          ...point
        }
      }));
      return;
    }

    if (dragTarget === "vehicleB") {
      updateSketch((current) => ({
        ...current,
        vehicleBState: {
          ...current.vehicleBState,
          ...point
        }
      }));
    }
  };

  const handlePointerEnd = () => {
    leafletMapRef.current?.dragging.enable();
    leafletMapRef.current?.touchZoom.enable();
    leafletMapRef.current?.doubleClickZoom.enable();
    activePointerIdRef.current = null;
    setDragTarget(null);
    setDrawingPathId(null);
  };

  useEffect(() => {
    if (!isEditorOpen || !isPointerInteractionActive) {
      return;
    }

    const handleWindowPointerMove = (event: PointerEvent) => {
      if (activePointerIdRef.current !== null && activePointerIdRef.current !== event.pointerId) {
        return;
      }

      const point = getBoardPoint(event.clientX, event.clientY);
      if (!point) {
        return;
      }

      if (drawingPathId) {
        updateSketch((current) => ({
          ...current,
          drawPaths: current.drawPaths.map((path) =>
            path.id === drawingPathId ? { ...path, points: [...path.points, point] } : path
          )
        }));
        return;
      }

      if (dragTarget === "impact") {
        updateSketch((current) => ({
          ...current,
          impactPoint: point
        }));
        return;
      }

      if (dragTarget === "vehicleA") {
        updateSketch((current) => ({
          ...current,
          vehicleAState: {
            ...current.vehicleAState,
            ...point
          }
        }));
        return;
      }

      if (dragTarget === "vehicleB") {
        updateSketch((current) => ({
          ...current,
          vehicleBState: {
            ...current.vehicleBState,
            ...point
          }
        }));
      }
    };

    const handleWindowPointerUp = () => {
      handlePointerEnd();
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
    };
  }, [dragTarget, drawingPathId, isEditorOpen, isPointerInteractionActive]);

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
      setExportError(null);
      const target = sketchContainerRef.current;
      if (!target) {
        throw new Error("Sketch container nije dostupan za izvoz.");
      }
      const dataUrl = await exportCurrentSketchToPng(target);
      onChange({
        ...next,
        svgDataUrl: dataUrl
      });
      onSaveSketchImage(dataUrl);
      setIsEditorOpen(false);
    } catch (error) {
      console.error("Sketch export failed", error);
      setExportError("Izvoz skice nije uspeo. Pokusaj ponovo.");
    }
  };

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-[30px] font-semibold text-white">Skica nezgode</h2>

        <Card className="space-y-4">
          {previewImage ? (
            <img
              alt="Skica nezgode"
              className="w-full rounded-[24px] border border-white/10 bg-[#0B0D12]"
              src={previewImage}
            />
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-4 py-10 text-center text-white/45">
              Skica jos nije sacuvana.
            </div>
          )}

          {!readOnly ? (
            <Button onClick={openEditor} type="button">
              {previewImage ? "Otvori editor skice" : "Napravi skicu"}
            </Button>
          ) : null}
        </Card>
      </div>

      {isEditorOpen ? (
        <div className="fixed inset-0 z-50 overflow-hidden bg-[#0B0D12] text-white">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col px-4 pb-4 pt-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button className="text-sm text-white/60" onClick={() => setIsEditorOpen(false)} type="button">
                Nazad
              </button>
              <div className="truncate text-sm text-white/55">
                {locationLabel || "Rucna podloga"}
              </div>
              <Button fullWidth={false} onClick={confirmSketch} type="button">
                Sacuvaj skicu
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-4 pb-6">
                <div
                  className="relative mx-auto aspect-[20/9] w-full max-w-[920px] overflow-hidden rounded-[30px] border border-white/10 bg-[#0B0D12]"
                  onPointerCancel={handlePointerEnd}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerEnd}
                  ref={boardRef}
                >
                  <div className="relative h-full w-full overflow-hidden" ref={sketchContainerRef}>
                    {hasLiveMap ? (
                      <>
                        <div
                          className="absolute inset-0 z-0 h-full w-full"
                          ref={mapHostRef}
                        />
                        <div className="pointer-events-none absolute inset-0 z-10 bg-[#0B0D12]/22" />
                      </>
                    ) : (
                      <svg className="absolute inset-0 z-0 h-full w-full" viewBox="0 0 360 360">
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
                    )}

                    <div
                      className="absolute inset-0"
                      style={{ zIndex: MAP_OVERLAY_Z_INDEX, pointerEvents: "none" }}
                    >
                    {hasGps ? (
                      <div className="pointer-events-none absolute inset-0">
                        <button
                          className="pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white"
                          onClick={() => nudgeMap(0, -0.35)}
                          type="button"
                        >
                          ←
                        </button>
                        <button
                          className="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white"
                          onClick={() => nudgeMap(0, 0.35)}
                          type="button"
                        >
                          →
                        </button>
                        <button
                          className="pointer-events-auto absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/50 px-3 py-2 text-white"
                          onClick={() => nudgeMap(0.35, 0)}
                          type="button"
                        >
                          ↑
                        </button>
                        <button
                          className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-2 text-white"
                          onClick={() => nudgeMap(-0.35, 0)}
                          type="button"
                        >
                          ↓
                        </button>
                        <div className="absolute right-3 top-3 flex flex-col gap-2">
                          <button
                            className="pointer-events-auto rounded-full bg-black/55 px-3 py-2 text-lg text-white"
                            disabled={mapZoom >= MAX_ZOOM}
                            onClick={() =>
                              setMapZoom((current) => clamp(current + 1, MIN_ZOOM, MAX_ZOOM))
                            }
                            type="button"
                          >
                            +
                          </button>
                          <button
                            className="pointer-events-auto rounded-full bg-black/55 px-3 py-2 text-lg text-white"
                            disabled={mapZoom <= MIN_ZOOM}
                            onClick={() =>
                              setMapZoom((current) => clamp(current - 1, MIN_ZOOM, MAX_ZOOM))
                            }
                            type="button"
                          >
                            −
                          </button>
                        </div>
                      </div>
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

                    {drawMode ? (
                      <div
                        className="absolute inset-0 cursor-crosshair touch-none"
                        onPointerDown={handleBoardPointerDown}
                        style={{ pointerEvents: "auto" }}
                      />
                    ) : null}

                    <VehicleMarker
                      color="#FF4E5C"
                      label="A"
                      onPointerDown={(event) => handleDraggablePointerDown("vehicleA", event)}
                      onSelect={() => selectVehicle("A", true)}
                      selected={selectedVehicle === "A"}
                      state={editorSketch.vehicleAState}
                    />
                    <VehicleMarker
                      color="#2F78FF"
                      label="B"
                      onPointerDown={(event) => handleDraggablePointerDown("vehicleB", event)}
                      onSelect={() => selectVehicle("B", true)}
                      selected={selectedVehicle === "B"}
                      state={editorSketch.vehicleBState}
                    />

                    <button
                      className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 text-[52px] font-black leading-none text-black drop-shadow-[0_2px_6px_rgba(255,255,255,0.5)] touch-none"
                      onPointerDown={(event) => handleDraggablePointerDown("impact", event)}
                      style={{
                        left: `${(editorSketch.impactPoint.x / BOARD_VIEW_SIZE) * 100}%`,
                        top: `${(editorSketch.impactPoint.y / BOARD_VIEW_SIZE) * 100}%`,
                        zIndex: MAP_OVERLAY_Z_INDEX
                      }}
                      type="button"
                    >
                      ×
                    </button>
                    </div>
                  </div>
                </div>

                {exportError ? (
                  <div className="rounded-[18px] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {exportError}
                  </div>
                ) : null}

                {isMobileVehicleSheetOpen ? (
                  <div className="fixed inset-x-0 bottom-0 z-[70] rounded-t-[30px] border border-white/10 bg-[#111827]/95 px-4 pb-5 pt-4 shadow-[0_-18px_45px_rgba(0,0,0,0.45)] backdrop-blur md:hidden">
                    <div className="mx-auto max-w-md space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-accent/80">
                            Vozilo
                          </div>
                          <div className="mt-1 text-2xl font-bold text-white">
                            AUTO {selectedVehicle}
                          </div>
                        </div>
                        <button
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
                          onClick={() => setIsMobileVehicleSheetOpen(false)}
                          type="button"
                        >
                          Gotovo
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                          Smer kretanja
                        </div>
                        <DirectionPicker onChange={setDirection} value={selectedState.direction} />
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                          Orijentacija vozila
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                            onClick={() => rotateSelected(-15)}
                            type="button"
                          >
                            ↺ Rotiraj ulevo
                          </button>
                          <button
                            className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                            onClick={() => rotateSelected(15)}
                            type="button"
                          >
                            ↻ Rotiraj udesno
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="hidden space-y-4 rounded-[28px] border border-white/10 bg-card p-4 md:block">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className={`rounded-[18px] border px-4 py-3 text-sm font-bold ${
                        selectedVehicle === "A"
                          ? "border-white/50 bg-[#FF4E5C]/30 text-white"
                          : "border-white/10 bg-white/5 text-white/72"
                      }`}
                      onClick={() => selectVehicle("A")}
                      type="button"
                    >
                      Auto A
                    </button>
                    <button
                      className={`rounded-[18px] border px-4 py-3 text-sm font-bold ${
                        selectedVehicle === "B"
                          ? "border-white/50 bg-[#2F78FF]/30 text-white"
                          : "border-white/10 bg-white/5 text-white/72"
                      }`}
                      onClick={() => selectVehicle("B")}
                      type="button"
                    >
                      Auto B
                    </button>
                  </div>

                  <div className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-white/45">
                    Pravac kretanja automobila
                  </div>

                  <DirectionPicker onChange={setDirection} value={selectedState.direction} />

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                      onClick={() => rotateSelected(-15)}
                      type="button"
                    >
                      Rotiraj ulevo
                    </button>
                    <button
                      className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                      onClick={() => rotateSelected(15)}
                      type="button"
                    >
                      Rotiraj udesno
                    </button>
                  </div>

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

                  <Button onClick={confirmSketch} type="button">
                    Potvrdi skicu
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
