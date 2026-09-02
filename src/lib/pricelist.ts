// Data pricelist resmi Shaistanaya City — Periode September 2026
// Sumber: PRICELIST CLUSTER MONTANA & PRICELIST CLUSTER SIERRA (PL.pdf)
// serta BRIEF_KPR_CALCULATOR_TOOL_LENGKAP.docx §3.1

export type ClusterId = "MONTANA" | "SIERRA";

export interface PropertyUnit {
  id: string;
  cluster: ClusterId;
  tipe: string;
  lb: number; // Luas Bangunan (m2)
  lt: number; // Luas Tanah (m2)
  blok: string;
  noUnit: string;
  hargaAsli: number; // Harga jual asli/list price
  hargaKpr: number; // Harga Properti (KPR) — harga dasar untuk kalkulasi simulasi
  specialUnit?: boolean; // Unit "Special / Double Facade"
}

export const MONTANA_UNITS: PropertyUnit[] = [
  { id: "montana-gwen-f15-05", cluster: "MONTANA", tipe: "GWEN", lb: 38, lt: 72, blok: "F15", noUnit: "05", hargaAsli: 660_000_000, hargaKpr: 613_000_000 },
  { id: "montana-gwen-f12", cluster: "MONTANA", tipe: "GWEN", lb: 38, lt: 72, blok: "F12", noUnit: "02,05,07", hargaAsli: 660_000_000, hargaKpr: 613_000_000 },
  { id: "montana-newgwen-f3", cluster: "MONTANA", tipe: "NEW GWEN", lb: 42, lt: 72, blok: "F3", noUnit: "01-08", hargaAsli: 675_000_000, hargaKpr: 626_000_000 },
  { id: "montana-newgwen-f5", cluster: "MONTANA", tipe: "NEW GWEN", lb: 42, lt: 72, blok: "F5", noUnit: "02-07", hargaAsli: 675_000_000, hargaKpr: 626_000_000 },
  { id: "montana-darlene-f1", cluster: "MONTANA", tipe: "DARLENE", lb: 45, lt: 91, blok: "F1", noUnit: "05", hargaAsli: 795_000_000, hargaKpr: 735_000_000 },
  { id: "montana-gwenhook-f15", cluster: "MONTANA", tipe: "GWEN HOOK", lb: 38, lt: 106, blok: "F15", noUnit: "08", hargaAsli: 800_000_000, hargaKpr: 739_000_000, specialUnit: true },
  { id: "montana-newgwenhook-f5-01", cluster: "MONTANA", tipe: "NEW GWEN HOOK", lb: 42, lt: 106, blok: "F5", noUnit: "01", hargaAsli: 840_000_000, hargaKpr: 775_000_000, specialUnit: true },
  { id: "montana-newgwenhook-f5-08", cluster: "MONTANA", tipe: "NEW GWEN HOOK", lb: 45, lt: 112, blok: "F5", noUnit: "08", hargaAsli: 880_000_000, hargaKpr: 812_000_000, specialUnit: true },
  { id: "montana-angelinehook-f7", cluster: "MONTANA", tipe: "ANGELINE HOOK", lb: 45, lt: 133, blok: "F7", noUnit: "01", hargaAsli: 950_000_000, hargaKpr: 875_000_000, specialUnit: true },
];

export const SIERRA_UNITS: PropertyUnit[] = [
  { id: "sierra-bianca-garden-e3", cluster: "SIERRA", tipe: "BIANCA Garden", lb: 55, lt: 72, blok: "E3", noUnit: "02-06", hargaAsli: 840_000_000, hargaKpr: 776_000_000 },
  { id: "sierra-bianca-deluxe-e3", cluster: "SIERRA", tipe: "BIANCA Deluxe", lb: 65, lt: 72, blok: "E3", noUnit: "07-12", hargaAsli: 880_000_000, hargaKpr: 812_000_000 },
  { id: "sierra-arnica-garden-e1", cluster: "SIERRA", tipe: "ARNICA Garden", lb: 70, lt: 90, blok: "E1", noUnit: "01-05", hargaAsli: 990_000_000, hargaKpr: 912_000_000 },
  { id: "sierra-arnica-pool-e8", cluster: "SIERRA", tipe: "ARNICA Pool", lb: 70, lt: 90, blok: "E8", noUnit: "03-09", hargaAsli: 1_010_000_000, hargaKpr: 922_425_000 },
  { id: "sierra-bianca-deluxe-hook-e3-01", cluster: "SIERRA", tipe: "BIANCA Deluxe Hook", lb: 87, lt: 95.7, blok: "E3", noUnit: "01", hargaAsli: 1_150_000_000, hargaKpr: 1_056_000_000, specialUnit: true },
  { id: "sierra-arnica-garden-hook-e8-10", cluster: "SIERRA", tipe: "ARNICA Garden Hook", lb: 82, lt: 105.3, blok: "E8", noUnit: "10", hargaAsli: 1_155_000_000, hargaKpr: 1_061_000_000, specialUnit: true },
  { id: "sierra-arnica-pool-hook-e1-06", cluster: "SIERRA", tipe: "ARNICA Pool Hook", lb: 70, lt: 160, blok: "E1", noUnit: "06", hargaAsli: 1_350_000_000, hargaKpr: 1_237_000_000, specialUnit: true },
];

