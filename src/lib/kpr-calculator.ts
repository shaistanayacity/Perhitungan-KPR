// Calculation engine — KPR Calculator Tool Shaistanaya City
// Formula & aturan diambil dari BRIEF_KPR_CALCULATOR_TOOL_LENGKAP.docx §3.2 & §7.
//
// Catatan penting: "Harga Properti (KPR)" di pricelist (unit.hargaKpr) SUDAH
// merupakan harga setelah PPN DTP dipotong dari Harga Asli (lihat kolom
// "DISKON PPN DTP" di PL.pdf) — jadi PPN DTP TIDAK dihitung ulang di sini.
// Diskon yang dihitung di engine ini hanya diskon spesifik per term
// (tunai keras 5% untuk Hard Cash, atau diskon pre-launching bila ada).

import { PropertyUnit, UTJ_BY_CLUSTER, getBertahapTenorBulan } from "./pricelist";

export type TermOfPayment = "HARD_CASH" | "TUNAI_BERTAHAP" | "KPR_DP0";

export const TERM_LABELS: Record<TermOfPayment, string> = {
  HARD_CASH: "Hard Cash 1 Bulan",
  TUNAI_BERTAHAP: "Tunai Bertahap (Tanpa UM)",
  KPR_DP0: "KPR (DP Custom)",
};

/** Label tampilan untuk skema KPR dengan DP custom — menyertakan besaran DP terpilih. */
export function getTermLabel(term: TermOfPayment, dpPercent = 0): string {
  if (term === "KPR_DP0") {
    return dpPercent > 0 ? `KPR DP ${(dpPercent * 100).toFixed(0)}%` : "KPR DP 0%";
  }
  return TERM_LABELS[term];
}

export interface CalculatorInput {
  unit: PropertyUnit;
  term: TermOfPayment;
  tenorTahun: number; // 1-30, dipakai untuk skema yang melibatkan KPR bank
  sukuBunga: number; // desimal p.a., mis. 0.03 = 3%
  diskonPreLaunching?: number; // opsional, default 0 (§3.2.B)
  dpPercent?: number; // 0-0.9, khusus skema KPR_DP0 — uang muka custom (default 0 = DP 0%)
}

export interface CashFlowMilestone {
  hari: string; // label waktu, mis. "Hari ke-1"
  keterangan: string;
  nominal: number;
}

export interface CalculationResult {
  // §Section 3: Breakdown Harga
  harga: number;
  diskonTunaiKeras: number;
  diskonPreLaunching: number;
  hargaSetelahDiskon: number;

  // §Section 4: Term of Payment
  utj: number;
  uangMuka: number;
  tenorBertahapBulan: number | null;
  cicilanBulanan: number | null; // untuk Tunai Bertahap
  sisaPelunasan: number;

  // §Section 5: KPR Breakdown (annuity) — null jika term tidak melibatkan bank KPR
  pokokKpr: number | null;
  tenorKprTahun: number | null;
  sukuBungaKpr: number | null;
  angsuranBulananKpr: number | null;
  totalBungaKpr: number | null;
  totalCicilanKpr: number | null;

  // §Section 6: Cash flow timeline
  cashFlow: CashFlowMilestone[];
}

/** Formula anuitas standar: A = P × [r(1+r)^n] / [(1+r)^n − 1] (§7). */
function hitungAngsuranAnuitas(pokok: number, sukuBungaTahunan: number, tenorTahun: number): number {
  const n = Math.round(tenorTahun * 12);
  const r = sukuBungaTahunan / 12;
  if (n <= 0) return 0;
  if (r === 0) return pokok / n;
  const factor = Math.pow(1 + r, n);
  return (pokok * r * factor) / (factor - 1);
}

