import type { DamageSuggestion, DamageZone, PhotoAsset, SceneSketchSuggestion } from "../types";
import { DAMAGE_ZONE_OPTIONS } from "./utils";

function deterministicIndex(seed: string, max: number) {
  return (
    seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % Math.max(1, max)
  );
}

export async function mockDamageRecognition(photo?: PhotoAsset): Promise<DamageSuggestion> {
  await new Promise((resolve) => window.setTimeout(resolve, 600));
  const seed = (photo?.id || "damage").slice(-4);
  const zone = DAMAGE_ZONE_OPTIONS[deterministicIndex(seed, DAMAGE_ZONE_OPTIONS.length)];

  return {
    status: "pending",
    sourcePhotoId: photo?.id || null,
    suggestedZone: zone,
    manualZone: zone
  };
}

function sketchSvg({
  laneType,
  vehicleAPosition,
  vehicleBPosition
}: Pick<SceneSketchSuggestion, "laneType" | "vehicleAPosition" | "vehicleBPosition">) {
  const laneFill =
    laneType === "intersection" ? "#1c2330" : laneType === "parking" ? "#171b25" : "#131722";
  const aX = vehicleAPosition === "left" ? 78 : vehicleAPosition === "center" ? 132 : 186;
  const bX = vehicleBPosition === "left" ? 78 : vehicleBPosition === "center" ? 132 : 186;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="264" height="180" viewBox="0 0 264 180">
      <rect width="264" height="180" rx="24" fill="#0B0D12"/>
      <rect x="24" y="24" width="216" height="132" rx="20" fill="${laneFill}" stroke="#2F80FF" stroke-opacity="0.24"/>
      <line x1="132" y1="26" x2="132" y2="154" stroke="#FFFFFF" stroke-opacity="0.25" stroke-dasharray="8 8"/>
      ${
        laneType === "intersection"
          ? '<line x1="26" y1="90" x2="238" y2="90" stroke="#FFFFFF" stroke-opacity="0.25" stroke-dasharray="8 8"/>'
          : ""
      }
      <rect x="${aX}" y="40" width="26" height="62" rx="12" fill="#2F80FF"/>
      <rect x="${bX}" y="88" width="26" height="62" rx="12" fill="#F4C84A"/>
      <circle cx="${aX + 13}" cy="106" r="8" fill="#FF4D4F"/>
      <text x="${aX + 13}" y="35" fill="#FFFFFF" font-size="12" font-family="Arial" text-anchor="middle">A</text>
      <text x="${bX + 13}" y="165" fill="#FFFFFF" font-size="12" font-family="Arial" text-anchor="middle">B</text>
    </svg>
  `;
}

export async function mockSceneSketchSuggestion(photo?: PhotoAsset): Promise<SceneSketchSuggestion> {
  await new Promise((resolve) => window.setTimeout(resolve, 700));
  const seed = (photo?.id || "scene").slice(-4);
  const laneModes: SceneSketchSuggestion["laneType"][] = ["straight", "intersection", "parking"];
  const laneType = laneModes[deterministicIndex(seed, laneModes.length)];
  const vehicleAPosition: SceneSketchSuggestion["vehicleAPosition"] = "left";
  const vehicleBPosition: SceneSketchSuggestion["vehicleBPosition"] =
    laneType === "straight" ? "center" : "right";
  const svg = sketchSvg({ laneType, vehicleAPosition, vehicleBPosition });

  return {
    status: "pending",
    scenePhotoId: photo?.id || null,
    summary:
      laneType === "intersection"
        ? "Predlog: vozila su u konfliktnoj tački raskrsnice."
        : laneType === "parking"
          ? "Predlog: jedno vozilo izlazi sa parkinga, drugo prolazi pored."
          : "Predlog: vozila se kreću istim smerom u jednoj saobraćajnoj osi.",
    svgDataUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    laneType,
    vehicleAPosition,
    vehicleBPosition
  };
}

export function regenerateSceneSketch(
  input: Pick<SceneSketchSuggestion, "laneType" | "vehicleAPosition" | "vehicleBPosition" | "summary" | "scenePhotoId" | "status">
): SceneSketchSuggestion {
  const svg = sketchSvg(input);
  return {
    ...input,
    svgDataUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  };
}
