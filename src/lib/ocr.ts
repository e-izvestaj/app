import type { PhotoAsset, VehicleDraft } from "../types";

export type OcrMockResult = Pick<
  VehicleDraft,
  "plate" | "make" | "model" | "policyNumber" | "insurer"
>;

export async function mockOcrFromPhoto(photo?: PhotoAsset): Promise<OcrMockResult> {
  await new Promise((resolve) => window.setTimeout(resolve, 650));

  const seed = photo?.id.slice(-3).toUpperCase() || "001";

  return {
    plate: `BG-${seed}`,
    make: "Volkswagen",
    model: "Golf",
    policyNumber: `POL-${seed}-2026`,
    insurer: "AutoPulse Insurance"
  };
}
