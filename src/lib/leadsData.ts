import { supabaseAdmin } from "./supabaseAdmin";

export interface LeadRow {
  id: string;
  created_at: string;
  nama: string;
  pekerjaan: string | null;
  usia: number | null;
  gaji: string | null;
  cluster: string;
  tipe: string;
  blok: string | null;
  no_unit: string | null;
  term_of_payment: string;
  harga_setelah_diskon: number | null;
  cicilan_bulanan: number | null;
  angsuran_bulanan_kpr: number | null;
  pokok_kpr: number | null;
}

const LEADS_COLUMNS =
  "id, created_at, nama, pekerjaan, usia, gaji, cluster, tipe, blok, no_unit, term_of_payment, harga_setelah_diskon, cicilan_bulanan, angsuran_bulanan_kpr, pokok_kpr";

/** Ambil daftar leads terbaru (hasil "Hitung Simulasi" di kalkulator publik),
 * lewat service role supaya tidak kena RLS (tabel `simulations` cuma punya
 * policy INSERT untuk anon, sengaja tidak ada SELECT publik). Kolom `result`
 * (jsonb lengkap) sengaja TIDAK diambil di sini — berat & tidak perlu untuk
 * daftar ringkas. */
export async function fetchRecentLeads(limit = 300): Promise<LeadRow[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("simulations")
    .select(LEADS_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as unknown as LeadRow[];
}

export function isLeadsDataConfigured(): boolean {
  return supabaseAdmin !== null;
}
