import type { StreamState } from "@/lib/stream/state";
import type { AdminForm, FormField } from "../form";
import type { ToastKind } from "../Toasts";

export type Push = (kind: ToastKind, title: string, text: string) => void;

/** What every tab gets from the panel. */
export type TabProps = {
  form: AdminForm;
  update: (patch: Partial<AdminForm>) => void;
  saved: StreamState;
  /** Epoch ms, 0 before the browser clock is known. */
  now: number;
  push: Push;
  issueFor: (field: FormField) => string | undefined;
};
