"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatarMoeda, hojeISO, parseValor } from "@/lib/despesas-format";
import {
  arredondar,
  cronograma,
  dataCurta,
  mesComAno,
  mesDaData,
  mesDaFatura,
  rotuloMes,
  valorDaParcela,
} from "@/lib/despesas-leti-parcelas";
import { lerForma, lerUsoCategorias } from "@/lib/despesas-leti-storage";
import {
  FORMA_CREDITO,
  FORMAS,
  type Config,
  type Forma,
  type ItemFatura,
  type NovaCompra,
} from "@/lib/despesas-leti-types";

interface LancarSheetProps {
  categorias: string[];
  config: Config;
  lojasConhecidas: string[];
  /** Preenchido ao editar uma compra existente. */
  inicial?: ItemFatura;
  onFechar: () => void;
  onSalvar: (compra: NovaCompra) => Promise<void>;
}

const PARCELAS_RAPIDAS = [1, 2, 3, 4, 5, 6, 10, 12];

const chip =
  "rounded-full border px-3.5 py-2 text-sm transition-colors active:opacity-70";
const chipOff = "border-d-line bg-d-card text-d-fg";
const chipOn = "border-d-accent bg-d-accent font-semibold text-d-accent-fg";
const campo =
  "w-full rounded-xl border border-d-line bg-d-card px-4 py-3 text-base outline-none focus:border-d-accent";

function textoValor(valor: number): string {
  return valor.toFixed(2).replace(".", ",");
}

