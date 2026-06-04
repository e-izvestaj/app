import { useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";

type Props = {
  pdfUrl: string | null;
  zipReady: boolean;
  reportId: string;
  documents: Array<{
    dataUrl: string;
    label: string;
  }>;
  onPreview: () => void;
  onSaveZip: () => void;
  onShareZip: () => Promise<string>;
};

export default function ShareStep({
  pdfUrl,
  zipReady,
  reportId,
  documents,
  onPreview,
  onSaveZip,
  onShareZip
}: Props) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [documentsOpen, setDocumentsOpen] = useState(false);

  const shareZip = async () => {
    setIsSharing(true);
    setShareMessage(null);

    try {
      setShareMessage(await onShareZip());
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setShareMessage("ZIP paket nije podeljen. Pokusaj ponovo ili ga preuzmi na telefon.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-[30px] font-semibold text-white">Izvestaj je spreman</h2>

      <Card className="space-y-4 border border-accent/25 bg-[radial-gradient(circle_at_top_left,rgba(47,128,255,0.22),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
        <div className="text-xs uppercase tracking-[0.28em] text-white/40">Broj izvestaja</div>
        <div className="text-3xl font-semibold text-white">{reportId}</div>
      </Card>

      <Card className="space-y-3">
        <div className="text-xs uppercase tracking-[0.28em] text-white/40">Pregled</div>
        <Button disabled={!pdfUrl} onClick={onPreview} type="button" variant="secondary">
          Pregledaj e-izvestaj.pdf
        </Button>
        <Button disabled={!documents.length} onClick={() => setDocumentsOpen(true)} type="button" variant="secondary">
          Pregledaj dokumenta
        </Button>
      </Card>

      <Card className="space-y-3 border border-emerald-300/25 bg-emerald-500/8">
        <div className="text-xs uppercase tracking-[0.28em] text-emerald-100/60">Kompletan ZIP paket</div>
        <div className="text-sm text-white/65">Podeli isti paket ucesniku B i osiguranju.</div>
        <Button disabled={!pdfUrl || !zipReady || isSharing} onClick={() => void shareZip()} type="button" variant="success">
          {isSharing ? "Otvaram deljenje..." : zipReady ? "Podeli e-izvestaj.zip" : "Pripremam e-izvestaj.zip..."}
        </Button>
        <Button disabled={!pdfUrl || !zipReady || isSharing} onClick={onSaveZip} type="button" variant="secondary">
          Preuzmi e-izvestaj.zip
        </Button>
        {shareMessage ? (
          <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
            {shareMessage}
          </div>
        ) : null}
      </Card>

      {documentsOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-bg/98 px-4 py-6">
          <div className="mx-auto w-full max-w-3xl space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-2xl font-semibold text-white">Dokumenta, slike i skica</h3>
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
    </div>
  );
}
