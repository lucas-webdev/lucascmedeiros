import type { Jogador, PeladaDraft } from "./futebol-types";

const API_URL = "/api/futebol.php";

export class FutebolApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface JogadorBruto {
  id: number | string;
  nome: string;
  mensalista: number | string;
  pontos: number | string;
  jogos: number | string;
  gols: number | string;
  assistencias: number | string;
}

function mapearJogador(bruto: JogadorBruto): Jogador {
  return {
    id: Number(bruto.id),
    nome: bruto.nome,
    mensalista: Number(bruto.mensalista) === 1,
    pontos: Number(bruto.pontos),
    jogos: Number(bruto.jogos),
    gols: Number(bruto.gols),
    assistencias: Number(bruto.assistencias),
  };
}

async function chamar<T>(
  action: string,
  options: RequestInit = {},
  query: Record<string, string> = {}
): Promise<T> {
  const params = new URLSearchParams({ action, ...query });
  let response: Response;
  try {
    response = await fetch(`${API_URL}?${params.toString()}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new FutebolApiError("Não foi possível conectar ao servidor.", 0);
  }

  const bodyClone = response.clone();
  let body: Record<string, unknown>;
  try {
    body = await response.json();
  } catch {
    const texto = await bodyClone.text().catch(() => "");
    console.error(
      `[futebol] resposta não-JSON de ?action=${action} (status ${response.status}):`,
      texto.slice(0, 500)
    );
    throw new FutebolApiError(
      "Resposta inválida do servidor.",
      response.status
    );
  }

  if (!response.ok) {
    const mensagem =
      typeof body.error === "string" ? body.error : "Erro inesperado no servidor.";
    console.error(
      `[futebol] erro em ?action=${action} (status ${response.status}):`,
      mensagem,
      typeof body.detalhe === "string" ? `— ${body.detalhe}` : ""
    );
    throw new FutebolApiError(
      typeof body.detalhe === "string" ? `${mensagem} — ${body.detalhe}` : mensagem,
      response.status
    );
  }

  return body as T;
}

export async function getPlayers(): Promise<Jogador[]> {
  const body = await chamar<{ jogadores?: JogadorBruto[] }>("players");
  if (!Array.isArray(body.jogadores)) {
    throw new FutebolApiError("Resposta inválida do servidor.", 0);
  }
  return body.jogadores.map(mapearJogador);
}

export async function getRanking(): Promise<Jogador[]> {
  const body = await chamar<{ jogadores?: JogadorBruto[] }>("ranking");
  if (!Array.isArray(body.jogadores)) {
    throw new FutebolApiError("Resposta inválida do servidor.", 0);
  }
  return body.jogadores.map(mapearJogador);
}

export async function addPlayer(
  pin: string,
  nome: string,
  mensalista: boolean
): Promise<number> {
  const { id } = await chamar<{ id: number }>("add_player", {
    method: "POST",
    body: JSON.stringify({ pin, nome, mensalista }),
  });
  return id;
}

export async function updatePlayer(
  pin: string,
  id: number,
  nome: string,
  mensalista: boolean,
  ativo: boolean
): Promise<void> {
  await chamar<{ ok: boolean }>("update_player", {
    method: "POST",
    body: JSON.stringify({ pin, id, nome, mensalista, ativo }),
  });
}

export async function submitMatch(
  pin: string,
  data: string,
  numTimes: number,
  placar: [number, number] | null,
  jogadores: {
    id: number;
    timeNumero: number;
    gols: number;
    assistencias: number;
  }[]
): Promise<number> {
  const { partidaId } = await chamar<{ partidaId: number }>(
    "submit_match",
    {
      method: "POST",
      body: JSON.stringify({ pin, data, numTimes, placar, jogadores }),
    }
  );
  return partidaId;
}

/**
 * Rascunho da pelada salvo no servidor (times, gols/assistências e placar
 * em andamento), para permitir continuar a marcação em outro aparelho caso
 * o atual fique indisponível no meio do jogo. Leitura não exige PIN (mesmo
 * padrão de `players`/`ranking`) — só é útil dentro da área já protegida
 * pelo PinGate, e não expõe nada além do que já está nas outras leituras
 * públicas.
 */
export async function getRascunho(data: string): Promise<PeladaDraft | null> {
  const { rascunho } = await chamar<{ rascunho: PeladaDraft | null }>(
    "get_rascunho",
    {},
    { data }
  );
  return rascunho ?? null;
}

export async function saveRascunho(pin: string, draft: PeladaDraft): Promise<void> {
  await chamar<{ ok: boolean }>("save_rascunho", {
    method: "POST",
    body: JSON.stringify({ pin, data: draft.data, payload: draft }),
  });
}

export async function clearRascunho(pin: string, data: string): Promise<void> {
  await chamar<{ ok: boolean }>("clear_rascunho", {
    method: "POST",
    body: JSON.stringify({ pin, data }),
  });
}
