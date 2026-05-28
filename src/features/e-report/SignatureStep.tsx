import { useMemo, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import Button from "../../components/Button";
import Card from "../../components/Card";

type SignatureKey = "a" | "b";

type Props = {
  signatures: {
    a: string | null;
    b: string | null;
  };
  onChange: (next: { a: string | null; b: string | null }) => void;
  readOnly?: boolean;
  statusLabel: string;
};

function SignatureModal({
  open,
  label,
  signatureKey,
  signatures,
  onClose,
  onChange
}: {
  open: boolean;
  label: string;
  signatureKey: SignatureKey;
  signatures: Props["signatures"];
  onClose: () => void;
  onChange: Props["onChange"];
}) {
  const ref = useRef<any>(null);

  if (!open) {
    return null;
  }

  const saveSignature = () => {
    const dataUrl = ref.current?.getTrimmedCanvas().toDataURL("image/png") || null;
    onChange({ ...signatures, [signatureKey]: dataUrl });
    onClose();
  };

  const clear = () => {
    ref.current?.clear();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <div className="flex items-center justify-between px-4 py-4 text-white">
        <button onClick={onClose} type="button">
          Nazad
        </button>
        <div className="text-sm uppercase tracking-[0.3em] text-white/50">Potpisivanje</div>
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.3em] text-white/40">Rotiraj telefon</div>
            <div className="mt-2 text-2xl font-semibold text-white">{label}</div>
            <p className="mt-2 text-sm text-white/60">
              Potpisi se na liniji. Drzi telefon vodoravno za prijatniji potpis.
            </p>
          </div>
          <div className="rounded-[32px] border border-accent/30 bg-white p-4 shadow-glass">
            <div className="origin-center rotate-90 overflow-hidden rounded-[24px] bg-white">
              <SignatureCanvas
                canvasProps={{ className: "h-[240px] w-full bg-white" }}
                penColor="#0B0D12"
                ref={ref}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={clear} type="button" variant="secondary">
              Reset
            </Button>
            <Button onClick={saveSignature} type="button">
              Sacuvaj potpis
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignatureCard({
  label,
  signatureKey,
  signatures,
  onChange,
  readOnly = false
}: {
  label: string;
  signatureKey: SignatureKey;
  signatures: Props["signatures"];
  onChange: Props["onChange"];
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const currentSignature = signatures[signatureKey];

  return (
    <>
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-base font-medium text-white">{label}</div>
          <div className="text-xs uppercase tracking-[0.24em] text-white/40">
            {currentSignature ? "Potpisano" : "Ceka potpis"}
          </div>
        </div>
        {currentSignature ? (
          <div className="overflow-hidden rounded-[24px] bg-white">
            <img alt={label} className="h-[120px] w-full object-contain" src={currentSignature} />
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/12 px-4 py-8 text-center text-sm text-white/45">
            Potpis jos nije dodat.
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button disabled={readOnly} onClick={() => setOpen(true)} type="button">
            {currentSignature ? "Ponovi potpis" : "Potpisi sada"}
          </Button>
          <Button
            disabled={readOnly || !currentSignature}
            onClick={() => onChange({ ...signatures, [signatureKey]: null })}
            type="button"
            variant="secondary"
          >
            Reset
          </Button>
        </div>
      </Card>
      <SignatureModal
        label={label}
        onChange={onChange}
        onClose={() => setOpen(false)}
        open={open}
        signatureKey={signatureKey}
        signatures={signatures}
      />
    </>
  );
}

export default function SignatureStep({
  signatures,
  onChange,
  readOnly = false,
  statusLabel
}: Props) {
  const progressText = useMemo(() => {
    if (signatures.a && signatures.b) {
      return "Oba potpisa su sacuvana. Izvestaj je spreman za zakljucavanje.";
    }
    if (signatures.a || signatures.b) {
      return "Jedan potpis je sacuvan. Potreban je jos jedan.";
    }
    return "Oba vozaca potpisuju isti zapisnik na ovom telefonu.";
  }, [signatures.a, signatures.b]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Potpisi.</h2>
        <p className="text-sm text-white/60">{progressText}</p>
      </div>
      <Card className="bg-white/5">
        <div className="text-xs uppercase tracking-[0.28em] text-white/40">Status zapisnika</div>
        <div className="mt-3 text-lg font-semibold text-white">{statusLabel}</div>
      </Card>
      <SignatureCard
        label="Potpis vozaca A"
        onChange={onChange}
        readOnly={readOnly}
        signatureKey="a"
        signatures={signatures}
      />
      <SignatureCard
        label="Potpis vozaca B"
        onChange={onChange}
        readOnly={readOnly}
        signatureKey="b"
        signatures={signatures}
      />
    </div>
  );
}
