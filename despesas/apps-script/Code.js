/**
 * Backend do app /despesas (lucascmedeiros.com.br/despesas)
 * Google Apps Script vinculado à planilha Controle_Financeiro_2026.
 *
 * Endpoints (Web App, executar como: eu, acesso: qualquer pessoa):
 *   GET  ?token=...&mes=Outubro   -> painel do mês (default: mês atual)
 *   POST (text/plain, JSON)       -> lança um gasto e devolve o painel atualizado
 *
 * Configuração: Project Settings > Script Properties > TOKEN = <segredo>
 */

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Dia de corte de cada cartão: compra depois desse dia cai na fatura do mês seguinte
const CORTE = { C6: 12, Inter: 13, Nubank: 12 };

const FORMAS = ['Crédito', 'Débito', 'Pix'];
const CONTAS = ['C6', 'Inter', 'Nubank', 'C6 PJ', '-'];
const IGNORAR_NO_TOTAL = ['Transferência interna'];

/* ------------------------------------------------------------------ */
/* HTTP                                                               */
/* ------------------------------------------------------------------ */

function doGet(e) {
  try {
    autorizar(e.parameter.token);
    const mes = e.parameter.mes || MESES[new Date().getMonth()];
    return json({ ok: true, painel: painel(mes), categorias: listarCategorias() });
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
    // idLocal (opcional): o app reenvia a fila offline com o mesmo id; se já foi lançado, não duplica
    const anterior = buscarLancamento(p.idLocal);
    const r = anterior || lancarGasto(p);
    if (!anterior) registrarLancamento(p.idLocal, r);
    SpreadsheetApp.flush();
    return json({ ok: true, lancamento: r, painel: painel(r.aba) });
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
/* Lançamento                                                         */
/* ------------------------------------------------------------------ */

const PROP_LANCAMENTOS = 'LANCAMENTOS_RECENTES';
const MAX_LANCAMENTOS_GUARDADOS = 80; // Script Properties aceita ~9KB por valor

function lancamentosRecentes() {
  const raw = PropertiesService.getScriptProperties().getProperty(PROP_LANCAMENTOS);
  return raw ? JSON.parse(raw) : {};
}

function buscarLancamento(idLocal) {
  if (!idLocal) return null;
  const hit = lancamentosRecentes()[String(idLocal)];
  return hit ? { aba: hit[0], linha: hit[1], repetido: true } : null;
}

function registrarLancamento(idLocal, r) {
  if (!idLocal || String(idLocal).length > 64) return;
  const mapa = lancamentosRecentes();
  mapa[String(idLocal)] = [r.aba, r.linha];
  const chaves = Object.keys(mapa);
  chaves.slice(0, Math.max(0, chaves.length - MAX_LANCAMENTOS_GUARDADOS)).forEach(k => delete mapa[k]);
  PropertiesService.getScriptProperties().setProperty(PROP_LANCAMENTOS, JSON.stringify(mapa));
}

/**
 * p = { data: 'YYYY-MM-DD', descricao, categoria, valor, forma, conta, obs?, mes?, idLocal? }
 * Se `mes` vier preenchido, ele manda. Senão o mês é calculado pela regra de corte.
 */
function lancarGasto(p) {
  const valor = Number(p.valor);
  if (!p.descricao || !String(p.descricao).trim()) throw new Error('descrição obrigatória');
  if (!(valor > 0)) throw new Error('valor inválido');
  if (!FORMAS.includes(p.forma)) throw new Error('forma de pagamento inválida');
  if (!CONTAS.includes(p.conta)) throw new Error('conta inválida');
  if (!listarCategorias().includes(p.categoria)) throw new Error('categoria inválida');

  const mes = p.mes || mesDestino(p.data, p.forma, p.conta);
  const aba = SpreadsheetApp.getActive().getSheetByName(mes);
  if (!aba) throw new Error(`aba "${mes}" não existe`);

  const linha = proximaLinhaLivre(aba);
  const [, mm, dd] = p.data.split('-');
  const obs = ['app', p.obs].filter(Boolean).join(' · ');

  // Data e observação como texto, senão "1/3" vira data
  aba.getRange(linha, 1).setNumberFormat('@');
  aba.getRange(linha, 7).setNumberFormat('@');
  aba.getRange(linha, 1, 1, 7).setValues([[
    `${dd}/${mm}`, String(p.descricao).trim(), p.categoria, valor, p.forma, p.conta, obs,
  ]]);

  return { aba: mes, linha };
}

function mesDestino(dataISO, forma, conta) {
  const d = new Date(`${dataISO}T12:00:00`);
  let m = d.getMonth();
  if (forma === 'Crédito' && d.getDate() > (CORTE[conta] || 31)) m += 1;
  if (m > 11) throw new Error('compra cai na fatura de janeiro do próximo ano: crie a planilha de 2027');
  return MESES[m];
}

/** Primeira linha com B e D vazios entre a linha 4 e "TOTAL GASTOS". Se não houver, abre uma. */
function proximaLinhaLivre(aba) {
  const totalRow = acharLinha(aba, 3, 'TOTAL GASTOS');
  const n = totalRow - 4;
  const bd = aba.getRange(4, 2, n, 3).getValues(); // B:D
  const idx = bd.findIndex(r => r[0] === '' && r[2] === '');
  if (idx >= 0) return 4 + idx;

  // Insere DENTRO do intervalo somado (antes da última linha de dados),
  // pra que SUM(D4:Dn) e as referências do Anual se expandam sozinhas.
  aba.insertRowBefore(totalRow - 1);
  return totalRow - 1;
}

function acharLinha(aba, col, texto) {
  const vals = aba.getRange(1, col, aba.getLastRow(), 1).getValues().flat();
  const i = vals.indexOf(texto);
  if (i < 0) throw new Error(`"${texto}" não encontrado na aba ${aba.getName()}`);
  return i + 1;
}

/* ------------------------------------------------------------------ */
/* Painel                                                             */
/* ------------------------------------------------------------------ */

function painel(mes) {
  const ss = SpreadsheetApp.getActive();
  const aba = ss.getSheetByName(mes);
  if (!aba) throw new Error(`aba "${mes}" não existe`);

  const vals = aba.getRange(1, 1, aba.getLastRow(), 13).getValues();
  const totalIdx = vals.findIndex(r => r[2] === 'TOTAL GASTOS');

  const gastos = vals.slice(3, totalIdx)
    .filter(r => r[1] !== '' && typeof r[3] === 'number')
    .map(r => ({
      data: formatarData(r[0]), descricao: r[1], categoria: r[2],
      valor: r[3], forma: r[4], conta: r[5], obs: r[6],
    }));

  const entradaReal = vals.slice(3)
    .filter(r => r[10] !== '' && r[10] !== 'TOTAL ENTRADAS' && typeof r[11] === 'number')
    .reduce((s, r) => s + r[11], 0);

  const { previstos, entradaPrevista } = lerPlanejamento();

  const realizadoPorCat = {};
  gastos.forEach(g => {
    if (IGNORAR_NO_TOTAL.includes(g.categoria)) return;
    realizadoPorCat[g.categoria] = (realizadoPorCat[g.categoria] || 0) + g.valor;
  });

  const categorias = Object.keys(previstos).map(nome => {
    const previsto = previstos[nome];
    const realizado = arred(realizadoPorCat[nome] || 0);
    return {
      nome, previsto, realizado,
      disponivel: arred(previsto - realizado),
      pct: previsto > 0 ? arred(realizado / previsto * 100) : null,
    };
  });

  const fixosPendentes = lerFixos().filter(f => {
    const re = new RegExp(f.chave, 'i');
    return !gastos.some(g => re.test(g.descricao));
  });

  const totalRealizado = arred(Object.values(realizadoPorCat).reduce((s, v) => s + v, 0));
  const totalPendente = arred(fixosPendentes.reduce((s, f) => s + f.valor, 0));
  const entradaBase = entradaReal || entradaPrevista;

  return {
    mes,
    hoje: Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd'),
    entradaPrevista, entradaReal,
    totalRealizado, totalPendente,
    disponivelMes: arred(entradaBase - totalRealizado - totalPendente),
    categorias,
    fixosPendentes,
    ultimos: gastos.slice(-15).reverse(),
  };
}

/** Lê Previsto por categoria e Entrada prevista do Controle Geral. */
function lerPlanejamento() {
  const cg = SpreadsheetApp.getActive().getSheetByName('Controle Geral');
  const vals = cg.getRange('A1:B60').getValues();
  const previstos = {};
  let entradaPrevista = 0;
  let dentroTabela = false;
  vals.forEach(([a, b]) => {
    if (a === 'Categoria') { dentroTabela = true; return; }
    if (a === 'TOTAL') { dentroTabela = false; return; }
    if (dentroTabela && a) previstos[a] = Number(b) || 0;
    if (a === 'Entrada prevista') entradaPrevista = Number(b) || 0;
  });
  return { previstos, entradaPrevista };
}

function lerFixos() {
  const aba = SpreadsheetApp.getActive().getSheetByName('Fixos');
  if (!aba || aba.getLastRow() < 4) return [];
  return aba.getRange(4, 1, aba.getLastRow() - 3, 5).getValues()
    .filter(r => r[0] && r[3] && String(r[4]).toLowerCase() !== 'não')
    .map(r => ({ descricao: r[0], categoria: r[1], valor: Number(r[2]) || 0, chave: r[3] }));
}

function listarCategorias() {
  const aba = SpreadsheetApp.getActive().getSheetByName('Categorias');
  return aba.getRange(4, 1, aba.getLastRow() - 3, 1).getValues().flat()
    .filter(v => v && !String(v).startsWith('Nota'));
}

function formatarData(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'America/Sao_Paulo', 'dd/MM');
  return String(v || '');
}

function arred(n) { return Math.round(n * 100) / 100; }

/* ------------------------------------------------------------------ */
/* Teste manual no editor                                             */
/* ------------------------------------------------------------------ */

function testePainel() {
  Logger.log(JSON.stringify(painel(MESES[new Date().getMonth()]), null, 2));
}
