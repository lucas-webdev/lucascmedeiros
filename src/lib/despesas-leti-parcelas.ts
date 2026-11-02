import { FORMA_CREDITO, type Forma } from "./despesas-leti-types";

const MESES_LONGOS = [
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

const MESES_CURTOS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

/** Meses sempre como "YYYY-MM". */
export function indiceMes(mes: string): number {
  return Number(mes.slice(0, 4)) * 12 + (Number(mes.slice(5, 7)) - 1);
}

export function somarMeses(mes: string, n: number): string {
  const total = indiceMes(mes) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export function mesDaData(dataISO: string): string {
  return dataISO.slice(0, 7);
}

/** Compra no crédito a partir do dia de fechamento cai na fatura do mês seguinte. */
export function mesDaFatura(dataISO: string, forma: Forma, fechamento: number): string {
  const mes = mesDaData(dataISO);
  if (forma === FORMA_CREDITO && Number(dataISO.slice(8, 10)) >= fechamento) {
    return somarMeses(mes, 1);
  }
  return mes;
}

export function rotuloMes(mes: string): string {
  return `${MESES_LONGOS[Number(mes.slice(5, 7)) - 1]} de ${mes.slice(0, 4)}`;
}

export function nomeMes(mes: string): string {
  return MESES_LONGOS[Number(mes.slice(5, 7)) - 1];
}

/** "Nov" no mesmo ano da referência; "Jan/27" em outro ano. */
export function mesCurto(mes: string, referencia: string): string {
  const nome = MESES_CURTOS[Number(mes.slice(5, 7)) - 1];
  return mes.slice(0, 4) === referencia.slice(0, 4) ? nome : `${nome}/${mes.slice(2, 4)}`;
}

/** "Nov/26" */
export function mesComAno(mes: string): string {
  return `${MESES_CURTOS[Number(mes.slice(5, 7)) - 1]}/${mes.slice(2, 4)}`;
}

export function mesDeHojeNoAparelho(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "YYYY-MM-DD" → "dd/MM" */
export function dataCurta(dataISO: string): string {
  return `${dataISO.slice(8, 10)}/${dataISO.slice(5, 7)}`;
}

export function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/** Valor de cada parcela quando se informa o total da compra. */
export function valorDaParcela(total: number, parcelas: number): number {
  return arredondar(total / Math.max(parcelas, 1));
}

export interface ParcelaPrevista {
  parcela: number;
  mes: string;
  valor: number;
}

interface DadosCronograma {
  valor: number;
  parcelas: number;
  parcelaInicial: number;
  faturaInicial: string;
}

/** Parcelas que ainda cobram: da parcela inicial até a última, um mês após o outro. */
export function cronograma({
  valor,
  parcelas,
  parcelaInicial,
  faturaInicial,
}: DadosCronograma): ParcelaPrevista[] {
  const lista: ParcelaPrevista[] = [];
  for (let k = parcelaInicial; k <= parcelas; k++) {
    lista.push({ parcela: k, mes: somarMeses(faturaInicial, k - parcelaInicial), valor });
  }
  return lista;
}
