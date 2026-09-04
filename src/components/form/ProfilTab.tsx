"use client";

import { FormState, FormAction } from "@/lib/formReducer";
import { ValidationErrors } from "@/types/buyer";
import { Field, TextInput } from "@/components/ui";
import { Dispatch } from "react";

export const GAJI_RANGES = [
  "< Rp4 juta",
  "Rp4–7 juta",
  "Rp8–10 juta",
  "Rp11–15 juta",
  "Rp16–20 juta",
  "Rp21–30 juta",
  "Rp31–50 juta",
  "> Rp50 juta",
] as const;

const GAJI_DEFAULT_INDEX = 2;

export default function ProfilTab({
  state,
  dispatch,
  errors,
}: {
  state: FormState;
  dispatch: Dispatch<FormAction>;
  errors: ValidationErrors;
}) {
  const gajiIndex = state.gaji ? GAJI_RANGES.indexOf(state.gaji as (typeof GAJI_RANGES)[number]) : -1;
  const activeIndex = gajiIndex >= 0 ? gajiIndex : GAJI_DEFAULT_INDEX;

  return (
    <div className="flex flex-col gap-4">
      <Field label="Nama Lengkap" htmlFor="nama" error={errors.nama}>
        <TextInput
          id="nama"
          placeholder="Nama calon pembeli"
          value={state.nama}
          onChange={(e) => dispatch({ type: "SET_FIELD", field: "nama", value: e.target.value })}
        />
      </Field>

      <Field label="Pekerjaan" htmlFor="pekerjaan">
        <TextInput
          id="pekerjaan"
          placeholder="Contoh: Karyawan Swasta"
          value={state.pekerjaan}
          onChange={(e) =>
            dispatch({ type: "SET_FIELD", field: "pekerjaan", value: e.target.value })
          }
        />
      </Field>

      <Field label="Usia (21–65 tahun)" htmlFor="usia" error={errors.usia}>
        <TextInput
          id="usia"
          type="number"
          min={21}
          max={65}
          placeholder="Contoh: 35"
          value={state.usia ?? ""}
          onChange={(e) =>
            dispatch({
              type: "SET_FIELD",
              field: "usia",
              value: e.target.value === "" ? null : Number(e.target.value),
            })
          }
        />
      </Field>

      <Field
        label={`Gaji / Penghasilan: ${GAJI_RANGES[activeIndex]} / bulan`}
        htmlFor="gaji"
        hint="Opsional — perkiraan saja, untuk membantu rekomendasi skema pembayaran"
      >
        <input
          id="gaji"
          type="range"
          min={0}
          max={GAJI_RANGES.length - 1}
          step={1}
          value={activeIndex}
          onChange={(e) =>
            dispatch({ type: "SET_FIELD", field: "gaji", value: GAJI_RANGES[Number(e.target.value)] })
          }
          className="w-full"
        />
        <div className="flex justify-between text-xs text-foreground-muted">
          <span>{GAJI_RANGES[0]}</span>
          <span>{GAJI_RANGES[GAJI_RANGES.length - 1]}</span>
        </div>
      </Field>
    </div>
  );
}
