import type { ChangeEvent } from "react";
import Button from "./Button";
import Card from "./Card";

type Props = {
  title: string;
  onCapture: (files: FileList) => void;
  helper?: string;
};

export default function Camera({ title, onCapture, helper }: Props) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      onCapture(event.target.files);
      event.target.value = "";
    }
  };

  return (
    <Card className="space-y-4 bg-gradient-to-b from-white/10 to-white/5">
      <div>
        <div className="text-lg font-semibold text-white">{title}</div>
        {helper ? <p className="mt-1 text-sm text-white/60">{helper}</p> : null}
      </div>
      <label className="block">
        <input
          className="hidden"
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handleChange}
        />
        <span className="block">
          <Button>Otvori kameru</Button>
        </span>
      </label>
    </Card>
  );
}
