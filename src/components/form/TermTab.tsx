"use client";

import { Dispatch } from "react";
import { FormState, FormAction } from "@/lib/formReducer";
import { ValidationErrors } from "@/types/buyer";
import { getBertahapTenorBulan, getUnitById } from "@/lib/pricelist";
import { TermOfPayment, getTermLabel } from "@/lib/kpr-calculator";
import { Field, RadioCard, TextInput } from "@/components/ui";
import { formatPercent } from "@/lib/format";

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
  const tenorBertahap = unit ? getBertahapTenorBulan(unit.cluster, unit.tipe) : null;
  const requiresKprInput = state.term === "HARD_CASH" || state.term === "KPR_DP0";

  const terms: { value: TermOfPayment; title: string; subtitle: string }[] = [
    {
      value: "HARD_CASH",
      title: "Hard Cash 1 Bulan",
      subtitle: "Diskon tunai keras 5% + PPN DTP, DP 80%, sisa saat AJB",
    },
    {
      value: "TUNAI_BERTAHAP",
      title: `Tunai Bertahap ${tenorBertahap ?? "6/9"} Bulan (Tanpa UM)`,
      subtitle: "Cicilan flat tanpa uang muka, lunas saat AJB — tanpa bank",
    },
    {
      value: "KPR_DP0",
      title: getTermLabel("KPR_DP0", state.dpPercent),
      subtitle: "Uang muka bisa 0% atau custom, sisa harga diajukan sebagai KPR bank",
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

      <Field
        label={`Tenor KPR: ${state.tenorTahun} tahun`}
        htmlFor="tenor"
        error={errors.tenor}
        hint={requiresKprInput ? undefined : "Tidak dipakai pada skema Tunai Bertahap"}
      >
        <input
          id="tenor"
          type="range"
          min={1}
          max={30}
          step={1}
          value={state.tenorTahun}
          disabled={!requiresKprInput}
          onChange={(e) =>
            dispatch({ type: "SET_FIELD", field: "tenorTahun", value: Number(e.target.value) })
          }
          className="w-full disabled:opacity-40"
        />
        <div className="flex justify-between text-xs text-foreground-muted">
          <span>1 thn</span>
          <span>30 thn</span>
        </div>
      </Field>

      <Field
        label={`Suku Bunga KPR: ${formatPercent(state.sukuBunga)} p.a.`}
        htmlFor="rate"
        error={errors.sukuBunga}
        hint="Default sesuai rate market — dapat diubah manual (0,5%–10% p.a.)"
      >
        <TextInput
          id="rate"
          type="number"
          min={0.5}
          max={10}
          step={0.01}
          disabled={!requiresKprInput}
          value={Number((state.sukuBunga * 100).toFixed(2))}
          onChange={(e) =>
            dispatch({
              type: "SET_FIELD",
              field: "sukuBunga",
              value: Number(e.target.value) / 100,
            })
          }
          className="disabled:opacity-40"
        />
      </Field>

      {state.term === "KPR_DP0" && (
        <Field
          label={`Uang Muka (DP): ${(state.dpPercent * 100).toFixed(0)}%`}
          htmlFor="dpPercent"
          hint="Default 0% (KPR DP 0%) — geser untuk simulasi dengan uang muka custom"
        >
          <input
            id="dpPercent"
            type="range"
            min={0}
            max={90}
            step={5}
            value={state.dpPercent * 100}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", field: "dpPercent", value: Number(e.target.value) / 100 })
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-foreground-muted">
            <span>0%</span>
            <span>90%</span>
          </div>
        </Field>
      )}

      {state.term !== "HARD_CASH" && (
        <Field
          label="Diskon Pre-Launching (opsional)"
          htmlFor="diskonPre"
          hint="Default Rp 0 — isi bila unit sedang mendapat promo pre-launching"
        >
          <TextInput
            id="diskonPre"
            type="number"
            min={0}
            step={1_000_000}
            value={state.diskonPreLaunching}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                field: "diskonPreLaunching",
                value: Number(e.target.value),
              })
            }
          />
        </Field>
      )}
    </div>
  );
}
