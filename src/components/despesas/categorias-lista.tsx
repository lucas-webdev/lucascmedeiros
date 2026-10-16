"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatarMoeda } from "@/lib/despesas-format";
import type { CategoriaPainel } from "@/lib/despesas-types";

type Nivel = "ok" | "atencao" | "alerta";

function nivelDe(c: CategoriaPainel): Nivel {
  const pct = c.pct ?? (c.realizado > 0 ? Infinity : 0);
  if (pct > 100) return "alerta";
  if (pct >= 80) return "atencao";
  return "ok";
}

const COR_BARRA: Record<Nivel, string> = {
  ok: "bg-d-ok",
  atencao: "bg-d-warn",
  alerta: "bg-d-bad",
};

const COR_TEXTO: Record<Nivel, string> = {
  ok: "text-d-muted",
  atencao: "text-d-warn",
  alerta: "text-d-bad",
};

/** Estouradas primeiro; sem previsto mas com gasto conta como estouro. */
function ordenar(categorias: CategoriaPainel[]): CategoriaPainel[] {
  const chave = (c: CategoriaPainel) =>
    c.pct ?? (c.realizado > 0 ? Infinity : -1);
  return [...categorias].sort((a, b) => chave(b) - chave(a));
}

export function CategoriasLista({
  categorias,
}: {
  categorias: CategoriaPainel[];
}) {
  const ordenadas = useMemo(() => ordenar(categorias), [categorias]);

  return (
    <section aria-labelledby="titulo-categorias" className="mt-8">
      <h2 id="titulo-categorias" className="mb-3 text-sm font-semibold text-d-muted">
        Categorias
      </h2>
      <ul className="divide-y divide-d-line overflow-hidden rounded-2xl bg-d-card">
        {ordenadas.map((c) => {
          const nivel = nivelDe(c);
          const largura = Math.min(c.pct ?? (c.realizado > 0 ? 100 : 0), 100);
          return (
            <li key={c.nome} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate font-medium">{c.nome}</span>
                <span
                  className={cn(
                    "shrink-0 text-sm font-medium tabular-nums",
                    COR_TEXTO[nivel]
                  )}
                >
                  {c.disponivel < 0
                    ? `${formatarMoeda(-c.disponivel)} acima`
                    : `${formatarMoeda(c.disponivel)} livre`}
                </span>
              </div>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-d-line"
                role="progressbar"
                aria-label={`${c.nome}: ${Math.round(c.pct ?? 0)}% do previsto`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(largura)}
              >
                <div
                  className={cn("h-full rounded-full", COR_BARRA[nivel])}
                  style={{ width: `${largura}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-d-muted tabular-nums">
                {formatarMoeda(c.realizado)} de {formatarMoeda(c.previsto)}
                {c.pct !== null && ` · ${Math.round(c.pct)}%`}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
