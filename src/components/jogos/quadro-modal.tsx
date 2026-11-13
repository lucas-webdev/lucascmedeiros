"use client";

import { useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Botão de baixa ênfase (tertiary): sem borda, fundo só com um tom suave que
 * escurece no hover, texto e seta na cor do tom. As classes ficam escritas por
 * extenso para o Tailwind encontrá-las.
 */
const TONS = {
  // Dourado: yellow-600 (#ca8a04) é o mais próximo de darkgoldenrod (#b8860b).
  gold: {
    botao:
      "bg-yellow-600/25 text-yellow-950 hover:bg-yellow-600/35 active:bg-yellow-600/45 os-dark:bg-yellow-600/20 os-dark:text-yellow-100 os-dark:hover:bg-yellow-600/30 os-dark:active:bg-yellow-600/40",
    descricao: "text-yellow-900/75 os-dark:text-yellow-200/75",
    seta: "text-yellow-700 os-dark:text-yellow-500",
  },
  cyan: {
    botao:
      "bg-cyan-500/10 text-cyan-950 hover:bg-cyan-500/20 active:bg-cyan-500/25 os-dark:bg-cyan-400/10 os-dark:text-cyan-100 os-dark:hover:bg-cyan-400/20 os-dark:active:bg-cyan-400/25",
    descricao: "text-cyan-900/70 os-dark:text-cyan-200/70",
    seta: "text-cyan-700 os-dark:text-cyan-300",
  },
} as const;

export type TomBotao = keyof typeof TONS;

interface QuadroModalProps {
  /** Cor do botão que abre o quadro. */
  tom: TomBotao;
  /** Título do botão e do quadro. */
  titulo: string;
  /** Linha de apoio dentro do botão (ex.: "3 de 10 marcos alcançados"). */
  descricaoBotao: string;
  /** Linha de apoio sob o título do quadro, já com o destaque que quiser. */
  subtitulo: ReactNode;
  children: ReactNode;
}

/**
 * Botão que abre um quadro (modal nativo `<dialog>`): fecha pelo X, por ESC
 * ou clicando fora, e o cabeçalho fica fixo enquanto o conteúdo rola.
 */
export function QuadroModal({
  tom,
  titulo,
  descricaoBotao,
  subtitulo,
  children,
}: QuadroModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const cores = TONS[tom];

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors",
          cores.botao
        )}
      >
        <span className="min-w-0">
          <span className="block text-base font-semibold">{titulo}</span>
          <span className={cn("block text-sm", cores.descricao)}>
            {descricaoBotao}
          </span>
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={cn("size-5 shrink-0", cores.seta)}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="m7.5 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={idTitulo}
        // Clique no fundo (no próprio <dialog>, fora do conteúdo) fecha.
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
        className="m-auto max-h-[90dvh] w-[min(42rem,calc(100%-2rem))] overflow-y-auto rounded-2xl border border-d-line bg-d-bg p-0 text-d-fg backdrop:bg-black/60"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-d-line bg-d-bg px-4 py-3">
          <div className="min-w-0">
            <h2 id={idTitulo} className="text-lg font-semibold">
              {titulo}
            </h2>
            <p className="text-sm text-d-muted">{subtitulo}</p>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Fechar"
            className="-mr-1 shrink-0 rounded-lg p-2 text-d-muted"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-4">{children}</div>
      </dialog>
    </>
  );
}