export const ALL_UNITS: PropertyUnit[] = [...MONTANA_UNITS, ...SIERRA_UNITS];

export const UNITS_BY_CLUSTER: Record<ClusterId, PropertyUnit[]> = {
  MONTANA: MONTANA_UNITS,
  SIERRA: SIERRA_UNITS,
};

export function getUniqueTypesForCluster(cluster: ClusterId): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of UNITS_BY_CLUSTER[cluster]) {
    if (!seen.has(u.tipe)) {
      seen.add(u.tipe);
      out.push(u.tipe);
    }
  }
  return out;
}

export function getUnitsForType(cluster: ClusterId, tipe: string): PropertyUnit[] {
  return UNITS_BY_CLUSTER[cluster].filter((u) => u.tipe === tipe);
}

export function getUnitById(id: string): PropertyUnit | undefined {
  return ALL_UNITS.find((u) => u.id === id);
}

// UTJ (Uang Tanda Jadi) per cluster — sesuai Syarat & Ketentuan pricelist
export const UTJ_BY_CLUSTER: Record<ClusterId, number> = {
  MONTANA: 5_000_000,
  SIERRA: 10_000_000,
};

// Tenor pembayaran bertahap (bulan) untuk skema "Tunai Bertahap Tanpa UM"
// Montana: 6 bulan untuk semua tipe.
// Sierra: 9 bulan untuk tipe BIANCA, 6 bulan untuk tipe ARNICA.
export function getBertahapTenorBulan(cluster: ClusterId, tipe: string): number {
  if (cluster === "MONTANA") return 6;
  return tipe.toUpperCase().startsWith("BIANCA") ? 9 : 6;
}

export const BANK_ACCOUNT = {
  bank: "BCA",
  nomor: "519 051 6999",
  atasNama: "NEO PUDJI JAYA, PT",
};

export const COMPANY_INFO = {
  name: "Shaistanaya City",
  headOffice: "Ruko Sun City Blok B-06/07, Jl. Pahlawan, Sidoarjo",
  marketingGallery: "Ruko Shaistanaya City Blok A-06, Jl. Sidodadi, Sidoarjo",
  periode: "September 2026",
};

export const TERMS_AND_CONDITIONS: Record<ClusterId, string[]> = {
  MONTANA: [
    "Uang Tanda Jadi (UTJ) sebesar Rp5.000.000,-",
    "Unit Tusuk Sate Diskon Rp10.000.000,-",
    "UTJ Refundable Bila Tidak Lolos BI Checking",
    "Dokumen Permohonan KPR dan tanda tangan maksimal 7 hari setelah UTJ",
    "Persetujuan KPR dan Suku Bunga KPR ditentukan oleh Bank pemberi KPR",
    "Pembayaran melalui BCA: 519 051 6999 a.n NEO PUDJI JAYA, PT",
  ],
  SIERRA: [
    "Uang Tanda Jadi (UTJ) sebesar Rp10.000.000,-",
    "Penambahan Private Pool untuk Tipe Arnica Rp170.000.000,-",
    "Unit Tusuk Sate Diskon Rp10.000.000,-",
    "UTJ Refundable Bila Tidak Lolos BI Checking",
    "Dokumen Permohonan KPR dan tanda tangan maksimal 7 hari setelah UTJ",
    "Persetujuan KPR dan Suku Bunga KPR ditentukan oleh Bank pemberi KPR",
    "Pembayaran melalui BCA: 519 051 6999 a.n NEO PUDJI JAYA, PT",
  ],
};
