import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import Card from "../components/Card";
import ReportWizard from "../features/e-report/ReportWizard";
import { getReport, saveReport, setActiveDraftId } from "../lib/indexedDb";
import { createEmptyReport, normalizeReport } from "../lib/utils";
import type { ReportDraft } from "../types";

type LocationState = {
  report?: ReportDraft;
};

export default function ReportPage() {
  const { reportId } = useParams();
  const location = useLocation();
  const [report, setReport] = useState<ReportDraft | null>(null);
  const forceReadOnly = new URLSearchParams(location.search).get("view") === "final";

  useEffect(() => {
    void (async () => {
      const routeState = location.state as LocationState | null;

      if (routeState?.report) {
        const seeded = normalizeReport(routeState.report);
        setReport(seeded);
        await saveReport(seeded);
        await setActiveDraftId(seeded.status === "locked" || seeded.status === "completed" ? null : seeded.id);
        return;
      }

      if (reportId) {
        const existing = await getReport(reportId);
        if (existing) {
          setReport(normalizeReport(existing));
          return;
        }
      }

      const empty = createEmptyReport();
      setReport(empty);
      await saveReport(empty);
      await setActiveDraftId(empty.id);
    })();
  }, [location.search, location.state, reportId]);

  if (!report) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
        <Card className="w-full text-center text-white/65">Ucitam izvestaj...</Card>
      </div>
    );
  }

  return <ReportWizard forceReadOnly={forceReadOnly} onReportChange={setReport} report={report} />;
}
