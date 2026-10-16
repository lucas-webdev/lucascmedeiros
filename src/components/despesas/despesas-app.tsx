"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DespesasApiError, getPainel, postLancamento } from "@/lib/despesas-api";
import { haQuantoTempo, mesDaData } from "@/lib/despesas-format";
import {
  enfileirar,
  gerarIdLocal,
  listarPendentes,
  marcarErro,
  remover,
} from "@/lib/despesas-queue";
import {
  gravarCategoriasEmCache,
  gravarMetodoId,
  gravarPainelEmCache,
  gravarToken,
  lerCategoriasEmCache,
  lerPainelEmCache,
  lerToken,
  limparToken,
  registrarDescricao,
  registrarUsoCategoria,
} from "@/lib/despesas-storage";
import {
  MESES,
  type LancamentoPendente,
  type NovoLancamento,
  type Painel,
} from "@/lib/despesas-types";
import { CategoriasLista } from "./categorias-lista";
import { FixosSecao } from "./fixos-secao";
import { LancarSheet } from "./lancar-sheet";
import { PainelTopo } from "./painel-topo";
import { ServiceWorkerRegister } from "./service-worker-register";
import { TokenGate } from "./token-gate";
import { UltimosSecao } from "./ultimos-secao";
import { usePullToRefresh } from "./use-pull-to-refresh";

interface Dados {
  painel: Painel;
  /** timestamp (ms) da última resposta do servidor */
  em: number;
}

function mesAtualDoAparelho(): string {
  return MESES[new Date().getMonth()];
}

