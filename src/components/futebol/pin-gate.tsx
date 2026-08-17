"use client";

import { useState, type ReactNode, type FormEvent } from "react";
import { lerPinSalvo, salvarPin, limparPin } from "@/lib/futebol-storage";

interface PinGateProps {
  children: (pin: string, onAuthError: () => void) => ReactNode;
}

/**
 * Barreira de UX, não de segurança: o PIN digitado aqui é aceito sem
 * validação local (não dá pra validar no client sem expor o valor
 * correto no bundle JS). A validação real acontece no PHP a cada
 * escrita — se o PIN estiver errado, a API responde 401 e
 * `onAuthError` limpa o PIN salvo para o usuário tentar de novo.
 */
export function PinGate({ children }: PinGateProps) {
  const [pin, setPin] = useState<string | null>(() => lerPinSalvo());
  const [valorDigitado, setValorDigitado] = useState("");
  const [erro, setErro] = useState(false);

  if (pin) {
    return (
      <>
        {children(pin, () => {
          limparPin();
          setPin(null);
          setErro(true);
        })}
      </>
    );
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const valor = valorDigitado.trim();
    if (!valor) return;
    salvarPin(valor);
    setPin(valor);
    setErro(false);
    setValorDigitado("");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">Futebol Onda BH</h1>
      <p className="text-sm text-muted">
        Digite o PIN da equipe para continuar.
      </p>
      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <label htmlFor="pin-input" className="sr-only">
          PIN
        </label>
        <input
          id="pin-input"
          type="password"
          autoComplete="off"
          value={valorDigitado}
          onChange={(e) => setValorDigitado(e.target.value)}
          className="w-full rounded-md border border-border bg-card px-4 py-3 text-center text-lg tracking-widest"
          placeholder="PIN"
        />
        {erro && (
          <p role="alert" className="text-sm text-red-600">
            PIN incorreto. Tente novamente.
          </p>
        )}
        <button
          type="submit"
          disabled={!valorDigitado.trim()}
          className="w-full rounded-md bg-accent px-4 py-3 font-medium text-accent-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
