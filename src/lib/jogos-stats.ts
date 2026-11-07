import type { Partida } from "./jogos-types";

export interface ResumoPartidas {
  /** Soma das quantidades: uma partida registrada com quantity=2 conta 2. */
  totalPartidas: number;
  jogosDiferentes: number;
}

export function resumir(partidas: Partida[]): ResumoPartidas {
  const jogos = new Set<number>();
  let totalPartidas = 0;
  for (const partida of partidas) {
    totalPartidas += partida.quantity;
    jogos.add(partida.game.id);
  }
  return { totalPartidas, jogosDiferentes: jogos.size };
}

/** "2026-10-30" → "30/10/2026" sem passar por Date (evita deslocamento de fuso). */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : iso;
}

export function formatarDuracao(minutos: number): string {
  if (minutos <= 0) return "";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
