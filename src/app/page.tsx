"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import FormPanel from "@/components/FormPanel";
import ResultsPanel from "@/components/ResultsPanel";
import { formReducer, initialFormState } from "@/lib/formReducer";
import { getUnitById } from "@/lib/pricelist";
import { calculateSimulation, CalculationResult } from "@/lib/kpr-calculator";
import { validateForm, hasErrors } from "@/types/buyer";
import { fetchDefaultSukuBunga, logSimulation } from "@/lib/simulationLog";
import { invoiceFileName, generateInvoicePdf } from "@/lib/pdfInvoice";
import { formatRupiah } from "@/lib/format";

export default function Home() {
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchDefaultSukuBunga().then((rate) => dispatch({ type: "APPLY_DEFAULT_RATE", rate }));
  }, []);

  const unit = state.unitId ? getUnitById(state.unitId) : undefined;

  const errors = useMemo(
    () =>
      validateForm({
        nama: state.nama,
        usia: state.usia,
        kprAktif: state.kprAktif,
        tenor: state.tenorTahun,
        sukuBunga: state.sukuBunga,
        unitId: state.unitId,
      }),
    [state.nama, state.usia, state.kprAktif, state.tenorTahun, state.sukuBunga, state.unitId]
  );

  const canCalculate = !hasErrors(errors);

  function handleCalculate() {
    setSubmitted(true);
    if (!canCalculate || !unit) return;
    const calc = calculateSimulation({
      unit,
      term: state.term,
      tenorTahun: state.tenorTahun,
      sukuBunga: state.sukuBunga,
      diskonPreLaunching: state.diskonPreLaunching,
    });
    setResult(calc);
    void logSimulation(
      { nama: state.nama, pekerjaan: state.pekerjaan, usia: state.usia ?? 0, kprAktif: state.kprAktif },
      unit,
      state.term,
      calc
    );
  }

  function handleReset() {
    dispatch({ type: "RESET" });
    setResult(null);
    setSubmitted(false);
  }

  async function handleDownloadPdf() {
    if (!unit || !result) return;
    setIsGeneratingPdf(true);
    try {
      const doc = await generateInvoicePdf(state, unit, result);
      doc.save(invoiceFileName(state.nama, unit.tipe));
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  async function handleShare() {
    if (!unit || !result) return;
    const text = `Simulasi KPR ${unit.cluster} - ${unit.tipe}\nHarga Properti (KPR): ${formatRupiah(
      unit.hargaKpr
    )}\nAngsuran/Cicilan: ${formatRupiah(
      result.angsuranBulananKpr ?? result.cicilanBulanan ?? 0
    )}\nDihitung via KPR Calculator Shaistanaya City`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Simulasi KPR Shaistanaya City", text });
        setShareStatus("Terkirim");
      } else {
        await navigator.clipboard.writeText(text);
        setShareStatus("Tersalin!");
      }
    } catch {
      setShareStatus(null);
      return;
    }
    setTimeout(() => setShareStatus(null), 2000);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="no-print flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <p className="hidden text-sm text-foreground-muted sm:block">
            KPR Calculator Tool — Cluster Montana &amp; Sierra
          </p>
          <ThemeToggle />
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-8rem)]">
          <FormPanel
            state={state}
            dispatch={dispatch}
            errors={submitted ? errors : {}}
            onCalculate={handleCalculate}
            onReset={handleReset}
            canCalculate={canCalculate}
          />
        </div>

        <div className="lg:h-[calc(100vh-8rem)]">
          <ResultsPanel
            state={state}
            unit={unit}
            result={result}
            onDownloadPdf={handleDownloadPdf}
            onShare={handleShare}
            isGeneratingPdf={isGeneratingPdf}
            shareStatus={shareStatus}
          />
        </div>
      </main>

      <footer className="no-print pb-2 text-center text-xs text-foreground-muted">
        © {new Date().getFullYear()} Shaistanaya City · Simulasi bersifat estimasi, bukan persetujuan kredit.
      </footer>
    </div>
  );
}
