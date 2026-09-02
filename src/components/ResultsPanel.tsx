"use client";

import { FormState } from "@/lib/formReducer";
import { PropertyUnit } from "@/lib/pricelist";
import { CalculationResult, getTermLabel } from "@/lib/kpr-calculator";
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

  return (
    <div className="flex h-full flex-col gap-3">
      <div
        id="invoice-preview"
        className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-6">
          <div>
            <Pill tone="gold">{getTermLabel(state.term, state.dpPercent)}</Pill>
            <p className="font-brand mt-2.5 text-2xl text-foreground">
              {unit.tipe} · {unit.cluster}
            </p>
            <p className="text-sm text-foreground-muted">Blok {unit.blok} · No. {unit.noUnit}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-foreground-muted">Estimasi Angsuran / Cicilan Bulanan</p>
            <p className="font-brand text-3xl text-foreground">
              {result.angsuranBulananKpr !== null
                ? formatRupiah(result.angsuranBulananKpr)
                : result.cicilanBulanan !== null
                  ? formatRupiah(result.cicilanBulanan)
                  : "—"}
            </p>
            <p className="text-[11px] text-foreground-muted/70">*Estimasi, bukan angka final dari bank</p>
          </div>
        </div>

        <SectionCard eyebrow="Section 1" title="Data Pembeli">
          <StatRow label="Nama" value={state.nama || "—"} />
          <StatRow label="Pekerjaan" value={state.pekerjaan} />
          <StatRow
            label="Usia"
            value={state.usia ? `${state.usia} tahun` : "—"}
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
          <StatRow label="Term Pembayaran" value={getTermLabel(state.term, state.dpPercent)} />
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
              label="Angsuran Bulanan (Estimasi)"
              value={formatRupiah(result.angsuranBulananKpr ?? 0)}
              emphasis
            />
            <StatRow
              label="Total Bunga (Estimasi)"
              value={formatRupiah(result.totalBungaKpr ?? 0)}
            />
            <StatRow
              label="Total Cicilan (Estimasi)"
              value={formatRupiah(result.totalCicilanKpr ?? 0)}
            />
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
