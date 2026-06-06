import Card from "../../components/Card";
import type { ScenarioOption } from "../../types";

type Props = {
  options: ScenarioOption[];
  vehicleANote: string;
  vehicleBNote: string;
  onOptionsChange: (options: ScenarioOption[]) => void;
  onVehicleANoteChange: (note: string) => void;
  onVehicleBNoteChange: (note: string) => void;
  readOnly?: boolean;
};

function countSelected(options: ScenarioOption[], side: "A" | "B") {
  return options.filter((item) => (side === "A" ? item.selectedByA : item.selectedByB)).length;
}

function CheckBoxButton({
  selected,
  readOnly,
  onClick,
  label
}: {
  selected: boolean;
  readOnly: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      className={`flex h-11 w-11 items-end justify-center pb-1 ${readOnly ? "cursor-default opacity-85" : ""}`}
      disabled={readOnly}
      onClick={onClick}
      type="button"
    >
      <span
        className={`flex h-6 w-6 items-center justify-center border text-sm font-semibold leading-none ${
          selected ? "border-accent bg-accent text-white" : "border-white/45 bg-transparent text-transparent"
        }`}
      >
        X
      </span>
    </button>
  );
}

function CircumstancesTable({
  options,
  readOnly = false,
  onToggle
}: {
  options: ScenarioOption[];
  readOnly?: boolean;
  onToggle: (side: "A" | "B", id: string) => void;
}) {
  const selectedA = countSelected(options, "A");
  const selectedB = countSelected(options, "B");

  return (
    <Card className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="text-sm uppercase tracking-[0.24em] text-white/40">Okolnosti nezgode</div>
        <div className="flex gap-2 text-sm text-accent">
          <span className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1">A: {selectedA}</span>
          <span className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1">B: {selectedB}</span>
        </div>
      </div>

      <div className="space-y-3">
        {options.map((item, index) => (
          <div
            className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-end gap-3 rounded-[18px] border border-white/10 bg-white/5 px-2 py-3"
            key={item.id}
          >
            <CheckBoxButton
              label={`Vozilo A okolnost ${index + 1}`}
              onClick={() => onToggle("A", item.id)}
              readOnly={readOnly}
              selected={item.selectedByA}
            />
            <div className="min-w-0 text-center text-base font-medium leading-snug text-white">
              {index + 1}. {item.label}
            </div>
            <CheckBoxButton
              label={`Vozilo B okolnost ${index + 1}`}
              onClick={() => onToggle("B", item.id)}
              readOnly={readOnly}
              selected={item.selectedByB}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function AccidentDetails({
  options,
  vehicleANote,
  vehicleBNote,
  onOptionsChange,
  onVehicleANoteChange,
  onVehicleBNoteChange,
  readOnly = false
}: Props) {
  const toggleSide = (side: "A" | "B", id: string) => {
    onOptionsChange(
      options.map((option) =>
        option.id === id
          ? {
              ...option,
              selectedByA: side === "A" ? !option.selectedByA : option.selectedByA,
              selectedByB: side === "B" ? !option.selectedByB : option.selectedByB
            }
          : option
      )
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-[30px] font-semibold text-white">Okolnosti nezgode</h2>

      <CircumstancesTable onToggle={toggleSide} options={options} readOnly={readOnly} />

      <Card className="space-y-4">
        <div className="text-sm uppercase tracking-[0.24em] text-white/40">Napomene vozaca</div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm text-white/60">Napomena vozila A</span>
            <textarea
              className="input-glass min-h-[140px]"
              disabled={readOnly}
              placeholder="Napomena A"
              value={vehicleANote}
              onChange={(event) => onVehicleANoteChange(event.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-white/60">Napomena vozila B</span>
            <textarea
              className="input-glass min-h-[140px]"
              disabled={readOnly}
              placeholder="Napomena B"
              value={vehicleBNote}
              onChange={(event) => onVehicleBNoteChange(event.target.value)}
            />
          </label>
        </div>
      </Card>
    </div>
  );
}
