/** Class strings shared by the admin panel and its pickers (theme tokens only). */

export const CARD = "flex flex-col gap-4 bg-ink-2 p-5 cut sm:p-7";
export const LABEL = "label-mono text-xs font-extrabold text-muted";
export const INPUT =
  "min-h-13 w-full border-2 border-ink-3 bg-ink px-4 text-lg text-paper outline-none cut-s placeholder:text-muted/70 focus:border-tq";
export const CHIP =
  "focus-inset label-mono min-h-11 px-4 text-[13px] font-extrabold whitespace-nowrap cut-s transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40";
/** Small chip for picker shortcuts and inline actions. */
export const CHIP_SM =
  "focus-inset label-mono min-h-9 px-3 text-[11px] font-extrabold whitespace-nowrap cut-s transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40";
export const CHIP_OFF = "bg-ink-3 text-paper hover:bg-bordeaux";
export const CHIP_ON = "bg-tq text-ink";

/** The button that opens a picker; border shows open / error. */
export function fieldClass(open: boolean, error: boolean): string {
  const border = error ? "border-live" : open ? "border-tq" : "border-ink-3";
  return `focus-inset flex min-h-14 w-full cursor-pointer items-center gap-3 border-2 ${border} bg-ink px-4 text-left text-lg text-paper cut-s transition-colors duration-200 hover:border-tq`;
}

/** The floating panel under a field. */
export const POPOVER =
  "absolute top-full left-0 z-30 mt-2 drop-shadow-[0_24px_40px_rgba(0,0,0,0.6)]";
export const POPOVER_INNER = "border-2 border-tq bg-ink-2 p-4 cut-s";

/** Small mono text on the right of a field ("today", "in 4 days"). */
export const FIELD_SUB = "ml-auto label-mono text-[11px] font-extrabold";

export const ERROR_LINE =
  "m-0 flex items-center gap-2 label-mono text-xs font-extrabold text-live";
