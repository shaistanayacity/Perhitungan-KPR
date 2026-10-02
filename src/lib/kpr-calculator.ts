// Calculation engine — KPR Calculator Tool Shaistanaya City
// Formula & aturan diambil dari BRIEF_KPR_CALCULATOR_TOOL_LENGKAP.docx §3.2 & §7,
// direvisi sesuai instruksi "Revisi TOOLS" (basis harga jadi Harga Jual + Diskon
// PPN DTP dihitung live, bukan lagi angka jadi di pricelist).
//
// Basis harga sekarang selalu "Harga Jual" (= unit.hargaAsli, harga list resmi
// sebelum diskon apapun). Diskon PPN DTP dihitung live dari rumus insentif
// pemerintah (bukan lagi kolom "Harga Properti (KPR)" siap pakai di pricelist).

import { PropertyUnit, UTJ_BY_CLUSTER } from "./pricelist";
import { formatRupiah } from "./format";

export type TermOfPayment = "HARD_CASH" | "TUNAI_BERTAHAP" | "KPR";

export const TERM_LABELS: Record<TermOfPayment, string> = {
  HARD_CASH: "Hard Cash 1 Bulan",
  TUNAI_BERTAHAP: "Tunai Bertahap 6 Bulan (Tanpa UM)",
  KPR: "KPR",
};

export function getTermLabel(term: TermOfPayment): string {
  return TERM_LABELS[term];
}

export type KprMode = "FIX" | "BERJENJANG";

export const KPR_MODE_LABELS: Record<KprMode, string> = {
  FIX: "KPR Fix",
  BERJENJANG: "KPR Berjenjang",
};

export interface KprTierInput {
  /** Durasi tier ini dalam tahun, diisi manual — bukan otomatis mengisi sisa tenor. */
  durasiTahun: number;
  /** Suku bunga p.a. desimal untuk tier ini (mis. 0.03 = 3%). */
  sukuBunga: number;
}

export interface KprTierResult {
  tierKe: number;
  tahunMulai: number;
  tahunSelesai: number;
  sukuBunga: number;
  angsuranBulanan: number;
  bulanMulai: number;
  bulanSelesai: number;
}

/** Sisa tahun tenor yang tidak dialokasikan ke tier manapun — bunga & angsurannya
 * "mengikuti suku bunga bank" (floating), jadi TIDAK dihitung angka pastinya. */
export interface KprFloatingTail {
  tahunMulai: number;
  tahunSelesai: number;
  bulanMulai: number;
  bulanSelesai: number;
}

/** Baris tampilan KPR Breakdown — turunan dari KprTierResult, tapi tier pertama
 * dipecah jadi 2 baris kalau durasinya lebih panjang dari masa subsidi Angsuran
 * OctoBoo! (6 bulan), supaya subsidi TIDAK terlihat berlaku untuk seluruh tier
 * (mis. 3 tahun) padahal aslinya cuma 6 bulan pertama. `labelBulan` true berarti
 * baris ini hasil pemotongan tier (tampilkan rentang "Bulan X–Y"), bukan tahun
 * penuh — dipakai di web (ResultsPanel) & invoice PDF. */
export interface KprDisplayRow {
  tierKe: number;
  tahunMulai: number;
  tahunSelesai: number;
  bulanMulai: number;
  bulanSelesai: number;
  sukuBunga: number;
  angsuranBulanan: number;
  disubsidi: boolean;
  labelBulan: boolean;
}

export function buildKprDisplayRows(tierBreakdown: KprTierResult[], subsidiBulan: number): KprDisplayRow[] {
  if (subsidiBulan <= 0) {
    return tierBreakdown.map((t) => ({ ...t, disubsidi: false, labelBulan: false }));
  }
  const rows: KprDisplayRow[] = [];
  for (const t of tierBreakdown) {
    const tierDurasiBulan = t.bulanSelesai - t.bulanMulai + 1;
    const overlapEnd = Math.min(t.bulanSelesai, subsidiBulan);
    const overlapBulan = overlapEnd - t.bulanMulai + 1;

    if (overlapBulan <= 0) {
      rows.push({ ...t, disubsidi: false, labelBulan: false });
    } else if (overlapBulan >= tierDurasiBulan) {
      rows.push({ ...t, disubsidi: true, labelBulan: false });
    } else {
      rows.push({
        ...t,
        bulanSelesai: overlapEnd,
        tahunSelesai: Math.ceil(overlapEnd / 12),
        disubsidi: true,
        labelBulan: true,
      });
      rows.push({
        ...t,
        bulanMulai: overlapEnd + 1,
        tahunMulai: Math.floor(overlapEnd / 12) + 1,
        disubsidi: false,
        labelBulan: true,
      });
    }
  }
  return rows;
}

