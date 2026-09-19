"use client";

import { useState } from "react";
import { getPartidaPorData } from "@/lib/futebol-api";
import type { PartidaHistorico } from "@/lib/futebol-types";
import { HistoricoPartida } from "./historico-partida";

/**
 * Consulta pública (sem PIN) das estatísticas de uma pelada já finalizada,
 * por data — mesmo endpoint de leitura usado dentro da área da organização
 * (`partida_por_data`), só que aqui qualquer visitante pode escolher a data
 * e ver o resultado, sem precisar entrar na área restrita.
 */
export function HistoricoSection() {
  const [data, setData] = useState("");
  const [historico, setHistorico] = useState<PartidaHistorico | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [buscou, setBuscou] = useState(false);

  const buscar = (novaData: string) => {
    setData(novaData);
    setHistorico(null);
    setErro(null);
    setBuscou(false);
    if (!novaData) return;

    setCarregando(true);
    getPartidaPorData(novaData)
      .then((partida) => {
        setHistorico(partida);
        setBuscou(true);
      })
      .catch((e) => {
        setErro(e instanceof Error ? e.message : "Erro ao buscar estatísticas.");
      })
      .finally(() => setCarregando(false));
  };

  return (
    <div>
      <h2 className="mb-1 text-2xl font-black uppercase tracking-tight">
        Estatísticas por pelada
      </h2>
      <p className="mb-4 text-sm text-white/60">
        Escolha uma data no calendário pra ver o placar e as estatísticas
        daquele dia.
      </p>

      <div className="mb-4">
        <label
          htmlFor="data-historico-publico"
          className="block text-sm font-medium text-white/80"
        >
          Data da pelada
        </label>
        <input
          id="data-historico-publico"
          type="date"
          value={data}
          onChange={(e) => buscar(e.target.value)}
          className="mt-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white [color-scheme:dark]"
        />
      </div>

      {carregando && <p className="text-sm text-white/60">Carregando...</p>}

      {erro && (
        <p role="alert" className="text-sm text-red-300">
          {erro}{" "}
          <button type="button" onClick={() => buscar(data)} className="underline">
            Tentar novamente
          </button>
        </p>
      )}

      {!carregando && !erro && buscou && !historico && (
        <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60 backdrop-blur-sm">
          Nenhuma pelada registrada nessa data.
        </p>
      )}

      {historico && <HistoricoPartida historico={historico} />}
    </div>
  );
}
