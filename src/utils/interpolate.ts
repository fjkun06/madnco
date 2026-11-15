/**
 * Fills `{name}` slots in a text with values, so handles and numbers stay in
 * `siteConfig` and are never typed into the texts. Unknown slots are kept as
 * they are, which makes a missing value visible instead of silently empty.
 */
export function interpolate(
  text: string,
  values: Record<string, string | number>,
): string {
  return text.replace(/\{(\w+)\}/g, (slot, key: string) =>
    key in values ? String(values[key]) : slot,
  );
}

/** One piece of an interpolated text: plain text, or a filled slot. */
export type TextPart = { text: string; slot?: string };

/**
 * Like `interpolate`, but returns the pieces so a component can style the
 * filled slots (e.g. bold handles). Unknown slots stay as plain text.
 */
export function interpolateParts(
  text: string,
  values: Record<string, string | number>,
): TextPart[] {
  return text
    .split(/(\{\w+\})/)
    .filter(Boolean)
    .map((piece) => {
      const key = /^\{(\w+)\}$/.exec(piece)?.[1];
      return key && key in values
        ? { text: String(values[key]), slot: key }
        : { text: piece };
    });
}
