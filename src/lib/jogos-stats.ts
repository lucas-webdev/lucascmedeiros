import { chaveLocal } from "./jogos-filtros";
import type { Partida } from "./jogos-types";

/**
 * Locais que contam como partida digital (comparados por `chaveLocal`, então
 * a grafia e os acentos não importam). Para incluir outra plataforma, basta
 * acrescentar o nome aqui.
 */
const LOCAIS_DIGITAIS = new Set(
  ["Board Game Arena", "BGA", "Online", "Tabletop Simulator"].map(chaveLocal)
);

export function ehPartidaDigital(partida: Partida): boolean {
  return LOCAIS_DIGITAIS.has(chaveLocal(partida.location));
}

export interface ResumoPartidas {
  /** Soma das quantidades: uma partida registrada com quantity=2 conta 2. */
  totalPartidas: number;
  /** Parte de `totalPartidas` jogada em plataformas digitais (mesma medida). */
  partidasDigitais: number;
  jogosDiferentes: number;
  /**
   * Parte de `jogosDiferentes` que só foi jogada em plataformas digitais:
   * nenhuma partida do jogo (dentro das partidas recebidas) foi em outro local.
   */
  jogosApenasDigitais: number;
}

export function resumir(partidas: Partida[]): ResumoPartidas {
  /** id do jogo → true se já houve alguma partida fora das plataformas digitais */
  const jogos = new Map<number, boolean>();
  let totalPartidas = 0;
  let partidasDigitais = 0;
  for (const partida of partidas) {
    totalPartidas += partida.quantity;
    const digital = ehPartidaDigital(partida);
    if (digital) partidasDigitais += partida.quantity;
    jogos.set(partida.game.id, (jogos.get(partida.game.id) ?? false) || !digital);
  }

  let jogosApenasDigitais = 0;
  for (const jogouForaDoDigital of jogos.values()) {
    if (!jogouForaDoDigital) jogosApenasDigitais++;
  }

  return {
    totalPartidas,
    partidasDigitais,
    jogosDiferentes: jogos.size,
    jogosApenasDigitais,
  };
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
