import Button from "../../components/Button";
import Card from "../../components/Card";
import type { SafetyAnswers } from "../../types";

type Props = {
  value: SafetyAnswers;
  onChange: (value: SafetyAnswers) => void;
};

function ToggleRow({
  label,
  value,
  onSelect
}: {
  label: string;
  value: boolean | null;
  onSelect: (next: boolean) => void;
}) {
  return (
    <Card className="space-y-4">
      <div className="text-base font-medium text-white">{label}</div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant={value === true ? "primary" : "secondary"}
          onClick={() => onSelect(true)}
          type="button"
        >
          Da
        </Button>
        <Button
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

export default function SafetyCheckStep({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Prvo bezbednost.</h2>
        <p className="text-sm text-white/60">Jedna odluka po koraku.</p>
      </div>
      <ToggleRow
        label="Da li ima povredjenih?"
        value={value.injured}
        onSelect={(injured) => onChange({ ...value, injured })}
      />
      <ToggleRow
        label="Da li su vozila i dalje u polozaju nakon kontakta?"
        value={value.vehiclesInPosition}
        onSelect={(vehiclesInPosition) => onChange({ ...value, vehiclesInPosition })}
      />
    </div>
  );
}
