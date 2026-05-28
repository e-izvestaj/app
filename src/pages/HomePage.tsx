import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import { getActiveDraftId, getAllReports } from "../lib/indexedDb";
import { createEmptyReport, reportTitle } from "../lib/utils";
import type { ReportDraft } from "../types";

function SplashIntro({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(onDone, 2250);
    return () => window.clearTimeout(timeout);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg">
      <div className="animate-[fadeIn_500ms_ease,glowPulse_2400ms_ease] text-center">
        <div className="text-[44px] font-semibold tracking-[0.08em] text-white">e-Izvestaj</div>
        <div className="mt-2 text-sm uppercase tracking-[0.35em] text-white/45">
          part of AutoPulse
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [reports, setReports] = useState<ReportDraft[]>([]);
  const [activeDraftId, setActiveDraft] = useState<string | null>(null);
  const logoSrc = `${import.meta.env.BASE_URL}logo.png`;

  useEffect(() => {
    void (async () => {
      const [allReports, activeId] = await Promise.all([getAllReports(), getActiveDraftId()]);
      setReports(allReports);
      setActiveDraft(activeId);
    })();
  }, []);

  const lockedReports = useMemo(
    () => reports.filter((report) => report.status === "locked" || report.status === "completed"),
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
        <div className="mb-8">
          <img alt="e-Izvestaj logo" className="h-16 w-auto" src={logoSrc} />
          <div className="mt-6">
            <div className="text-sm uppercase tracking-[0.35em] text-white/35">AutoPulse</div>
            <h1 className="mt-2 text-[36px] font-semibold text-white">e-Izvestaj</h1>
            <p className="mt-3 max-w-xs text-sm leading-6 text-white/60">
              OCR, review, potpisi, lock, PDF i QR share u jednom mirnom mobilnom toku.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="bg-[radial-gradient(circle_at_top_left,rgba(47,128,255,0.24),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
            <div className="space-y-4">
              <div>
                <div className="text-xs uppercase tracking-[0.32em] text-white/40">
                  Pokreni
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">Novi e-Izvestaj</div>
              </div>
              <Button onClick={startNewReport} type="button">
                Novi e-Izvestaj
              </Button>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-semibold text-white">Nastavi</div>
              <div className="text-xs text-white/40">Draft storage</div>
            </div>
            <Button
              disabled={!activeDraftId}
              onClick={() => activeDraftId && navigate(`/report/${activeDraftId}`)}
              type="button"
              variant="secondary"
            >
              Nastavi nedovrsen izvestaj
            </Button>
          </Card>

          <Card className="space-y-4">
            <div className="text-lg font-semibold text-white">Zakljucani izvestaji</div>
            {lockedReports.length ? (
              lockedReports.map((report) => (
                <button
                  key={report.id}
                  className="flex w-full items-center justify-between rounded-[22px] bg-white/5 px-4 py-4 text-left"
                  onClick={() => navigate(`/report/${report.id}?view=final`)}
                  type="button"
                >
                  <span className="text-white">{reportTitle(report)}</span>
                  <span className="text-xs text-white/45">Read-only</span>
                </button>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/45">
                Jos nema zakljucanih izvestaja.
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
