# KPR Calculator Tool — Shaistanaya City

Aplikasi web interaktif untuk simulasi KPR (Kredit Pemilikan Rumah) cluster
**Montana** & **Sierra**, Shaistanaya City. Dibangun sesuai
`BRIEF_KPR_CALCULATOR_TOOL_LENGKAP.docx` — menggantikan proses manual buka
Excel setiap ada calon pembeli bertanya simulasi cicilan.

## Fitur

- **Form input bertahap** (Profil → Properti → Term & KPR) dengan validasi.
- **16 unit** pricelist resmi (9 tipe Montana + 7 tipe Sierra, termasuk unit
  special/double facade), auto-populate LB/LT/blok/harga.
- **3 skema Term of Payment**: Hard Cash 1 Bulan, Tunai Bertahap (6/9 bulan
  tanpa UM), dan KPR DP 0% — masing-masing dengan rumus diskon PPN DTP &
  anuitas sesuai `SIMULASI_PEMBAYARAN_SHAISTANAYA_CITY.xlsx`.
- **Live preview** hasil simulasi (6 section: Data Pembeli, Data Properti,
  Breakdown Harga, Term of Payment, KPR Breakdown, Ringkasan Cash Flow).
- **Export invoice PDF** profesional (logo, breakdown lengkap, T&C, rekening
  pembayaran) siap dibagikan ke calon pembeli.
- **Share** hasil simulasi via Web Share API / clipboard.
- **Dark / light mode** toggle.
- **Log simulasi ke Supabase** (opsional) — setiap simulasi yang dihitung
  tercatat sebagai lead untuk sales team, dan suku bunga default dapat
  diupdate tanpa redeploy.

## Tech Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4
- jsPDF + jspdf-autotable — generate invoice PDF di client
- Supabase (`@supabase/supabase-js`) — log simulasi & setting suku bunga
- Hosting: Vercel

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local   # isi dengan kredensial Supabase project Anda
npm run dev
```

Aplikasi tetap berfungsi penuh (semua kalkulasi berjalan di client) walau
`.env.local` tidak diisi — hanya fitur log simulasi & suku bunga dinamis dari
Supabase yang nonaktif dan fallback ke default 3,81% p.a.

## Struktur Perhitungan

Lihat `src/lib/kpr-calculator.ts` untuk implementasi rumus:

- **Diskon PPN DTP** = `ROUNDDOWN((basis × 11%) − 15.000.000, -6)`
- **Anuitas KPR**: `A = P × [r(1+r)^n] / [(1+r)^n − 1]`

Data pricelist ada di `src/lib/pricelist.ts` (harga, UTJ, T&C per cluster).

## Supabase Schema

Tabel `app_settings` (suku bunga default, dapat diupdate admin) dan
`simulations` (log setiap simulasi sebagai lead sales team). Lihat migration
di riwayat project Supabase — RLS: publik hanya bisa `insert` ke
`simulations` dan `select` ke `app_settings`.

## Deploy

Repo ini terhubung ke Vercel — push ke branch akan membuat Preview
Deployment, merge ke `main` akan deploy ke production. Environment variables
yang perlu di-set di Vercel: `NEXT_PUBLIC_SUPABASE_URL` &
`NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Catatan

Simulasi bersifat estimasi. Persetujuan KPR dan suku bunga final sepenuhnya
ditentukan oleh Bank pemberi KPR (sesuai Syarat & Ketentuan pricelist).

<!-- trigger redeploy: framework preset fixed to Next.js on Vercel -->

<!-- trigger production redeploy: bind default domain after project rename to hitungkprshaistanayacity -->
