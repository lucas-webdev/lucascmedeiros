export const FORMA_CREDITO = "Crédito Lucas";
export const FORMAS = [FORMA_CREDITO, "Débito", "Pix"] as const;
export type Forma = (typeof FORMAS)[number];

/** Uma parcela (ou gasto à vista) que cai em determinado mês. */
export interface ItemFatura {
  /** ID da compra na planilha. */
  id: string;
  /** "YYYY-MM-DD", data da compra. */
  data: string;
  loja: string;
  categoria: string;
  forma: Forma;
  /** Valor desta parcela. */
  valor: number;
  /** Número desta parcela dentro da compra. */
  parcela: number;
  parcelas: number;
  parcelaInicial: number;
  /** "YYYY-MM" da parcela inicial. */
  faturaInicial: string;
  obs: string;
}

export interface TotalCategoria {
  categoria: string;
  total: number;
}

export interface Fatura {
  /** "YYYY-MM" */
  mes: string;
  /** "YYYY-MM-DD" */
  vencimento: string;
  /** Crédito (fatura) + débito/pix do mês. */
  total: number;
  totalCredito: number;
  totalAvista: number;
  repassada: boolean;
  itens: ItemFatura[];
  porCategoria: TotalCategoria[];
}

export interface ProximaFatura {
  mes: string;
  total: number;
  repassada: boolean;
}

export interface Config {
  vencimento: number;
  fechamento: number;
}

export interface Dados {
  /** "YYYY-MM-DD" no fuso de São Paulo. */
  hoje: string;
  config: Config;
  categorias: string[];
  fatura: Fatura;
  proximas: ProximaFatura[];
}

/** Compra como o formulário envia. `valor` é sempre o valor de UMA parcela. */
export interface NovaCompra {
  /** "YYYY-MM-DD" */
  data: string;
  loja: string;
  categoria: string;
  forma: Forma;
  valor: number;
  parcelas: number;
  parcelaInicial: number;
  /** "YYYY-MM" da parcela inicial. */
  faturaInicial: string;
  obs: string;
}

export type Acao =
  | { acao: "criar"; idLocal: string; compra: NovaCompra }
  | { acao: "editar"; id: string; mes: string; compra: NovaCompra }
  | { acao: "excluir"; id: string; mes: string }
  | { acao: "repassar"; mes: string; repassada: boolean };

export interface DadosResposta {
  dados: Dados;
}

export interface AcaoResposta {
  /** Mês que o servidor devolveu em `dados`. */
  mesAlvo: string;
  dados: Dados;
}

/** Item da fila offline (IndexedDB). `idLocal` vira o ID da compra e evita duplicar no reenvio. */
export interface CompraPendente {
  idLocal: string;
  criadoEm: number;
  compra: NovaCompra;
  /** Preenchido quando o servidor recusou a compra (ex.: categoria que não existe mais). */
  erro?: string;
}
