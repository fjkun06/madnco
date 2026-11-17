"use client";

import { useRef, useState } from "react";
import { en } from "@/locales/en";

export type ToastKind = "ok" | "warn" | "error";
export type Toast = {
  id: number;
  kind: ToastKind;
  title: string;
  text: string;
  leaving?: boolean;
};

const SHOW_MS = 4000;
/** Length of the slide-out animation (globals.css, .toast[data-leaving]). */
const LEAVE_MS = 300;
const MAX = 3;

const TONE: Record<ToastKind, { border: string; icon: string; bar: string; mark: string }> =
  {
    ok: { border: "border-tq", icon: "bg-tq", bar: "bg-tq", mark: "✓" },
    warn: {
      border: "border-bordeaux-hi",
      icon: "bg-bordeaux-hi",
      bar: "bg-bordeaux-hi",
      mark: "↺",
    },
    error: { border: "border-live", icon: "bg-live", bar: "bg-live", mark: "!" },
  };

/** Notifications for the admin panel: push one, it slides out after 4 s. */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastId = useRef(0);

  /** Slide out, then remove. */
  function dismiss(id: number) {
    setToasts((current) =>
      current.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)),
    );
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      LEAVE_MS,
    );
  }

  function push(kind: ToastKind, title: string, text: string) {
    lastId.current += 1;
    const id = lastId.current;
    setToasts((current) => [...current.slice(-(MAX - 1)), { id, kind, title, text }]);
    window.setTimeout(() => dismiss(id), SHOW_MS);
  }

  return { toasts, push, dismiss };
}

/** The stack in the top right corner, under the sticky site header. */
export function ToastStack({
  toasts,
  onClose,
}: {
  toasts: Toast[];
  onClose: (id: number) => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed top-20 right-4 z-50 flex w-[min(400px,calc(100vw-2rem))] flex-col gap-3 sm:top-[88px] md:top-[100px]"
    >
      {toasts.map((toast) => {
        const tone = TONE[toast.kind];
        return (
          <div
            key={toast.id}
            data-leaving={toast.leaving ? "" : undefined}
            className={`toast pointer-events-auto relative flex items-start gap-3.5 overflow-hidden border-l-[6px] ${tone.border} bg-ink-2 py-4 pr-10 pl-4 shadow-[inset_0_0_0_1px_var(--color-ink-3)] cut-s`}
          >
            <span
              aria-hidden="true"
              className={`toast-icon flex size-7 flex-none items-center justify-center font-mono text-base font-extrabold text-ink cut-s ${tone.icon}`}
            >
              {tone.mark}
            </span>
            <div className="min-w-0">
              <p className="toast-title m-0 font-display text-[22px] leading-none">{toast.title}</p>
              <p className="mt-1.5 mb-0 text-sm leading-snug text-muted">{toast.text}</p>
            </div>
            <button
              type="button"
              aria-label={en.admin.toasts.close}
              onClick={() => onClose(toast.id)}
              className="focus-inset absolute top-2.5 right-2.5 flex size-7 items-center justify-center text-muted hover:text-paper"
            >
              ✕
            </button>
            <span
              aria-hidden="true"
              className={`toast-timer absolute bottom-0 left-0 h-[3px] ${tone.bar}`}
            />
          </div>
        );
      })}
    </div>
  );
}
