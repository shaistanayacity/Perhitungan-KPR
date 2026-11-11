import { cookies } from "next/headers";
import type { Metadata } from "next";
import { LEADS_SESSION_COOKIE, isLeadsDashboardConfigured, isSessionTokenValid } from "@/lib/leadsAuth";
import { fetchRecentLeads, isLeadsDataConfigured } from "@/lib/leadsData";
import LeadsLoginForm from "@/components/leads/LeadsLoginForm";
import LeadsTable from "@/components/leads/LeadsTable";

// Halaman internal (data leads calon pembeli) — jangan sampai terindeks mesin
// pencari, dan selalu dirender ulang per request (bukan cache statis) karena
// baca cookie sesi & query database langsung.
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  if (!isLeadsDashboardConfigured() || !isLeadsDataConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-2xl border border-border bg-surface p-6 text-sm text-foreground-muted">
          Dashboard leads belum dikonfigurasi. Tambahkan env var{" "}
          <code className="rounded bg-surface-muted px-1 py-0.5">LEADS_DASHBOARD_PASSWORD</code> dan{" "}
          <code className="rounded bg-surface-muted px-1 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code> di pengaturan
          project, lalu redeploy.
        </div>
      </main>
    );
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(LEADS_SESSION_COOKIE)?.value;
  const authed = isSessionTokenValid(session);

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <LeadsLoginForm />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-6 sm:p-10">
      <LeadsTable leads={await fetchRecentLeads()} />
    </main>
  );
}
