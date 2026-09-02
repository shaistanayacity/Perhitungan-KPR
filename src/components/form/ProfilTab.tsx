"use client";

import { FormState, FormAction } from "@/lib/formReducer";
import { ValidationErrors } from "@/types/buyer";
import { Field, TextInput, Select } from "@/components/ui";
import { Dispatch } from "react";

const PEKERJAAN_OPTIONS = ["Karyawan", "Pengusaha", "Professional", "Lainnya"] as const;

export default function ProfilTab({
  state,
  dispatch,
  errors,
}: {
  state: FormState;
  dispatch: Dispatch<FormAction>;
  errors: ValidationErrors;
}) {
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
        <Select
          id="pekerjaan"
          value={state.pekerjaan}
          onChange={(e) =>
            dispatch({ type: "SET_FIELD", field: "pekerjaan", value: e.target.value })
          }
        >
          {PEKERJAAN_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
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
        label="KPR Aktif Saat Ini (IDR)"
        htmlFor="kprAktif"
        error={errors.kprAktif}
        hint="Isi 0 bila tidak memiliki cicilan KPR berjalan"
      >
        <TextInput
          id="kprAktif"
          type="number"
          min={0}
          step={1_000_000}
          value={state.kprAktif}
          onChange={(e) =>
            dispatch({ type: "SET_FIELD", field: "kprAktif", value: Number(e.target.value) })
          }
        />
      </Field>
    </div>
  );
}
