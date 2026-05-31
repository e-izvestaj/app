import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { getActiveDraftId, getAllReports } from "../lib/indexedDb";
import { createEmptyReport, reportTitle } from "../lib/utils";
import type { ReportDraft } from "../types";

function SplashIntro({ onDone }: { onDone: () => void }) {
  const [showSubline, setShowSubline] = useState(false);

  useEffect(() => {
    const subtitleTimeout = window.setTimeout(() => setShowSubline(true), 900);
    const closeTimeout = window.setTimeout(onDone, 1400);

    return () => {
      window.clearTimeout(subtitleTimeout);
      window.clearTimeout(closeTimeout);
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg">
      <div className="text-center">
        <div className="typewriter-title text-[42px] font-semibold tracking-[0.08em] text-white">
          E-Izvestaj
        </div>
        <div
          className={`mt-3 text-sm uppercase tracking-[0.28em] text-white/55 transition duration-500 ${
            showSubline ? "opacity-100" : "opacity-0"
          }`}
        >
          by AutoPulse
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [reports, setReports] = useState<ReportDraft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const logoSrc = `${import.meta.env.BASE_URL}logo.png`;

  const refreshReports = useCallback(() => {
    void (async () => {
      const [allReports, activeId] = await Promise.all([getAllReports(), getActiveDraftId()]);
      setReports(allReports);
      setActiveDraftId(activeId);
    })();
  }, []);

  useEffect(() => {
    refreshReports();
  }, [refreshReports]);

  const completedReports = useMemo(
    () =>
      reports.filter(
        (report) =>
          report.status === "locked" ||
          report.status === "completed" ||
          Boolean(report.pdfDataUrl)
      ),
    [reports]
  );

  const startNewReport = () => {
    const report = createEmptyReport();
    navigate(`/report/${report.id}`, { state: { report } });
  };

  return (
    <>
      {showSplash ? <SplashIntro onDone={() => setShowSplash(false)} /> : null}

      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-10 pt-6">
        <div className="mb-8 text-center">
          <img alt="AutoPulse logo" className="mx-auto h-24 w-auto" src={logoSrc} />
          <h1 className="mt-5 text-[38px] font-semibold text-white">E-Izvestaj</h1>
          <div className="mt-2 text-sm uppercase tracking-[0.28em] text-white/45">by AutoPulse</div>
        </div>

        <div className="space-y-4">
          <Card className="border border-accent/25 bg-[radial-gradient(circle_at_top_left,rgba(47,128,255,0.26),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.28em] text-white/45">Glavne akcije</div>
              <Button onClick={startNewReport} type="button">
                Kreiraj novi e-Izvestaj
              </Button>
              <Button onClick={() => navigate("/participant")} type="button" variant="secondary">
                Popuni moje podatke za drugi izvestaj
              </Button>
              <Button
                disabled={!activeDraftId}
                onClick={() => activeDraftId && navigate(`/report/${activeDraftId}`)}
                type="button"
                variant="secondary"
              >
                Nastavi sacuvani izvestaj
              </Button>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="text-lg font-semibold text-white">Zavrseni izvestaji</div>
            {completedReports.length ? (
              completedReports.map((report) => (
                <button
                  key={report.id}
                  className="flex w-full items-center justify-between rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:bg-white/8"
                  onClick={() => navigate(`/report/${report.id}?view=final`)}
                  type="button"
                >
                  <span className="text-white">{reportTitle(report)}</span>
                  <span className="text-xs uppercase tracking-[0.22em] text-white/40">PDF</span>
                </button>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/45">
                Nema sacuvanih zavrsnih izvestaja.
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
