import type {
  PaginaPartidas,
  ProgressoBusca,
  ResultadoBusca,
} from "./jogos-types";

const API_URL = "/api/bgg.php";
/** O BGG devolve 100 partidas por página. */
const MAX_PAGINAS = 500;
const MAX_TENTATIVAS = 4;

export class JogosApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function esperar(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Busca cancelada", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException("Busca cancelada", "AbortError"));
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function buscarPagina(
  username: string,
  pagina: number,
  signal: AbortSignal | undefined,
  onEspera: (segundos: number) => void
): Promise<PaginaPartidas> {
  const params = new URLSearchParams({
    action: "plays",
    username,
    page: String(pagina),
  });

  for (let tentativa = 1; ; tentativa++) {
    let response: Response;
    try {
      response = await fetch(`${API_URL}?${params.toString()}`, { signal });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      throw new JogosApiError("Não foi possível conectar ao servidor.", 0);
    }

    let body: Record<string, unknown>;
    try {
      body = await response.json();
    } catch {
      throw new JogosApiError("Resposta inválida do servidor.", response.status);
    }

    if (response.ok) return body as unknown as PaginaPartidas;

    // 503 + retryAfter = BGG ocupado/limitando: espera e tenta de novo.
    if (
      response.status === 503 &&
      typeof body.retryAfter === "number" &&
      tentativa < MAX_TENTATIVAS
    ) {
      onEspera(body.retryAfter);
      await esperar(body.retryAfter * 1000, signal);
      continue;
    }

    const mensagem =
      typeof body.error === "string" ? body.error : "Erro inesperado no servidor.";
    throw new JogosApiError(
      typeof body.detalhe === "string" ? `${mensagem} ${body.detalhe}` : mensagem,
      response.status
    );
  }
}

/**
 * Busca todas as partidas registradas no BGG para um usuário, página a página
 * (100 por vez, em sequência para respeitar o limite do BGG).
 */
export async function buscarPartidasBgg(
  username: string,
  onProgresso: (progresso: ProgressoBusca) => void,
  signal?: AbortSignal
): Promise<ResultadoBusca> {
  const partidas: ResultadoBusca["partidas"] = [];
  let total = 0;
  let nomeCanonico = username;

  for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
    const resultado = await buscarPagina(username, pagina, signal, (segundos) =>
      onProgresso({ carregadas: partidas.length, total, aguardandoSegundos: segundos })
    );

    total = resultado.total;
    if (resultado.username) nomeCanonico = resultado.username;
    partidas.push(...resultado.plays);
    onProgresso({ carregadas: partidas.length, total });

    // Página vazia ou já temos tudo (o BGG pagina por registro de partida).
    if (resultado.plays.length === 0 || partidas.length >= total) break;
  }

  return { username: nomeCanonico, total, partidas };
}
