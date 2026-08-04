import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--fonte-display" });
const corpo = Inter({ subsets: ["latin"], variable: "--fonte-corpo" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500", "700"], variable: "--fonte-mono" });

export const metadata: Metadata = {
  title: "Minha Ficha Fitness",
  description: "Ficha de treino, carga, descanso e evolução no bolso.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Ficha Fitness" },
};

export const viewport: Viewport = {
  themeColor: "#E23A2E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-tema="escuro" className={`${display.variable} ${corpo.variable} ${mono.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
