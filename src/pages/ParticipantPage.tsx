import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import VehicleForm from "../features/e-report/VehicleForm";
import {
  generateQrCodeDataUrl,
  stringifyParticipantPayload,
  type ParticipantQrPayload
} from "../lib/qr";
import { defaultVehicle, getVehicleSectionMissingFields } from "../lib/utils";
import type { VehicleDraft } from "../types";

export default function ParticipantPage() {
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<VehicleDraft>(() => defaultVehicle("B"));
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [payloadText, setPayloadText] = useState("");
  const [qrError, setQrError] = useState<string | null>(null);

  const missingFields = useMemo(
    () => [
      ...getVehicleSectionMissingFields(vehicle, "driver"),
      ...getVehicleSectionMissingFields(vehicle, "vehicle"),
      ...getVehicleSectionMissingFields(vehicle, "policy")
    ],
    [vehicle]
  );
  const canGenerate = missingFields.length === 0;

  const updateVehicle = (next: VehicleDraft) => {
    setVehicle({ ...next, source: "qr" });
    setQrDataUrl(null);
  };

  const generateQr = () => {
    void (async () => {
      const payload: ParticipantQrPayload = {
        type: "eizvestaj-participant",
        version: 4,
        role: "B",
        firstName: vehicle.driverFirstName,
        lastName: vehicle.driverLastName,
        birthDate: vehicle.driverBirthDate,
        address: vehicle.driverAddress,
        postalCode: vehicle.driverPostalCode,
        city: vehicle.driverCity,
        country: vehicle.driverCountry,
        phone: vehicle.driverPhone,
        email: vehicle.driverEmail,
        driverLicenseNumber: vehicle.driverLicenseNumber,
        driverLicenseCategory: vehicle.driverLicenseCategory,
        driverLicenseValidUntil: vehicle.driverLicenseValidUntil,
        plate: vehicle.plate,
        registrationCountry: vehicle.registrationCountry,
        make: vehicle.make,
        model: vehicle.model,
        vehicleType: vehicle.type,
        vin: vehicle.vin,
        trailerPlate: vehicle.trailerPlate,
        trailerRegistrationCountry: vehicle.trailerRegistrationCountry,
        ownerFirstName: vehicle.ownerFirstName,
        ownerLastName: vehicle.ownerLastName,
        ownerAddress: vehicle.ownerAddress,
        ownerCity: vehicle.ownerCity,
        ownerPostalCode: vehicle.ownerPostalCode,
        ownerCountry: vehicle.ownerCountry,
        ownerPhone: vehicle.ownerPhone,
        ownerEmail: vehicle.ownerEmail,
        ownerSameAsDriver: vehicle.ownerSameAsDriver,
        insurer: vehicle.insurer,
        policyNumber: vehicle.policyNumber,
        greenCardNumber: vehicle.greenCardNumber,
        policyValidFrom: vehicle.policyValidFrom,
        policyValidUntil: vehicle.policyValidUntil,
        insuranceBranch: vehicle.insuranceBranch,
        insuranceOfficeName: vehicle.insuranceOfficeName,
        insuranceAddress: vehicle.insuranceAddress,
        insuranceCity: vehicle.insuranceCity,
        insuranceCountry: vehicle.insuranceCountry,
        insurancePhone: vehicle.insurancePhone,
        insuranceEmail: vehicle.insuranceEmail,
        coveredDamage: vehicle.coveredDamage,
        createdAt: new Date().toISOString()
      };
      const serialized = stringifyParticipantPayload(payload);
      setPayloadText(serialized);
      setQrError(null);
      try {
        setQrDataUrl(await generateQrCodeDataUrl(serialized));
      } catch {
        setQrDataUrl(null);
        setQrError("QR je prevelik za prikaz. Kopiraj payload ispod i nalepi ga kod uvoza.");
      }
    })();
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-10 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <button className="text-sm text-white/55" onClick={() => navigate("/")} type="button">
          Nazad
        </button>
        <div className="text-xs uppercase tracking-[0.26em] text-white/40">Offline unos</div>
      </div>

      <div className="space-y-5">
        <div>
          <h1 className="text-[32px] font-semibold text-white">Podaci ucesnika B</h1>
        </div>

        <VehicleForm
          accent="yellow"
          onChange={updateVehicle}
          section="driver"
          title="Vozac B"
          value={vehicle}
        />
        <VehicleForm
          accent="yellow"
          onChange={updateVehicle}
          section="vehicle"
          title="Vozilo B"
          value={vehicle}
        />
        <VehicleForm
          accent="yellow"
          onChange={updateVehicle}
          section="policy"
          title="Polisa B"
          value={vehicle}
        />

        {!canGenerate ? (
          <Card className="space-y-3">
            <div className="text-sm font-semibold text-white">Nedostaju obavezni podaci</div>
            <div className="space-y-1 text-sm text-white/60">
              {missingFields.map((field) => (
                <div key={field}>{field}</div>
              ))}
            </div>
          </Card>
        ) : null}

        <Button disabled={!canGenerate} onClick={generateQr} type="button" variant="success">
          Generisi QR za ucesnika A
        </Button>

        {qrError ? (
          <div className="rounded-[20px] border border-rose-400/25 bg-rose-500/12 px-4 py-3 text-sm text-rose-100">
            {qrError}
          </div>
        ) : null}

        {(qrDataUrl || payloadText) ? (
          <Card className="space-y-4 text-center">
            <div className="space-y-1">
              <div className="text-lg font-semibold text-white">Podaci su spremni</div>
              <div className="text-sm text-white/60">
                Pokazi ovaj QR kod ucesniku A da uveze tvoje podatke.
              </div>
            </div>
            {qrDataUrl ? (
              <img
                alt="QR kod za prenos podataka"
                className="mx-auto w-full max-w-[320px] rounded-[24px] bg-white p-3"
                src={qrDataUrl}
              />
            ) : null}
            <details className="text-left text-xs text-white/45">
              <summary>Prikazi payload</summary>
              <textarea className="input-glass mt-3 min-h-[130px]" readOnly value={payloadText} />
            </details>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
