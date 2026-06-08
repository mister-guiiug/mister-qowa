/** Primitives UI partagées (Tailwind v4). Mobile-first, contrastées, tactiles. */
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Screen({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-6 ${className}`}
    >
      {children}
    </main>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  full?: boolean;
};

export function Button({
  variant = "primary",
  full = false,
  className = "",
  ...props
}: ButtonProps) {
  const styles: Record<string, string> = {
    primary: "bg-brand text-white hover:brightness-110 active:scale-[.98]",
    ghost: "bg-white/10 text-white hover:bg-white/15",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
  };
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        styles[variant]
      } ${full ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-white/70">
      <div className="size-8 animate-spin rounded-full border-3 border-white/20 border-t-white" />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}
