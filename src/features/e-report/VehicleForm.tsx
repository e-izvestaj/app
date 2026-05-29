import { useEffect, useMemo } from "react";
import Camera from "../../components/Camera";
import Card from "../../components/Card";
import {
  INSURER_OPTIONS,
  POSTAL_CODE_CITY_OPTIONS,
  createId,
  getVehicleSectionMissingFields,
  resolveCityFromPostalCode,
  type VehicleSection
} from "../../lib/utils";
import type {
  DocumentSide,
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

const sectionConfig: Record<
  VehicleSection,
  {
    headline: string;
    helper: string;
    cameraTitle: string;
    cameraHelper: string;
    photoHint: string;
    requiresBothSides?: boolean;
  }
> = {
  driver: {
    headline: "Fotografija vozacke dozvole",
    helper: "Papirni obrazac je glavni izvor podataka. Fotografija ostaje iznad forme kao vizuelna pomoc pri unosu.",
    cameraTitle: "Vozacka dozvola",
    cameraHelper: "Prvo dodaj prednju, pa zadnju stranu dokumenta. Obe slike su obavezne.",
    photoHint: "Fotografije ostaju uz zapisnik i kasnije idu u dokazni paket.",
    requiresBothSides: true
  },
  vehicle: {
    headline: "Fotografija saobracajne dozvole",
    helper: "Saobracajna je vizuelna pomoc. Ispod rucno unosis polja koja trazi evropski izvestaj.",
    cameraTitle: "Saobracajna dozvola",
    cameraHelper: "Dodaj prednju i zadnju stranu saobracajne dozvole. Obe slike su obavezne.",
    photoHint: "Dokument ostaje sacuvan uz report.",
    requiresBothSides: true
  },
  policy: {
    headline: "Fotografija polise osiguranja",
    helper: "Polisa ostaje prikazana iznad forme, a korisnik rucno unosi podatke koji idu u zapisnik.",
    cameraTitle: "Polisa osiguranja",
    cameraHelper: "Dodaj jasnu fotografiju ili vise strana ako su podaci rasporedjeni.",
    photoHint: "Fotografija polise ostaje sacuvana uz report."
  }
};

const accentClassMap: Record<AccentTone, { ring: string; soft: string; text: string }> = {
  red: {
    ring: "border-red-400/35",
    soft: "bg-red-500/8 border-red-400/20",
    text: "text-red-200"
  },
  blue: {
    ring: "border-accent/35",
    soft: "bg-accent/8 border-accent/20",
    text: "text-accent"
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

function normalizePostalCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
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

function SelectField({
  label,
  value,
  onChange,
  options,
  readOnly = false,
  invalid = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  readOnly?: boolean;
  invalid?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className={`text-sm ${invalid ? "text-red-200" : "text-white/60"}`}>{label}</span>
      <select
        className={`input-glass text-white ${invalid ? "border border-red-400/70 bg-red-500/8" : ""}`}
        disabled={readOnly}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option className="bg-white text-slate-900" value="">
          Izaberi
        </option>
        {options.map((option) => (
          <option className="bg-white text-slate-900" key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SectionTitle({
  title,
  headline,
  helper,
  accent
}: {
  title: string;
  headline: string;
  helper: string;
  accent: AccentTone;
}) {
  const accentClasses = accentClassMap[accent];

  return (
    <div className="space-y-2">
      <div className={`inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.26em] ${accentClasses.ring} ${accentClasses.text}`}>
        {title}
      </div>
      <h2 className="text-[30px] font-semibold text-white">{headline}</h2>
      <p className="text-sm text-white/60">{helper}</p>
    </div>
  );
}

function PhotoStrip({
  title,
  helper,
  hint,
  photos,
  requiredSides,
  missingLabels = [],
  readOnly = false,
  onCapture,
  onDelete
}: {
  title: string;
  helper: string;
  hint: string;
  photos: PhotoAsset[];
  requiredSides?: DocumentSide[];
  missingLabels?: string[];
  readOnly?: boolean;
  onCapture: (files: FileList, side?: DocumentSide) => Promise<void>;
  onDelete: (photoId: string) => void;
}) {
  const hasBothSides = requiredSides?.length;
  const sidePhotos = hasBothSides
    ? {
        front: photos.find((photo) => photo.documentSide === "front"),
        back: photos.find((photo) => photo.documentSide === "back")
      }
    : null;

  return (
    <div className="space-y-3">
      {hasBothSides && sidePhotos ? (
        <div className="grid gap-3">
          {requiredSides.map((side) => {
            const photo = sidePhotos[side];
            const sideLabel = side === "front" ? "prednje strane" : "zadnje strane";
            const cardTitle = side === "front" ? "Prednja strana" : "Zadnja strana";
            const isMissing = missingLabels.some((label) =>
              label.includes(side === "front" ? "Prednja" : "Zadnja")
            );

            return (
              <div
                key={side}
                className={`rounded-[22px] border p-3 ${
                  isMissing ? "border-red-400/45 bg-red-500/8" : "border-white/10 bg-white/5"
                }`}
              >
                <div className="mb-3 text-sm font-medium text-white">{cardTitle}</div>
                <Camera
                  buttonLabel={`Dodaj sliku ${sideLabel}`}
                  disabled={readOnly}
                  helper={
                    side === "front"
                      ? `${helper} Usmeri kameru na prednju stranu.`
                      : `${helper} Zatim dodaj zadnju stranu.`
                  }
                  multiple={false}
                  onCapture={(files) => onCapture(files, side)}
                  title={title}
                />
                {photo ? (
                  <div className="relative mt-3 overflow-hidden rounded-[18px] bg-white/5">
                    <img alt={`${title} ${cardTitle.toLowerCase()}`} className="aspect-[4/3] w-full object-cover" src={photo.dataUrl} />
                    <div className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-xs text-white">
                      {cardTitle}
                    </div>
                    {readOnly ? null : (
                      <button
                        className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-xs text-white"
                        onClick={() => onDelete(photo.id)}
                        type="button"
                      >
                        Obrisi
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 rounded-[18px] border border-dashed border-white/15 px-4 py-4 text-sm text-white/55">
                    {isMissing
                      ? `Nedostaje slika ${sideLabel}.`
                      : `Jos nije dodata slika ${sideLabel}.`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <Camera disabled={readOnly} helper={helper} onCapture={(files) => onCapture(files)} title={title} />
      )}
      <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
        {hint}
      </div>
      {!hasBothSides && photos.length ? (
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
                  Obrisi
                </button>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function applyPostalCodeAutofill(
  nextPostalCode: string,
  currentCity: string,
  onResolved: (postalCode: string, city: string) => void
) {
  const postalCode = normalizePostalCode(nextPostalCode);
  const resolvedCity = resolveCityFromPostalCode(postalCode);
  onResolved(postalCode, resolvedCity || currentCity);
}

function DriverFields({
  value,
  readOnly,
  isMissing,
  onChange,
  postalCodeListId
}: {
  value: VehicleDraft;
  readOnly: boolean;
  isMissing: (label: string) => boolean;
  onChange: (next: VehicleDraft) => void;
  postalCodeListId: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field invalid={isMissing("Prezime vozaca")} label="Prezime" onChange={(driverLastName) => onChange({ ...value, driverLastName })} placeholder="Prezime" readOnly={readOnly} value={value.driverLastName} />
        <Field invalid={isMissing("Ime vozaca")} label="Ime" onChange={(driverFirstName) => onChange({ ...value, driverFirstName })} placeholder="Ime" readOnly={readOnly} value={value.driverFirstName} />
      </div>
      <Field invalid={isMissing("Adresa vozaca")} label="Adresa" onChange={(driverAddress) => onChange({ ...value, driverAddress })} placeholder="Adresa" readOnly={readOnly} value={value.driverAddress} />
      <div className="grid grid-cols-2 gap-3">
        <Field
          invalid={isMissing("Postanski broj vozaca")}
          label="Postanski broj"
          list={postalCodeListId}
          onChange={(driverPostalCode) =>
            applyPostalCodeAutofill(driverPostalCode, value.driverCity, (postalCode, city) =>
              onChange({ ...value, driverPostalCode: postalCode, driverCity: city })
            )
          }
          placeholder="Postanski broj"
          readOnly={readOnly}
          value={value.driverPostalCode}
        />
        <Field label="Grad" onChange={(driverCity) => onChange({ ...value, driverCity })} placeholder="Grad" readOnly={readOnly} value={value.driverCity} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field invalid={isMissing("Telefon ili e-mail vozaca") && !value.driverPhone} label="Telefon" onChange={(driverPhone) => onChange({ ...value, driverPhone })} placeholder="Telefon" readOnly={readOnly} type="tel" value={value.driverPhone} />
        <Field invalid={isMissing("Telefon ili e-mail vozaca") && !value.driverEmail} label="E-mail" onChange={(driverEmail) => onChange({ ...value, driverEmail })} placeholder="E-mail" readOnly={readOnly} type="email" value={value.driverEmail} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field invalid={isMissing("Datum rodjenja")} label="Datum rodjenja" onChange={(driverBirthDate) => onChange({ ...value, driverBirthDate })} readOnly={readOnly} type="date" value={value.driverBirthDate} />
        <Field invalid={isMissing("Broj vozacke dozvole")} label="Broj vozacke dozvole" onChange={(driverLicenseNumber) => onChange({ ...value, driverLicenseNumber })} placeholder="Broj dozvole" readOnly={readOnly} value={value.driverLicenseNumber} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          invalid={isMissing("Kategorija dozvole")}
          label="Kategorija"
          onChange={(driverLicenseCategory) => onChange({ ...value, driverLicenseCategory })}
          options={["A", "B", "C", "D", "E"]}
          readOnly={readOnly}
          value={value.driverLicenseCategory}
        />
        <Field invalid={isMissing("Vazenje vozacke dozvole")} label="Vazi do" onChange={(driverLicenseValidUntil) => onChange({ ...value, driverLicenseValidUntil })} readOnly={readOnly} type="date" value={value.driverLicenseValidUntil} />
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
        <Field invalid={isMissing("Registarska oznaka")} label="Registarski broj" onChange={(plate) => onChange({ ...value, plate })} placeholder="Registracija" readOnly={readOnly} value={value.plate} />
        <Field invalid={isMissing("Drzava registracije")} label="Drzava registracije" onChange={(registrationCountry) => onChange({ ...value, registrationCountry })} placeholder="Drzava registracije" readOnly={readOnly} value={value.registrationCountry} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field invalid={isMissing("Marka vozila")} label="Marka" onChange={(make) => onChange({ ...value, make })} placeholder="Marka" readOnly={readOnly} value={value.make} />
        <Field invalid={isMissing("Model vozila")} label="Model" onChange={(model) => onChange({ ...value, model })} placeholder="Model" readOnly={readOnly} value={value.model} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          invalid={isMissing("Tip vozila")}
          label="Tip vozila"
          onChange={(type) => onChange({ ...value, type })}
          options={[
            "Limuzina",
            "Hecbek",
            "Karavan",
            "SUV",
            "Kupe",
            "Kabriolet",
            "Kombi",
            "Dostavno vozilo",
            "Kamion",
            "Autobus",
            "Motocikl",
            "Moped",
            "Traktor",
            "Radna masina",
            "Prikolica",
            "Poluprikolica",
            "Drugo"
          ]}
          readOnly={readOnly}
          value={value.type}
        />
        <Field label="VIN" onChange={(vin) => onChange({ ...value, vin })} placeholder="VIN" readOnly={readOnly} value={value.vin} />
      </div>
      <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
        <div className="mb-3 text-xs uppercase tracking-[0.26em] text-white/40">Prikolica</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Registracija prikolice" onChange={(trailerPlate) => onChange({ ...value, trailerPlate })} placeholder="Registracija prikolice" readOnly={readOnly} value={value.trailerPlate} />
          <Field label="Drzava prikolice" onChange={(trailerRegistrationCountry) => onChange({ ...value, trailerRegistrationCountry })} placeholder="Drzava prikolice" readOnly={readOnly} value={value.trailerRegistrationCountry} />
        </div>
      </div>
    </div>
  );
}

function PolicyFields({
  value,
  readOnly,
  insurerListId,
  postalCodeListId,
  isMissing,
  onChange
}: {
  value: VehicleDraft;
  readOnly: boolean;
  insurerListId: string;
  postalCodeListId: string;
  isMissing: (label: string) => boolean;
  onChange: (next: VehicleDraft) => void;
}) {
  const ownerFieldsReadOnly = readOnly || value.ownerSameAsDriver;

  useEffect(() => {
    if (!value.ownerSameAsDriver) {
      return;
    }

    const nextValue: VehicleDraft = {
      ...value,
      ownerFirstName: value.driverFirstName,
      ownerLastName: value.driverLastName,
      ownerAddress: value.driverAddress,
      ownerCity: value.driverCity,
      ownerPostalCode: value.driverPostalCode,
      ownerCountry: value.driverCountry,
      ownerPhone: value.driverPhone,
      ownerEmail: value.driverEmail
    };

    const hasChanged =
      nextValue.ownerFirstName !== value.ownerFirstName ||
      nextValue.ownerLastName !== value.ownerLastName ||
      nextValue.ownerAddress !== value.ownerAddress ||
      nextValue.ownerCity !== value.ownerCity ||
      nextValue.ownerPostalCode !== value.ownerPostalCode ||
      nextValue.ownerCountry !== value.ownerCountry ||
      nextValue.ownerPhone !== value.ownerPhone ||
      nextValue.ownerEmail !== value.ownerEmail;

    if (hasChanged) {
      onChange(nextValue);
    }
  }, [
    onChange,
    value,
    value.driverAddress,
    value.driverCity,
    value.driverCountry,
    value.driverEmail,
    value.driverFirstName,
    value.driverLastName,
    value.driverPhone,
    value.driverPostalCode,
    value.ownerAddress,
    value.ownerCity,
    value.ownerCountry,
    value.ownerEmail,
    value.ownerFirstName,
    value.ownerLastName,
    value.ownerPhone,
    value.ownerPostalCode,
    value.ownerSameAsDriver
  ]);

  return (
    <div className="space-y-4">
      <datalist id={insurerListId}>
        {INSURER_OPTIONS.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>

      <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.26em] text-white/40">Ugovarac osiguranja</div>
          <button
            className={`rounded-full border px-3 py-2 text-xs transition ${
              value.ownerSameAsDriver
                ? "border-accent/45 bg-accent/18 text-white"
                : "border-white/10 bg-white/5 text-white/65"
            }`}
            disabled={readOnly}
            onClick={() =>
              onChange({
                ...value,
                ownerSameAsDriver: !value.ownerSameAsDriver,
                ownerFirstName: !value.ownerSameAsDriver ? value.driverFirstName : value.ownerFirstName,
                ownerLastName: !value.ownerSameAsDriver ? value.driverLastName : value.ownerLastName,
                ownerAddress: !value.ownerSameAsDriver ? value.driverAddress : value.ownerAddress,
                ownerCity: !value.ownerSameAsDriver ? value.driverCity : value.ownerCity,
                ownerPostalCode: !value.ownerSameAsDriver ? value.driverPostalCode : value.ownerPostalCode,
                ownerCountry: !value.ownerSameAsDriver ? value.driverCountry : value.ownerCountry,
                ownerPhone: !value.ownerSameAsDriver ? value.driverPhone : value.ownerPhone,
                ownerEmail: !value.ownerSameAsDriver ? value.driverEmail : value.ownerEmail
              })
            }
            type="button"
          >
            {value.ownerSameAsDriver ? "Iskljuci kopiranje iz vozaca" : "Isti podaci kao vozac"}
          </button>
        </div>
        <div className="mb-3 text-sm text-white/60">
          {value.ownerSameAsDriver
            ? "Polja ugovaraca su zakljucana jer trenutno koriste iste podatke kao vozac."
            : "Ako je ugovarac isti kao vozac, ukljuci ovu opciju i polja ce se popuniti automatski."}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field invalid={isMissing("Prezime ugovaraca")} label="Prezime" onChange={(ownerLastName) => onChange({ ...value, ownerLastName })} placeholder="Prezime" readOnly={ownerFieldsReadOnly} value={value.ownerLastName} />
          <Field invalid={isMissing("Ime ugovaraca")} label="Ime" onChange={(ownerFirstName) => onChange({ ...value, ownerFirstName })} placeholder="Ime" readOnly={ownerFieldsReadOnly} value={value.ownerFirstName} />
        </div>
        <div className="mt-3 space-y-3">
          <Field invalid={isMissing("Adresa ugovaraca")} label="Adresa osiguranika" onChange={(ownerAddress) => onChange({ ...value, ownerAddress })} placeholder="Adresa osiguranika" readOnly={ownerFieldsReadOnly} value={value.ownerAddress} />
          <div className="grid grid-cols-3 gap-3">
            <Field
              invalid={isMissing("Postanski broj ugovaraca")}
              label="Postanski broj"
              list={postalCodeListId}
              onChange={(ownerPostalCode) =>
                applyPostalCodeAutofill(ownerPostalCode, value.ownerCity, (postalCode, city) =>
                  onChange({ ...value, ownerPostalCode: postalCode, ownerCity: city })
                )
              }
              placeholder="Postanski broj"
              readOnly={ownerFieldsReadOnly}
              value={value.ownerPostalCode}
            />
            <Field invalid={isMissing("Grad ugovaraca")} label="Grad osiguranika" onChange={(ownerCity) => onChange({ ...value, ownerCity })} placeholder="Grad" readOnly={ownerFieldsReadOnly} value={value.ownerCity} />
            <Field invalid={isMissing("Drzava ugovaraca")} label="Drzava osiguranika" onChange={(ownerCountry) => onChange({ ...value, ownerCountry })} placeholder="Drzava" readOnly={ownerFieldsReadOnly} value={value.ownerCountry} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field invalid={isMissing("Telefon ili e-mail ugovaraca") && !value.ownerPhone} label="Telefon osiguranika" onChange={(ownerPhone) => onChange({ ...value, ownerPhone })} placeholder="Telefon" readOnly={ownerFieldsReadOnly} type="tel" value={value.ownerPhone} />
            <Field invalid={isMissing("Telefon ili e-mail ugovaraca") && !value.ownerEmail} label="E-mail osiguranika" onChange={(ownerEmail) => onChange({ ...value, ownerEmail })} placeholder="E-mail" readOnly={ownerFieldsReadOnly} type="email" value={value.ownerEmail} />
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
        <div className="mb-3 text-xs uppercase tracking-[0.26em] text-white/40">Osiguravajuca kuca</div>
        <div className="space-y-3">
          <Field invalid={isMissing("Osiguravajuca kuca")} label="Osiguravajuce drustvo" list={insurerListId} onChange={(insurer) => onChange({ ...value, insurer })} placeholder="Osiguravajuce drustvo" readOnly={readOnly} value={value.insurer} />
          <div className="grid grid-cols-2 gap-3">
            <Field invalid={isMissing("Broj ugovora")} label="Broj polise" onChange={(policyNumber) => onChange({ ...value, policyNumber })} placeholder="Broj polise" readOnly={readOnly} value={value.policyNumber} />
            <Field label="Broj zelene karte" onChange={(greenCardNumber) => onChange({ ...value, greenCardNumber })} placeholder="Broj zelene karte" readOnly={readOnly} value={value.greenCardNumber} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field invalid={isMissing("Polisa vazi od")} label="Vazi od" onChange={(policyValidFrom) => onChange({ ...value, policyValidFrom })} readOnly={readOnly} type="date" value={value.policyValidFrom} />
            <Field invalid={isMissing("Polisa vazi do")} label="Vazi do" onChange={(policyValidUntil) => onChange({ ...value, policyValidUntil })} readOnly={readOnly} type="date" value={value.policyValidUntil} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field invalid={isMissing("Filijala ili posrednik")} label="Filijala / posrednik" onChange={(insuranceBranch) => onChange({ ...value, insuranceBranch })} placeholder="Filijala / posrednik" readOnly={readOnly} value={value.insuranceBranch} />
            <Field invalid={isMissing("Naziv filijale")} label="Naziv filijale" onChange={(insuranceOfficeName) => onChange({ ...value, insuranceOfficeName })} placeholder="Naziv filijale" readOnly={readOnly} value={value.insuranceOfficeName} />
          </div>
          <Field invalid={isMissing("Adresa osiguranja")} label="Adresa osiguranja" onChange={(insuranceAddress) => onChange({ ...value, insuranceAddress })} placeholder="Adresa osiguranja" readOnly={readOnly} value={value.insuranceAddress} />
          <div className="grid grid-cols-2 gap-3">
            <Field invalid={isMissing("Grad osiguranja")} label="Grad osiguranja" onChange={(insuranceCity) => onChange({ ...value, insuranceCity })} placeholder="Grad" readOnly={readOnly} value={value.insuranceCity} />
            <Field invalid={isMissing("Drzava osiguranja")} label="Drzava osiguranja" onChange={(insuranceCountry) => onChange({ ...value, insuranceCountry })} placeholder="Drzava" readOnly={readOnly} value={value.insuranceCountry} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field invalid={isMissing("Telefon ili e-mail osiguranja") && !value.insurancePhone} label="Telefon osiguranja" onChange={(insurancePhone) => onChange({ ...value, insurancePhone })} placeholder="Telefon" readOnly={readOnly} type="tel" value={value.insurancePhone} />
            <Field invalid={isMissing("Telefon ili e-mail osiguranja") && !value.insuranceEmail} label="E-mail osiguranja" onChange={(insuranceEmail) => onChange({ ...value, insuranceEmail })} placeholder="E-mail" readOnly={readOnly} type="email" value={value.insuranceEmail} />
          </div>
          <div className="space-y-2">
            <span className="text-sm text-white/60">Da li ovo vozilo ima kasko osiguranje?</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`rounded-[18px] border px-4 py-3 text-sm transition ${value.coveredDamage === true ? "border-emerald-300/45 bg-emerald-500/16 text-white" : "border-white/10 bg-white/5 text-white/70"}`}
                disabled={readOnly}
                onClick={() => onChange({ ...value, coveredDamage: true })}
                type="button"
              >
                Da
              </button>
              <button
                className={`rounded-[18px] border px-4 py-3 text-sm transition ${value.coveredDamage === false ? "border-amber-300/45 bg-amber-500/16 text-white" : "border-white/10 bg-white/5 text-white/70"}`}
                disabled={readOnly}
                onClick={() => onChange({ ...value, coveredDamage: false })}
                type="button"
              >
                Ne
              </button>
            </div>
          </div>
        </div>
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
  const insurerListId = useMemo(() => `insurer-${value.side}-${section}`, [section, value.side]);
  const postalCodeListId = useMemo(() => `postal-${value.side}-${section}`, [section, value.side]);
  const vehicleDocumentKind: PhotoKind = value.side === "A" ? "document-a" : "document-b";
  const config = sectionConfig[section];
  const accentClasses = accentClassMap[accent];
  const missingFields = getVehicleSectionMissingFields(value, section);
  const photos = value.documentPhotos.filter((photo) => {
    if (section === "driver") {
      return photo.documentType === "driver-license";
    }
    if (section === "vehicle") {
      return photo.documentType === "registration";
    }
    return photo.documentType === "policy";
  });

  const isMissing = (label: string) => missingFields.includes(label);

  const handleCapture = async (files: FileList, side?: DocumentSide) => {
    const documentType: DocumentType =
      section === "driver" ? "driver-license" : section === "vehicle" ? "registration" : "policy";
    const uploads = await Promise.all(
      Array.from(files).map(async (file) => ({
        id: createId("doc"),
        dataUrl: await fileToDataUrl(file),
        label: file.name,
        kind: vehicleDocumentKind,
        documentType,
        documentSide: side
      }))
    );

    const preservedPhotos =
      side && config.requiresBothSides
        ? value.documentPhotos.filter(
            (photo) => !(photo.documentType === documentType && photo.documentSide === side)
          )
        : value.documentPhotos;

    onChange({
      ...value,
      documentPhotos: [...preservedPhotos, ...uploads]
    });
  };

  return (
    <div className="space-y-4">
      <SectionTitle accent={accent} helper={config.helper} headline={config.headline} title={title} />

      <Card className={`space-y-4 border ${accentClasses.ring}`}>
        <datalist id={postalCodeListId}>
          {POSTAL_CODE_CITY_OPTIONS.map((option) => (
            <option key={`${option.postalCode}-${option.city}`} value={option.postalCode}>
              {option.city}
            </option>
          ))}
        </datalist>
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
          requiredSides={config.requiresBothSides ? ["front", "back"] : undefined}
          missingLabels={missingFields}
          title={config.cameraTitle}
        />
      </Card>

      <Card className={`space-y-4 border ${accentClasses.ring} ${accentClasses.soft}`}>
        {missingFields.length ? (
          <div className="text-sm text-red-200">Prazna obavezna polja su oznacena crveno.</div>
        ) : (
          <div className="text-sm text-white/55">Korak je kompletiran i spreman za nastavak.</div>
        )}

        {section === "driver" ? (
          <DriverFields
            isMissing={isMissing}
            onChange={onChange}
            postalCodeListId={postalCodeListId}
            readOnly={readOnly}
            value={value}
          />
        ) : section === "vehicle" ? (
          <VehicleFields isMissing={isMissing} onChange={onChange} readOnly={readOnly} value={value} />
        ) : (
          <PolicyFields
            insurerListId={insurerListId}
            isMissing={isMissing}
            onChange={onChange}
            postalCodeListId={postalCodeListId}
            readOnly={readOnly}
            value={value}
          />
        )}
      </Card>
    </div>
  );
}
