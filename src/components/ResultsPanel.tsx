"use client";

import { FormState } from "@/lib/formReducer";
import { PropertyUnit } from "@/lib/pricelist";
import { CalculationResult, getTermLabel, KPR_MODE_LABELS } from "@/lib/kpr-calculator";
import { formatRupiah, formatPercent } from "@/lib/format";
import { SectionCard, StatRow, Pill, Button } from "@/components/ui";

export default function ResultsPanel({
  state,
  unit,
  result,
  onDownloadPdf,
  onShare,
  isGeneratingPdf,
  shareStatus,
}: {
  state: FormState;
  unit: PropertyUnit | undefined;
  result: CalculationResult | null;
  onDownloadPdf: () => void;
  onShare: () => void;
  isGeneratingPdf: boolean;
  shareStatus: string | null;
}) {
  if (!unit || !result) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-border bg-surface p-10 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-foreground-muted" strokeWidth="1.5">
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
          </svg>
        </span>
        <p className="font-brand text-2xl text-foreground">Preview Simulasi</p>
        <p className="mt-2 max-w-xs text-sm text-foreground-muted">
          Lengkapi data profil, pilih properti, dan term of payment, lalu klik{" "}
          <span className="font-semibold text-foreground">“Hitung Simulasi”</span> untuk melihat
          hasilnya di sini.
        </p>
      </div>
    );
  }

  const isKpr = result.pokokKpr !== null;

  return (
    <div className="flex h-full flex-col gap-3">
      <div
        id="invoice-preview"
        className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-6">
          <div>
            <Pill tone="gold">{getTermLabel(state.term)}</Pill>
            <p className="font-brand mt-2.5 text-2xl text-foreground">
              {unit.tipe} · {unit.cluster}
            </p>
            <p className="text-sm text-foreground-muted">Blok {unit.blok}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-foreground-muted">
              {isKpr ? "Estimasi Angsuran Awal" : "Estimasi Angsuran / Cicilan Bulanan"}
            </p>
            <p className="font-brand text-3xl text-foreground">
              {result.angsuranAwalKpr !== null
                ? formatRupiah(result.angsuranAwalKpr)
                : result.cicilanBulanan !== null
                  ? formatRupiah(result.cicilanBulanan)
                  : "—"}
            </p>
            <p className="text-[11px] text-foreground-muted/70">*Estimasi, bukan angka final dari bank</p>
          </div>
        </div>

        <SectionCard eyebrow="Section 1" title="Data Pembeli">
          <StatRow label="Nama" value={state.nama || "—"} />
          <StatRow label="Pekerjaan" value={state.pekerjaan || "—"} />
          <StatRow label="Usia" value={state.usia ? `${state.usia} tahun` : "—"} />
          {state.gaji !== null && (
            <StatRow label="Gaji / Penghasilan" value={`${formatRupiah(state.gaji)} / bulan`} />
          )}
        </SectionCard>

        <SectionCard eyebrow="Section 2" title="Data Properti">
          <StatRow label="Cluster" value={unit.cluster} />
          <StatRow label="Tipe" value={unit.tipe} />
          <StatRow label="Blok" value={unit.blok} />
          <StatRow label="Luas Bangunan / Tanah" value={`${unit.lb} m² / ${unit.lt} m²`} />
          <StatRow label="Harga Jual" value={formatRupiah(unit.hargaAsli)} emphasis />
        </SectionCard>

        <SectionCard eyebrow="Section 3" title="Breakdown Harga">
          <StatRow label="Harga Jual" value={formatRupiah(result.hargaJual)} />
          {result.diskonTunaiKeras > 0 && (
            <StatRow
              label="Diskon Tunai Keras (5%)"
              value={`− ${formatRupiah(result.diskonTunaiKeras)}`}
              negative
            />
          )}
          {result.diskonCustom > 0 && (
            <StatRow label="Diskon Khusus" value={`− ${formatRupiah(result.diskonCustom)}`} negative />
          )}
          {result.diskonPpnDtp > 0 && (
            <StatRow label="Diskon PPN DTP" value={`− ${formatRupiah(result.diskonPpnDtp)}`} negative />
          )}
          <StatRow label="Harga Transaksi" value={formatRupiah(result.hargaSetelahDiskon)} emphasis />
        </SectionCard>

        <SectionCard eyebrow="Section 4" title="Term of Payment">
          <StatRow label="Term Pembayaran" value={getTermLabel(state.term)} />
          <StatRow label="Uang Tanda Jadi (UTJ)" value={formatRupiah(result.utj)} />
          {result.uangMuka > 0 && <StatRow label="Uang Muka" value={formatRupiah(result.uangMuka)} />}
          {result.cicilanBulanan !== null && (
            <StatRow
              label={`Cicilan Bulanan (${result.tenorBertahapBulan} bulan)`}
              value={formatRupiah(result.cicilanBulanan)}
            />
          )}
          <StatRow label="Sisa Pelunasan" value={formatRupiah(result.sisaPelunasan)} emphasis />
        </SectionCard>

        {isKpr && (
          <SectionCard
            eyebrow="Section 5"
            title={`KPR Breakdown (${result.kprMode ? KPR_MODE_LABELS[result.kprMode] : "KPR"})`}
          >
            <StatRow label="Pokok KPR" value={formatRupiah(result.pokokKpr ?? 0)} />
            <StatRow label="Tenor Total" value={`${result.tenorKprTahun} tahun`} />
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-foreground-muted">
                    <th className="pb-1.5 font-medium">Tahun</th>
                    <th className="pb-1.5 font-medium">Suku Bunga</th>
                    <th className="pb-1.5 text-right font-medium">Angsuran/bln</th>
                  </tr>
                </thead>
                <tbody>
                  {result.tierBreakdown?.map((t) => (
                    <tr key={t.tierKe} className="border-t border-border">
                      <td className="py-1.5 font-medium text-foreground">
                        {t.tahunMulai}
                        {t.tahunSelesai > t.tahunMulai ? `–${t.tahunSelesai}` : ""}
                      </td>
                      <td className="py-1.5 text-foreground-muted">{formatPercent(t.sukuBunga)}</td>
                      <td className="py-1.5 text-right font-semibold tabular-nums text-foreground">
                        {formatRupiah(t.angsuranBulanan)}
                      </td>
                    </tr>
                  ))}
                  {result.floatingTail && (
                    <tr className="border-t border-border">
                      <td className="py-1.5 font-medium text-foreground">
                        {result.floatingTail.tahunMulai}
                        {result.floatingTail.tahunSelesai > result.floatingTail.tahunMulai
                          ? `–${result.floatingTail.tahunSelesai}`
                          : ""}
                      </td>
                      <td className="py-1.5 text-foreground-muted" colSpan={2}>
                        Floating — mengikuti suku bunga bank
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-foreground-muted">
              *Nominal estimasi berdasarkan rumus anuitas standar — suku bunga &amp; persetujuan
              akhir ditentukan oleh Bank pemberi KPR.
            </p>
          </SectionCard>
        )}

        <SectionCard eyebrow="Section 6" title="Ringkasan Cash Flow">
          <ol className="flex flex-col gap-3">
            {result.cashFlow.map((m, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[10px] font-bold text-foreground-muted">
                  {i + 1}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    {m.keterangan}
                  </span>
                  <span className="text-xs text-foreground-muted">
                    {m.hari}
                  </span>
                </span>
                {m.nominal > 0 && (
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatRupiah(m.nominal)}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </SectionCard>
      </div>

      <div className="no-print flex flex-wrap gap-2 rounded-2xl border border-border bg-surface p-3">
        <Button variant="accent" onClick={onDownloadPdf} disabled={isGeneratingPdf} className="flex-1">
          {isGeneratingPdf ? "Membuat PDF…" : "Download Invoice PDF"}
        </Button>
        <Button variant="secondary" onClick={onShare}>
          {shareStatus ?? "Share"}
        </Button>
      </div>
    </div>
  );
}
