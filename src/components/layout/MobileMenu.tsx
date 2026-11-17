"use client";

import { AnimatePresence, m, type Variants } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useReduceMotion } from "@/components/ui/reveal/motion";

export type NavLink = { href: string; label: string };

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/*
 * The panel unrolls downwards from under the header while the links slide
 * in one after another. Closing is quicker and all at once, so the menu
 * gets out of the way. Reduced motion: plain fades.
 */
const panelVariants = (reduce: boolean): Variants =>
  reduce
    ? {
        closed: { opacity: 0, transition: { duration: 0.15 } },
        open: { opacity: 1, transition: { duration: 0.15 } },
      }
    : {
        closed: {
          clipPath: "inset(0 0 100% 0)",
          y: -12,
          transition: { duration: 0.28, ease: EASE, when: "afterChildren" },
        },
        open: {
          clipPath: "inset(0 0 0% 0)",
          y: 0,
          transition: {
            duration: 0.5,
            ease: EASE,
            // Links start almost with the panel, not after it has unrolled.
            delayChildren: 0.05,
            staggerChildren: 0.04,
          },
        },
      };

const linkVariants = (reduce: boolean): Variants =>
  reduce
    ? { closed: { opacity: 1 }, open: { opacity: 1 } }
    : {
        closed: { opacity: 0, x: -24, transition: { duration: 0.15 } },
        open: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } },
      };

const backdropVariants: Variants = {
  closed: { opacity: 0, transition: { duration: 0.25 } },
  open: { opacity: 1, transition: { duration: 0.35 } },
};

/** Icon swap: the bars spin out, the cross spins in (and back). */
const iconMotion = (reduce: boolean) =>
  reduce
    ? { initial: false as const }
    : {
        initial: { rotate: -90, scale: 0.6, opacity: 0 },
        animate: { rotate: 0, scale: 1, opacity: 1 },
        exit: { rotate: 90, scale: 0.6, opacity: 0 },
        transition: { duration: 0.22, ease: EASE },
      };

/**
 * Phone menu: a toggle button and a panel of the same in-page links as the
 * desktop nav. Escape, tapping outside or picking a link closes it; Escape
 * returns focus to the button. The page behind is dimmed and doesn't scroll
 * while it's open.
 */
export function MobileMenu({
  links,
  openLabel,
  closeLabel,
}: {
  links: NavLink[];
  openLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const reduce = useReduceMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = previousOverflow;
    };
  }, [open]);

  const Icon = open ? X : Menu;

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((v) => !v)}
        className={`relative z-50 inline-flex size-10 items-center justify-center border-0 text-paper focus-inset transition-colors duration-300 ease-smooth cut-s sm:size-12 ${
          open ? "bg-bordeaux" : "bg-ink-3"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={open ? "close" : "open"}
            className="inline-flex"
            {...iconMotion(reduce)}
          >
            <Icon aria-hidden="true" size={22} strokeWidth={2.5} />
          </m.span>
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Dims the page; a tap anywhere outside the panel closes the menu. */}
            <m.div
              key="backdrop"
              aria-hidden="true"
              onClick={() => setOpen(false)}
              variants={backdropVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed inset-0 z-40 bg-ink/70 backdrop-blur-[2px]"
            />
            <m.nav
              key="panel"
              id={panelId}
              aria-label={openLabel}
              variants={panelVariants(reduce)}
              initial="closed"
              animate="open"
              exit="closed"
              className="absolute inset-x-gutter top-16 z-50 border-t-4 border-tq bg-ink-2 p-2 shadow-[0_24px_48px_rgb(0_0_0/0.45)] sm:top-[72px] md:top-[84px]"
            >
              <ul className="m-0 flex list-none flex-col p-0">
                {links.map((link, index) => (
                  <m.li key={link.href} variants={linkVariants(reduce)}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="group flex items-baseline gap-3 px-4 py-3.5 font-display text-3xl text-paper no-underline focus-inset transition-colors duration-300 ease-smooth hover:bg-bordeaux"
                    >
                      <span
                        aria-hidden="true"
                        className="label-mono text-[11px] font-extrabold text-tq transition-colors duration-300 group-hover:text-paper"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="transition-transform duration-300 ease-smooth group-hover:translate-x-1.5">
                        {link.label}
                      </span>
                    </Link>
                  </m.li>
                ))}
              </ul>
            </m.nav>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
