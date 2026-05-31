import Camera from "../../components/Camera";
import Card from "../../components/Card";
import { createId } from "../../lib/utils";
import type { DocumentSide, DocumentType, PhotoKind, VehicleDraft } from "../../types";

type Props = {
  vehicleA: VehicleDraft;
  onVehicleAChange: (vehicle: VehicleDraft) => void;
  readOnly?: boolean;
};

type Accent = "blue" | "yellow";

type DocumentCardProps = {
  accent: Accent;
  title: string;
  documentType: DocumentType;
  photoKind: PhotoKind;
  sides: DocumentSide[];
  vehicle: VehicleDraft;
  onChange: (vehicle: VehicleDraft) => void;
  readOnly?: boolean;
};

type VehicleSectionProps = {
  accent: Accent;
  title: string;
  vehicle: VehicleDraft;
  onChange: (vehicle: VehicleDraft) => void;
  readOnly?: boolean;
};

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

function sideButtonLabel(side: DocumentSide, totalSides: number) {
  if (totalSides === 1) {
    return "Dodaj sliku dokumenta";
  }

  return side === "front" ? "Dodaj prednju stranu" : "Dodaj zadnju stranu";
}

function getDocumentPhotos(vehicle: VehicleDraft, documentType: DocumentType) {
  return vehicle.documentPhotos.filter((photo) => photo.documentType === documentType);
}

function DocumentUploader({
  accent,
  title,
  documentType,
  photoKind,
  sides,
  vehicle,
  onChange,
  readOnly = false
}: DocumentCardProps) {
  const photos = getDocumentPhotos(vehicle, documentType);
  const theme = accentTheme[accent];

  const saveFiles = async (files: FileList, side: DocumentSide) => {
    const file = files[0];
    if (!file) {
      return;
    }

    const upload = {
      id: createId("doc"),
      dataUrl: await fileToDataUrl(file),
      label: file.name,
      kind: photoKind,
      documentType,
      documentSide: side
    };

    const nextVehicle = {
      ...vehicle,
      documentPhotos: [
        ...vehicle.documentPhotos.filter(
          (photo) => !(photo.documentType === documentType && photo.documentSide === side)
        ),
        upload
      ]
    };

    onChange(nextVehicle);
  };

  const removePhoto = (photoId: string) => {
    const nextVehicle = {
      ...vehicle,
      documentPhotos: vehicle.documentPhotos.filter((photo) => photo.id !== photoId)
    };

    onChange(nextVehicle);
  };

  return (
    <div className={`space-y-4 rounded-[24px] border p-4 ${theme.panel}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-base font-semibold ${theme.text}`}>{title}</div>
          <div className={`mt-1 text-sm ${theme.muted}`}>
            {photos.length}/{sides.length} dodatih strana
          </div>
        </div>
        <div className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.22em] ${theme.pill}`}>
          {sides.length === 1 ? "1 strana" : "2 strane"}
        </div>
      </div>

      <div className="grid gap-4">
        {sides.map((side) => {
          const photo = photos.find((item) => item.documentSide === side);

          return (
            <div key={side} className="rounded-[20px] border border-white/10 bg-black/15 p-4">
              <div className="mb-3 text-sm font-medium text-white">{sideLabel(side, sides.length)}</div>
              <Camera
                buttonLabel={sideButtonLabel(side, sides.length)}
                disabled={readOnly}
                multiple={false}
                onCapture={(files) => saveFiles(files, side)}
                title={title}
              />
              {photo ? (
                <div className="relative mt-3 overflow-hidden rounded-[18px] bg-white/5">
                  <img
                    alt={`${title} ${sideLabel(side, sides.length)}`}
                    className="aspect-[4/3] w-full object-cover"
                    src={photo.dataUrl}
                  />
                  {!readOnly ? (
                    <button
                      className={`absolute right-2 top-2 rounded-full border px-3 py-1 text-xs ${theme.button}`}
                      onClick={() => removePhoto(photo.id)}
                      type="button"
                    >
                      Obrisi
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VehicleSection({
  accent,
  title,
  vehicle,
  onChange,
  readOnly = false
}: VehicleSectionProps) {
  const theme = accentTheme[accent];

  return (
    <Card className={`space-y-5 border-2 ${theme.card}`}>
      <div className="space-y-2">
        <div className={`inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.24em] ${theme.pill}`}>
          {title}
        </div>
        <h3 className={`text-2xl font-semibold ${theme.text}`}>{title}</h3>
      </div>

      <div className="grid gap-4">
        <DocumentUploader
          accent={accent}
          documentType="driver-license"
          onChange={onChange}
          photoKind={vehicle.side === "A" ? "document-a" : "document-b"}
          readOnly={readOnly}
          sides={["front", "back"]}
          title={`Vozacka dozvola ${vehicle.side}`}
          vehicle={vehicle}
        />
        <DocumentUploader
          accent={accent}
          documentType="registration"
          onChange={onChange}
          photoKind={vehicle.side === "A" ? "document-a" : "document-b"}
          readOnly={readOnly}
          sides={["front", "back"]}
          title={`Saobracajna dozvola ${vehicle.side}`}
          vehicle={vehicle}
        />
        <DocumentUploader
          accent={accent}
          documentType="policy"
          onChange={onChange}
          photoKind={vehicle.side === "A" ? "document-a" : "document-b"}
          readOnly={readOnly}
          sides={["front"]}
          title={`Polisa ${vehicle.side}`}
          vehicle={vehicle}
        />
      </div>
    </Card>
  );
}

export default function DocumentationStep({
  vehicleA,
  onVehicleAChange,
  readOnly = false
}: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-[30px] font-semibold text-white">Dokumentacija</h2>
      </div>

      <VehicleSection
        accent="blue"
        onChange={onVehicleAChange}
        readOnly={readOnly}
        title="Dokumenta za vozilo A"
        vehicle={vehicleA}
      />
    </div>
  );
}
