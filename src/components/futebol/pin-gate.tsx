"use client";

import { useEffect, useState, type ReactNode, type FormEvent } from "react";
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
  const [pronto, setPronto] = useState(false);
  const [pin, setPin] = useState<string | null>(null);
  const [valorDigitado, setValorDigitado] = useState("");
  const [erro, setErro] = useState(false);

  useEffect(() => {
    setPin(lerPinSalvo());
    setPronto(true);
  }, []);

  if (!pronto) {
    return null;
  }

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
    <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-6 py-8 text-center backdrop-blur-sm">
      <p className="text-sm text-white/70">
        Área restrita à organização. Digite o PIN da equipe para continuar.
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <label htmlFor="pin-input" className="sr-only">
          PIN
        </label>
        <input
          id="pin-input"
          type="password"
          autoComplete="off"
          value={valorDigitado}
          onChange={(e) => setValorDigitado(e.target.value)}
          className="w-full rounded-md border border-white/20 bg-white/10 px-4 py-3 text-center text-lg tracking-widest text-white placeholder:text-white/40"
          placeholder="PIN"
        />
        {erro && (
          <p role="alert" className="text-sm text-red-300">
            PIN incorreto. Tente novamente.
          </p>
        )}
        <button
          type="submit"
          disabled={!valorDigitado.trim()}
          className="w-full rounded-md bg-[#2F4FE0] px-4 py-3 font-medium text-white transition-colors hover:bg-[#2643C8] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
