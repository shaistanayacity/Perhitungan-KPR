"use client";

import { Dispatch } from "react";
import { FormState, FormAction } from "@/lib/formReducer";
import { ValidationErrors } from "@/types/buyer";
import { getUnitById } from "@/lib/pricelist";
import { TermOfPayment, KprMode, KPR_MODE_LABELS } from "@/lib/kpr-calculator";
import { Field, RadioCard, TextInput } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import TierEditor from "./TierEditor";

export default function TermTab({
  state,
  dispatch,
  errors,
}: {
  state: FormState;
  dispatch: Dispatch<FormAction>;
  errors: ValidationErrors;
}) {
  const unit = state.unitId ? getUnitById(state.unitId) : undefined;
  const isKpr = state.term === "KPR";

  const terms: { value: TermOfPayment; title: string; subtitle: string }[] = [
    {
      value: "HARD_CASH",
      title: "Hard Cash 1 Bulan",
      subtitle: "Diskon tunai keras 5%, DP 80%, sisa saat AJB",
    },
    {
      value: "TUNAI_BERTAHAP",
      title: "Tunai Bertahap 6 Bulan (Tanpa UM)",
      subtitle: "Cicilan flat tanpa uang muka, tenor diisi manual — tanpa bank",
    },
    {
      value: "KPR",
      title: "KPR",
      subtitle: "Fix (fixed period lalu floating) atau Berjenjang (bunga bertingkat manual)",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Term of Payment</p>
        <div className="flex flex-col gap-2.5">
          {terms.map((t) => (
            <RadioCard
              key={t.value}
              name="term"
              value={t.value}
              checked={state.term === t.value}
              onChange={(v) => dispatch({ type: "SET_FIELD", field: "term", value: v as TermOfPayment })}
              title={t.title}
              subtitle={t.subtitle}
            />
          ))}
        </div>
      </div>

      {(state.term === "HARD_CASH" || state.term === "TUNAI_BERTAHAP" || isKpr) && (
        <Field
          label="Diskon Khusus (opsional)"
          htmlFor="diskonCustom"
          hint="Default Rp 0 — isi bila unit mendapat diskon negosiasi untuk case tertentu"
        >
          <TextInput
            id="diskonCustom"
            type="number"
            min={0}
            step={1_000_000}
            value={state.diskonCustom}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", field: "diskonCustom", value: Number(e.target.value) })
            }
          />
        </Field>
      )}

      {state.term === "TUNAI_BERTAHAP" && (
        <Field
          label={`Tenor Bertahap: ${state.tenorBertahapBulan} bulan`}
          htmlFor="tenorBertahap"
          hint="Diisi manual — default mengikuti konvensi cluster/tipe, tetap bisa diubah"
        >
          <TextInput
            id="tenorBertahap"
            type="number"
            min={1}
            max={36}
            value={state.tenorBertahapBulan}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", field: "tenorBertahapBulan", value: Number(e.target.value) })
            }
          />
        </Field>
      )}

      {isKpr && (
        <>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Jenis KPR</p>
            <div className="flex flex-col gap-2.5">
              {(["FIX", "BERJENJANG"] as KprMode[]).map((mode) => (
                <RadioCard
                  key={mode}
                  name="kprMode"
                  value={mode}
                  checked={state.kprMode === mode}
                  onChange={(v) => dispatch({ type: "SET_KPR_MODE", mode: v as KprMode })}
                  title={KPR_MODE_LABELS[mode]}
                  subtitle={
                    mode === "FIX"
                      ? "Contoh: 2 tahun pertama fixed, sisanya floating mengikuti bank"
                      : "Contoh: tahun 1–3 bunga A, tahun 4–6 bunga B, sisanya floating"
                  }
                />
              ))}
            </div>
          </div>

          <Field
            label={`Tenor KPR Total: ${state.tenorTahun} tahun`}
            htmlFor="tenor"
            error={errors.tenorKpr}
          >
            <input
              id="tenor"
              type="range"
              min={1}
              max={30}
              step={1}
              value={state.tenorTahun}
              onChange={(e) =>
                dispatch({ type: "SET_FIELD", field: "tenorTahun", value: Number(e.target.value) })
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-foreground-muted">
              <span>1 thn</span>
              <span>30 thn</span>
            </div>
          </Field>

          <Field
            label={`Uang Muka (DP): ${(state.dpPercent * 100).toFixed(0)}%`}
            htmlFor="dpNominal"
            hint={
              unit
                ? "Isi nominal Rupiah langsung, atau geser slider persentase — keduanya saling menyesuaikan"
                : "Pilih properti dahulu untuk mengisi nominal DP"
            }
          >
            <TextInput
              id="dpNominal"
              type="number"
              min={0}
              max={unit ? unit.hargaAsli * 0.9 : undefined}
              step={1_000_000}
              disabled={!unit}
              value={unit ? Math.round(unit.hargaAsli * state.dpPercent) : 0}
              onChange={(e) => {
                if (!unit) return;
                const nominal = Math.max(0, Number(e.target.value));
                const percent = unit.hargaAsli > 0 ? nominal / unit.hargaAsli : 0;
                dispatch({ type: "SET_FIELD", field: "dpPercent", value: Math.min(percent, 0.9) });
              }}
              className="mb-2 disabled:opacity-40"
            />
            {unit && (
              <p className="mb-2 text-xs text-foreground-muted">
                ≈ {formatRupiah(unit.hargaAsli * state.dpPercent)} dari Harga Jual {formatRupiah(unit.hargaAsli)}
              </p>
            )}
            <input
              id="dpPercent"
              type="range"
              min={0}
              max={90}
              step={5}
              value={state.dpPercent * 100}
              disabled={!unit}
              onChange={(e) =>
                dispatch({ type: "SET_FIELD", field: "dpPercent", value: Number(e.target.value) / 100 })
              }
              className="w-full disabled:opacity-40"
            />
            <div className="flex justify-between text-xs text-foreground-muted">
              <span>0%</span>
              <span>90%</span>
            </div>
          </Field>

          <TierEditor state={state} dispatch={dispatch} />
        </>
      )}
    </div>
  );
}
