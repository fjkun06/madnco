/** Field icons for the admin pickers (stroke follows the text colour). */

const PROPS = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.5,
  "aria-hidden": true,
  className: "flex-none text-tq",
} as const;

export function ClockIcon() {
  return (
    <svg {...PROPS}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function CalendarIcon() {
  return (
    <svg {...PROPS}>
      <rect x="3" y="5" width="18" height="16" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
