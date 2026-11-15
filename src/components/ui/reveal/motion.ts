"use client";

import { m, useReducedMotion } from "framer-motion";

/**
 * Elements the reveal components can render as. These are the lightweight
 * `m.*` components: their animation features load separately, through
 * `MotionProvider`, instead of being bundled into every page up front.
 */
export const motionTags = {
  div: m.div,
  section: m.section,
  article: m.article,
  aside: m.aside,
  p: m.p,
  span: m.span,
  h2: m.h2,
  h3: m.h3,
  ul: m.ul,
  li: m.li,
  figure: m.figure,
} as const;

export type MotionTag = keyof typeof motionTags;

/** `true` when the visitor asked the OS for reduced motion (never `null`). */
export function useReduceMotion(): boolean {
  return useReducedMotion() ?? false;
}
