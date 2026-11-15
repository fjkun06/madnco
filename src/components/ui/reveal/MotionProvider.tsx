"use client";

import type { ReactNode } from "react";
import { LazyMotion, domAnimation } from "framer-motion";

/**
 * Lets all `m.*` components on the page share framer-motion's animation
 * features (variants, in-view, hover/tap).
 *
 * The features are passed in synchronously, not loaded with a dynamic
 * import: every reveal is server-rendered hidden and only these features
 * animate it in, so if a separate chunk is late or fails (it did in
 * `next dev`) whole sections stay invisible with no error.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}

/**
 * Without scripts nothing ever animates the reveals in, so this shows them
 * as they are. Rendered inside `<noscript>` in the root layout.
 */
export const REVEAL_NOSCRIPT_CSS =
  "[data-reveal]{opacity:1!important;transform:none!important;clip-path:none!important}";
