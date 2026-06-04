import { useEffect, useRef, useState } from "react";
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
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const pendingSignatureRef = useRef<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({
    displayHeight: 540,
    displayWidth: 1200,
    height: 540,
    width: 1200
  });

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
        // Best effort only.
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
        // Ignore unlock errors.
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open || !canvasAreaRef.current) {
      return;
    }

    const area = canvasAreaRef.current;
    let resizeFrame = 0;

    const syncCanvasSize = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        const rect = area.getBoundingClientRect();
        const displayWidth = Math.max(1, Math.min(1200, rect.width, rect.height * (20 / 9)));
        const displayHeight = displayWidth * (9 / 20);
        const width = Math.max(1, Math.round(displayWidth));
        const height = Math.max(1, Math.round(displayHeight));

        if (ref.current && !ref.current.isEmpty?.()) {
          pendingSignatureRef.current = ref.current.getCanvas?.().toDataURL("image/png") || null;
        }

        setCanvasSize((current) =>
          current.width === width && current.height === height
            ? current
            : { displayHeight, displayWidth, height, width }
        );
      });
    };

    const resizeObserver = new ResizeObserver(syncCanvasSize);
    resizeObserver.observe(area);
    window.addEventListener("orientationchange", syncCanvasSize);
    window.addEventListener("resize", syncCanvasSize);
    syncCanvasSize();

    return () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      window.removeEventListener("orientationchange", syncCanvasSize);
      window.removeEventListener("resize", syncCanvasSize);
    };
  }, [open]);

  useEffect(() => {
    if (!pendingSignatureRef.current) {
      return;
    }

    const signature = pendingSignatureRef.current;
    pendingSignatureRef.current = null;
    window.requestAnimationFrame(() => {
      ref.current?.fromDataURL?.(signature, {
        height: canvasSize.height,
        width: canvasSize.width
      });
    });
  }, [canvasSize.height, canvasSize.width]);

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
    <div className="fixed inset-0 z-50 flex h-[100dvh] flex-col bg-bg">
      <div className="flex items-center justify-between px-4 py-4 text-white">
        <button onClick={onClose} type="button">
          Odustani
        </button>
        <div className="text-sm uppercase tracking-[0.3em] text-white/50">Potpisivanje</div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="space-y-2 text-center">
          <div className="text-2xl font-semibold text-white">{label}</div>
          <div className="text-sm text-white/55 md:hidden">Okreni telefon horizontalno za lakse potpisivanje.</div>
        </div>

        <div className="my-4 flex min-h-0 flex-1 items-center justify-center" ref={canvasAreaRef}>
          <div
            className="overflow-hidden rounded-[28px] border border-dashed border-slate-300 bg-white shadow-glass"
            style={{ height: canvasSize.displayHeight, width: canvasSize.displayWidth }}
          >
            <SignatureCanvas
              canvasProps={{
                className: "h-full w-full bg-white",
                height: canvasSize.height,
                width: canvasSize.width
              }}
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
  const requestedFullscreenRef = useRef(false);
  const currentSignature = signatures[signatureKey];
  const timestamp = signatureTimestamps[signatureKey];

  const openSignatureModal = async () => {
    if (window.matchMedia("(max-width: 767px)").matches && !document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        requestedFullscreenRef.current = true;
      } catch {
        // Fullscreen is best effort only; signing still works without it.
      }
    }
    setOpen(true);
  };

  const closeSignatureModal = () => {
    setOpen(false);
    if (requestedFullscreenRef.current && document.fullscreenElement) {
      requestedFullscreenRef.current = false;
      void document.exitFullscreen().catch(() => {
        // Ignore browsers that do not allow programmatic fullscreen exit.
      });
    }
  };

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
            <div className="aspect-[20/9] overflow-hidden rounded-[24px] bg-white">
              <img alt={label} className="h-full w-full object-contain" src={currentSignature} />
            </div>
            {timestamp ? (
              <div className="text-xs text-white/45">
                Sačuvano: {new Date(timestamp).toLocaleString("sr-RS")}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/12 px-4 py-8 text-center text-sm text-white/45">
            Nema potpisa.
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button disabled={readOnly} onClick={openSignatureModal} type="button">
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
        onClose={closeSignatureModal}
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
  return (
    <div className="space-y-4">
      <h2 className="text-[30px] font-semibold text-white">Potpis A i B</h2>
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
