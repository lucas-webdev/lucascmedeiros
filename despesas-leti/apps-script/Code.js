/**
 * Backend do app /despesas-leti (lucascmedeiros.com.br/despesas-leti)
 * Google Apps Script vinculado à planilha "Controle Leti".
 *
 * Endpoints (Web App, executar como: eu, acesso: qualquer pessoa):
 *   GET  ?token=...&mes=2026-11   -> fatura do mês (default: mês atual)
 *   POST (text/plain, JSON)       -> { acao: criar | editar | excluir | repassar, ... }
 *
 * Modelo: a aba "Compras" tem UMA linha por compra. As parcelas são calculadas
 * (parcela k cai no mês faturaInicial + (k - parcelaInicial)); nada é gravado por parcela.
 *
 * Configuração: Project Settings > Script Properties > TOKEN (use gerarToken() no editor).
 */

const FUSO = 'America/Sao_Paulo';
const CREDITO = 'Crédito Lucas';
const FORMAS = [CREDITO, 'Débito', 'Pix'];

const ABA_COMPRAS = 'Compras';
const ABA_CATEGORIAS = 'Categorias';
const ABA_CONFIG = 'Config';
const ABA_REPASSES = 'Repasses';

const CABECALHO = ['ID', 'Data da compra', 'Loja', 'Categoria', 'Forma', 'Valor da parcela',
  'Parcelas', 'Parcela inicial', 'Fatura da parcela inicial', 'Obs', 'Criado em'];
const FORMATOS = ['@', '@', '@', '@', '@', '0.00', '0', '0', '@', '@', '@'];
const NUM_COLUNAS = CABECALHO.length;

const PROXIMAS_FATURAS = 6;
const MAX_PARCELAS = 48;

/* ------------------------------------------------------------------ */
/* HTTP                                                               */
/* ------------------------------------------------------------------ */

function doGet(e) {
  try {
    autorizar(e.parameter.token);
    const mes = mesValido(e.parameter.mes) ? e.parameter.mes : mesDe(hojeISO());
    return json({ ok: true, dados: dados(mes) });
  } catch (err) {
    return json({ ok: false, erro: err.message });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const p = JSON.parse(e.postData.contents);
    autorizar(p.token);
    lock.waitLock(10000);

    let mesAlvo;
    switch (p.acao) {
      case 'criar':
        mesAlvo = criarCompra(p.compra, p.idLocal).faturaInicial;
        break;
      case 'editar':
        editarCompra(p.id, p.compra);
        mesAlvo = null;
        break;
      case 'excluir':
        excluirCompra(p.id);
        mesAlvo = null;
        break;
      case 'repassar':
        definirRepasse(p.mes, p.repassada === true);
        mesAlvo = null;
        break;
      default:
        throw new Error('ação inválida');
    }

    SpreadsheetApp.flush();
    // criar leva para o mês onde a compra caiu; as demais ficam no mês que ela está vendo (p.mes)
    const mes = mesAlvo || (mesValido(p.mes) ? p.mes : mesDe(hojeISO()));
    return json({ ok: true, mesAlvo: mes, dados: dados(mes) });
  } catch (err) {
    return json({ ok: false, erro: err.message });
  } finally {
    lock.releaseLock();
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function autorizar(token) {
  const esperado = PropertiesService.getScriptProperties().getProperty('TOKEN');
  if (!esperado) throw new Error('TOKEN não configurado nas Script Properties');
  if (token !== esperado) throw new Error('não autorizado');
}

/* ------------------------------------------------------------------ */
/* Meses                                                              */
/* ------------------------------------------------------------------ */

function hojeISO() {
  return Utilities.formatDate(new Date(), FUSO, 'yyyy-MM-dd');
}

function mesDe(dataISO) { return dataISO.slice(0, 7); }

function mesValido(mes) { return typeof mes === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes); }

function dataValida(data) { return typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data); }

function indiceMes(mes) {
  const [a, m] = mes.split('-').map(Number);
  return a * 12 + (m - 1);
}

function somarMeses(mes, n) {
  const t = indiceMes(mes) + n;
  return `${Math.floor(t / 12)}-${String(t % 12 + 1).padStart(2, '0')}`;
}

/** Compra no crédito a partir do dia de fechamento cai na fatura do mês seguinte. */
function mesDaFatura(dataISO, forma, fechamento) {
  const mes = mesDe(dataISO);
  if (forma === CREDITO && Number(dataISO.slice(8, 10)) >= fechamento) return somarMeses(mes, 1);
  return mes;
}

/* ------------------------------------------------------------------ */
/* Leitura da planilha                                                */
/* ------------------------------------------------------------------ */

