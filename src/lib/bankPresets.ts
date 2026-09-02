// Preset suku bunga KPR berjenjang dari bank — HANYA dari sumber resmi
// (halaman promo bank itu sendiri), bukan artikel comparison pihak ketiga
// yang angkanya sering tidak konsisten. Selalu tampilkan sebagai starting
// point yang bisa diedit, bukan angka final — rate promo bank berubah
// sewaktu-waktu, konfirmasi ke bank sebelum dipakai untuk penawaran resmi.

export interface BankPreset {
  id: string;
  label: string;
  tierPertama: { durasiTahun: number; sukuBunga: number };
  sumber: string;
  diperbaruiPer: string; // tanggal data diambil, bukan tanggal berlaku promo
}

export const BANK_PRESETS: BankPreset[] = [
  {
    id: "btn-3th",
    label: "BTN — Fixed 3 Tahun 2,65%",
    tierPertama: { durasiTahun: 3, sukuBunga: 0.0265 },
    sumber: "https://www.btn.co.id/id/promotion/promotion-list/promo-list/2026/01/06/promo-suku-bunga-kpr-pos-festival-2026",
    diperbaruiPer: "September 2026",
  },
  {
    id: "bri-1th",
    label: "BRI — Fixed 1 Tahun 1,75%",
    tierPertama: { durasiTahun: 1, sukuBunga: 0.0175 },
    sumber: "https://bri.co.id/web/guest/promo-detail/1599",
    diperbaruiPer: "September 2026",
  },
];
