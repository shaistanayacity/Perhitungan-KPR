import { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-foreground-muted">{hint}</p>}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/70 outline-none transition focus:border-foreground-muted focus:ring-4 focus:ring-foreground/5";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "accent";
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";
  const variants: Record<string, string> = {
    primary: "bg-navy text-background hover:opacity-90",
    secondary: "border border-border-strong bg-surface text-foreground hover:border-foreground/30",
    ghost: "text-foreground-muted hover:text-foreground",
    accent: "bg-gold-strong text-white hover:brightness-105",
  };
  return <button {...props} className={`${base} ${variants[variant]} ${className}`} />;
}

export function RadioCard({
  name,
  value,
  checked,
  onChange,
  title,
  subtitle,
  disabled,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: string;
  subtitle?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`group relative flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm transition ${
        checked ? "border-foreground/25 bg-surface-muted" : "border-border bg-surface hover:border-border-strong"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
          checked ? "border-navy bg-navy" : "border-border-strong bg-surface"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-background">
            <path d="M4.6 8.4 2.1 5.9l.9-.9 1.6 1.6 4-4 .9.9-4.9 4.9Z" />
          </svg>
        )}
      </span>
      <span>
        <span className="block font-semibold text-foreground">{title}</span>
        {subtitle && <span className="mt-0.5 block text-xs leading-relaxed text-foreground-muted">{subtitle}</span>}
      </span>
    </label>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "gold" | "success";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-surface-muted text-foreground-muted",
    gold: "bg-gold-soft text-gold-strong",
    success: "bg-success/10 text-success",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function SectionCard({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-border bg-surface p-5 sm:p-6 ${className}`}>
      {eyebrow && (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground-muted/70">
          {eyebrow}
        </p>
      )}
      <h3 className="mb-4 text-[15px] font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function StatRow({
  label,
  value,
  emphasis = false,
  negative = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  negative?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-2 ${
        emphasis ? "mt-1 border-t border-border pt-3" : ""
      }`}
    >
      <span className={`text-[13px] ${emphasis ? "font-semibold text-foreground" : "text-foreground-muted"}`}>
        {label}
      </span>
      <span
        className={`text-right text-sm tabular-nums ${
          emphasis ? "text-base font-bold text-foreground" : "font-medium text-foreground"
        } ${negative ? "text-danger" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
