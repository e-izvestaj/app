import { useMemo, useState } from "react";
import Button from "../../components/Button";
import Camera from "../../components/Camera";
import Card from "../../components/Card";
import { extractDocumentSuggestion } from "../../lib/ocr";
import {
  INSURER_OPTIONS,
  createId,
  getVehicleSectionMissingFields,
  type VehicleSection
} from "../../lib/utils";
import type {
  DocumentSuggestion,
  DocumentType,
  PhotoAsset,
  PhotoKind,
  VehicleDraft
} from "../../types";

type AccentTone = "red" | "blue";

type Props = {
  title: string;
  section: VehicleSection;
  value: VehicleDraft;
  onChange: (value: VehicleDraft) => void;
  readOnly?: boolean;
  accent?: AccentTone;
};

type SectionMode = "manual" | "ocr";

const sectionToDocumentType: Record<VehicleSection, DocumentType> = {
  driver: "driver-license",
  vehicle: "registration",
  policy: "policy"
};

const sectionConfig: Record<
  VehicleSection,
  {
    title: string;
    subtitle: string;
    cameraTitle: string;
    cameraHelper: string;
    photoHint: string;
    ocrBusyLabel: string;
    ocrActionLabel: string;
  }
> = {
  driver: {
    title: "Fotografiši vozačku dozvolu",
    subtitle: "Sačuvaj dokument, pa izaberi da li unosiš ručno ili samo pokušavaš OCR pomoć.",
    cameraTitle: "Vozačka dozvola",
    cameraHelper: "Slika dokumenta ostaje uz zapisnik zbog verodostojnosti.",
    photoHint: "Dodaj jasnu fotografiju vozačke dozvole.",
    ocrBusyLabel: "Očitavam vozačku...",
    ocrActionLabel: "Očitaj podatke"
  },
  vehicle: {
    title: "Fotografiši saobraćajnu dozvolu",
    subtitle: "Dokument se prvo sačuva, a ispod biraš ručni unos ili OCR sa slike.",
    cameraTitle: "Saobraćajna dozvola",
    cameraHelper: "Po mogućstvu dodaj obe strane dokumenta.",
    photoHint: "Dodaj jednu ili dve fotografije saobraćajne dozvole.",
    ocrBusyLabel: "Očitavam saobraćajnu...",
    ocrActionLabel: "Očitaj podatke"
  },
  policy: {
    title: "Fotografiši polisu osiguranja",
    subtitle: "Polisa ostaje priložena izveštaju, a OCR je samo pomoćna opcija.",
    cameraTitle: "Polisa osiguranja",
    cameraHelper: "Dodaj jasnu sliku polise ili više strana ako su podaci raspoređeni.",
    photoHint: "Dodaj fotografiju polise osiguranja.",
    ocrBusyLabel: "Očitavam polisu...",
    ocrActionLabel: "Očitaj podatke"
  }
};

