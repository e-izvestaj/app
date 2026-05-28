import { useState } from "react";
import Camera from "../../components/Camera";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { mockSceneSketchSuggestion, regenerateSceneSketch } from "../../lib/photoAssist";
import { createId } from "../../lib/utils";
import type { PhotoAsset, PhotoKind, PhotoMarker, SceneSketchSuggestion } from "../../types";
import PhotoAnnotator from "./PhotoAnnotator";

type Props = {
  photos: PhotoAsset[];
  selectedPhotoId: string | null;
  markers: PhotoMarker[];
  annotatedPhotoDataUrl: string | null;
  sceneSketch: SceneSketchSuggestion;
  onChange: (photos: PhotoAsset[]) => void;
  onSelectedPhotoIdChange: (photoId: string | null) => void;
  onMarkersChange: (markers: PhotoMarker[]) => void;
  onSaveFlattened: (dataUrl: string) => void;
  onSceneSketchChange: (sceneSketch: SceneSketchSuggestion) => void;
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
  selectedPhotoId,
  markers,
  annotatedPhotoDataUrl,
  sceneSketch,
  onChange,
  onSelectedPhotoIdChange,
  onMarkersChange,
  onSaveFlattened,
  onSceneSketchChange,
  readOnly = false
}: Props) {
  const [view, setView] = useState<"suggestion" | "manual">("suggestion");
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

    const merged = [...photos, ...uploads];
    onChange(merged);
    onSelectedPhotoIdChange(uploads[0]?.id || selectedPhotoId);
    const suggestion = await mockSceneSketchSuggestion(uploads[0]);
    onSceneSketchChange(suggestion);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Fotografišite celu situaciju</h2>
        <p className="text-sm text-white/60">
          Potrebni su oba vozila u kadru, položaj na putu i smer kretanja.
        </p>
      </div>

      <Card className="space-y-4 border border-white/10">
        <Camera
          disabled={readOnly}
          helper="Jedan široki kadar sa oba vozila i kolovozom."
          onCapture={handleCapture}
          title="Cela situacija nezgode"
        />
        {scenePhotos.length ? (
          <div className="grid grid-cols-3 gap-3">
            {scenePhotos.map((photo) => (
              <div key={photo.id} className="relative overflow-hidden rounded-[18px] bg-white/5">
                <img alt="Scena" className="aspect-square w-full object-cover" src={photo.dataUrl} />
                {readOnly ? null : (
                  <button
                    className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-xs text-white"
                    onClick={() => onChange(photos.filter((item) => item.id !== photo.id))}
                    type="button"
                  >
                    Obriši
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      {scenePhotos.length ? (
        <Card className="space-y-4 border border-accent/20 bg-accent/8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.26em] text-accent">AI sketch assist</div>
              <div className="mt-1 text-lg font-semibold text-white">Predlog skice nezgode</div>
            </div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              <button
                className={`rounded-full px-4 py-2 text-sm ${view === "suggestion" ? "bg-accent text-white" : "text-white/60"}`}
                onClick={() => setView("suggestion")}
                type="button"
              >
                Predlog
              </button>
              <button
                className={`rounded-full px-4 py-2 text-sm ${view === "manual" ? "bg-accent text-white" : "text-white/60"}`}
                onClick={() => setView("manual")}
                type="button"
              >
                Doradi ručno
              </button>
            </div>
          </div>

          {view === "suggestion" ? (
            <div className="space-y-4">
              {sceneSketch.svgDataUrl ? (
                <img alt="Predlog skice" className="w-full rounded-[24px] bg-[#0B0D12]" src={sceneSketch.svgDataUrl} />
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/10 p-8 text-center text-white/45">
                  Dodaj fotografiju scene da bi se prikazao predlog skice.
                </div>
              )}
              <div className="text-sm text-white/70">{sceneSketch.summary || "Skica je samo predlog i nikada ne ide automatski u final."}</div>
              <div className="grid grid-cols-3 gap-3">
                <label className="space-y-2">
                  <span className="text-sm text-white/60">Tip puta</span>
                  <select
                    className="input-glass"
                    disabled={readOnly}
                    value={sceneSketch.laneType}
                    onChange={(event) =>
                      onSceneSketchChange(
                        regenerateSceneSketch({
                          ...sceneSketch,
                          laneType: event.target.value as SceneSketchSuggestion["laneType"]
                        })
                      )
                    }
                  >
                    <option value="straight">Pravac</option>
                    <option value="intersection">Raskrsnica</option>
                    <option value="parking">Parking</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-white/60">Vozilo A</span>
                  <select
                    className="input-glass"
                    disabled={readOnly}
                    value={sceneSketch.vehicleAPosition}
                    onChange={(event) =>
                      onSceneSketchChange(
                        regenerateSceneSketch({
                          ...sceneSketch,
                          vehicleAPosition: event.target.value as SceneSketchSuggestion["vehicleAPosition"]
                        })
                      )
                    }
                  >
                    <option value="left">Levo</option>
                    <option value="center">Centar</option>
                    <option value="right">Desno</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-white/60">Vozilo B</span>
                  <select
                    className="input-glass"
                    disabled={readOnly}
                    value={sceneSketch.vehicleBPosition}
                    onChange={(event) =>
                      onSceneSketchChange(
                        regenerateSceneSketch({
                          ...sceneSketch,
                          vehicleBPosition: event.target.value as SceneSketchSuggestion["vehicleBPosition"]
                        })
                      )
                    }
                  >
                    <option value="left">Levo</option>
                    <option value="center">Centar</option>
                    <option value="right">Desno</option>
                  </select>
                </label>
              </div>
              <Button
                disabled={readOnly}
                onClick={() => onSceneSketchChange({ ...sceneSketch, status: "confirmed" })}
                type="button"
              >
                Potvrdi skicu
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-white/60">
                Ručno doradi smer kretanja i mesto kontakta direktno preko fotografije.
              </div>
              <PhotoAnnotator
                markers={markers}
                onMarkersChange={onMarkersChange}
                onSaveFlattened={onSaveFlattened}
                onSelectedPhotoIdChange={(photoId) => onSelectedPhotoIdChange(photoId)}
                photos={scenePhotos}
                readOnly={readOnly}
                selectedPhotoId={selectedPhotoId}
              />
              {annotatedPhotoDataUrl ? (
                <div className="space-y-2">
                  <div className="text-sm text-white/60">Sačuvana ručno dorađena skica</div>
                  <img alt="Sačuvana skica" className="w-full rounded-[24px] object-cover" src={annotatedPhotoDataUrl} />
                </div>
              ) : null}
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
