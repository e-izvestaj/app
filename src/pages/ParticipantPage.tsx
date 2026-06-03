import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
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
  const signatureRef = useRef<any>(null);
  const [vehicle, setVehicle] = useState<VehicleDraft>(() => defaultVehicle("B"));
  const [signature, setSignature] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [payloadText, setPayloadText] = useState("");
  const [qrError, setQrError] = useState<string | null>(null);

  const canGenerate = useMemo(
    () =>
      getVehicleSectionMissingFields(vehicle, "driver").length === 0 &&
      getVehicleSectionMissingFields(vehicle, "vehicle").length === 0 &&
      getVehicleSectionMissingFields(vehicle, "policy").length === 0 &&
      Boolean(signature),
    [vehicle, signature]
  );

  const updateVehicle = (next: VehicleDraft) => {
    setVehicle({ ...next, source: "qr" });
    setQrDataUrl(null);
  };

  const saveSignature = () => {
    const canvas = signatureRef.current?.getTrimmedCanvas();
    if (canvas) {
      const compact = document.createElement("canvas");
      compact.width = 220;
      compact.height = 90;
      const context = compact.getContext("2d");
      if (!context) {
        return;
      }
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, compact.width, compact.height);
      const ratio = Math.min(compact.width / canvas.width, compact.height / canvas.height);
      const width = canvas.width * ratio;
      const height = canvas.height * ratio;
      context.drawImage(canvas, (compact.width - width) / 2, (compact.height - height) / 2, width, height);
      setSignature(compact.toDataURL("image/jpeg", 0.28));
      setQrDataUrl(null);
    }
  };

  const generateQr = () => {
    void (async () => {
      const payload: ParticipantQrPayload = {
        type: "eizvestaj-participant",
        version: 3,
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
        signature,
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

        <Card className="space-y-4">
          <div className="text-xs uppercase tracking-[0.24em] text-white/40">Potpis</div>
          <div className="rounded-[24px] bg-white p-2">
            <SignatureCanvas
              canvasProps={{ className: "h-[180px] w-full rounded-[18px] bg-white" }}
              penColor="#0B0D12"
              ref={signatureRef}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => {
                signatureRef.current?.clear();
                setSignature("");
                setQrDataUrl(null);
              }}
              type="button"
              variant="secondary"
            >
              Obrisi
            </Button>
            <Button onClick={saveSignature} type="button">
              Sacuvaj potpis
            </Button>
          </div>
          {signature ? <div className="text-sm text-emerald-100">Potpis je sacuvan.</div> : null}
        </Card>

        <Button disabled={!canGenerate} onClick={generateQr} type="button" variant="success">
          Generisi QR za prenos podataka
        </Button>

        {qrError ? (
          <div className="rounded-[20px] border border-rose-400/25 bg-rose-500/12 px-4 py-3 text-sm text-rose-100">
            {qrError}
          </div>
        ) : null}

        {(qrDataUrl || payloadText) ? (
          <Card className="space-y-4 text-center">
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
