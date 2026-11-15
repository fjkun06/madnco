"use client";

import {
  useScroll,
  useSpring,
  type MotionValue,
  type UseScrollOptions,
} from "framer-motion";
import { useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import {
  motionTags,
  useReduceMotion,
  type MotionTag,
} from "@/components/ui/reveal/motion";

/** Where tracking starts and ends, in framer-motion's `offset` format. */
export type ScrollRange = NonNullable<UseScrollOptions["offset"]>;

/** Common ranges. "Start end" = element's top meets the viewport's bottom. */
export const RANGE = {
  /** From the moment it appears at the bottom until it leaves at the top. */
  through: ["start end", "end start"],
  /** While it scrolls away from the top of the screen (hero). */
  leaving: ["start start", "end start"],
  /** From appearing at the bottom until its top reaches 40 % from the top. */
  arriving: ["start end", "start 40%"],
  /** From appearing at the bottom until it is fully on screen. */
  entering: ["start end", "end end"],
} satisfies Record<string, ScrollRange>;

/**
 * Scroll-linked motion: the further you scroll, the further things move.
 *
 * Tracks how far this element has travelled through `range` and exposes it
 * as the CSS variable `--p`, from 0 to 1, smoothed by a spring so it glides
 * instead of jittering with the scroll wheel. Children (server components
 * too) use it in Tailwind classes, e.g. `translate-y-[calc(var(--p)*-160px)]`
 * or `scale-x-[var(--p)]`.
 *
 * With reduced motion `--p` is never set: every `var(--p)` value is invalid,
 * so the browser shows the element at rest, fully visible.
 */
export function ScrollProgress({
  as = "div",
  range = RANGE.through,
  page = false,
  className,
  children,
  ...attrs
}: {
  as?: MotionTag;
  range?: ScrollRange;
  /** Track the whole page instead of this element (progress bar). */
  page?: boolean;
  className?: string;
  children?: ReactNode;
  id?: string;
  role?: string;
  "aria-hidden"?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReduceMotion();
  const { scrollYProgress } = useScroll(page ? {} : { target: ref, offset: range });
  const p = useSpring(scrollYProgress, {
    stiffness: 160,
    damping: 32,
    mass: 0.35,
    restDelta: 0.0005,
  });
  const Tag = motionTags[as] as ElementType;
  const style = reduce
    ? undefined
    : ({ "--p": p } as CSSProperties & { "--p": MotionValue });
  return (
    <Tag {...attrs} ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}
