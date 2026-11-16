"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Always shown near the top of the page. */
const TOP_ZONE = 80;
/** Ignores tiny scroll jitter (trackpads, momentum). */
const MIN_DELTA = 6;
/**
 * Which scroll direction shows the bar. As requested: it rides along while
 * scrolling down and slides away when scrolling back up. Set to "up" for
 * the usual opposite behaviour.
 */
const SHOW_WHEN: "down" | "up" = "down";

/** Pure decision, kept out of the hook so it can be tested. */
export function nextVisible(prevY: number, y: number, visible: boolean): boolean {
  if (y <= TOP_ZONE) return true;
  const delta = y - prevY;
  if (Math.abs(delta) < MIN_DELTA) return visible;
  const goingDown = delta > 0;
  return SHOW_WHEN === "down" ? goingDown : !goingDown;
}

/**
 * Sticky wrapper for the header: stays at the top of the viewport and slides
 * in or out depending on the scroll direction. Gets a solid background once
 * the page has scrolled, so content doesn't show through.
 */
export function StickyHeader({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let prevY = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        setVisible((v) => nextVisible(prevY, y, v));
        setScrolled(y > 8);
        if (Math.abs(y - prevY) >= MIN_DELTA || y <= TOP_ZONE) prevY = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      data-visible={visible}
      data-scrolled={scrolled}
      // Keyboard users must always reach the nav: focus inside brings it back.
      onFocusCapture={() => setVisible(true)}
      className="sticky top-0 z-50 transition-[translate,background-color,box-shadow] duration-300 ease-smooth data-[scrolled=true]:bg-ink/95 data-[scrolled=true]:shadow-[0_1px_0_var(--color-ink-3)] data-[scrolled=true]:backdrop-blur-sm data-[visible=false]:-translate-y-full motion-reduce:transition-none"
    >
      {children}
    </div>
  );
}
