import { useMemo, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { normalizePhone } from "../../lib/utils";
import type { LocationDetails } from "../../types";

type Props = {
  value: LocationDetails;
  witnessInfo: string;
  onWitnessInfoChange: (value: string) => void;
  onChange: (value: LocationDetails) => void;
  readOnly?: boolean;
};

type Witness = {
  name: string;
  address: string;
  phone: string;
};

const emptyWitness = (): Witness => ({ name: "", address: "", phone: "" });

function parseWitnesses(value: string): Witness[] {
  if (!value.trim()) {
    return [];
  }

  return value
    .split(/\r?\n/)
    .slice(0, 2)
    .map((line) => {
      const [name = "", address = "", phone = ""] = line.split(", ");
      return { name, address, phone };
    });
}

function serializeWitnesses(witnesses: Witness[]) {
  return witnesses
    .map((witness) => [witness.name, witness.address, witness.phone].map((part) => part.trim()).join(", "))
    .filter((line) => line.replace(/,/g, "").trim())
    .join("\n");
}

export default function LocationTimeStep({
  value,
  witnessInfo,
  onWitnessInfoChange,
  onChange,
  readOnly = false
}: Props) {
  const [gpsState, setGpsState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  const [witnessesEnabled, setWitnessesEnabled] = useState(Boolean(witnessInfo.trim()));
  const parsedWitnesses = useMemo(() => parseWitnesses(witnessInfo), [witnessInfo]);
  const witnesses = witnessesEnabled ? (parsedWitnesses.length ? parsedWitnesses : [emptyWitness()]) : [];
  const hasWitnesses = witnessesEnabled;
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

  const updateWitnesses = (nextWitnesses: Witness[]) => {
    setWitnessesEnabled(nextWitnesses.length > 0);
    onWitnessInfoChange(serializeWitnesses(nextWitnesses));
  };

  const updateWitness = (index: number, patch: Partial<Witness>) => {
    updateWitnesses(
      witnesses.map((witness, witnessIndex) =>
        witnessIndex === index ? { ...witness, ...patch } : witness
      )
    );
  };

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
            variant="success"
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
        <div className="col-span-2 space-y-3 rounded-[20px] border border-white/10 bg-white/5 p-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-white">Svedoci</div>
            <div className="text-xs text-white/50">Opcionalno, najvise dva svedoka.</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              className={`rounded-[18px] border px-4 py-3 text-sm transition ${!hasWitnesses ? "border-emerald-300/45 bg-emerald-500/16 text-white" : "border-white/10 bg-white/5 text-white/70"}`}
              disabled={readOnly}
              onClick={() => updateWitnesses([])}
              type="button"
            >
              Nema svedoka
            </button>
            <button
              className={`rounded-[18px] border px-4 py-3 text-sm transition ${hasWitnesses ? "border-sky-300/45 bg-sky-500/16 text-white" : "border-white/10 bg-white/5 text-white/70"}`}
              disabled={readOnly}
              onClick={() => setWitnessesEnabled(true)}
              type="button"
            >
              Ima svedoka
            </button>
          </div>
          {hasWitnesses ? (
            <div className="space-y-4">
              {witnesses.map((witness, index) => (
                <div className="space-y-3 rounded-[18px] border border-white/10 bg-black/10 p-3" key={index}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/45">Svedok {index + 1}</div>
                    <button
                      className="text-xs text-red-200/80"
                      disabled={readOnly}
                      onClick={() => updateWitnesses(witnesses.filter((_, witnessIndex) => witnessIndex !== index))}
                      type="button"
                    >
                      Ukloni
                    </button>
                  </div>
                  <input
                    className="input-glass"
                    disabled={readOnly}
                    placeholder="Ime i prezime"
                    value={witness.name}
                    onChange={(event) => updateWitness(index, { name: event.target.value })}
                  />
                  <input
                    className="input-glass"
                    disabled={readOnly}
                    placeholder="Adresa"
                    value={witness.address}
                    onChange={(event) => updateWitness(index, { address: event.target.value })}
                  />
                  <input
                    className="input-glass"
                    disabled={readOnly}
                    inputMode="tel"
                    placeholder="+381641234567"
                    type="tel"
                    value={witness.phone}
                    onChange={(event) => updateWitness(index, { phone: normalizePhone(event.target.value) })}
                  />
                </div>
              ))}
              {witnesses.length < 2 ? (
                <Button
                  disabled={readOnly}
                  onClick={() => updateWitnesses([...witnesses, emptyWitness()])}
                  type="button"
                  variant="secondary"
                >
                  Dodaj jos jednog svedoka
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
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
