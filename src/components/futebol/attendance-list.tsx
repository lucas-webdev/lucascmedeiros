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
  const ordenados = [...jogadores].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR")
  );

  return (
    <fieldset className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <legend className="px-1 text-sm font-semibold text-white/80">
        Lista geral — marque quem está presente hoje
      </legend>
      {jogadores.length === 0 ? (
        <p className="mt-2 text-sm text-white/60">Nenhum jogador cadastrado.</p>
      ) : (
        <ul className="mt-3 max-h-[450px] divide-y divide-white/10 overflow-y-auto pr-1 [color-scheme:dark]">
          {ordenados.map((jogador) => {
            const checked = presentesSet.has(jogador.id);
            const inputId = `presenca-${jogador.id}`;
            return (
              <li key={jogador.id} className="flex items-center gap-3 py-2">
                <input
                  id={inputId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(jogador.id)}
                  className="h-5 w-5 shrink-0 rounded border-white/30 bg-white/10 accent-[#2F4FE0]"
                />
                <label
                  htmlFor={inputId}
                  className="flex flex-1 items-center gap-1.5 py-1 text-sm text-white"
                >
                  {jogador.nome}
                  {jogador.mensalista && (
                    <span
                      aria-label="Mensalista"
                      title="Mensalista"
                      className="text-amber-400"
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
