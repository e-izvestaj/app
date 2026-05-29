import Camera from "../../components/Camera";
import Card from "../../components/Card";
import { createId } from "../../lib/utils";
import type { DocumentSide, DocumentType, PhotoKind, VehicleDraft } from "../../types";

type Props = {
  vehicleA: VehicleDraft;
  vehicleB: VehicleDraft;
  onVehicleAChange: (vehicle: VehicleDraft) => void;
  onVehicleBChange: (vehicle: VehicleDraft) => void;
  readOnly?: boolean;
};

type Accent = "red" | "blue";

type DocumentCardProps = {
  accent: Accent;
  title: string;
  documentType: DocumentType;
  photoKind: PhotoKind;
  vehicle: VehicleDraft;
  onChange: (vehicle: VehicleDraft) => void;
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

function sideLabel(side: DocumentSide) {
  return side === "front" ? "Prednja strana" : "Zadnja strana";
}

function sideButtonLabel(side: DocumentSide) {
  return side === "front" ? "Dodaj sliku prednje strane" : "Dodaj sliku zadnje strane";
}

function getDocumentPhotos(vehicle: VehicleDraft, documentType: DocumentType) {
  return vehicle.documentPhotos.filter((photo) => photo.documentType === documentType);
}

function DocumentUploader({
  accent,
  title,
  documentType,
  photoKind,
  vehicle,
  onChange,
  readOnly = false
}: DocumentCardProps) {
  const photos = getDocumentPhotos(vehicle, documentType);
  const accentClass = accent === "red" ? "border-red-400/40" : "border-accent/40";

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

    onChange({
      ...vehicle,
      documentPhotos: [
        ...vehicle.documentPhotos.filter(
          (photo) => !(photo.documentType === documentType && photo.documentSide === side)
        ),
        upload
      ]
    });
  };

  const removePhoto = (photoId: string) => {
    onChange({
      ...vehicle,
      documentPhotos: vehicle.documentPhotos.filter((photo) => photo.id !== photoId)
    });
  };

  return (
    <Card className={`space-y-4 border-2 ${accentClass}`}>
      <div className="text-lg font-semibold text-white">{title}</div>
      <div className="grid gap-4">
        {(["front", "back"] as const).map((side) => {
          const photo = photos.find((item) => item.documentSide === side);

          return (
            <div key={side} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="mb-3 text-sm font-medium text-white">{sideLabel(side)}</div>
              <Camera
                buttonLabel={sideButtonLabel(side)}
                disabled={readOnly}
                multiple={false}
                onCapture={(files) => saveFiles(files, side)}
                title={title}
              />
              {photo ? (
                <div className="relative mt-3 overflow-hidden rounded-[18px] bg-white/5">
                  <img
                    alt={`${title} ${sideLabel(side)}`}
                    className="aspect-[4/3] w-full object-cover"
                    src={photo.dataUrl}
                  />
                  {!readOnly ? (
                    <button
                      className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white"
                      onClick={() => removePhoto(photo.id)}
                      type="button"
                    >
                      Obriši
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function DocumentationStep({
  vehicleA,
  vehicleB,
  onVehicleAChange,
  onVehicleBChange,
  readOnly = false
}: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-[30px] font-semibold text-white">Dokumentacija</h2>

      <DocumentUploader
        accent="red"
        documentType="driver-license"
        onChange={onVehicleAChange}
        photoKind="document-a"
        readOnly={readOnly}
        title="Vozačka dozvola A"
        vehicle={vehicleA}
      />
      <DocumentUploader
        accent="blue"
        documentType="driver-license"
        onChange={onVehicleBChange}
        photoKind="document-b"
        readOnly={readOnly}
        title="Vozačka dozvola B"
        vehicle={vehicleB}
      />
      <DocumentUploader
        accent="red"
        documentType="registration"
        onChange={onVehicleAChange}
        photoKind="document-a"
        readOnly={readOnly}
        title="Saobraćajna dozvola A"
        vehicle={vehicleA}
      />
      <DocumentUploader
        accent="blue"
        documentType="registration"
        onChange={onVehicleBChange}
        photoKind="document-b"
        readOnly={readOnly}
        title="Saobraćajna dozvola B"
        vehicle={vehicleB}
      />
      <DocumentUploader
        accent="red"
        documentType="policy"
        onChange={onVehicleAChange}
        photoKind="document-a"
        readOnly={readOnly}
        title="Polisa A"
        vehicle={vehicleA}
      />
      <DocumentUploader
        accent="blue"
        documentType="policy"
        onChange={onVehicleBChange}
        photoKind="document-b"
        readOnly={readOnly}
        title="Polisa B"
        vehicle={vehicleB}
      />
    </div>
  );
}
