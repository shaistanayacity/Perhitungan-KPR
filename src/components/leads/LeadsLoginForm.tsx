"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, TextInput, Button } from "@/components/ui";

export default function LeadsLoginForm() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Passcode salah.");
        return;
      }
      router.refresh();
    } catch {
      setError("Gagal menghubungi server, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <div>
        <p className="font-brand text-xl text-foreground">Leads — KPR Calculator</p>
        <p className="mt-1 text-sm text-foreground-muted">
          Masukkan passcode untuk melihat daftar peminat.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Passcode" htmlFor="passcode" error={error ?? undefined}>
          <TextInput
            id="passcode"
            type="password"
            autoFocus
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
          />
        </Field>
        <Button type="submit" disabled={loading || !passcode}>
          {loading ? "Memeriksa…" : "Masuk"}
        </Button>
      </form>
    </div>
  );
}
