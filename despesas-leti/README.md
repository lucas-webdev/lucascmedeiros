# Despesas Leti

PWA em `lucascmedeiros.com.br/despesas-leti` ("Leti · Gastos") para a Leti acompanhar a fatura do cartão do Lucas, as parcelas e os gastos no Pix e no débito. Os dados ficam na planilha Google **Controle Leti**, separada da do `/despesas`.

Mesma arquitetura do `/despesas` (veja `despesas/README.md` para o passo a passo do clasp, deploy sem mudar a URL e troca de token). Aqui só estão as diferenças.

| Parte | Onde |
| --- | --- |
| Backend (Apps Script, Web App) | `despesas-leti/apps-script/` |
| Frontend | `src/app/despesas-leti`, `src/components/despesas-leti`, `src/lib/despesas-leti-*.ts`, `public/despesas-leti/` |

## Regras do negócio

- Formas de pagamento: `Crédito Lucas` (parcelável), `Débito` e `Pix` (à vista).
- Cartão fecha dia **14** e vence dia **20** (aba `Config`). Compra no crédito **a partir do dia 14** cai na fatura do mês seguinte. Débito e Pix caem no mês da própria data.
- "Gasto no mês" = fatura Lucas do mês (por mês de vencimento) + Pix e débito do mês.
- A aba `Compras` tem **uma linha por compra**. As parcelas são calculadas: a parcela `k` cai em `faturaInicial + (k − parcelaInicial)`. Para uma compra que já começou (ex.: 4/6 em novembro), use `Parcelas = 6`, `Parcela inicial = 4`, `Fatura inicial = 2026-11`.
- `Valor da parcela` é o que fica gravado; quando ela digita o total, o app divide e arredonda (pode haver 1 a 2 centavos de diferença para o banco).
- Não há aba por mês, então não existe o problema de virada de ano do `/despesas`.

Abas: `Compras`, `Categorias` (editável), `Config` (vencimento e fechamento) e `Repasses` (faturas marcadas como repassadas ao Lucas).

## Variáveis de ambiente

| Variável | Para quê |
| --- | --- |
| `NEXT_PUBLIC_DESPESAS_LETI_API` | URL `/exec` da implantação. Lida pelo frontend **no build**. |
| `DESPESAS_LETI_DEPLOYMENT_ID` | ID da implantação. Usado por `npm run despesas-leti:api:deploy`. |

No CI, crie o secret **`DESPESAS_LETI_API_URL`** (Settings → Secrets and variables → Actions) com a URL `/exec`. O workflow o injeta como `NEXT_PUBLIC_DESPESAS_LETI_API`. Sem ele o site publica, mas `/despesas-leti` mostra "API não configurada".

O **token nunca** vai para o repositório. Ele vive nas Script Properties e no `localStorage` de cada aparelho.

## Setup do backend (uma vez)

Pré-requisito: `npx clasp login` já feito (veja `despesas/README.md`).

1. Crie a planilha **e** o script vinculado de uma vez (clasp 3, `--type sheets` cria uma planilha nova em branco):

   ```bash
   cd despesas-leti/apps-script
   npx clasp create --type sheets --title "Controle Leti"
   ```

   O clasp sobrescreve o `appsscript.json` local com o padrão dele: restaure o do Git antes do primeiro push (`git checkout despesas-leti/apps-script/appsscript.json`).
2. `npm run despesas-leti:api:push`
3. No editor (`npx clasp open-script`):
   - execute **`configurarPlanilha`** (autorize o acesso). Cria as abas e a carga inicial: Renner 1/2, Lofty Style 4/6, Zara 4/5 e Lizie 4/6, todas na fatura de novembro/2026;
   - execute **`gerarToken`** e leia o token no log de execução. Para trocar depois: `redefinirToken`.
4. Primeira implantação, guardando o ID no `.env`:

   ```bash
   cd despesas-leti/apps-script
   npx clasp deploy -d "v1 inicial"
   npx clasp deployments
   ```

   A URL é `https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec`. Coloque em `.env`:

   ```
   NEXT_PUBLIC_DESPESAS_LETI_API=<url /exec>
   DESPESAS_LETI_DEPLOYMENT_ID=<id>
   ```
5. Atualizações de rotina: `npm run despesas-leti:api:deploy -- mensagem` (mantém a mesma URL). **Nunca** use `clasp deploy` sem `-i`/`redeploy` nelas.

Conferência da carga inicial: novembro R$ 719,66, dezembro R$ 719,66, janeiro R$ 375,45 e fevereiro em diante zero.

## Contrato da API

Erros voltam como `{ ok: false, erro }` com HTTP 200.

- `GET {API}?token=…&mes=2026-11` → `{ ok, dados }`, com `dados = { hoje, config, categorias, fatura, proximas }`. `mes` é opcional (padrão: mês atual).
- `POST {API}` (`Content-Type: text/plain;charset=utf-8`, porque o Apps Script não responde a preflight CORS) com `{ token, acao, … }` → `{ ok, mesAlvo, dados }`:
  - `criar`: `{ idLocal, compra }`. O `idLocal` vira o ID da compra, então reenviar a fila offline não duplica. Responde no mês onde a compra caiu.
  - `editar`: `{ id, mes, compra }`
  - `excluir`: `{ id, mes }`
  - `repassar`: `{ mes, repassada }`
  - `compra = { data, loja, categoria, forma, valor (da parcela), parcelas, parcelaInicial, faturaInicial?, obs }`

## Frontend e PWA

- Manifest em `public/despesas-leti/manifest.webmanifest` e service worker em `public/despesas-leti/sw.js`, ambos com escopo `/despesas-leti/`. Esse escopo não se sobrepõe ao `/despesas/`.
- O cache do SW se chama `leti-gastos-*` **de propósito**: o SW do `/despesas` apaga todo cache com prefixo `despesas-` que não seja o dele, e o Cache Storage é compartilhado por origem.
- Só **criar** compra passa pela fila offline (IndexedDB `despesas-leti`). Editar, excluir e repassar exigem conexão.
- Ícones: `node despesas-leti/scripts/gerar-icones.mjs` (usa `sharp`).
- Para forçar a atualização do cache do SW, incremente `VERSAO` em `public/despesas-leti/sw.js`.
- Testar o PWA offline exige o build de produção no Chrome (veja `despesas/README.md`).
