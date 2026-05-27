import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
    fullWidth?: boolean;
  }
>;

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-accent text-white shadow-[0_12px_35px_rgba(47,128,255,0.35)] hover:brightness-110",
  secondary:
    "bg-white/10 text-white border border-white/10 hover:bg-white/14",
  ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/6"
};

export default function Button({
  children,
  className = "",
  fullWidth = true,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={props.type || "button"}
      className={`rounded-[24px] px-5 py-4 text-left text-base font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