export function calculateSimulation(input: CalculatorInput): CalculationResult {
  const { unit, term, tenorTahun, sukuBunga } = input;
  const diskonPreLaunching = input.diskonPreLaunching ?? 0;
  const harga = unit.hargaKpr;
  const utj = UTJ_BY_CLUSTER[unit.cluster];
  const cashFlow: CashFlowMilestone[] = [];

  if (term === "HARD_CASH") {
    const diskonTunaiKeras = harga * 0.05;
    const hargaSetelahDiskon = harga - diskonTunaiKeras;
    const uangMuka80 = harga * 0.8;
    const sisaPelunasan = hargaSetelahDiskon - utj - uangMuka80;
    const pokokKpr = Math.max(sisaPelunasan, 0);
    const angsuran = hitungAngsuranAnuitas(pokokKpr, sukuBunga, tenorTahun);
    const n = Math.round(tenorTahun * 12);
    const totalCicilan = angsuran * n;

    cashFlow.push(
      { hari: "Hari ke-1", keterangan: "Uang Tanda Jadi (UTJ)", nominal: utj },
      { hari: "Hari ke-30 (maks.)", keterangan: "Uang Muka 80%", nominal: uangMuka80 },
      { hari: "Saat AJB Notaris", keterangan: "Sisa Pelunasan (tunai / dapat diajukan KPR)", nominal: sisaPelunasan }
    );

    return {
      harga,
      diskonTunaiKeras,
      diskonPreLaunching: 0,
      hargaSetelahDiskon,
      utj,
      uangMuka: uangMuka80,
      tenorBertahapBulan: null,
      cicilanBulanan: null,
      sisaPelunasan,
      pokokKpr,
      tenorKprTahun: tenorTahun,
      sukuBungaKpr: sukuBunga,
      angsuranBulananKpr: angsuran,
      totalBungaKpr: totalCicilan - pokokKpr,
      totalCicilanKpr: totalCicilan,
      cashFlow,
    };
  }

  if (term === "TUNAI_BERTAHAP") {
    const hargaSetelahDiskon = harga - diskonPreLaunching;
    const tenorBulan = getBertahapTenorBulan(unit.cluster, unit.tipe);
    const sisaPelunasan = hargaSetelahDiskon - utj;
    const cicilanBulanan = sisaPelunasan / tenorBulan;

    // Baris cash flow dirangkum jadi rentang (mis. "Angsuran ke-1 s/d ke-5" + pelunasan)
    // mengikuti konvensi pricelist, bukan satu baris per bulan — supaya invoice tetap
    // ringkas walau tenor bertahap sampai 9 bulan.
    cashFlow.push({ hari: "Hari ke-1", keterangan: "Uang Tanda Jadi (UTJ)", nominal: utj });
    if (tenorBulan > 1) {
      cashFlow.push({
        hari: `Hari ke-7 dst. (bulan ke-1 s/d ke-${tenorBulan - 1})`,
        keterangan: `Angsuran ke-1 s/d ke-${tenorBulan - 1}`,
        nominal: cicilanBulanan,
      });
    }
    cashFlow.push({
      hari: "Saat AJB Notaris",
      keterangan: `Angsuran ke-${tenorBulan} (pelunasan)`,
      nominal: cicilanBulanan,
    });

    return {
      harga,
      diskonTunaiKeras: 0,
      diskonPreLaunching,
      hargaSetelahDiskon,
      utj,
      uangMuka: 0,
      tenorBertahapBulan: tenorBulan,
      cicilanBulanan,
      sisaPelunasan,
      pokokKpr: null,
      tenorKprTahun: null,
      sukuBungaKpr: null,
      angsuranBulananKpr: null,
      totalBungaKpr: null,
      totalCicilanKpr: null,
      cashFlow,
    };
  }

  // KPR_DP0 (KPR dengan DP custom, default 0%)
  const dpPercent = Math.min(Math.max(input.dpPercent ?? 0, 0), 0.9);
  const hargaSetelahDiskon = harga - diskonPreLaunching;
  const uangMuka = harga * dpPercent;
  const pokokKpr = hargaSetelahDiskon - utj - uangMuka;
  const angsuran = hitungAngsuranAnuitas(pokokKpr, sukuBunga, tenorTahun);
  const n = Math.round(tenorTahun * 12);
  const totalCicilan = angsuran * n;

  cashFlow.push({ hari: "Hari ke-1", keterangan: "Uang Tanda Jadi (UTJ)", nominal: utj });
  if (uangMuka > 0) {
    cashFlow.push({ hari: "Hari ke-30 (maks.)", keterangan: `Uang Muka (${(dpPercent * 100).toFixed(0)}%)`, nominal: uangMuka });
  }
  cashFlow.push(
    { hari: "Hari ke-60 (maks.)", keterangan: "Permohonan KPR disetujui (Pokok KPR)", nominal: pokokKpr },
    { hari: "Bulan ke-1 dst.", keterangan: "Angsuran KPR Bulanan", nominal: angsuran },
    { hari: "Saat AJB Notaris", keterangan: "Akad Kredit & Serah Terima", nominal: 0 }
  );

  return {
    harga,
    diskonTunaiKeras: 0,
    diskonPreLaunching,
    hargaSetelahDiskon,
    utj,
    uangMuka,
    tenorBertahapBulan: null,
    cicilanBulanan: null,
    sisaPelunasan: pokokKpr,
    pokokKpr,
    tenorKprTahun: tenorTahun,
    sukuBungaKpr: sukuBunga,
    angsuranBulananKpr: angsuran,
    totalBungaKpr: totalCicilan - pokokKpr,
    totalCicilanKpr: totalCicilan,
    cashFlow,
  };
}

export function availableTermsForUnit(clusterUnit: PropertyUnit): TermOfPayment[] {
  void clusterUnit;
  return ["HARD_CASH", "TUNAI_BERTAHAP", "KPR_DP0"];
}
