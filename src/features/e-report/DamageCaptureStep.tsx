import Camera from "../../components/Camera";
import Button from "../../components/Button";
import Card from "../../components/Card";
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

function ZoneCard({
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
  const zone = vehicle.impactZone || vehicle.damageSuggestion.manualZone;

  return (
    <Card className={`space-y-4 border-2 ${accentClass}`}>
      <div className="text-lg font-semibold text-white">{title}</div>
      <Camera
        buttonLabel="Dodaj fotografije"
        disabled={readOnly}
        onCapture={onCapture}
        title={title}
      />

      {photos.length ? (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, index) => (
            <div key={photo.id} className="relative overflow-hidden rounded-[18px] bg-white/5">
              <img alt={`${title} ${index + 1}`} className="aspect-[4/3] w-full object-cover" src={photo.dataUrl} />
              {!readOnly ? (
                <button
                  className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white"
                  onClick={() => onDelete(photo.id)}
                  type="button"
                >
                  Obriši
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <label className="space-y-2">
        <span className="text-sm text-white/60">Mesto oštećenja</span>
        <select
          className="input-glass text-white"
          disabled={readOnly}
          value={zone}
          onChange={(event) =>
            onVehicleChange({
              ...vehicle,
              impactZone: event.target.value as DamageZone,
              visibleDamage: event.target.value
            })
          }
        >
          <option className="bg-white text-slate-900" value="">
            Izaberi
          </option>
          {DAMAGE_ZONE_OPTIONS.map((item) => (
            <option className="bg-white text-slate-900" key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      {!readOnly ? (
        <Button
          onClick={() =>
            onVehicleChange({
              ...vehicle,
              impactZone: zone as DamageZone,
              visibleDamage: zone,
              damageSuggestion: {
                ...vehicle.damageSuggestion,
                status: zone ? "confirmed" : "idle",
                manualZone: zone as DamageZone,
                suggestedZone: zone as DamageZone
              }
            })
          }
          type="button"
          variant="secondary"
        >
          Sačuvaj mesto oštećenja
        </Button>
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

  const handleCapture =
    (kind: PhotoKind) =>
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
    };

  return (
    <div className="space-y-4">
      <h2 className="text-[30px] font-semibold text-white">Oštećenja vozila</h2>

      <ZoneCard
        accentClass="border-red-400/40"
        onCapture={handleCapture("damage-a")}
        onDelete={(photoId) => onChange(photos.filter((item) => item.id !== photoId))}
        onVehicleChange={onVehicleAChange}
        photos={damagePhotosA}
        readOnly={readOnly}
        title="Oštećenje vozila A"
        vehicle={vehicleA}
      />

      <ZoneCard
        accentClass="border-accent/40"
        onCapture={handleCapture("damage-b")}
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
