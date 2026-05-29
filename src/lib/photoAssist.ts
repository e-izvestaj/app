import type { DamageSuggestion, PhotoAsset, SceneSketchSuggestion } from "../types";
import { DAMAGE_ZONE_OPTIONS } from "./utils";

function deterministicIndex(seed: string, max: number) {
  return (
    seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % Math.max(1, max)
  );
}

function arrowPath(
  x: number,
  y: number,
  direction: SceneSketchSuggestion["vehicleAState"]["direction"]
) {
  if (direction === "backward") {
    return `M ${x} ${y} L ${x} ${y + 42}`;
  }
  if (direction === "left") {
    return `M ${x} ${y} C ${x - 16} ${y - 6}, ${x - 24} ${y - 24}, ${x - 18} ${y - 40}`;
  }
  if (direction === "right") {
    return `M ${x} ${y} C ${x + 16} ${y - 6}, ${x + 24} ${y - 24}, ${x + 18} ${y - 40}`;
  }
  if (direction === "uturn") {
    return `M ${x} ${y} C ${x + 24} ${y - 10}, ${x + 28} ${y - 46}, ${x} ${y - 54} C ${x - 20} ${y - 54}, ${x - 22} ${y - 34}, ${x - 8} ${y - 24}`;
  }

  return `M ${x} ${y} L ${x} ${y - 42}`;
}

function renderBackground(laneType: SceneSketchSuggestion["laneType"], decorations: SceneSketchSuggestion["decorations"]) {
  if (laneType === "intersection") {
    return `
      <rect x="26" y="24" width="308" height="292" rx="28" fill="#101722" stroke="#2F80FF" stroke-opacity="0.18"/>
      <rect x="132" y="24" width="96" height="292" rx="18" fill="#1A2230"/>
      <rect x="26" y="122" width="308" height="96" rx="18" fill="#1A2230"/>
      ${decorations.centerLine ? '<line x1="180" y1="24" x2="180" y2="316" stroke="#FFFFFF" stroke-opacity="0.3" stroke-dasharray="10 8"/><line x1="26" y1="170" x2="334" y2="170" stroke="#FFFFFF" stroke-opacity="0.3" stroke-dasharray="10 8"/>' : ""}
    `;
  }

  if (laneType === "parking") {
    return `
      <rect x="26" y="24" width="308" height="292" rx="28" fill="#101722" stroke="#2F80FF" stroke-opacity="0.18"/>
      <rect x="134" y="24" width="92" height="292" rx="18" fill="#1A2230"/>
      <line x1="90" y1="68" x2="132" y2="68" stroke="#8FA6C7" stroke-opacity="0.55"/>
      <line x1="90" y1="118" x2="132" y2="118" stroke="#8FA6C7" stroke-opacity="0.55"/>
      <line x1="90" y1="168" x2="132" y2="168" stroke="#8FA6C7" stroke-opacity="0.55"/>
      <line x1="90" y1="218" x2="132" y2="218" stroke="#8FA6C7" stroke-opacity="0.55"/>
      <line x1="90" y1="268" x2="132" y2="268" stroke="#8FA6C7" stroke-opacity="0.55"/>
      ${decorations.centerLine ? '<line x1="180" y1="24" x2="180" y2="316" stroke="#FFFFFF" stroke-opacity="0.3" stroke-dasharray="10 8"/>' : ""}
    `;
  }

  if (laneType === "roundabout") {
    return `
      <rect x="26" y="24" width="308" height="292" rx="28" fill="#101722" stroke="#2F80FF" stroke-opacity="0.18"/>
      <circle cx="180" cy="170" r="74" fill="#1A2230"/>
      <circle cx="180" cy="170" r="34" fill="#101722" stroke="#FFFFFF" stroke-opacity="0.24"/>
      <circle cx="180" cy="170" r="54" fill="none" stroke="#FFFFFF" stroke-opacity="0.28" stroke-dasharray="10 8"/>
    `;
  }

  return `
    <rect x="26" y="24" width="308" height="292" rx="28" fill="#101722" stroke="#2F80FF" stroke-opacity="0.18"/>
    <rect x="132" y="24" width="96" height="292" rx="18" fill="#1A2230"/>
    ${decorations.centerLine ? '<line x1="180" y1="24" x2="180" y2="316" stroke="#FFFFFF" stroke-opacity="0.3" stroke-dasharray="10 8"/>' : ""}
  `;
}

