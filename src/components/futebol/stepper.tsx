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
        className="flex h-11 w-11 items-center justify-center rounded-md border border-white/20 text-lg font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span aria-hidden="true">−</span>
      </button>
      <span aria-live="polite" className="w-6 text-center text-sm font-semibold tabular-nums text-white">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Aumentar ${label}`}
        onClick={() => onChange(value + 1)}
        className="flex h-11 w-11 items-center justify-center rounded-md border border-white/20 text-lg font-medium text-white transition-colors hover:bg-white/10"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
