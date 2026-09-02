"use client";

import { Dispatch } from "react";
import { FormState, FormAction } from "@/lib/formReducer";
import { ValidationErrors } from "@/types/buyer";
import {
  ClusterId,
  getUniqueTypesForCluster,
  getUnitById,
  getUnitsForType,
} from "@/lib/pricelist";
import { Field, Select, StatRow } from "@/components/ui";
import { formatRupiah } from "@/lib/format";

const CLUSTERS: ClusterId[] = ["MONTANA", "SIERRA"];

export default function PropertiTab({
  state,
  dispatch,
  errors,
}: {
  state: FormState;
  dispatch: Dispatch<FormAction>;
  errors: ValidationErrors;
}) {
  const types = state.cluster ? getUniqueTypesForCluster(state.cluster) : [];
  const units = state.cluster && state.tipe ? getUnitsForType(state.cluster, state.tipe) : [];
  const selectedUnit = state.unitId ? getUnitById(state.unitId) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <Field label="Cluster" htmlFor="cluster" error={errors.unit}>
        <Select
          id="cluster"
          value={state.cluster ?? ""}
          onChange={(e) => dispatch({ type: "SET_CLUSTER", cluster: e.target.value as ClusterId })}
        >
          <option value="" disabled>
            Pilih cluster…
          </option>
          {CLUSTERS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Tipe" htmlFor="tipe">
        <Select
          id="tipe"
          value={state.tipe ?? ""}
          disabled={!state.cluster}
          onChange={(e) => dispatch({ type: "SET_TIPE", tipe: e.target.value })}
        >
          <option value="" disabled>
            {state.cluster ? "Pilih tipe…" : "Pilih cluster dahulu"}
          </option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Blok / No Unit" htmlFor="unit">
        <Select
          id="unit"
          value={state.unitId ?? ""}
          disabled={!state.tipe}
          onChange={(e) => dispatch({ type: "SET_UNIT", unitId: e.target.value })}
        >
          <option value="" disabled>
            {state.tipe ? "Pilih blok / unit…" : "Pilih tipe dahulu"}
          </option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              Blok {u.blok} · No. {u.noUnit}
            </option>
          ))}
        </Select>
      </Field>

      {selectedUnit && (
        <div className="rounded-xl border border-border bg-surface-muted p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gold-strong">
            Detail Unit Terpilih
          </p>
          <StatRow label="Luas Bangunan (LB)" value={`${selectedUnit.lb} m²`} />
          <StatRow label="Luas Tanah (LT)" value={`${selectedUnit.lt} m²`} />
          <StatRow label="Blok / Unit" value={`${selectedUnit.blok} / ${selectedUnit.noUnit}`} />
          <StatRow label="Harga Asli" value={formatRupiah(selectedUnit.hargaAsli)} />
          <StatRow label="Harga Properti (KPR)" value={formatRupiah(selectedUnit.hargaKpr)} emphasis />
        </div>
      )}
    </div>
  );
}
