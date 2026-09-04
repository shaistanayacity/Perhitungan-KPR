"use client";

import { Dispatch } from "react";
import { FormState, FormAction } from "@/lib/formReducer";
import { previewTierYearRanges, previewFloatingTailYears } from "@/lib/kpr-calculator";
import { BANK_PRESETS } from "@/lib/bankPresets";
import { formatPercent } from "@/lib/format";
import { TextInput, Button } from "@/components/ui";

export default function TierEditor({
  state,
  dispatch,
}: {
  state: FormState;
  dispatch: Dispatch<FormAction>;
}) {
  const { tiers, kprMode, tenorTahun } = state;
  const isBerjenjang = kprMode === "BERJENJANG";
  const ranges = previewTierYearRanges(tiers, tenorTahun);
  const floatingTail = previewFloatingTailYears(tiers, tenorTahun);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="bankPreset" className="mb-1.5 block text-sm font-medium text-foreground">
          Preset Rate Bank (opsional, untuk periode pertama)
        </label>
        <select
          id="bankPreset"
          defaultValue=""
          onChange={(e) => {
            const preset = BANK_PRESETS.find((p) => p.id === e.target.value);
            if (preset) dispatch({ type: "APPLY_BANK_PRESET", preset });
            e.target.value = "";
          }}
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-foreground-muted"
        >
          <option value="">Custom (isi manual)</option>
          {BANK_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-foreground-muted">
          Angka indikatif dari halaman promo resmi bank, per {BANK_PRESETS[0]?.diperbaruiPer} — tetap bisa
          diedit, dan konfirmasikan ke bank sebelum dipakai sebagai penawaran resmi.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {tiers.map((tier, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface-muted p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                {isBerjenjang ? `Periode ${i + 1}` : "Periode Fixed"}
              </span>
              {isBerjenjang && tiers.length > 1 && (
                <button
                  type="button"
                  onClick={() => dispatch({ type: "REMOVE_TIER", index: i })}
                  aria-label={`Hapus Periode ${i + 1}`}
                  className="text-xs font-medium text-foreground-muted hover:text-danger"
                >
                  Hapus
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-xs text-foreground-muted">Durasi (tahun)</label>
                <TextInput
                  type="number"
                  min={1}
                  max={30}
                  value={tier.durasiTahun}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_TIER",
                      index: i,
                      field: "durasiTahun",
                      value: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-foreground-muted">Suku Bunga (%)</label>
                <TextInput
                  type="number"
                  min={0}
                  step={0.01}
                  value={Number((tier.sukuBunga * 100).toFixed(2))}
                  onChange={(e) =>
                    dispatch({
                      type: "UPDATE_TIER",
                      index: i,
                      field: "sukuBunga",
                      value: Number(e.target.value) / 100,
                    })
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {isBerjenjang && (
        <Button type="button" variant="secondary" onClick={() => dispatch({ type: "ADD_TIER" })}>
          + Tambah Periode
        </Button>
      )}

      <div className="rounded-2xl border border-border bg-surface-muted p-3.5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
          Preview Rentang Tahun
        </p>
        <ul className="flex flex-col gap-1 text-sm">
          {ranges.map((r, i) => (
            <li key={i} className="flex items-center justify-between">
              <span className="text-foreground-muted">
                Tahun {r.tahunMulai}
                {r.tahunSelesai > r.tahunMulai ? `–${r.tahunSelesai}` : ""}
              </span>
              <span className="font-semibold text-foreground">{formatPercent(r.sukuBunga)}</span>
            </li>
          ))}
          {floatingTail && (
            <li className="flex items-center justify-between">
              <span className="text-foreground-muted">
                Tahun {floatingTail.tahunMulai}
                {floatingTail.tahunSelesai > floatingTail.tahunMulai ? `–${floatingTail.tahunSelesai}` : ""}
              </span>
              <span className="font-semibold text-foreground-muted">Floating — mengikuti suku bunga bank</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
