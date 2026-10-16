"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatarMoeda, hojeISO, parseValor } from "@/lib/despesas-format";
import {
  METODOS_PAGAMENTO,
  lerDescricoes,
  lerMetodoId,
  lerUsoCategorias,
} from "@/lib/despesas-storage";
import type { NovoLancamento, Painel } from "@/lib/despesas-types";

interface LancarSheetProps {
  categorias: string[];
  painel: Painel | null;
  onFechar: () => void;
  onLancar: (lancamento: NovoLancamento, metodoId: string) => Promise<void>;
}

const chip =
  "rounded-full border px-3.5 py-2 text-sm transition-colors active:opacity-70";
const chipOff = "border-d-line bg-d-card text-d-fg";
const chipOn = "border-d-accent bg-d-accent font-semibold text-d-accent-fg";

export function LancarSheet({
  categorias,
  painel,
  onFechar,
  onLancar,
}: LancarSheetProps) {
  const [valorTexto, setValorTexto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [metodoId, setMetodoId] = useState(lerMetodoId);
  const [data, setData] = useState(hojeISO);
  const [obs, setObs] = useState("");
  const [mais, setMais] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const valorRef = useRef<HTMLInputElement>(null);
  const [uso] = useState(lerUsoCategorias);
  const [historico] = useState(lerDescricoes);

  useEffect(() => {
    const t = setTimeout(() => valorRef.current?.focus(), 50);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !enviando) onFechar();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enviando, onFechar]);

  // Mais usadas primeiro; empates mantêm a ordem da planilha (sort é estável).
  const categoriasOrdenadas = useMemo(
    () => [...categorias].sort((a, b) => (uso[b] ?? 0) - (uso[a] ?? 0)),
    [categorias, uso]
  );

  // Descrições recentes do servidor + histórico local, sem repetir.
  const descricoesConhecidas = useMemo(() => {
    const vistas = new Set<string>();
    const lista: string[] = [];
    const fontes = [...historico, ...(painel?.ultimos.map((u) => u.descricao) ?? [])];
    for (const d of fontes) {
      const chave = d.trim().toLowerCase();
      if (!chave || vistas.has(chave)) continue;
      vistas.add(chave);
      lista.push(d.trim());
    }
    return lista;
  }, [historico, painel]);

  const sugestoes = useMemo(() => {
    const busca = descricao.trim().toLowerCase();
    return descricoesConhecidas
      .filter((d) => d.toLowerCase() !== busca && d.toLowerCase().includes(busca))
      .slice(0, 5);
  }, [descricao, descricoesConhecidas]);

  const valor = parseValor(valorTexto);
  const valorValido = Number.isFinite(valor) && valor > 0;
  const metodo = METODOS_PAGAMENTO.find((m) => m.id === metodoId) ?? METODOS_PAGAMENTO[0];
  const podeEnviar = valorValido && !!categoria && descricao.trim().length > 0 && !enviando;

  const infoCategoria = painel?.categorias.find((c) => c.nome === categoria);
  const textoLivre = (disponivel: number) =>
    disponivel < 0
      ? `${formatarMoeda(-disponivel)} acima`
      : `${formatarMoeda(disponivel)} livre`;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!podeEnviar) return;
    setEnviando(true);
    setErro(null);
    try {
      await onLancar(
        {
          data,
          descricao: descricao.trim(),
          categoria,
          valor,
          forma: metodo.forma,
          conta: metodo.conta,
          obs: obs.trim(),
        },
        metodo.id
      );
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível lançar.");
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-label="Novo lançamento">
      <button
        type="button"
        aria-label="Fechar"
        onClick={() => !enviando && onFechar()}
        className="absolute inset-0 bg-black/50"
      />
      <form
        onSubmit={enviar}
        className="relative mx-auto flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-3xl bg-d-bg shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="text-lg font-semibold">Novo lançamento</h2>
          <button
            type="button"
            onClick={onFechar}
            disabled={enviando}
            aria-label="Fechar"
            className="flex size-9 items-center justify-center rounded-full text-d-muted active:bg-d-line"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 pb-4 pt-3">
          <div className="flex items-baseline gap-2 rounded-2xl bg-d-card px-4 py-3">
            <span className="text-xl text-d-muted">R$</span>
            <input
              ref={valorRef}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              aria-label="Valor"
              value={valorTexto}
              onChange={(e) => setValorTexto(e.target.value.replace(/[^\d.,]/g, ""))}
              className="w-full bg-transparent text-4xl font-semibold tabular-nums outline-none placeholder:text-d-line"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-d-muted">Categoria</p>
            <div className="flex flex-wrap gap-2">
              {categoriasOrdenadas.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={categoria === c}
                  onClick={() => setCategoria(c)}
                  className={cn(chip, categoria === c ? chipOn : chipOff)}
                >
                  {c}
                </button>
              ))}
            </div>
            {infoCategoria && (
              <p
                className={cn(
                  "mt-2 text-sm tabular-nums",
                  infoCategoria.disponivel < 0 ? "text-d-bad" : "text-d-muted"
                )}
              >
                {infoCategoria.nome}: {textoLivre(infoCategoria.disponivel)}
                {valorValido && ` → ${textoLivre(infoCategoria.disponivel - valor)} depois`}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="descricao" className="mb-2 block text-sm font-medium text-d-muted">
              Descrição
            </label>
            <input
              id="descricao"
              type="text"
              autoComplete="off"
              autoCapitalize="sentences"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full rounded-xl border border-d-line bg-d-card px-4 py-3 text-base outline-none focus:border-d-accent"
            />
            {sugestoes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {sugestoes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDescricao(s)}
                    className={cn(chip, chipOff, "py-1.5")}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-d-muted">Pagamento</p>
            <div className="flex flex-wrap gap-2">
              {METODOS_PAGAMENTO.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={metodoId === m.id}
                  onClick={() => setMetodoId(m.id)}
                  className={cn(chip, metodoId === m.id ? chipOn : chipOff)}
                >
                  {m.rotulo}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="data" className="mb-2 block text-sm font-medium text-d-muted">
              Data
            </label>
            <input
              id="data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value || hojeISO())}
              className="w-full rounded-xl border border-d-line bg-d-card px-4 py-3 text-base outline-none focus:border-d-accent"
            />
          </div>

          {mais ? (
            <div>
              <label htmlFor="obs" className="mb-2 block text-sm font-medium text-d-muted">
                Observação
              </label>
              <input
                id="obs"
                type="text"
                autoComplete="off"
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                className="w-full rounded-xl border border-d-line bg-d-card px-4 py-3 text-base outline-none focus:border-d-accent"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMais(true)}
              className="text-sm font-medium text-d-accent"
            >
              + mais
            </button>
          )}
        </div>

        <div className="border-t border-d-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {erro && (
            <p role="alert" className="mb-2 text-sm text-d-bad">
              {erro}
            </p>
          )}
          <button
            type="submit"
            disabled={!podeEnviar}
            className="w-full rounded-xl bg-d-accent px-4 py-3.5 text-base font-semibold text-d-accent-fg disabled:opacity-40"
          >
            {enviando ? "Lançando…" : valorValido ? `Lançar ${formatarMoeda(valor)}` : "Lançar"}
          </button>
        </div>
      </form>
    </div>
  );
}
