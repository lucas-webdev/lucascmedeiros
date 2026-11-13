import { chaveLocal } from "./jogos-filtros";
import type { Partida } from "./jogos-types";

/**
 * Locais que contam como partida digital (comparados por `chaveLocal`, então
 * a grafia e os acentos não importam). Para incluir outra plataforma, basta
 * acrescentar o nome aqui.
 */
export const NOMES_LOCAIS_DIGITAIS = [
  "Board Game Arena",
  "BGA",
  "Online",
  "Tabletop Simulator",
] as const;

const LOCAIS_DIGITAIS = new Set(NOMES_LOCAIS_DIGITAIS.map(chaveLocal));

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

export interface JogoApenasDigital {
  id: number;
  nome: string;
  /** Soma das quantidades das partidas do jogo. */
  partidas: number;
  /** YYYY-MM-DD da primeira e da última partida ("" se nenhuma tiver data). */
  primeira: string;
  ultima: string;
  /** Plataformas digitais em que o jogo foi jogado, como estão escritas no BGG. */
  locais: string[];
}

/**
 * Jogos cujas partidas (dentro das recebidas) aconteceram TODAS em plataformas
 * digitais — a mesma definição de `ResumoPartidas.jogosApenasDigitais`, então
 * a quantidade desta lista é sempre igual ao número mostrado no card. Ordena
 * do mais jogado para o menos jogado e, no empate, por nome.
 */
export function listarJogosApenasDigitais(
  partidas: Partida[]
): JogoApenasDigital[] {
  const jogos = new Map<
    number,
    {
      nome: string;
      partidas: number;
      primeira: string;
      ultima: string;
      locais: Map<string, string>;
      jogouForaDoDigital: boolean;
    }
  >();

  for (const partida of partidas) {
    const jogo = jogos.get(partida.game.id) ?? {
      nome: "",
      partidas: 0,
      primeira: "",
      ultima: "",
      locais: new Map<string, string>(),
      jogouForaDoDigital: false,
    };

    if (!ehPartidaDigital(partida)) jogo.jogouForaDoDigital = true;
    if (!jogo.nome) jogo.nome = partida.game.name;
    jogo.partidas += partida.quantity;
    if (partida.date) {
      if (!jogo.primeira || partida.date < jogo.primeira) jogo.primeira = partida.date;
      if (!jogo.ultima || partida.date > jogo.ultima) jogo.ultima = partida.date;
    }
    const chave = chaveLocal(partida.location);
    if (!jogo.locais.has(chave)) {
      jogo.locais.set(chave, partida.location.trim().replace(/\s+/g, " "));
    }

    jogos.set(partida.game.id, jogo);
  }

  const apenasDigitais: JogoApenasDigital[] = [];
  for (const [id, jogo] of jogos) {
    if (jogo.jogouForaDoDigital) continue;
    apenasDigitais.push({
      id,
      nome: jogo.nome,
      partidas: jogo.partidas,
      primeira: jogo.primeira,
      ultima: jogo.ultima,
      locais: [...jogo.locais.values()].sort((a, b) =>
        a.localeCompare(b, "pt-BR", { sensitivity: "base" })
      ),
    });
  }

  return apenasDigitais.sort(
    (a, b) =>
      b.partidas - a.partidas ||
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
  );
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
