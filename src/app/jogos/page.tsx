import type { Metadata, Viewport } from "next";
import { JogosApp } from "@/components/jogos/jogos-app";

export const metadata: Metadata = {
  title: "Jogos",
  description: "Partidas de jogos de tabuleiro registradas no BoardGameGeek.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f17" },
  ],
};

export default function JogosPage() {
  return <JogosApp />;
}
