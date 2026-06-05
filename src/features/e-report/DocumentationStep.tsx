import Camera from "../../components/Camera";
import Card from "../../components/Card";
import { DAMAGE_ZONE_OPTIONS, createId } from "../../lib/utils";
import type { DamageZone, DocumentSide, DocumentType, PhotoAsset, PhotoKind, VehicleDraft } from "../../types";

type Props = {
  scenePhotos: PhotoAsset[];
  vehicleA: VehicleDraft;
  vehicleB: VehicleDraft;
  onScenePhotosChange: (photos: PhotoAsset[]) => void;
  onVehicleAChange: (vehicle: VehicleDraft) => void;
  onVehicleBChange: (vehicle: VehicleDraft) => void;
  readOnly?: boolean;
};

type Accent = "blue" | "yellow";

const accentTheme = {
  blue: {
    card: "border-sky-400/40 bg-sky-500/10",
    panel: "border-sky-300/25 bg-sky-500/8",
    button: "border-sky-300/35 bg-sky-500/14 text-sky-50",
    pill: "border-sky-300/45 bg-sky-500/16 text-sky-100",
    text: "text-sky-100",
    muted: "text-sky-100/70"
  },
  yellow: {
    card: "border-amber-300/45 bg-amber-300/12",
    panel: "border-amber-200/30 bg-amber-300/10",
    button: "border-amber-200/40 bg-amber-300/16 text-amber-50",
    pill: "border-amber-200/50 bg-amber-300/18 text-amber-50",
    text: "text-amber-50",
    muted: "text-amber-50/75"
  }
} as const;

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function sideLabel(side: DocumentSide, totalSides: number) {
  if (totalSides === 1) {
    return "Dokument";
  }

  return side === "front" ? "Prednja strana" : "Zadnja strana";
}

function getDocumentPhotos(vehicle: VehicleDraft, documentType: DocumentType) {
  return vehicle.documentPhotos.filter((photo) => photo.documentType === documentType);
}

function photosByKind(photos: PhotoAsset[], kind: PhotoKind) {
  return photos.filter((photo) => photo.kind === kind);
}