export function DespesasApp() {
  const [montado, setMontado] = useState(false);
  const [token, setToken] = useState("");
  const [erroToken, setErroToken] = useState<string | null>(null);

  const [mes, setMes] = useState<string>(MESES[0]);
  const [dados, setDados] = useState<Dados | null>(null);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [semConexao, setSemConexao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const [pendentes, setPendentes] = useState<LancamentoPendente[]>([]);
  const [sheetAberto, setSheetAberto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // Refs espelham o estado para handlers de eventos globais (online, visibilitychange).
  const mesRef = useRef(mes);
  const tokenRef = useRef(token);
  const requisicaoRef = useRef(0);
  const enviandoFilaRef = useRef(false);
  const avisoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarAviso = useCallback((texto: string) => {
    setAviso(texto);
    if (avisoTimer.current) clearTimeout(avisoTimer.current);
    avisoTimer.current = setTimeout(() => setAviso(null), 4500);
  }, []);

  const sairPorToken = useCallback((mensagem: string) => {
    limparToken();
    tokenRef.current = "";
    setToken("");
    setErroToken(mensagem);
    setSheetAberto(false);
  }, []);

  const aplicarPainel = useCallback((painel: Painel, lista?: string[]) => {
    gravarPainelEmCache(painel.mes, painel, lista ?? lerCategoriasEmCache());
    if (painel.mes === mesRef.current) {
      setDados({ painel, em: Date.now() });
    }
  }, []);

  const carregar = useCallback(
    async (alvo: string) => {
      const tok = tokenRef.current;
      if (!tok) return;
      const id = ++requisicaoRef.current;
      setCarregando(true);
      try {
        const r = await getPainel(tok, alvo);
        gravarCategoriasEmCache(r.categorias);
        gravarPainelEmCache(alvo, r.painel, r.categorias);
        if (id !== requisicaoRef.current) return;
        setDados({ painel: r.painel, em: Date.now() });
        setCategorias(r.categorias);
        setSemConexao(false);
        setErro(null);
      } catch (e) {
        if (id !== requisicaoRef.current) return;
        if (e instanceof DespesasApiError) {
          if (e.naoAutorizado) {
            sairPorToken("Token recusado. Digite novamente.");
          } else if (e.tipo === "rede") {
            setSemConexao(true);
          } else {
            setErro(e.message);
          }
        } else {
          setErro("Erro inesperado.");
        }
      } finally {
        if (id === requisicaoRef.current) setCarregando(false);
      }
    },
    [sairPorToken]
  );

  const atualizarListaPendentes = useCallback(async () => {
    setPendentes(await listarPendentes());
  }, []);

  /** Reenvia a fila offline em ordem. O `idLocal` evita duplicar se uma resposta tiver se perdido. */
  const enviarPendentes = useCallback(async () => {
    if (enviandoFilaRef.current || !tokenRef.current) return;
    enviandoFilaRef.current = true;
    let enviados = 0;
    try {
      for (const item of await listarPendentes()) {
        if (item.erro) continue;
        try {
          const r = await postLancamento(tokenRef.current, item.idLocal, item.lancamento);
          await remover(item.idLocal);
          aplicarPainel(r.painel);
          enviados++;
        } catch (e) {
          if (!(e instanceof DespesasApiError) || e.tipo !== "servidor") break;
          if (e.naoAutorizado) {
            sairPorToken("Token recusado. Digite novamente.");
            break;
          }
          await marcarErro(item, e.message);
        }
      }
    } finally {
      enviandoFilaRef.current = false;
      await atualizarListaPendentes();
    }
    if (enviados > 0) {
      mostrarAviso(
        enviados === 1 ? "1 lançamento pendente enviado" : `${enviados} lançamentos pendentes enviados`
      );
    }
  }, [aplicarPainel, atualizarListaPendentes, mostrarAviso, sairPorToken]);

  const atualizarTudo = useCallback(async () => {
    await enviarPendentes();
    await carregar(mesRef.current);
  }, [carregar, enviarPendentes]);

  // Montagem: token e caches só existem no cliente.
  useEffect(() => {
    const salvo = lerToken();
    const inicial = mesAtualDoAparelho();
    const cache = lerPainelEmCache(inicial);
    mesRef.current = inicial;
    tokenRef.current = salvo;
    setMes(inicial);
    setToken(salvo);
    setCategorias(cache?.categorias ?? lerCategoriasEmCache());
    if (cache) setDados({ painel: cache.painel, em: cache.em });
    setMontado(true);
    void atualizarListaPendentes();
    if (salvo) void atualizarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reenvia a fila ao voltar a conexão ou ao reabrir o app.
  useEffect(() => {
    function aoVoltar() {
      if (tokenRef.current) void atualizarTudo();
    }
    function aoVisivel() {
      if (document.visibilityState === "visible") aoVoltar();
    }
    window.addEventListener("online", aoVoltar);
    document.addEventListener("visibilitychange", aoVisivel);
    return () => {
      window.removeEventListener("online", aoVoltar);
      document.removeEventListener("visibilitychange", aoVisivel);
    };
  }, [atualizarTudo]);

  const irParaMes = useCallback(
    (novo: string) => {
      mesRef.current = novo;
      setMes(novo);
      setErro(null);
      const cache = lerPainelEmCache(novo);
      setDados(cache ? { painel: cache.painel, em: cache.em } : null);
      void carregar(novo);
    },
    [carregar]
  );

  const mudarMes = (delta: -1 | 1) => {
    const idx = MESES.indexOf(mes as (typeof MESES)[number]) + delta;
    if (idx >= 0 && idx < MESES.length) irParaMes(MESES[idx]);
  };

  async function entrar(novoToken: string) {
    try {
      const r = await getPainel(novoToken, mesRef.current);
      gravarToken(novoToken);
      tokenRef.current = novoToken;
      gravarCategoriasEmCache(r.categorias);
      gravarPainelEmCache(r.painel.mes, r.painel, r.categorias);
      setErroToken(null);
      setCategorias(r.categorias);
      setDados({ painel: r.painel, em: Date.now() });
      setSemConexao(false);
      setToken(novoToken);
      void enviarPendentes();
    } catch (e) {
      if (e instanceof DespesasApiError) {
        if (e.naoAutorizado) throw new Error("Token inválido.");
        throw new Error(e.message);
      }
      throw new Error("Não foi possível verificar o token.");
    }
  }

  const lancar = useCallback(
    async (lancamento: NovoLancamento, metodoId: string) => {
      const idLocal = gerarIdLocal();
      const registrarUso = () => {
        registrarUsoCategoria(lancamento.categoria);
        registrarDescricao(lancamento.descricao);
        gravarMetodoId(metodoId);
      };

      try {
        const r = await postLancamento(tokenRef.current, idLocal, lancamento);
        registrarUso();
        // O backend decide a aba (regra de corte do cartão): mostra o mês onde caiu.
        mesRef.current = r.lancamento.aba;
        setMes(r.lancamento.aba);
        aplicarPainel(r.painel);
        setSemConexao(false);
        const fatura =
          mesDaData(lancamento.data) !== r.lancamento.aba
            ? ` (fatura ${lancamento.conta})`
            : "";
        mostrarAviso(`Lançado em ${r.lancamento.aba}${fatura}`);
        setSheetAberto(false);
      } catch (e) {
        if (e instanceof DespesasApiError && e.tipo === "rede") {
          try {
            await enfileirar(lancamento, idLocal);
          } catch {
            throw new Error("Sem conexão e não foi possível guardar para depois.");
          }
          registrarUso();
          await atualizarListaPendentes();
          setSemConexao(true);
          mostrarAviso("Sem conexão: guardado como pendente");
          setSheetAberto(false);
          return;
        }
        if (e instanceof DespesasApiError && e.naoAutorizado) {
          sairPorToken("Token recusado. Digite novamente.");
          return;
        }
        throw e instanceof Error ? e : new Error("Erro inesperado.");
      }
    },
    [aplicarPainel, atualizarListaPendentes, mostrarAviso, sairPorToken]
  );

  const descartarPendente = useCallback(
    async (idLocal: string) => {
      await remover(idLocal);
      await atualizarListaPendentes();
    },
    [atualizarListaPendentes]
  );

  const { puxada, atualizando, limite } = usePullToRefresh(
    atualizarTudo,
    montado && !!token && !sheetAberto
  );

  if (!montado) {
    return <div className="despesas min-h-dvh bg-d-bg" aria-busy="true" />;
  }

  if (!token) {
    return (
      <div className="despesas min-h-dvh bg-d-bg text-d-fg">
        <ServiceWorkerRegister />
        <TokenGate erroInicial={erroToken} onEntrar={entrar} />
      </div>
    );
  }

  const idx = MESES.indexOf(mes as (typeof MESES)[number]);
  const aguardando = pendentes.filter((p) => !p.erro).length;

  return (
    <div className="despesas min-h-dvh bg-d-bg text-d-fg">
      <ServiceWorkerRegister />

      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center pt-[env(safe-area-inset-top)] text-xs text-d-muted"
        style={{
          transform: `translateY(${atualizando ? 12 : puxada - 24}px)`,
          opacity: atualizando ? 1 : Math.min(puxada / limite, 1),
        }}
      >
        <span className="rounded-full bg-d-card px-3 py-1 shadow">
          {atualizando ? "Atualizando…" : puxada >= limite ? "Solte para atualizar" : "Puxe para atualizar"}
        </span>
      </div>

      <main className="mx-auto max-w-md px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        {(semConexao || aguardando > 0) && (
          <div role="status" className="mb-3 rounded-xl bg-d-card px-4 py-2.5 text-sm text-d-muted">
            {semConexao && (
              <p>
                Sem conexão
                {dados ? ` · dados de há ${haQuantoTempo(dados.em)}` : ""}
              </p>
            )}
            {aguardando > 0 && (
              <p className="text-d-warn">
                {aguardando === 1
                  ? "1 lançamento aguardando envio"
                  : `${aguardando} lançamentos aguardando envio`}
              </p>
            )}
          </div>
        )}

        {dados ? (
          <>
            <PainelTopo
              painel={dados.painel}
              podeAnterior={idx > 0}
              podeProximo={idx < MESES.length - 1}
              onMes={mudarMes}
            />
            <CategoriasLista categorias={dados.painel.categorias} />
            <FixosSecao fixos={dados.painel.fixosPendentes} />
            <UltimosSecao
              ultimos={dados.painel.ultimos}
              pendentes={pendentes}
              onDescartar={descartarPendente}
            />
          </>
        ) : (
          <div className="pt-2 text-center">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => mudarMes(-1)}
                disabled={idx <= 0}
                aria-label="Mês anterior"
                className="flex size-11 items-center justify-center rounded-full text-2xl text-d-muted active:bg-d-line disabled:opacity-30"
              >
                ‹
              </button>
              <h1 className="text-lg font-semibold">{mes}</h1>
              <button
                type="button"
                onClick={() => mudarMes(1)}
                disabled={idx >= MESES.length - 1}
                aria-label="Próximo mês"
                className="flex size-11 items-center justify-center rounded-full text-2xl text-d-muted active:bg-d-line disabled:opacity-30"
              >
                ›
              </button>
            </div>
            <div className="pt-20" />
            {erro ? (
              <>
                <p role="alert" className="text-d-bad">
                  {erro}
                </p>
                <button
                  type="button"
                  onClick={() => void carregar(mes)}
                  className="mt-4 rounded-xl bg-d-accent px-5 py-2.5 font-semibold text-d-accent-fg"
                >
                  Tentar de novo
                </button>
              </>
            ) : (
              <p className="text-d-muted">
                {carregando ? "Carregando…" : semConexao ? "Sem conexão e sem dados salvos." : ""}
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            if (window.confirm("Trocar o token deste aparelho?")) sairPorToken("");
          }}
          className="mt-10 block w-full text-center text-xs text-d-muted underline"
        >
          Trocar token
        </button>
      </main>

      {aviso && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-sm rounded-xl bg-d-fg px-4 py-3 text-center text-sm font-medium text-d-bg shadow-lg"
        >
          {aviso}
        </div>
      )}

      {!sheetAberto && (
        <button
          type="button"
          onClick={() => setSheetAberto(true)}
          aria-label="Novo lançamento"
          className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-30 flex size-16 items-center justify-center rounded-full bg-d-accent text-4xl font-light text-d-accent-fg shadow-xl active:scale-95"
        >
          +
        </button>
      )}

      {sheetAberto && (
        <LancarSheet
          categorias={categorias}
          painel={dados?.painel ?? null}
          onFechar={() => setSheetAberto(false)}
          onLancar={lancar}
        />
      )}
    </div>
  );
}
