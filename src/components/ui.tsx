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
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-foreground-muted">{hint}</p>}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

const inputBase =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/70 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBase} ${props.className ?? ""}`} />;
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
      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
        checked
          ? "border-gold bg-gold-soft/60 ring-1 ring-gold"
          : "border-border bg-surface hover:border-gold/60"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="mt-0.5 accent-[var(--gold-strong)]"
      />
      <span>
        <span className="block font-semibold text-foreground">{title}</span>
        {subtitle && <span className="mt-0.5 block text-xs text-foreground-muted">{subtitle}</span>}
      </span>
    </label>
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
    <section className={`rounded-2xl border border-border bg-surface p-5 shadow-sm ${className}`}>
      {eyebrow && (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-strong">
          {eyebrow}
        </p>
      )}
      <h3 className="mb-4 text-base font-semibold text-foreground">{title}</h3>
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
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className={`text-sm ${emphasis ? "font-semibold text-foreground" : "text-foreground-muted"}`}>
        {label}
      </span>
      <span
        className={`text-right text-sm tabular-nums ${
          emphasis ? "text-base font-bold text-gold-strong" : "font-medium text-foreground"
        } ${negative ? "text-danger" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
