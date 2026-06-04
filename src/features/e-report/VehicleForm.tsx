import { useEffect, useMemo } from "react";
import Card from "../../components/Card";
import {
  INSURER_OPTIONS,
  POSTAL_CODE_CITY_OPTIONS,
  VEHICLE_MAKE_OPTIONS,
  VEHICLE_MODELS_BY_MAKE,
  VEHICLE_TYPE_OPTIONS,
  getVehicleSectionMissingFields,
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

function Field({
  label,
  value,
  onChange,
  readOnly = false,
  type = "text",
  list,
  placeholder,
  invalid = false,
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
  accent
}: {
  value: VehicleDraft;
  readOnly: boolean;
  isMissing: (label: string) => boolean;
  onChange: (next: VehicleDraft) => void;
  postalCodeListId: string;
  accent: AccentTone;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field accent={accent} invalid={isMissing("Prezime vozaca")} label="Prezime" onChange={(driverLastName) => onChange({ ...value, driverLastName })} placeholder="Prezime" readOnly={readOnly} value={value.driverLastName} />
        <Field accent={accent} invalid={isMissing("Ime vozaca")} label="Ime" onChange={(driverFirstName) => onChange({ ...value, driverFirstName })} placeholder="Ime" readOnly={readOnly} value={value.driverFirstName} />
      </div>
      <Field accent={accent} invalid={isMissing("Adresa vozaca")} label="Adresa" onChange={(driverAddress) => onChange({ ...value, driverAddress })} placeholder="Adresa" readOnly={readOnly} value={value.driverAddress} />
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
          accent={accent}
        />
        <Field accent={accent} label="Grad" onChange={(driverCity) => onChange({ ...value, driverCity })} placeholder="Grad" readOnly={readOnly} value={value.driverCity} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field accent={accent} invalid={isMissing("Telefon ili e-mail vozaca") && !value.driverPhone} label="Telefon" onChange={(driverPhone) => onChange({ ...value, driverPhone })} placeholder="Telefon" readOnly={readOnly} type="tel" value={value.driverPhone} />
        <Field accent={accent} invalid={isMissing("Telefon ili e-mail vozaca") && !value.driverEmail} label="E-mail" onChange={(driverEmail) => onChange({ ...value, driverEmail })} placeholder="E-mail" readOnly={readOnly} type="email" value={value.driverEmail} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field accent={accent} invalid={isMissing("Datum rodjenja")} label="Datum rodjenja" onChange={(driverBirthDate) => onChange({ ...value, driverBirthDate })} readOnly={readOnly} type="date" value={value.driverBirthDate} />
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
        <Field accent={accent} invalid={isMissing("Vazenje vozacke dozvole")} label="Vazi do" onChange={(driverLicenseValidUntil) => onChange({ ...value, driverLicenseValidUntil })} readOnly={readOnly} type="date" value={value.driverLicenseValidUntil} />
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
  modelListId
}: {
  value: VehicleDraft;
  readOnly: boolean;
  isMissing: (label: string) => boolean;
  onChange: (next: VehicleDraft) => void;
  accent: AccentTone;
  makeListId: string;
  modelListId: string;
}) {
  const selectedMake = VEHICLE_MAKE_OPTIONS.find(
    (make) => make.toLowerCase() === value.make.trim().toLowerCase()
  );
  const modelOptions = selectedMake ? VEHICLE_MODELS_BY_MAKE[selectedMake] : [];

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
      <div className="grid grid-cols-2 gap-3">
        <Field accent={accent} invalid={isMissing("Registarska oznaka")} label="Registarski broj" onChange={(plate) => onChange({ ...value, plate })} placeholder="Registracija" readOnly={readOnly} value={value.plate} />
        <Field accent={accent} invalid={isMissing("Drzava registracije")} label="Drzava registracije" onChange={(registrationCountry) => onChange({ ...value, registrationCountry })} placeholder="Drzava registracije" readOnly={readOnly} value={value.registrationCountry} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field accent={accent} invalid={isMissing("Marka vozila")} label="Marka" list={makeListId} onChange={(make) => onChange({ ...value, make })} placeholder="Marka" readOnly={readOnly} value={value.make} />
        <Field accent={accent} invalid={isMissing("Model vozila")} label="Model" list={modelListId} onChange={(model) => onChange({ ...value, model })} placeholder="Model" readOnly={readOnly} value={value.model} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          accent={accent}
          invalid={isMissing("Tip vozila")}
          label="Tip vozila"
          onChange={(type) => onChange({ ...value, type })}
          options={[...VEHICLE_TYPE_OPTIONS]}
          readOnly={readOnly}
          value={value.type}
        />
        <Field accent={accent} label="VIN" onChange={(vin) => onChange({ ...value, vin })} placeholder="VIN" readOnly={readOnly} value={value.vin} />
      </div>
      <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
        <div className="mb-3 text-xs uppercase tracking-[0.26em] text-white/40">Prikolica</div>
        <div className="grid grid-cols-2 gap-3">
          <Field accent={accent} label="Registracija prikolice" onChange={(trailerPlate) => onChange({ ...value, trailerPlate })} placeholder="Registracija prikolice" readOnly={readOnly} value={value.trailerPlate} />
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
  isMissing,
  onChange,
  accent
}: {
  value: VehicleDraft;
  readOnly: boolean;
  insurerListId: string;
  postalCodeListId: string;
  isMissing: (label: string) => boolean;
  onChange: (next: VehicleDraft) => void;
  accent: AccentTone;
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
        <div className="mb-3 space-y-3">
          <div className="text-xs uppercase tracking-[0.26em] text-white/40">Ugovarac osiguranja</div>
          <button
            className={`w-full rounded-[18px] border px-4 py-3 text-sm font-semibold transition ${
              value.ownerSameAsDriver
                ? "border-emerald-300/60 bg-emerald-500 text-white shadow-[0_14px_36px_rgba(16,185,129,0.35)]"
                : "border-emerald-300/45 bg-emerald-500/18 text-emerald-100 shadow-[0_10px_28px_rgba(16,185,129,0.18)] hover:bg-emerald-500/24"
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
              accent={accent}
            />
            <Field accent={accent} invalid={isMissing("Grad ugovaraca")} label="Grad osiguranika" onChange={(ownerCity) => onChange({ ...value, ownerCity })} placeholder="Grad" readOnly={ownerFieldsReadOnly} value={value.ownerCity} />
            <Field accent={accent} invalid={isMissing("Drzava ugovaraca")} label="Drzava osiguranika" onChange={(ownerCountry) => onChange({ ...value, ownerCountry })} placeholder="Drzava" readOnly={ownerFieldsReadOnly} value={value.ownerCountry} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field accent={accent} invalid={isMissing("Telefon ili e-mail ugovaraca") && !value.ownerPhone} label="Telefon osiguranika" onChange={(ownerPhone) => onChange({ ...value, ownerPhone })} placeholder="Telefon" readOnly={ownerFieldsReadOnly} type="tel" value={value.ownerPhone} />
            <Field accent={accent} invalid={isMissing("Telefon ili e-mail ugovaraca") && !value.ownerEmail} label="E-mail osiguranika" onChange={(ownerEmail) => onChange({ ...value, ownerEmail })} placeholder="E-mail" readOnly={ownerFieldsReadOnly} type="email" value={value.ownerEmail} />
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
            <Field accent={accent} invalid={isMissing("Polisa vazi od")} label="Vazi od" onChange={(policyValidFrom) => onChange({ ...value, policyValidFrom })} readOnly={readOnly} type="date" value={value.policyValidFrom} />
            <Field accent={accent} invalid={isMissing("Polisa vazi do")} label="Vazi do" onChange={(policyValidUntil) => onChange({ ...value, policyValidUntil })} readOnly={readOnly} type="date" value={value.policyValidUntil} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field accent={accent} invalid={isMissing("Filijala ili posrednik")} label="Filijala / posrednik" onChange={(insuranceBranch) => onChange({ ...value, insuranceBranch })} placeholder="Filijala / posrednik" readOnly={readOnly} value={value.insuranceBranch} />
            <Field accent={accent} invalid={isMissing("Naziv filijale")} label="Naziv filijale" onChange={(insuranceOfficeName) => onChange({ ...value, insuranceOfficeName })} placeholder="Naziv filijale" readOnly={readOnly} value={value.insuranceOfficeName} />
          </div>
          <Field accent={accent} invalid={isMissing("Adresa osiguranja")} label="Adresa osiguranja" onChange={(insuranceAddress) => onChange({ ...value, insuranceAddress })} placeholder="Adresa osiguranja" readOnly={readOnly} value={value.insuranceAddress} />
          <div className="grid grid-cols-2 gap-3">
            <Field accent={accent} invalid={isMissing("Grad osiguranja")} label="Grad osiguranja" onChange={(insuranceCity) => onChange({ ...value, insuranceCity })} placeholder="Grad" readOnly={readOnly} value={value.insuranceCity} />
            <Field accent={accent} invalid={isMissing("Drzava osiguranja")} label="Drzava osiguranja" onChange={(insuranceCountry) => onChange({ ...value, insuranceCountry })} placeholder="Drzava" readOnly={readOnly} value={value.insuranceCountry} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field accent={accent} invalid={isMissing("Telefon ili e-mail osiguranja") && !value.insurancePhone} label="Telefon osiguranja" onChange={(insurancePhone) => onChange({ ...value, insurancePhone })} placeholder="Telefon" readOnly={readOnly} type="tel" value={value.insurancePhone} />
            <Field accent={accent} invalid={isMissing("Telefon ili e-mail osiguranja") && !value.insuranceEmail} label="E-mail osiguranja" onChange={(insuranceEmail) => onChange({ ...value, insuranceEmail })} placeholder="E-mail" readOnly={readOnly} type="email" value={value.insuranceEmail} />
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
  const makeListId = useMemo(() => `vehicle-makes-${value.side}`, [value.side]);
  const modelListId = useMemo(() => `vehicle-models-${value.side}`, [value.side]);
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
        {section === "driver" ? (
          <DriverFields
            accent={accent}
            isMissing={isMissing}
            onChange={onChange}
            postalCodeListId={postalCodeListId}
            readOnly={readOnly}
            value={value}
          />
        ) : section === "vehicle" ? (
          <VehicleFields
            accent={accent}
            isMissing={isMissing}
            makeListId={makeListId}
            modelListId={modelListId}
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
            readOnly={readOnly}
            value={value}
          />
        )}
      </Card>
    </div>
  );
}