export interface CalculatorInput {
  unit: PropertyUnit;
  term: TermOfPayment;
  diskonCustom?: number; // opsional, default 0 — "diskon khusus untuk case tertentu"
  tenorBertahapBulan?: number; // khusus TUNAI_BERTAHAP — diisi manual
  tenorTahun?: number; // 1-30, khusus KPR
  dpPercent?: number; // 0-0.9, khusus KPR
  kprMode?: KprMode; // khusus KPR
  tiers?: KprTierInput[]; // khusus KPR — minimal 1 elemen, sisanya (bila ada) jadi floating
}

export interface CashFlowMilestone {
  hari: string; // label waktu, mis. "Hari ke-1"
  keterangan: string;
  nominal: number;
}

export interface CalculationResult {
  // §Breakdown Harga
  hargaJual: number;
  diskonTunaiKeras: number; // khusus Hard Cash, 0 untuk term lain
  diskonCustom: number;
  diskonPpnDtp: number;
  hargaSetelahDiskon: number; // "Harga Transaksi" — UTJ TIDAK dikurangkan di sini, supaya
  // tidak kelihatan dipotong dua kali (UTJ sudah tampil sebagai baris tersendiri di
  // Term of Payment, dan sisaPelunasan/pokokKpr di bawah sudah benar memperhitungkannya).

  // §Term of Payment
  utj: number;
  uangMuka: number;
  tenorBertahapBulan: number | null; // untuk Tunai Bertahap
  cicilanBulanan: number | null; // untuk Tunai Bertahap
  sisaPelunasan: number;

  // §KPR Breakdown — null jika term bukan KPR
  pokokKpr: number | null;
  tenorKprTahun: number | null;
  kprMode: KprMode | null;
  tierBreakdown: KprTierResult[] | null;
  tierDisplayRows: KprDisplayRow[] | null; // tierBreakdown yang sudah dipecah per batas subsidi, dipakai utk render tabel
  floatingTail: KprFloatingTail | null;
  angsuranAwalKpr: number | null; // angsuran tier pertama, untuk ringkasan header

  // §Promo "OctoBoo!" (Oktober 2026 saja) — subsidi angsuran/cicilan bulanan
  // Rp1.000.000 selama 6 bulan pertama, khusus Tunai Bertahap & KPR. Nilai asli
  // (cicilanBulanan/angsuranAwalKpr di atas) TIDAK diubah — field di bawah ini
  // cuma lapisan tampilan promo, supaya cash flow & angka KPR tetap akurat.
  promoSubsidiAngsuranAktif: boolean;
  subsidiAngsuranNominal: number; // 0 kalau promo nonaktif
  subsidiAngsuranBulan: number; // 0 kalau promo nonaktif, else 6
  cicilanBulananSetelahSubsidi: number | null;
  angsuranAwalKprSetelahSubsidi: number | null;

  // §Cash flow timeline
  cashFlow: CashFlowMilestone[];
}

/** Diskon PPN DTP (insentif pemerintah) — rumus resmi, hasil akhir saja yang
 * ditampilkan ke dashboard/invoice, bukan langkah rumusnya:
 * ((Harga Jual − diskon lain) / 1,16) × 11% − 15.000.000
 * (Catatan: versi awal rumus ini sempat menambahkan +Rp4.000.000 sebelum dibagi
 * 1,16 — ternyata itu bukan bagian dari rumus resminya dan sudah dihapus.)
 * Hasil akhir dibulatkan ke bawah ke kelipatan Rp1.000.000 terdekat (mis.
 * Rp60.672.413 → Rp60.000.000), sesuai konvensi pembulatan insentif ini —
 * KECUALI unit yang ditandai `roundPpnDtp: true` di pricelist.ts, yang datanya
 * resmi dibulatkan ke TERDEKAT (bukan ke bawah). Ini pengecualian per unit,
 * bukan aturan global. */
