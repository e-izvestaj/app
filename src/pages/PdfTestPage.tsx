import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import { generatePdf } from "../lib/pdf";
import { createPdfTestReport } from "../features/e-report/pdf-template/sampleReport";

type PdfPreviewState = {
  url: string | null;
  loading: boolean;
  error: string | null;
};

export default function PdfTestPage() {
  const report = useMemo(() => createPdfTestReport(), []);
  const [state, setState] = useState<PdfPreviewState>({
    url: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let revokedUrl: string | null = null;
    let cancelled = false;

    const run = async () => {
      setState({ url: null, loading: true, error: null });
      try {
        const pdf = await generatePdf(report);
        if (cancelled) {
          URL.revokeObjectURL(pdf.url);
          return;
        }
        revokedUrl = pdf.url;
        setState({ url: pdf.url, loading: false, error: null });
      } catch (error) {
        if (!cancelled) {
          setState({
            url: null,
            loading: false,
            error: error instanceof Error ? error.message : "PDF preview nije uspela.",
          });
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (revokedUrl) {
        URL.revokeObjectURL(revokedUrl);
      }
    };
  }, [report]);

  const regenerate = async () => {
    if (state.url) {
      URL.revokeObjectURL(state.url);
    }
    setState({ url: null, loading: true, error: null });
    try {
      const pdf = await generatePdf(report);
      setState({ url: pdf.url, loading: false, error: null });
    } catch (error) {
      setState({
        url: null,
        loading: false,
        error: error instanceof Error ? error.message : "PDF preview nije uspela.",
      });
    }
  };

  const savePdf = () => {
    if (!state.url) {
      return;
    }
    const link = document.createElement("a");
    link.href = state.url;
    link.download = `${report.publicId}.pdf`;
    link.click();
  };

  const openPdf = () => {
    if (!state.url) {
      return;
    }
    window.open(state.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#0a101b] px-4 py-6 text-white">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.35em] text-white/45">PDF Test</div>
          <h1 className="text-3xl font-semibold">Fillable EI template test</h1>
          <p className="max-w-4xl text-sm text-white/65">
            Ovaj ekran generise stvarni PDF iz fillable template-a i puni ga sample app podacima.
          </p>
        </div>

        <Card className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void regenerate()} type="button" variant="secondary">
            Generisi ponovo
          </Button>
          <Button disabled={!state.url} onClick={openPdf} type="button" variant="secondary">
            Otvori PDF
          </Button>
          <Button disabled={!state.url} onClick={savePdf} type="button">
            Snimi PDF
          </Button>
          <div className="text-sm text-white/55">Sample ID: {report.publicId}</div>
        </Card>

        <Card className="space-y-3">
          <div className="grid gap-3 text-sm text-white/70 md:grid-cols-4">
            <div className="rounded-[18px] bg-white/5 p-4">
              <div className="text-white/40">Datum</div>
              <div className="mt-2 text-white">{report.location.date}</div>
            </div>
            <div className="rounded-[18px] bg-white/5 p-4">
              <div className="text-white/40">Vreme</div>
              <div className="mt-2 text-white">{report.location.time}</div>
            </div>
            <div className="rounded-[18px] bg-white/5 p-4">
              <div className="text-white/40">Vozilo A</div>
              <div className="mt-2 text-white">{report.vehicleA.plate}</div>
            </div>
            <div className="rounded-[18px] bg-white/5 p-4">
              <div className="text-white/40">Vozilo B</div>
              <div className="mt-2 text-white">{report.vehicleB.plate}</div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#dadada] p-4">
            {state.loading ? (
              <div className="py-20 text-center text-sm text-black/70">Generisem PDF...</div>
            ) : state.error ? (
              <div className="py-20 text-center text-sm text-red-700">{state.error}</div>
            ) : state.url ? (
              <iframe className="h-[calc(100vh-260px)] min-h-[900px] w-full rounded-[16px] bg-white" src={state.url} title="PDF preview" />
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
