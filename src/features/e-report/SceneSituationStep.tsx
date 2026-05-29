import Camera from "../../components/Camera";
import Card from "../../components/Card";
import { createId } from "../../lib/utils";
import type { PhotoAsset, PhotoKind } from "../../types";

type Props = {
  photos: PhotoAsset[];
  onChange: (photos: PhotoAsset[]) => void;
  readOnly?: boolean;
};

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function photosByKind(photos: PhotoAsset[], kind: PhotoKind) {
  return photos.filter((photo) => photo.kind === kind);
}

export default function SceneSituationStep({
  photos,
  onChange,
  readOnly = false
}: Props) {
  const scenePhotos = photosByKind(photos, "scene");

  const handleCapture = async (files: FileList) => {
    const uploads = await Promise.all(
      Array.from(files).map(async (file) => ({
        id: createId("scene"),
        dataUrl: await fileToDataUrl(file),
        label: file.name,
        kind: "scene" as PhotoKind
      }))
    );

    onChange([...photos, ...uploads]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Fotografisite celu situaciju</h2>
        <p className="text-sm text-white/60">
          Potrebni su oba vozila u kadru, polozaj vozila, kolovoz, raskrsnica i znakovi ako ih ima.
        </p>
      </div>

      <Card className="space-y-4 border border-white/10">
        <Camera
          disabled={readOnly}
          helper="Jedan siri kadar sa oba vozila i celim mestom dogadjaja."
          onCapture={handleCapture}
          title="Scena nezgode"
        />
        <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
          Fotografija scene se cuva jednom i ostaje uz report kao podloga za sledeci korak: skica nezgode.
        </div>
        {scenePhotos.length ? (
          <div className="grid grid-cols-2 gap-3">
            {scenePhotos.map((photo) => (
              <div key={photo.id} className="relative overflow-hidden rounded-[18px] bg-white/5">
                <img alt="Scena nezgode" className="aspect-[4/3] w-full object-cover" src={photo.dataUrl} />
                {readOnly ? null : (
                  <button
                    className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-xs text-white"
                    onClick={() => onChange(photos.filter((item) => item.id !== photo.id))}
                    type="button"
                  >
                    Obrisi
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
