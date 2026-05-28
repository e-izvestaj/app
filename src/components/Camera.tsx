import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Button from "./Button";
import Card from "./Card";

type Props = {
  title: string;
  onCapture: (files: FileList) => Promise<void> | void;
  helper?: string;
  disabled?: boolean;
};

export default function Camera({ title, onCapture, helper, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"neutral" | "error" | "success">("neutral");

  useEffect(() => {
    if (!isPicking) {
      return;
    }

    const handleFocus = () => {
      window.setTimeout(() => {
        if (!inputRef.current?.files?.length) {
          setIsPicking(false);
          setStatusTone("neutral");
          setStatusMessage("Nije izabrana fotografija.");
        }
      }, 250);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [isPicking]);

  const handleOpenPicker = () => {
    if (disabled) {
      setStatusTone("neutral");
      setStatusMessage("Ovaj deo zapisnika je zakljucan i vise nije moguce dodavati fotografije.");
      return;
    }

    if (!inputRef.current) {
      setStatusTone("error");
      setStatusMessage("Browser ne podrzava otvaranje kamere iz ovog prikaza.");
      return;
    }

    setIsPicking(true);
    setStatusTone("neutral");
    setStatusMessage("Otvaram kameru ili galeriju...");
    inputRef.current.click();
  };

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files?.length) {
      setIsPicking(false);
      setStatusTone("neutral");
      setStatusMessage("Nije izabrana fotografija.");
      event.target.value = "";
      return;
    }

    try {
      await onCapture(files);
      setStatusTone("success");
      setStatusMessage(
        files.length === 1
          ? "Fotografija je uspesno dodata u izvestaj."
          : "Fotografije su uspesno dodate u izvestaj."
      );
    } catch {
      setStatusTone("error");
      setStatusMessage("Nisam uspeo da obradim odabranu fotografiju. Pokusaj ponovo.");
    } finally {
      setIsPicking(false);
      event.target.value = "";
    }
  };

  return (
    <Card className="space-y-4 bg-gradient-to-b from-white/10 to-white/5">
      <div>
        <div className="text-lg font-semibold text-white">{title}</div>
        {helper ? <p className="mt-1 text-sm text-white/60">{helper}</p> : null}
      </div>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleChange}
      />
      <Button disabled={disabled} onClick={handleOpenPicker} type="button">
        {isPicking ? "Otvaram kameru..." : "Otvori kameru"}
      </Button>
      {statusMessage ? (
        <div
          className={`rounded-[20px] px-4 py-3 text-sm ${
            statusTone === "error"
              ? "border border-red-400/25 bg-red-500/12 text-red-100"
              : statusTone === "success"
                ? "border border-emerald-400/25 bg-emerald-500/12 text-emerald-100"
                : "border border-white/10 bg-white/6 text-white/65"
          }`}
        >
          {statusMessage}
        </div>
      ) : null}
    </Card>
  );
}
