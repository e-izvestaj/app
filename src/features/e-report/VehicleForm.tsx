import { useMemo, useState } from "react";
import Button from "../../components/Button";
import Camera from "../../components/Camera";
import Card from "../../components/Card";
import { mockOcrFromPhoto } from "../../lib/ocr";
import { INSURER_OPTIONS, createId, getVehicleMissingFields } from "../../lib/utils";
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

type SectionKey = "driver" | "registration" | "policy";

const sectionToDocumentType: Record<SectionKey, DocumentType> = {
  driver: "driver-license",
  registration: "registration",
  policy: "policy"
};

const documentLabels: Record<DocumentType, string> = {
  "driver-license": "Vozačka dozvola",
  registration: "Saobraćajna dozvola",
  policy: "Polisa osiguranja"
};

function fileToDataUrl(file: File) {
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

function ReviewCard({
  title,
  suggestion,
  onFieldChange,
  onConfirm,
  onClear,
  readOnly = false
}: {
  title: string;
  suggestion: DocumentSuggestion;
  onFieldChange: (key: string, value: string) => void;
  onConfirm: () => void;
  onClear: () => void;
  readOnly?: boolean;
}) {
  return (
    <Card className="space-y-4 border border-accent/20 bg-accent/8">
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-[0.26em] text-accent">OCR review</div>
        <div className="text-lg font-semibold text-white">Proverite prepoznate podatke</div>
        <div className="text-sm text-white/60">
          {title} je samo predlog. Pre potvrde sve može da se ispravi ili dopuni.
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
      <div className="grid grid-cols-2 gap-3">
        <Button disabled={readOnly} onClick={onConfirm} type="button">
          Potvrdi i unesi
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
  const missingFields = getVehicleMissingFields(value);

  const driverMissing = missingFields.filter((field) =>
    [
      "Prezime vozača",
      "Ime vozača",
      "Datum rođenja",
      "Adresa vozača",
      "Grad vozača",
      "Telefon vozača",
      "E-mail vozača",
      "Broj vozačke dozvole",
      "Kategorija dozvole",
      "Važenje vozačke dozvole"
    ].includes(field)
  );

  const registrationMissing = missingFields.filter((field) =>
    [
      "Marka vozila",
      "Model vozila",
      "Tip vozila",
      "Registarska oznaka",
      "Država registracije"
    ].includes(field)
  );

  const policyMissing = missingFields.filter((field) =>
    [
      "Prezime ugovarača",
      "Ime ugovarača",
      "Adresa ugovarača",
      "Grad ugovarača",
      "Poštanski broj ugovarača",
      "Država ugovarača",
      "Osiguravajuća kuća",
      "Broj ugovora",
      "Polisa važi od",
      "Polisa važi do",
      "Filijala / posrednik",
      "Naziv filijale",
      "Adresa osiguranja",
      "Grad osiguranja",
      "Država osiguranja"
    ].includes(field)
  );

  const isMissing = (label: string) => missingFields.includes(label);

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

  const handleCapture = (section: SectionKey) => async (files: FileList) => {
    const documentType = sectionToDocumentType[section];
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

  const runMockOcr = async (section: SectionKey) => {
    const documentType = sectionToDocumentType[section];
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

  const renderOcrPanel = (
    section: SectionKey,
    titleText: string,
    helper: string,
    photoHint: string,
    suggestion: DocumentSuggestion | undefined
  ) => {
    const documentType = sectionToDocumentType[section];
    const photos = documentPhotosFor(documentType);

    return (
      <div className="space-y-3">
        <Camera
          disabled={readOnly}
          helper={helper}
          onCapture={handleCapture(section)}
          title={titleText}
        />
        <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
          {photoHint}
        </div>
        {photos.length ? <div className="grid grid-cols-2 gap-3">{photos.map(renderThumb)}</div> : null}
        {photos.length ? (
          <Button
            disabled={readOnly}
            fullWidth={false}
            onClick={() => void runMockOcr(section)}
            type="button"
            variant="secondary"
          >
            {isReading === documentType ? "Čitam dokument..." : "Pokreni OCR prepoznavanje"}
          </Button>
        ) : null}
        {suggestion ? (
          <ReviewCard
            onClear={() => updateSuggestion(documentType, null)}
            onConfirm={() => confirmSuggestion(documentType)}
            onFieldChange={(key, nextValue) => changeSuggestionField(documentType, key, nextValue)}
            readOnly={readOnly}
            suggestion={suggestion}
            title={documentLabels[documentType]}
          />
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">{title}</h2>
        <p className="text-sm text-white/60">
          Prvo unosimo podatke vozača, zatim vozilo i osiguranje. Bez obaveznih polja nema nastavka
          na sledeći ekran.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="space-y-4">
          <div className="text-sm uppercase tracking-[0.24em] text-white/40">Vozač {value.side}</div>
          {driverMissing.length ? (
            <div className="rounded-[18px] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              Nedostaju obavezni podaci za vozača. Obeležena polja treba dopuniti.
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <Field
              invalid={isMissing("Prezime vozača")}
              label="Prezime"
              onChange={(driverLastName) => onChange({ ...value, driverLastName })}
              placeholder="Prezime"
              readOnly={readOnly}
              value={value.driverLastName}
            />
            <Field
              invalid={isMissing("Ime vozača")}
              label="Ime"
              onChange={(driverFirstName) => onChange({ ...value, driverFirstName })}
              placeholder="Ime"
              readOnly={readOnly}
              value={value.driverFirstName}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              invalid={isMissing("Datum rođenja")}
              label="Datum rođenja"
              onChange={(driverBirthDate) => onChange({ ...value, driverBirthDate })}
              readOnly={readOnly}
              type="date"
              value={value.driverBirthDate}
            />
            <Field
              invalid={isMissing("Grad vozača")}
              label="Grad"
              onChange={(driverCity) => onChange({ ...value, driverCity })}
              placeholder="Grad"
              readOnly={readOnly}
              value={value.driverCity}
            />
          </div>
          <Field
            invalid={isMissing("Adresa vozača")}
            label="Adresa"
            onChange={(driverAddress) => onChange({ ...value, driverAddress })}
            placeholder="Adresa"
            readOnly={readOnly}
            value={value.driverAddress}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              invalid={isMissing("Telefon vozača")}
              label="Telefon"
              onChange={(driverPhone) => onChange({ ...value, driverPhone })}
              placeholder="Telefon"
              readOnly={readOnly}
              type="tel"
              value={value.driverPhone}
            />
            <Field
              invalid={isMissing("E-mail vozača")}
              label="E-mail"
              onChange={(driverEmail) => onChange({ ...value, driverEmail })}
              placeholder="E-mail"
              readOnly={readOnly}
              type="email"
              value={value.driverEmail}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              invalid={isMissing("Broj vozačke dozvole")}
              label="Vozačka dozvola br."
              onChange={(driverLicenseNumber) => onChange({ ...value, driverLicenseNumber })}
              placeholder="Broj dozvole"
              readOnly={readOnly}
              value={value.driverLicenseNumber}
            />
            <Field
              invalid={isMissing("Kategorija dozvole")}
              label="Kategorija"
              onChange={(driverLicenseCategory) => onChange({ ...value, driverLicenseCategory })}
              readOnly={readOnly}
              placeholder="A, B, C..."
              value={value.driverLicenseCategory}
            />
          </div>
          <Field
            invalid={isMissing("Važenje vozačke dozvole")}
            label="Vozačka dozvola važi do"
            onChange={(driverLicenseValidUntil) => onChange({ ...value, driverLicenseValidUntil })}
            readOnly={readOnly}
            type="date"
            value={value.driverLicenseValidUntil}
          />
        </Card>
        {renderOcrPanel(
          "driver",
          "Otvori kameru i slikaj vozačku dozvolu",
          "Automatski unos podataka sa vozačke. Posle čitanja sve ostaje ručno izmenjivo.",
          "Dodaj jasnu fotografiju prednje strane vozačke dozvole.",
          value.ocrSuggestions["driver-license"]
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="space-y-4">
          <div className="text-sm uppercase tracking-[0.24em] text-white/40">Vozilo {value.side}</div>
          {registrationMissing.length ? (
            <div className="rounded-[18px] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              Dopuni obavezna polja za vozilo pre nastavka.
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <Field
              invalid={isMissing("Marka vozila")}
              label="Marka"
              onChange={(make) => onChange({ ...value, make })}
              placeholder="Marka"
              readOnly={readOnly}
              value={value.make}
            />
            <Field
              invalid={isMissing("Model vozila")}
              label="Model"
              onChange={(model) => onChange({ ...value, model })}
              placeholder="Model"
              readOnly={readOnly}
              value={value.model}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              invalid={isMissing("Tip vozila")}
              label="Tip"
              onChange={(type) => onChange({ ...value, type })}
              placeholder="Tip"
              readOnly={readOnly}
              value={value.type}
            />
            <Field
              invalid={isMissing("Registarska oznaka")}
              label="Registarska oznaka"
              onChange={(plate) => onChange({ ...value, plate })}
              placeholder="Registarska oznaka"
              readOnly={readOnly}
              value={value.plate}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              invalid={isMissing("Država registracije")}
              label="Država registracije"
              onChange={(registrationCountry) => onChange({ ...value, registrationCountry })}
              readOnly={readOnly}
              value={value.registrationCountry}
            />
            <Field
              label="VIN"
              onChange={(vin) => onChange({ ...value, vin })}
              readOnly={readOnly}
              value={value.vin}
            />
          </div>
          <div className="text-sm uppercase tracking-[0.2em] text-white/40">Prikolica</div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Registarska oznaka prikolice"
              onChange={(trailerPlate) => onChange({ ...value, trailerPlate })}
              readOnly={readOnly}
              value={value.trailerPlate}
            />
            <Field
              label="Država registracije prikolice"
              onChange={(trailerRegistrationCountry) =>
                onChange({ ...value, trailerRegistrationCountry })
              }
              readOnly={readOnly}
              value={value.trailerRegistrationCountry}
            />
          </div>
        </Card>
        {renderOcrPanel(
          "registration",
          "Otvori kameru i slikaj saobraćajnu dozvolu",
          "Za najbolji rezultat slikaj obe strane dokumenta. Posle OCR-a proveri svaki podatak.",
          "Dodaj 2 fotografije saobraćajne dozvole, po mogućstvu obe strane.",
          value.ocrSuggestions.registration
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="space-y-4">
          <div className="text-sm uppercase tracking-[0.24em] text-white/40">Osiguravač i polisa</div>
          {policyMissing.length ? (
            <div className="rounded-[18px] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              Dopuni obavezna polja za osiguranje pre nastavka.
            </div>
          ) : null}
          <div className="text-sm font-medium text-white/75">Ugovarač osiguranja</div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              invalid={isMissing("Prezime ugovarača")}
              label="Prezime"
              onChange={(ownerLastName) => onChange({ ...value, ownerLastName })}
              placeholder="Prezime"
              readOnly={readOnly}
              value={value.ownerLastName}
            />
            <Field
              invalid={isMissing("Ime ugovarača")}
              label="Ime"
              onChange={(ownerFirstName) => onChange({ ...value, ownerFirstName })}
              placeholder="Ime"
              readOnly={readOnly}
              value={value.ownerFirstName}
            />
          </div>
          <Field
            invalid={isMissing("Adresa ugovarača")}
            label="Adresa"
            onChange={(ownerAddress) => onChange({ ...value, ownerAddress })}
            placeholder="Adresa"
            readOnly={readOnly}
            value={value.ownerAddress}
          />
          <div className="grid grid-cols-3 gap-3">
            <Field
              invalid={isMissing("Grad ugovarača")}
              label="Grad"
              onChange={(ownerCity) => onChange({ ...value, ownerCity })}
              placeholder="Grad"
              readOnly={readOnly}
              value={value.ownerCity}
            />
            <Field
              invalid={isMissing("Poštanski broj ugovarača")}
              label="Poštanski broj"
              onChange={(ownerPostalCode) => onChange({ ...value, ownerPostalCode })}
              placeholder="Poštanski broj"
              readOnly={readOnly}
              value={value.ownerPostalCode}
            />
            <Field
              invalid={isMissing("Država ugovarača")}
              label="Država"
              onChange={(ownerCountry) => onChange({ ...value, ownerCountry })}
              readOnly={readOnly}
              value={value.ownerCountry}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Telefon"
              onChange={(ownerPhone) => onChange({ ...value, ownerPhone })}
              readOnly={readOnly}
              type="tel"
              value={value.ownerPhone}
            />
            <Field
              label="E-mail"
              onChange={(ownerEmail) => onChange({ ...value, ownerEmail })}
              readOnly={readOnly}
              type="email"
              value={value.ownerEmail}
            />
          </div>

          <div className="text-sm font-medium text-white/75">Osiguravajuća kuća</div>
          <Field
            invalid={isMissing("Osiguravajuća kuća")}
            label="Naziv osiguravajuće kuće"
            list={insurerListId}
            onChange={(insurer) => onChange({ ...value, insurer })}
            placeholder="Osiguravajuća kuća"
            readOnly={readOnly}
            value={value.insurer}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              invalid={isMissing("Broj ugovora")}
              label="Broj ugovora"
              onChange={(policyNumber) => onChange({ ...value, policyNumber })}
              placeholder="Broj ugovora"
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
              invalid={isMissing("Polisa važi od")}
              label="Polisa važi od"
              onChange={(policyValidFrom) => onChange({ ...value, policyValidFrom })}
              readOnly={readOnly}
              type="date"
              value={value.policyValidFrom}
            />
            <Field
              invalid={isMissing("Polisa važi do")}
              label="Polisa važi do"
              onChange={(policyValidUntil) => onChange({ ...value, policyValidUntil })}
              readOnly={readOnly}
              type="date"
              value={value.policyValidUntil}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              invalid={isMissing("Filijala / posrednik")}
              label="Filijala / posrednik"
              onChange={(insuranceBranch) => onChange({ ...value, insuranceBranch })}
              placeholder="Filijala / posrednik"
              readOnly={readOnly}
              value={value.insuranceBranch}
            />
            <Field
              invalid={isMissing("Naziv filijale")}
              label="Naziv filijale"
              onChange={(insuranceOfficeName) => onChange({ ...value, insuranceOfficeName })}
              placeholder="Naziv filijale"
              readOnly={readOnly}
              value={value.insuranceOfficeName}
            />
          </div>
          <Field
            invalid={isMissing("Adresa osiguranja")}
            label="Adresa filijale"
            onChange={(insuranceAddress) => onChange({ ...value, insuranceAddress })}
            placeholder="Adresa filijale"
            readOnly={readOnly}
            value={value.insuranceAddress}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              invalid={isMissing("Grad osiguranja")}
              label="Grad filijale"
              onChange={(insuranceCity) => onChange({ ...value, insuranceCity })}
              placeholder="Grad filijale"
              readOnly={readOnly}
              value={value.insuranceCity}
            />
            <Field
              invalid={isMissing("Država osiguranja")}
              label="Država filijale"
              onChange={(insuranceCountry) => onChange({ ...value, insuranceCountry })}
              readOnly={readOnly}
              value={value.insuranceCountry}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Telefon filijale"
              onChange={(insurancePhone) => onChange({ ...value, insurancePhone })}
              readOnly={readOnly}
              type="tel"
              value={value.insurancePhone}
            />
            <Field
              label="E-mail filijale"
              onChange={(insuranceEmail) => onChange({ ...value, insuranceEmail })}
              readOnly={readOnly}
              type="email"
              value={value.insuranceEmail}
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm text-white/60">Materijalna šteta na vozilu pokrivena ugovorom?</div>
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
        <>
          <datalist id={insurerListId}>
            {INSURER_OPTIONS.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          {renderOcrPanel(
            "policy",
            "Otvori kameru i slikaj polisu osiguranja",
            "Slikaj polisu za automatski unos osiguravača i podataka sa ugovora. Sve ostaje editabilno.",
            "Dodaj jasnu fotografiju polise. Ako je potrebno, dodaj više strana.",
            value.ocrSuggestions.policy
          )}
        </>
      </section>

      <Card className="space-y-4">
        <Field
          label="Mesto oštećenja"
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
      </Card>
    </div>
  );
}
