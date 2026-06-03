import type { ReportDraft } from "../types";
import { generateReportPdf } from "../features/e-report/pdf-template/generate-report-pdf";

export async function generatePdf(report: ReportDraft) {
  return generateReportPdf(report);
}

export async function generateProgrammaticPdf(report: ReportDraft) {
  return generateReportPdf(report);
}