function aba(nome) {
  const a = SpreadsheetApp.getActive().getSheetByName(nome);
  if (!a) throw new Error(`aba "${nome}" não existe: rode configurarPlanilha() no editor`);
  return a;
}

/** Células de data/mês editadas à mão podem virar Date: normaliza de volta para texto. */
function texto(v, formato) {
  if (v instanceof Date) return Utilities.formatDate(v, FUSO, formato);
  return String(v === null || v === undefined ? '' : v).trim();
}

function lerCompras() {
  const a = aba(ABA_COMPRAS);
  const n = a.getLastRow() - 1;
  if (n < 1) return [];
  return a.getRange(2, 1, n, NUM_COLUNAS).getValues()
    .map((r, i) => ({
      linha: i + 2,
      id: texto(r[0]),
      data: texto(r[1], 'yyyy-MM-dd'),
      loja: texto(r[2]),
      categoria: texto(r[3]),
      forma: texto(r[4]),
      valor: Number(r[5]) || 0,
      parcelas: Math.max(1, Number(r[6]) || 1),
      parcelaInicial: Math.max(1, Number(r[7]) || 1),
      faturaInicial: texto(r[8], 'yyyy-MM'),
      obs: texto(r[9]),
    }))
    .filter(c => c.id && c.loja && mesValido(c.faturaInicial));
}

function lerConfig() {
  const a = aba(ABA_CONFIG);
  const valores = {};
  a.getRange(1, 1, Math.max(a.getLastRow(), 1), 2).getValues()
    .forEach(([k, v]) => { valores[texto(k).toLowerCase()] = Number(v); });
  return {
    vencimento: valores['dia do vencimento'] || 20,
    fechamento: valores['dia do fechamento'] || 14,
  };
}

function listarCategorias() {
  const a = aba(ABA_CATEGORIAS);
  if (a.getLastRow() < 2) return [];
  return a.getRange(2, 1, a.getLastRow() - 1, 1).getValues().flat()
    .map(v => texto(v)).filter(Boolean);
}

function lerRepasses() {
  const a = aba(ABA_REPASSES);
  if (a.getLastRow() < 2) return [];
  return a.getRange(2, 1, a.getLastRow() - 1, 1).getValues().flat().map(v => texto(v, 'yyyy-MM'));
}

/* ------------------------------------------------------------------ */
/* Painel                                                             */
/* ------------------------------------------------------------------ */

/** Itens (parcelas e gastos à vista) que caem em `mes`. */
function itensDoMes(compras, mes) {
  const itens = [];
  compras.forEach(c => {
    const diff = indiceMes(mes) - indiceMes(c.faturaInicial);
    const parcela = c.parcelaInicial + diff;
    if (diff < 0 || parcela > c.parcelas) return;
    itens.push({
      id: c.id, data: c.data, loja: c.loja, categoria: c.categoria, forma: c.forma,
      valor: c.valor, parcela, parcelas: c.parcelas, parcelaInicial: c.parcelaInicial,
      faturaInicial: c.faturaInicial, obs: c.obs,
    });
  });
  return itens.sort((x, y) => (x.data < y.data ? 1 : x.data > y.data ? -1 : 0));
}

function soma(itens) { return arred(itens.reduce((s, i) => s + i.valor, 0)); }

function dados(mes) {
  const compras = lerCompras();
  const config = lerConfig();
  const repassados = lerRepasses();
  const hoje = hojeISO();

  const itens = itensDoMes(compras, mes);
  const credito = itens.filter(i => i.forma === CREDITO);
  const avista = itens.filter(i => i.forma !== CREDITO);

  const porCat = {};
  itens.forEach(i => { porCat[i.categoria] = (porCat[i.categoria] || 0) + i.valor; });
  const porCategoria = Object.keys(porCat)
    .map(categoria => ({ categoria, total: arred(porCat[categoria]) }))
    .sort((a, b) => b.total - a.total);

  const proximas = [];
  for (let k = 0; k < PROXIMAS_FATURAS; k++) {
    const m = somarMeses(mesDe(hoje), k);
    proximas.push({
      mes: m,
      total: soma(itensDoMes(compras, m).filter(i => i.forma === CREDITO)),
      repassada: repassados.includes(m),
    });
  }

  return {
    hoje,
    config,
    categorias: listarCategorias(),
    fatura: {
      mes,
      vencimento: `${mes}-${String(config.vencimento).padStart(2, '0')}`,
      total: soma(itens),
      totalCredito: soma(credito),
      totalAvista: soma(avista),
      repassada: repassados.includes(mes),
      itens,
      porCategoria,
    },
    proximas,
  };
}

