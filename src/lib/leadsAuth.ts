import { createHash, createHmac, timingSafeEqual } from "crypto";

// Gerbang akses halaman /leads — SATU passcode rahasia (env var
// LEADS_DASHBOARD_PASSWORD), BUKAN sistem akun/login. Sesi disimpan di cookie
// HttpOnly yang ditandatangani (HMAC) pakai passcode itu sendiri sebagai kunci,
// supaya tidak perlu secret terpisah lagi — siapa pun yang tidak tahu
// passcode-nya tidak bisa memalsukan cookie validnya sendiri.

export const LEADS_SESSION_COOKIE = "leads_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 hari

function hash(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/** Bandingkan dua string dengan waktu konstan (anti timing attack) — hash dulu
 * supaya panjang bufer selalu sama walau input beda panjang. */
export function safeCompare(a: string, b: string): boolean {
  return timingSafeEqual(hash(a), hash(b));
}

function getPasscode(): string | null {
  const passcode = process.env.LEADS_DASHBOARD_PASSWORD;
  return passcode && passcode.length > 0 ? passcode : null;
}

export function isLeadsDashboardConfigured(): boolean {
  return getPasscode() !== null;
}

export function verifyPasscode(input: string): boolean {
  const passcode = getPasscode();
  return passcode !== null && safeCompare(input, passcode);
}

/** Buat nilai cookie sesi: payload (expiry timestamp) + HMAC-nya, dipisah titik.
 * Bukan JWT library supaya tidak nambah dependency — formatnya sama simpel,
 * cukup untuk gerbang satu halaman internal ini. */
export function createSessionToken(): string | null {
  const passcode = getPasscode();
  if (!passcode) return null;
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = String(expiresAt);
  const signature = createHmac("sha256", passcode).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function isSessionTokenValid(token: string | undefined): boolean {
  if (!token) return false;
  const passcode = getPasscode();
  if (!passcode) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expectedSignature = createHmac("sha256", passcode).update(payload).digest("hex");
  if (!safeCompare(signature, expectedSignature)) return false;
  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && Date.now() < expiresAt;
}

export const SESSION_COOKIE_MAX_AGE = SESSION_MAX_AGE_SECONDS;
