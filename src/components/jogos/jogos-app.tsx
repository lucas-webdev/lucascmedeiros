"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { JogosApiError, buscarPartidasBgg } from "@/lib/jogos-api";
import {
  FILTROS_VAZIOS,
  filtrarPartidas,
  limitesDeData,
  listarJogadores,
  listarLocais,
  temFiltroAtivo,
  type FiltrosPartidas as Filtros,
} from "@/lib/jogos-filtros";
import { resumir } from "@/lib/jogos-stats";
import type { ProgressoBusca, ResultadoBusca } from "@/lib/jogos-types";
import { CartaoPartida } from "./cartao-partida";
import { FiltrosPartidas } from "./filtros-partidas";
import { QuadroDigitais } from "./quadro-digitais";
import { QuadroMarcos } from "./quadro-marcos";

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

export function JogosApp() {
  const [username, setUsername] = useState(USUARIO_PADRAO);
  const [buscando, setBuscando] = useState(false);
  const [progresso, setProgresso] = useState<ProgressoBusca | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null);
  const [visiveis, setVisiveis] = useState(TAMANHO_LOTE);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
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
    setFiltros(FILTROS_VAZIOS);
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

  const partidas = resultado?.partidas;
  const filtradas = useMemo(
    () => (partidas ? filtrarPartidas(partidas, filtros) : []),
    [partidas, filtros]
  );
  const limites = useMemo(
    () => (partidas ? limitesDeData(partidas) : null),
    [partidas]
  );
  // As quantidades de cada lista respeitam os outros filtros (ex.: o período),
  // mas não o próprio — senão marcar um item zeraria os demais da lista.
  const opcoesLocais = useMemo(
    () =>
      partidas
        ? listarLocais(
            partidas,
            filtrarPartidas(partidas, { ...filtros, locais: [] }),
            filtros.locais
          )
        : [],
    [partidas, filtros]
  );
  const opcoesJogadores = useMemo(
    () =>
      partidas
        ? listarJogadores(
            partidas,
            filtrarPartidas(partidas, { ...filtros, jogadores: [] }),
            filtros.jogadores
          )
        : [],
    [partidas, filtros]
  );
  const resumo = resultado ? resumir(filtradas) : null;
  const totalGeral = partidas ? resumir(partidas).totalPartidas : 0;

  function alterarFiltros(novos: Filtros) {
    setFiltros(novos);
    setVisiveis(TAMANHO_LOTE);
  }

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
              <FiltrosPartidas
                filtros={filtros}
                onChange={alterarFiltros}
                limites={limites}
                opcoesLocais={opcoesLocais}
                opcoesJogadores={opcoesJogadores}
                mostradas={resumo.totalPartidas}
                total={totalGeral}
              />

              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-blue-200 bg-blue-100/70 p-4 os-dark:border-blue-800/50 os-dark:bg-blue-900/40">
                  <dt className="text-sm text-blue-950/70 os-dark:text-blue-200/80">
                    Partidas
                  </dt>
                  <dd className="mt-1 flex flex-wrap items-baseline gap-x-2">
                    <span className="text-3xl font-semibold tabular-nums">
                      {resumo.totalPartidas}
                    </span>
                    <span className="text-sm text-blue-950/70 tabular-nums os-dark:text-blue-200/80">
                      ({resumo.partidasDigitais}{" "}
                      {resumo.partidasDigitais === 1 ? "digital" : "digitais"})
                    </span>
                  </dd>
                </div>
                <div className="rounded-xl border border-indigo-200 bg-indigo-100/70 p-4 os-dark:border-indigo-900/60 os-dark:bg-indigo-950/70">
                  <dt className="text-sm text-indigo-950/70 os-dark:text-indigo-200/80">
                    Jogos diferentes
                  </dt>
                  <dd className="mt-1 flex flex-wrap items-baseline gap-x-2">
                    <span className="text-3xl font-semibold tabular-nums">
                      {resumo.jogosDiferentes}
                    </span>
                    <span className="text-sm text-indigo-950/70 tabular-nums os-dark:text-indigo-200/80">
                      ({resumo.jogosApenasDigitais} apenas{" "}
                      {resumo.jogosApenasDigitais === 1 ? "digital" : "digitais"})
                    </span>
                  </dd>
                </div>
              </dl>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <QuadroMarcos partidas={resultado.partidas} />
                <QuadroDigitais
                  partidas={filtradas}
                  filtrado={temFiltroAtivo(filtros)}
                />
              </div>

              {filtradas.length === 0 ? (
                <p className="mt-4 rounded-xl border border-d-line bg-d-card p-4 text-sm text-d-muted">
                  Nenhuma partida dentro dos filtros selecionados.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {filtradas.slice(0, visiveis).map((partida) => (
                    <li key={partida.id}>
                      <CartaoPartida partida={partida} />
                    </li>
                  ))}
                </ul>
              )}

              {visiveis < filtradas.length && (
                <button
                  type="button"
                  onClick={() => setVisiveis((v) => v + TAMANHO_LOTE)}
                  className="mt-4 w-full rounded-xl border border-d-line bg-d-card px-4 py-3 text-base font-medium"
                >
                  Mostrar mais ({filtradas.length - visiveis} restantes)
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
