import { useEffect, useMemo, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import Button from "../../components/Button";
import Card from "../../components/Card";

type SignatureKey = "a" | "b";

type Props = {
  signatures: {
    a: string | null;
    b: string | null;
  };
  signatureTimestamps: {
    a: string | null;
    b: string | null;
  };
  onChange: (
    next: { a: string | null; b: string | null },
    timestamps?: { a: string | null; b: string | null }
  ) => void;
  readOnly?: boolean;
  statusLabel: string;
};

function SignatureModal({
  open,
  label,
  signatureKey,
  signatures,
  signatureTimestamps,
  onClose,
  onChange
}: {
  open: boolean;
  label: string;
  signatureKey: SignatureKey;
  signatures: Props["signatures"];
  signatureTimestamps: Props["signatureTimestamps"];
  onClose: () => void;
  onChange: Props["onChange"];
}) {
  const ref = useRef<any>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const lockLandscape = async () => {
      try {
        const orientation = screen.orientation as ScreenOrientation & {
          lock?: (orientation: "landscape") => Promise<void>;
          unlock?: () => void;
        };
        await orientation.lock?.("landscape");
      } catch {
        // Orientation lock is best-effort only.
      }
    };

    void lockLandscape();

    return () => {
      try {
        const orientation = screen.orientation as ScreenOrientation & {
          unlock?: () => void;
        };
        orientation.unlock?.();
      } catch {
        // Ignore unlock errors on unsupported browsers.
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const saveSignature = () => {
    const canvas = ref.current?.getTrimmedCanvas();
    if (!canvas) {
      return;
    }

    const dataUrl = canvas.toDataURL("image/png");
    onChange(
      { ...signatures, [signatureKey]: dataUrl },
      { ...signatureTimestamps, [signatureKey]: new Date().toISOString() }
    );
    onClose();
  };

  const clear = () => {
    ref.current?.clear();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <div className="flex items-center justify-between px-4 py-4 text-white">
        <button onClick={onClose} type="button">
          Odustani
        </button>
        <div className="text-sm uppercase tracking-[0.3em] text-white/50">Potpisivanje</div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="space-y-3 text-center">
          <div className="text-2xl font-semibold text-white">{label}</div>
          <div className="text-sm text-white/60">
            Okreni telefon vodoravno i potpisi se preko cele linije.
          </div>
          <div className="text-xs uppercase tracking-[0.28em] text-white/35">↺ Landscape recommended ↻</div>
        </div>

        <div className="my-4 flex-1 rounded-[32px] border border-accent/25 bg-white p-3 shadow-glass">
          <div className="flex h-full items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white">
            <SignatureCanvas
              canvasProps={{ className: "h-[70vh] max-h-[420px] w-[92vw] max-w-[920px] bg-white" }}
              penColor="#0B0D12"
              ref={ref}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Button onClick={clear} type="button" variant="secondary">
            Obriši
          </Button>
          <Button onClick={onClose} type="button" variant="secondary">
            Odustani
          </Button>
          <Button onClick={saveSignature} type="button">
            Potvrdi
          </Button>
        </div>
      </div>
    </div>
  );
}

function SignatureCard({
  label,
  signatureKey,
  signatures,
  signatureTimestamps,
  onChange,
  readOnly = false
}: {
  label: string;
  signatureKey: SignatureKey;
  signatures: Props["signatures"];
  signatureTimestamps: Props["signatureTimestamps"];
  onChange: Props["onChange"];
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const currentSignature = signatures[signatureKey];
  const timestamp = signatureTimestamps[signatureKey];

  return (
    <>
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-base font-medium text-white">{label}</div>
          <div className="text-xs uppercase tracking-[0.24em] text-white/40">
            {currentSignature ? "Potpisano" : "Čeka potpis"}
          </div>
        </div>
        {currentSignature ? (
          <div className="space-y-2">
            <div className="overflow-hidden rounded-[24px] bg-white">
              <img alt={label} className="h-[140px] w-full object-contain" src={currentSignature} />
            </div>
            {timestamp ? (
              <div className="text-xs text-white/45">
                Sačuvano: {new Date(timestamp).toLocaleString("sr-RS")}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/12 px-4 py-8 text-center text-sm text-white/45">
            Potpis još nije dodat.
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button disabled={readOnly} onClick={() => setOpen(true)} type="button">
            {currentSignature ? "Potpiši ponovo" : "Potpiši"}
          </Button>
          <Button
            disabled={readOnly || !currentSignature}
            onClick={() =>
              onChange(
                { ...signatures, [signatureKey]: null },
                { ...signatureTimestamps, [signatureKey]: null }
              )
            }
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
        signatureTimestamps={signatureTimestamps}
      />
    </>
  );
}

export default function SignatureStep({
  signatures,
  signatureTimestamps,
  onChange,
  readOnly = false,
  statusLabel
}: Props) {
  const progressText = useMemo(() => {
    if (signatures.a && signatures.b) {
      return "Oba potpisa su sačuvana. Sledeće zaključavamo izveštaj i generišemo finalni PDF.";
    }
    if (signatures.a || signatures.b) {
      return "Jedan potpis je sačuvan. Potreban je još jedan da bi se izveštaj zaključao.";
    }
    return "Oba vozača potpisuju isti zapisnik na ovom telefonu.";
  }, [signatures.a, signatures.b]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Potpis A i B</h2>
        <p className="text-sm text-white/60">{progressText}</p>
      </div>
      <Card className="bg-white/5">
        <div className="text-xs uppercase tracking-[0.28em] text-white/40">Status zapisnika</div>
        <div className="mt-3 text-lg font-semibold text-white">{statusLabel}</div>
      </Card>
      <SignatureCard
        label="Potpis vozača A"
        onChange={onChange}
        readOnly={readOnly}
        signatureKey="a"
        signatures={signatures}
        signatureTimestamps={signatureTimestamps}
      />
      <SignatureCard
        label="Potpis vozača B"
        onChange={onChange}
        readOnly={readOnly}
        signatureKey="b"
        signatures={signatures}
        signatureTimestamps={signatureTimestamps}
      />
    </div>
  );
}
