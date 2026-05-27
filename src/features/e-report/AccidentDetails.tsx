import Card from "../../components/Card";
import type { ScenarioOption } from "../../types";

type Props = {
  options: ScenarioOption[];
  note: string;
  onOptionsChange: (options: ScenarioOption[]) => void;
  onNoteChange: (note: string) => void;
};

export default function AccidentDetails({
  options,
  note,
  onOptionsChange,
  onNoteChange
}: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-[30px] font-semibold text-white">Opis dogadjaja.</h2>
        <p className="text-sm text-white/60">Obelezi okolnosti i dodaj kratku napomenu.</p>
      </div>
      <Card className="grid grid-cols-2 gap-3">
        {options.map((item) => (
          <button
            key={item.id}
            className={`rounded-[22px] border px-4 py-4 text-left text-sm transition ${
              item.selected
                ? "border-accent bg-accent/18 text-white"
                : "border-white/10 bg-white/5 text-white/72"
            }`}
            onClick={() =>
              onOptionsChange(
                options.map((option) =>
                  option.id === item.id ? { ...option, selected: !option.selected } : option
                )
              )
            }
            type="button"
          >
            {item.label}
          </button>
        ))}
      </Card>
      <Card>
        <label className="space-y-2">
          <span className="text-sm text-white/60">Napomena</span>
          <textarea
            className="input-glass min-h-[140px]"
            placeholder="Kratak opis toka dogadjaja"
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
          />
        </label>
      </Card>
    </div>
  );
}
