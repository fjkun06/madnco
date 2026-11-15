/**
 * Who runs the site, for the Impressum (§ 5 DDG) and the privacy page.
 * Every field is a `[...]` placeholder until confirmed; have the final texts
 * checked (eRecht24, IHK or a lawyer) before relying on them.
 */
export const provider = {
  name: "[FULL NAME]",
  street: "[STREET AND NUMBER]",
  city: "[POSTCODE AND CITY]",
  country: "Germany",
  email: "[CONTACT EMAIL]",
} as const;
