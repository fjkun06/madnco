/**
 * The MadnCo. mascots, drawn for the site (no emoji, no stock art):
 * the skull is Mad, the ghost is Co — the 💀👻 of the slogan.
 * Decorative: always `aria-hidden`; the surrounding element carries the label.
 * Colours go through `style`, not SVG attributes: presentation attributes
 * don't reliably resolve CSS variables like `var(--color-tq)`.
 */

type MascotProps = {
  className?: string;
  /** Body colour (any CSS colour, normally a token like `var(--color-tq)`). */
  fill?: string;
  /** Eyes, nose and mouth. */
  ink?: string;
  /** Draw the skull's teeth (off for the tiny header logo). */
  teeth?: boolean;
};

export function Skull({
  className,
  fill = "var(--color-bordeaux-hi)",
  ink = "var(--color-ink)",
  teeth = true,
}: MascotProps) {
  return (
    <svg className={className} viewBox="0 0 120 130" aria-hidden="true" focusable="false">
      <path
        d="M60 6C28 6 8 28 8 58c0 18 10 30 22 36v18c0 6 4 10 10 10h40c6 0 10-4 10-10V94c12-6 22-18 22-36C112 28 92 6 60 6z"
        style={{ fill }}
      />
      <ellipse cx="40" cy="60" rx="14" ry="16" style={{ fill: ink }} />
      <ellipse cx="80" cy="60" rx="14" ry="16" style={{ fill: ink }} />
      <path d="M60 76l-7 14h14z" style={{ fill: ink }} />
      {teeth && (
        <path
          d="M48 104v18M60 104v18M72 104v18"
          style={{ stroke: ink }}
          strokeWidth="4"
        />
      )}
    </svg>
  );
}

export function Ghost({
  className,
  fill = "var(--color-tq)",
  ink = "var(--color-ink)",
}: Omit<MascotProps, "teeth">) {
  return (
    <svg className={className} viewBox="0 0 120 140" aria-hidden="true" focusable="false">
      <path
        d="M60 6C30 6 12 30 12 60v68l16-12 16 14 16-14 16 14 16-14 16 12V60C108 30 90 6 60 6z"
        style={{ fill }}
      />
      <ellipse cx="44" cy="58" rx="9" ry="13" style={{ fill: ink }} />
      <ellipse cx="76" cy="58" rx="9" ry="13" style={{ fill: ink }} />
      <ellipse cx="60" cy="86" rx="8" ry="10" style={{ fill: ink }} />
    </svg>
  );
}

/** The open guest slot: a drawn question mark. */
export function Mystery({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 130"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="square"
    >
      <path d="M36 42c0-16 11-26 26-26s26 10 26 24c0 20-26 20-26 42" />
      <path d="M62 108v8" />
    </svg>
  );
}
