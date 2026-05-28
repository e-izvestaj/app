import { useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import type { LocationDetails } from "../../types";

type Props = {
  value: LocationDetails;
  witnessInfo: string;
  onWitnessInfoChange: (value: string) => void;
  onChange: (value: LocationDetails) => void;
  readOnly?: boolean;
};

export default function LocationTimeStep({
  value,
  witnessInfo,
  onWitnessInfoChange,
  onChange,
  readOnly = false
}: Props) {
  const [gpsState, setGpsState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  const handleRequestLocation = () => {
    if (!window.isSecureContext) {
      setGpsState("error");
      setGpsMessage("GPS radi samo preko bezbedne HTTPS konekcije.");
      return;
    }

    if (!navigator.geolocation) {
      setGpsState("error");
      setGpsMessage("Ovaj browser ne podrzava GPS lokaciju.");
      return;
    }

    setGpsState("loading");
    setGpsMessage("Preuzimam trenutnu lokaciju...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setGpsState("done");
        setGpsMessage("Lokacija je uspesno preuzeta.");
        onChange({
          ...value,
          latitude,
          longitude,
          address: `Lat ${latitude.toFixed(5)}, Lon ${longitude.toFixed(5)}`,
          city: value.city || "Automatski preuzeta lokacija"
        });
      },
      (error) => {
        setGpsState("error");

        if (error.code === error.PERMISSION_DENIED) {
          setGpsMessage("Dozvola za lokaciju je odbijena. Omoguci je u browseru i pokusaj ponovo.");
          return;
        }

        if (error.code === error.TIMEOUT) {
          setGpsMessage("GPS nije odgovorio na vreme. Pokusaj ponovo.");
          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsMessage("Lokacija trenutno nije dostupna na ovom uredjaju.");
          return;
        }

        setGpsMessage("Ne mogu da preuzmem lokaciju. Pokusaj ponovo.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Lokacija i vreme.</h2>
        <p className="text-sm text-white/60">Polja 1, 2, 4 i 5 evropskog obrasca.</p>
      </div>
      <Card className="grid grid-cols-2 gap-3">
        <label className="space-y-2">
          <span className="text-sm text-white/60">Datum</span>
          <input
            className="input-glass"
            disabled={readOnly}
            type="date"
            value={value.date}
            onChange={(event) => onChange({ ...value, date: event.target.value })}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-white/60">Vreme</span>
          <input
            className="input-glass"
            disabled={readOnly}
            type="time"
            value={value.time}
            onChange={(event) => onChange({ ...value, time: event.target.value })}
          />
        </label>
        <label className="col-span-2 space-y-2">
          <span className="text-sm text-white/60">Mesto</span>
          <textarea
            className="input-glass min-h-[110px]"
            disabled={readOnly}
            placeholder="Adresa ili opis lokacije"
            value={value.address}
            onChange={(event) => onChange({ ...value, address: event.target.value })}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-white/60">Grad</span>
          <input
            className="input-glass"
            disabled={readOnly}
            value={value.city}
            onChange={(event) => onChange({ ...value, city: event.target.value })}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-white/60">Drzava</span>
          <input
            className="input-glass"
            disabled={readOnly}
            value={value.country}
            onChange={(event) => onChange({ ...value, country: event.target.value })}
          />
        </label>
        <label className="col-span-2 space-y-2">
          <span className="text-sm text-white/60">Svedoci</span>
          <textarea
            className="input-glass min-h-[90px]"
            disabled={readOnly}
            placeholder="Imena, adrese i telefoni svedoka"
            value={witnessInfo}
            onChange={(event) => onWitnessInfoChange(event.target.value)}
          />
        </label>
      </Card>
      <Button
        variant="secondary"
        onClick={handleRequestLocation}
        type="button"
        disabled={gpsState === "loading" || readOnly}
      >
        {gpsState === "loading"
          ? "Pribavljam GPS..."
          : gpsState === "done"
            ? "Osvezi GPS lokaciju"
            : "Preuzmi GPS lokaciju"}
      </Button>
      {gpsMessage ? (
        <div
          className={`rounded-[20px] px-4 py-3 text-sm ${
            gpsState === "error"
              ? "border border-red-400/25 bg-red-500/12 text-red-100"
              : gpsState === "done"
                ? "border border-emerald-400/25 bg-emerald-500/12 text-emerald-100"
                : "border border-white/10 bg-white/6 text-white/65"
          }`}
        >
          {gpsMessage}
        </div>
      ) : null}
    </div>
  );
}
