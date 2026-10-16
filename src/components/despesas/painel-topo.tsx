"use client";

import { cn } from "@/lib/utils";
import { diasNoMes, formatarMoeda } from "@/lib/despesas-format";
import { MESES, type Painel } from "@/lib/despesas-types";

interface PainelTopoProps {
  painel: Painel;
  podeAnterior: boolean;
  podeProximo: boolean;
  onMes: (delta: -1 | 1) => void;
}

function BarraRitmo({
  rotulo,
  detalhe,
  pct,
  classeCor,
}: {
  rotulo: string;
  detalhe: string;
  pct: number;
  classeCor: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-d-muted">
        <span>{rotulo}</span>
        <span className="tabular-nums">{detalhe}</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-d-line"
        role="progressbar"
        aria-label={rotulo}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(pct, 100))}
      >
        <div
          className={cn("h-full rounded-full", classeCor)}
          style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

export function PainelTopo({
  painel,
  podeAnterior,
  podeProximo,
  onMes,
}: PainelTopoProps) {
  const base = painel.entradaReal || painel.entradaPrevista;
  const entradaEhPrevista = !painel.entradaReal;

  const mesIndex = MESES.indexOf(painel.mes as (typeof MESES)[number]);
  const ano = Number(painel.hoje.slice(0, 4));
  const mesHoje = Number(painel.hoje.slice(5, 7)) - 1;
  const diaHoje = Number(painel.hoje.slice(8, 10));
  const totalDias = diasNoMes(ano, mesIndex);

  let pctTempo = 0;
  let detalheTempo = "mês futuro";
  if (mesIndex < mesHoje) {
    pctTempo = 100;
    detalheTempo = "mês encerrado";
  } else if (mesIndex === mesHoje) {
    pctTempo = (diaHoje / totalDias) * 100;
    detalheTempo = `dia ${diaHoje} de ${totalDias}`;
  }

  const comprometido = painel.totalRealizado + painel.totalPendente;
  const pctGasto = base > 0 ? (comprometido / base) * 100 : 0;
  const corGasto =
    pctGasto > 100
      ? "bg-d-bad"
      : pctGasto > pctTempo && mesIndex === mesHoje
        ? "bg-d-warn"
        : "bg-d-ok";

  const negativo = painel.disponivelMes < 0;

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
        <h1 className="text-lg font-semibold">{painel.mes}</h1>
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
        <p className="text-sm text-d-muted">disponível no mês</p>
        <p
          className={cn(
            "mt-1 text-5xl font-semibold tracking-tight tabular-nums",
            negativo && "text-d-bad"
          )}
        >
          {formatarMoeda(painel.disponivelMes)}
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-d-card px-2 py-2.5">
          <dt className="text-xs text-d-muted">
            entrada{entradaEhPrevista ? " (prev.)" : ""}
          </dt>
          <dd className="mt-0.5 text-sm font-medium tabular-nums">
            {formatarMoeda(base)}
          </dd>
        </div>
        <div className="rounded-xl bg-d-card px-2 py-2.5">
          <dt className="text-xs text-d-muted">gasto</dt>
          <dd className="mt-0.5 text-sm font-medium tabular-nums">
            {formatarMoeda(painel.totalRealizado)}
          </dd>
        </div>
        <div className="rounded-xl bg-d-card px-2 py-2.5">
          <dt className="text-xs text-d-muted">a pagar</dt>
          <dd className="mt-0.5 text-sm font-medium tabular-nums">
            {formatarMoeda(painel.totalPendente)}
          </dd>
        </div>
      </dl>

      <div className="mt-5 space-y-3">
        <BarraRitmo
          rotulo="Tempo do mês"
          detalhe={detalheTempo}
          pct={pctTempo}
          classeCor="bg-d-muted"
        />
        <BarraRitmo
          rotulo="Entrada comprometida"
          detalhe={`${Math.round(pctGasto)}%`}
          pct={pctGasto}
          classeCor={corGasto}
        />
      </div>
    </header>
  );
}
