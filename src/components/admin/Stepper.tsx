"use client";

/**
 * A big number with − / + buttons; the number itself can be typed in.
 * Empty input means "unknown" when `allowEmpty`.
 */
export function Stepper({
  id,
  label,
  value,
  onChange,
  min = 0,
  max,
  allowEmpty = false,
  lessLabel,
  moreLabel,
  accent = true,
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max: number;
  allowEmpty?: boolean;
  lessLabel: string;
  moreLabel: string;
  accent?: boolean;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)));
  const BUTTON =
    "focus-inset w-16 flex-none bg-ink-3 font-display text-[34px] leading-none text-paper transition-colors duration-200 hover:bg-bordeaux disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="flex h-16 items-stretch cut">
      <button
        type="button"
        aria-label={lessLabel}
        disabled={value === null || value <= min}
        onClick={() => onChange(clamp((value ?? min) - 1))}
        className={BUTTON}
      >
        −
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        aria-label={label}
        min={min}
        max={max}
        value={value ?? ""}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === "") onChange(allowEmpty ? null : min);
          else if (Number.isFinite(Number(raw))) onChange(clamp(Number(raw)));
        }}
        className={`min-w-0 flex-1 appearance-none border-y-2 bg-ink text-center font-display text-[40px] text-paper outline-none [-moz-appearance:textfield] focus:border-tq [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
          accent ? "border-tq" : "border-ink-3"
        }`}
      />
      <button
        type="button"
        aria-label={moreLabel}
        disabled={value !== null && value >= max}
        onClick={() => onChange(clamp((value ?? min) + 1))}
        className={BUTTON}
      >
        +
      </button>
    </div>
  );
}
