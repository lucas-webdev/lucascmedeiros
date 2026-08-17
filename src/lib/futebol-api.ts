import type { Jogador } from "./futebol-types";

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
  options: RequestInit = {}
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}?action=${action}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new FutebolApiError("Não foi possível conectar ao servidor.", 0);
  }

  let body: Record<string, unknown>;
  try {
    body = await response.json();
  } catch {
    throw new FutebolApiError(
      "Resposta inválida do servidor.",
      response.status
    );
  }

  if (!response.ok) {
    throw new FutebolApiError(
      typeof body.error === "string" ? body.error : "Erro inesperado no servidor.",
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
