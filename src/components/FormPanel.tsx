"use client";

import { Dispatch, Fragment } from "react";
import { FormState, FormAction, TabId } from "@/lib/formReducer";
import { ValidationErrors } from "@/types/buyer";
import { Button } from "@/components/ui";
import ProfilTab from "@/components/form/ProfilTab";
import PropertiTab from "@/components/form/PropertiTab";
import TermTab from "@/components/form/TermTab";

const TABS: { id: TabId; label: string }[] = [
  { id: "profil", label: "Profil" },
  { id: "properti", label: "Properti" },
  { id: "term", label: "Term & KPR" },
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3 fill-background">
      <path d="M4.6 8.4 2.1 5.9l.9-.9 1.6 1.6 4-4 .9.9-4.9 4.9Z" />
    </svg>
  );
}

function Stepper({ activeTab, dispatch }: { activeTab: TabId; dispatch: Dispatch<FormAction> }) {
  const activeIndex = TABS.findIndex((t) => t.id === activeTab);
  return (
    <div className="flex items-center justify-center gap-2 px-6 pb-5 pt-6">
      {TABS.map((tab, i) => {
        const isDone = i < activeIndex;
        const isActive = i === activeIndex;
        return (
          <Fragment key={tab.id}>
            <button
              type="button"
              onClick={() => (isDone ? dispatch({ type: "SET_TAB", tab: tab.id }) : undefined)}
              className={`flex flex-col items-center gap-1.5 ${isDone ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition ${
                  isActive
                    ? "bg-navy text-background"
                    : isDone
                      ? "bg-navy/80 text-background"
                      : "border border-border-strong text-foreground-muted"
                }`}
              >
                {isDone ? <CheckIcon /> : i + 1}
              </span>
              <span
                className={`text-[11px] font-medium ${isActive ? "text-foreground" : "text-foreground-muted"}`}
              >
                {tab.label}
              </span>
            </button>
            {i < TABS.length - 1 && <span className="mb-4 h-px w-6 shrink-0 bg-border" />}
          </Fragment>
        );
      })}
    </div>
  );
}

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
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface">
      <Stepper activeTab={state.activeTab} dispatch={dispatch} />

      <div className="flex-1 overflow-y-auto border-t border-border px-5 py-5 sm:px-6">
        {state.activeTab === "profil" && (
          <ProfilTab state={state} dispatch={dispatch} errors={errors} />
        )}
        {state.activeTab === "properti" && (
          <PropertiTab state={state} dispatch={dispatch} errors={errors} />
        )}
        {state.activeTab === "term" && <TermTab state={state} dispatch={dispatch} errors={errors} />}
      </div>

      <div className="flex gap-2 border-t border-border p-4">
        {state.activeTab === "profil" ? (
          <>
            <Button variant="secondary" onClick={onReset} className="flex-1">
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => dispatch({ type: "SET_TAB", tab: "properti" })}
              className="flex-[2]"
            >
              Lanjut
            </Button>
          </>
        ) : state.activeTab === "properti" ? (
          <>
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: "SET_TAB", tab: "profil" })}
              className="flex-1"
            >
              Kembali
            </Button>
            <Button
              variant="primary"
              onClick={() => dispatch({ type: "SET_TAB", tab: "term" })}
              className="flex-[2]"
            >
              Lanjut
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: "SET_TAB", tab: "properti" })}
              className="flex-1"
            >
              Kembali
            </Button>
            <Button variant="primary" onClick={onCalculate} disabled={!canCalculate} className="flex-[2]">
              Hitung Simulasi
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
