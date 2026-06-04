import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Button from "./Button";
import Card from "./Card";
import DocumentCropper from "./DocumentCropper";

type Props = {
  title: string;
  onCapture: (files: FileList) => Promise<void> | void;
  helper?: string;
  disabled?: boolean;
  buttonLabel?: string;
  multiple?: boolean;
  crop?: boolean;
};

export default function Camera({
  title,
  onCapture,
  helper,
  disabled = false,
  buttonLabel,
  multiple = true,
  crop = false
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"neutral" | "error" | "success">("neutral");
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);

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

  const saveFiles = async (files: FileList) => {
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
    }
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

    if (crop && files.length === 1) {
      setPendingCropFile(files[0]);
      setIsPicking(false);
      setStatusTone("neutral");
      setStatusMessage("Podesi ivice dokumenta pre čuvanja.");
      event.target.value = "";
      return;
    }

    await saveFiles(files);
    event.target.value = "";
  };

  const saveCroppedFile = async (file: File) => {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    setPendingCropFile(null);
    await saveFiles(transfer.files);
  };

  return (
    <>
      <Card className="space-y-4 bg-gradient-to-b from-white/10 to-white/5">
        <div className="text-lg font-semibold text-white">{title}</div>
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept="image/*"
          capture="environment"
          multiple={multiple}
          onChange={handleChange}
        />
        <Button disabled={disabled} onClick={handleOpenPicker} type="button">
          {isPicking ? "Otvaram kameru..." : buttonLabel || "Otvori kameru"}
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

      {pendingCropFile ? (
        <DocumentCropper
          file={pendingCropFile}
          onCancel={() => {
            setPendingCropFile(null);
            setStatusTone("neutral");
            setStatusMessage("Crop dokumenta je otkazan.");
          }}
          onConfirm={saveCroppedFile}
        />
      ) : null}
    </>
  );
}
