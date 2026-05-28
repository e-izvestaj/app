import Card from "../../components/Card";
import type { ScenarioOption } from "../../types";

type Props = {
  options: ScenarioOption[];
  note: string;
  vehicleANote: string;
  vehicleBNote: string;
  onOptionsChange: (options: ScenarioOption[]) => void;
  onNoteChange: (note: string) => void;
  onVehicleANoteChange: (note: string) => void;
  onVehicleBNoteChange: (note: string) => void;
  readOnly?: boolean;
};

export default function AccidentDetails({
  options,
  note,
  vehicleANote,
  vehicleBNote,
  onOptionsChange,
  onNoteChange,
  onVehicleANoteChange,
  onVehicleBNoteChange,
  readOnly = false
}: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Opis događaja</h2>
        <p className="text-sm text-white/60">
          Zajedničke okolnosti ostaju u jednom bloku, a napomene za vozilo A i vozilo B su odvojene.
        </p>
      </div>
      <Card className="grid grid-cols-1 gap-3">
        {options.map((item, index) => (
          <button
            key={item.id}
            className={`rounded-[22px] border px-4 py-4 text-left text-sm transition ${
              item.selected
                ? "border-accent bg-accent/18 text-white"
                : "border-white/10 bg-white/5 text-white/72"
            } ${readOnly ? "cursor-default opacity-85" : ""}`}
            disabled={readOnly}
            onClick={() =>
              onOptionsChange(
                options.map((option) =>
                  option.id === item.id ? { ...option, selected: !option.selected } : option
                )
              )
            }
            type="button"
          >
            <div className="text-xs uppercase tracking-[0.24em] text-white/40">{index + 1}</div>
            <div className="mt-2">{item.label}</div>
          </button>
        ))}
      </Card>

      <Card className="space-y-4">
        <label className="space-y-2">
          <span className="text-sm text-white/60">Zajednička napomena uz okolnosti</span>
          <textarea
            className="input-glass min-h-[160px]"
            disabled={readOnly}
            placeholder="Kratka zajednička beleška uz okolnosti i skicu nezgode"
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
          />
        </label>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <label className="space-y-2">
            <span className="text-sm text-white/60">Vlastite napomene vozila A</span>
            <textarea
              className="input-glass min-h-[160px]"
              disabled={readOnly}
              placeholder="Napomena učesnika A"
              value={vehicleANote}
              onChange={(event) => onVehicleANoteChange(event.target.value)}
            />
          </label>
        </Card>

        <Card>
          <label className="space-y-2">
            <span className="text-sm text-white/60">Vlastite napomene vozila B</span>
            <textarea
              className="input-glass min-h-[160px]"
              disabled={readOnly}
              placeholder="Napomena učesnika B"
              value={vehicleBNote}
              onChange={(event) => onVehicleBNoteChange(event.target.value)}
            />
          </label>
        </Card>
      </div>
    </div>
  );
}
