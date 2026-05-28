import { useMemo, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Camera from "../../components/Camera";
import { mockOcrFromPhoto } from "../../lib/ocr";
import { INSURER_OPTIONS, createId } from "../../lib/utils";
import type { PhotoAsset, PhotoKind, VehicleDraft } from "../../types";

type Props = {
  title: string;
  value: VehicleDraft;
  onChange: (value: VehicleDraft) => void;
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

export default function VehicleForm({ title, value, onChange, readOnly = false }: Props) {
  const [isReading, setIsReading] = useState(false);
  const insurerListId = useMemo(() => `insurer-${value.side}`, [value.side]);

  const handleCapture = async (files: FileList) => {
    const uploads = await Promise.all(
      Array.from(files).map(async (file) => ({
        id: createId("doc"),
        dataUrl: await fileToDataUrl(file),
        label: file.name,
        kind: (value.side === "A" ? "document-a" : "document-b") as PhotoKind
      }))
    );

    onChange({
      ...value,
      documentPhotos: [...value.documentPhotos, ...uploads]
    });
  };

  const runMockOcr = async () => {
    setIsReading(true);
    const result = await mockOcrFromPhoto(value.documentPhotos[0]);
    setIsReading(false);
    onChange({
      ...value,
      make: result.make,
      model: result.model,
      plate: result.plate,
      policyNumber: result.policyNumber,
      insurer: result.insurer,
      ownerFirstName: value.ownerFirstName || "Ime",
      ownerLastName: value.ownerLastName || "Prezime",
      driverFirstName: value.driverFirstName || "Ime",
      driverLastName: value.driverLastName || "Prezime",
      driverLicenseNumber: value.driverLicenseNumber || `DL-${result.plate}`,
      ocrStatus: "mocked"
    });
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
          Obrisi
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">{title}</h2>
        <p className="text-sm text-white/60">Sekcije 6, 7, 8, 9, 10, 11 i 14 obrasca.</p>
      </div>

      <Camera
        disabled={readOnly}
        title="Polisa osiguranja / vozacka dozvola"
        helper="OCR ostaje placeholder, ali podatke mozemo potvrditi i rucno korigovati."
        onCapture={handleCapture}
      />

      {value.documentPhotos.length ? (
        <Button disabled={readOnly} variant="secondary" onClick={runMockOcr} type="button">
          {isReading ? "Citam dokument..." : "Popuni preko OCR placeholder-a"}
        </Button>
      ) : null}

      <div className="grid grid-cols-2 gap-3">{value.documentPhotos.map(renderThumb)}</div>

      <datalist id={insurerListId}>
        {INSURER_OPTIONS.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>

      <Card className="space-y-4">
        <div className="text-sm uppercase tracking-[0.24em] text-white/40">Ugovarac osiguranja</div>
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
            label="Postanski broj"
            onChange={(ownerPostalCode) => onChange({ ...value, ownerPostalCode })}
            readOnly={readOnly}
            value={value.ownerPostalCode}
          />
          <div className="col-span-2">
            <Field
              label="Drzava"
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
            label="Drzava registracije"
            onChange={(registrationCountry) => onChange({ ...value, registrationCountry })}
            readOnly={readOnly}
            value={value.registrationCountry}
          />
          <Field
            label="Prikolica"
            onChange={(trailerPlate) => onChange({ ...value, trailerPlate })}
            readOnly={readOnly}
            value={value.trailerPlate}
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="text-sm uppercase tracking-[0.24em] text-white/40">Osiguranje</div>
        <Field
          label="Osiguravajuca kuca"
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
            label="Vazi od"
            onChange={(policyValidFrom) => onChange({ ...value, policyValidFrom })}
            readOnly={readOnly}
            type="date"
            value={value.policyValidFrom}
          />
          <Field
            label="Vazi do"
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
          <div className="text-sm text-white/60">Materijalna steta na vozilu pokrivena?</div>
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
        <div className="text-sm uppercase tracking-[0.24em] text-white/40">Vozac</div>
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
            label="Datum rodjenja"
            onChange={(driverBirthDate) => onChange({ ...value, driverBirthDate })}
            readOnly={readOnly}
            type="date"
            value={value.driverBirthDate}
          />
          <Field
            label="Drzava"
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
            label="Vozacka dozvola br."
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
          label="Vozacka dozvola vazi do"
          onChange={(driverLicenseValidUntil) =>
            onChange({ ...value, driverLicenseValidUntil })
          }
          readOnly={readOnly}
          type="date"
          value={value.driverLicenseValidUntil}
        />
      </Card>

      <Card className="space-y-4">
        <label className="space-y-2">
          <span className="text-sm text-white/60">Vidljiva ostecenja</span>
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
