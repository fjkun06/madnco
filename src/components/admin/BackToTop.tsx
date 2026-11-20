"use client";

import { useSyncExternalStore } from "react";
import { en } from "@/locales/en";

/** Shown once the page is scrolled this far (px). */
const SHOW_AFTER = 600;

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}
const scrolled = () => window.scrollY > SHOW_AFTER;

/**
 * Floating "back to top" button for the control room and the Remote.
 * `className` sets the position (the control room keeps it above its sticky
 * action bar). Smooth scroll unless the visitor asked for reduced motion.
 */
export function BackToTop({ className = "bottom-5" }: { className?: string }) {
  const show = useSyncExternalStore(subscribe, scrolled, () => false);
  return (
    <button
      type="button"
      aria-label={en.admin.backToTop}
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
      className={`focus-inset fixed right-4 z-30 flex size-14 items-center justify-center bg-tq text-ink shadow-[0_12px_30px_rgba(0,0,0,0.5)] cut-s transition-[opacity,translate] duration-200 ease-smooth hover:bg-paper sm:right-6 ${className} ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
