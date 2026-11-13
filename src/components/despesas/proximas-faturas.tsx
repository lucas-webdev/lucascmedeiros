"use client";

import { formatarMoeda } from "@/lib/despesas-format";
import type { FaturaPrevista } from "@/lib/despesas-types";

interface ProximasFaturasProps {
  faturas: FaturaPrevista[];
  onEscolher: (mes: string) => void;
}

export function ProximasFaturas({ faturas, onEscolher }: ProximasFaturasProps) {
  if (faturas.length === 0) return null;

  return (
    <section aria-labelledby="titulo-proximas" className="mt-8">
      <h2 id="titulo-proximas" className="mb-3 text-sm font-semibold text-d-muted">
        Próximas faturas
      </h2>
      <ul className="divide-y divide-d-line overflow-hidden rounded-2xl bg-d-card">
        {faturas.map((f) => {
          const navegavel = f.navegavel !== false;
          const conteudo = (
            <>
              <span className="min-w-0">
                <span className="block font-medium">
                  {navegavel ? f.mes : `${f.mes} ${f.ano ?? ""}`.trim()}
                </span>
                <span className="block truncate text-xs text-d-muted tabular-nums">
                  {f.cartoes.map((c) => `${c.conta} ${formatarMoeda(c.total)}`).join(" · ")}
                </span>
              </span>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatarMoeda(f.total)}
              </span>
            </>
          );
          const classe = "flex w-full items-center justify-between gap-3 px-4 py-3 text-left";
          return (
            <li key={`${f.mes}-${f.ano ?? ""}`}>
              {navegavel ? (
                <button
                  type="button"
                  onClick={() => onEscolher(f.mes)}
                  aria-label={`Ver ${f.mes}`}
                  className={`${classe} active:bg-d-line`}
                >
                  {conteudo}
                </button>
              ) : (
                <div className={classe}>{conteudo}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
