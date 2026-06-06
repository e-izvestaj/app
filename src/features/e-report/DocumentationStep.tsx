import Camera from "../../components/Camera";
import { DAMAGE_ZONE_OPTIONS, createId } from "../../lib/utils";
import type { DamageZone, DocumentType, PhotoAsset, PhotoKind, VehicleDraft } from "../../types";

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
    panel: "border-sky-300/35 bg-sky-500/8",
    button: "border-sky-300/35 bg-sky-500/14 text-sky-50",
    text: "text-sky-100"
  },
  yellow: {
    panel: "border-amber-200/35 bg-amber-300/10",
    button: "border-amber-200/40 bg-amber-300/16 text-amber-50",
    text: "text-amber-50"
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

function getDocumentPhotos(vehicle: VehicleDraft, documentType: DocumentType) {
  return vehicle.documentPhotos.filter((photo) => photo.documentType === documentType);
}

function photosByKind(photos: PhotoAsset[], kind: PhotoKind) {
  return photos.filter((photo) => photo.kind === kind);
}

function Section({
  accent,
  children,
  title
}: {
  accent: Accent;
  children: React.ReactNode;
  title: string;
}) {
  const theme = accentTheme[accent];

  return (
    <section className={`space-y-4 rounded-[24px] border p-4 ${theme.panel}`}>
      <h2 className={`text-lg font-semibold ${theme.text}`}>{title}</h2>
      {children}
    </section>
  );
}

function RegistrationUploader({
  accent,
  title,
  photoKind,
  documentSide,
  vehicle,
  onChange,
  readOnly = false
}: {
  accent: Accent;
  title: string;
  photoKind: PhotoKind;
  documentSide: "front" | "back";
  vehicle: VehicleDraft;
  onChange: (vehicle: VehicleDraft) => void;
  readOnly?: boolean;
}) {
  const photos = getDocumentPhotos(vehicle, "registration");
  const photo = photos.find((item) => item.documentSide === documentSide);
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
      documentType: "registration" as DocumentType,
      documentSide
    };

    onChange({
      ...vehicle,
      documentPhotos: [
        ...vehicle.documentPhotos.filter(
          (item) => !(item.documentType === "registration" && item.documentSide === documentSide)
        ),
        upload
      ]
    });
  };

  return (
    <Section accent={accent} title={title}>
      {photo ? (
        <div className="flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
          <div className="text-sm font-semibold text-emerald-300">Slika dodata</div>
          {!readOnly ? (
            <div className="flex shrink-0 items-center gap-2">
              <Camera
                buttonLabel="Izmeni"
                compact
                crop
                disabled={readOnly}
                hideStatus
                multiple={false}
                onCapture={saveFiles}
                reviewBeforeSave
                title={title}
              />
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
            </div>
          ) : null}
        </div>
      ) : (
        <Camera
          buttonLabel="Dodaj sliku saobracajne"
          crop
          disabled={readOnly}
          hideStatus
          multiple={false}
          onCapture={saveFiles}
          plain
          reviewBeforeSave
          title={title}
        />
      )}
    </Section>
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
    <Section accent={accent} title={title}>
      <Camera
        buttonLabel="Dodaj fotografije stete"
        disabled={readOnly}
        hideStatus
        onCapture={handleCapture}
        plain
        reviewBeforeSave
        title={title}
      />

      {photos.length ? (
        <div className="flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
          <div className="text-sm font-semibold text-emerald-300">
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
    </Section>
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
      <RegistrationUploader
        accent="blue"
        documentSide="front"
        onChange={onVehicleAChange}
        photoKind="document-a"
        readOnly={readOnly}
        title="Saobracajna dozvola A - prednja"
        vehicle={vehicleA}
      />
      <RegistrationUploader
        accent="blue"
        documentSide="back"
        onChange={onVehicleAChange}
        photoKind="document-a"
        readOnly={readOnly}
        title="Saobracajna dozvola A - zadnja"
        vehicle={vehicleA}
      />
      <RegistrationUploader
        accent="yellow"
        documentSide="front"
        onChange={onVehicleBChange}
        photoKind="document-b"
        readOnly={readOnly}
        title="Saobracajna dozvola B - prednja"
        vehicle={vehicleB}
      />
      <RegistrationUploader
        accent="yellow"
        documentSide="back"
        onChange={onVehicleBChange}
        photoKind="document-b"
        readOnly={readOnly}
        title="Saobracajna dozvola B - zadnja"
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
    </div>
  );
}
