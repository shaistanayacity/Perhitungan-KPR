import Image from "next/image";

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/logo-flame.png"
        alt="Shaistanaya City"
        width={compact ? 26 : 34}
        height={compact ? 42 : 55}
        priority
      />
      <div className="leading-tight">
        <div
          className={`font-brand tracking-[0.18em] text-foreground ${compact ? "text-sm" : "text-lg"}`}
        >
          SHAISTANAYA
        </div>
        <div
          className={`font-brand tracking-[0.35em] text-gold-strong ${compact ? "text-[10px]" : "text-xs"}`}
        >
          CITY
        </div>
      </div>
    </div>
  );
}