function hitungDiskonPpnDtp(hargaSetelahDiskonLain: number, roundPpnDtp = false): number {
  const nilai = (hargaSetelahDiskonLain / 1.16) * 0.11 - 15_000_000;
  const pembulatan = roundPpnDtp ? Math.round : Math.floor;
  return Math.max(0, pembulatan(nilai / 1_000_000) * 1_000_000);
}

// ---- Promo "OctoBoo!" — khusus bulan Oktober 2026 ----
// Rumus Diskon PPN DTP di atas TETAP ADA dan dipakai lagi otomatis begitu
// promo berakhir (atau untuk unit yang tidak ikut promo) — tidak dihapus.
const OCTOBOO_PROMO_TAHUN = 2026;
const OCTOBOO_PROMO_BULAN = 9; // Oktober, 0-indexed (sesuai Date#getMonth())
const OCTOBOO_SUBSIDI_ANGSURAN_NOMINAL = 1_000_000;
const OCTOBOO_SUBSIDI_ANGSURAN_BULAN = 6;

export function isOctoBooPromoActive(date: Date = new Date()): boolean {
  return date.getFullYear() === OCTOBOO_PROMO_TAHUN && date.getMonth() === OCTOBOO_PROMO_BULAN;
}

/** Label baris diskon di hasil/invoice — "Diskon Harga" selama promo OctoBoo!
 * aktif (menggantikan "Diskon PPN DTP"), berlaku untuk SEMUA unit di bulan itu
 * biar konsisten, walau nominalnya sendiri cuma di-override untuk unit yang
 * ikut promo (lihat hitungDiskonHarga). */
export function getDiskonHargaLabel(date: Date = new Date()): string {
  return isOctoBooPromoActive(date) ? "Diskon Harga" : "Diskon PPN DTP";
}

/** Diskon PPN DTP / Diskon Harga — selama promo OctoBoo! aktif DAN unit ini
 * ikut promo (unit.promoOctoBooDiskonHarga terisi), nominalnya flat dari
 * pricelist, menggantikan rumus di atas sepenuhnya (berlaku sama di Hard Cash,
 * Tunai Bertahap, maupun KPR). Unit yang tidak ikut promo (mis. GWEN HOOK,
 * NEW GWEN HOOK) tetap pakai hitungDiskonPpnDtp seperti biasa. */
function hitungDiskonHarga(unit: PropertyUnit, hargaSetelahDiskonLain: number): number {
  if (isOctoBooPromoActive() && unit.promoOctoBooDiskonHarga !== undefined) {
    return unit.promoOctoBooDiskonHarga;
  }
  return hitungDiskonPpnDtp(hargaSetelahDiskonLain, unit.roundPpnDtp);
}

/** Harga setelah diskon (Diskon Khusus + PPN DTP) untuk skema KPR — basis yang
 * dipakai `calculateSimulation` untuk menghitung Uang Muka (`uangMuka = ini ×
 * dpPercent`), BUKAN Harga Jual mentah. Diekspos supaya form (field DP Nominal)
 * bisa mengonversi nominal↔persen pakai basis yang SAMA dengan hasil akhir —
 * kalau dikonversi dari Harga Jual, nominal yang diketik user tidak akan pas
 * dengan Uang Muka yang muncul di invoice (karena sudah beda basis). */
export function hitungHargaSetelahDiskonKpr(unit: PropertyUnit, diskonCustom: number): number {
  const hargaJual = unit.hargaAsli;
  const dc = Math.max(0, diskonCustom);
  const diskonPpnDtp = hitungDiskonHarga(unit, hargaJual - dc);
  return hargaJual - dc - diskonPpnDtp;
}

/** Susun tier eksplisit (dalam bulan) — TIDAK auto-mengisi sisa tenor ke tier
 * terakhir seperti versi lama. Kalau total durasi tier < tenor, sisanya jadi
 * floating tail (dikembalikan terpisah oleh pemanggil). */
