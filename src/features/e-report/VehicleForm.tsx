import { useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Camera from "../../components/Camera";
import { mockOcrFromPhoto } from "../../lib/ocr";
import { createId } from "../../lib/utils";
import type { PhotoAsset, VehicleDraft } from "../../types";

type Props = {
  title: string;
  value: VehicleDraft;
  onChange: (value: VehicleDraft) => void;
};

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function VehicleForm({ title, value, onChange }: Props) {
  const [isReading, setIsReading] = useState(false);

  const handleCapture = async (files: FileList) => {
    const uploads = await Promise.all(
      Array.from(files).map(async (file) => ({
        id: createId("doc"),
        dataUrl: await fileToDataUrl(file),
        label: file.name
      }))
    );

    onChange({
      ...value,
      documentPhotos: [...value.documentPhotos, ...uploads]
    });
  };

  const runMockOcr = async () => {
    setIsReading(true);
    const result = await mockOcrFromPhoto(value.documentPhotos[0]);
    setIsReading(false);
    onChange({
      ...value,
      ...result,
      ocrStatus: "mocked"
    });
  };

  const renderThumb = (photo: PhotoAsset) => (
    <div key={photo.id} className="relative overflow-hidden rounded-[18px] bg-white/5">
      <img alt="Dokument" className="aspect-[4/3] w-full object-cover" src={photo.dataUrl} />
      <button
        className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-xs text-white"
        onClick={() =>
          onChange({
            ...value,
            documentPhotos: value.documentPhotos.filter((item) => item.id !== photo.id)
          })
        }
        type="button"
      >
        Obrisi
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">{title}</h2>
        <p className="text-sm text-white/60">Slikaj dokument ili unesi podatke rucno.</p>
      </div>

      <Camera
        title="Polisa osiguranja / saobracajna dozvola"
        helper="OCR je spreman za integraciju. Trenutno koristimo mock popunu."
        onCapture={handleCapture}
      />

      {value.documentPhotos.length ? (
        <Button variant="secondary" onClick={runMockOcr} type="button">
          {isReading ? "Citam dokument..." : "Popuni preko OCR placeholder-a"}
        </Button>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {value.documentPhotos.map(renderThumb)}
      </div>

      <Card className="grid grid-cols-1 gap-3">
        <label className="space-y-2">
          <span className="text-sm text-white/60">Registarska oznaka</span>
          <input
            className="input-glass"
            value={value.plate}
            onChange={(event) => onChange({ ...value, plate: event.target.value })}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-2">
            <span className="text-sm text-white/60">Marka</span>
            <input
              className="input-glass"
              value={value.make}
              onChange={(event) => onChange({ ...value, make: event.target.value })}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-white/60">Model</span>
            <input
              className="input-glass"
              value={value.model}
              onChange={(event) => onChange({ ...value, model: event.target.value })}
            />
          </label>
        </div>
        <label className="space-y-2">
          <span className="text-sm text-white/60">Broj polise</span>
          <input
            className="input-glass"
            value={value.policyNumber}
            onChange={(event) => onChange({ ...value, policyNumber: event.target.value })}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-white/60">Osiguravajuca kuca</span>
          <input
            className="input-glass"
            value={value.insurer}
            onChange={(event) => onChange({ ...value, insurer: event.target.value })}
          />
        </label>
      </Card>
    </div>
  );
}
