import type { Metadata, Viewport } from "next";
import { FutebolApp } from "@/components/futebol/futebol-app";

export const metadata: Metadata = {
  title: "Futebol Onda BH",
  description: "Gestão de presença, times e estatísticas da pelada.",
  robots: { index: false, follow: false },
  manifest: "/futebol-icons/manifest.webmanifest?v=2",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Futebol Onda",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A1240",
};

export default function FutebolPage() {
  return <FutebolApp />;
}
