import { useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import type { ReportDraft } from "../../types";
import DocumentationPackageView, { buildDocumentationShareText } from "./DocumentationPackageView";

type Props = {
  documents: Array<{
    dataUrl: string;
    label: string;
  }>;
  onPreview: () => void;
  pdfUrl: string | null;
  report: ReportDraft;
  reportId: string;
};

export default function ShareStep({
  documents,
  onPreview,
  pdfUrl,
  report,
  reportId
}: Props) {
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [packageOpen, setPackageOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const copyShareData = async () => {
    try {
      await navigator.clipboard.writeText(buildDocumentationShareText(report));
      setCopyMessage("Podaci su kopirani.");
    } catch {
      setCopyMessage("Kopiranje nije uspelo na ovom uredjaju.");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-[30px] font-semibold text-white">Izveštaj je spreman</h2>

      <Card className="space-y-4 border border-accent/25 bg-[radial-gradient(circle_at_top_left,rgba(47,128,255,0.22),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
        <div className="text-xs uppercase tracking-[0.28em] text-white/40">Broj izveštaja</div>
        <div className="text-3xl font-semibold text-white">{reportId}</div>
      </Card>

      <Card className="space-y-3">
        <div className="text-xs uppercase tracking-[0.28em] text-white/40">Pregled</div>
        <Button disabled={!pdfUrl} onClick={onPreview} type="button" variant="secondary">
          Pregledaj e-Izveštaj.pdf
        </Button>
        <Button disabled={!documents.length} onClick={() => setDocumentsOpen(true)} type="button" variant="secondary">
          Pregled dokumentacije
        </Button>
      </Card>

      <Card className="space-y-3 border border-emerald-300/25 bg-emerald-500/8">
        <div className="text-xs uppercase tracking-[0.28em] text-emerald-100/60">Podaci za slanje</div>
        <Button onClick={() => void copyShareData()} type="button" variant="success">
          Kopiraj podatke za slanje
        </Button>
        <Button onClick={() => setPackageOpen(true)} type="button" variant="secondary">
          Otvori HTML paket
        </Button>
        {copyMessage ? (
          <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
            {copyMessage}
          </div>
        ) : null}
      </Card>

      {documentsOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-bg/50 px-4 py-6">
          <div className="mx-auto w-full max-w-3xl space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-2xl font-semibold text-white">Dokumentacija</h3>
              <Button fullWidth={false} onClick={() => setDocumentsOpen(false)} type="button" variant="secondary">
                Zatvori
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {documents.map((document) => (
                <div className="overflow-hidden rounded-[8px] border border-white/10 bg-white/5" key={`${document.label}-${document.dataUrl.slice(-16)}`}>
                  <img alt={document.label} className="aspect-[4/3] w-full bg-white object-contain" src={document.dataUrl} />
                  <div className="px-3 py-3 text-sm text-white/70">{document.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {packageOpen ? <DocumentationPackageView documents={documents} onClose={() => setPackageOpen(false)} report={report} /> : null}
    </div>
  );
}
