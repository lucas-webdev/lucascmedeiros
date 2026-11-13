"use client";

import { useId, useState } from "react";
import type { ModoFiltro, OpcaoFiltro } from "@/lib/jogos-filtros";
import { cn } from "@/lib/utils";

/** Tudo o que muda de um filtro de lista (local, jogador...) para outro. */
export interface TextosFiltro {
  titulo: string;
  /** Resumo quando nada está marcado. */
  nenhumMarcado: string;
  modoIncluir: string;
  modoExcluir: string;
  /** Resumo com a seleção; recebe os rótulos dos itens marcados. */
  resumoIncluir: (nomes: string[]) => string;
  resumoExcluir: (nomes: string[]) => string;
  /** Leitura de tela para o seletor de modo. */
  descricaoModo: string;
  placeholderBusca: string;
  nenhumEncontrado: string;
  desmarcarTodos: string;
}

interface FiltroMultiploProps {
  textos: TextosFiltro;
  opcoes: OpcaoFiltro[];
  /** Chaves das opções marcadas. */
  selecionados: string[];
  modo: ModoFiltro;
  onChange: (selecionados: string[], modo: ModoFiltro) => void;
}

/** Abaixo disso a lista é curta o bastante para dispensar a busca. */
const MIN_OPCOES_PARA_BUSCA = 8;

/** Minúsculas e sem acentos, para a busca não depender da grafia. */
function paraBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function FiltroMultiplo({
  textos,
  opcoes,
  selecionados,
  modo,
  onChange,
}: FiltroMultiploProps) {
  const idBase = useId();
  const [busca, setBusca] = useState("");

  const termo = paraBusca(busca.trim());
  const exibidas = termo
    ? opcoes.filter((o) =>
        paraBusca(`${o.rotulo} ${o.detalhe ?? ""}`).includes(termo)
      )
    : opcoes;

  const nomesMarcados = selecionados.map(
    (chave) => opcoes.find((o) => o.chave === chave)?.rotulo ?? chave
  );
  const resumo =
    selecionados.length === 0
      ? textos.nenhumMarcado
      : modo === "incluir"
        ? textos.resumoIncluir(nomesMarcados)
        : textos.resumoExcluir(nomesMarcados);

  function alternar(chave: string) {
    const novos = selecionados.includes(chave)
      ? selecionados.filter((c) => c !== chave)
      : [...selecionados, chave];
    onChange(novos, modo);
  }

  const modos: { valor: ModoFiltro; rotulo: string }[] = [
    { valor: "incluir", rotulo: textos.modoIncluir },
    { valor: "excluir", rotulo: textos.modoExcluir },
  ];

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-sm font-medium">{textos.titulo}</span>
          <span
            className={cn(
              "block truncate text-sm",
              selecionados.length > 0 ? "text-d-accent" : "text-d-muted"
            )}
          >
            {resumo}
          </span>
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-5 shrink-0 text-d-muted transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>

      <div className="mt-3">
        <fieldset>
          <legend className="sr-only">{textos.descricaoModo}</legend>
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-d-line p-1">
            {modos.map(({ valor, rotulo }) => (
              <label
                key={valor}
                className={cn(
                  "cursor-pointer rounded-lg px-3 py-2 text-center text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-d-accent",
                  modo === valor
                    ? "bg-d-accent text-d-accent-fg"
                    : "text-d-muted"
                )}
              >
                <input
                  type="radio"
                  name={idBase}
                  value={valor}
                  checked={modo === valor}
                  onChange={() => onChange(selecionados, valor)}
                  className="sr-only"
                />
                {rotulo}
              </label>
            ))}
          </div>
        </fieldset>

        {opcoes.length > MIN_OPCOES_PARA_BUSCA && (
          <div className="mt-3">
            <label htmlFor={`${idBase}-busca`} className="sr-only">
              {textos.placeholderBusca}
            </label>
            <input
              id={`${idBase}-busca`}
              type="search"
              autoComplete="off"
              placeholder={textos.placeholderBusca}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-d-line bg-d-card px-3 py-2.5 text-base outline-none focus:border-d-accent"
            />
          </div>
        )}

        {exibidas.length === 0 ? (
          <p className="mt-3 text-sm text-d-muted">{textos.nenhumEncontrado}</p>
        ) : (
          <ul className="mt-3 max-h-64 divide-y divide-d-line overflow-y-auto rounded-xl border border-d-line">
            {exibidas.map((opcao) => (
              <li key={opcao.chave}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selecionados.includes(opcao.chave)}
                    onChange={() => alternar(opcao.chave)}
                    className="size-5 shrink-0 accent-d-accent"
                  />
                  <span className="min-w-0 flex-1 text-sm break-words">
                    {opcao.rotulo}
                    {opcao.detalhe && (
                      <span className="ml-1.5 text-xs text-d-muted">
                        {opcao.detalhe}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-sm text-d-muted tabular-nums">
                    {opcao.quantidade}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}

        {selecionados.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([], modo)}
            className="mt-3 text-sm text-d-accent underline underline-offset-2"
          >
            {textos.desmarcarTodos}
          </button>
        )}
      </div>
    </details>
  );
}
