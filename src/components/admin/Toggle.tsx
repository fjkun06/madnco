"use client";

import type { ReactNode } from "react";

/** An on/off switch in the theme, instead of the browser checkbox. */
export function Toggle({
  checked,
  onChange,
  disabled = false,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex cursor-pointer items-center gap-3.5 text-left text-base text-paper focus-inset disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        aria-hidden="true"
        className={`relative h-[34px] w-16 flex-none transition-colors duration-200 cut-s ${
          checked ? "bg-tq" : "bg-ink-3"
        }`}
      >
        <span
          className={`absolute top-[5px] size-6 transition-[left,background-color] duration-200 ease-smooth ${
            checked ? "left-[35px] bg-ink" : "left-[5px] bg-off"
          }`}
        />
      </span>
      {children}
    </button>
  );
}
