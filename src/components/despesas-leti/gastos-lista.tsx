"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatarMoeda } from "@/lib/despesas-format";
import { dataCurta } from "@/lib/despesas-leti-parcelas";
import {
  FORMA_CREDITO,
  type CompraPendente,
  type ItemFatura,
} from "@/lib/despesas-leti-types";

type Filtro = "todos" | "credito" | "avista";

const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" },
  { id: "credito", rotulo: "Crédito" },
  { id: "avista", rotulo: "Pix e débito" },
];

interface GastosListaProps {
  itens: ItemFatura[];
  pendentes: CompraPendente[];
  onAbrir: (item: ItemFatura) => void;
  onDescartar: (idLocal: string) => void;
}

function detalhe(item: ItemFatura): string {
  const base = [item.categoria, dataCurta(item.data)];
  if (item.forma === FORMA_CREDITO) {
    base.push(item.parcelas > 1 ? `Parcela ${item.parcela}/${item.parcelas}` : "à vista no crédito");
  } else {
    base.push(item.forma);
  }
  return base.join(" · ");
}

export function GastosLista({ itens, pendentes, onAbrir, onDescartar }: GastosListaProps) {
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const visiveis = itens.filter((i) =>
    filtro === "todos"
      ? true
      : filtro === "credito"
        ? i.forma === FORMA_CREDITO
        : i.forma !== FORMA_CREDITO
  );

  return (
    <section aria-labelledby="titulo-gastos" className="mt-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="titulo-gastos" className="text-sm font-semibold text-d-muted">
          Lançamentos
        </h2>
        <div className="flex gap-1.5">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filtro === f.id}
              onClick={() => setFiltro(f.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors active:opacity-70",
                filtro === f.id
                  ? "border-d-accent bg-d-accent font-semibold text-d-accent-fg"
                  : "border-d-line bg-d-card text-d-fg"
              )}
            >
              {f.rotulo}
            </button>
          ))}
        </div>
      </div>

      {visiveis.length === 0 && pendentes.length === 0 ? (
        <p className="rounded-2xl bg-d-card px-4 py-6 text-center text-sm text-d-muted">
          Nada lançado neste mês.
        </p>
      ) : (
        <ul className="divide-y divide-d-line overflow-hidden rounded-2xl bg-d-card">
          {pendentes.map((p) => (
            <li key={p.idLocal} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block truncate font-medium">{p.compra.loja}</span>
                <span className="block text-xs text-d-muted">
                  {p.compra.categoria} · {dataCurta(p.compra.data)} ·{" "}
                  {p.erro ? (
                    <span className="text-d-bad">recusado: {p.erro}</span>
                  ) : (
                    <span className="text-d-warn">pendente de envio</span>
                  )}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <span className="text-sm tabular-nums">{formatarMoeda(p.compra.valor)}</span>
                {p.erro && (
                  <button
                    type="button"
                    onClick={() => onDescartar(p.idLocal)}
                    aria-label={`Descartar ${p.compra.loja}`}
                    className="flex size-9 items-center justify-center rounded-full text-d-muted active:bg-d-line"
                  >
                    ✕
                  </button>
                )}
              </span>
            </li>
          ))}
          {visiveis.map((item) => (
            <li key={`${item.id}-${item.parcela}`}>
              <button
                type="button"
                onClick={() => onAbrir(item)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-d-line"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.loja}</span>
                  <span className="block truncate text-xs text-d-muted">{detalhe(item)}</span>
                </span>
                <span className="shrink-0 text-sm tabular-nums">{formatarMoeda(item.valor)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
