// Calculation engine — KPR Calculator Tool Shaistanaya City
// Formula & aturan diambil dari BRIEF_KPR_CALCULATOR_TOOL_LENGKAP.docx §3.2 & §7.
//
// Catatan penting: "Harga Properti (KPR)" di pricelist (unit.hargaKpr) SUDAH
// merupakan harga setelah PPN DTP dipotong dari Harga Asli (lihat kolom
// "DISKON PPN DTP" di PL.pdf) — jadi PPN DTP TIDAK dihitung ulang di sini.
// Diskon yang dihitung di engine ini hanya diskon spesifik per term
// (tunai keras 5% untuk Hard Cash, atau diskon pre-launching bila ada).

import { PropertyUnit, UTJ_BY_CLUSTER, getBertahapTenorBulan } from "./pricelist";
import { formatRupiah } from "./format";

export type TermOfPayment = "HARD_CASH" | "TUNAI_BERTAHAP" | "KPR_DP0" | "KPR_BERJENJANG";

export const TERM_LABELS: Record<TermOfPayment, string> = {
  HARD_CASH: "Hard Cash 1 Bulan",
  TUNAI_BERTAHAP: "Tunai Bertahap (Tanpa UM)",
  KPR_DP0: "KPR (DP Custom)",
  KPR_BERJENJANG: "KPR Berjenjang",
};

/** Label tampilan untuk skema KPR dengan DP custom — menyertakan besaran DP terpilih. */
export function getTermLabel(term: TermOfPayment, dpPercent = 0): string {
  if (term === "KPR_DP0") {
    return dpPercent > 0 ? `KPR DP ${(dpPercent * 100).toFixed(0)}%` : "KPR DP 0%";
  }
  return TERM_LABELS[term];
}

export type TierMode = "BUNGA" | "ANGSURAN";

export interface KprTierInput {
  /** Durasi tier dalam tahun. Diabaikan untuk tier terakhir (otomatis = sisa tenor). */
  durasiTahun: number;
  /** Mode BUNGA: suku bunga p.a. desimal (mis. 0.03 = 3%). Mode ANGSURAN: kenaikan angsuran
   * dari tier sebelumnya, desimal (mis. 0.05 = naik 5%) — diabaikan untuk tier pertama. */
  nilai: number;
}

export interface KprTierResult {
  tierKe: number;
  durasiTahun: number;
  nilai: number; // suku bunga (BUNGA) atau kenaikan % (ANGSURAN, 0 untuk tier pertama)
  angsuranBulanan: number;
  bulanMulai: number;
  bulanSelesai: number;
}

export interface CalculatorInput {
  unit: PropertyUnit;
  term: TermOfPayment;
  tenorTahun: number; // 1-30, dipakai untuk skema yang melibatkan KPR bank
  sukuBunga: number; // desimal p.a., mis. 0.03 = 3% — juga dipakai sbg rate tetap mode Angsuran Berjenjang
  diskonPreLaunching?: number; // opsional, default 0 (§3.2.B)
  dpPercent?: number; // 0-0.9, khusus skema KPR_DP0 / KPR_BERJENJANG — uang muka custom
  tierMode?: TierMode; // khusus KPR_BERJENJANG
  tiers?: KprTierInput[]; // khusus KPR_BERJENJANG — minimal 1 elemen
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
  angsuranBulananKpr: number | null; // untuk KPR_BERJENJANG: angsuran tier pertama
  totalBungaKpr: number | null;
  totalCicilanKpr: number | null;

