"use client";

import { useCallback, useEffect, useState } from "react";
import { getRanking } from "@/lib/futebol-api";
import type { Jogador } from "@/lib/futebol-types";
import { RankingTable } from "./ranking-table";

interface RankingSectionProps {
  refreshKey: number;
}

export function RankingSection({ refreshKey }: RankingSectionProps) {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const resp = await getRanking();
      setJogadores(resp);
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar a tabela.");
    }
  }, []);

  useEffect(() => {
    setCarregando(true);
    carregar().finally(() => setCarregando(false));
  }, [carregar, refreshKey]);

  return (
    <div>
      <h2 className="mb-1 text-2xl font-black uppercase tracking-tight">
        Tabela individual
      </h2>
      <p className="mb-4 text-sm text-white/60">
        Pontos, jogos, gols e assistências de cada jogador.
      </p>

      {carregando ? (
        <p className="text-sm text-white/60">Carregando tabela...</p>
      ) : erro ? (
        <p role="alert" className="text-sm text-red-300">
          {erro}{" "}
          <button type="button" onClick={carregar} className="underline">
            Tentar novamente
          </button>
        </p>
      ) : (
        <RankingTable jogadores={jogadores} />
      )}
    </div>
  );
}
