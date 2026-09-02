"use client";

import { FormState } from "@/lib/formReducer";
import { PropertyUnit } from "@/lib/pricelist";
import { CalculationResult, TERM_LABELS } from "@/lib/kpr-calculator";
import { formatRupiah, formatPercent } from "@/lib/format";
import { SectionCard, StatRow } from "@/components/ui";

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
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted p-10 text-center">
        <p className="font-brand text-2xl text-foreground">Preview Simulasi</p>
        <p className="mt-2 max-w-xs text-sm text-foreground-muted">
          Lengkapi data profil, pilih properti, dan term of payment, lalu klik{" "}
          <span className="font-semibold text-foreground">
            “Hitung Simulasi”
          </span>{" "}
          untuk melihat hasilnya di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div
        id="invoice-preview"
        className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-gradient-to-br from-navy to-navy-strong p-5 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold-soft/90">
              Ringkasan Simulasi
            </p>
            <p className="font-brand text-2xl">
              {unit.tipe} · {unit.cluster}
            </p>
            <p className="text-sm text-white/70">{TERM_LABELS[state.term]}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60">Angsuran / Cicilan Bulanan</p>
            <p className="font-brand text-3xl text-gold-strong">
              {result.angsuranBulananKpr !== null
                ? formatRupiah(result.angsuranBulananKpr)
                : result.cicilanBulanan !== null
                  ? formatRupiah(result.cicilanBulanan)
                  : "—"}
            </p>
          </div>
        </div>

        <SectionCard eyebrow="Section 1" title="Data Pembeli">
          <StatRow label="Nama" value={state.nama || "—"} />
          <StatRow label="Pekerjaan" value={state.pekerjaan} />
          <StatRow
            label="Usia"
            value={state.usia ? `${state.usia} tahun` : "—"}
          />
          <StatRow
            label="KPR Aktif Saat Ini"
            value={formatRupiah(state.kprAktif)}
          />
        </SectionCard>

        <SectionCard eyebrow="Section 2" title="Data Properti">
          <StatRow label="Cluster" value={unit.cluster} />
          <StatRow label="Tipe" value={unit.tipe} />
          <StatRow
            label="Lokasi (Blok / Unit)"
            value={`${unit.blok} / ${unit.noUnit}`}
          />
          <StatRow
            label="Luas Bangunan / Tanah"
            value={`${unit.lb} m² / ${unit.lt} m²`}
          />
          <StatRow label="Harga Asli" value={formatRupiah(unit.hargaAsli)} />
          <StatRow
            label="Harga Properti (KPR)"
            value={formatRupiah(unit.hargaKpr)}
            emphasis
          />
        </SectionCard>

        <SectionCard eyebrow="Section 3" title="Breakdown Harga">
          <StatRow label="Harga Original" value={formatRupiah(result.harga)} />
          {result.diskonTunaiKeras > 0 && (
            <StatRow
              label="Diskon Tunai Keras (5%)"
              value={`− ${formatRupiah(result.diskonTunaiKeras)}`}
              negative
            />
          )}
          {result.diskonPreLaunching > 0 && (
            <StatRow
              label="Diskon Pre-Launching"
              value={`− ${formatRupiah(result.diskonPreLaunching)}`}
              negative
            />
          )}
          <StatRow
            label="Diskon PPN DTP"
            value={`− ${formatRupiah(result.ppnDtp)}`}
            negative
          />
          <StatRow
            label="Harga Setelah Diskon"
            value={formatRupiah(result.hargaSetelahDiskon)}
            emphasis
          />
        </SectionCard>

        <SectionCard eyebrow="Section 4" title="Term of Payment">
          <StatRow label="Term Pembayaran" value={TERM_LABELS[state.term]} />
          <StatRow
            label="Uang Tanda Jadi (UTJ)"
            value={formatRupiah(result.utj)}
          />
          {result.uangMuka > 0 && (
            <StatRow label="Uang Muka" value={formatRupiah(result.uangMuka)} />
          )}
          {result.cicilanBulanan !== null && (
            <StatRow
              label={`Cicilan Bulanan (${result.tenorBertahapBulan} bulan)`}
              value={formatRupiah(result.cicilanBulanan)}
            />
          )}
          <StatRow
            label="Sisa Pelunasan"
            value={formatRupiah(result.sisaPelunasan)}
            emphasis
          />
        </SectionCard>

        {result.pokokKpr !== null && (
          <SectionCard eyebrow="Section 5" title="KPR Breakdown">
            <StatRow label="Pokok KPR" value={formatRupiah(result.pokokKpr)} />
            <StatRow label="Tenor" value={`${result.tenorKprTahun} tahun`} />
            <StatRow
              label="Suku Bunga"
              value={`${formatPercent(result.sukuBungaKpr ?? 0)} p.a.`}
            />
            <StatRow
              label="Angsuran Bulanan"
              value={formatRupiah(result.angsuranBulananKpr ?? 0)}
              emphasis
            />
            <StatRow
              label="Total Bunga"
              value={formatRupiah(result.totalBungaKpr ?? 0)}
            />
            <StatRow
              label="Total Cicilan"
              value={formatRupiah(result.totalCicilanKpr ?? 0)}
            />
          </SectionCard>
        )}

        <SectionCard eyebrow="Section 6" title="Ringkasan Cash Flow">
          <ol className="flex flex-col gap-3">
            {result.cashFlow.map((m, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-soft text-[10px] font-bold text-gold-strong">
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

      <div className="no-print flex flex-wrap gap-2 rounded-2xl border border-border bg-surface p-3 shadow-sm">
        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isGeneratingPdf}
          className="flex-1 rounded-lg bg-gold-strong px-4 py-2.5 text-sm font-semibold text-navy-strong transition hover:brightness-105 disabled:opacity-50"
        >
          {isGeneratingPdf ? "Membuat PDF…" : "Download Invoice PDF"}
        </button>
        <button
          type="button"
          onClick={onShare}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground-muted transition hover:text-foreground"
        >
          {shareStatus ?? "Share"}
        </button>
      </div>
    </div>
  );
}
