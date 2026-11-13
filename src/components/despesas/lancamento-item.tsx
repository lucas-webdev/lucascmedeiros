import { formatarMoeda } from "@/lib/despesas-format";
import type { UltimoLancamento } from "@/lib/despesas-types";

export function LancamentoItem({ lancamento: u }: { lancamento: UltimoLancamento }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="min-w-0">
        <span className="block truncate font-medium">{u.descricao}</span>
        <span className="block truncate text-xs text-d-muted">
          {[u.data, u.categoria, `${u.forma} ${u.conta}`.trim(), u.obs]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
      <span className="shrink-0 text-sm tabular-nums">{formatarMoeda(u.valor)}</span>
    </li>
  );
}
