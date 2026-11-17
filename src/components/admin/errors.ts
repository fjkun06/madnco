import { en } from "@/locales/en";

type ErrorKey = keyof typeof en.admin.errors;

/** The message for an API error code; unknown codes get the generic text. */
export function errorText(code?: string): string {
  const errors = en.admin.errors;
  return code && code in errors ? errors[code as ErrorKey] : errors.generic;
}
