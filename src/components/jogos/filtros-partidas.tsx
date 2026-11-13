"use client";

import {
  FILTROS_VAZIOS,
  intervaloInvertido,
  temFiltroAtivo,
  temFiltroDeData,
  temFiltroDeJogador,
  temFiltroDeLocal,
  type FiltrosPartidas as Filtros,
  type OpcaoFiltro,
} from "@/lib/jogos-filtros";
import { cn } from "@/lib/utils";
import { FiltroMultiplo, type TextosFiltro } from "./filtro-multiplo";

interface FiltrosPartidasProps {
  filtros: Filtros;
  onChange: (filtros: Filtros) => void;
  /** Menor e maior data das partidas carregadas, usados como limites do seletor. */
  limites: { min: string; max: string } | null;
  opcoesLocais: OpcaoFiltro[];
  opcoesJogadores: OpcaoFiltro[];
  /** Partidas dentro dos filtros e total carregado (mesma medida das estatísticas). */
  mostradas: number;
  total: number;
}

const CLASSE_INPUT =
  "w-full min-w-0 rounded-xl border border-d-line bg-d-card px-3 py-2.5 text-base outline-none focus:border-d-accent";

const TEXTOS_LOCAL: TextosFiltro = {
  titulo: "Local",
  nenhumMarcado: "Todos os locais",
  modoIncluir: "Somente nestes",
  modoExcluir: "Todos, exceto estes",
  resumoIncluir: (nomes) =>
    nomes.length === 1 ? `Somente em ${nomes[0]}` : `Somente em ${nomes.length} locais`,
  resumoExcluir: (nomes) =>
    nomes.length === 1 ? `Todos, exceto ${nomes[0]}` : `Todos, exceto ${nomes.length} locais`,
  descricaoModo: "Como aplicar os locais marcados",
  placeholderBusca: "Buscar local…",
  nenhumEncontrado: "Nenhum local encontrado.",
  desmarcarTodos: "Desmarcar todos os locais",
};

const TEXTOS_JOGADOR: TextosFiltro = {
  titulo: "Jogador",
  nenhumMarcado: "Todos os jogadores",
  modoIncluir: "Com algum destes",
  modoExcluir: "Sem nenhum destes",
  resumoIncluir: (nomes) =>
    nomes.length === 1 ? `Com ${nomes[0]}` : `Com algum de ${nomes.length} jogadores`,
  resumoExcluir: (nomes) =>
    nomes.length === 1 ? `Sem ${nomes[0]}` : `Sem nenhum de ${nomes.length} jogadores`,
  descricaoModo: "Como aplicar os jogadores marcados",
  placeholderBusca: "Buscar jogador…",
  nenhumEncontrado: "Nenhum jogador encontrado.",
  desmarcarTodos: "Desmarcar todos os jogadores",
};

function descreverFiltrosAtivos(quantidade: number): string {
  return quantidade === 1 ? "1 filtro ativo" : `${quantidade} filtros ativos`;
}

export function FiltrosPartidas({
  filtros,
  onChange,
  limites,
  opcoesLocais,
  opcoesJogadores,
  mostradas,
  total,
}: FiltrosPartidasProps) {
  const ativo = temFiltroAtivo(filtros);
  const invertido = intervaloInvertido(filtros);
  const quantidadeAtivos =
    (temFiltroDeData(filtros) ? 1 : 0) +
    (temFiltroDeLocal(filtros) ? 1 : 0) +
    (temFiltroDeJogador(filtros) ? 1 : 0);

  return (
    <details className="group/filtros rounded-xl border border-d-line bg-d-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-base font-semibold">Filtros</span>
          <span
            role="status"
            className={cn(
              "block text-sm",
              ativo ? "text-d-accent" : "text-d-muted"
            )}
          >
            {!ativo
              ? "Nenhum filtro ativo"
              : invertido
                ? descreverFiltrosAtivos(quantidadeAtivos)
                : `${descreverFiltrosAtivos(quantidadeAtivos)} · Mostrando ${mostradas} de ${total} partidas`}
          </span>
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="size-5 shrink-0 text-d-muted transition-transform group-open/filtros:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>

      <div className="px-4 pb-4">
        {ativo && (
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => onChange(FILTROS_VAZIOS)}
              className="text-sm text-d-accent underline underline-offset-2"
            >
              Limpar filtros
            </button>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium">Período</h3>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="filtro-data-inicio"
                className="mb-1 block text-xs text-d-muted"
              >
                De
              </label>
              <input
                id="filtro-data-inicio"
                type="date"
                value={filtros.dataInicio}
                min={limites?.min}
                max={filtros.dataFim || limites?.max}
                onChange={(e) =>
                  onChange({ ...filtros, dataInicio: e.target.value })
                }
                className={CLASSE_INPUT}
              />
            </div>
            <div>
              <label
                htmlFor="filtro-data-fim"
                className="mb-1 block text-xs text-d-muted"
              >
                Até
              </label>
              <input
                id="filtro-data-fim"
                type="date"
                value={filtros.dataFim}
                min={filtros.dataInicio || limites?.min}
                max={limites?.max}
                onChange={(e) =>
                  onChange({ ...filtros, dataFim: e.target.value })
                }
                className={CLASSE_INPUT}
              />
            </div>
          </div>
          {invertido && (
            <p role="alert" className="mt-3 text-sm text-d-warn">
              A data inicial é depois da data final.
            </p>
          )}
        </div>

        <div className="mt-4 border-t border-d-line pt-4">
          <FiltroMultiplo
            textos={TEXTOS_LOCAL}
            opcoes={opcoesLocais}
            selecionados={filtros.locais}
            modo={filtros.modoLocais}
            onChange={(locais, modoLocais) =>
              onChange({ ...filtros, locais, modoLocais })
            }
          />
        </div>

        <div className="mt-4 border-t border-d-line pt-4">
          <FiltroMultiplo
            textos={TEXTOS_JOGADOR}
            opcoes={opcoesJogadores}
            selecionados={filtros.jogadores}
            modo={filtros.modoJogadores}
            onChange={(jogadores, modoJogadores) =>
              onChange({ ...filtros, jogadores, modoJogadores })
            }
          />
        </div>
      </div>
    </details>
  );
}
