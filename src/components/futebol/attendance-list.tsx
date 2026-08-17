"use client";

import type { Jogador } from "@/lib/futebol-types";

interface AttendanceListProps {
  jogadores: Jogador[];
  presentesIds: number[];
  onToggle: (id: number) => void;
}

export function AttendanceList({
  jogadores,
  presentesIds,
  onToggle,
}: AttendanceListProps) {
  const presentesSet = new Set(presentesIds);

  return (
    <fieldset className="rounded-lg border border-border bg-card p-4">
      <legend className="px-1 text-sm font-semibold">
        Lista geral — marque quem está presente hoje
      </legend>
      {jogadores.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Nenhum jogador cadastrado.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {jogadores.map((jogador) => {
            const checked = presentesSet.has(jogador.id);
            const inputId = `presenca-${jogador.id}`;
            return (
              <li key={jogador.id} className="flex items-center gap-3 py-2">
                <input
                  id={inputId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(jogador.id)}
                  className="h-5 w-5 shrink-0 rounded border-border text-accent"
                />
                <label
                  htmlFor={inputId}
                  className="flex flex-1 items-center gap-1.5 py-1 text-sm"
                >
                  {jogador.nome}
                  {jogador.mensalista && (
                    <span
                      aria-label="Mensalista"
                      title="Mensalista"
                      className="text-accent"
                    >
                      ★
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}
