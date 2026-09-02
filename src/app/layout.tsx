import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "KPR Calculator — Shaistanaya City",
  description:
    "Simulasi KPR interaktif untuk cluster Montana & Sierra, Shaistanaya City. Hitung cicilan, uang muka, dan term of payment secara real-time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${cormorant.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          // Terapkan tema sebelum hydration agar tidak ada flash light/dark.
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('kpr-theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