function DriverLicenseUploader({
  accent,
  title,
  photoKind,
  vehicle,
  onChange,
  readOnly = false
}: {
  accent: Accent;
  title: string;
  photoKind: PhotoKind;
  vehicle: VehicleDraft;
  onChange: (vehicle: VehicleDraft) => void;
  readOnly?: boolean;
}) {
  const photos = getDocumentPhotos(vehicle, "driver-license");
  const photo = photos.find((item) => item.documentSide === "front");
  const theme = accentTheme[accent];

  const saveFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) {
      return;
    }

    const upload = {
      id: createId("doc"),
      dataUrl: await fileToDataUrl(file),
      label: file.name,
      kind: photoKind,
      documentType: "driver-license" as DocumentType,
      documentSide: "front" as DocumentSide
    };

    onChange({
      ...vehicle,
      documentPhotos: [
        ...vehicle.documentPhotos.filter(
          (item) => !(item.documentType === "driver-license" && item.documentSide === "front")
        ),
        upload
      ]
    });
  };

  return (
    <div className={`space-y-4 rounded-[24px] border p-4 ${theme.panel}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-base font-semibold ${theme.text}`}>{title}</div>
          <div className={`mt-1 text-sm ${theme.muted}`}>Samo prednja strana</div>
        </div>
        <div className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.22em] ${theme.pill}`}>
          1 strana
        </div>
      </div>

      <div className="rounded-[20px] border border-white/10 bg-black/15 p-4">
        <div className="mb-3 text-sm font-medium text-white">{sideLabel("front", 1)}</div>
        <Camera
          buttonLabel={photo ? "Izmeni sliku vozacke" : "Dodaj sliku vozacke"}
          crop
          disabled={readOnly}
          multiple={false}
          onCapture={saveFiles}
          reviewBeforeSave
          title={title}
        />
        {photo ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-sm font-medium text-white">Slika dodata</div>
            {!readOnly ? (
              <button
                className={`rounded-full border px-3 py-1 text-xs ${theme.button}`}
                onClick={() =>
                  onChange({
                    ...vehicle,
                    documentPhotos: vehicle.documentPhotos.filter((item) => item.id !== photo.id)
                  })
                }
                type="button"
              >
                Obrisi
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DamageCard({
  accent,
  title,
  photos,
  photoKind,
  vehicle,
  onPhotosChange,
  onVehicleChange,
  readOnly = false
}: {
  accent: Accent;
  title: string;
  photos: PhotoAsset[];
  photoKind: PhotoKind;
  vehicle: VehicleDraft;
  onPhotosChange: (photos: PhotoAsset[]) => void;
  onVehicleChange: (vehicle: VehicleDraft) => void;
  readOnly?: boolean;
}) {
  const theme = accentTheme[accent];
  const zone = vehicle.impactZone || vehicle.damageSuggestion.manualZone;

  const handleCapture = async (files: FileList) => {
    const uploads = await Promise.all(
      Array.from(files).map(async (file) => ({
        id: createId("scene"),
        dataUrl: await fileToDataUrl(file),
        label: file.name,
        kind: photoKind
      }))
    );

    onPhotosChange([...photos, ...uploads]);
  };

  return (
    <div className={`space-y-4 rounded-[24px] border p-4 ${theme.panel}`}>
      <div className={`text-base font-semibold ${theme.text}`}>{title}</div>
      <Camera
        buttonLabel="Dodaj fotografije stete"
        disabled={readOnly}
        onCapture={handleCapture}
        reviewBeforeSave
        title={title}
      />

      {photos.length ? (
        <div className="flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
          <div className="text-sm font-medium text-white">
            {photos.length === 1 ? "Fotografija dodata" : `Dodato fotografija: ${photos.length}`}
          </div>
          {!readOnly ? (
            <button
              className={`rounded-full border px-3 py-1 text-xs ${theme.button}`}
              onClick={() => onPhotosChange([])}
              type="button"
            >
              Obrisi
            </button>
          ) : null}
        </div>
      ) : null}

      <label className="space-y-2">
        <span className="text-sm text-white/60">Mesto inicijalnog udara</span>
        <select
          className="input-glass text-white"
          disabled={readOnly}
          value={zone}
          onChange={(event) => {
            const nextZone = event.target.value as DamageZone;
            const shouldSuggestVisibleDamage =
              !vehicle.visibleDamage || vehicle.visibleDamage === zone;

            onVehicleChange({
              ...vehicle,
              impactZone: nextZone,
              visibleDamage: shouldSuggestVisibleDamage ? nextZone : vehicle.visibleDamage,
              damageSuggestion: {
                ...vehicle.damageSuggestion,
                manualZone: nextZone,
                suggestedZone: nextZone,
                status: nextZone ? "confirmed" : "idle"
              }
            });
          }}
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

      <label className="space-y-2">
        <span className="text-sm text-white/60">Vidljiva ostecenja na vozilu</span>
        <textarea
          className="input-glass min-h-[88px]"
          disabled={readOnly}
          onChange={(event) => onVehicleChange({ ...vehicle, visibleDamage: event.target.value })}
          placeholder="Primer: prednji branik, levi far i hauba"
          value={vehicle.visibleDamage}
        />
      </label>
    </div>
  );
}

export default function DocumentationStep({
  scenePhotos,
  vehicleA,
  vehicleB,
  onScenePhotosChange,
  onVehicleAChange,
  onVehicleBChange,
  readOnly = false
}: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-[30px] font-semibold text-white">Dokumentacija i steta</h2>
      </div>

      <Card className={`space-y-5 border-2 ${accentTheme.blue.card}`}>
        <DriverLicenseUploader
          accent="blue"
          onChange={onVehicleAChange}
          photoKind="document-a"
          readOnly={readOnly}
          title="Vozacka dozvola A"
          vehicle={vehicleA}
        />
        <DriverLicenseUploader
          accent="yellow"
          onChange={onVehicleBChange}
          photoKind="document-b"
          readOnly={readOnly}
          title="Vozacka dozvola B"
          vehicle={vehicleB}
        />
        <DamageCard
          accent="blue"
          onPhotosChange={(next) =>
            onScenePhotosChange([
              ...scenePhotos.filter((photo) => photo.kind !== "damage-a"),
              ...next
            ])
          }
          onVehicleChange={onVehicleAChange}
          photoKind="damage-a"
          photos={photosByKind(scenePhotos, "damage-a")}
          readOnly={readOnly}
          title="Steta na vozilu A"
          vehicle={vehicleA}
        />
        <DamageCard
          accent="yellow"
          onPhotosChange={(next) =>
            onScenePhotosChange([
              ...scenePhotos.filter((photo) => photo.kind !== "damage-b"),
              ...next
            ])
          }
          onVehicleChange={onVehicleBChange}
          photoKind="damage-b"
          photos={photosByKind(scenePhotos, "damage-b")}
          readOnly={readOnly}
          title="Steta na vozilu B"
          vehicle={vehicleB}
        />
      </Card>
    </div>
  );
}
