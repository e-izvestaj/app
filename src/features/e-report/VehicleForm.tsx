import { useEffect, useMemo } from "react";
import Card from "../../components/Card";
import {
  INSURER_OPTIONS,
  POSTAL_CODE_CITY_OPTIONS,
  SERBIAN_REGISTRATION_AREA_OPTIONS,
  VEHICLE_MAKE_OPTIONS,
  VEHICLE_MODELS_BY_MAKE,
  VEHICLE_TYPE_OPTIONS,
  getVehicleSectionMissingFields,
  normalizePhone,
  resolveCityFromPostalCode,
  type VehicleSection
} from "../../lib/utils";
import type { VehicleDraft } from "../../types";

type AccentTone = "blue" | "yellow";

type Props = {
  title: string;
  section: VehicleSection;
  value: VehicleDraft;
  onChange: (value: VehicleDraft) => void;
  readOnly?: boolean;
  accent?: AccentTone;
  accidentDate?: string;
  otherPlate?: string;
};

const accentClassMap: Record<AccentTone, { ring: string; soft: string; text: string }> = {
  blue: {
    ring: "border-sky-400/40",
    soft: "bg-sky-500/10 border-sky-400/20",
    text: "text-sky-100"
  },
  yellow: {
    ring: "border-amber-300/45",
    soft: "bg-amber-300/12 border-amber-300/20",
    text: "text-amber-50"
  }
};

function normalizePostalCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 5);
}

const SERBIAN_PLATE_LETTERS = "A-ZČĆŠĐŽ";
const SERBIAN_PLATE_PATTERN = new RegExp(
  `^[${SERBIAN_PLATE_LETTERS}]{2} \\d{3,6} [${SERBIAN_PLATE_LETTERS}]{2}$`,
  "u"
);

function isSerbianRegistrationCountry(value: string) {
  return ["srbija", "serbia", "rs"].includes(value.trim().toLocaleLowerCase("sr-Latn-RS"));
}

function formatSerbianPlate(value: string) {
  const normalized = value
    .toLocaleUpperCase("sr-Latn-RS")
    .replace(new RegExp(`[^${SERBIAN_PLATE_LETTERS}0-9]`, "gu"), "");
  const area = normalized.match(new RegExp(`^[${SERBIAN_PLATE_LETTERS}]{0,2}`, "u"))?.[0] || "";
  const afterArea = normalized.slice(area.length);
  const digits = afterArea.match(/^\d{0,6}/)?.[0] || "";
  const suffix = afterArea
    .slice(digits.length)
    .replace(new RegExp(`[^${SERBIAN_PLATE_LETTERS}]`, "gu"), "")
    .slice(0, 2);

  return [area, digits, suffix].filter(Boolean).join(" ");
}

function addOneYear(dateValue: string) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(`${dateValue}T00:00:00`);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

function isBefore(left: string, right: string) {
  return Boolean(left && right && left < right);
}

function normalizePlateForComparison(value: string) {
  return value.toLocaleUpperCase("sr-Latn-RS").replace(/[^A-ZČĆŠĐŽ0-9]/gu, "");
}

function capitalizeFirstLetter(value: string) {
  return value ? `${value.charAt(0).toLocaleUpperCase("sr-Latn-RS")}${value.slice(1)}` : value;
}

function FieldHint({ children }: { children: string }) {
  return <span className="block text-xs text-amber-200/80">{children}</span>;
}