  // Khusus KPR_BERJENJANG — null untuk term lain
  tierMode: TierMode | null;
  tierBreakdown: KprTierResult[] | null;

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

/** Susun daftar tier efektif (dalam bulan): tier terakhir otomatis mengambil sisa bulan,
 * tier-tier sebelumnya di-clamp supaya total tidak pernah melebihi tenor total. */
function susunTierBulan(tiers: KprTierInput[], totalBulan: number): { durasiBulan: number; nilai: number }[] {
  const hasil: { durasiBulan: number; nilai: number }[] = [];
  let terpakai = 0;
  const manual = tiers.slice(0, -1);
  const terakhir = tiers[tiers.length - 1];

  for (const t of manual) {
    const sisaUntukSisanya = totalBulan - terpakai - 1; // sisakan min. 1 bulan utk tier terakhir
    if (sisaUntukSisanya <= 0) break;
    const durasiBulan = Math.min(Math.round(t.durasiTahun * 12), sisaUntukSisanya);
    if (durasiBulan <= 0) continue;
    hasil.push({ durasiBulan, nilai: t.nilai });
    terpakai += durasiBulan;
  }

  const sisaBulan = totalBulan - terpakai;
  if (sisaBulan > 0) {
    hasil.push({ durasiBulan: sisaBulan, nilai: terakhir?.nilai ?? 0 });
  }
  return hasil;
}

/** Mode Bunga Berjenjang: tiap ganti tier, angsuran dihitung ulang dari sisa pokok,
 * direamortisasi ke SISA TENOR TOTAL (bukan cuma durasi tier) — praktik standar bank
 * step-rate mortgage (lih. contoh simulasi BCA: fixed tahun 1, lanjut bukan restart). */
function hitungTierBunga(pokok: number, tenorTahun: number, tiers: KprTierInput[]): KprTierResult[] {
  const totalBulan = Math.round(tenorTahun * 12);
  const effTiers = susunTierBulan(tiers, totalBulan);
  const hasil: KprTierResult[] = [];
  let balance = pokok;
  let bulanElapsed = 0;

  effTiers.forEach((tier, i) => {
    const sisaBulanTotal = totalBulan - bulanElapsed;
    const r = tier.nilai / 12;
    const angsuran =
      r === 0
        ? balance / sisaBulanTotal
        : (balance * r * Math.pow(1 + r, sisaBulanTotal)) / (Math.pow(1 + r, sisaBulanTotal) - 1);

    hasil.push({
      tierKe: i + 1,
      durasiTahun: tier.durasiBulan / 12,
      nilai: tier.nilai,
      angsuranBulanan: angsuran,
      bulanMulai: bulanElapsed + 1,
      bulanSelesai: bulanElapsed + tier.durasiBulan,
    });

    // majukan saldo sepanjang durasi tier ini dengan angsuran & rate tier ini
    if (r === 0) {
      balance -= angsuran * tier.durasiBulan;
    } else {
      const factor = Math.pow(1 + r, tier.durasiBulan);
      balance = balance * factor - (angsuran * (factor - 1)) / r;
    }
    bulanElapsed += tier.durasiBulan;
  });

  return hasil;
}

/** Mode Angsuran Berjenjang: satu suku bunga tetap sepanjang tenor, angsuran naik per
 * tier sesuai persentase kenaikan. Angsuran tier pertama dihitung supaya pokok pas
 * lunas 0 tepat di akhir tenor — bukan diisi manual (Graduated Payment Mortgage). */
function hitungTierAngsuran(
  pokok: number,
  tenorTahun: number,
  sukuBunga: number,
  tiers: KprTierInput[]
): KprTierResult[] {
  const totalBulan = Math.round(tenorTahun * 12);
  const r = sukuBunga / 12;
  const effTiers = susunTierBulan(tiers, totalBulan);

  // kalikan multiplier kumulatif tiap tier relatif terhadap angsuran tier pertama
  let mult = 1;
  const multPerTier = effTiers.map((tier, i) => {
    if (i > 0) mult *= 1 + tier.nilai;
    return mult;
  });

  // pokok*(1+r)^N = Σ angsuran_t * (1+r)^(N-t)  →  selesaikan angsuran tier pertama (P1)
  let denomSum = 0;
  let t = 0;
  effTiers.forEach((tier, i) => {
    for (let m = 0; m < tier.durasiBulan; m++) {
      t++;
      denomSum += multPerTier[i] * Math.pow(1 + r, totalBulan - t);
    }
  });
  const p1 = denomSum > 0 ? (pokok * Math.pow(1 + r, totalBulan)) / denomSum : 0;

  const hasil: KprTierResult[] = [];
  let bulanElapsed = 0;
  effTiers.forEach((tier, i) => {
    hasil.push({
      tierKe: i + 1,
      durasiTahun: tier.durasiBulan / 12,
      nilai: i === 0 ? 0 : tier.nilai,
      angsuranBulanan: p1 * multPerTier[i],
      bulanMulai: bulanElapsed + 1,
      bulanSelesai: bulanElapsed + tier.durasiBulan,
    });
    bulanElapsed += tier.durasiBulan;
  });
  return hasil;
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
      tierMode: null,
      tierBreakdown: null,
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
      tierMode: null,
      tierBreakdown: null,
      cashFlow,
    };
  }

  if (term === "KPR_BERJENJANG") {
    const dpPercent = Math.min(Math.max(input.dpPercent ?? 0, 0), 0.9);
    const hargaSetelahDiskon = harga - diskonPreLaunching;
    const uangMuka = harga * dpPercent;
    const pokokKpr = hargaSetelahDiskon - utj - uangMuka;
    const tierMode: TierMode = input.tierMode ?? "BUNGA";
    const tiers: KprTierInput[] =
      input.tiers && input.tiers.length > 0
        ? input.tiers
        : [{ durasiTahun: Math.min(2, tenorTahun), nilai: sukuBunga }, { durasiTahun: 0, nilai: sukuBunga }];

    const tierBreakdown =
      tierMode === "BUNGA"
        ? hitungTierBunga(pokokKpr, tenorTahun, tiers)
        : hitungTierAngsuran(pokokKpr, tenorTahun, sukuBunga, tiers);

    const angsuranAwal = tierBreakdown[0]?.angsuranBulanan ?? 0;
    const totalCicilan = tierBreakdown.reduce(
      (sum, t) => sum + t.angsuranBulanan * (t.bulanSelesai - t.bulanMulai + 1),
      0
    );

    cashFlow.push({ hari: "Hari ke-1", keterangan: "Uang Tanda Jadi (UTJ)", nominal: utj });
    if (uangMuka > 0) {
      cashFlow.push({ hari: "Hari ke-30 (maks.)", keterangan: `Uang Muka (${(dpPercent * 100).toFixed(0)}%)`, nominal: uangMuka });
    }
    cashFlow.push({ hari: "Hari ke-60 (maks.)", keterangan: "Permohonan KPR disetujui (Pokok KPR)", nominal: pokokKpr });
    tierBreakdown.forEach((t) => {
      const label =
        tierMode === "BUNGA"
          ? `Angsuran Tier ${t.tierKe} (bunga ${(t.nilai * 100).toFixed(2)}%)`
          : `Angsuran Tier ${t.tierKe}${t.tierKe > 1 ? ` (naik ${(t.nilai * 100).toFixed(0)}%)` : ""}`;
      cashFlow.push({
        hari: `Bulan ke-${t.bulanMulai} s/d ke-${t.bulanSelesai}`,
        keterangan: `${label} — ${formatRupiah(t.angsuranBulanan)}/bulan`,
        nominal: t.angsuranBulanan,
      });
    });
    cashFlow.push({ hari: "Saat AJB Notaris", keterangan: "Akad Kredit & Serah Terima", nominal: 0 });

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
      sukuBungaKpr: tierMode === "ANGSURAN" ? sukuBunga : (tierBreakdown[0]?.nilai ?? sukuBunga),
      angsuranBulananKpr: angsuranAwal,
      totalBungaKpr: totalCicilan - pokokKpr,
      totalCicilanKpr: totalCicilan,
      tierMode,
      tierBreakdown,
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
    tierMode: null,
    tierBreakdown: null,
    cashFlow,
  };
}

export function availableTermsForUnit(clusterUnit: PropertyUnit): TermOfPayment[] {
  void clusterUnit;
  return ["HARD_CASH", "TUNAI_BERTAHAP", "KPR_DP0", "KPR_BERJENJANG"];
}
