import type { MetodoPagamento, Painel } from "./despesas-types";

const PREFIXO = "despesas:";
const MAX_DESCRICOES = 150;

/** Combinações forma + conta mais usadas. Para incluir outra, basta adicionar aqui. */
export const METODOS_PAGAMENTO: MetodoPagamento[] = [
  { id: "c6-credito", rotulo: "C6 crédito", forma: "Crédito", conta: "C6" },
  { id: "inter-credito", rotulo: "Inter crédito", forma: "Crédito", conta: "Inter" },
  { id: "nubank-credito", rotulo: "Nubank crédito", forma: "Crédito", conta: "Nubank" },
  { id: "pix-pj", rotulo: "Pix PJ", forma: "Pix", conta: "C6 PJ" },
  { id: "debito-c6", rotulo: "Débito C6", forma: "Débito", conta: "C6" },
];

function ler<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(PREFIXO + chave);
    return bruto ? (JSON.parse(bruto) as T) : padrao;
  } catch {
    return padrao;
  }
}

function gravar(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
  } catch {
    // quota cheia ou modo privado: o app segue funcionando sem persistir
  }
}

function remover(chave: string): void {
  try {
    localStorage.removeItem(PREFIXO + chave);
  } catch {
    // ignora
  }
}

export function lerToken(): string {
  return ler<string>("token", "");
}

export function gravarToken(token: string): void {
  gravar("token", token);
}

export function limparToken(): void {
  remover("token");
}

export function lerUsoCategorias(): Record<string, number> {
  return ler<Record<string, number>>("uso-categorias", {});
}

export function registrarUsoCategoria(categoria: string): void {
  const uso = lerUsoCategorias();
  uso[categoria] = (uso[categoria] ?? 0) + 1;
  gravar("uso-categorias", uso);
}

export function lerMetodoId(): string {
  return ler<string>("metodo", METODOS_PAGAMENTO[0].id);
}

export function gravarMetodoId(id: string): void {
  gravar("metodo", id);
}

export function lerDescricoes(): string[] {
  return ler<string[]>("descricoes", []);
}

/** Mantém as mais recentes primeiro, sem repetir (ignorando maiúsculas). */
export function registrarDescricao(descricao: string): void {
  const limpa = descricao.trim();
  if (!limpa) return;
  const outras = lerDescricoes().filter(
    (d) => d.toLowerCase() !== limpa.toLowerCase()
  );
  gravar("descricoes", [limpa, ...outras].slice(0, MAX_DESCRICOES));
}

export interface PainelEmCache {
  painel: Painel;
  categorias: string[];
  /** timestamp (ms) da última atualização vinda do servidor */
  em: number;
}

export function lerPainelEmCache(mes: string): PainelEmCache | null {
  return ler<PainelEmCache | null>(`painel:${mes}`, null);
}

export function gravarPainelEmCache(
  mes: string,
  painel: Painel,
  categorias: string[]
): void {
  gravar(`painel:${mes}`, { painel, categorias, em: Date.now() });
}

export function lerCategoriasEmCache(): string[] {
  return ler<string[]>("categorias", []);
}

export function gravarCategoriasEmCache(categorias: string[]): void {
  gravar("categorias", categorias);
}
