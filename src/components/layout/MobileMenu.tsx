"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type NavLink = { href: string; label: string };

/**
 * Phone menu: a toggle button and a panel of the same in-page links as the
 * desktop nav. Escape closes it and returns focus to the button; picking a
 * link closes it too.
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

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-12 items-center justify-center border-0 bg-ink-3 text-paper focus-inset cut-s"
      >
        {open ? (
          <X aria-hidden="true" size={22} strokeWidth={2.5} />
        ) : (
          <Menu aria-hidden="true" size={22} strokeWidth={2.5} />
        )}
      </button>
      <nav
        id={panelId}
        aria-label={openLabel}
        hidden={!open}
        className="absolute inset-x-gutter top-[68px] z-50 bg-ink-2 p-2 md:top-[84px]"
      >
        <ul className="m-0 flex list-none flex-col p-0">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-3.5 font-display text-3xl text-paper no-underline hover:bg-bordeaux"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
