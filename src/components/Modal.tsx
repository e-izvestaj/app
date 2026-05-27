import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  open: boolean;
  title: string;
  onClose: () => void;
}>;

export default function Modal({ open, title, onClose, children }: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 p-4 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-card p-5 shadow-glass">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button className="text-white/60" onClick={onClose} type="button">
            Zatvori
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
