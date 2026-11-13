"use client";

import { useEffect } from "react";

/**
 * Registra o service worker com escopo em /despesas-leti/ — não afeta a raiz, o /despesas nem o /futebol.
 * Só em produção: em dev os chunks não têm hash e o cache serviria código velho.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/despesas-leti/sw.js", { scope: "/despesas-leti/" })
      .catch(() => {
        // sem SW o app continua funcionando, só não abre offline
      });
  }, []);

  return null;
}
