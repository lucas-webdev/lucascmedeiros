"use client";

import { useEffect, useRef, useState } from "react";
import { JogosApiError, buscarPartidasBgg } from "@/lib/jogos-api";
import { formatarData, formatarDuracao, resumir } from "@/lib/jogos-stats";
import type {
  Partida,
  ProgressoBusca,
  ResultadoBusca,
} from "@/lib/jogos-types";

const CHAVE_USUARIO = "jogos:bgg-username";
const USUARIO_PADRAO = "lucascmedeiros";
const TAMANHO_LOTE = 50;

function lerUsuarioSalvo(): string {
  try {
    return localStorage.getItem(CHAVE_USUARIO) || USUARIO_PADRAO;
  } catch {
    return USUARIO_PADRAO;
  }
}

function gravarUsuario(username: string): void {
  try {
    localStorage.setItem(CHAVE_USUARIO, username);
  } catch {
    // modo privado / storage bloqueado: só deixa de lembrar o usuário
  }
}

function textoProgresso(p: ProgressoBusca): string {
  if (p.aguardandoSegundos) {
    return `BoardGameGeek ocupado, tentando de novo em ${p.aguardandoSegundos}s…`;
  }
  return p.total > 0
    ? `Carregando partidas… ${p.carregadas} de ${p.total}`
    : "Consultando o BoardGameGeek…";
}

function CartaoPartida({ partida }: { partida: Partida }) {
  const duracao = formatarDuracao(partida.length);
  const detalhes = [partida.location, duracao].filter(Boolean).join(" · ");

  return (
    <li className="rounded-xl border border-d-line bg-d-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-base font-semibold leading-snug break-words">
          {partida.game.name || "(sem nome)"}
          {partida.quantity > 1 && (
            <span className="ml-2 rounded-full bg-d-line px-2 py-0.5 text-xs font-medium text-d-muted">
              ×{partida.quantity}
            </span>
          )}
        </h3>
        <time
          dateTime={partida.date}
          className="shrink-0 text-sm text-d-muted tabular-nums"
        >
          {formatarData(partida.date)}
        </time>
      </div>

      {(detalhes || partida.incomplete) && (
        <p className="mt-1 text-sm text-d-muted">
          {detalhes}
          {partida.incomplete && (
            <span className="text-d-warn">{detalhes ? " · " : ""}incompleta</span>
          )}
        </p>
      )}

      {partida.players.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {partida.players.map((jogador, i) => (
            <li
              key={`${jogador.userid}-${jogador.name}-${i}`}
              className={
                jogador.win
                  ? "rounded-full bg-d-ok/15 px-2.5 py-1 text-sm font-medium text-d-ok"
                  : "rounded-full bg-d-line px-2.5 py-1 text-sm"
              }
            >
              {jogador.name || jogador.username || "?"}
              {jogador.score && (
                <span className="ml-1.5 text-d-muted tabular-nums">
                  {jogador.score}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {partida.comments && (
        <p className="mt-3 text-sm whitespace-pre-line text-d-muted">
          {partida.comments}
        </p>
      )}
    </li>
  );
}

export function JogosApp() {
  const [username, setUsername] = useState(USUARIO_PADRAO);
  const [buscando, setBuscando] = useState(false);
  const [progresso, setProgresso] = useState<ProgressoBusca | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null);
  const [visiveis, setVisiveis] = useState(TAMANHO_LOTE);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setUsername(lerUsuarioSalvo());
    return () => controllerRef.current?.abort();
  }, []);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    const nome = username.trim();
    if (!nome || buscando) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setBuscando(true);
    setErro(null);
    setResultado(null);
    setVisiveis(TAMANHO_LOTE);
    setProgresso({ carregadas: 0, total: 0 });

    try {
      const dados = await buscarPartidasBgg(nome, setProgresso, controller.signal);
      gravarUsuario(nome);
      setResultado(dados);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setErro(
        err instanceof JogosApiError
          ? err.message
          : "Não foi possível buscar as partidas."
      );
    } finally {
      if (controllerRef.current === controller) {
        setBuscando(false);
        setProgresso(null);
      }
    }
  }

  const resumo = resultado ? resumir(resultado.partidas) : null;

  return (
    <div className="jogos mx-auto min-h-dvh max-w-2xl px-4 py-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Jogos</h1>
        <p className="mt-2 text-sm text-d-muted">
          Partidas registradas no BoardGameGeek.
        </p>
      </header>

      <form onSubmit={buscar} className="mt-6 flex gap-2">
        <label htmlFor="bgg-username" className="sr-only">
          Usuário do BoardGameGeek
        </label>
        <input
          id="bgg-username"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Usuário no BGG"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-d-line bg-d-card px-4 py-3 text-base outline-none focus:border-d-accent"
        />
        <button
          type="submit"
          disabled={!username.trim() || buscando}
          className="shrink-0 rounded-xl bg-d-accent px-5 py-3 text-base font-semibold text-d-accent-fg disabled:opacity-50"
        >
          {buscando ? "Buscando…" : "Buscar"}
        </button>
      </form>

      {progresso && (
        <p role="status" className="mt-4 text-sm text-d-muted">
          {textoProgresso(progresso)}
        </p>
      )}

      {erro && (
        <p role="alert" className="mt-4 text-sm text-d-bad">
          {erro}
        </p>
      )}

      {resultado && resumo && (
        <section className="mt-6" aria-label={`Partidas de ${resultado.username}`}>
          {resultado.partidas.length === 0 ? (
            <p className="rounded-xl border border-d-line bg-d-card p-4 text-sm text-d-muted">
              Nenhuma partida encontrada para “{resultado.username}”. Confira se
              o nome do usuário está correto e se há partidas registradas no BGG.
            </p>
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-d-line bg-d-card p-4">
                  <dt className="text-sm text-d-muted">Partidas</dt>
                  <dd className="mt-1 text-3xl font-semibold tabular-nums">
                    {resumo.totalPartidas}
                  </dd>
                </div>
                <div className="rounded-xl border border-d-line bg-d-card p-4">
                  <dt className="text-sm text-d-muted">Jogos diferentes</dt>
                  <dd className="mt-1 text-3xl font-semibold tabular-nums">
                    {resumo.jogosDiferentes}
                  </dd>
                </div>
              </dl>

              <ul className="mt-4 space-y-3">
                {resultado.partidas.slice(0, visiveis).map((partida) => (
                  <CartaoPartida key={partida.id} partida={partida} />
                ))}
              </ul>

              {visiveis < resultado.partidas.length && (
                <button
                  type="button"
                  onClick={() => setVisiveis((v) => v + TAMANHO_LOTE)}
                  className="mt-4 w-full rounded-xl border border-d-line bg-d-card px-4 py-3 text-base font-medium"
                >
                  Mostrar mais ({resultado.partidas.length - visiveis} restantes)
                </button>
              )}
            </>
          )}
        </section>
      )}

      <footer className="mt-10 border-t border-d-line pt-4 text-xs text-d-muted">
        Dados fornecidos por{" "}
        <a
          href="https://boardgamegeek.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          BoardGameGeek
        </a>{" "}
        (Powered by BGG).
      </footer>
    </div>
  );
}
