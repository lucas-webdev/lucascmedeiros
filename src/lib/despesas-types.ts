export const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export type Forma = "Crédito" | "Débito" | "Pix";
export type Conta = "C6" | "Inter" | "Nubank" | "C6 PJ" | "-";

export interface CategoriaPainel {
  nome: string;
  previsto: number;
  realizado: number;
  disponivel: number;
  /** `null` quando a categoria não tem valor previsto. */
  pct: number | null;
}

export interface FixoPendente {
  descricao: string;
  categoria: string;
  valor: number;
  chave: string;
}

export interface UltimoLancamento {
  /** "dd/MM"; vem vazio em linhas agrupadas da planilha. */
  data: string;
  descricao: string;
  categoria: string;
  valor: number;
  forma: string;
  conta: string;
  obs: string;
}

export interface Painel {
  mes: string;
  /** "YYYY-MM-DD" no fuso de São Paulo. */
  hoje: string;
  entradaPrevista: number;
  entradaReal: number;
  totalRealizado: number;
  totalPendente: number;
  disponivelMes: number;
  categorias: CategoriaPainel[];
  fixosPendentes: FixoPendente[];
  ultimos: UltimoLancamento[];
}

export interface PainelResposta {
  painel: Painel;
  categorias: string[];
}

export interface NovoLancamento {
  /** "YYYY-MM-DD" */
  data: string;
  descricao: string;
  categoria: string;
  valor: number;
  forma: Forma;
  conta: Conta;
  obs: string;
}

export interface LancamentoResposta {
  lancamento: { aba: string; linha: number };
  painel: Painel;
}

/** Item da fila offline (IndexedDB). `idLocal` evita duplicar no reenvio. */
export interface LancamentoPendente {
  idLocal: string;
  criadoEm: number;
  lancamento: NovoLancamento;
  /** Preenchido quando o servidor rejeitou o lançamento (ex.: categoria inválida). */
  erro?: string;
}

export interface MetodoPagamento {
  id: string;
  rotulo: string;
  forma: Forma;
  conta: Conta;
}
