"use client";

import { cn } from "@/lib/utils";
import { formatarMoeda } from "@/lib/despesas-format";
import { nomeMes, mesCurto } from "@/lib/despesas-leti-parcelas";
import type { ProximaFatura } from "@/lib/despesas-leti-types";

interface ProximasFaturasProps {
  proximas: ProximaFatura[];
  mesSelecionado: string;
  hoje: string;
  onEscolher: (mes: string) => void;
}

export function ProximasFaturas({
  proximas,
  mesSelecionado,
  hoje,
  onEscolher,
}: ProximasFaturasProps) {
  const maior = Math.max(...proximas.map((p) => p.total), 0);
  if (maior === 0) return null;

  return (
    <section aria-labelledby="titulo-proximas" className="mt-8">
      <h2 id="titulo-proximas" className="mb-3 text-sm font-semibold text-d-muted">
        Próximas faturas
      </h2>
      <ul className="divide-y divide-d-line overflow-hidden rounded-2xl bg-d-card">
        {proximas.map((p) => (
          <li key={p.mes}>
            <button
              type="button"
              onClick={() => onEscolher(p.mes)}
              aria-label={`Ver ${nomeMes(p.mes)}`}
              aria-current={p.mes === mesSelecionado ? "true" : undefined}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left active:bg-d-line",
                p.mes === mesSelecionado &&
                  "bg-d-accent/15 shadow-[inset_4px_0_0_var(--d-accent)]"
              )}
            >
              <span
                className={cn(
                  "w-14 shrink-0 text-sm",
                  p.mes === mesSelecionado ? "font-bold" : "font-medium"
                )}
              >
                {mesCurto(p.mes, hoje)}
              </span>
              <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-d-line">
                <span
                  className={cn(
                    "block h-full rounded-full",
                    p.repassada ? "bg-d-ok" : "bg-d-accent"
                  )}
                  style={{ width: `${maior > 0 ? (p.total / maior) * 100 : 0}%` }}
                />
              </span>
              <span className="w-24 shrink-0 text-right text-sm tabular-nums">
                {p.total > 0 ? formatarMoeda(p.total) : "—"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