function arred(n) { return Math.round(n * 100) / 100; }

/* ------------------------------------------------------------------ */
/* Escrita                                                            */
/* ------------------------------------------------------------------ */

/**
 * c = { data: 'YYYY-MM-DD', loja, categoria, forma, valor (da parcela),
 *       parcelas?, parcelaInicial?, faturaInicial?: 'YYYY-MM', obs? }
 * À vista (débito/pix): 1 parcela, no mês da própria data.
 */
function normalizar(c) {
  if (!c) throw new Error('compra ausente');
  const loja = String(c.loja || '').trim();
  const valor = Number(c.valor);
  if (!loja) throw new Error('loja obrigatória');
  if (!(valor > 0)) throw new Error('valor inválido');
  if (!FORMAS.includes(c.forma)) throw new Error('forma de pagamento inválida');
  if (!listarCategorias().includes(c.categoria)) throw new Error('categoria inválida');
  if (!dataValida(c.data)) throw new Error('data inválida');

  let parcelas = 1;
  let parcelaInicial = 1;
  let faturaInicial = mesDe(c.data);
  if (c.forma === CREDITO) {
    parcelas = Math.round(Number(c.parcelas) || 1);
    parcelaInicial = Math.round(Number(c.parcelaInicial) || 1);
    if (parcelas < 1 || parcelas > MAX_PARCELAS) throw new Error('número de parcelas inválido');
    if (parcelaInicial < 1 || parcelaInicial > parcelas) throw new Error('parcela inicial inválida');
    faturaInicial = mesValido(c.faturaInicial)
      ? c.faturaInicial
      : mesDaFatura(c.data, c.forma, lerConfig().fechamento);
  }
  return {
    data: c.data, loja, categoria: c.categoria, forma: c.forma, valor: arred(valor),
    parcelas, parcelaInicial, faturaInicial, obs: String(c.obs || '').trim(),
  };
}

function criarCompra(c, idLocal) {
  const n = normalizar(c);
  const id = idLocal && String(idLocal).length <= 64 ? String(idLocal) : Utilities.getUuid();
  // O app reenvia a fila offline com o mesmo id: se já foi lançado, não duplica.
  const existente = lerCompras().find(x => x.id === id);
  if (existente) return existente;

  const a = aba(ABA_COMPRAS);
  const linha = a.getLastRow() + 1;
  escreverLinha(a, linha, [id, n.data, n.loja, n.categoria, n.forma, n.valor, n.parcelas,
    n.parcelaInicial, n.faturaInicial, n.obs, Utilities.formatDate(new Date(), FUSO, "yyyy-MM-dd'T'HH:mm:ss")]);
  return n;
}

function editarCompra(id, c) {
  const atual = lerCompras().find(x => x.id === String(id));
  if (!atual) throw new Error('compra não encontrada (talvez já excluída)');
  const n = normalizar(c);
  const a = aba(ABA_COMPRAS);
  const criadoEm = a.getRange(atual.linha, NUM_COLUNAS).getValue();
  escreverLinha(a, atual.linha, [atual.id, n.data, n.loja, n.categoria, n.forma, n.valor, n.parcelas,
    n.parcelaInicial, n.faturaInicial, n.obs, criadoEm]);
  return n;
}

function excluirCompra(id) {
  const atual = lerCompras().find(x => x.id === String(id));
  if (!atual) return; // já excluída: idempotente
  aba(ABA_COMPRAS).deleteRow(atual.linha);
}

function escreverLinha(a, linha, valores) {
  const faixa = a.getRange(linha, 1, 1, NUM_COLUNAS);
  faixa.setNumberFormats([FORMATOS]); // texto antes do valor, senão "2026-11" vira data
  faixa.setValues([valores]);
}

function definirRepasse(mes, repassada) {
  if (!mesValido(mes)) throw new Error('mês inválido');
  const a = aba(ABA_REPASSES);
  const meses = lerRepasses();
  if (repassada) {
    if (meses.includes(mes)) return;
    const linha = a.getLastRow() + 1;
    a.getRange(linha, 1, 1, 2).setNumberFormats([['@', '@']]);
    a.getRange(linha, 1, 1, 2).setValues([[mes, hojeISO()]]);
    return;
  }
  for (let i = meses.length - 1; i >= 0; i--) {
    if (meses[i] === mes) a.deleteRow(i + 2);
  }
}

/* ------------------------------------------------------------------ */
/* Setup (rodar uma vez no editor)                                    */
/* ------------------------------------------------------------------ */

