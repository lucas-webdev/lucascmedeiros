"use client";

import { formatarMoeda } from "@/lib/despesas-format";
import type { LancamentoPendente, UltimoLancamento } from "@/lib/despesas-types";

interface UltimosSecaoProps {
  ultimos: UltimoLancamento[];
  pendentes: LancamentoPendente[];
  onDescartar: (idLocal: string) => void;
}

function dataCurta(dataISO: string): string {
  return `${dataISO.slice(8, 10)}/${dataISO.slice(5, 7)}`;
}

export function UltimosSecao({ ultimos, pendentes, onDescartar }: UltimosSecaoProps) {
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
        {ultimos.map((u, i) => (
          <li
            key={`${u.descricao}-${u.valor}-${i}`}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{u.descricao}</span>
              <span className="block truncate text-xs text-d-muted">
                {[u.data, u.categoria, `${u.forma} ${u.conta}`.trim(), u.obs]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <span className="shrink-0 text-sm tabular-nums">
              {formatarMoeda(u.valor)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
