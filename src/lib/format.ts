// Utilitas format angka & tanggal — Bahasa Indonesia, pemisah ribuan titik (§5.3)

export function formatRupiah(value: number): string {
  const rounded = Math.round(value);
  return `Rp ${rounded.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("id-ID", { maximumFractionDigits: 0 });
}

export function formatPercent(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits).replace(".", ",")}%`;
}

export function formatDateID(date: Date = new Date()): string {
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

export function slugifyFileSegment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "Data";
}
