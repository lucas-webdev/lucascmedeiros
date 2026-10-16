"use client";

import { useState } from "react";

interface TokenGateProps {
  erroInicial?: string | null;
  onEntrar: (token: string) => Promise<void>;
}

export function TokenGate({ erroInicial = null, onEntrar }: TokenGateProps) {
  const [token, setToken] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(erroInicial);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const limpo = token.trim();
    if (!limpo || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      await onEntrar(limpo);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
      setEnviando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <h1 className="text-3xl font-semibold tracking-tight">Despesas</h1>
      <p className="mt-2 text-sm text-d-muted">
        Digite o token uma vez. Ele fica guardado só neste aparelho.
      </p>
      <form onSubmit={enviar} className="mt-8 space-y-3">
        <label className="block text-sm font-medium" htmlFor="token">
          Token
        </label>
        <input
          id="token"
          type="password"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full rounded-xl border border-d-line bg-d-card px-4 py-3 text-base outline-none focus:border-d-accent"
        />
        {erro && (
          <p role="alert" className="text-sm text-d-bad">
            {erro}
          </p>
        )}
        <button
          type="submit"
          disabled={!token.trim() || enviando}
          className="w-full rounded-xl bg-d-accent px-4 py-3 text-base font-semibold text-d-accent-fg disabled:opacity-50"
        >
          {enviando ? "Verificando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
