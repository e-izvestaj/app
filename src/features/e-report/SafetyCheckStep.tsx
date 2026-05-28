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
          variant={value === true ? "primary" : "secondary"}
          onClick={() => onSelect(true)}
          type="button"
        >
          Da
        </Button>
        <Button
          disabled={readOnly}
          variant={value === false ? "primary" : "secondary"}
          onClick={() => onSelect(false)}
          type="button"
        >
          Ne
        </Button>
      </div>
    </Card>
  );
}

export default function SafetyCheckStep({ value, onChange, readOnly = false }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Prvo bezbednost.</h2>
        <p className="text-sm text-white/60">Popunjavamo polja 3 i 4 sa standardnog obrasca.</p>
      </div>
      <ToggleRow
        label="Da li ima povredjenih ucesnika?"
        readOnly={readOnly}
        value={value.injured}
        onSelect={(injured) => onChange({ ...value, injured })}
      />
      <ToggleRow
        label="Da li su vozila i dalje u polozaju nakon kontakta?"
        readOnly={readOnly}
        value={value.vehiclesInPosition}
        onSelect={(vehiclesInPosition) => onChange({ ...value, vehiclesInPosition })}
      />
      <ToggleRow
        label="Materijalna steta na drugim vozilima pored A i B?"
        readOnly={readOnly}
        value={value.damageOtherVehicles}
        onSelect={(damageOtherVehicles) => onChange({ ...value, damageOtherVehicles })}
      />
      <ToggleRow
        label="Materijalna steta na drugim objektima?"
        readOnly={readOnly}
        value={value.damageOtherObjects}
        onSelect={(damageOtherObjects) => onChange({ ...value, damageOtherObjects })}
      />
    </div>
  );
}
