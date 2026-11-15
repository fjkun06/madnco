/**
 * Class strings shared by several components, so a button or label changes
 * in one place. Colours are theme tokens only (THEME.md).
 */

/** Page width: 1280 px max, 20 px gutters on phones, 48 px from md. */
export const WRAP = "mx-auto w-full max-w-[1280px] px-5 md:px-12";

const BUTTON_BASE =
  "cut focus-inset label-mono inline-flex min-h-14 items-center justify-center gap-3 px-7 text-[15px] font-extrabold no-underline transition-[transform,background-color,color] duration-150 hover:-translate-x-[3px] hover:-translate-y-[3px] motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0";

/** Primary action: turquoise, dark text. */
export const BUTTON_PRIMARY = `${BUTTON_BASE} bg-tq text-ink hover:bg-paper hover:text-ink`;
/** Secondary action on dark grounds. */
export const BUTTON_GHOST = `${BUTTON_BASE} bg-ink-3 text-paper hover:bg-bordeaux hover:text-paper`;
/** Dark button on bordeaux or paper grounds. */
export const BUTTON_INK = `${BUTTON_BASE} bg-ink text-paper hover:bg-tq hover:text-ink`;

/** Section number and name above a heading, e.g. "01 / The crew". */
export const SECTION_LABEL = "label-mono text-[13px] font-bold text-bordeaux-hi";

/** Big display heading of a section. */
export const SECTION_TITLE =
  "font-display mt-2.5 text-[56px] leading-[0.9] md:text-[clamp(52px,6.4vw,96px)]";
