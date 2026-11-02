"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { haQuantoTempo } from "@/lib/despesas-format";
import { LetiApiError, getDados, postAcao } from "@/lib/despesas-leti-api";
import {
  mesDeHojeNoAparelho,
  rotuloMes,
  somarMeses,
} from "@/lib/despesas-leti-parcelas";
import {
  enfileirar,
  gerarIdLocal,
  listarPendentes,
  marcarErro,
  remover,
} from "@/lib/despesas-leti-queue";
import {
  gravarDadosEmCache,
  gravarForma,
  gravarToken,
  lerDadosEmCache,
  lerLojas,
  lerToken,
  limparToken,
  registrarLoja,
  registrarUsoCategoria,
} from "@/lib/despesas-leti-storage";
import type {
  Acao,
  AcaoResposta,
  CompraPendente,
  Config,
  Dados,
  ItemFatura,
  NovaCompra,
} from "@/lib/despesas-leti-types";
import { usePullToRefresh } from "@/components/despesas/use-pull-to-refresh";
import { CategoriasLista } from "./categorias-lista";
import { DetalheSheet } from "./detalhe-sheet";
import { FaturaTopo } from "./fatura-topo";
import { GastosLista } from "./gastos-lista";
import { LancarSheet } from "./lancar-sheet";
import { ProximasFaturas } from "./proximas-faturas";
import { ServiceWorkerRegister } from "./service-worker-register";
import { TokenGate } from "./token-gate";

interface Estado {
  dados: Dados;
  /** timestamp (ms) da última resposta do servidor */
  em: number;
}

type Sheet =
  | { tipo: "novo" }
  | { tipo: "detalhe"; item: ItemFatura }
  | { tipo: "editar"; item: ItemFatura };

const CONFIG_PADRAO: Config = { vencimento: 20, fechamento: 14 };
const MSG_TOKEN = "Token recusado. Digite novamente.";
const MSG_OFFLINE = "Sem conexão. Tente de novo quando estiver online.";
/** Quantos meses para trás e para a frente dá para navegar a partir de hoje. */
const MESES_ATRAS = 12;
const MESES_A_FRENTE = 24;

