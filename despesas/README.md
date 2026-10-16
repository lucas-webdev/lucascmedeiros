# Despesas

PWA em `lucascmedeiros.com.br/despesas` para acompanhar os gastos do mês e lançar despesas pelo celular. Os dados ficam na planilha Google **Controle_Financeiro_2026**.

São duas partes:

| Parte | Onde | Roda em |
| --- | --- | --- |
| Backend (Google Apps Script, Web App) | `despesas/apps-script/` | servidores do Google |
| Frontend (rota Next.js `/despesas`) | `src/app/despesas`, `src/components/despesas`, `src/lib/despesas-*.ts`, `public/despesas/` | build estático do site, deploy via FTPS |

O frontend só faz `fetch` para a URL `/exec` do Apps Script. Nada do backend entra no bundle.

## Variáveis de ambiente

Copie `.env.example` para `.env` (ignorado pelo Git):

| Variável | Para quê |
| --- | --- |
| `NEXT_PUBLIC_DESPESAS_API` | URL `/exec` da implantação. Lida pelo frontend **no build**. |
| `DESPESAS_DEPLOYMENT_ID` | ID da implantação. Usado por `npm run despesas:api:deploy`. |

A URL `/exec` não é segredo (quem protege é o token), mas o `.env` não vai ao Git, então o CI precisa dela:
no GitHub, **Settings → Secrets and variables → Actions**, crie o secret **`DESPESAS_API_URL`** com a mesma URL. O workflow `.github/workflows/deploy.yml` a injeta como `NEXT_PUBLIC_DESPESAS_API` no `npm run build`. Sem ele, o site publica, mas `/despesas` mostra "API não configurada".

O **token nunca** vai para o repositório nem para o bundle. Ele vive em dois lugares: nas Script Properties do Apps Script e no `localStorage` de cada aparelho.

## Backend com clasp

Versão instalada: `@google/clasp` 3.x (os comandos mudaram em relação à v2).

### Setup (uma vez)

1. Habilite a Apps Script API em https://script.google.com/home/usersettings.
2. `npx clasp login` (abre o navegador). As credenciais ficam em `~/.clasprc.json`, **fora** do repo.
3. O projeto já existe e está vinculado à planilha; o `scriptId` está em `despesas/apps-script/.clasp.json` (pode ser commitado, não é credencial). Para recriar do zero:

   ```bash
   cd despesas/apps-script
   npx clasp create --title "Despesas API" --parentId <ID da planilha>
   ```

   > Use **sem** `--type`. No clasp 3, `--type sheets` ignora o `--parentId` e cria uma planilha nova em branco. Depois do `create`, o clasp sobrescreve o `appsscript.json` local com o padrão dele: restaure o do Git (`git checkout despesas/apps-script/appsscript.json`) antes do primeiro push.
4. No editor (`cd despesas/apps-script && npx clasp open-script`): defina a Script Property `TOKEN` e execute `testePainel` uma vez para autorizar o acesso à planilha.
5. Crie a primeira implantação e guarde o ID no `.env`:

   ```bash
   cd despesas/apps-script
   npx clasp deploy -d "v1 inicial"
   npx clasp deployments
   ```

   A URL é `https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec`.

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run despesas:api:push` | Envia o código para o Apps Script (não muda o que está publicado). |
| `npm run despesas:api:deploy -- mensagem` | `push` + atualiza **a mesma implantação** pelo `DESPESAS_DEPLOYMENT_ID`. |
| `npm run despesas:api:logs` | Logs recentes do Apps Script. |

### Como fazer deploy sem mudar a URL

Rode sempre `npm run despesas:api:deploy`. Ele usa `clasp redeploy <ID>`, que aponta a implantação existente para uma versão nova, então o ID e a URL `/exec` **não mudam**.

**Nunca** rode `clasp deploy` sem `-i`/`redeploy` numa atualização de rotina: isso cria uma implantação nova, com URL nova, e o app para de funcionar até você atualizar o `.env` e o secret do CI.

O CI do site não roda clasp. O deploy do backend é sempre manual.

### Como trocar o token

1. No editor do Apps Script: **Configurações do projeto → Propriedades do script → `TOKEN`**, altere o valor e salve. Vale na hora, sem novo deploy.
2. Em cada aparelho, o app mostra a tela de token na próxima chamada (ou use **Trocar token** no rodapé do painel).

### Contrato da API

Respostas de erro vêm como `{ ok: false, erro }` com HTTP 200.

- `GET {API}?token=…&mes=Outubro` → `{ ok, categorias, painel }` (`mes` opcional).
- `POST {API}` com `Content-Type: text/plain;charset=utf-8` (o Apps Script não responde a preflight CORS) e corpo JSON `{ token, data, descricao, categoria, valor, forma, conta, obs, idLocal? }` → `{ ok, lancamento: { aba, linha }, painel }`.

`idLocal` é opcional e serve para a fila offline: se o mesmo id chegar de novo, o backend devolve a linha já lançada (`lancamento.repetido: true`) em vez de duplicar. Os últimos 80 ids ficam nas Script Properties.

O script depende da estrutura da planilha: abas com nome do mês, `TOTAL GASTOS` na coluna C de cada aba mensal, tabela de categorias no "Controle Geral" entre `Categoria` e `TOTAL`, aba "Categorias" e aba "Fixos". A inserção de linha nova acontece **dentro** do intervalo somado, para o `SUM` e o "Anual" enxergarem a linha; não "simplifique" isso.

## Frontend e PWA

- Manifest em `public/despesas/manifest.webmanifest` (`scope` e `start_url` em `/despesas/`) e service worker em `public/despesas/sw.js`. O SW precisa ficar nesse caminho para o escopo ser `/despesas/`: ele **não** controla a raiz nem o `/futebol`.
- O SW só é registrado em produção (em `npm run dev` os chunks não têm hash e o cache serviria código velho). Ele cacheia o shell do app; o painel usa stale-while-revalidate no próprio app (`localStorage`), para o token não ir parar no Cache Storage.
- Para forçar a atualização do cache do SW, incremente `VERSAO` em `public/despesas/sw.js`.
- Os ícones são gerados por `node despesas/scripts/gerar-icones.mjs` (usa `sharp`).
- Fila offline: se o POST falhar por rede, o lançamento vai para o IndexedDB (`despesas` / `pendentes`), aparece como "pendente de envio" e é reenviado ao voltar a conexão, ao abrir o app ou ao puxar para atualizar. Se o servidor recusar um item (ex.: categoria que não existe mais), ele fica marcado como "recusado" para você descartar.

### Testar o PWA localmente

O service worker só roda no build de produção:

```bash
npm run build
python -m http.server 3055 --directory out
```

Abra http://localhost:3055/despesas/ no Chrome. O navegador embutido do Claude Code não registra service workers; use o Chrome.
