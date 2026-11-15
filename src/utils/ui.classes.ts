/**
 * Class strings shared by several components, so a button or label changes
 * in one place. Colours are theme tokens only (THEME.md).
 */

/**
 * Page width: content up to 1184 px inside a 1280 px frame, with a fluid
 * gutter (16 px on phones → 48 px on desktop) so nothing ever touches the
 * screen edge, at any width.
 */
export const WRAP = "mx-auto w-full max-w-[1280px] px-gutter";

/** Letter-spacing of every display heading in the design (`.disp`). */
export const DISPLAY_TRACKING = "tracking-[0.01em]";

/** Button without its corner shape; the exports add `cut` or `cut-s`. */
const BUTTON_CORE =
  "focus-inset label-mono inline-flex min-h-12 items-center justify-center gap-1.5 px-2.5 text-[11px] font-extrabold whitespace-nowrap sm:min-h-14 sm:gap-3 sm:px-7 sm:text-[15px] no-underline transition-[transform,background-color,color] duration-300 ease-smooth hover:-translate-x-[3px] hover:-translate-y-[3px] motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0";
const BUTTON_BASE = `cut ${BUTTON_CORE}`;

/** Primary action: turquoise, dark text. */
export const BUTTON_PRIMARY = `${BUTTON_BASE} bg-tq text-ink hover:bg-paper hover:text-ink`;
/** Secondary action on dark grounds. */
export const BUTTON_GHOST = `${BUTTON_BASE} bg-ink-3 text-paper hover:bg-bordeaux hover:text-paper`;
/** Dark button on bordeaux or paper grounds. */
export const BUTTON_INK = `${BUTTON_BASE} bg-ink text-paper hover:bg-tq hover:text-ink`;

/** Primary action with the small cut, inside cards (side quest). */
export const BUTTON_PRIMARY_S = `cut-s ${BUTTON_CORE} bg-tq text-ink hover:bg-paper hover:text-ink`;
/** Dark button with the small cut on paper (case file); hovers to bordeaux. */
export const BUTTON_INK_S = `cut-s ${BUTTON_CORE} bg-ink text-paper hover:bg-bordeaux hover:text-paper`;

/** Section number and name above a heading, e.g. "01 / The crew". */
export const SECTION_LABEL =
  "label-mono text-[11px] font-bold text-bordeaux-hi sm:text-[13px]";

/** Big display heading of a section. */
export const SECTION_TITLE = `font-display mt-1.5 sm:mt-2.5 text-section leading-[0.9] ${DISPLAY_TRACKING}`;
