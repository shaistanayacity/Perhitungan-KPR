"use client";

import { Dispatch } from "react";
import { FormState, FormAction } from "@/lib/formReducer";
import { TierMode } from "@/lib/kpr-calculator";
import { BANK_PRESETS } from "@/lib/bankPresets";
import { TextInput, Button } from "@/components/ui";

export default function TierEditor({
  state,
  dispatch,
}: {
  state: FormState;
  dispatch: Dispatch<FormAction>;
}) {
  const { tiers, tierMode, tenorTahun } = state;

  function sisaTahunTierTerakhir(): number {
    const terpakai = tiers.slice(0, -1).reduce((sum, t) => sum + Math.min(t.durasiTahun, 30), 0);
    return Math.max(tenorTahun - terpakai, 0);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Mode Berjenjang</p>
        <div className="flex rounded-full border border-border p-1">
          {(
            [
              { id: "BUNGA" as TierMode, label: "Bunga Berjenjang" },
              { id: "ANGSURAN" as TierMode, label: "Angsuran Berjenjang" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => dispatch({ type: "SET_TIER_MODE", mode: opt.id })}
              className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                tierMode === opt.id ? "bg-navy text-background" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-foreground-muted">
          {tierMode === "BUNGA"
            ? "Suku bunga beda tiap periode — angsuran dihitung ulang dari sisa pokok tiap ganti tier."
            : "Satu suku bunga tetap, angsuran naik bertahap tiap periode."}
        </p>
      </div>

      {tierMode === "BUNGA" && (
        <div>
          <label htmlFor="bankPreset" className="mb-1.5 block text-sm font-medium text-foreground">
            Preset Rate Bank (opsional)
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
      )}

      <div className="flex flex-col gap-3">
        {tiers.map((tier, i) => {
          const isLast = i === tiers.length - 1;
          const isFirstAngsuran = tierMode === "ANGSURAN" && i === 0;
          return (
            <div key={i} className="rounded-2xl border border-border bg-surface-muted p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                  Tier {i + 1}
                </span>
                {tiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "REMOVE_TIER", index: i })}
                    aria-label={`Hapus Tier ${i + 1}`}
                    className="text-xs font-medium text-foreground-muted hover:text-danger"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="mb-1 block text-xs text-foreground-muted">Durasi (tahun)</label>
                  {isLast ? (
                    <div className="flex items-center rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground-muted">
                      Sisa: {sisaTahunTierTerakhir()} thn
                    </div>
                  ) : (
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
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs text-foreground-muted">
                    {tierMode === "BUNGA" ? "Suku Bunga (%)" : isFirstAngsuran ? "Basis (tier awal)" : "Kenaikan (%)"}
                  </label>
                  {isFirstAngsuran ? (
                    <div className="flex items-center rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground-muted">
                      Dihitung otomatis
                    </div>
                  ) : (
                    <TextInput
                      type="number"
                      min={0}
                      step={0.01}
                      value={Number((tier.nilai * 100).toFixed(2))}
                      onChange={(e) =>
                        dispatch({
                          type: "UPDATE_TIER",
                          index: i,
                          field: "nilai",
                          value: Number(e.target.value) / 100,
                        })
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button type="button" variant="secondary" onClick={() => dispatch({ type: "ADD_TIER" })}>
        + Tambah Tier
      </Button>
    </div>
  );
}