function Field({
  label,
  value,
  onChange,
  readOnly = false,
  type = "text",
  list,
  placeholder,
  invalid = false,
  errorMessage,
  max,
  accent = "blue"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  type?: string;
  list?: string;
  placeholder?: string;
  invalid?: boolean;
  errorMessage?: string;
  max?: string;
  accent?: AccentTone;
}) {
  const accentBorder =
    accent === "yellow"
      ? "border-2 border-amber-300/40 focus:border-amber-200/80"
      : "border-2 border-sky-400/40 focus:border-sky-300/75";

  return (
    <label className="space-y-2">
      <span className={`text-sm ${invalid ? "text-red-200" : "text-white/60"}`}>{label}</span>
      <input
        className={`input-glass ${accentBorder} ${invalid ? "border-red-400/70 bg-red-500/8 placeholder:text-red-200/80" : ""}`}
        disabled={readOnly}
        list={list}
        max={max}
        placeholder={invalid ? placeholder || "Obavezno polje" : placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {invalid && errorMessage ? <span className="block text-xs text-red-200">{errorMessage}</span> : null}
    </label>
  );
}

function PlateField({
  value,
  registrationCountry,
  onChange,
  readOnly,
  invalid,
  accent,
  listId
}: {
  value: string;
  registrationCountry: string;
  onChange: (value: string) => void;
  readOnly: boolean;
  invalid: boolean;
  accent: AccentTone;
  listId: string;
}) {
  const isSerbian = isSerbianRegistrationCountry(registrationCountry);
  const hasFormatWarning = isSerbian && Boolean(value) && !SERBIAN_PLATE_PATTERN.test(value);
  const accentBorder =
    accent === "yellow"
      ? "border-2 border-amber-300/40 focus:border-amber-200/80"
      : "border-2 border-sky-400/40 focus:border-sky-300/75";

  return (
    <label className="space-y-2">
      <span className={`text-sm ${invalid ? "text-red-200" : "text-white/60"}`}>Registarski broj</span>
      <input
        autoCapitalize="characters"
        className={`input-glass ${accentBorder} ${invalid ? "border-red-400/70 bg-red-500/8 placeholder:text-red-200/80" : ""}`}
        disabled={readOnly}
        list={isSerbian ? listId : undefined}
        placeholder={invalid ? "Obavezno polje" : isSerbian ? "BG 1234 AB" : "Registracija"}
        value={value}
        onChange={(event) => onChange(isSerbian ? formatSerbianPlate(event.target.value) : event.target.value)}
      />
      {hasFormatWarning ? (
        <span className="block text-xs text-amber-200/80">Format za Srbiju: BG 1234 AB</span>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  readOnly = false,
  invalid = false,
  accent = "blue"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  readOnly?: boolean;
  invalid?: boolean;
  accent?: AccentTone;
}) {
  const accentBorder =
    accent === "yellow"
      ? "border-2 border-amber-300/40 focus:border-amber-200/80"
      : "border-2 border-sky-400/40 focus:border-sky-300/75";

  return (
    <label className="space-y-2">
      <span className={`text-sm ${invalid ? "text-red-200" : "text-white/60"}`}>{label}</span>
      <select
        className={`input-glass text-white ${accentBorder} ${invalid ? "border-red-400/70 bg-red-500/8" : ""}`}
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
  accent
}: {
  title: string;
  accent: AccentTone;
}) {
  const accentClasses = accentClassMap[accent];

  return (
    <div className="space-y-2">
      <div className={`inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.26em] ${accentClasses.ring} ${accentClasses.text}`}>
        {title}
      </div>
      <h2 className="text-[30px] font-semibold text-white">{title}</h2>
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
  postalCodeListId,
  accent,
  accidentDate
}: {
  value: VehicleDraft;
  readOnly: boolean;
  isMissing: (label: string) => boolean;
  onChange: (next: VehicleDraft) => void;
  postalCodeListId: string;
  accent: AccentTone;
  accidentDate?: string;
}) {
  const licenseExpired = isBefore(value.driverLicenseValidUntil, accidentDate || "");
  const birthDateInFuture = isMissing("Datum rodjenja ne moze biti u buducnosti");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field accent={accent} invalid={isMissing("Prezime vozaca")} label="Prezime" onChange={(driverLastName) => onChange({ ...value, driverLastName })} placeholder="Prezime" readOnly={readOnly} value={value.driverLastName} />
        <Field accent={accent} invalid={isMissing("Ime vozaca")} label="Ime" onChange={(driverFirstName) => onChange({ ...value, driverFirstName })} placeholder="Ime" readOnly={readOnly} value={value.driverFirstName} />
      </div>
      <Field accent={accent} invalid={isMissing("Adresa vozaca")} label="Adresa" onChange={(driverAddress) => onChange({ ...value, driverAddress })} placeholder="Adresa" readOnly={readOnly} value={value.driverAddress} />
      <div className="grid grid-cols-2 gap-3">
        <Field
          invalid={isMissing("Postanski broj vozaca") || isMissing("Ispravan postanski broj vozaca")}
          errorMessage={isMissing("Ispravan postanski broj vozaca") ? "Postanski broj mora imati 5 cifara." : undefined}
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
          accent={accent}
        />
        <Field accent={accent} invalid={isMissing("Grad vozaca")} label="Grad" onChange={(driverCity) => onChange({ ...value, driverCity })} placeholder="Grad" readOnly={readOnly} value={value.driverCity} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field accent={accent} errorMessage={isMissing("Ispravan telefon vozaca") ? "Unesi ispravan broj telefona." : undefined} invalid={(isMissing("Telefon ili e-mail vozaca") && !value.driverPhone) || isMissing("Ispravan telefon vozaca")} label="Telefon" onChange={(driverPhone) => onChange({ ...value, driverPhone: normalizePhone(driverPhone) })} placeholder="+381641234567" readOnly={readOnly} type="tel" value={value.driverPhone} />
        <Field accent={accent} errorMessage={isMissing("Ispravan e-mail vozaca") ? "Unesi e-mail u formatu ime@domen.rs." : undefined} invalid={(isMissing("Telefon ili e-mail vozaca") && !value.driverEmail) || isMissing("Ispravan e-mail vozaca")} label="E-mail" onChange={(driverEmail) => onChange({ ...value, driverEmail })} placeholder="ime@domen.rs" readOnly={readOnly} type="email" value={value.driverEmail} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field accent={accent} errorMessage={birthDateInFuture ? "Datum rodjenja ne moze biti u buducnosti." : undefined} invalid={isMissing("Datum rodjenja") || birthDateInFuture} label="Datum rodjenja" max={today} onChange={(driverBirthDate) => onChange({ ...value, driverBirthDate })} readOnly={readOnly} type="date" value={value.driverBirthDate} />
        <Field accent={accent} invalid={isMissing("Broj vozacke dozvole")} label="Broj vozacke dozvole" onChange={(driverLicenseNumber) => onChange({ ...value, driverLicenseNumber })} placeholder="Broj dozvole" readOnly={readOnly} value={value.driverLicenseNumber} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          accent={accent}
          invalid={isMissing("Kategorija dozvole")}
          label="Kategorija"
          onChange={(driverLicenseCategory) => onChange({ ...value, driverLicenseCategory })}
          options={["A", "B", "C", "D", "E"]}
          readOnly={readOnly}
          value={value.driverLicenseCategory}
        />
        <div className="space-y-2">
          <Field accent={accent} invalid={isMissing("Vazenje vozacke dozvole")} label="Vazi do" onChange={(driverLicenseValidUntil) => onChange({ ...value, driverLicenseValidUntil })} readOnly={readOnly} type="date" value={value.driverLicenseValidUntil} />
          {licenseExpired ? <FieldHint>Vozacka dozvola je istekla na datum nezgode.</FieldHint> : null}
        </div>
      </div>
    </div>
  );
}

function VehicleFields({
  value,
  readOnly,
  isMissing,
  onChange,
  accent,
  makeListId,
  modelListId,
  plateAreaListId,
  otherPlate
}: {
  value: VehicleDraft;
  readOnly: boolean;
  isMissing: (label: string) => boolean;
  onChange: (next: VehicleDraft) => void;
  accent: AccentTone;
  makeListId: string;
  modelListId: string;
  plateAreaListId: string;
  otherPlate?: string;
}) {
  const selectedMake = VEHICLE_MAKE_OPTIONS.find(
    (make) => make.toLowerCase() === value.make.trim().toLowerCase()
  );
  const modelOptions = selectedMake ? VEHICLE_MODELS_BY_MAKE[selectedMake] : [];
  const plateMatchesOther =
    Boolean(value.plate && otherPlate) &&
    normalizePlateForComparison(value.plate) === normalizePlateForComparison(otherPlate || "");

  return (
    <div className="space-y-4">
      <datalist id={makeListId}>
        {VEHICLE_MAKE_OPTIONS.map((make) => (
          <option key={make} value={make} />
        ))}
      </datalist>
      <datalist id={modelListId}>
        {modelOptions.map((model) => (
          <option key={model} value={model} />
        ))}
      </datalist>
      <datalist id={plateAreaListId}>
        {SERBIAN_REGISTRATION_AREA_OPTIONS.map((option) => (
          <option key={option.code} value={option.code}>
            {option.city}
          </option>
        ))}
      </datalist>
      <div className="grid grid-cols-2 gap-3">
        <PlateField
          accent={accent}
          invalid={isMissing("Registarska oznaka")}
          listId={plateAreaListId}
          onChange={(plate) => onChange({ ...value, plate })}
          readOnly={readOnly}
          registrationCountry={value.registrationCountry}
          value={value.plate}
        />
        <Field
          accent={accent}
          invalid={isMissing("Drzava registracije")}
          label="Drzava registracije"
          onChange={(registrationCountry) =>
            onChange({
              ...value,
              registrationCountry,
              plate: isSerbianRegistrationCountry(registrationCountry)
                ? formatSerbianPlate(value.plate)
                : value.plate
            })
          }
          placeholder="Drzava registracije"
          readOnly={readOnly}
          value={value.registrationCountry}
        />
      </div>
      {plateMatchesOther ? <FieldHint>Vozila A i B imaju istu registarsku oznaku.</FieldHint> : null}
      <div className="grid grid-cols-2 gap-3">
        <Field accent={accent} invalid={isMissing("Marka vozila")} label="Marka" list={makeListId} onChange={(make) => onChange({ ...value, make })} placeholder="Marka" readOnly={readOnly} value={value.make} />
        <Field accent={accent} invalid={isMissing("Model vozila")} label="Model" list={modelListId} onChange={(model) => onChange({ ...value, model })} placeholder="Model" readOnly={readOnly} value={value.model} />
      </div>
      <div>
        <SelectField
          accent={accent}
          invalid={isMissing("Tip vozila")}
          label="Tip vozila"
          onChange={(type) => onChange({ ...value, type })}
          options={[...VEHICLE_TYPE_OPTIONS]}
          readOnly={readOnly}
          value={value.type}
        />
      </div>
      <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
        <div className="mb-3 text-xs uppercase tracking-[0.26em] text-white/40">Prikolica</div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            accent={accent}
            label="Registracija prikolice"
            onChange={(trailerPlate) =>
              onChange({
                ...value,
                trailerPlate,
                trailerRegistrationCountry:
                  trailerPlate && !value.trailerPlate
                    ? value.registrationCountry
                    : value.trailerRegistrationCountry
              })
            }
            placeholder="Registracija prikolice"
            readOnly={readOnly}
            value={value.trailerPlate}
          />
          <Field accent={accent} label="Drzava prikolice" onChange={(trailerRegistrationCountry) => onChange({ ...value, trailerRegistrationCountry })} placeholder="Drzava prikolice" readOnly={readOnly} value={value.trailerRegistrationCountry} />
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
  cityListId,
  isMissing,
  onChange,
  accent,
  accidentDate
}: {
  value: VehicleDraft;
  readOnly: boolean;
  insurerListId: string;
  postalCodeListId: string;
  cityListId: string;
  isMissing: (label: string) => boolean;
  onChange: (next: VehicleDraft) => void;
  accent: AccentTone;
  accidentDate?: string;
}) {
  const ownerFieldsReadOnly = readOnly || value.ownerSameAsDriver;
  const policyDatesReversed = isBefore(value.policyValidUntil, value.policyValidFrom);
  const policyExpired = isBefore(value.policyValidUntil, accidentDate || "");

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
        <div className="mb-3 space-y-3">
          <div className="text-xs uppercase tracking-[0.26em] text-white/40">Ugovarac osiguranja</div>
          <button
            className={`w-full rounded-[18px] border px-4 py-3 text-sm font-semibold transition ${
              value.ownerSameAsDriver
                ? "border-emerald-300/60 bg-emerald-500 text-white shadow-[0_14px_36px_rgba(16,185,129,0.35)]"
                : "border-emerald-300/70 bg-emerald-500/45 text-white shadow-[0_12px_34px_rgba(16,185,129,0.3)] hover:bg-emerald-500/60"
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
            {value.ownerSameAsDriver ? "Isključi kopiranje iz vozača" : "Isti podaci kao vozač"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field accent={accent} invalid={isMissing("Prezime ugovaraca")} label="Prezime" onChange={(ownerLastName) => onChange({ ...value, ownerLastName })} placeholder="Prezime" readOnly={ownerFieldsReadOnly} value={value.ownerLastName} />
          <Field accent={accent} invalid={isMissing("Ime ugovaraca")} label="Ime" onChange={(ownerFirstName) => onChange({ ...value, ownerFirstName })} placeholder="Ime" readOnly={ownerFieldsReadOnly} value={value.ownerFirstName} />
        </div>
        <div className="mt-3 space-y-3">
          <Field accent={accent} invalid={isMissing("Adresa ugovaraca")} label="Adresa osiguranika" onChange={(ownerAddress) => onChange({ ...value, ownerAddress })} placeholder="Adresa osiguranika" readOnly={ownerFieldsReadOnly} value={value.ownerAddress} />
          <div className="grid grid-cols-3 gap-3">
            <Field
              invalid={isMissing("Postanski broj ugovaraca") || isMissing("Ispravan postanski broj ugovaraca")}
              errorMessage={isMissing("Ispravan postanski broj ugovaraca") ? "Postanski broj mora imati 5 cifara." : undefined}
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
              accent={accent}
            />
            <Field accent={accent} invalid={isMissing("Grad ugovaraca")} label="Grad osiguranika" onChange={(ownerCity) => onChange({ ...value, ownerCity })} placeholder="Grad" readOnly={ownerFieldsReadOnly} value={value.ownerCity} />
            <Field accent={accent} invalid={isMissing("Drzava ugovaraca")} label="Drzava osiguranika" onChange={(ownerCountry) => onChange({ ...value, ownerCountry })} placeholder="Drzava" readOnly={ownerFieldsReadOnly} value={value.ownerCountry} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field accent={accent} errorMessage={isMissing("Ispravan telefon ugovaraca") ? "Unesi ispravan broj telefona." : undefined} invalid={(isMissing("Telefon ili e-mail ugovaraca") && !value.ownerPhone) || isMissing("Ispravan telefon ugovaraca")} label="Telefon osiguranika" onChange={(ownerPhone) => onChange({ ...value, ownerPhone: normalizePhone(ownerPhone) })} placeholder="+381641234567" readOnly={ownerFieldsReadOnly} type="tel" value={value.ownerPhone} />
            <Field accent={accent} errorMessage={isMissing("Ispravan e-mail ugovaraca") ? "Unesi e-mail u formatu ime@domen.rs." : undefined} invalid={(isMissing("Telefon ili e-mail ugovaraca") && !value.ownerEmail) || isMissing("Ispravan e-mail ugovaraca")} label="E-mail osiguranika" onChange={(ownerEmail) => onChange({ ...value, ownerEmail })} placeholder="ime@domen.rs" readOnly={ownerFieldsReadOnly} type="email" value={value.ownerEmail} />
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
        <div className="mb-3 text-xs uppercase tracking-[0.26em] text-white/40">Osiguravajuca kuca</div>
        <div className="space-y-3">
          <Field accent={accent} invalid={isMissing("Osiguravajuca kuca")} label="Osiguravajuce drustvo" list={insurerListId} onChange={(insurer) => onChange({ ...value, insurer })} placeholder="Osiguravajuce drustvo" readOnly={readOnly} value={value.insurer} />
          <div className="grid grid-cols-2 gap-3">
            <Field accent={accent} invalid={isMissing("Broj ugovora")} label="Broj polise" onChange={(policyNumber) => onChange({ ...value, policyNumber })} placeholder="Broj polise" readOnly={readOnly} value={value.policyNumber} />
            <Field accent={accent} label="Broj zelene karte" onChange={(greenCardNumber) => onChange({ ...value, greenCardNumber })} placeholder="Broj zelene karte" readOnly={readOnly} value={value.greenCardNumber} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field accent={accent} invalid={isMissing("Polisa vazi od")} label="Vazi od" onChange={(policyValidFrom) => onChange({ ...value, policyValidFrom, policyValidUntil: value.policyValidUntil || addOneYear(policyValidFrom) })} readOnly={readOnly} type="date" value={value.policyValidFrom} />
            <div className="space-y-2">
              <Field accent={accent} invalid={isMissing("Polisa vazi do")} label="Vazi do" onChange={(policyValidUntil) => onChange({ ...value, policyValidUntil })} readOnly={readOnly} type="date" value={value.policyValidUntil} />
              {policyDatesReversed ? <FieldHint>Datum isteka polise je pre datuma pocetka.</FieldHint> : null}
              {!policyDatesReversed && policyExpired ? <FieldHint>Polisa je istekla na datum nezgode.</FieldHint> : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field accent={accent} invalid={isMissing("Filijala ili posrednik")} label="Filijala / posrednik" onChange={(insuranceBranch) => onChange({ ...value, insuranceBranch })} placeholder="Filijala / posrednik" readOnly={readOnly} value={value.insuranceBranch} />
            <Field accent={accent} invalid={isMissing("Naziv filijale")} label="Naziv filijale" onChange={(insuranceOfficeName) => onChange({ ...value, insuranceOfficeName })} placeholder="Naziv filijale" readOnly={readOnly} value={value.insuranceOfficeName} />
          </div>
          <Field accent={accent} invalid={isMissing("Adresa osiguranja")} label="Adresa osiguranja" onChange={(insuranceAddress) => onChange({ ...value, insuranceAddress })} placeholder="Adresa osiguranja" readOnly={readOnly} value={value.insuranceAddress} />
          <div className="grid grid-cols-2 gap-3">
            <Field accent={accent} invalid={isMissing("Grad osiguranja")} label="Grad osiguranja" list={cityListId} onChange={(insuranceCity) => onChange({ ...value, insuranceCity: capitalizeFirstLetter(insuranceCity) })} placeholder="Grad" readOnly={readOnly} value={value.insuranceCity} />
            <Field accent={accent} invalid={isMissing("Drzava osiguranja")} label="Drzava osiguranja" onChange={(insuranceCountry) => onChange({ ...value, insuranceCountry })} placeholder="Drzava" readOnly={readOnly} value={value.insuranceCountry} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field accent={accent} errorMessage={isMissing("Ispravan telefon osiguranja") ? "Unesi ispravan broj telefona." : undefined} invalid={(isMissing("Telefon ili e-mail osiguranja") && !value.insurancePhone) || isMissing("Ispravan telefon osiguranja")} label="Telefon osiguranja" onChange={(insurancePhone) => onChange({ ...value, insurancePhone: normalizePhone(insurancePhone) })} placeholder="+381641234567" readOnly={readOnly} type="tel" value={value.insurancePhone} />
            <Field accent={accent} errorMessage={isMissing("Ispravan e-mail osiguranja") ? "Unesi e-mail u formatu ime@domen.rs." : undefined} invalid={(isMissing("Telefon ili e-mail osiguranja") && !value.insuranceEmail) || isMissing("Ispravan e-mail osiguranja")} label="E-mail osiguranja" onChange={(insuranceEmail) => onChange({ ...value, insuranceEmail })} placeholder="ime@domen.rs" readOnly={readOnly} type="email" value={value.insuranceEmail} />
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
  accent = "blue",
  accidentDate,
  otherPlate
}: Props) {
  const insurerListId = useMemo(() => `insurer-${value.side}-${section}`, [section, value.side]);
  const postalCodeListId = useMemo(() => `postal-${value.side}-${section}`, [section, value.side]);
  const cityListId = useMemo(() => `cities-${value.side}-${section}`, [section, value.side]);
  const makeListId = useMemo(() => `vehicle-makes-${value.side}`, [value.side]);
  const modelListId = useMemo(() => `vehicle-models-${value.side}`, [value.side]);
  const plateAreaListId = useMemo(() => `plate-areas-${value.side}`, [value.side]);
  const accentClasses = accentClassMap[accent];
  const missingFields = getVehicleSectionMissingFields(value, section);

  const isMissing = (label: string) => missingFields.includes(label);

  return (
    <div className="space-y-4">
      <SectionTitle accent={accent} title={title} />

      <Card className={`space-y-4 border-2 ${accentClasses.ring} ${accentClasses.soft}`}>
        <datalist id={postalCodeListId}>
          {POSTAL_CODE_CITY_OPTIONS.map((option) => (
            <option key={`${option.postalCode}-${option.city}`} value={option.postalCode}>
              {option.city}
            </option>
          ))}
        </datalist>
        <datalist id={cityListId}>
          {[...new Set(POSTAL_CODE_CITY_OPTIONS.map((option) => option.city))].map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
        {section === "driver" ? (
          <DriverFields
            accent={accent}
            isMissing={isMissing}
            onChange={onChange}
            postalCodeListId={postalCodeListId}
            readOnly={readOnly}
            value={value}
            accidentDate={accidentDate}
          />
        ) : section === "vehicle" ? (
          <VehicleFields
            accent={accent}
            isMissing={isMissing}
            makeListId={makeListId}
            modelListId={modelListId}
            plateAreaListId={plateAreaListId}
            otherPlate={otherPlate}
            onChange={onChange}
            readOnly={readOnly}
            value={value}
          />
        ) : (
          <PolicyFields
            accent={accent}
            insurerListId={insurerListId}
            isMissing={isMissing}
            onChange={onChange}
            postalCodeListId={postalCodeListId}
            cityListId={cityListId}
            readOnly={readOnly}
            value={value}
            accidentDate={accidentDate}
          />
        )}
      </Card>
    </div>
  );
}
