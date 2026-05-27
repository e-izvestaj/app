import Camera from "../../components/Camera";
import Card from "../../components/Card";
import type { PhotoAsset } from "../../types";
import { createId } from "../../lib/utils";

type Props = {
  photos: PhotoAsset[];
  onChange: (photos: PhotoAsset[]) => void;
};

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function SceneCapture({ photos, onChange }: Props) {
  const handleCapture = async (files: FileList) => {
    const nextPhotos = await Promise.all(
      Array.from(files).map(async (file) => ({
        id: createId("scene"),
        dataUrl: await fileToDataUrl(file),
        label: file.name
      }))
    );

    onChange([...photos, ...nextPhotos]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Dokumentuj scenu.</h2>
        <p className="text-sm text-white/60">Oba vozila, panorama i ostecenje.</p>
      </div>
      <Card className="space-y-2">
        <div className="text-sm text-white/85">Checklist</div>
        <ul className="space-y-2 text-sm text-white/60">
          <li>Oba vozila u kadru</li>
          <li>Panorama mesta dogadjaja</li>
          <li>Ostecenje vozila</li>
        </ul>
      </Card>
      <Camera
        title="Fullscreen camera-first capture"
        helper="Na mobilnom uredjaju otvara zadnju kameru kada je dostupna."
        onCapture={handleCapture}
      />
      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo) => (
          <div key={photo.id} className="relative overflow-hidden rounded-[20px] bg-white/5">
            <img
              alt="Scene preview"
              className="aspect-square h-full w-full object-cover"
              src={photo.dataUrl}
            />
            <button
              className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-xs text-white"
              onClick={() => onChange(photos.filter((item) => item.id !== photo.id))}
              type="button"
            >
              Obrisi
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