const accentClassMap: Record<AccentTone, { ring: string; soft: string; text: string; tab: string }> = {
  red: {
    ring: "border-red-400/35",
    soft: "bg-red-500/10 border-red-400/20",
    text: "text-red-200",
    tab: "bg-red-500 text-white"
  },
  blue: {
    ring: "border-accent/35",
    soft: "bg-accent/10 border-accent/20",
    text: "text-accent",
    tab: "bg-accent text-white"
  }
};

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
  list,
  placeholder,
  invalid = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  type?: string;
  list?: string;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className={`text-sm ${invalid ? "text-red-200" : "text-white/60"}`}>{label}</span>
      <input
        className={`input-glass ${invalid ? "border border-red-400/70 bg-red-500/8 placeholder:text-red-200/80" : ""}`}
        disabled={readOnly}
        list={list}
        placeholder={invalid ? placeholder || "Obavezno polje" : placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ModeTabs({
  value,
  onChange,
  readOnly = false,
  accent = "blue"
}: {
  value: SectionMode;
  onChange: (next: SectionMode) => void;
  readOnly?: boolean;
  accent?: AccentTone;
}) {
  const accentClasses = accentClassMap[accent];

  return (
    <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
      {(["manual", "ocr"] as SectionMode[]).map((mode) => (
        <button
          key={mode}
          className={`rounded-full px-4 py-2 text-sm transition ${
            value === mode ? accentClasses.tab : "text-white/60"
          }`}
          disabled={readOnly}
          onClick={() => onChange(mode)}
          type="button"
        >
          {mode === "manual" ? "Unesi ručno" : "OCR sa slike"}
        </button>
      ))}
    </div>
  );
}

function ReviewCard({
  suggestion,
  onFieldChange,
  onConfirm,
  onClear,
  readOnly = false,
  accent = "blue"
}: {
  suggestion: DocumentSuggestion;
  onFieldChange: (key: string, value: string) => void;
  onConfirm: () => void;
  onClear: () => void;
  readOnly?: boolean;
  accent?: AccentTone;
}) {
  const accentClasses = accentClassMap[accent];

  return (
    <Card className={`space-y-4 border ${accentClasses.ring} ${accentClasses.soft}`}>
      <div className="space-y-1">
        <div className={`text-xs uppercase tracking-[0.26em] ${accentClasses.text}`}>OCR assist</div>
        <div className="text-lg font-semibold text-white">Proveri očitane podatke</div>
        <div className="text-sm text-white/60">
          OCR je opcioni pomoćnik. Potvrđuješ samo ono što zaista želiš da upišeš.
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {suggestion.fields.map((field) => (
          <Field
            key={field.key}
            label={field.label}
            onChange={(nextValue) => onFieldChange(field.key, nextValue)}
            readOnly={readOnly}
            value={field.value}
          />
        ))}
      </div>
      {suggestion.rawText ? (
        <div className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-3">
          <div className="text-xs uppercase tracking-[0.24em] text-white/40">OCR tekst</div>
          <div className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-sm text-white/65">
            {suggestion.rawText}
          </div>
        </div>
      ) : null}
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

function PhotoStrip({
  title,
  helper,
  hint,
  photos,
  readOnly = false,
  onCapture,
  onDelete
}: {
  title: string;
  helper: string;
  hint: string;
  photos: PhotoAsset[];
  readOnly?: boolean;
  onCapture: (files: FileList) => Promise<void>;
  onDelete: (photoId: string) => void;
}) {
  return (
    <div className="space-y-3">
      <Camera disabled={readOnly} helper={helper} onCapture={onCapture} title={title} />
      <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
        {hint}
      </div>
      {photos.length ? (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative overflow-hidden rounded-[18px] bg-white/5">
              <img alt={title} className="aspect-[4/3] w-full object-cover" src={photo.dataUrl} />
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
    </div>
  );
}

function DriverFields({
  value,
  readOnly,
  isMissing,
  onChange
}: {
  value: VehicleDraft;
  readOnly: boolean;
  isMissing: (label: string) => boolean;
  onChange: (next: VehicleDraft) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field invalid={isMissing("Prezime vozaÄa")} label="Prezime" onChange={(driverLastName) => onChange({ ...value, driverLastName })} placeholder="Prezime" readOnly={readOnly} value={value.driverLastName} />
        <Field invalid={isMissing("Ime vozaÄa")} label="Ime" onChange={(driverFirstName) => onChange({ ...value, driverFirstName })} placeholder="Ime" readOnly={readOnly} value={value.driverFirstName} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field invalid={isMissing("Broj vozaÄke dozvole")} label="Broj vozačke" onChange={(driverLicenseNumber) => onChange({ ...value, driverLicenseNumber })} placeholder="Broj vozačke" readOnly={readOnly} value={value.driverLicenseNumber} />
        <Field invalid={isMissing("Datum roÄ‘enja")} label="Datum rođenja" onChange={(driverBirthDate) => onChange({ ...value, driverBirthDate })} readOnly={readOnly} type="date" value={value.driverBirthDate} />
      </div>
      <Field invalid={isMissing("Adresa vozaÄa")} label="Adresa" onChange={(driverAddress) => onChange({ ...value, driverAddress })} placeholder="Adresa" readOnly={readOnly} value={value.driverAddress} />
      <div className="grid grid-cols-2 gap-3">
        <Field invalid={isMissing("Grad vozaÄa")} label="Grad" onChange={(driverCity) => onChange({ ...value, driverCity })} placeholder="Grad" readOnly={readOnly} value={value.driverCity} />
        <Field invalid={isMissing("Kategorija dozvole")} label="Kategorija" onChange={(driverLicenseCategory) => onChange({ ...value, driverLicenseCategory })} placeholder="A, B, C..." readOnly={readOnly} value={value.driverLicenseCategory} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field invalid={isMissing("Telefon vozaÄa")} label="Telefon" onChange={(driverPhone) => onChange({ ...value, driverPhone })} placeholder="Telefon" readOnly={readOnly} type="tel" value={value.driverPhone} />
        <Field invalid={isMissing("E-mail vozaÄa")} label="E-mail" onChange={(driverEmail) => onChange({ ...value, driverEmail })} placeholder="E-mail" readOnly={readOnly} type="email" value={value.driverEmail} />
      </div>
    </div>
  );
}

function VehicleFields({
  value,
  readOnly,
  isMissing,
  onChange
}: {
  value: VehicleDraft;
  readOnly: boolean;
  isMissing: (label: string) => boolean;
  onChange: (next: VehicleDraft) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field invalid={isMissing("Registarska oznaka")} label="Registracija" onChange={(plate) => onChange({ ...value, plate })} placeholder="Registracija" readOnly={readOnly} value={value.plate} />
        <Field invalid={isMissing("Marka vozila")} label="Marka" onChange={(make) => onChange({ ...value, make })} placeholder="Marka" readOnly={readOnly} value={value.make} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field invalid={isMissing("Model vozila")} label="Model" onChange={(model) => onChange({ ...value, model })} placeholder="Model" readOnly={readOnly} value={value.model} />
        <Field invalid={isMissing("Tip vozila")} label="Tip" onChange={(type) => onChange({ ...value, type })} placeholder="Tip" readOnly={readOnly} value={value.type} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="VIN" onChange={(vin) => onChange({ ...value, vin })} placeholder="VIN" readOnly={readOnly} value={value.vin} />
        <Field invalid={isMissing("DrÅ¾ava registracije")} label="Država registracije" onChange={(registrationCountry) => onChange({ ...value, registrationCountry })} placeholder="Država registracije" readOnly={readOnly} value={value.registrationCountry} />
      </div>
    </div>
  );
}

function PolicyFields({
  value,
  readOnly,
  insurerListId,
  isMissing,
  onChange
}: {
  value: VehicleDraft;
  readOnly: boolean;
  insurerListId: string;
  isMissing: (label: string) => boolean;
  onChange: (next: VehicleDraft) => void;
}) {
  return (
    <div className="space-y-4">
      <datalist id={insurerListId}>
        {INSURER_OPTIONS.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <Field invalid={isMissing("OsiguravajuÄ‡a kuÄ‡a")} label="Osiguravajuća kuća" list={insurerListId} onChange={(insurer) => onChange({ ...value, insurer })} placeholder="Osiguravajuća kuća" readOnly={readOnly} value={value.insurer} />
      <div className="grid grid-cols-2 gap-3">
        <Field invalid={isMissing("Broj ugovora")} label="Broj polise" onChange={(policyNumber) => onChange({ ...value, policyNumber })} placeholder="Broj polise" readOnly={readOnly} value={value.policyNumber} />
        <Field label="Ugovarač osiguranja" onChange={(ownerLastName) => onChange({ ...value, ownerLastName })} placeholder="Prezime ugovarača" readOnly={readOnly} value={value.ownerLastName} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field invalid={isMissing("Polisa vaÅ¾i do")} label="Datum važenja" onChange={(policyValidUntil) => onChange({ ...value, policyValidUntil })} readOnly={readOnly} type="date" value={value.policyValidUntil} />
        <Field invalid={isMissing("Polisa vaÅ¾i od")} label="Važi od" onChange={(policyValidFrom) => onChange({ ...value, policyValidFrom })} readOnly={readOnly} type="date" value={value.policyValidFrom} />
      </div>
    </div>
  );
}

export default function VehicleForm({
  title,
  section,
  value,
  onChange,
  readOnly = false,
  accent = "blue"
}: Props) {
  const [isReading, setIsReading] = useState(false);
  const [mode, setMode] = useState<SectionMode>("manual");
  const insurerListId = useMemo(() => `insurer-${value.side}-${section}`, [section, value.side]);
  const vehicleDocumentKind: PhotoKind = value.side === "A" ? "document-a" : "document-b";
  const documentType = sectionToDocumentType[section];
  const config = sectionConfig[section];
  const accentClasses = accentClassMap[accent];
  const missingFields = getVehicleSectionMissingFields(value, section);
  const suggestion = value.ocrSuggestions[documentType];
  const photos = value.documentPhotos.filter((photo) => photo.documentType === documentType);

  const isMissing = (label: string) => missingFields.includes(label);

  const handleCapture = async (files: FileList) => {
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

  const runOcr = async () => {
    const latestPhoto = [...photos].pop();
    if (!latestPhoto) {
      return;
    }

    setIsReading(true);
    try {
      const nextSuggestion = await extractDocumentSuggestion(latestPhoto, documentType);
      onChange({
        ...value,
        ocrStatus: "ready",
        ocrSuggestions: {
          ...value.ocrSuggestions,
          [documentType]: nextSuggestion
        }
      });
    } finally {
      setIsReading(false);
    }
  };

  const changeSuggestionField = (key: string, nextValue: string) => {
    if (!suggestion) {
      return;
    }

    onChange({
      ...value,
      ocrSuggestions: {
        ...value.ocrSuggestions,
        [documentType]: {
          ...suggestion,
          fields: suggestion.fields.map((field) =>
            field.key === key ? { ...field, value: nextValue } : field
          )
        }
      }
    });
  };

  const confirmSuggestion = () => {
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
        [documentType]: {
          ...suggestion,
          status: "confirmed"
        }
      }
    } as VehicleDraft);

    setMode("manual");
  };

  const clearSuggestion = () => {
    const nextSuggestions = { ...value.ocrSuggestions };
    delete nextSuggestions[documentType];
    onChange({
      ...value,
      ocrSuggestions: nextSuggestions
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className={`inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.26em] ${accentClasses.ring} ${accentClasses.text}`}>
          {title}
        </div>
        <h2 className="text-[30px] font-semibold text-white">{title}</h2>
        <p className="text-sm text-white/60">{config.subtitle}</p>
      </div>

      <Card className={`space-y-4 border ${accentClasses.ring}`}>
        <PhotoStrip
          helper={config.cameraHelper}
          hint={config.photoHint}
          onCapture={handleCapture}
          onDelete={(photoId) =>
            onChange({
              ...value,
              documentPhotos: value.documentPhotos.filter((item) => item.id !== photoId)
            })
          }
          photos={photos}
          readOnly={readOnly}
          title={config.cameraTitle}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-white/60">Posle fotografije izaberi kako želiš da uneseš podatke.</div>
          <ModeTabs accent={accent} onChange={setMode} readOnly={readOnly} value={mode} />
        </div>
      </Card>

      <Card className={`space-y-4 border ${accentClasses.ring}`}>
        {missingFields.length ? (
          <div className="text-sm text-red-200">Obavezna polja su označena crveno.</div>
        ) : (
          <div className="text-sm text-white/55">Korak je kompletiran i spreman za nastavak.</div>
        )}

        {mode === "manual" ? (
          section === "driver" ? (
            <DriverFields isMissing={isMissing} onChange={onChange} readOnly={readOnly} value={value} />
          ) : section === "vehicle" ? (
            <VehicleFields isMissing={isMissing} onChange={onChange} readOnly={readOnly} value={value} />
          ) : (
            <PolicyFields
              insurerListId={insurerListId}
              isMissing={isMissing}
              onChange={onChange}
              readOnly={readOnly}
              value={value}
            />
          )
        ) : (
          <div className="space-y-3">
            <Button
              disabled={readOnly || photos.length === 0}
              fullWidth={false}
              onClick={() => void runOcr()}
              type="button"
              variant="secondary"
            >
              {isReading ? config.ocrBusyLabel : config.ocrActionLabel}
            </Button>
            {!photos.length ? (
              <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/55">
                Prvo dodaj fotografiju dokumenta, pa tek onda probaj OCR.
              </div>
            ) : null}
            {suggestion ? (
              <ReviewCard
                accent={accent}
                onClear={clearSuggestion}
                onConfirm={confirmSuggestion}
                onFieldChange={changeSuggestionField}
                readOnly={readOnly}
                suggestion={suggestion}
              />
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
}
