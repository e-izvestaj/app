import type { HTMLAttributes, PropsWithChildren } from "react";

export default function Card({
  children,
  className = "",
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={`rounded-[28px] border border-white/8 bg-card/85 p-5 shadow-glass backdrop-blur-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
