import { FORMA_CREDITO, FORMAS, type Dados, type Forma } from "./despesas-leti-types";

const PREFIXO = "despesas-leti:";
const MAX_LOJAS = 150;

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

export function lerForma(): Forma {
  const salva = ler<string>("forma", FORMA_CREDITO);
  return FORMAS.find((f) => f === salva) ?? FORMA_CREDITO;
}

export function gravarForma(forma: Forma): void {
  gravar("forma", forma);
}

export function lerLojas(): string[] {
  return ler<string[]>("lojas", []);
}

/** Mantém as mais recentes primeiro, sem repetir (ignorando maiúsculas). */
export function registrarLoja(loja: string): void {
  const limpa = loja.trim();
  if (!limpa) return;
  const outras = lerLojas().filter((l) => l.toLowerCase() !== limpa.toLowerCase());
  gravar("lojas", [limpa, ...outras].slice(0, MAX_LOJAS));
}

export interface DadosEmCache {
  dados: Dados;
  /** timestamp (ms) da última atualização vinda do servidor */
  em: number;
}

export function lerDadosEmCache(mes: string): DadosEmCache | null {
  return ler<DadosEmCache | null>(`dados:${mes}`, null);
}

export function gravarDadosEmCache(mes: string, dados: Dados): void {
  gravar(`dados:${mes}`, { dados, em: Date.now() });
}