export function LancarSheet({
  categorias,
  config,
  lojasConhecidas,
  inicial,
  onFechar,
  onSalvar,
}: LancarSheetProps) {
  const editando = !!inicial;

  const [valorTexto, setValorTexto] = useState(inicial ? textoValor(inicial.valor) : "");
  // Ao editar o valor guardado é o da parcela; ao criar, o mais comum é saber o total.
  const [valorEhTotal, setValorEhTotal] = useState(!inicial);
  const [forma, setForma] = useState<Forma>(inicial?.forma ?? lerForma());
  const [parcelas, setParcelas] = useState(inicial?.parcelas ?? 1);
  const [outro, setOutro] = useState(
    !!inicial && !PARCELAS_RAPIDAS.includes(inicial.parcelas)
  );
  const [parcelaInicial, setParcelaInicial] = useState(inicial?.parcelaInicial ?? 1);
  const [faturaManual, setFaturaManual] = useState<string | null>(
    inicial && inicial.forma === FORMA_CREDITO ? inicial.faturaInicial : null
  );
  const [loja, setLoja] = useState(inicial?.loja ?? "");
  const [categoria, setCategoria] = useState(inicial?.categoria ?? "");
  const [data, setData] = useState(inicial?.data ?? hojeISO());
  const [obs, setObs] = useState(inicial?.obs ?? "");
  const [mais, setMais] = useState(
    !!inicial && (inicial.parcelaInicial > 1 || !!inicial.obs)
  );
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const valorRef = useRef<HTMLInputElement>(null);
  const [uso] = useState(lerUsoCategorias);

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

  const sugestoes = useMemo(() => {
    const busca = loja.trim().toLowerCase();
    return lojasConhecidas
      .filter((l) => l.toLowerCase() !== busca && l.toLowerCase().includes(busca))
      .slice(0, 5);
  }, [loja, lojasConhecidas]);

  const credito = forma === FORMA_CREDITO;
  const parcelasEfetivas = credito ? parcelas : 1;
  const parcelaInicialEfetiva = credito ? Math.min(parcelaInicial, parcelas) : 1;

  const digitado = parseValor(valorTexto);
  const valorValido = Number.isFinite(digitado) && digitado > 0;
  const valorParcela =
    valorValido && valorEhTotal && parcelasEfetivas > 1
      ? valorDaParcela(digitado, parcelasEfetivas)
      : arredondar(digitado);

  const faturaAutomatica = mesDaFatura(data, forma, config.fechamento);
  const faturaInicial = credito ? (faturaManual ?? faturaAutomatica) : mesDaData(data);

  const restantes = cronograma({
    valor: valorParcela,
    parcelas: parcelasEfetivas,
    parcelaInicial: parcelaInicialEfetiva,
    faturaInicial,
  });
  const ultima = restantes[restantes.length - 1];

  const podeEnviar =
    valorValido && valorParcela > 0 && !!categoria && loja.trim().length > 0 && !enviando;

  function mudarParcelas(n: number) {
    const valido = Math.min(Math.max(Math.round(n) || 1, 1), 48);
    setParcelas(valido);
    setParcelaInicial((atual) => Math.min(atual, valido));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!podeEnviar) return;
    setEnviando(true);
    setErro(null);
    try {
      await onSalvar({
        data,
        loja: loja.trim(),
        categoria,
        forma,
        valor: valorParcela,
        parcelas: parcelasEfetivas,
        parcelaInicial: parcelaInicialEfetiva,
        faturaInicial,
        obs: obs.trim(),
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
      setEnviando(false);
    }
  }

  const titulo = editando ? "Editar compra" : "Nova compra";

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-label={titulo}>
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
          <h2 className="text-lg font-semibold">{titulo}</h2>
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
          <div>
            <div className="flex items-baseline gap-2 rounded-2xl bg-d-card px-4 py-3">
              <span className="text-xl text-d-muted">R$</span>
              <input
                ref={valorRef}
                inputMode="decimal"
                autoComplete="off"
                placeholder="0,00"
                aria-label={valorEhTotal && parcelasEfetivas > 1 ? "Valor total" : "Valor"}
                value={valorTexto}
                onChange={(e) => setValorTexto(e.target.value.replace(/[^\d.,]/g, ""))}
                className="w-full bg-transparent text-4xl font-semibold tabular-nums outline-none placeholder:text-d-line"
              />
            </div>
            {credito && parcelas > 1 && (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  aria-pressed={valorEhTotal}
                  onClick={() => setValorEhTotal(true)}
                  className={cn(chip, "py-1.5", valorEhTotal ? chipOn : chipOff)}
                >
                  Valor total
                </button>
                <button
                  type="button"
                  aria-pressed={!valorEhTotal}
                  onClick={() => setValorEhTotal(false)}
                  className={cn(chip, "py-1.5", !valorEhTotal ? chipOn : chipOff)}
                >
                  Valor da parcela
                </button>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-d-muted">Pagamento</p>
            <div className="flex flex-wrap gap-2">
              {FORMAS.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={forma === f}
                  onClick={() => setForma(f)}
                  className={cn(chip, forma === f ? chipOn : chipOff)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {credito && (
            <div>
              <p className="mb-2 text-sm font-medium text-d-muted">Parcelas</p>
              <div className="flex flex-wrap gap-2">
                {PARCELAS_RAPIDAS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={!outro && parcelas === n}
                    onClick={() => {
                      setOutro(false);
                      mudarParcelas(n);
                    }}
                    className={cn(chip, !outro && parcelas === n ? chipOn : chipOff)}
                  >
                    {n}x
                  </button>
                ))}
                <button
                  type="button"
                  aria-pressed={outro}
                  onClick={() => setOutro(true)}
                  className={cn(chip, outro ? chipOn : chipOff)}
                >
                  Outro
                </button>
              </div>
              {outro && (
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={48}
                  aria-label="Número de parcelas"
                  value={parcelas}
                  onChange={(e) => mudarParcelas(Number(e.target.value))}
                  className={cn(campo, "mt-2")}
                />
              )}
            </div>
          )}

          {valorValido && (
            <div
              role="status"
              className="rounded-2xl border border-d-line bg-d-card px-4 py-3 text-sm"
            >
              {credito ? (
                <>
                  <p className="font-medium tabular-nums">
                    {parcelasEfetivas === 1
                      ? `${formatarMoeda(valorParcela)} à vista no crédito`
                      : parcelaInicialEfetiva > 1
                        ? `${restantes.length}x de ${formatarMoeda(valorParcela)} (parcelas ${parcelaInicialEfetiva} a ${parcelasEfetivas})`
                        : `${parcelasEfetivas}x de ${formatarMoeda(valorParcela)}`}
                  </p>
                  <p className="mt-1 text-d-muted">
                    {ultima && restantes.length > 1
                      ? `${mesComAno(faturaInicial)} até ${mesComAno(ultima.mes)}`
                      : `Fatura de ${rotuloMes(faturaInicial)}`}
                    {" · "}
                    {faturaManual
                      ? "1ª parcela em " + rotuloMes(faturaInicial)
                      : `compra de ${dataCurta(data)} cai em ${rotuloMes(faturaInicial)}`}
                  </p>
                </>
              ) : (
                <p className="font-medium">
                  {forma} · {formatarMoeda(valorParcela)} em {rotuloMes(faturaInicial)}
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="loja" className="mb-2 block text-sm font-medium text-d-muted">
              Loja
            </label>
            <input
              id="loja"
              type="text"
              autoComplete="off"
              autoCapitalize="words"
              value={loja}
              onChange={(e) => setLoja(e.target.value)}
              className={campo}
            />
            {sugestoes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {sugestoes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setLoja(s)}
                    className={cn(chip, chipOff, "py-1.5")}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
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
          </div>

          <div>
            <label htmlFor="data" className="mb-2 block text-sm font-medium text-d-muted">
              Data da compra
            </label>
            <input
              id="data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value || hojeISO())}
              className={campo}
            />
          </div>

          {mais ? (
            <div className="space-y-5">
              {credito && parcelas > 1 && (
                <div>
                  <label
                    htmlFor="parcela-inicial"
                    className="mb-2 block text-sm font-medium text-d-muted"
                  >
                    Parcela em que esta compra está agora
                  </label>
                  <input
                    id="parcela-inicial"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={parcelas}
                    value={parcelaInicialEfetiva}
                    onChange={(e) =>
                      setParcelaInicial(
                        Math.min(Math.max(Math.round(Number(e.target.value)) || 1, 1), parcelas)
                      )
                    }
                    className={campo}
                  />
                  <p className="mt-1 text-xs text-d-muted">
                    Use para compras que já começaram: 4 significa que a parcela 4/{parcelas} é a
                    primeira a ser contada aqui.
                  </p>
                </div>
              )}
              {credito && (
                <div>
                  <label htmlFor="fatura" className="mb-2 block text-sm font-medium text-d-muted">
                    Fatura da primeira parcela
                  </label>
                  <input
                    id="fatura"
                    type="month"
                    value={faturaInicial}
                    onChange={(e) => setFaturaManual(e.target.value || null)}
                    className={campo}
                  />
                  {faturaManual && (
                    <button
                      type="button"
                      onClick={() => setFaturaManual(null)}
                      className="mt-1 text-xs font-medium text-d-accent"
                    >
                      voltar ao automático ({rotuloMes(faturaAutomatica)})
                    </button>
                  )}
                </div>
              )}
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
                  className={campo}
                />
              </div>
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
            {enviando ? "Salvando…" : editando ? "Salvar alterações" : "Lançar"}
          </button>
        </div>
      </form>
    </div>
  );
}
