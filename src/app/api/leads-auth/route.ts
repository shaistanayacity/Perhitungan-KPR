import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  LEADS_SESSION_COOKIE,
  SESSION_COOKIE_MAX_AGE,
  createSessionToken,
  isLeadsDashboardConfigured,
  verifyPasscode,
} from "@/lib/leadsAuth";

export async function POST(request: NextRequest) {
  if (!isLeadsDashboardConfigured()) {
    return NextResponse.json(
      { error: "Dashboard leads belum dikonfigurasi (LEADS_DASHBOARD_PASSWORD kosong)." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const passcode = typeof body?.passcode === "string" ? body.passcode : "";

  if (!passcode || !verifyPasscode(passcode)) {
    return NextResponse.json({ error: "Passcode salah." }, { status: 401 });
  }

  const token = createSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Gagal membuat sesi." }, { status: 500 });
  }

  const cookieStore = await cookies();
  cookieStore.set(LEADS_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(LEADS_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
