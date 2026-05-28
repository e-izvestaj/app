import { useMemo, useState } from "react";
import Button from "../../components/Button";
import Camera from "../../components/Camera";
import Card from "../../components/Card";
import { mockOcrFromPhoto } from "../../lib/ocr";
import { INSURER_OPTIONS, createId } from "../../lib/utils";
import type {
  DocumentSuggestion,
  DocumentType,
  PhotoAsset,
  PhotoKind,
  VehicleDraft
} from "../../types";

type Props = {
  title: string;
  value: VehicleDraft;
  onChange: (value: VehicleDraft) => void;
  readOnly?: boolean;
};

const documentConfig: Array<{
  type: DocumentType;
  title: string;
  helper: string;
}> = [
  {
    type: "driver-license",
    title: "Vozačka dozvola",
    helper: "Pokušaj OCR ekstrakcije imena, adrese i broja dozvole."
  },
  {
    type: "registration",
    title: "Saobraćajna dozvola",
    helper: "Pokušaj OCR ekstrakcije registracije, marke, modela i VIN-a."
  },
  {
    type: "policy",
    title: "Polisa osiguranja",
    helper: "Pokušaj OCR ekstrakcije osiguravača, broja polise i važenja."
  }
];

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function Field({
  label,
  value,
  onChange,
  readOnly = false,
  type = "text",
  list
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  type?: string;
  list?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm text-white/60">{label}</span>
      <input
        className="input-glass"
        disabled={readOnly}
        list={list}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SuggestionReview({
  suggestion,
  onFieldChange,
  onConfirm,
  onClear,
  readOnly = false
}: {
  suggestion: DocumentSuggestion;
  onFieldChange: (key: string, value: string) => void;
  onConfirm: () => void;
  onClear: () => void;
  readOnly?: boolean;
}) {
  return (
    <Card className="space-y-4 border border-accent/20 bg-accent/8">
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-[0.26em] text-accent">OCR assist</div>
        <div className="text-lg font-semibold text-white">Proverite prepoznate podatke</div>
        <div className="text-sm text-white/60">
          OCR je samo predlog. Svako polje može da se potvrdi, ispravi ili obriše.
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {suggestion.fields.map((field) => (
          <Field
            key={field.key}
            label={field.label}
            onChange={(value) => onFieldChange(field.key, value)}
            readOnly={readOnly}
            value={field.value}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button disabled={readOnly} onClick={onConfirm} type="button">
          Potvrdi podatke
        </Button>
        <Button disabled={readOnly} onClick={onClear} type="button" variant="secondary">
          Obriši predlog
        </Button>
      </div>
    </Card>
  );
}

export default function VehicleForm({ title, value, onChange, readOnly = false }: Props) {
  const [isReading, setIsReading] = useState<DocumentType | null>(null);
  const insurerListId = useMemo(() => `insurer-${value.side}`, [value.side]);

  const vehicleDocumentKind: PhotoKind = value.side === "A" ? "document-a" : "document-b";

  const documentPhotosFor = (documentType: DocumentType) =>
    value.documentPhotos.filter((photo) => photo.documentType === documentType);

  const updateSuggestion = (documentType: DocumentType, suggestion: DocumentSuggestion | null) => {
    const nextSuggestions = { ...value.ocrSuggestions };
    if (suggestion) {
      nextSuggestions[documentType] = suggestion;
    } else {
      delete nextSuggestions[documentType];
    }

    onChange({
      ...value,
      ocrSuggestions: nextSuggestions,
      ocrStatus: suggestion ? "ready" : value.ocrStatus
    });
  };

  const handleCapture = (documentType: DocumentType) => async (files: FileList) => {
    const uploads = await Promise.all(
      Array.from(files).map(async (file) => ({
        id: createId("doc"),
        dataUrl: await fileToDataUrl(file),
        label: file.name,
        kind: vehicleDocumentKind,
        documentType
      }))
    );

    onChange({
      ...value,
      documentPhotos: [...value.documentPhotos, ...uploads]
    });
  };

  const runMockOcr = async (documentType: DocumentType) => {
    const latestPhoto = [...documentPhotosFor(documentType)].pop();
    if (!latestPhoto) {
      return;
    }

    setIsReading(documentType);
    const suggestion = await mockOcrFromPhoto(latestPhoto, documentType);
    setIsReading(null);
    updateSuggestion(documentType, suggestion);
  };

  const changeSuggestionField = (documentType: DocumentType, key: string, nextValue: string) => {
    const suggestion = value.ocrSuggestions[documentType];
    if (!suggestion) {
      return;
    }

    updateSuggestion(documentType, {
      ...suggestion,
      fields: suggestion.fields.map((field) =>
        field.key === key ? { ...field, value: nextValue } : field
      )
    });
  };

  const confirmSuggestion = (documentType: DocumentType) => {
    const suggestion = value.ocrSuggestions[documentType];
    if (!suggestion) {
      return;
    }

    const updates = suggestion.fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.key] = field.value;
      return acc;
    }, {});

    onChange({
      ...value,
      ...updates,
      ocrSuggestions: {
        ...value.ocrSuggestions,
        [documentType]: { ...suggestion, status: "confirmed" }
      },
      ocrStatus: "ready"
    } as VehicleDraft);
  };

  const renderThumb = (photo: PhotoAsset) => (
    <div key={photo.id} className="relative overflow-hidden rounded-[18px] bg-white/5">
      <img alt="Dokument" className="aspect-[4/3] w-full object-cover" src={photo.dataUrl} />
      {readOnly ? null : (
        <button
          className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-xs text-white"
          onClick={() =>
            onChange({
              ...value,
              documentPhotos: value.documentPhotos.filter((item) => item.id !== photo.id)
            })
          }
          type="button"
        >
          Obriši
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">{title}</h2>
        <p className="text-sm text-white/60">OCR assist preko tri dokumenta, uz obaveznu potvrdu korisnika.</p>
      </div>

      {documentConfig.map((document) => {
        const photos = documentPhotosFor(document.type);
        const suggestion = value.ocrSuggestions[document.type];

        return (
          <div key={document.type} className="space-y-3">
            <Camera
              disabled={readOnly}
              helper={document.helper}
              onCapture={handleCapture(document.type)}
              title={document.title}
            />

            {photos.length ? (
              <>
                <div className="grid grid-cols-2 gap-3">{photos.map(renderThumb)}</div>
                <Button
                  disabled={readOnly}
                  fullWidth={false}
                  onClick={() => void runMockOcr(document.type)}
                  type="button"
                  variant="secondary"
                >
                  {isReading === document.type ? "Čitam dokument..." : "Pokreni OCR ekstrakciju"}
                </Button>
              </>
            ) : null}

            {suggestion ? (
              <SuggestionReview
                onClear={() => updateSuggestion(document.type, null)}
                onConfirm={() => confirmSuggestion(document.type)}
                onFieldChange={(key, nextValue) =>
                  changeSuggestionField(document.type, key, nextValue)
                }
                readOnly={readOnly}
                suggestion={suggestion}
              />
            ) : null}
          </div>
        );
      })}

      <datalist id={insurerListId}>
        {INSURER_OPTIONS.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>

      <Card className="space-y-4">
        <div className="text-sm uppercase tracking-[0.24em] text-white/40">Ugovarač osiguranja</div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Prezime"
            onChange={(ownerLastName) => onChange({ ...value, ownerLastName })}
            readOnly={readOnly}
            value={value.ownerLastName}
          />
          <Field
            label="Ime"
            onChange={(ownerFirstName) => onChange({ ...value, ownerFirstName })}
            readOnly={readOnly}
            value={value.ownerFirstName}
          />
        </div>
        <Field
          label="Adresa"
          onChange={(ownerAddress) => onChange({ ...value, ownerAddress })}
          readOnly={readOnly}
          value={value.ownerAddress}
        />
        <div className="grid grid-cols-3 gap-3">
          <Field
            label="Poštanski broj"
            onChange={(ownerPostalCode) => onChange({ ...value, ownerPostalCode })}
            readOnly={readOnly}
            value={value.ownerPostalCode}
          />
          <div className="col-span-2">
            <Field
              label="Država"
              onChange={(ownerCountry) => onChange({ ...value, ownerCountry })}
              readOnly={readOnly}
              value={value.ownerCountry}
            />
          </div>
        </div>
        <Field
          label="Telefon ili e-mail"
          onChange={(ownerContact) => onChange({ ...value, ownerContact })}
          readOnly={readOnly}
          value={value.ownerContact}
        />
      </Card>

      <Card className="space-y-4">
        <div className="text-sm uppercase tracking-[0.24em] text-white/40">Vozilo</div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Marka"
            onChange={(make) => onChange({ ...value, make })}
            readOnly={readOnly}
            value={value.make}
          />
          <Field
            label="Model"
            onChange={(model) => onChange({ ...value, model })}
            readOnly={readOnly}
            value={value.model}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Tip"
            onChange={(type) => onChange({ ...value, type })}
            readOnly={readOnly}
            value={value.type}
          />
          <Field
            label="Registracija"
            onChange={(plate) => onChange({ ...value, plate })}
            readOnly={readOnly}
            value={value.plate}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="VIN"
            onChange={(vin) => onChange({ ...value, vin })}
            readOnly={readOnly}
            value={value.vin}
          />
          <Field
            label="Država registracije"
            onChange={(registrationCountry) => onChange({ ...value, registrationCountry })}
            readOnly={readOnly}
            value={value.registrationCountry}
          />
        </div>
        <Field
          label="Prikolica"
          onChange={(trailerPlate) => onChange({ ...value, trailerPlate })}
          readOnly={readOnly}
          value={value.trailerPlate}
        />
      </Card>

      <Card className="space-y-4">
        <div className="text-sm uppercase tracking-[0.24em] text-white/40">Osiguranje</div>
        <Field
          label="Osiguravajuća kuća"
          list={insurerListId}
          onChange={(insurer) => onChange({ ...value, insurer })}
          readOnly={readOnly}
          value={value.insurer}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Broj ugovora"
            onChange={(policyNumber) => onChange({ ...value, policyNumber })}
            readOnly={readOnly}
            value={value.policyNumber}
          />
          <Field
            label="Broj zelene karte"
            onChange={(greenCardNumber) => onChange({ ...value, greenCardNumber })}
            readOnly={readOnly}
            value={value.greenCardNumber}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Važi od"
            onChange={(policyValidFrom) => onChange({ ...value, policyValidFrom })}
            readOnly={readOnly}
            type="date"
            value={value.policyValidFrom}
          />
          <Field
            label="Važi do"
            onChange={(policyValidUntil) => onChange({ ...value, policyValidUntil })}
            readOnly={readOnly}
            type="date"
            value={value.policyValidUntil}
          />
        </div>
        <Field
          label="Filijala / posrednik"
          onChange={(insuranceBranch) => onChange({ ...value, insuranceBranch })}
          readOnly={readOnly}
          value={value.insuranceBranch}
        />
        <Field
          label="Adresa osiguranja"
          onChange={(insuranceAddress) => onChange({ ...value, insuranceAddress })}
          readOnly={readOnly}
          value={value.insuranceAddress}
        />
        <Field
          label="Telefon ili e-mail"
          onChange={(insuranceContact) => onChange({ ...value, insuranceContact })}
          readOnly={readOnly}
          value={value.insuranceContact}
        />
        <div className="space-y-2">
          <div className="text-sm text-white/60">Materijalna šteta na vozilu pokrivena?</div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              disabled={readOnly}
              variant={value.coveredDamage === true ? "primary" : "secondary"}
              onClick={() => onChange({ ...value, coveredDamage: true })}
              type="button"
            >
              Da
            </Button>
            <Button
              disabled={readOnly}
              variant={value.coveredDamage === false ? "primary" : "secondary"}
              onClick={() => onChange({ ...value, coveredDamage: false })}
              type="button"
            >
              Ne
            </Button>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="text-sm uppercase tracking-[0.24em] text-white/40">Vozač</div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Prezime"
            onChange={(driverLastName) => onChange({ ...value, driverLastName })}
            readOnly={readOnly}
            value={value.driverLastName}
          />
          <Field
            label="Ime"
            onChange={(driverFirstName) => onChange({ ...value, driverFirstName })}
            readOnly={readOnly}
            value={value.driverFirstName}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Datum rođenja"
            onChange={(driverBirthDate) => onChange({ ...value, driverBirthDate })}
            readOnly={readOnly}
            type="date"
            value={value.driverBirthDate}
          />
          <Field
            label="Država"
            onChange={(driverCountry) => onChange({ ...value, driverCountry })}
            readOnly={readOnly}
            value={value.driverCountry}
          />
        </div>
        <Field
          label="Adresa"
          onChange={(driverAddress) => onChange({ ...value, driverAddress })}
          readOnly={readOnly}
          value={value.driverAddress}
        />
        <Field
          label="Telefon ili e-mail"
          onChange={(driverContact) => onChange({ ...value, driverContact })}
          readOnly={readOnly}
          value={value.driverContact}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Vozačka dozvola br."
            onChange={(driverLicenseNumber) => onChange({ ...value, driverLicenseNumber })}
            readOnly={readOnly}
            value={value.driverLicenseNumber}
          />
          <Field
            label="Kategorija"
            onChange={(driverLicenseCategory) => onChange({ ...value, driverLicenseCategory })}
            readOnly={readOnly}
            value={value.driverLicenseCategory}
          />
        </div>
        <Field
          label="Vozačka dozvola važi do"
          onChange={(driverLicenseValidUntil) =>
            onChange({ ...value, driverLicenseValidUntil })
          }
          readOnly={readOnly}
          type="date"
          value={value.driverLicenseValidUntil}
        />
      </Card>

      <Card className="space-y-4">
        <Field
          label="Detektovano mesto oštećenja"
          onChange={(impactZone) => onChange({ ...value, impactZone: impactZone as VehicleDraft["impactZone"] })}
          readOnly={readOnly}
          value={value.impactZone}
        />
        <label className="space-y-2">
          <span className="text-sm text-white/60">Vidljiva oštećenja</span>
          <textarea
            className="input-glass min-h-[120px]"
            disabled={readOnly}
            value={value.visibleDamage}
            onChange={(event) => onChange({ ...value, visibleDamage: event.target.value })}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-white/60">Napomena za vozilo</span>
          <textarea
            className="input-glass min-h-[120px]"
            disabled={readOnly}
            value={value.note}
            onChange={(event) => onChange({ ...value, note: event.target.value })}
          />
        </label>
      </Card>
    </div>
  );
}
