"use client";

import { Dispatch } from "react";
import { FormState, FormAction, TabId } from "@/lib/formReducer";
import { ValidationErrors } from "@/types/buyer";
import ProfilTab from "@/components/form/ProfilTab";
import PropertiTab from "@/components/form/PropertiTab";
import TermTab from "@/components/form/TermTab";

const TABS: { id: TabId; label: string }[] = [
  { id: "profil", label: "1. Profil" },
  { id: "properti", label: "2. Properti" },
  { id: "term", label: "3. Term & KPR" },
];

export default function FormPanel({
  state,
  dispatch,
  errors,
  onCalculate,
  onReset,
  canCalculate,
}: {
  state: FormState;
  dispatch: Dispatch<FormAction>;
  errors: ValidationErrors;
  onCalculate: () => void;
  onReset: () => void;
  canCalculate: boolean;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex border-b border-border px-2 pt-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => dispatch({ type: "SET_TAB", tab: tab.id })}
            className={`relative px-4 py-2.5 text-sm font-medium transition ${
              state.activeTab === tab.id
                ? "text-gold-strong"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            {state.activeTab === tab.id && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gold-strong" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {state.activeTab === "profil" && (
          <ProfilTab state={state} dispatch={dispatch} errors={errors} />
        )}
        {state.activeTab === "properti" && (
          <PropertiTab state={state} dispatch={dispatch} errors={errors} />
        )}
        {state.activeTab === "term" && <TermTab state={state} dispatch={dispatch} errors={errors} />}
      </div>

      <div className="flex gap-2 border-t border-border p-4">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground-muted transition hover:border-danger/40 hover:text-danger"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onCalculate}
          disabled={!canCalculate}
          className="flex-[2] rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          Hitung Simulasi
        </button>
      </div>
    </div>
  );
}
