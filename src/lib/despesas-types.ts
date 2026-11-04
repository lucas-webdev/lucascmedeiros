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

export interface FaturaPrevista {
  mes: string;
  /** Ano da fatura; passa do ano da planilha quando há parcelas em janeiro seguinte. */
  ano?: number;
  /** `false` para meses sem aba na planilha (só projeção de parcelas). */
  navegavel?: boolean;
  total: number;
  cartoes: { conta: string; total: number }[];
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
  /** Todos os lançamentos do mês, do mais recente ao mais antigo. Ausente em caches antigos. */
  lancamentos?: UltimoLancamento[];
  /** Ausente em caches antigos. */
  proximasFaturas?: FaturaPrevista[];
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
  /** Só crédito. Com mais de 1, `valor` é o total e o backend gera uma linha por mês. */
  parcelas?: number;
}

export interface LancamentoResposta {
  lancamento: {
    aba: string;
    linha: number;
    /** Parcelas que não couberam na planilha do ano. */
    foraDoAno?: number;
  };
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
