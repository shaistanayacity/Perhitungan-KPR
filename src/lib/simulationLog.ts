import { supabase } from "./supabaseClient";
import { BuyerProfile } from "@/types/buyer";
import { PropertyUnit } from "./pricelist";
import { CalculationResult, TermOfPayment } from "./kpr-calculator";

const DEFAULT_SUKU_BUNGA = 0.03; // fallback jika Supabase tidak tersedia — samakan dengan asumsi rate pricelist (PL.pdf: "*Asumsi rate 3%")

/** Ambil suku bunga default terkini dari Supabase (dapat diupdate admin/sales
 * tanpa perlu redeploy aplikasi). Fallback ke default brief bila gagal. */
export async function fetchDefaultSukuBunga(): Promise<number> {
  if (!supabase) return DEFAULT_SUKU_BUNGA;
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "default_suku_bunga")
      .maybeSingle();
    if (error || !data) return DEFAULT_SUKU_BUNGA;
    const value = Number(data.value);
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_SUKU_BUNGA;
  } catch {
    return DEFAULT_SUKU_BUNGA;
  }
}

/** Catat setiap simulasi yang dihitung user sebagai lead untuk sales team
 * (brief §1.1). Best-effort: kegagalan tidak boleh mengganggu pengalaman user. */
export async function logSimulation(
  profile: BuyerProfile,
  unit: PropertyUnit,
  term: TermOfPayment,
  result: CalculationResult
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("simulations").insert({
      nama: profile.nama,
      pekerjaan: profile.pekerjaan,
      usia: profile.usia,
      kpr_aktif: profile.kprAktif,
      cluster: unit.cluster,
      tipe: unit.tipe,
      unit_id: unit.id,
      blok: unit.blok,
      no_unit: unit.noUnit,
      harga_asli: unit.hargaAsli,
      harga_kpr: unit.hargaKpr,
      term_of_payment: term,
      tenor_tahun: result.tenorKprTahun,
      suku_bunga: result.sukuBungaKpr,
      harga_setelah_diskon: result.hargaSetelahDiskon,
      utj: result.utj,
      uang_muka: result.uangMuka,
      cicilan_bulanan: result.cicilanBulanan,
      pokok_kpr: result.pokokKpr,
      angsuran_bulanan_kpr: result.angsuranBulananKpr,
      result,
    });
  } catch {
    // Diamkan — logging tidak boleh menghalangi preview/PDF export user.
  }
}

export { DEFAULT_SUKU_BUNGA };
