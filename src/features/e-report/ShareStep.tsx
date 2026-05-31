import { useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";

type Props = {
  pdfUrl: string | null;
  reportId: string;
  onPreview: () => void;
  onSave: () => void;
  onSaveZip: () => void;
  onEmail: () => void;
  onWhatsApp: () => void;
  onViber: () => void;
};

export default function ShareStep({
  pdfUrl,
  reportId,
  onPreview,
  onSave,
  onSaveZip,
  onEmail,
  onWhatsApp,
  onViber
}: Props) {
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  return (
    <div className="space-y-4">
      <h2 className="text-[30px] font-semibold text-white">Izveštaj je spreman</h2>

      <Card className="space-y-4 border border-accent/25 bg-[radial-gradient(circle_at_top_left,rgba(47,128,255,0.22),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
        <div className="text-xs uppercase tracking-[0.28em] text-white/40">Broj izveštaja</div>
        <div className="text-3xl font-semibold text-white">{reportId}</div>
      </Card>

      <Card className="space-y-3">
        <Button disabled={!pdfUrl} onClick={onPreview} type="button" variant="secondary">
          Prikazi PDF
        </Button>
        <Button disabled={!pdfUrl} onClick={onSave} type="button">
          Snimi PDF
        </Button>
        <Button disabled={!pdfUrl} onClick={onSaveZip} type="button" variant="secondary">
          Snimi ZIP paket
        </Button>
      </Card>

      <Card className="space-y-3">
        <div className="text-xs uppercase tracking-[0.28em] text-white/40">Podeli PDF</div>
        <Button
          disabled={!pdfUrl}
          onClick={() => setShareMenuOpen((current) => !current)}
          type="button"
          variant="secondary"
        >
          {shareMenuOpen ? "Zatvori opcije" : "Podeli PDF"}
        </Button>
        {shareMenuOpen ? (
          <div className="space-y-3 rounded-[24px] border border-white/10 bg-white/5 p-3">
            <Button disabled={!pdfUrl} onClick={onEmail} type="button" variant="secondary">
              Mail
            </Button>
            <Button disabled={!pdfUrl} onClick={onWhatsApp} type="button" variant="secondary">
              WhatsApp
            </Button>
            <Button disabled={!pdfUrl} onClick={onViber} type="button" variant="secondary">
              Viber
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
