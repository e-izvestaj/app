import Camera from "../../components/Camera";
import Button from "../../components/Button";
import Card from "../../components/Card";
import type { ReactNode } from "react";
import { mockDamageRecognition, mockSceneSketchSuggestion, regenerateSceneSketch } from "../../lib/photoAssist";
import { DAMAGE_ZONE_OPTIONS, createId } from "../../lib/utils";
import type { DamageZone, PhotoAsset, PhotoKind, SceneSketchSuggestion, VehicleDraft } from "../../types";

type Props = {
  photos: PhotoAsset[];
  sceneSketch: SceneSketchSuggestion;
  vehicleA: VehicleDraft;
  vehicleB: VehicleDraft;
  onChange: (photos: PhotoAsset[]) => void;
  onSceneSketchChange: (sceneSketch: SceneSketchSuggestion) => void;
  onVehicleAChange: (vehicle: VehicleDraft) => void;
  onVehicleBChange: (vehicle: VehicleDraft) => void;
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

function SuggestionCard({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="space-y-4 border border-accent/20 bg-accent/8">
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-[0.26em] text-accent">Assist layer</div>
        <div className="text-lg font-semibold text-white">{title}</div>
        <div className="text-sm text-white/60">{description}</div>
      </div>
      {children}
    </Card>
  );
}

export default function SceneCapture({
  photos,
  sceneSketch,
  vehicleA,
  vehicleB,
  onChange,
  onSceneSketchChange,
  onVehicleAChange,
  onVehicleBChange,
  readOnly = false
}: Props) {
  const scenePhotos = photosByKind(photos, "scene");
  const damagePhotosA = photosByKind(photos, "damage-a");
  const damagePhotosB = photosByKind(photos, "damage-b");

  const handleCapture = (kind: PhotoKind) => async (files: FileList) => {
    const nextPhotos = await Promise.all(
      Array.from(files).map(async (file) => ({
        id: createId("scene"),
        dataUrl: await fileToDataUrl(file),
        label: file.name,
        kind
      }))
    );

    const merged = [...photos, ...nextPhotos];
    onChange(merged);

    if (kind === "scene") {
      const suggestion = await mockSceneSketchSuggestion(nextPhotos[0]);
      onSceneSketchChange(suggestion);
    }

    if (kind === "damage-a") {
      const suggestion = await mockDamageRecognition(nextPhotos[0]);
      onVehicleAChange({
        ...vehicleA,
        damageSuggestion: suggestion
      });
    }

    if (kind === "damage-b") {
      const suggestion = await mockDamageRecognition(nextPhotos[0]);
      onVehicleBChange({
        ...vehicleB,
        damageSuggestion: suggestion
      });
    }
  };

  const renderThumbGrid = (list: PhotoAsset[]) => (
    <div className="grid grid-cols-3 gap-3">
      {list.map((photo) => (
        <div key={photo.id} className="relative overflow-hidden rounded-[20px] bg-white/5">
          <img alt="Scene preview" className="aspect-square h-full w-full object-cover" src={photo.dataUrl} />
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
  );

  const confirmDamage = (vehicle: VehicleDraft, onVehicleChange: (vehicle: VehicleDraft) => void) => {
    const zone = vehicle.damageSuggestion.manualZone || vehicle.damageSuggestion.suggestedZone;
    onVehicleChange({
      ...vehicle,
      impactZone: zone,
      visibleDamage: zone
        ? `Detektovano mesto oštećenja: ${zone}`
        : vehicle.visibleDamage,
      damageSuggestion: {
        ...vehicle.damageSuggestion,
        status: "confirmed",
        manualZone: zone,
        suggestedZone: zone
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Dokumentuj scenu.</h2>
        <p className="text-sm text-white/60">Jedna široka scena, plus posebne fotografije štete za A i B.</p>
      </div>

      <Camera
        disabled={readOnly}
        title="Šira fotografija scene nezgode"
        helper="Jedan kadar sa oba vozila i položajem na kolovozu."
        onCapture={handleCapture("scene")}
      />
      {scenePhotos.length ? renderThumbGrid(scenePhotos) : null}

      {sceneSketch.status !== "idle" && sceneSketch.svgDataUrl ? (
        <SuggestionCard
          description="AI predlog nikada ne ide dalje bez potvrde. Možete potvrditi ili ručno korigovati."
          title="Predlog skice nezgode"
        >
          <img alt="Predlog skice" className="w-full rounded-[24px] bg-[#0B0D12]" src={sceneSketch.svgDataUrl} />
          <div className="text-sm text-white/70">{sceneSketch.summary}</div>
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
          <div className="grid grid-cols-2 gap-3">
            <Button
              disabled={readOnly}
              onClick={() => onSceneSketchChange({ ...sceneSketch, status: "confirmed" })}
              type="button"
            >
              Potvrdi skicu
            </Button>
            <Button disabled={readOnly} onClick={() => {}} type="button" variant="secondary">
              Izmeni ručno
            </Button>
          </div>
        </SuggestionCard>
      ) : null}

      <Camera
        disabled={readOnly}
        title="Fotografije štete vozila A"
        helper="1+ fotografija za damage recognition assist."
        onCapture={handleCapture("damage-a")}
      />
      {damagePhotosA.length ? renderThumbGrid(damagePhotosA) : null}
      {vehicleA.damageSuggestion.status !== "idle" ? (
        <SuggestionCard
          description="Predlog lokacije oštećenja možete potvrditi ili ručno korigovati."
          title="Detektovano mesto oštećenja — Vozilo A"
        >
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="text-4xl text-center">🚗</div>
            <div className="mt-3 text-center text-white">{vehicleA.damageSuggestion.manualZone || vehicleA.damageSuggestion.suggestedZone}</div>
          </div>
          <label className="space-y-2">
            <span className="text-sm text-white/60">Izmeni ručno</span>
            <select
              className="input-glass"
              disabled={readOnly}
              value={vehicleA.damageSuggestion.manualZone || vehicleA.damageSuggestion.suggestedZone}
              onChange={(event) =>
                onVehicleAChange({
                  ...vehicleA,
                  damageSuggestion: {
                    ...vehicleA.damageSuggestion,
                    manualZone: event.target.value as DamageZone
                  }
                })
              }
            >
              <option value="">Izaberi mesto</option>
              {DAMAGE_ZONE_OPTIONS.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>
          <Button disabled={readOnly} onClick={() => confirmDamage(vehicleA, onVehicleAChange)} type="button">
            Potvrdi
          </Button>
        </SuggestionCard>
      ) : null}

      <Camera
        disabled={readOnly}
        title="Fotografije štete vozila B"
        helper="1+ fotografija za damage recognition assist."
        onCapture={handleCapture("damage-b")}
      />
      {damagePhotosB.length ? renderThumbGrid(damagePhotosB) : null}
      {vehicleB.damageSuggestion.status !== "idle" ? (
        <SuggestionCard
          description="Predlog lokacije oštećenja možete potvrditi ili ručno korigovati."
          title="Detektovano mesto oštećenja — Vozilo B"
        >
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="text-4xl text-center">🚗</div>
            <div className="mt-3 text-center text-white">{vehicleB.damageSuggestion.manualZone || vehicleB.damageSuggestion.suggestedZone}</div>
          </div>
          <label className="space-y-2">
            <span className="text-sm text-white/60">Izmeni ručno</span>
            <select
              className="input-glass"
              disabled={readOnly}
              value={vehicleB.damageSuggestion.manualZone || vehicleB.damageSuggestion.suggestedZone}
              onChange={(event) =>
                onVehicleBChange({
                  ...vehicleB,
                  damageSuggestion: {
                    ...vehicleB.damageSuggestion,
                    manualZone: event.target.value as DamageZone
                  }
                })
              }
            >
              <option value="">Izaberi mesto</option>
              {DAMAGE_ZONE_OPTIONS.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </label>
          <Button disabled={readOnly} onClick={() => confirmDamage(vehicleB, onVehicleBChange)} type="button">
            Potvrdi
          </Button>
        </SuggestionCard>
      ) : null}
    </div>
  );
}
