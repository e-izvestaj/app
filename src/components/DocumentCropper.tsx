import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type Crop = { x: number; y: number; width: number; height: number };
type DragMode = "move" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | null;

type Props = {
  file: File;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

const MIN_SIZE = 0.12;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cropFile(file: File, image: HTMLImageElement, crop: Crop) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * crop.width));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * crop.height));
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Crop canvas nije dostupan.");
  }

  context.drawImage(
    image,
    image.naturalWidth * crop.x,
    image.naturalHeight * crop.y,
    image.naturalWidth * crop.width,
    image.naturalHeight * crop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Crop slike nije uspeo."));
          return;
        }
        const baseName = file.name.replace(/\.[^.]+$/, "") || "dokument";
        resolve(new File([blob], `${baseName}-crop.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  });
}

export default function DocumentCropper({ file, onCancel, onConfirm }: Props) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragModeRef = useRef<DragMode>(null);
  const startRef = useRef<{ x: number; y: number; crop: Crop } | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [crop, setCrop] = useState<Crop>({ x: 0.08, y: 0.16, width: 0.84, height: 0.68 });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pointFromEvent = (event: ReactPointerEvent<HTMLElement>) => {
    const bounds = imageRef.current?.getBoundingClientRect();
    if (!bounds) {
      return null;
    }
    return {
      x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
      y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1)
    };
  };

  const startDrag = (mode: DragMode, event: ReactPointerEvent<HTMLElement>) => {
    const point = pointFromEvent(event);
    if (!point) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragModeRef.current = mode;
    startRef.current = { ...point, crop };
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const mode = dragModeRef.current;
    const start = startRef.current;
    const point = pointFromEvent(event);
    if (!mode || !start || !point) {
      return;
    }

    const dx = point.x - start.x;
    const dy = point.y - start.y;
    const original = start.crop;

    if (mode === "move") {
      setCrop({
        ...original,
        x: clamp(original.x + dx, 0, 1 - original.width),
        y: clamp(original.y + dy, 0, 1 - original.height)
      });
      return;
    }

    const right = original.x + original.width;
    const bottom = original.y + original.height;
    const nextLeft = mode.includes("left") ? clamp(original.x + dx, 0, right - MIN_SIZE) : original.x;
    const nextRight = mode.includes("right") ? clamp(right + dx, original.x + MIN_SIZE, 1) : right;
    const nextTop = mode.includes("top") ? clamp(original.y + dy, 0, bottom - MIN_SIZE) : original.y;
    const nextBottom = mode.includes("bottom") ? clamp(bottom + dy, original.y + MIN_SIZE, 1) : bottom;

    setCrop({
      x: nextLeft,
      y: nextTop,
      width: nextRight - nextLeft,
      height: nextBottom - nextTop
    });
  };

  const endDrag = () => {
    dragModeRef.current = null;
    startRef.current = null;
  };

  const confirm = () => {
    if (!imageRef.current) {
      return;
    }
    void (async () => {
      setIsSaving(true);
      try {
        onConfirm(await cropFile(file, imageRef.current!, crop));
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const handleClass =
    "absolute h-7 w-7 rounded-full border-2 border-white bg-accent shadow-[0_4px_16px_rgba(0,0,0,0.45)] touch-none";

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#0B0D12] px-4 pb-6 pt-4 text-white">
      <div className="mx-auto w-full max-w-md space-y-4">
        <div className="text-center text-lg font-semibold">Podesi ivice dokumenta</div>

        <div
          className="relative overflow-hidden rounded-[24px] border border-white/10 bg-black"
          onPointerCancel={endDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
        >
          {imageUrl ? <img ref={imageRef} alt="Dokument za crop" className="block h-auto w-full" src={imageUrl} /> : null}
          <div
            className="absolute border-2 border-accent shadow-[0_0_0_9999px_rgba(0,0,0,0.58)] touch-none"
            onPointerDown={(event) => startDrag("move", event)}
            style={{
              left: `${crop.x * 100}%`,
              top: `${crop.y * 100}%`,
              width: `${crop.width * 100}%`,
              height: `${crop.height * 100}%`
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-transparent" />
            <button
              aria-label="Gornji levi ugao"
              className={`${handleClass} -left-3.5 -top-3.5`}
              onPointerDown={(event) => startDrag("top-left", event)}
              type="button"
            />
            <button
              aria-label="Gornji desni ugao"
              className={`${handleClass} -right-3.5 -top-3.5`}
              onPointerDown={(event) => startDrag("top-right", event)}
              type="button"
            />
            <button
              aria-label="Donji levi ugao"
              className={`${handleClass} -bottom-3.5 -left-3.5`}
              onPointerDown={(event) => startDrag("bottom-left", event)}
              type="button"
            />
            <button
              aria-label="Donji desni ugao"
              className={`${handleClass} -bottom-3.5 -right-3.5`}
              onPointerDown={(event) => startDrag("bottom-right", event)}
              type="button"
            />
          </div>
        </div>

        <div className="text-center text-sm text-white/55">
          Pomeri okvir ili njegove uglove tako da obuhvati dokument.
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            className="rounded-[18px] border border-white/12 bg-white/8 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={confirm}
            type="button"
          >
            {isSaving ? "Obradjujem..." : "Potvrdi"}
          </button>
          <button
            className="rounded-[18px] border border-white/12 bg-white/8 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={onCancel}
            type="button"
          >
            Otkazi
          </button>
        </div>
      </div>
    </div>
  );
}
