import { MESES } from "./despesas-types";

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const moedaInteira = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function formatarMoeda(valor: number): string {
  return moeda.format(valor);
}

export function formatarMoedaInteira(valor: number): string {
  return moedaInteira.format(valor);
}

/** Aceita "12,5", "1.234,56" e "12.5". Retorna `NaN` se não for número. */
export function parseValor(texto: string): number {
  const limpo = texto.trim().replace(/\s/g, "");
  if (!limpo) return NaN;
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  return Number(normalizado);
}

export function hojeISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function mesDaData(dataISO: string): string {
  return MESES[Number(dataISO.slice(5, 7)) - 1] ?? "";
}

export function diasNoMes(ano: number, mesIndex: number): number {
  return new Date(ano, mesIndex + 1, 0).getDate();
}

/** Há quanto tempo, em português curto ("agora", "5 min", "2 h", "3 d"). */
export function haQuantoTempo(timestamp: number): string {
  const min = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  return `${Math.round(h / 24)} d`;
}
