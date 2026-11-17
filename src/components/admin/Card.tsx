import type { ReactNode } from "react";

/**
 * A section card. The cut corners sit on a pseudo-element, not on the card,
 * so the pickers can open past the card's edge; a card with an open picker
 * rises above the cards after it.
 */
const CARD =
  "relative z-0 flex flex-col gap-4 p-5 sm:p-7 before:absolute before:inset-0 before:-z-10 before:bg-ink-2 before:cut has-[[aria-expanded=true]]:z-30";

/** One section card: display title, optional mono hint on the right. */
export function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className={CARD}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="m-0 font-display text-[32px] leading-none">{title}</h3>
        {hint ? (
          <span className="label-mono text-xs font-extrabold text-muted">{hint}</span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** The bordered line under a timer ("Live at 20:00 today · in 1 h"). */
export function StatusLine({
  tone,
  children,
  action,
}: {
  tone: "on" | "warn" | "off";
  children: ReactNode;
  action?: ReactNode;
}) {
  const border =
    tone === "on" ? "border-tq" : tone === "warn" ? "border-bordeaux-hi" : "border-ink-3";
  return (
    <div
      className={`flex flex-wrap items-center gap-3 border-l-4 bg-ink px-4 py-3 text-base ${border}`}
    >
      <p className="m-0 min-w-48 flex-1 text-paper">{children}</p>
      {action}
    </div>
  );
}
