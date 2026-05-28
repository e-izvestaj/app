import Card from "../../components/Card";
import type { ScenarioOption } from "../../types";

type Props = {
  options: ScenarioOption[];
  note: string;
  onOptionsChange: (options: ScenarioOption[]) => void;
  onNoteChange: (note: string) => void;
  readOnly?: boolean;
};

export default function AccidentDetails({
  options,
  note,
  onOptionsChange,
  onNoteChange,
  readOnly = false
}: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Opis dogadjaja.</h2>
        <p className="text-sm text-white/60">Sekcije 12, 13 i 14 standardnog obrasca.</p>
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
      <Card>
        <label className="space-y-2">
          <span className="text-sm text-white/60">Napomene</span>
          <textarea
            className="input-glass min-h-[160px]"
            disabled={readOnly}
            placeholder="Vlastite napomene vozaca A i B"
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
          />
        </label>
      </Card>
    </div>
  );
}
