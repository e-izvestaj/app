import Button from "../../components/Button";
import Card from "../../components/Card";
import type { SafetyAnswers } from "../../types";

type Props = {
  value: SafetyAnswers;
  onChange: (value: SafetyAnswers) => void;
  readOnly?: boolean;
};

function ToggleRow({
  label,
  value,
  onSelect,
  readOnly = false
}: {
  label: string;
  value: boolean | null;
  onSelect: (next: boolean) => void;
  readOnly?: boolean;
}) {
  return (
    <Card className="space-y-4">
      <div className="text-base font-medium text-white">{label}</div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          disabled={readOnly}
          onClick={() => onSelect(true)}
          type="button"
          variant={value === true ? "primary" : "secondary"}
        >
          Da
        </Button>
        <Button
          disabled={readOnly}
          onClick={() => onSelect(false)}
          type="button"
          variant={value === false ? "primary" : "secondary"}
        >
          Ne
        </Button>
      </div>
    </Card>
  );
}

function EmergencyOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-[#0B0D12]/96 p-4 backdrop-blur-md">
      <div className="rounded-[30px] border border-rose-400/25 bg-card p-6 shadow-glass">
        <div className="space-y-4">
          <div className="text-[28px] font-semibold text-white">Povređeni učesnici</div>
          <div className="text-sm leading-7 text-white/72">
            U slučaju povređenih učesnika potrebno je pozvati hitne službe i sačekati
            policijski uviđaj. Evropski izveštaj se u tom slučaju ne koristi kao zamena za
            policijski zapisnik.
          </div>
          <div className="grid gap-3">
            <Button onClick={() => (window.location.href = "tel:192")} type="button" variant="success">
              Pozovi 192
            </Button>
            <Button onClick={() => (window.location.href = "tel:194")} type="button" variant="success">
              Pozovi 194
            </Button>
            <Button onClick={onClose} type="button" variant="secondary">
              Zatvori
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SafetyCheckStep({ value, onChange, readOnly = false }: Props) {
  const showEmergency = value.injured === true;

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-[30px] font-semibold text-white">Bezbednost na mestu nezgode</h2>
        <ToggleRow
          label="Da li ima povređenih učesnika?"
          onSelect={(injured) => onChange({ ...value, injured })}
          readOnly={readOnly}
          value={value.injured}
        />

        {value.injured === false ? (
          <>
            <ToggleRow
              label="Da li su vozila i dalje u položaju nakon kontakta?"
              onSelect={(vehiclesInPosition) => onChange({ ...value, vehiclesInPosition })}
              readOnly={readOnly}
              value={value.vehiclesInPosition}
            />
            <ToggleRow
              label="Materijalna šteta na drugim vozilima pored A i B?"
              onSelect={(damageOtherVehicles) => onChange({ ...value, damageOtherVehicles })}
              readOnly={readOnly}
              value={value.damageOtherVehicles}
            />
            <ToggleRow
              label="Materijalna šteta na drugim objektima?"
              onSelect={(damageOtherObjects) => onChange({ ...value, damageOtherObjects })}
              readOnly={readOnly}
              value={value.damageOtherObjects}
            />
          </>
        ) : null}
      </div>

      {showEmergency ? <EmergencyOverlay onClose={() => onChange({ ...value, injured: null })} /> : null}
    </>
  );
}
