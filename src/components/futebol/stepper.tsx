"use client";

interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function Stepper({ label, value, onChange }: StepperProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`Diminuir ${label}`}
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value <= 0}
        className="flex h-11 w-11 items-center justify-center rounded-md border border-border text-lg font-medium transition-colors hover:bg-accent-muted hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span aria-hidden="true">−</span>
      </button>
      <span aria-live="polite" className="w-6 text-center text-sm font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Aumentar ${label}`}
        onClick={() => onChange(value + 1)}
        className="flex h-11 w-11 items-center justify-center rounded-md border border-border text-lg font-medium transition-colors hover:bg-accent-muted hover:text-accent"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
