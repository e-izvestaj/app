import { useEffect, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import type { LocationDetails } from "../../types";

type Props = {
  value: LocationDetails;
  onChange: (value: LocationDetails) => void;
};

export default function LocationTimeStep({ value, onChange }: Props) {
  const [gpsState, setGpsState] = useState<"idle" | "loading" | "done" | "error">("idle");

  useEffect(() => {
    if (!navigator.geolocation || value.latitude || gpsState !== "idle") {
      return;
    }

    setGpsState("loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsState("done");
        onChange({
          ...value,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address:
            value.address ||
            `Lat ${position.coords.latitude.toFixed(5)}, Lon ${position.coords.longitude.toFixed(5)}`
        });
      },
      () => setGpsState("error"),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, [gpsState, onChange, value]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Lokacija i vreme.</h2>
        <p className="text-sm text-white/60">Automatski popunjeno, uz mogucu izmenu.</p>
      </div>
      <Card className="grid grid-cols-2 gap-3">
        <label className="space-y-2">
          <span className="text-sm text-white/60">Datum</span>
          <input
            className="input-glass"
            type="date"
            value={value.date}
            onChange={(event) => onChange({ ...value, date: event.target.value })}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-white/60">Vreme</span>
          <input
            className="input-glass"
            type="time"
            value={value.time}
            onChange={(event) => onChange({ ...value, time: event.target.value })}
          />
        </label>
        <label className="col-span-2 space-y-2">
          <span className="text-sm text-white/60">Lokacija</span>
          <textarea
            className="input-glass min-h-[110px]"
            placeholder="Adresa ili opis lokacije"
            value={value.address}
            onChange={(event) => onChange({ ...value, address: event.target.value })}
          />
        </label>
      </Card>
      <Button variant="secondary" onClick={() => setGpsState("idle")} type="button">
        {gpsState === "loading"
          ? "Pribavljam GPS..."
          : gpsState === "done"
            ? "Osvezi GPS lokaciju"
            : "Preuzmi GPS lokaciju"}
      </Button>
    </div>
  );
}