function renderDecorations(decorations: SceneSketchSuggestion["decorations"]) {
  const items: string[] = [];

  if (decorations.crosswalk) {
    items.push('<g opacity="0.8"><rect x="118" y="214" width="124" height="18" rx="8" fill="#FFFFFF" fill-opacity="0.08"/><line x1="124" y1="223" x2="236" y2="223" stroke="#FFFFFF" stroke-width="10" stroke-dasharray="12 10"/></g>');
  }
  if (decorations.stop) {
    items.push('<g><circle cx="82" cy="88" r="16" fill="#C83B3B"/><text x="82" y="93" fill="#FFFFFF" font-size="10" font-family="Arial" text-anchor="middle">STOP</text></g>');
  }
  if (decorations.trafficLight) {
    items.push('<g><rect x="276" y="78" width="18" height="48" rx="9" fill="#0B0D12" stroke="#FFFFFF" stroke-opacity="0.2"/><circle cx="285" cy="90" r="4" fill="#F04444"/><circle cx="285" cy="102" r="4" fill="#F8B84E"/><circle cx="285" cy="114" r="4" fill="#56D364"/></g>');
  }
  if (decorations.priority) {
    items.push('<g><rect x="60" y="244" width="20" height="20" transform="rotate(45 70 254)" fill="#F4C84A"/><rect x="64" y="248" width="12" height="12" transform="rotate(45 70 254)" fill="#FFFFFF"/></g>');
  }
  if (decorations.parkedVehicle) {
    items.push('<g opacity="0.9"><rect x="58" y="152" width="22" height="48" rx="10" fill="#7C8AA5"/><text x="69" y="180" fill="#FFFFFF" font-size="10" font-family="Arial" text-anchor="middle">P</text></g>');
  }
  if (decorations.curb) {
    items.push('<line x1="44" y1="302" x2="318" y2="302" stroke="#BFC8D7" stroke-opacity="0.7" stroke-width="6"/>');
  }

  return items.join("");
}

function renderVehicle(
  label: "A" | "B",
  state: SceneSketchSuggestion["vehicleAState"],
  color: string,
  arrowColor: string,
  markerId: string
) {
  return `
    <g transform="translate(${state.x} ${state.y}) rotate(${state.rotation})">
      <rect x="-18" y="-34" width="36" height="68" rx="16" fill="${color}" />
      <rect x="-12" y="-22" width="24" height="26" rx="9" fill="#FFFFFF" fill-opacity="0.18" />
      <text x="0" y="50" fill="#FFFFFF" font-size="16" font-family="Arial" font-weight="700" text-anchor="middle">${label}</text>
    </g>
    <path d="${arrowPath(state.x, state.y - 44, state.direction)}" fill="none" marker-end="url(#${markerId})" stroke="${arrowColor}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  `;
}

export function renderSceneSketchDataUrl(
  sketch: SceneSketchSuggestion,
  locationLabel?: string | null
) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="360" height="340" viewBox="0 0 360 340">
      <defs>
        <marker id="arrow-red" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M 0 0 L 6 3 L 0 6 z" fill="#FF9A9D" />
        </marker>
        <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M 0 0 L 6 3 L 0 6 z" fill="#7CB2FF" />
        </marker>
      </defs>
      <rect width="360" height="340" rx="32" fill="#0B0D12"/>
      ${renderBackground(sketch.laneType, sketch.decorations)}
      ${renderDecorations(sketch.decorations)}
      ${renderVehicle("A", sketch.vehicleAState, "#FF5A5F", "#FF9A9D", "arrow-red")}
      ${renderVehicle("B", sketch.vehicleBState, "#2F80FF", "#7CB2FF", "arrow-blue")}
      <g transform="translate(${sketch.impactPoint.x} ${sketch.impactPoint.y})">
        <line x1="-10" y1="-10" x2="10" y2="10" stroke="#FFD54A" stroke-width="4" stroke-linecap="round"/>
        <line x1="-10" y1="10" x2="10" y2="-10" stroke="#FFD54A" stroke-width="4" stroke-linecap="round"/>
      </g>
      ${sketch.drawPaths
        .filter((path) => path.points.length > 1)
        .map(
          (path) =>
            `<polyline points="${path.points.map((point) => `${point.x},${point.y}`).join(" ")}" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.82"/>`
        )
        .join("")}
      <text x="28" y="20" fill="#FFFFFF" fill-opacity="0.62" font-size="12" font-family="Arial">
        ${locationLabel || "Skica nezgode"}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export async function mockDamageRecognition(photo?: PhotoAsset): Promise<DamageSuggestion> {
  await new Promise((resolve) => window.setTimeout(resolve, 300));
  const seed = (photo?.id || "damage").slice(-4);
  const zone = DAMAGE_ZONE_OPTIONS[deterministicIndex(seed, DAMAGE_ZONE_OPTIONS.length)];

  return {
    status: "pending",
    sourcePhotoId: photo?.id || null,
    suggestedZone: zone,
    manualZone: zone
  };
}