function susunTierBulan(tiers: KprTierInput[], totalBulan: number): { durasiBulan: number; sukuBunga: number }[] {
  const hasil: { durasiBulan: number; sukuBunga: number }[] = [];
  let terpakai = 0;
  for (const t of tiers) {
    const sisa = totalBulan - terpakai;
    if (sisa <= 0) break;
    const durasiBulan = Math.min(Math.round(t.durasiTahun * 12), sisa);
    if (durasiBulan <= 0) continue;
    hasil.push({ durasiBulan, sukuBunga: t.sukuBunga });
    terpakai += durasiBulan;
  }
  return hasil;
}

/** Reamortisasi step-rate: tiap ganti tier, angsuran dihitung ulang dari sisa
 * pokok, direamortisasi ke SISA TENOR TOTAL (bukan cuma durasi tier) — praktik
 * standar bank (fixed period lanjut ke floating, bukan restart). Tahun-tahun
 * yang tidak dialokasikan ke tier manapun dikembalikan sebagai floating tail
 * TANPA angka angsuran (rate floating tidak diketahui di muka). */
function hitungTierBunga(
  pokok: number,
  tenorTahun: number,
  tiers: KprTierInput[]
): { tierBreakdown: KprTierResult[]; floatingTail: KprFloatingTail | null } {
  const totalBulan = Math.round(tenorTahun * 12);
  const effTiers = susunTierBulan(tiers, totalBulan);
  const hasil: KprTierResult[] = [];
  let balance = pokok;
  let bulanElapsed = 0;

  effTiers.forEach((tier, i) => {
    const sisaBulanTotal = totalBulan - bulanElapsed;
    const r = tier.sukuBunga / 12;
    const angsuran =
      r === 0
        ? balance / sisaBulanTotal
        : (balance * r * Math.pow(1 + r, sisaBulanTotal)) / (Math.pow(1 + r, sisaBulanTotal) - 1);

    hasil.push({
      tierKe: i + 1,
      tahunMulai: Math.floor(bulanElapsed / 12) + 1,
      tahunSelesai: Math.ceil((bulanElapsed + tier.durasiBulan) / 12),
      sukuBunga: tier.sukuBunga,
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

  const floatingTail: KprFloatingTail | null =
    bulanElapsed < totalBulan
      ? {
          bulanMulai: bulanElapsed + 1,
          bulanSelesai: totalBulan,
          tahunMulai: Math.floor(bulanElapsed / 12) + 1,
          tahunSelesai: tenorTahun,
        }
      : null;

  return { tierBreakdown: hasil, floatingTail };
}

export function calculateSimulation(input: CalculatorInput): CalculationResult {
  const { unit, term } = input;
  const diskonCustom = Math.max(0, input.diskonCustom ?? 0);
  const hargaJual = unit.hargaAsli;
  const utj = UTJ_BY_CLUSTER[unit.cluster];
  const cashFlow: CashFlowMilestone[] = [];

  if (term === "HARD_CASH") {
    const diskonTunaiKeras = hargaJual * 0.05;
    const diskonPpnDtp = hitungDiskonHarga(unit, hargaJual - diskonTunaiKeras - diskonCustom);
    const hargaSetelahDiskon = hargaJual - diskonTunaiKeras - diskonCustom - diskonPpnDtp;
    // Uang Muka 80% dihitung dari Harga Jual (harga list), BUKAN dari harga setelah diskon.
    const uangMuka80 = hargaJual * 0.8;
    const sisaPelunasan = hargaSetelahDiskon - utj - uangMuka80;

    cashFlow.push(
      { hari: "Hari ke-1", keterangan: "Uang Tanda Jadi (UTJ)", nominal: utj },
      { hari: "Hari ke-30 (maks.)", keterangan: "Uang Muka 80%", nominal: uangMuka80 },
      { hari: "Saat AJB Notaris", keterangan: "Sisa Pelunasan", nominal: sisaPelunasan }
    );

    return {
      hargaJual,
      diskonTunaiKeras,
      diskonCustom,
      diskonPpnDtp,
      hargaSetelahDiskon,
      utj,
      uangMuka: uangMuka80,
      tenorBertahapBulan: null,
      cicilanBulanan: null,
      sisaPelunasan,
      pokokKpr: null,
      tenorKprTahun: null,
      kprMode: null,
      tierBreakdown: null,
      tierDisplayRows: null,
      floatingTail: null,
      angsuranAwalKpr: null,
      promoSubsidiAngsuranAktif: false,
      subsidiAngsuranNominal: 0,
      subsidiAngsuranBulan: 0,
      cicilanBulananSetelahSubsidi: null,
      angsuranAwalKprSetelahSubsidi: null,
      cashFlow,
    };
  }

  if (term === "TUNAI_BERTAHAP") {
    const diskonPpnDtp = hitungDiskonHarga(unit, hargaJual - diskonCustom);
    const hargaSetelahDiskon = hargaJual - diskonCustom - diskonPpnDtp;
    const tenorBulan = Math.max(1, Math.round(input.tenorBertahapBulan ?? 6));
    const sisaPelunasan = hargaSetelahDiskon - utj;
    // Cicilan rutin (angsuran ke-1 s/d ke-(N-1)) = Harga Jual dibagi rata tenor — angka
    // bulat yang gampang dikomunikasikan. Angsuran terakhir (pelunasan) adalah SISANYA,
    // menyesuaikan supaya totalnya tetap pas dengan sisaPelunasan (yang sudah
    // memperhitungkan diskon & UTJ).
    const cicilanBulanan = hargaJual / tenorBulan;
    const angsuranTerakhir = sisaPelunasan - cicilanBulanan * (tenorBulan - 1);

    // Baris cash flow dirangkum jadi rentang (mis. "Angsuran ke-1 s/d ke-5" + pelunasan)
    // mengikuti konvensi pricelist, bukan satu baris per bulan — supaya invoice tetap
    // ringkas walau tenornya panjang.
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
      nominal: angsuranTerakhir,
    });

    const promoSubsidiAngsuranAktifTb = isOctoBooPromoActive();

    return {
      hargaJual,
      diskonTunaiKeras: 0,
      diskonCustom,
      diskonPpnDtp,
      hargaSetelahDiskon,
      utj,
      uangMuka: 0,
      tenorBertahapBulan: tenorBulan,
      cicilanBulanan,
      sisaPelunasan,
      pokokKpr: null,
      tenorKprTahun: null,
      kprMode: null,
      tierBreakdown: null,
      tierDisplayRows: null,
      floatingTail: null,
      angsuranAwalKpr: null,
      promoSubsidiAngsuranAktif: promoSubsidiAngsuranAktifTb,
      subsidiAngsuranNominal: promoSubsidiAngsuranAktifTb ? OCTOBOO_SUBSIDI_ANGSURAN_NOMINAL : 0,
      subsidiAngsuranBulan: promoSubsidiAngsuranAktifTb ? OCTOBOO_SUBSIDI_ANGSURAN_BULAN : 0,
      cicilanBulananSetelahSubsidi: promoSubsidiAngsuranAktifTb
        ? Math.max(0, cicilanBulanan - OCTOBOO_SUBSIDI_ANGSURAN_NOMINAL)
        : null,
      angsuranAwalKprSetelahSubsidi: null,
      cashFlow,
    };
  }

  // KPR (Fix atau Berjenjang)
  const tenorTahun = input.tenorTahun ?? 20;
  const dpPercent = Math.min(Math.max(input.dpPercent ?? 0, 0), 0.9);
  const kprMode: KprMode = input.kprMode ?? "FIX";
  const diskonPpnDtp = hitungDiskonHarga(unit, hargaJual - diskonCustom);
  const hargaSetelahDiskon = hargaJual - diskonCustom - diskonPpnDtp;
  const uangMuka = hargaSetelahDiskon * dpPercent;
  const pokokKpr = hargaSetelahDiskon - utj - uangMuka;

  const defaultTiers: KprTierInput[] = [{ durasiTahun: Math.min(2, tenorTahun), sukuBunga: 0.03 }];
  const tiers = input.tiers && input.tiers.length > 0 ? input.tiers : defaultTiers;
  const { tierBreakdown, floatingTail } = hitungTierBunga(pokokKpr, tenorTahun, tiers);
  const angsuranAwal = tierBreakdown[0]?.angsuranBulanan ?? 0;

  cashFlow.push({ hari: "Hari ke-1", keterangan: "Uang Tanda Jadi (UTJ)", nominal: utj });
  if (uangMuka > 0) {
    cashFlow.push({
      hari: "Hari ke-30 (maks.)",
      keterangan: `Uang Muka (${(dpPercent * 100).toFixed(0)}%)`,
      nominal: uangMuka,
    });
  }
  cashFlow.push({ hari: "Hari ke-60 (maks.)", keterangan: "Permohonan KPR disetujui (Pokok KPR)", nominal: pokokKpr });
  tierBreakdown.forEach((t) => {
    cashFlow.push({
      hari: `Bulan ke-${t.bulanMulai} s/d ke-${t.bulanSelesai}`,
      keterangan: `Angsuran Tahun ${t.tahunMulai}-${t.tahunSelesai} (bunga ${(t.sukuBunga * 100).toFixed(2)}%) — ${formatRupiah(t.angsuranBulanan)}/bulan`,
      nominal: t.angsuranBulanan,
    });
  });
  if (floatingTail) {
    cashFlow.push({
      hari: `Bulan ke-${floatingTail.bulanMulai} s/d ke-${floatingTail.bulanSelesai}`,
      keterangan: `Angsuran Tahun ${floatingTail.tahunMulai}-${floatingTail.tahunSelesai} — Floating, mengikuti suku bunga bank`,
      nominal: 0,
    });
  }

  const promoSubsidiAngsuranAktifKpr = isOctoBooPromoActive();
  const tierDisplayRows = buildKprDisplayRows(
    tierBreakdown,
    promoSubsidiAngsuranAktifKpr ? OCTOBOO_SUBSIDI_ANGSURAN_BULAN : 0
  );

  return {
    hargaJual,
    diskonTunaiKeras: 0,
    diskonCustom,
    diskonPpnDtp,
    hargaSetelahDiskon,
    utj,
    uangMuka,
    tenorBertahapBulan: null,
    cicilanBulanan: null,
    sisaPelunasan: pokokKpr,
    pokokKpr,
    tenorKprTahun: tenorTahun,
    kprMode,
    tierBreakdown,
    tierDisplayRows,
    floatingTail,
    angsuranAwalKpr: angsuranAwal,
    promoSubsidiAngsuranAktif: promoSubsidiAngsuranAktifKpr,
    subsidiAngsuranNominal: promoSubsidiAngsuranAktifKpr ? OCTOBOO_SUBSIDI_ANGSURAN_NOMINAL : 0,
    subsidiAngsuranBulan: promoSubsidiAngsuranAktifKpr ? OCTOBOO_SUBSIDI_ANGSURAN_BULAN : 0,
    cicilanBulananSetelahSubsidi: null,
    angsuranAwalKprSetelahSubsidi: promoSubsidiAngsuranAktifKpr
      ? Math.max(0, angsuranAwal - OCTOBOO_SUBSIDI_ANGSURAN_NOMINAL)
      : null,
    cashFlow,
  };
}

export function availableTermsForUnit(clusterUnit: PropertyUnit): TermOfPayment[] {
  void clusterUnit;
  return ["HARD_CASH", "TUNAI_BERTAHAP", "KPR"];
}

/** Preview ringan (level tahun, bukan bulan) untuk ditampilkan di form saat
 * user masih mengisi tier — dipakai TierEditor supaya user langsung lihat
 * rentang tahun & mana yang bakal jadi floating, tanpa perlu klik "Hitung". */
export function previewTierYearRanges(
  tiers: KprTierInput[],
  tenorTahun: number
): { tahunMulai: number; tahunSelesai: number; sukuBunga: number }[] {
  const ranges: { tahunMulai: number; tahunSelesai: number; sukuBunga: number }[] = [];
  let used = 0;
  for (const t of tiers) {
    const sisa = tenorTahun - used;
    if (sisa <= 0) break;
    const durasi = Math.min(Math.max(t.durasiTahun, 0), sisa);
    if (durasi <= 0) continue;
    ranges.push({ tahunMulai: used + 1, tahunSelesai: used + durasi, sukuBunga: t.sukuBunga });
    used += durasi;
  }
  return ranges;
}

export function previewFloatingTailYears(
  tiers: KprTierInput[],
  tenorTahun: number
): { tahunMulai: number; tahunSelesai: number } | null {
  const used = previewTierYearRanges(tiers, tenorTahun).reduce(
    (max, r) => Math.max(max, r.tahunSelesai),
    0
  );
  return used < tenorTahun ? { tahunMulai: used + 1, tahunSelesai: tenorTahun } : null;
}
