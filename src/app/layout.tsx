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

const TITLE = "KPR Calculator — Shaistanaya City";
const DESCRIPTION =
  "Simulasi KPR interaktif untuk cluster Montana & Sierra, Shaistanaya City. Hitung cicilan, uang muka, dan term of payment secara real-time.";

export const metadata: Metadata = {
  metadataBase: new URL("https://hitungkprshaistanayacity.vercel.app"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Shaistanaya City",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
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
