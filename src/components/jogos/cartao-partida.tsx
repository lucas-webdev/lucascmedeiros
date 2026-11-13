import { formatarData, formatarDuracao } from "@/lib/jogos-stats";
import type { Partida } from "@/lib/jogos-types";

/** Card de uma partida. Quem usa decide o elemento de lista ao redor. */
export function CartaoPartida({ partida }: { partida: Partida }) {
  const duracao = formatarDuracao(partida.length);
  const detalhes = [partida.location, duracao].filter(Boolean).join(" · ");

  return (
    <article className="rounded-xl border border-d-line bg-d-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-base font-semibold leading-snug break-words">
          {partida.game.name || "(sem nome)"}
          {partida.quantity > 1 && (
            <span className="ml-2 rounded-full bg-d-line px-2 py-0.5 text-xs font-medium text-d-muted">
              ×{partida.quantity}
            </span>
          )}
        </h3>
        <time
          dateTime={partida.date}
          className="shrink-0 text-sm text-d-muted tabular-nums"
        >
          {formatarData(partida.date)}
        </time>
      </div>

      {(detalhes || partida.incomplete) && (
        <p className="mt-1 text-sm text-d-muted">
          {detalhes}
          {partida.incomplete && (
            <span className="text-d-warn">{detalhes ? " · " : ""}incompleta</span>
          )}
        </p>
      )}

      {partida.players.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {partida.players.map((jogador, i) => (
            <li
              key={`${jogador.userid}-${jogador.name}-${i}`}
              className={
                jogador.win
                  ? "rounded-full bg-d-ok/15 px-2.5 py-1 text-sm font-medium text-d-ok"
                  : "rounded-full bg-d-line px-2.5 py-1 text-sm"
              }
            >
              {jogador.name || jogador.username || "?"}
              {jogador.score && (
                <span className="ml-1.5 text-d-muted tabular-nums">
                  {jogador.score}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {partida.comments && (
        <p className="mt-3 text-sm whitespace-pre-line text-d-muted">
          {partida.comments}
        </p>
      )}
    </article>
  );
}
