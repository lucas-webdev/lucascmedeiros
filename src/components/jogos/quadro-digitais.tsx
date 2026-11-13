"use client";

import { useMemo, useState } from "react";
import {
  NOMES_LOCAIS_DIGITAIS,
  formatarData,
  listarJogosApenasDigitais,
} from "@/lib/jogos-stats";
import type { Partida } from "@/lib/jogos-types";
import { QuadroModal } from "./quadro-modal";

interface QuadroDigitaisProps {
  /**
   * Partidas dentro dos filtros atuais — as mesmas que alimentam os cards, para
   * a quantidade da lista ser sempre igual ao "(N apenas digitais)" do card.
   */
  partidas: Partida[];
  /** Há algum filtro aplicado (só para avisar no texto do quadro). */
  filtrado: boolean;
}

/** Minúsculas e sem acentos, para a busca não depender da grafia. */
function paraBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Abaixo disso a lista é curta o bastante para dispensar a busca. */
const MIN_JOGOS_PARA_BUSCA = 8;

function textoJogos(n: number): string {
  if (n === 0) return "Nenhum jogo";
  return n === 1 ? "1 jogo" : `${n} jogos`;
}

export function QuadroDigitais({ partidas, filtrado }: QuadroDigitaisProps) {
  const [busca, setBusca] = useState("");
  const jogos = useMemo(() => listarJogosApenasDigitais(partidas), [partidas]);
  const totalPartidas = useMemo(
    () => jogos.reduce((soma, jogo) => soma + jogo.partidas, 0),
    [jogos]
  );

  const termo = paraBusca(busca.trim());
  const exibidos = termo
    ? jogos.filter((jogo) => paraBusca(jogo.nome).includes(termo))
    : jogos;

  return (
    <QuadroModal
      tom="cyan"
      titulo="Jogos apenas digitais"
      descricaoBotao={textoJogos(jogos.length)}
      subtitulo={
        <>
          <strong className="font-semibold text-d-fg tabular-nums">
            {textoJogos(jogos.length)}
          </strong>{" "}
          em {totalPartidas} {totalPartidas === 1 ? "partida" : "partidas"}.
        </>
      }
    >
      <p className="text-xs text-d-muted">
        Jogos que nunca foram jogados fora de {NOMES_LOCAIS_DIGITAIS.join(", ")}.{" "}
        {filtrado
          ? "Considera só as partidas dentro dos filtros atuais."
          : "Considera todas as partidas carregadas."}{" "}
        Partidas sem local informado contam como fora do digital.
      </p>

      {jogos.length > MIN_JOGOS_PARA_BUSCA && (
        <div className="mt-4">
          <label htmlFor="busca-jogos-digitais" className="sr-only">
            Buscar jogo
          </label>
          <input
            id="busca-jogos-digitais"
            type="search"
            autoComplete="off"
            placeholder="Buscar jogo…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl border border-d-line bg-d-card px-3 py-2.5 text-base outline-none focus:border-d-accent"
          />
        </div>
      )}

      {jogos.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-d-line p-4 text-sm text-d-muted">
          Nenhum jogo apenas digital nas partidas consideradas.
        </p>
      ) : exibidos.length === 0 ? (
        <p className="mt-4 text-sm text-d-muted">Nenhum jogo encontrado.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {exibidos.map((jogo) => (
            <li
              key={jogo.id}
              className="rounded-xl border border-d-line bg-d-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 text-base font-semibold leading-snug break-words">
                  {jogo.nome || "(sem nome)"}
                </h3>
                <span className="shrink-0 text-sm text-d-muted tabular-nums">
                  {jogo.partidas} {jogo.partidas === 1 ? "partida" : "partidas"}
                </span>
              </div>

              {jogo.primeira && (
                <p className="mt-1 text-sm text-d-muted">
                  {jogo.primeira === jogo.ultima
                    ? `Jogado em ${formatarData(jogo.primeira)}`
                    : `Primeira: ${formatarData(jogo.primeira)} · Última: ${formatarData(jogo.ultima)}`}
                </p>
              )}

              <ul className="mt-3 flex flex-wrap gap-1.5">
                {jogo.locais.map((local) => (
                  <li
                    key={local}
                    className="rounded-full bg-d-line px-2.5 py-1 text-sm"
                  >
                    {local}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </QuadroModal>
  );
}
