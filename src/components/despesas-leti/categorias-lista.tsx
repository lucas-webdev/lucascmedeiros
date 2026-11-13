"use client";

import { formatarMoeda } from "@/lib/despesas-format";
import type { TotalCategoria } from "@/lib/despesas-leti-types";

export function CategoriasLista({ categorias }: { categorias: TotalCategoria[] }) {
  if (categorias.length === 0) return null;
  const maior = Math.max(...categorias.map((c) => c.total), 0);

  return (
    <section aria-labelledby="titulo-categorias" className="mt-8">
      <h2 id="titulo-categorias" className="mb-3 text-sm font-semibold text-d-muted">
        Por categoria
      </h2>
      <ul className="space-y-3 rounded-2xl bg-d-card px-4 py-4">
        {categorias.map((c) => (
          <li key={c.categoria}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{c.categoria}</span>
              <span className="tabular-nums">{formatarMoeda(c.total)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-d-line">
              <div
                className="h-full rounded-full bg-d-accent"
                style={{ width: `${maior > 0 ? (c.total / maior) * 100 : 0}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
