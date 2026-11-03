"use client";

import { useState } from "react";
import { formatarMoeda } from "@/lib/despesas-format";
import type { LancamentoPendente, UltimoLancamento } from "@/lib/despesas-types";
import { LancamentoItem } from "./lancamento-item";

const PASSO = 5;

interface UltimosSecaoProps {
  ultimos: UltimoLancamento[];
  pendentes: LancamentoPendente[];
  onDescartar: (idLocal: string) => void;
}

function dataCurta(dataISO: string): string {
  return `${dataISO.slice(8, 10)}/${dataISO.slice(5, 7)}`;
}

export function UltimosSecao({ ultimos, pendentes, onDescartar }: UltimosSecaoProps) {
  const [visiveis, setVisiveis] = useState(PASSO);
  if (ultimos.length === 0 && pendentes.length === 0) return null;

  return (
    <section aria-labelledby="titulo-ultimos" className="mt-8">
      <h2 id="titulo-ultimos" className="mb-3 text-sm font-semibold text-d-muted">
        Últimos lançamentos
      </h2>
      <ul className="divide-y divide-d-line overflow-hidden rounded-2xl bg-d-card">
        {pendentes.map((p) => (
          <li key={p.idLocal} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="min-w-0">
              <span className="block truncate font-medium">{p.lancamento.descricao}</span>
              <span className="block text-xs text-d-muted">
                {p.lancamento.categoria} · {dataCurta(p.lancamento.data)} ·{" "}
                {p.erro ? (
                  <span className="text-d-bad">recusado: {p.erro}</span>
                ) : (
                  <span className="text-d-warn">pendente de envio</span>
                )}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <span className="text-sm tabular-nums">
                {formatarMoeda(p.lancamento.valor)}
              </span>
              {p.erro && (
                <button
                  type="button"
                  onClick={() => onDescartar(p.idLocal)}
                  aria-label={`Descartar ${p.lancamento.descricao}`}
                  className="flex size-9 items-center justify-center rounded-full text-d-muted active:bg-d-line"
                >
                  ✕
                </button>
              )}
            </span>
          </li>
        ))}
        {ultimos.slice(0, visiveis).map((u, i) => (
          <LancamentoItem key={`${u.descricao}-${u.valor}-${i}`} lancamento={u} />
        ))}
      </ul>
      {ultimos.length > visiveis && (
        <button
          type="button"
          onClick={() => setVisiveis((v) => v + PASSO)}
          className="mt-3 w-full rounded-xl py-2 text-center text-sm font-medium text-d-accent active:bg-d-line"
        >
          Mostrar mais {Math.min(PASSO, ultimos.length - visiveis)}
        </button>
      )}
    </section>
  );
}
