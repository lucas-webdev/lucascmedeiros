# Jogos

Página em `lucascmedeiros.com.br/jogos` que busca as partidas de jogos de tabuleiro registradas no **BoardGameGeek (BGG)** e mostra estatísticas e filtros sobre elas. É uma página oculta (sem link no menu, `noindex`), standalone e em PT-BR, como `/futebol` e `/despesas`.

## O que a página mostra

- **Totais:** quantas partidas (e quantas foram digitais) e quantos jogos diferentes (e quantos foram jogados apenas digitalmente).
- **Filtros:** período, local e jogador. Local e jogador aceitam vários itens e têm dois modos: *incluir* ("somente estes") e *excluir* ("todos, exceto estes"). Os totais e a lista acompanham os filtros.
- **Marcos de jogos diferentes:** a partida em que a contagem chegou a 100, 300, 500, 900, 999, 1000, 1200, 1500, 1999 e 2000 jogos diferentes. Os que ainda não foram alcançados mostram quantos jogos faltam e se preenchem sozinhos quando as partidas novas chegam ao BGG.
- **Jogos apenas digitais:** os jogos que nunca foram jogados fora de plataformas digitais (Board Game Arena, BGA, Online e Tabletop Simulator).
- **Lista de partidas** com jogo, data, local, duração, jogadores (vencedor em destaque) e comentário.

## Como funciona

São duas partes:

| Parte | Onde | Roda em |
| --- | --- | --- |
| Proxy da API do BGG (PHP) | `public/api/bgg.php` | servidor PHP da hospedagem |
| Página (rota Next.js `/jogos`) | `src/app/jogos`, `src/components/jogos`, `src/lib/jogos-*.ts` | build estático do site, deploy via FTPS |

O navegador nunca fala com o BGG: ele chama `/api/bgg.php`, que consulta o BGG com o token guardado no servidor, guarda o resultado em cache e devolve JSON. Isso é exigência do BGG (token obrigatório, e eles recomendam chamadas pelo servidor, com cache).

A página busca todas as páginas de partidas em sequência (100 por vez) e faz o resto (filtros, totais, marcos) no navegador, sem novas chamadas.

## Token do BGG

A API do BGG só responde com um token de aplicação (`Authorization: Bearer ...`):

1. Registre uma aplicação **não comercial** em https://boardgamegeek.com/applications (a aprovação pode levar dias ou semanas).
2. Depois de aprovada, gere um token em **Tokens** ao lado da aplicação.
3. No GitHub, **Settings → Secrets and variables → Actions**, crie o secret **`BGG_API_KEY`** com o token.

O workflow `.github/workflows/deploy.yml` grava o valor em `public/api/config.php` (arquivo gerado no deploy e ignorado pelo Git) como a constante `BGG_TOKEN`. Sem o secret, o site publica normalmente, mas o proxy responde "Token do BGG não configurado" e a página mostra esse erro.

O token **nunca** vai para o repositório nem para o navegador.

## Testar localmente

O `npm run dev` não executa PHP, então para testar de ponta a ponta use o build estático servido pelo PHP:

1. Crie `public/api/config.php` (já está no `.gitignore`) com o token:

   ```php
   <?php
   define('BGG_TOKEN', 'seu-token-aqui');
   ```

2. Gere o site e sirva a pasta `out/` com o servidor embutido do PHP:

   ```bash
   npm run build
   php -S localhost:8092 -t out
   ```

3. Abra http://localhost:8092/jogos/ e clique em **Buscar**.

Observações:

- O build copia `public/api/config.php` para `out/api/`. Não faça deploy nem commit dessa pasta.
- No Windows, o PHP costuma vir sem bundle de certificados e a chamada ao BGG falha com `SSL certificate problem`. Aponte para um bundle ao subir o servidor, por exemplo o que vem com o Git for Windows:

  ```bash
  CA="C:/Program Files/Git/mingw64/etc/ssl/certs/ca-bundle.crt"
  php -d curl.cainfo="$CA" -d openssl.cafile="$CA" -S localhost:8092 -t out
  ```

- Para testar sem gastar a cota do token, defina também `BGG_BASE_URL` no `config.php` apontando para um servidor falso que imite `/xmlapi2/plays`.

## Onde ajustar

| O quê | Onde |
| --- | --- |
| Números dos marcos | `src/lib/jogos-marcos.ts` (`MARCOS_JOGOS_DIFERENTES`) |
| O que conta como digital | `src/lib/jogos-stats.ts` (`NOMES_LOCAIS_DIGITAIS`) |
| Tempo de cache e intervalo entre chamadas ao BGG | `public/api/bgg.php` (`BGG_CACHE_TTL`, `BGG_MIN_GAP_MICRO`) |
| Novo filtro | `src/lib/jogos-filtros.ts` (regra) e `src/components/jogos/filtros-partidas.tsx` (tela) |
| Usuário que vem preenchido | `src/components/jogos/jogos-app.tsx` (`USUARIO_PADRAO`) |

## Regras de contagem

- **Partidas** somam a quantidade de cada registro: uma partida lançada com quantidade 2 conta 2.
- **Jogos diferentes** são contados pelo id do jogo no BGG.
- **Local:** o BGG guarda texto livre, então locais são agrupados ignorando maiúsculas, espaços extras e acentos (`Brechó Lúdico` e `brecho lúdico` são o mesmo). Partidas sem local contam como fora do digital.
- **Jogador:** quem tem usuário do BGG é identificado por ele. Um nome digitado sem usuário é unido a um usuário quando esse nome só foi usado junto de um único usuário em outras partidas (assim `Leti`, `.. Leti` e `leti_rocha` são a mesma pessoa).
- **Marcos:** o N-ésimo jogo diferente é aquele cuja primeira partida é a N-ésima, em ordem cronológica, entre as primeiras partidas de cada jogo. O quadro ignora os filtros.
- **Jogos apenas digitais** seguem os filtros da página, para a lista ter o mesmo tamanho do número mostrado no card.
- O BGG devolve por padrão itens do tipo `boardgame`. Expansões e coletâneas já vêm junto, porque também têm esse tipo.

## Limitações

- **Ordem no mesmo dia:** o BGG não guarda a hora da partida e os ids dos registros não seguem a data (por exemplo, após importar do BG Stats). Quando mais de um jogo estreou no mesmo dia de um marco, a ordem entre eles é aproximada, e o quadro avisa.
- **Cache de 10 minutos:** depois de lançar partidas no BGG, elas podem demorar até 10 minutos para aparecerem aqui.
- **Sem trava de usuário:** a página aceita qualquer usuário do BGG e usa o mesmo token. Ela não está linkada em lugar nenhum, mas quem souber a URL consegue consultar.
- **BG Stats ≠ BGG:** os números vêm só do BGG. Partidas que estão apenas no BG Stats (ainda não sincronizadas) não entram.

## Termos do BGG

O uso da API segue os [termos de uso do BGG](https://boardgamegeek.com/wiki/page/XML_API_Terms_of_Use): somente fins não comerciais, dados não modificados, sem uso para treinar IA, e crédito ao BoardGameGeek com o logo "Powered by BGG" em páginas públicas. O rodapé mostra o logo oficial, linkado ao BGG: são os SVGs `powered-by-bgg-rgb.svg` (fundo claro) e `powered-by-bgg-reversed-rgb.svg` (fundo escuro) em `public/jogos/`, baixados da [pasta de logos do BGG](https://boardgamegeek.com/wiki/page/XML_API_Terms_of_Use); a página escolhe a versão pelo tema do sistema.
