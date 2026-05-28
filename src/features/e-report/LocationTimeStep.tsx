import { useMemo, useState } from "react";
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
  const mapUrl = useMemo(() => {
    if (!value.latitude || !value.longitude) {
      return null;
    }

    return `https://www.openstreetmap.org/export/embed.html?bbox=${value.longitude - 0.01}%2C${value.latitude - 0.01}%2C${value.longitude + 0.01}%2C${value.latitude + 0.01}&layer=mapnik&marker=${value.latitude}%2C${value.longitude}`;
  }, [value.latitude, value.longitude]);

  const syncAddress = (next: LocationDetails) => ({
    ...next,
    address: [next.street, next.streetNumber].filter(Boolean).join(" ")
  });

  const resolveAddressFromCoordinates = async (latitude: number, longitude: number) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=sr,en`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json"
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed with status ${response.status}`);
      }

      const data = (await response.json()) as {
        address?: {
          road?: string;
          pedestrian?: string;
          footway?: string;
          house_number?: string;
          city?: string;
          town?: string;
          village?: string;
          municipality?: string;
          county?: string;
          country?: string;
        };
      };

      const address = data.address || {};
      const street =
        address.road ||
        address.pedestrian ||
        address.footway ||
        "";
      const streetNumber = address.house_number || "";
      const city =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        "";
      const country = address.country || "";

      return {
        street,
        streetNumber,
        city,
        country
      };
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

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
    setGpsMessage("Trazim dozvolu i preuzimam trenutnu lokaciju...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const resolvedAddress = await resolveAddressFromCoordinates(latitude, longitude);
          const nextValue = syncAddress({
            ...value,
            latitude,
            longitude,
            street: resolvedAddress.street || value.street,
            streetNumber: resolvedAddress.streetNumber || value.streetNumber,
            address: "",
            city: resolvedAddress.city || value.city,
            country: resolvedAddress.country || value.country
          });

          const hasReadableAddress = Boolean(
            resolvedAddress.street || resolvedAddress.streetNumber || resolvedAddress.city
          );

          setGpsState("done");
          setGpsMessage(
            hasReadableAddress
              ? "Lokacija i adresa su uspesno preuzete."
              : "GPS koordinate su preuzete, ali adresa nije automatski pronadjena. Proveri ulicu i broj."
          );
          onChange(nextValue);
        } catch {
          setGpsState("done");
          setGpsMessage(
            "GPS koordinate su preuzete, ali adresa nije automatski pronadjena. Proveri ulicu i broj."
          );
          onChange({
            ...value,
            latitude,
            longitude,
            address: value.address || `Lat ${latitude.toFixed(5)}, Lon ${longitude.toFixed(5)}`
          });
        }
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
        <h2 className="text-[30px] font-semibold text-white">Vreme i mesto nezgode</h2>
        <p className="text-sm text-white/60">
          Datum i vreme su preuzeti sa uredjaja, a lokaciju mozes da dobijes GPS-om ili da je uneses rucno.
        </p>
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
        <div className="col-span-2">
          <Button
            disabled={gpsState === "loading" || readOnly}
            onClick={handleRequestLocation}
            type="button"
            variant="secondary"
          >
            {gpsState === "loading"
              ? "Preuzimam GPS..."
              : gpsState === "done"
                ? "Osvezi GPS lokaciju"
                : "Preuzmi GPS lokaciju"}
          </Button>
        </div>
        <label className="space-y-2">
          <span className="text-sm text-white/60">Ulica</span>
          <input
            className="input-glass"
            disabled={readOnly}
            placeholder="Ulica"
            value={value.street}
            onChange={(event) => onChange(syncAddress({ ...value, street: event.target.value }))}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-white/60">Broj</span>
          <input
            className="input-glass"
            disabled={readOnly}
            placeholder="Broj"
            value={value.streetNumber}
            onChange={(event) => onChange(syncAddress({ ...value, streetNumber: event.target.value }))}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-white/60">Grad</span>
          <input
            className="input-glass"
            disabled={readOnly}
            placeholder="Grad"
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

      {mapUrl ? (
        <Card className="space-y-3 overflow-hidden p-0">
          <div className="px-5 pt-5">
            <div className="text-sm font-medium text-white">Trenutna lokacija</div>
            <div className="mt-1 text-xs text-white/55">
              {value.latitude?.toFixed(5)}, {value.longitude?.toFixed(5)}
            </div>
          </div>
          <iframe
            className="h-52 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={mapUrl}
            title="Mapa lokacije nezgode"
          />
        </Card>
      ) : null}
    </div>
  );
}
