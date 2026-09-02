import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase bersifat opsional: kalkulator tetap berjalan penuh secara lokal
// (semua rumus dihitung di client) walau env var belum di-set — hanya fitur
// "log simulasi ke sales team" & "suku bunga default dari admin" yang nonaktif.
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const isSupabaseConfigured = Boolean(supabase);
