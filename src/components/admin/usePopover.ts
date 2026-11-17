"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

/** Length of the close animation (globals.css, .picker-pop[data-closing]). */
const CLOSE_MS = 160;

/**
 * Open/close state for a picker: closes on a tap outside and on Escape
 * (which also puts focus back on the field). Closing plays a short
 * animation first: `open` stays true and `closing` is true meanwhile.
 */
export function usePopover<T extends HTMLElement = HTMLDivElement>() {
  const [open, setOpenState] = useState(false);
  const [closing, setClosing] = useState(false);
  const ref = useRef<T>(null);
  const timer = useRef<number | undefined>(undefined);

  function setOpen(next: boolean) {
    window.clearTimeout(timer.current);
    if (next) {
      setClosing(false);
      setOpenState(true);
      return;
    }
    setClosing(true);
    timer.current = window.setTimeout(() => {
      setOpenState(false);
      setClosing(false);
    }, CLOSE_MS);
  }

  const close = useEffectEvent(() => setOpen(false));

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) close();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      close();
      ref.current?.querySelector<HTMLElement>("[data-trigger]")?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  /** Toggle from the field: a second tap closes (animated). */
  const toggle = () => setOpen(!open || closing);

  return { open, closing, setOpen, toggle, ref };
}
