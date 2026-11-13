"use client";

import { useMemo } from "react";
import { calcularMarcos } from "@/lib/jogos-marcos";
import type { Partida } from "@/lib/jogos-types";
import { CartaoPartida } from "./cartao-partida";
import { QuadroModal } from "./quadro-modal";

interface QuadroMarcosProps {
  /** Todas as partidas carregadas (o quadro ignora os filtros da página). */
  partidas: Partida[];
}

function textoFaltam(faltam: number): string {
  return faltam === 1
    ? "Falta 1 jogo diferente"
    : `Faltam ${faltam} jogos diferentes`;
}

export function QuadroMarcos({ partidas }: QuadroMarcosProps) {
  const { jogosDiferentes, marcos } = useMemo(
    () => calcularMarcos(partidas),
    [partidas]
  );
  const alcancados = marcos.filter((m) => m.partida).length;

  return (
    <QuadroModal
      tom="gold"
      titulo="Marcos de jogos diferentes"
      descricaoBotao={`${alcancados} de ${marcos.length} marcos alcançados`}
      subtitulo={
        <>
          Você já jogou{" "}
          <strong className="font-semibold text-d-fg tabular-nums">
            {jogosDiferentes}
          </strong>{" "}
          jogos diferentes.
        </>
      }
    >
      <p className="text-xs text-d-muted">
        Cada marco mostra a primeira partida do jogo que fez a contagem chegar
        àquele número, considerando todas as partidas carregadas (os filtros da
        página não se aplicam). O BGG não guarda a hora da partida, então jogos
        que estrearam no mesmo dia são ordenados pelo registro no BGG.
      </p>

      <ol className="mt-4 space-y-4">
        {marcos.map((marco) => (
          <li key={marco.numero}>
            <p className="mb-2 text-sm font-semibold">
              <span className="tabular-nums">{marco.numero}º</span> jogo
              diferente
            </p>
            {marco.partida ? (
              <>
                <CartaoPartida partida={marco.partida} />
                {marco.estreiasNoDia > 1 && (
                  <p className="mt-2 text-xs text-d-warn">
                    {marco.estreiasNoDia} jogos diferentes estrearam neste dia.
                    A ordem entre eles segue o registro no BGG e pode não ser a
                    real.
                  </p>
                )}
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-d-line p-4 text-sm text-d-muted">
                Ainda não alcançado. {textoFaltam(marco.faltam)}.
              </p>
            )}
          </li>
        ))}
      </ol>
    </QuadroModal>
  );
}
