"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LeadRow } from "@/lib/leadsData";
import { formatRupiah } from "@/lib/format";
import { TextInput, Button } from "@/components/ui";

const TERM_LABELS: Record<string, string> = {
  HARD_CASH: "Hard Cash",
  TUNAI_BERTAHAP: "Tunai Bertahap",
  KPR: "KPR",
};

function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function angsuranPerBulan(row: LeadRow): number | null {
  return row.angsuran_bulanan_kpr ?? row.cicilan_bulanan ?? null;
}

export default function LeadsTable({ leads }: { leads: LeadRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((row) =>
      [row.nama, row.pekerjaan, row.cluster, row.tipe, row.blok]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    );
  }, [leads, query]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/leads-auth", { method: "DELETE" });
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-brand text-2xl text-foreground">Leads — KPR Calculator</p>
          <p className="text-sm text-foreground-muted">
            {filtered.length} dari {leads.length} simulasi terbaru
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TextInput
            placeholder="Cari nama / pekerjaan / cluster / tipe…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64"
          />
          <Button variant="secondary" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? "Keluar…" : "Keluar"}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Pekerjaan</th>
              <th className="px-4 py-3">Usia</th>
              <th className="px-4 py-3">Gaji</th>
              <th className="px-4 py-3">Properti</th>
              <th className="px-4 py-3">Term</th>
              <th className="px-4 py-3 text-right">Harga Transaksi</th>
              <th className="px-4 py-3 text-right">Angsuran/bln</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => {
              const angsuran = angsuranPerBulan(row);
              return (
                <tr
                  key={row.id}
                  className={`border-b border-border last:border-0 ${i % 2 === 1 ? "bg-surface-muted/50" : ""}`}
                >
                  <td className="px-4 py-2.5 whitespace-nowrap text-foreground-muted">
                    {formatTanggal(row.created_at)}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-foreground">{row.nama}</td>
                  <td className="px-4 py-2.5 text-foreground-muted">{row.pekerjaan || "—"}</td>
                  <td className="px-4 py-2.5 text-foreground-muted">{row.usia ?? "—"}</td>
                  <td className="px-4 py-2.5 text-foreground-muted">{row.gaji || "—"}</td>
                  <td className="px-4 py-2.5 text-foreground-muted">
                    {row.cluster} — {row.tipe}
                    {row.blok ? ` · Blok ${row.blok}` : ""}
                  </td>
                  <td className="px-4 py-2.5">{TERM_LABELS[row.term_of_payment] ?? row.term_of_payment}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {row.harga_setelah_diskon !== null ? formatRupiah(row.harga_setelah_diskon) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                    {angsuran !== null ? formatRupiah(angsuran) : "—"}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-foreground-muted">
                  Tidak ada data yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
