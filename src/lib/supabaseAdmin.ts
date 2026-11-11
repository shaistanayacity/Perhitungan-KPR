import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Klien Supabase khusus server (service role) — BISA baca tabel `simulations`
// walau RLS cuma mengizinkan INSERT untuk anon (lihat leadsAuth.ts & halaman
// /leads). Jangan pernah diimpor dari komponen client — kuncinya full-access,
// beda dari anon key di supabaseClient.ts yang aman dipakai di browser.
export const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;
