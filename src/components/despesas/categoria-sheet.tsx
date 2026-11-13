"use client";

import { useEffect } from "react";
import { formatarMoeda } from "@/lib/despesas-format";
import type { UltimoLancamento } from "@/lib/despesas-types";
import { LancamentoItem } from "./lancamento-item";

interface CategoriaSheetProps {
  categoria: string;
  mes: string;
  lancamentos: UltimoLancamento[];
  /** `false` quando o servidor não mandou a lista completa do mês (só os 15 últimos). */
  completo: boolean;
  onFechar: () => void;
}

export function CategoriaSheet({ categoria, mes, lancamentos, completo, onFechar }: CategoriaSheetProps) {
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onFechar]);

  const total = lancamentos.reduce((s, l) => s + l.valor, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-label={categoria}>
      <button type="button" aria-label="Fechar" onClick={onFechar} className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-3xl bg-d-bg shadow-2xl">
        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{categoria}</h2>
            <p className="text-xs text-d-muted tabular-nums">
              {mes} · {lancamentos.length} {lancamentos.length === 1 ? "lançamento" : "lançamentos"} ·{" "}
              {formatarMoeda(total)}
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-d-muted active:bg-d-line"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
          {lancamentos.length === 0 ? (
            <p className="py-8 text-center text-sm text-d-muted">
              {completo
                ? "Nenhum lançamento neste mês."
                : "O servidor ainda não enviou a lista completa do mês. Puxe para atualizar ou publique de novo o Apps Script."}
            </p>
          ) : (
            <ul className="divide-y divide-d-line overflow-hidden rounded-2xl bg-d-card">
              {lancamentos.map((l, i) => (
                <LancamentoItem key={`${l.descricao}-${l.valor}-${i}`} lancamento={l} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
