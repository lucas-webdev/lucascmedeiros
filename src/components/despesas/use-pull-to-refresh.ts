"use client";

import { useEffect, useRef, useState } from "react";

const LIMITE = 64;
const MAX = 90;

/**
 * Pull-to-refresh manual (o iOS em modo standalone não tem o nativo).
 * `ativo` desliga os listeners, ex.: enquanto o bottom sheet está aberto.
 */
export function usePullToRefresh(onRefresh: () => Promise<void>, ativo: boolean) {
  const [puxada, setPuxada] = useState(0);
  const [atualizando, setAtualizando] = useState(false);
  const inicio = useRef<number | null>(null);
  const puxadaRef = useRef(0);
  const callback = useRef(onRefresh);

  useEffect(() => {
    callback.current = onRefresh;
  });

  useEffect(() => {
    if (!ativo) return;

    function reset() {
      inicio.current = null;
      puxadaRef.current = 0;
      setPuxada(0);
    }

    function onStart(e: TouchEvent) {
      inicio.current = window.scrollY <= 0 ? e.touches[0].clientY : null;
    }

    function onMove(e: TouchEvent) {
      if (inicio.current === null) return;
      const dy = e.touches[0].clientY - inicio.current;
      const valor = dy > 0 ? Math.min(dy * 0.5, MAX) : 0;
      puxadaRef.current = valor;
      setPuxada(valor);
    }

    async function onEnd() {
      const valor = puxadaRef.current;
      reset();
      if (valor < LIMITE) return;
      setAtualizando(true);
      try {
        await callback.current();
      } finally {
        setAtualizando(false);
      }
    }

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", reset);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", reset);
    };
  }, [ativo]);

  return { puxada, atualizando, limite: LIMITE };
}
