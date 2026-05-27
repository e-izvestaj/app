import type { ReportDraft } from "../../types";
import { stepTitles } from "./constants";

export function getActiveStepTitles(report: ReportDraft) {
  if (report.safety.vehiclesInPosition === false) {
    return stepTitles.filter((step) => step !== "Scene Capture");
  }

  return [...stepTitles];
}
