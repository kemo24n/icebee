import "./globals.css";
import type { Metadata, Viewport } from "next";
import { getLang } from "@/lib/lang-server";
import { LangProvider } from "@/components/LangProvider";

export const metadata: Metadata = {
  title: "Ice Bee · آيس بي",
  description: "Ice Bee Aleppo – build your ice cream, order ahead, collect honey points.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Ice Bee", statusBarStyle: "black-translucent" },
};
export const viewport: Viewport = { themeColor: "#FF6B1A", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@400;500;600;700;800&family=Readex+Pro:wght@400;600&display=swap" />
      </head>
      <body>
        <LangProvider lang={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
