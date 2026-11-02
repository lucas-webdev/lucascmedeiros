import type { Metadata, Viewport } from "next";
import { DespesasLetiApp } from "@/components/despesas-leti/despesas-leti-app";

export const metadata: Metadata = {
  title: "Leti · Gastos",
  description: "Fatura do cartão, parcelas e gastos do mês.",
  robots: { index: false, follow: false },
  manifest: "/despesas-leti/manifest.webmanifest?v=1",
  icons: {
    icon: "/despesas-leti/icon-192.png",
    apple: "/despesas-leti/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Leti Gastos",
  },
  // O Next só emite a meta genérica; o iOS ainda lê a com prefixo "apple-".
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf2f5" },
    { media: "(prefers-color-scheme: dark)", color: "#140a10" },
  ],
};

export default function DespesasLetiPage() {
  return <DespesasLetiApp />;
}
