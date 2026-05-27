import Button from "../../components/Button";
import Card from "../../components/Card";

type Props = {
  pdfUrl: string | null;
  onShare: () => Promise<void>;
  onSave: () => void;
  onEmail: () => void;
  onWhatsApp: () => void;
};

export default function ShareStep({ pdfUrl, onShare, onSave, onEmail, onWhatsApp }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Share.</h2>
        <p className="text-sm text-white/60">Dokument je spreman za cuvanje i slanje.</p>
      </div>
      <Card className="space-y-3">
        <Button onClick={onSave} type="button">
          Sacuvaj PDF
        </Button>
        <Button onClick={onShare} type="button" variant="secondary">
          Share
        </Button>
        <Button onClick={onEmail} type="button" variant="secondary">
          Email
        </Button>
        <Button onClick={onWhatsApp} type="button" variant="secondary">
          WhatsApp
        </Button>
      </Card>
      {pdfUrl ? (
        <a
          className="block text-center text-sm text-white/55 underline"
          href={pdfUrl}
          rel="noreferrer"
          target="_blank"
        >
          Otvori PDF preview
        </a>
      ) : null}
    </div>
  );
}