export function DespesasLetiApp() {
  const [montado, setMontado] = useState(false);
  const [token, setToken] = useState("");
  const [erroToken, setErroToken] = useState<string | null>(null);

  const [mes, setMes] = useState("");
  const [estado, setEstado] = useState<Estado | null>(null);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [config, setConfig] = useState<Config>(CONFIG_PADRAO);
  const [semConexao, setSemConexao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const [pendentes, setPendentes] = useState<CompraPendente[]>([]);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [repassando, setRepassando] = useState(false);

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
    setSheet(null);
  }, []);

  /** Guarda no cache e, se for o mês da tela, atualiza a tela. */
  const aplicarDados = useCallback((dados: Dados) => {
    gravarDadosEmCache(dados.fatura.mes, dados);
    setCategorias(dados.categorias);
    setConfig(dados.config);
    if (dados.fatura.mes === mesRef.current) {
      setEstado({ dados, em: Date.now() });
    }
  }, []);

  /** Leva a tela para o mês dos dados recebidos (ex.: onde a compra nova caiu). */
  const adotarDados = useCallback(
    (dados: Dados) => {
      mesRef.current = dados.fatura.mes;
      setMes(dados.fatura.mes);
      setErro(null);
      aplicarDados(dados);
    },
    [aplicarDados]
  );

  const carregar = useCallback(
    async (alvo: string) => {
      const tok = tokenRef.current;
      if (!tok) return;
      const id = ++requisicaoRef.current;
      setCarregando(true);
      try {
        const r = await getDados(tok, alvo);
        if (id !== requisicaoRef.current) return;
        aplicarDados(r.dados);
        setSemConexao(false);
        setErro(null);
      } catch (e) {
        if (id !== requisicaoRef.current) return;
        if (e instanceof LetiApiError) {
          if (e.naoAutorizado) {
            sairPorToken(MSG_TOKEN);
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
    [aplicarDados, sairPorToken]
  );

  const atualizarListaPendentes = useCallback(async () => {
    setPendentes(await listarPendentes());
  }, []);

  /** Reenvia a fila offline em ordem. O `idLocal` vira o ID da compra e evita duplicar. */
  const enviarPendentes = useCallback(async () => {
    if (enviandoFilaRef.current || !tokenRef.current) return;
    enviandoFilaRef.current = true;
    let enviados = 0;
    try {
      for (const item of await listarPendentes()) {
        if (item.erro) continue;
        try {
          const r = await postAcao(tokenRef.current, {
            acao: "criar",
            idLocal: item.idLocal,
            compra: item.compra,
          });
          await remover(item.idLocal);
          aplicarDados(r.dados);
          enviados++;
        } catch (e) {
          if (!(e instanceof LetiApiError) || e.tipo !== "servidor") break;
          if (e.naoAutorizado) {
            sairPorToken(MSG_TOKEN);
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
        enviados === 1 ? "1 compra pendente enviada" : `${enviados} compras pendentes enviadas`
      );
    }
  }, [aplicarDados, atualizarListaPendentes, mostrarAviso, sairPorToken]);

  const atualizarTudo = useCallback(async () => {
    await enviarPendentes();
    await carregar(mesRef.current);
  }, [carregar, enviarPendentes]);

  // Montagem: token e caches só existem no cliente.
  useEffect(() => {
    const salvo = lerToken();
    const inicial = mesDeHojeNoAparelho();
    const cache = lerDadosEmCache(inicial);
    mesRef.current = inicial;
    tokenRef.current = salvo;
    setMes(inicial);
    setToken(salvo);
    if (cache) {
      setEstado({ dados: cache.dados, em: cache.em });
      setCategorias(cache.dados.categorias);
      setConfig(cache.dados.config);
    }
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
      const cache = lerDadosEmCache(novo);
      setEstado(cache ? { dados: cache.dados, em: cache.em } : null);
      void carregar(novo);
    },
    [carregar]
  );

  const hojeMes = mesDeHojeNoAparelho();
  const mesMinimo = somarMeses(hojeMes, -MESES_ATRAS);
  const mesMaximo = somarMeses(hojeMes, MESES_A_FRENTE);

  const mudarMes = (delta: -1 | 1) => {
    const novo = somarMeses(mes, delta);
    if (novo >= mesMinimo && novo <= mesMaximo) irParaMes(novo);
  };

  async function entrar(novoToken: string) {
    try {
      const r = await getDados(novoToken, mesRef.current);
      gravarToken(novoToken);
      tokenRef.current = novoToken;
      setErroToken(null);
      aplicarDados(r.dados);
      setSemConexao(false);
      setToken(novoToken);
      void enviarPendentes();
    } catch (e) {
      if (e instanceof LetiApiError) {
        if (e.naoAutorizado) throw new Error("Token inválido.");
        throw new Error(e.message);
      }
      throw new Error("Não foi possível verificar o token.");
    }
  }

  /** Editar, excluir e repassar exigem conexão (só criar passa pela fila offline). */
  const executar = useCallback(
    async (acao: Acao): Promise<AcaoResposta> => {
      try {
        const r = await postAcao(tokenRef.current, acao);
        adotarDados(r.dados);
        setSemConexao(false);
        return r;
      } catch (e) {
        if (e instanceof LetiApiError) {
          if (e.naoAutorizado) {
            sairPorToken(MSG_TOKEN);
            throw new Error(MSG_TOKEN);
          }
          if (e.tipo === "rede") {
            setSemConexao(true);
            throw new Error(MSG_OFFLINE);
          }
        }
        throw e instanceof Error ? e : new Error("Erro inesperado.");
      }
    },
    [adotarDados, sairPorToken]
  );

  const lancar = useCallback(
    async (compra: NovaCompra) => {
      const idLocal = gerarIdLocal();
      const registrarUso = () => {
        registrarUsoCategoria(compra.categoria);
        registrarLoja(compra.loja);
        gravarForma(compra.forma);
      };

      try {
        const r = await postAcao(tokenRef.current, { acao: "criar", idLocal, compra });
        registrarUso();
        // O backend decide a fatura (regra de fechamento): mostra o mês onde caiu.
        adotarDados(r.dados);
        setSemConexao(false);
        mostrarAviso(`Lançado em ${rotuloMes(r.mesAlvo)}`);
        setSheet(null);
      } catch (e) {
        if (e instanceof LetiApiError && e.tipo === "rede") {
          try {
            await enfileirar(compra, idLocal);
          } catch {
            throw new Error("Sem conexão e não foi possível guardar para depois.");
          }
          registrarUso();
          await atualizarListaPendentes();
          setSemConexao(true);
          mostrarAviso("Sem conexão: guardado como pendente");
          setSheet(null);
          return;
        }
        if (e instanceof LetiApiError && e.naoAutorizado) {
          sairPorToken(MSG_TOKEN);
          return;
        }
        throw e instanceof Error ? e : new Error("Erro inesperado.");
      }
    },
    [adotarDados, atualizarListaPendentes, mostrarAviso, sairPorToken]
  );

  const editar = useCallback(
    async (item: ItemFatura, compra: NovaCompra) => {
      await executar({ acao: "editar", id: item.id, mes: mesRef.current, compra });
      registrarUsoCategoria(compra.categoria);
      registrarLoja(compra.loja);
      mostrarAviso("Compra atualizada");
      setSheet(null);
    },
    [executar, mostrarAviso]
  );

  const excluir = useCallback(
    async (item: ItemFatura) => {
      await executar({ acao: "excluir", id: item.id, mes: mesRef.current });
      mostrarAviso("Compra excluída");
      setSheet(null);
    },
    [executar, mostrarAviso]
  );

  const repassar = useCallback(
    async (repassada: boolean) => {
      setRepassando(true);
      try {
        await executar({ acao: "repassar", mes: mesRef.current, repassada });
      } catch (e) {
        mostrarAviso(e instanceof Error ? e.message : "Erro inesperado.");
      } finally {
        setRepassando(false);
      }
    },
    [executar, mostrarAviso]
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
    montado && !!token && !sheet
  );

  if (!montado) {
    return <div className="despesas-leti min-h-dvh bg-d-bg" aria-busy="true" />;
  }

  if (!token) {
    return (
      <div className="despesas-leti min-h-dvh bg-d-bg text-d-fg">
        <ServiceWorkerRegister />
        <TokenGate erroInicial={erroToken} onEntrar={entrar} />
      </div>
    );
  }

  const aguardando = pendentes.filter((p) => !p.erro).length;
  const dados = estado?.dados ?? null;
  // Pendentes não têm mês calculado pelo servidor: aparecem no mês em que a compra cairia.
  const pendentesDoMes = pendentes.filter((p) => p.compra.faturaInicial === mes);

  const lojasConhecidas = (() => {
    const vistas = new Set<string>();
    const lista: string[] = [];
    for (const l of [...lerLojas(), ...(dados?.fatura.itens.map((i) => i.loja) ?? [])]) {
      const chave = l.trim().toLowerCase();
      if (!chave || vistas.has(chave)) continue;
      vistas.add(chave);
      lista.push(l.trim());
    }
    return lista;
  })();

  return (
    <div className="despesas-leti min-h-dvh bg-d-bg text-d-fg">
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
                {estado ? ` · dados de há ${haQuantoTempo(estado.em)}` : ""}
              </p>
            )}
            {aguardando > 0 && (
              <p className="text-d-warn">
                {aguardando === 1
                  ? "1 compra aguardando envio"
                  : `${aguardando} compras aguardando envio`}
              </p>
            )}
          </div>
        )}

        {dados ? (
          <>
            <FaturaTopo
              fatura={dados.fatura}
              hoje={dados.hoje}
              podeAnterior={somarMeses(mes, -1) >= mesMinimo}
              podeProximo={somarMeses(mes, 1) <= mesMaximo}
              repassando={repassando}
              onMes={mudarMes}
              onRepassar={(r) => void repassar(r)}
            />
            <ProximasFaturas
              proximas={dados.proximas}
              mesSelecionado={mes}
              hoje={dados.hoje}
              onEscolher={(m) => {
                irParaMes(m);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
            <GastosLista
              itens={dados.fatura.itens}
              pendentes={pendentesDoMes}
              onAbrir={(item) => setSheet({ tipo: "detalhe", item })}
              onDescartar={descartarPendente}
            />
            <CategoriasLista categorias={dados.fatura.porCategoria} />
          </>
        ) : (
          <div className="pt-2 text-center">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => mudarMes(-1)}
                disabled={somarMeses(mes, -1) < mesMinimo}
                aria-label="Mês anterior"
                className="flex size-11 items-center justify-center rounded-full text-2xl text-d-muted active:bg-d-line disabled:opacity-30"
              >
                ‹
              </button>
              <h1 className="text-lg font-semibold">{rotuloMes(mes)}</h1>
              <button
                type="button"
                onClick={() => mudarMes(1)}
                disabled={somarMeses(mes, 1) > mesMaximo}
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

      {!sheet && (
        <button
          type="button"
          onClick={() => setSheet({ tipo: "novo" })}
          aria-label="Nova compra"
          className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-30 flex size-16 items-center justify-center rounded-full bg-d-accent text-4xl font-light text-d-accent-fg shadow-xl active:scale-95"
        >
          +
        </button>
      )}

      {sheet?.tipo === "novo" && (
        <LancarSheet
          categorias={categorias}
          config={config}
          lojasConhecidas={lojasConhecidas}
          onFechar={() => setSheet(null)}
          onSalvar={lancar}
        />
      )}

      {sheet?.tipo === "editar" && (
        <LancarSheet
          categorias={categorias}
          config={config}
          lojasConhecidas={lojasConhecidas}
          inicial={sheet.item}
          onFechar={() => setSheet(null)}
          onSalvar={(compra) => editar(sheet.item, compra)}
        />
      )}

      {sheet?.tipo === "detalhe" && (
        <DetalheSheet
          item={sheet.item}
          mes={mes}
          hoje={dados?.hoje ?? ""}
          onFechar={() => setSheet(null)}
          onEditar={() => setSheet({ tipo: "editar", item: sheet.item })}
          onExcluir={() => excluir(sheet.item)}
        />
      )}
    </div>
  );
}
