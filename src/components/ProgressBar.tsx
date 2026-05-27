type Props = {
  current: number;
  total: number;
  label: string;
};

export default function ProgressBar({ current, total, label }: Props) {
  const percent = Math.max(0, Math.min(100, (current / total) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/45">
        <span>{label}</span>
        <span>
          {current}/{total}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
