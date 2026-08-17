"use client";

import { useState, type FormEvent } from "react";
import { addPlayer, updatePlayer, FutebolApiError } from "@/lib/futebol-api";
import type { Jogador } from "@/lib/futebol-types";

interface PlayerRosterProps {
  jogadores: Jogador[];
  pin: string;
  onChanged: () => void;
  onAuthError: () => void;
}

export function PlayerRoster({
  jogadores,
  pin,
  onChanged,
  onAuthError,
}: PlayerRosterProps) {
  const [nome, setNome] = useState("");
  const [mensalista, setMensalista] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const tratarErro = (e: unknown) => {
    if (e instanceof FutebolApiError && e.status === 401) {
      onAuthError();
      return;
    }
    setErro(e instanceof Error ? e.message : "Erro inesperado.");
  };

  const handleAdicionar = async (event: FormEvent) => {
    event.preventDefault();
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) return;
    setEnviando(true);
    setErro(null);
    try {
      await addPlayer(pin, nomeLimpo, mensalista);
      setNome("");
      setMensalista(false);
      onChanged();
    } catch (e) {
      tratarErro(e);
    } finally {
      setEnviando(false);
    }
  };

  const handleToggleMensalista = async (jogador: Jogador) => {
    setErro(null);
    try {
      await updatePlayer(pin, jogador.id, jogador.nome, !jogador.mensalista, true);
      onChanged();
    } catch (e) {
      tratarErro(e);
    }
  };

  const handleRemover = async (jogador: Jogador) => {
    if (!window.confirm(`Remover ${jogador.nome} do elenco?`)) return;
    setErro(null);
    try {
      await updatePlayer(pin, jogador.id, jogador.nome, jogador.mensalista, false);
      onChanged();
    } catch (e) {
      tratarErro(e);
    }
  };

  return (
    <details className="rounded-lg border border-border bg-card p-4">
      <summary className="cursor-pointer text-sm font-semibold">
        Gerenciar elenco
      </summary>

      <form
        onSubmit={handleAdicionar}
        className="mt-4 flex flex-wrap items-end gap-3"
      >
        <div className="min-w-[180px] flex-1">
          <label htmlFor="novo-jogador-nome" className="block text-sm font-medium">
            Nome
          </label>
          <input
            id="novo-jogador-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Nome do jogador"
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={mensalista}
            onChange={(e) => setMensalista(e.target.checked)}
            className="h-4 w-4"
          />
          Mensalista
        </label>
        <button
          type="submit"
          disabled={enviando || !nome.trim()}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          Adicionar
        </button>
      </form>

      {erro && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {erro}
        </p>
      )}

      <ul className="mt-4 divide-y divide-border">
        {jogadores.map((jogador) => (
          <li
            key={jogador.id}
            className="flex flex-wrap items-center gap-3 py-2 text-sm"
          >
            <span className="flex-1">{jogador.nome}</span>
            <label className="flex items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                checked={jogador.mensalista}
                onChange={() => handleToggleMensalista(jogador)}
                className="h-4 w-4"
              />
              Mensalista
            </label>
            <button
              type="button"
              onClick={() => handleRemover(jogador)}
              className="text-xs text-red-600 hover:underline"
            >
              Remover
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
