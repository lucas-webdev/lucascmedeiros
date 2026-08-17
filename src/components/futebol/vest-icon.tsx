interface VestIconProps {
  className?: string;
}

/**
 * Ícone genérico de colete/regata de treino, usado para diferenciar os
 * times visualmente além da cor (contorno em `currentColor`, sem depender
 * só da cor de fundo — ajuda quem tem dificuldade de distinguir cores).
 */
export function VestIcon({ className }: VestIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9 2c.7 1.2 1.8 2 3 2s2.3-.8 3-2l4 2.5-2 3.5-2-1.2V20a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V6.8L6 8 4 4.5 9 2Z" />
    </svg>
  );
}
