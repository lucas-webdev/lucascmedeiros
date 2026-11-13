import type { JogadorPartida, Partida } from "./jogos-types";

/**
 * Filtros aplicados no navegador sobre as partidas já carregadas (não geram
 * novas chamadas ao BGG). Novos filtros (tag...) entram como novos campos
 * aqui e como novas condições em `filtrarPartidas`.
 */

/** `incluir`: só os itens marcados. `excluir`: tudo, menos os itens marcados. */
export type ModoFiltro = "incluir" | "excluir";

export interface FiltrosPartidas {
  /** YYYY-MM-DD, inclusivo. Vazio = sem limite inferior. */
  dataInicio: string;
  /** YYYY-MM-DD, inclusivo. Vazio = sem limite superior. */
  dataFim: string;
  /** Chaves normalizadas (ver `chaveLocal`). Vazio = filtro de local inativo. */
  locais: string[];
  modoLocais: ModoFiltro;
  /**
   * Chaves de jogador (ver `identidadeDeJogadores`). Vazio = filtro inativo.
   * `incluir`: partidas com ALGUM dos marcados. `excluir`: partidas sem NENHUM.
   */
  jogadores: string[];
  modoJogadores: ModoFiltro;
}

export const FILTROS_VAZIOS: FiltrosPartidas = {
  dataInicio: "",
  dataFim: "",
  locais: [],
  modoLocais: "incluir",
  jogadores: [],
  modoJogadores: "incluir",
};

export function temFiltroDeData(filtros: FiltrosPartidas): boolean {
  return filtros.dataInicio !== "" || filtros.dataFim !== "";
}

export function temFiltroDeLocal(filtros: FiltrosPartidas): boolean {
  return filtros.locais.length > 0;
}

export function temFiltroDeJogador(filtros: FiltrosPartidas): boolean {
  return filtros.jogadores.length > 0;
}

export function temFiltroAtivo(filtros: FiltrosPartidas): boolean {
  return (
    temFiltroDeData(filtros) ||
    temFiltroDeLocal(filtros) ||
    temFiltroDeJogador(filtros)
  );
}

/** Data inicial depois da final: nenhum resultado possível. */
export function intervaloInvertido(filtros: FiltrosPartidas): boolean {
  return (
    filtros.dataInicio !== "" &&
    filtros.dataFim !== "" &&
    filtros.dataInicio > filtros.dataFim
  );
}

function colapsarEspacos(texto: string): string {
  return texto.trim().replace(/\s+/g, " ");
}

