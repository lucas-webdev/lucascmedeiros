"use client";

import { cn } from "@/lib/utils";
import { formatarMoeda } from "@/lib/despesas-format";
import { dataCurta, rotuloMes } from "@/lib/despesas-leti-parcelas";
import type { Fatura } from "@/lib/despesas-leti-types";

interface FaturaTopoProps {
  fatura: Fatura;
  hoje: string;
  podeAnterior: boolean;
  podeProximo: boolean;
  repassando: boolean;
  onMes: (delta: -1 | 1) => void;
  onRepassar: (repassada: boolean) => void;
}

function diasAte(hoje: string, alvo: string): number {
  const a = Date.UTC(Number(hoje.slice(0, 4)), Number(hoje.slice(5, 7)) - 1, Number(hoje.slice(8, 10)));
  const b = Date.UTC(Number(alvo.slice(0, 4)), Number(alvo.slice(5, 7)) - 1, Number(alvo.slice(8, 10)));
  return Math.round((b - a) / 86400000);
}

function textoVencimento(fatura: Fatura, hoje: string): string {
  const quando = dataCurta(fatura.vencimento);
  const dias = diasAte(hoje, fatura.vencimento);
  if (fatura.repassada) return `${dias >= 0 ? "vence" : "venceu"} ${quando} · repassada`;
  if (dias > 1) return `vence ${quando} · em ${dias} dias`;
  if (dias === 1) return `vence amanhã (${quando})`;
  if (dias === 0) return `vence hoje (${quando})`;
  return `venceu ${quando}`;
}

export function FaturaTopo({
  fatura,
  hoje,
  podeAnterior,
  podeProximo,
  repassando,
  onMes,
  onRepassar,
}: FaturaTopoProps) {
  return (
    <header className="pt-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMes(-1)}
          disabled={!podeAnterior}
          aria-label="Mês anterior"
          className="flex size-11 items-center justify-center rounded-full text-2xl text-d-muted active:bg-d-line disabled:opacity-30"
        >
          ‹
        </button>
        <h1 className="text-lg font-semibold">{rotuloMes(fatura.mes)}</h1>
        <button
          type="button"
          onClick={() => onMes(1)}
          disabled={!podeProximo}
          aria-label="Próximo mês"
          className="flex size-11 items-center justify-center rounded-full text-2xl text-d-muted active:bg-d-line disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <div className="mt-2 text-center">
        <p className="text-sm text-d-muted">gasto no mês</p>
        <p className="mt-1 text-5xl font-semibold tracking-tight tabular-nums">
          {formatarMoeda(fatura.total)}
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-d-card px-3 py-3">
          <dt className="text-xs text-d-muted">Fatura Lucas</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums">
            {formatarMoeda(fatura.totalCredito)}
          </dd>
          <dd
            className={cn(
              "mt-0.5 text-xs",
              fatura.repassada ? "text-d-ok" : "text-d-muted"
            )}
          >
            {textoVencimento(fatura, hoje)}
          </dd>
        </div>
        <div className="rounded-xl bg-d-card px-3 py-3">
          <dt className="text-xs text-d-muted">Pix e débito</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums">
            {formatarMoeda(fatura.totalAvista)}
          </dd>
          <dd className="mt-0.5 text-xs text-d-muted">da sua conta</dd>
        </div>
      </dl>

      {fatura.totalCredito > 0 && (
        <button
          type="button"
          disabled={repassando}
          onClick={() => onRepassar(!fatura.repassada)}
          className={cn(
            "mt-2 w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors active:opacity-70 disabled:opacity-50",
            fatura.repassada
              ? "border-d-ok text-d-ok"
              : "border-d-line bg-d-card text-d-fg"
          )}
        >
          {repassando
            ? "Salvando…"
            : fatura.repassada
              ? "✓ Repassada ao Lucas (desfazer)"
              : "Marcar fatura como repassada"}
        </button>
      )}
    </header>
  );
}
