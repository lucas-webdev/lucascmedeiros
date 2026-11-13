"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatarMoeda } from "@/lib/despesas-format";
import {
  arredondar,
  cronograma,
  dataCurta,
  indiceMes,
  mesCurto,
  rotuloMes,
} from "@/lib/despesas-leti-parcelas";
import { FORMA_CREDITO, type ItemFatura } from "@/lib/despesas-leti-types";

interface DetalheSheetProps {
  item: ItemFatura;
  /** Mês ("YYYY-MM") que está na tela, para destacar a parcela dele. */
  mes: string;
  hoje: string;
  onFechar: () => void;
  onEditar: () => void;
  onExcluir: () => Promise<void>;
}

export function DetalheSheet({
  item,
  mes,
  hoje,
  onFechar,
  onEditar,
  onExcluir,
}: DetalheSheetProps) {
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !excluindo) onFechar();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [excluindo, onFechar]);

  const credito = item.forma === FORMA_CREDITO;
  const parcelas = cronograma(item);
  const aPagar = arredondar(
    parcelas.filter((p) => indiceMes(p.mes) >= indiceMes(mes)).reduce((s, p) => s + p.valor, 0)
  );

  async function excluir() {
    const aviso =
      item.parcelas > 1
        ? `Excluir "${item.loja}" e todas as parcelas?`
        : `Excluir "${item.loja}"?`;
    if (!window.confirm(aviso)) return;
    setExcluindo(true);
    setErro(null);
    try {
      await onExcluir();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível excluir.");
      setExcluindo(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-label={item.loja}>
      <button
        type="button"
        aria-label="Fechar"
        onClick={() => !excluindo && onFechar()}
        className="absolute inset-0 bg-black/50"
      />
      <div className="relative mx-auto flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-3xl bg-d-bg shadow-2xl">
        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{item.loja}</h2>
            <p className="text-sm text-d-muted">
              {item.categoria} · {item.forma} · compra de {dataCurta(item.data)}
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            disabled={excluindo}
            aria-label="Fechar"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-d-muted active:bg-d-line"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 pb-4 pt-3">
          <p className="text-4xl font-semibold tabular-nums">
            {formatarMoeda(item.valor)}
            {item.parcelas > 1 && (
              <span className="ml-2 text-base font-normal text-d-muted">por parcela</span>
            )}
          </p>

          {credito && item.parcelas > 1 && (
            <section aria-label="Parcelas">
              <ul className="divide-y divide-d-line overflow-hidden rounded-2xl bg-d-card">
                {parcelas.map((p) => (
                  <li
                    key={p.parcela}
                    className={cn(
                      "flex items-center justify-between px-4 py-2.5 text-sm",
                      p.mes === mes &&
                        "bg-d-accent/15 font-semibold shadow-[inset_4px_0_0_var(--d-accent)]"
                    )}
                  >
                    <span>
                      Parcela {p.parcela}/{item.parcelas}
                      <span className="text-d-muted"> · {mesCurto(p.mes, hoje)}</span>
                    </span>
                    <span className="tabular-nums">{formatarMoeda(p.valor)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-d-muted">
                A partir de {rotuloMes(mes)}: {formatarMoeda(aPagar)}
              </p>
              {item.parcelaInicial > 1 && (
                <p className="mt-1 text-xs text-d-muted">
                  Lançada a partir da parcela {item.parcelaInicial}; as anteriores não entram aqui.
                </p>
              )}
            </section>
          )}

          {item.obs && <p className="text-sm text-d-muted">{item.obs}</p>}
        </div>

        <div className="border-t border-d-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {erro && (
            <p role="alert" className="mb-2 text-sm text-d-bad">
              {erro}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void excluir()}
              disabled={excluindo}
              className="rounded-xl border border-d-line px-4 py-3.5 text-base font-medium text-d-bad disabled:opacity-40"
            >
              {excluindo ? "Excluindo…" : "Excluir"}
            </button>
            <button
              type="button"
              onClick={onEditar}
              disabled={excluindo}
              className="flex-1 rounded-xl bg-d-accent px-4 py-3.5 text-base font-semibold text-d-accent-fg disabled:opacity-40"
            >
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
