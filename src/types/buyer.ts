import { TermOfPayment } from "@/lib/kpr-calculator";

export interface BuyerProfile {
  nama: string;
  pekerjaan: string;
  usia: number;
  gaji: number | null;
}

export interface ValidationErrors {
  nama?: string;
  usia?: string;
  tenorKpr?: string;
  unit?: string;
}

export function validateForm(input: {
  nama: string;
  usia: number | null;
  unitId: string | null;
  term: TermOfPayment;
  tenorTahun: number;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!input.nama.trim()) {
    errors.nama = "Nama wajib diisi";
  }

  if (input.usia === null || Number.isNaN(input.usia)) {
    errors.usia = "Usia wajib diisi";
  } else if (input.usia < 21 || input.usia > 65) {
    errors.usia = "Usia harus antara 21–65 tahun";
  }

  if (!input.unitId) {
    errors.unit = "Pilih tipe & unit properti terlebih dahulu";
  }

  if (input.term === "KPR" && (input.tenorTahun < 1 || input.tenorTahun > 30)) {
    errors.tenorKpr = "Tenor KPR harus antara 1–30 tahun";
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}
