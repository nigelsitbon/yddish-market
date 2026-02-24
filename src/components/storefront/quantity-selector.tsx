"use client";

import { Minus, Plus } from "@/components/ui/icons";

type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
};

export function QuantitySelector({ value, onChange, max = 99, min = 1 }: QuantitySelectorProps) {
  return (
    <div className="inline-flex items-center border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Diminuer"
      >
        <Minus size={14} strokeWidth={1.5} />
      </button>
      <span className="w-10 h-10 flex items-center justify-center text-[13px] text-foreground border-x border-border">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Augmenter"
      >
        <Plus size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}
