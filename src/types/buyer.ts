export type Pekerjaan = "Karyawan" | "Pengusaha" | "Professional" | "Lainnya";

export interface BuyerProfile {
  nama: string;
  pekerjaan: Pekerjaan;
  usia: number;
}

export interface ValidationErrors {
  nama?: string;
  usia?: string;
  tenor?: string;
  sukuBunga?: string;
  unit?: string;
}

export function validateForm(input: {
  nama: string;
  usia: number | null;
  tenor: number;
  sukuBunga: number;
  unitId: string | null;
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

  if (input.tenor < 1 || input.tenor > 30) {
    errors.tenor = "Tenor KPR harus antara 1–30 tahun";
  }

  if (input.sukuBunga < 0.005 || input.sukuBunga > 0.1) {
    errors.sukuBunga = "Suku bunga harus antara 0,5%–10% p.a.";
  }

  if (!input.unitId) {
    errors.unit = "Pilih tipe & unit properti terlebih dahulu";
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}
