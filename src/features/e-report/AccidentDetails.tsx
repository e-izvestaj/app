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

function CircumstanceColumn({
  side,
  options,
  readOnly = false,
  onToggle
}: {
  side: "A" | "B";
  options: ScenarioOption[];
  readOnly?: boolean;
  onToggle: (id: string) => void;
}) {
  const selectedCount = countSelected(options, side);

  return (
    <Card className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm uppercase tracking-[0.24em] text-white/40">Okolnosti vozila {side}</div>
          <div className="mt-1 text-sm text-white/60">
            Svaki učesnik čekira samo svoja polja iz obrasca.
          </div>
        </div>
        <div className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-sm text-accent">
          Označeno: {selectedCount}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {options.map((item, index) => {
          const selected = side === "A" ? item.selectedByA : item.selectedByB;

          return (
            <button
              key={`${side}-${item.id}`}
              className={`rounded-[22px] border px-4 py-4 text-left text-sm transition ${
                selected
                  ? "border-accent bg-accent/18 text-white"
                  : "border-white/10 bg-white/5 text-white/72"
              } ${readOnly ? "cursor-default opacity-85" : ""}`}
              disabled={readOnly}
              onClick={() => onToggle(item.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-white/40">{index + 1}</div>
                  <div className="mt-2">{item.label}</div>
                </div>
                <div
                  className={`mt-1 h-6 w-6 rounded-md border text-center text-xs leading-[22px] ${
                    selected ? "border-accent bg-accent text-white" : "border-white/20 text-white/45"
                  }`}
                >
                  {selected ? "X" : ""}
                </div>
              </div>
            </button>
          );
        })}
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
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Okolnosti nezgode</h2>
        <p className="text-sm text-white/60">
          Prvo čekira vozilo A, zatim vozilo B. Svaka strana nezavisno označava svoja polja iz obrasca.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CircumstanceColumn
          onToggle={(id) => toggleSide("A", id)}
          options={options}
          readOnly={readOnly}
          side="A"
        />
        <CircumstanceColumn
          onToggle={(id) => toggleSide("B", id)}
          options={options}
          readOnly={readOnly}
          side="B"
        />
      </div>

      <Card className="space-y-4">
        <div className="text-sm uppercase tracking-[0.24em] text-white/40">Napomene vozača (polje 14)</div>
        <div className="text-sm text-white/60">
          Ovo nije zamena za okolnosti. Koristi se samo za dodatnu belešku uz obrazac.
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm text-white/60">Napomena vozila A</span>
            <textarea
              className="input-glass min-h-[140px]"
              disabled={readOnly}
              placeholder="Opciona napomena učesnika A"
              value={vehicleANote}
              onChange={(event) => onVehicleANoteChange(event.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-white/60">Napomena vozila B</span>
            <textarea
              className="input-glass min-h-[140px]"
              disabled={readOnly}
              placeholder="Opciona napomena učesnika B"
              value={vehicleBNote}
              onChange={(event) => onVehicleBNoteChange(event.target.value)}
            />
          </label>
        </div>
      </Card>
    </div>
  );
}
