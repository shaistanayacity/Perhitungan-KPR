"use client";

import { useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark"
  );

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      localStorage.setItem("kpr-theme", next ? "dark" : "light");
    } catch {
      // localStorage tidak tersedia — abaikan
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      suppressHydrationWarning
      className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground-muted transition hover:text-foreground"
    >
      <span aria-hidden suppressHydrationWarning>
        {isDark ? "☾" : "☀"}
      </span>
      <span suppressHydrationWarning>{isDark ? "Gelap" : "Terang"}</span>
    </button>
  );
}
