import Button from "../../components/Button";
import Card from "../../components/Card";

type Props = {
  pdfUrl: string | null;
  reportId: string;
  onPreview: () => void;
  onShare: () => Promise<void>;
  onSave: () => void;
  onEmail: () => void;
  onWhatsApp: () => void;
  onViber: () => void;
};

export default function ShareStep({
  pdfUrl,
  reportId,
  onPreview,
  onShare,
  onSave,
  onEmail,
  onWhatsApp,
  onViber
}: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-[30px] font-semibold text-white">Izveštaj je spreman</h2>

      <Card className="space-y-4 border border-accent/25 bg-[radial-gradient(circle_at_top_left,rgba(47,128,255,0.22),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
        <div className="text-xs uppercase tracking-[0.28em] text-white/40">Broj izveštaja</div>
        <div className="text-3xl font-semibold text-white">{reportId}</div>
      </Card>

      <Card className="space-y-3">
        <Button disabled={!pdfUrl} onClick={onPreview} type="button" variant="secondary">
          Preview PDF
        </Button>
        <Button disabled={!pdfUrl} onClick={onShare} type="button">
          Share PDF
        </Button>
        <Button disabled={!pdfUrl} onClick={onSave} type="button" variant="secondary">
          Download PDF
        </Button>
        <Button disabled={!pdfUrl} onClick={onEmail} type="button" variant="secondary">
          Mail
        </Button>
        <Button disabled={!pdfUrl} onClick={onWhatsApp} type="button" variant="secondary">
          WhatsApp
        </Button>
        <Button disabled={!pdfUrl} onClick={onViber} type="button" variant="secondary">
          Viber
        </Button>
      </Card>
    </div>
  );
}
