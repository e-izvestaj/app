import Button from "../../components/Button";
import Card from "../../components/Card";

type Props = {
  pdfUrl: string | null;
  qrCodeDataUrl: string | null;
  reportId: string;
  reportUrl: string;
  onShare: () => Promise<void>;
  onSave: () => void;
  onEmail: () => void;
  onWhatsApp: () => void;
  onCopyReportId: () => Promise<void>;
};

export default function ShareStep({
  pdfUrl,
  qrCodeDataUrl,
  reportId,
  reportUrl,
  onShare,
  onSave,
  onEmail,
  onWhatsApp,
  onCopyReportId
}: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-[30px] font-semibold text-white">e-Izveštaj uspešno kreiran</h2>

      <Card className="space-y-4 bg-[radial-gradient(circle_at_top_left,rgba(47,128,255,0.24),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
        <div className="text-xs uppercase tracking-[0.28em] text-white/40">Report ID</div>
        <div className="text-3xl font-semibold text-white">{reportId}</div>
        {qrCodeDataUrl ? (
          <div className="overflow-hidden rounded-[28px] bg-white p-4">
            <img alt="QR code" className="mx-auto h-52 w-52" src={qrCodeDataUrl} />
          </div>
        ) : null}
        <a
          className="block text-center text-sm text-white/55 underline"
          href={reportUrl}
          rel="noreferrer"
          target="_blank"
        >
          Otvori read-only kopiju
        </a>
      </Card>

      <Card className="space-y-3">
        <Button onClick={onSave} type="button">
          Download PDF
        </Button>
        <Button onClick={onShare} type="button" variant="secondary">
          Share PDF
        </Button>
        <Button onClick={onEmail} type="button" variant="secondary">
          Email
        </Button>
        <Button onClick={onWhatsApp} type="button" variant="secondary">
          WhatsApp
        </Button>
        <Button onClick={onCopyReportId} type="button" variant="ghost">
          Copy Report ID
        </Button>
      </Card>

      {pdfUrl ? (
        <a
          className="block text-center text-sm text-white/55 underline"
          href={pdfUrl}
          rel="noreferrer"
          target="_blank"
        >
          Otvori finalni PDF
        </a>
      ) : null}
    </div>
  );
}
