"use client";

import type { ReactNode } from "react";
import { LazyMotion } from "framer-motion";

const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

/**
 * Lets all `m.*` components on the page share framer-motion's animation
 * features, loaded asynchronously. Until they arrive, elements simply show
 * their initial state; nothing on the page depends on them to be usable.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={loadFeatures}>{children}</LazyMotion>;
}
