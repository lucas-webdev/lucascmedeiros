import type { PeladaDraft } from "./futebol-types";

const PIN_KEY = "futebol_pin";

function draftKey(data: string): string {
  return `futebol_pelada_${data}`;
}

export function hojeISO(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function criarDraftVazio(data: string): PeladaDraft {
  return {
    data,
    presentesIds: [],
    numTimes: 2,
    times: {},
    estatisticas: {},
    placar: null,
  };
}

export function carregarDraft(data: string): PeladaDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(draftKey(data));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PeladaDraft;
  } catch {
    return null;
  }
}

export function salvarDraft(draft: PeladaDraft): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(draftKey(draft.data), JSON.stringify(draft));
}

export function limparDraft(data: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(draftKey(data));
}

export function lerPinSalvo(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(PIN_KEY);
}

export function salvarPin(pin: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PIN_KEY, pin);
}

export function limparPin(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PIN_KEY);
}
