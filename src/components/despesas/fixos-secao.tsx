"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatarMoeda } from "@/lib/despesas-format";
import type { FixoPendente } from "@/lib/despesas-types";

export function FixosSecao({ fixos }: { fixos: FixoPendente[] }) {
  const [aberto, setAberto] = useState(false);
  const total = fixos.reduce((soma, f) => soma + f.valor, 0);

  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between rounded-2xl bg-d-card px-4 py-3.5 text-left"
      >
        <span>
          <span className="block text-sm font-semibold">Fixos a pagar</span>
          <span className="block text-xs text-d-muted">
            {fixos.length === 0
              ? "tudo pago"
              : `${fixos.length} ${fixos.length === 1 ? "pendente" : "pendentes"}`}
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="font-medium tabular-nums">{formatarMoeda(total)}</span>
          <span
            aria-hidden
            className={cn("text-d-muted transition-transform", aberto && "rotate-90")}
          >
            ›
          </span>
        </span>
      </button>

      {aberto && fixos.length > 0 && (
        <ul className="mt-2 divide-y divide-d-line overflow-hidden rounded-2xl bg-d-card">
          {fixos.map((f) => (
            <li
              key={f.chave}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{f.descricao}</span>
                <span className="block text-xs text-d-muted">{f.categoria}</span>
              </span>
              <span className="shrink-0 text-sm tabular-nums">
                {formatarMoeda(f.valor)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
