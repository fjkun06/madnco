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
