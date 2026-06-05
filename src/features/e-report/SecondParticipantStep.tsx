import { useEffect, useRef, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import {
  generateQrCodeDataUrl,
  parseParticipantPayload,
  participantPayloadToVehicle
} from "../../lib/qr";
import type { VehicleDraft } from "../../types";

type Props = {
  value: VehicleDraft;
  onChange: (vehicle: VehicleDraft) => void;
  readOnly?: boolean;
  mode: "invite" | "import";
};

function participantFormUrl() {
  const path = `${import.meta.env.BASE_URL}#/participant`;
  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const origin = isLocalHost ? "https://e-izvestaj.github.io" : window.location.origin;
  return `${origin}${path}`;
}

export default function SecondParticipantStep({
  value,
  onChange,
  readOnly = false,
  mode
}: Props) {
  const [scanText, setScanText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [inviteQr, setInviteQr] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (mode !== "invite") {
      return;
    }

    void (async () => {
      setInviteQr(await generateQrCodeDataUrl(participantFormUrl()));
    })();
  }, [mode]);

  const importPayload = (raw: string) => {
    try {
      const payload = parseParticipantPayload(raw);
      onChange(participantPayloadToVehicle(payload, value));
      setMessage("Podaci drugog ucesnika su uspesno dodati.");
      setScanText("");
    } catch {
      setMessage("QR kod nije prepoznat kao podaci drugog ucesnika.");
    }
  };

  useEffect(() => {
    if (mode !== "import" || readOnly || value.source === "qr") {
      return;
    }

    let stream: MediaStream | null = null;
    let rafId = 0;
    let stopped = false;

    const start = async () => {
      const Detector = (window as any).BarcodeDetector;
      if (!Detector) {
        setCameraError("Kamera nije dostupna.");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false
        });

        if (!videoRef.current) {
          return;
        }

        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const detector = new Detector({ formats: ["qr_code"] });

        const tick = async () => {
          if (stopped || !videoRef.current) {
            return;
          }

          try {
            const codes = await detector.detect(videoRef.current);
            const rawValue = codes[0]?.rawValue;
            if (rawValue) {
              importPayload(rawValue);
              return;
            }
          } catch {
            setCameraError("Skeniranje nije uspelo.");
          }

          rafId = window.requestAnimationFrame(tick);
        };

        rafId = window.requestAnimationFrame(tick);
      } catch {
        setCameraError("Kamera nije dostupna.");
      }
    };

    void start();

    return () => {
      stopped = true;
      window.cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [mode, readOnly, value.source]);

  if (mode === "invite") {
    return (
      <div className="space-y-4">
        <h2 className="text-[30px] font-semibold text-white">Drugi ucesnik</h2>
        <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white">
          Drugi ucesnik moze skenirati QR kod i sam uneti podatke za sebe i svoje vozilo. Nakon popunjavanja, njegovi podaci se mogu preuzeti ovde radi brzeg zavrsetka izvestaja.
        </div>
        <Card className="space-y-4 text-center">
          {inviteQr ? (
            <img
              alt="QR za otvaranje forme drugog ucesnika"
              className="mx-auto w-full max-w-[320px] rounded-[24px] bg-white p-3"
              src={inviteQr}
            />
          ) : null}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-[30px] font-semibold text-white">Podaci ucesnika B</h2>

      {message ? (
        <div className="rounded-[20px] border border-emerald-400/25 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}

      {value.source === "qr" ? (
        <Card className="space-y-3">
          <div className="text-lg font-semibold text-white">QR dodat</div>
          <div className="text-sm text-white/60">
            {[value.driverFirstName, value.driverLastName].filter(Boolean).join(" ") || "Ucesnik B"}
          </div>
        </Card>
      ) : (
        <Card className="space-y-4">
          <video
            className="aspect-square w-full rounded-[24px] bg-black object-cover"
            muted
            playsInline
            ref={videoRef}
          />
          {cameraError ? <div className="text-sm text-amber-100">{cameraError}</div> : null}
          <textarea
            className="input-glass min-h-[120px]"
            onChange={(event) => setScanText(event.target.value)}
            placeholder="JSON payload"
            value={scanText}
          />
          <Button disabled={!scanText.trim()} onClick={() => importPayload(scanText)} type="button">
            Uvezi podatke
          </Button>
        </Card>
      )}
    </div>
  );
}
