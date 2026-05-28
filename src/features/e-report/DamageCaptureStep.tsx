import Camera from "../../components/Camera";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { mockDamageRecognition } from "../../lib/photoAssist";
import { DAMAGE_ZONE_OPTIONS, createId } from "../../lib/utils";
import type { DamageZone, PhotoAsset, PhotoKind, VehicleDraft } from "../../types";

type Props = {
  photos: PhotoAsset[];
  vehicleA: VehicleDraft;
  vehicleB: VehicleDraft;
  onChange: (photos: PhotoAsset[]) => void;
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

function DamageCard({
  title,
  accentClass,
  photos,
  vehicle,
  onCapture,
  onDelete,
  onVehicleChange,
  readOnly = false
}: {
  title: string;
  accentClass: string;
  photos: PhotoAsset[];
  vehicle: VehicleDraft;
  onCapture: (files: FileList) => Promise<void>;
  onDelete: (photoId: string) => void;
  onVehicleChange: (vehicle: VehicleDraft) => void;
  readOnly?: boolean;
}) {
  const zone = vehicle.damageSuggestion.manualZone || vehicle.damageSuggestion.suggestedZone;

  return (
    <Card className={`space-y-4 border ${accentClass}`}>
      <div className="space-y-1">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="text-sm text-white/60">Dodaj 1 ili više fotografija i potvrdi mesto oštećenja.</div>
      </div>
      <Camera
        disabled={readOnly}
        helper="Fotografiši najjasniji ugao oštećenja."
        onCapture={onCapture}
        title="Dodaj fotografiju oštećenja"
      />
      {photos.length ? (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative overflow-hidden rounded-[18px] bg-white/5">
              <img alt={title} className="aspect-square w-full object-cover" src={photo.dataUrl} />
              {readOnly ? null : (
                <button
                  className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-xs text-white"
                  onClick={() => onDelete(photo.id)}
                  type="button"
                >
                  Obriši
                </button>
              )}
            </div>
          ))}
        </div>
      ) : null}
      {vehicle.damageSuggestion.status !== "idle" ? (
        <div className="space-y-3 rounded-[20px] border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/60">Detektovano mesto oštećenja</div>
          <div className="rounded-[20px] border border-white/10 bg-black/10 p-4">
            <div className="text-center text-4xl">🚗</div>
            <div className="mt-3 text-center text-white">{zone || "Nije detektovano"}</div>
          </div>
          <label className="space-y-2">
            <span className="text-sm text-white/60">Izmeni ručno</span>
            <select
              className="input-glass"
              disabled={readOnly}
              value={zone}
              onChange={(event) =>
                onVehicleChange({
                  ...vehicle,
                  damageSuggestion: {
                    ...vehicle.damageSuggestion,
                    manualZone: event.target.value as DamageZone
                  }
                })
              }
            >
              <option value="">Izaberi mesto</option>
              {DAMAGE_ZONE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              disabled={readOnly}
              onClick={() =>
                onVehicleChange({
                  ...vehicle,
                  impactZone: zone,
                  visibleDamage: zone ? `Detektovano mesto oštećenja: ${zone}` : vehicle.visibleDamage,
                  damageSuggestion: {
                    ...vehicle.damageSuggestion,
                    status: "confirmed",
                    manualZone: zone,
                    suggestedZone: zone
                  }
                })
              }
              type="button"
            >
              Potvrdi
            </Button>
            <Button
              disabled={readOnly}
              onClick={() =>
                onVehicleChange({
                  ...vehicle,
                  damageSuggestion: {
                    ...vehicle.damageSuggestion,
                    manualZone: "",
                    suggestedZone: "",
                    status: "idle",
                    sourcePhotoId: null
                  }
                })
              }
              type="button"
              variant="secondary"
            >
              Reset
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

export default function DamageCaptureStep({
  photos,
  vehicleA,
  vehicleB,
  onChange,
  onVehicleAChange,
  onVehicleBChange,
  readOnly = false
}: Props) {
  const damagePhotosA = photosByKind(photos, "damage-a");
  const damagePhotosB = photosByKind(photos, "damage-b");

  const handleCapture = (kind: PhotoKind, vehicle: VehicleDraft, onVehicleChange: (value: VehicleDraft) => void) =>
    async (files: FileList) => {
      const uploads = await Promise.all(
        Array.from(files).map(async (file) => ({
          id: createId("scene"),
          dataUrl: await fileToDataUrl(file),
          label: file.name,
          kind
        }))
      );

      onChange([...photos, ...uploads]);
      const suggestion = await mockDamageRecognition(uploads[0]);
      onVehicleChange({
        ...vehicle,
        damageSuggestion: suggestion
      });
    };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Fotografije oštećenja</h2>
        <p className="text-sm text-white/60">
          Odvojeno dokumentuj vozilo A i vozilo B. Predlog mesta udara je samo pomoć korisniku.
        </p>
      </div>
      <DamageCard
        accentClass="border-red-400/35"
        onCapture={handleCapture("damage-a", vehicleA, onVehicleAChange)}
        onDelete={(photoId) => onChange(photos.filter((item) => item.id !== photoId))}
        onVehicleChange={onVehicleAChange}
        photos={damagePhotosA}
        readOnly={readOnly}
        title="Oštećenje vozila A"
        vehicle={vehicleA}
      />
      <DamageCard
        accentClass="border-accent/35"
        onCapture={handleCapture("damage-b", vehicleB, onVehicleBChange)}
        onDelete={(photoId) => onChange(photos.filter((item) => item.id !== photoId))}
        onVehicleChange={onVehicleBChange}
        photos={damagePhotosB}
        readOnly={readOnly}
        title="Oštećenje vozila B"
        vehicle={vehicleB}
      />
    </div>
  );
}
