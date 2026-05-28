import { useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import Modal from "../../components/Modal";
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
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const handleEmergencySelect = (injured: boolean) => {
    onChange({ ...value, injured });
    if (injured) {
      setShowEmergencyModal(true);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-[30px] font-semibold text-white">Prvo bezbednost.</h2>
        </div>
        <ToggleRow
          label="Da li ima povređenih učesnika?"
          readOnly={readOnly}
          value={value.injured}
          onSelect={handleEmergencySelect}
        />
        <ToggleRow
          label="Da li su vozila i dalje u položaju nakon kontakta?"
          readOnly={readOnly}
          value={value.vehiclesInPosition}
          onSelect={(vehiclesInPosition) => onChange({ ...value, vehiclesInPosition })}
        />
        <ToggleRow
          label="Materijalna šteta na drugim vozilima pored A i B?"
          readOnly={readOnly}
          value={value.damageOtherVehicles}
          onSelect={(damageOtherVehicles) => onChange({ ...value, damageOtherVehicles })}
        />
        <ToggleRow
          label="Materijalna šteta na drugim objektima?"
          readOnly={readOnly}
          value={value.damageOtherObjects}
          onSelect={(damageOtherObjects) => onChange({ ...value, damageOtherObjects })}
        />
      </div>

      <Modal
        open={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        title="POZOVITE POLICIJU ILI HITNU POMOĆ"
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-white/70">
            Ako ima povređenih, odmah pozovite nadležne službe pre nastavka unosa zapisnika.
          </p>
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 text-white">
            <div className="text-sm text-white/55">Policija</div>
            <div className="mt-1 text-2xl font-semibold">192</div>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 text-white">
            <div className="text-sm text-white/55">Hitna medicinska pomoć</div>
            <div className="mt-1 text-2xl font-semibold">194</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => (window.location.href = "tel:192")} type="button">
              Pozovi 192
            </Button>
            <Button
              onClick={() => (window.location.href = "tel:194")}
              type="button"
              variant="secondary"
            >
              Pozovi 194
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
