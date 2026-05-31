import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import Button from "../components/Button";
import Card from "../components/Card";
import {
  generateQrCodeDataUrl,
  stringifyParticipantPayload,
  type ParticipantQrPayload
} from "../lib/qr";

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  plate: string;
  vehicle: string;
  insurance: string;
  policyNumber: string;
  driverLicense: string;
  note: string;
};

const emptyForm: FormState = {
  fullName: "",
  phone: "",
  email: "",
  plate: "",
  vehicle: "",
  insurance: "",
  policyNumber: "",
  driverLicense: "",
  note: ""
};

function Field({
  label,
  value,
  onChange,
  optional = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs uppercase tracking-[0.24em] text-white/40">
        {label}
        {optional ? " (opciono)" : ""}
      </span>
      <input
        className="input-glass"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

export default function ParticipantPage() {
  const navigate = useNavigate();
  const signatureRef = useRef<any>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [signature, setSignature] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [payloadText, setPayloadText] = useState("");
  const [qrError, setQrError] = useState<string | null>(null);

  const canGenerate = useMemo(
    () =>
      Boolean(
        form.fullName.trim() &&
          form.phone.trim() &&
          form.plate.trim() &&
          form.insurance.trim() &&
          form.policyNumber.trim() &&
          signature
      ),
    [form, signature]
  );

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
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
        version: 1,
        role: "B",
        ...form,
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
        setQrError("QR je prevelik za prikaz. Skrati napomenu ili ponovo sacuvaj potpis.");
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

      <div className="space-y-4">
        <div>
          <h1 className="text-[32px] font-semibold text-white">Moji podaci za izvestaj</h1>
        </div>

        <Card className="space-y-4">
          <Field label="Ime i prezime" onChange={(value) => updateField("fullName", value)} value={form.fullName} />
          <Field label="Telefon" onChange={(value) => updateField("phone", value)} value={form.phone} />
          <Field label="Email" onChange={(value) => updateField("email", value)} optional value={form.email} />
          <Field label="Registarska oznaka" onChange={(value) => updateField("plate", value)} value={form.plate} />
          <Field label="Marka/model vozila" onChange={(value) => updateField("vehicle", value)} optional value={form.vehicle} />
          <Field label="Osiguravajuca kuca" onChange={(value) => updateField("insurance", value)} value={form.insurance} />
          <Field label="Broj polise" onChange={(value) => updateField("policyNumber", value)} value={form.policyNumber} />
          <Field label="Broj vozacke" onChange={(value) => updateField("driverLicense", value)} optional value={form.driverLicense} />
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.24em] text-white/40">Napomena (opciono)</span>
            <textarea
              className="input-glass min-h-[110px]"
              onChange={(event) => updateField("note", event.target.value)}
              value={form.note}
            />
          </label>
        </Card>

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

        {qrDataUrl ? (
          <Card className="space-y-4 text-center">
            <img alt="QR kod za prenos podataka" className="mx-auto w-full max-w-[320px] rounded-[24px] bg-white p-3" src={qrDataUrl} />
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