/** Ignora maiúsculas, espaços extras e acentos. */
function normalizarTexto(texto: string): string {
  return colapsarEspacos(texto)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Chave de agrupamento de um local. O BGG guarda texto livre, então o mesmo
 * lugar aparece como "Casa Do Daniel" e "casa do daniel", ou "Brechó Lúdico"
 * e "Brecho Lúdico". A chave vazia representa partidas sem local informado.
 */
export function chaveLocal(local: string): string {
  return normalizarTexto(local);
}

/** Item de uma lista de escolha de um filtro (local, jogador...). */
export interface OpcaoFiltro {
  chave: string;
  /** Grafia mais usada entre as variações do mesmo item. */
  rotulo: string;
  /** Informação secundária (ex.: @usuario do BGG). */
  detalhe?: string;
  /** Partidas (somando `quantity`) com este item dentro de `visiveis`. */
  quantidade: number;
}

const ROTULO_SEM_LOCAL = "(sem local informado)";

function ordenarOpcoes(opcoes: OpcaoFiltro[]): OpcaoFiltro[] {
  return opcoes.sort(
    (a, b) =>
      b.quantidade - a.quantidade ||
      a.rotulo.localeCompare(b.rotulo, "pt-BR", { sensitivity: "base" })
  );
}

function grafiaMaisUsada(grafias: Map<string, number>): string {
  let melhor = "";
  let usos = -1;
  for (const [grafia, n] of grafias) {
    if (n > usos) {
      melhor = grafia;
      usos = n;
    }
  }
  return melhor;
}

/**
 * Lista os locais disponíveis para escolha. Os rótulos vêm de todas as
 * partidas (`todas`), as quantidades vêm só das que passam pelos outros
 * filtros (`visiveis`). Locais sem nenhuma partida visível somem da lista,
 * a não ser que já estejam selecionados (para poderem ser desmarcados).
 */
export function listarLocais(
  todas: Partida[],
  visiveis: Partida[],
  selecionados: string[]
): OpcaoFiltro[] {
  const variantes = new Map<string, Map<string, number>>();
  for (const { location } of todas) {
    const chave = chaveLocal(location);
    const grafia = colapsarEspacos(location);
    const porGrafia = variantes.get(chave) ?? new Map<string, number>();
    porGrafia.set(grafia, (porGrafia.get(grafia) ?? 0) + 1);
    variantes.set(chave, porGrafia);
  }

  const quantidades = new Map<string, number>();
  for (const { location, quantity } of visiveis) {
    const chave = chaveLocal(location);
    quantidades.set(chave, (quantidades.get(chave) ?? 0) + quantity);
  }

  const marcados = new Set(selecionados);
  const opcoes: OpcaoFiltro[] = [];
  for (const [chave, porGrafia] of variantes) {
    const quantidade = quantidades.get(chave) ?? 0;
    if (quantidade === 0 && !marcados.has(chave)) continue;
    opcoes.push({
      chave,
      rotulo: chave === "" ? ROTULO_SEM_LOCAL : grafiaMaisUsada(porGrafia),
      quantidade,
    });
  }
  return ordenarOpcoes(opcoes);
}

// ---------------------------------------------------------------------------
// Jogadores
// ---------------------------------------------------------------------------

type ChaveDeJogador = (jogador: JogadorPartida) => string | null;

/** A identidade depende do conjunto completo; calculada uma vez por array de partidas. */
const identidades = new WeakMap<Partida[], ChaveDeJogador>();

/**
 * Decide quem é "a mesma pessoa" entre as partidas. No BGG cada participação
 * tem um usuário (só se a pessoa tem conta e foi vinculada) e um nome livre, e
 * a mesma pessoa costuma aparecer de várias formas: `leti_rocha`, ".. Leti",
 * "Leti" ou o usuário digitado como nome.
 *
 * Regra: quem tem usuário é identificado por ele. Um nome sem usuário é unido
 * a um usuário quando esse nome (ou usuário) já foi usado junto de EXATAMENTE
 * um usuário em outras partidas; se for ambíguo ou desconhecido, o nome
 * normalizado vira uma pessoa própria. Participações sem usuário e sem nome
 * são ignoradas.
 */
function identidadeDeJogadores(todas: Partida[]): ChaveDeJogador {
  const existente = identidades.get(todas);
  if (existente) return existente;

  const usuariosPorApelido = new Map<string, Set<string>>();
  for (const { players } of todas) {
    for (const jogador of players) {
      const usuario = normalizarTexto(jogador.username);
      if (!usuario) continue;
      const chave = `u:${usuario}`;
      for (const apelido of [usuario, normalizarTexto(jogador.name)]) {
        if (!apelido) continue;
        const usuarios = usuariosPorApelido.get(apelido) ?? new Set<string>();
        usuarios.add(chave);
        usuariosPorApelido.set(apelido, usuarios);
      }
    }
  }

  const chaveDe: ChaveDeJogador = (jogador) => {
    const usuario = normalizarTexto(jogador.username);
    if (usuario) return `u:${usuario}`;

    const nome = normalizarTexto(jogador.name);
    if (!nome) return null;

    const candidatos = usuariosPorApelido.get(nome);
    if (candidatos?.size === 1) {
      const [unico] = candidatos;
      return unico;
    }
    return `n:${nome}`;
  };

  identidades.set(todas, chaveDe);
  return chaveDe;
}

/** Chaves (sem repetição) dos jogadores que participaram da partida. */
function chavesDosJogadores(
  partida: Partida,
  chaveDe: ChaveDeJogador
): Set<string> {
  const chaves = new Set<string>();
  for (const jogador of partida.players) {
    const chave = chaveDe(jogador);
    if (chave) chaves.add(chave);
  }
  return chaves;
}

/**
 * Lista os jogadores disponíveis para escolha, com a mesma lógica de
 * `listarLocais`: nomes de todas as partidas, quantidades só das visíveis.
 */
export function listarJogadores(
  todas: Partida[],
  visiveis: Partida[],
  selecionados: string[]
): OpcaoFiltro[] {
  const chaveDe = identidadeDeJogadores(todas);

  const cadastro = new Map<string, { nomes: Map<string, number>; usuario: string }>();
  for (const partida of todas) {
    for (const jogador of partida.players) {
      const chave = chaveDe(jogador);
      if (!chave) continue;
      const item = cadastro.get(chave) ?? { nomes: new Map<string, number>(), usuario: "" };
      const nome = colapsarEspacos(jogador.name);
      if (nome) item.nomes.set(nome, (item.nomes.get(nome) ?? 0) + 1);
      if (!item.usuario && jogador.username.trim()) item.usuario = jogador.username.trim();
      cadastro.set(chave, item);
    }
  }

  const quantidades = new Map<string, number>();
  for (const partida of visiveis) {
    for (const chave of chavesDosJogadores(partida, chaveDe)) {
      quantidades.set(chave, (quantidades.get(chave) ?? 0) + partida.quantity);
    }
  }

  const marcados = new Set(selecionados);
  const opcoes: OpcaoFiltro[] = [];
  for (const [chave, { nomes, usuario }] of cadastro) {
    const quantidade = quantidades.get(chave) ?? 0;
    if (quantidade === 0 && !marcados.has(chave)) continue;

    const rotulo = nomes.size > 0 ? grafiaMaisUsada(nomes) : usuario || chave;
    const mostrarUsuario =
      usuario !== "" && normalizarTexto(usuario) !== normalizarTexto(rotulo);
    opcoes.push({
      chave,
      rotulo,
      detalhe: mostrarUsuario ? `@${usuario}` : undefined,
      quantidade,
    });
  }
  return ordenarOpcoes(opcoes);
}

/**
 * As datas do BGG são YYYY-MM-DD, então a comparação de strings é a
 * cronológica (sem passar por Date, que deslocaria por fuso).
 *
 * Deve receber sempre o conjunto completo de partidas: a identidade dos
 * jogadores é calculada sobre ele (ver `identidadeDeJogadores`).
 */
export function filtrarPartidas(
  partidas: Partida[],
  filtros: FiltrosPartidas
): Partida[] {
  if (!temFiltroAtivo(filtros)) return partidas;

  const locais = new Set(filtros.locais);
  const filtraLocal = locais.size > 0;
  const jogadores = new Set(filtros.jogadores);
  const filtraJogador = jogadores.size > 0;
  const chaveDe = filtraJogador ? identidadeDeJogadores(partidas) : null;

  return partidas.filter((partida) => {
    if (temFiltroDeData(filtros)) {
      // Sem data não dá para dizer que está dentro do intervalo.
      if (!partida.date) return false;
      if (filtros.dataInicio && partida.date < filtros.dataInicio) return false;
      if (filtros.dataFim && partida.date > filtros.dataFim) return false;
    }

    if (filtraLocal) {
      const marcado = locais.has(chaveLocal(partida.location));
      if (filtros.modoLocais === "incluir" ? !marcado : marcado) return false;
    }

    if (filtraJogador && chaveDe) {
      let participou = false;
      for (const chave of chavesDosJogadores(partida, chaveDe)) {
        if (jogadores.has(chave)) {
          participou = true;
          break;
        }
      }
      if (filtros.modoJogadores === "incluir" ? !participou : participou) {
        return false;
      }
    }

    return true;
  });
}

/** Menor e maior data presentes nas partidas, ou `null` se não houver nenhuma. */
export function limitesDeData(
  partidas: Partida[]
): { min: string; max: string } | null {
  let min = "";
  let max = "";
  for (const { date } of partidas) {
    if (!date) continue;
    if (min === "" || date < min) min = date;
    if (max === "" || date > max) max = date;
  }
  return min === "" ? null : { min, max };
}