const CATEGORIAS_INICIAIS = ['Roupas', 'Calçados', 'Beleza', 'Casa', 'Presentes', 'Saúde', 'Lazer',
  'Alimentação', 'Eletrônicos', 'Transporte', 'Outros'];

// Compras que já estavam na fatura de novembro/2026. O nome do extrato fica na observação.
const COMPRAS_INICIAIS = [
  ['seed-renner', '2026-11-01', 'Renner', 'Roupas', CREDITO, 163.11, 2, 1, '2026-11', ''],
  ['seed-lofty', '2026-08-08', 'Lofty Style', 'Roupas', CREDITO, 158.29, 6, 4, '2026-11', 'extrato: LOFTY STYLE COMERCIAL SAO PAULO BRA'],
  ['seed-zara', '2026-08-08', 'Zara', 'Roupas', CREDITO, 181.10, 5, 4, '2026-11', 'extrato: INDITEX BRASIL LTDA BELO HORIZONTE BRA'],
  ['seed-lizie', '2026-08-08', 'Lizie', 'Roupas', CREDITO, 217.16, 6, 4, '2026-11', 'extrato: LIZIE BELO HORIZONTE BRA'],
];

/** Cria as abas que faltam e a carga inicial. Pode rodar de novo sem duplicar nada. */
function configurarPlanilha() {
  const ss = SpreadsheetApp.getActive();
  const padrao = ss.getSheets().filter(s => ['Sheet1', 'Página1', 'Planilha1'].includes(s.getName()));

  const compras = ss.getSheetByName(ABA_COMPRAS) || ss.insertSheet(ABA_COMPRAS);
  if (compras.getLastRow() === 0) {
    compras.getRange(1, 1, 1, NUM_COLUNAS).setNumberFormat('@').setValues([CABECALHO])
      .setFontWeight('bold').setBackground('#f3e8ff');
    compras.setFrozenRows(1);
    COMPRAS_INICIAIS.forEach(([id, data, loja, cat, forma, valor, parcelas, inicial, fatura, obs], i) => {
      escreverLinha(compras, 2 + i, [id, data, loja, cat, forma, valor, parcelas, inicial, fatura, obs, 'carga inicial']);
    });
    compras.autoResizeColumns(1, NUM_COLUNAS);
  }

  const categorias = ss.getSheetByName(ABA_CATEGORIAS) || ss.insertSheet(ABA_CATEGORIAS);
  if (categorias.getLastRow() === 0) {
    categorias.getRange(1, 1).setValue('Categoria').setFontWeight('bold').setBackground('#f3e8ff');
    categorias.getRange(2, 1, CATEGORIAS_INICIAIS.length, 1).setValues(CATEGORIAS_INICIAIS.map(c => [c]));
    categorias.setColumnWidth(1, 180);
  }

  const config = ss.getSheetByName(ABA_CONFIG) || ss.insertSheet(ABA_CONFIG);
  if (config.getLastRow() === 0) {
    config.getRange(1, 1, 2, 2).setValues([['Dia do vencimento', 20], ['Dia do fechamento', 14]]);
    config.getRange(4, 1).setValue(
      'Compra no crédito a partir do dia do fechamento cai na fatura do mês seguinte.');
    config.setColumnWidth(1, 180);
  }

  const repasses = ss.getSheetByName(ABA_REPASSES) || ss.insertSheet(ABA_REPASSES);
  if (repasses.getLastRow() === 0) {
    repasses.getRange(1, 1, 1, 2).setValues([['Fatura (mês)', 'Repassada em']])
      .setFontWeight('bold').setBackground('#f3e8ff');
    repasses.setColumnWidth(1, 120);
    repasses.setColumnWidth(2, 120);
  }

  padrao.forEach(s => { if (s.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s); });
  Logger.log('Planilha configurada. Próximo passo: rode gerarToken().');
}

/** Gera o token do app e mostra no log (não fica no código nem no Git). Não sobrescreve um existente. */
function gerarToken() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('TOKEN')) {
    Logger.log('Já existe um TOKEN. Para trocar, rode redefinirToken().');
    return;
  }
  redefinirToken();
}

function redefinirToken() {
  const alfabeto = 'abcdefghijkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 10; i++) token += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  PropertiesService.getScriptProperties().setProperty('TOKEN', token);
  Logger.log('TOKEN: ' + token);
}

/* ------------------------------------------------------------------ */
/* Teste manual no editor                                             */
/* ------------------------------------------------------------------ */

function testeDados() {
  Logger.log(JSON.stringify(dados(somarMeses(mesDe(hojeISO()), 0)), null, 2));
}
