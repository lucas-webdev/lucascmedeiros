import type { Metadata } from "next";
import { FutebolApp } from "@/components/futebol/futebol-app";

export const metadata: Metadata = {
  title: "Futebol Onda BH",
  description: "Gestão de presença, times e estatísticas da pelada.",
  robots: { index: false, follow: false },
};

export default function FutebolPage() {
  return <FutebolApp />;
}
