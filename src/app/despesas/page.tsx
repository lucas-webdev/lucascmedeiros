import type { Metadata, Viewport } from "next";
import { DespesasApp } from "@/components/despesas/despesas-app";

export const metadata: Metadata = {
  title: "Despesas",
  description: "Controle de gastos do mês em tempo real.",
  robots: { index: false, follow: false },
  manifest: "/despesas/manifest.webmanifest?v=1",
  icons: {
    icon: "/despesas/icon-192.png",
    apple: "/despesas/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Despesas",
  },
  // O Next só emite a meta genérica; o iOS ainda lê a com prefixo "apple-".
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f17" },
  ],
};

export default function DespesasPage() {
  return <DespesasApp />;
}
