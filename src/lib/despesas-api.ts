import type {
  LancamentoResposta,
  NovoLancamento,
  PainelResposta,
} from "./despesas-types";

const API_URL = process.env.NEXT_PUBLIC_DESPESAS_API ?? "";
const TIMEOUT_MS = 25000;

/** `rede`: sem conexão (vale reenviar depois). `servidor`: o backend recusou (não adianta reenviar igual). */
export type DespesasErroTipo = "rede" | "servidor" | "config";

export class DespesasApiError extends Error {
  tipo: DespesasErroTipo;

  constructor(message: string, tipo: DespesasErroTipo) {
    super(message);
    this.tipo = tipo;
  }

  get naoAutorizado(): boolean {
    return this.tipo === "servidor" && this.message === "não autorizado";
  }
}

async function lerResposta<T>(response: Response): Promise<T> {
  let body: { ok?: boolean; erro?: string } & Record<string, unknown>;
  try {
    body = await response.json();
  } catch {
    throw new DespesasApiError("Resposta inválida do servidor.", "servidor");
  }
  // Erros do Apps Script vêm como { ok: false, erro } com HTTP 200.
  if (!body.ok) {
    throw new DespesasApiError(
      typeof body.erro === "string" ? body.erro : "Erro inesperado no servidor.",
      "servidor"
    );
  }
  return body as unknown as T;
}

async function enviar(url: string, init?: RequestInit): Promise<Response> {
  if (!API_URL) {
    throw new DespesasApiError(
      "API não configurada (NEXT_PUBLIC_DESPESAS_API).",
      "config"
    );
  }
  // O Apps Script pode demorar (partida a frio); passou disso, trata como falha de rede.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch {
    throw new DespesasApiError("Sem conexão com o servidor.", "rede");
  } finally {
    clearTimeout(timer);
  }
}

/** `mes` opcional: sem ele o backend usa o mês atual. */
export async function getPainel(
  token: string,
  mes?: string
): Promise<PainelResposta> {
  const params = new URLSearchParams({ token });
  if (mes) params.set("mes", mes);
  const response = await enviar(`${API_URL}?${params.toString()}`);
  return lerResposta<PainelResposta>(response);
}

export async function postLancamento(
  token: string,
  idLocal: string,
  lancamento: NovoLancamento
): Promise<LancamentoResposta> {
  // text/plain evita o preflight CORS, que o Apps Script não responde.
  const response = await enviar(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ token, idLocal, ...lancamento }),
  });
  return lerResposta<LancamentoResposta>(response);
}
