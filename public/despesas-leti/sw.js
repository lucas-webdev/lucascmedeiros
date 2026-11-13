/*
 * Service worker do /despesas-leti — escopo restrito a /despesas-leti/ (não controla a raiz, o /despesas nem o /futebol).
 *
 * - App shell: HTML por rede primeiro (deploy novo aparece na hora), cache como fallback offline.
 * - /_next/static/*: nome com hash, imutável -> cache primeiro.
 * - Chamadas ao Apps Script (outra origem) nunca passam por aqui: os dados do painel têm
 *   stale-while-revalidate no próprio app (localStorage) para o token não ir parar no Cache Storage.
 *
 * O nome do cache NÃO começa com "despesas-": o SW do /despesas apaga todo cache com esse prefixo
 * que não seja o dele, e Cache Storage é compartilhado por origem.
 *
 * Para forçar atualização do cache, incremente VERSAO.
 */
const VERSAO = "leti-gastos-v2";
const ESCOPO = "/despesas-leti/";
const SHELL = [
  ESCOPO,
  "/despesas-leti/manifest.webmanifest?v=2",
  "/despesas-leti/icon-192.png?v=2",
  "/despesas-leti/icon-512.png?v=2",
  "/despesas-leti/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSAO);
      await cache.addAll(SHELL);
      // Pré-cacheia os chunks referenciados pelo HTML, para abrir offline já na 2ª visita.
      const html = await (await fetch(ESCOPO, { cache: "reload" })).text();
      const arquivos = new Set(html.match(/\/_next\/static\/[^"'\\\s)]+/g) || []);
      await Promise.all(
        [...arquivos].map((url) => cache.add(url).catch(() => undefined))
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(
        nomes
          .filter((n) => n.startsWith("leti-gastos-") && n !== VERSAO)
          .map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(redePrimeiro(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cachePrimeiro(request));
    return;
  }

  if (url.pathname.startsWith(ESCOPO)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function redePrimeiro(request) {
  const cache = await caches.open(VERSAO);
  try {
    const resposta = await fetch(request);
    if (resposta.ok) cache.put(ESCOPO, resposta.clone());
    return resposta;
  } catch {
    const emCache = await cache.match(ESCOPO);
    if (emCache) return emCache;
    throw new Error("offline e sem cache");
  }
}

async function cachePrimeiro(request) {
  const cache = await caches.open(VERSAO);
  const emCache = await cache.match(request);
  if (emCache) return emCache;
  const resposta = await fetch(request);
  if (resposta.ok) cache.put(request, resposta.clone());
  return resposta;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(VERSAO);
  const emCache = await cache.match(request);
  const rede = fetch(request)
    .then((resposta) => {
      if (resposta.ok) cache.put(request, resposta.clone());
      return resposta;
    })
    .catch(() => undefined);
  return emCache || (await rede) || Response.error();
}
