"use client";

import { FormState, FormAction } from "@/lib/formReducer";
import { ValidationErrors } from "@/types/buyer";
import { Field, TextInput } from "@/components/ui";
import { formatRupiah } from "@/lib/format";
import { Dispatch } from "react";

const GAJI_MIN = 3_000_000;
const GAJI_MAX = 50_000_000;
const GAJI_STEP = 1_000_000;
const GAJI_DEFAULT = 10_000_000;

export default function ProfilTab({
  state,
  dispatch,
  errors,
}: {
  state: FormState;
  dispatch: Dispatch<FormAction>;
  errors: ValidationErrors;
}) {
  const gaji = state.gaji ?? GAJI_DEFAULT;

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
        label={`Gaji / Penghasilan: ${formatRupiah(gaji)}${gaji >= GAJI_MAX ? "+" : ""} / bulan`}
        htmlFor="gaji"
        hint="Opsional — perkiraan saja, untuk membantu rekomendasi skema pembayaran"
      >
        <input
          id="gaji"
          type="range"
          min={GAJI_MIN}
          max={GAJI_MAX}
          step={GAJI_STEP}
          value={gaji}
          onChange={(e) => dispatch({ type: "SET_FIELD", field: "gaji", value: Number(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-foreground-muted">
          <span>{formatRupiah(GAJI_MIN)}</span>
          <span>{formatRupiah(GAJI_MAX)}+</span>
        </div>
      </Field>
    </div>
  );
}
