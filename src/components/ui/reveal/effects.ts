import type { Transition, Variants } from "framer-motion";

/** How an element enters. */
export type RevealEffect =
  | "fade-up"
  | "fade"
  | "scale"
  | "pop"
  | "slide-left"
  | "slide-right"
  | "wipe"
  | "stamp"
  | "spin"
  | "draw";

/** `"view"` animates when scrolled into view, `"mount"` right away (above the fold). */
export type RevealTrigger = "view" | "mount";

/**
 * Start states. Offsets stay small enough not to push content out of a
 * 390 px phone viewport; the page wrapper clips the rest (`overflow-x: clip`).
 */
const hiddenStates: Record<RevealEffect, Record<string, number | string>> = {
  "fade-up": { opacity: 0, y: 40 },
  fade: { opacity: 0 },
  scale: { opacity: 0, scale: 0.94 },
  // Springy entrance for cards and buttons: the "select your fighter" feel.
  pop: { opacity: 0, scale: 0.6, y: 40 },
  "slide-left": { opacity: 0, x: -90 },
  "slide-right": { opacity: 0, x: 90 },
  // Headline uncovered from left to right, like a lower-third sliding in.
  wipe: { clipPath: "inset(0 100% 0 0)", x: -30 },
  // Lands like a rubber stamp. Rotation is relative to any CSS rotate on
  // the element, which keeps its final angle.
  stamp: { opacity: 0, scale: 2.6, rotate: -22 },
  // An arrow swinging into place (link rows), overshooting a little.
  spin: { rotate: -135 },
  // A line or bar drawing itself; pair with `origin-left` on the element.
  draw: { scaleX: 0 },
};

const shown = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  scaleX: 1,
  rotate: 0,
  clipPath: "inset(0 0% 0 0)",
};

/** Only the properties an effect starts from are animated back. */
function shownFor(effect: RevealEffect) {
  return Object.fromEntries(
    Object.keys(hiddenStates[effect]).map((key) => [
      key,
      shown[key as keyof typeof shown],
    ]),
  );
}

/*
 * Heavy, smooth feel: long expo-out curves (fast start, very long soft
 * landing) and springs with extra mass and damping, so things arrive with
 * weight instead of snapping or bouncing.
 */
const EASE_OUT: Transition["ease"] = [0.16, 1, 0.3, 1];
const DURATION = 1.1;
const WIPE_DURATION = 1.3;
const REDUCED_DURATION = 0.2;
const SPRING = { type: "spring", stiffness: 140, damping: 24, mass: 1.3 } as const;
const STAMP_SPRING = { type: "spring", stiffness: 260, damping: 22, mass: 1.8 } as const;

/** Default seconds between two items of a group. */
export const DEFAULT_STAGGER = 0.14;

/**
 * Starts once ~15 % of the element is visible, slightly before it reaches
 * the bottom edge — tall stacked sections on phones still trigger early.
 */
export const viewport = { once: true, amount: 0.15, margin: "0px 0px -8% 0px" } as const;

/**
 * Effects whose start state has no visible area (a full clip-path or
 * scaleX 0). Browsers report an intersection ratio of 0 for them however far
 * they are scrolled in, so a 15 % threshold never fires and they stay hidden
 * for good; they trigger on any intersection instead.
 */
const ZERO_AREA_EFFECTS: readonly RevealEffect[] = ["wipe", "draw"];

export const zeroAreaViewport = { ...viewport, amount: "some" } as const;

function transitionFor(effect: RevealEffect): Transition {
  if (effect === "stamp") return STAMP_SPRING;
  if (effect === "pop" || effect === "spin") return SPRING;
  if (effect === "wipe") return { duration: WIPE_DURATION, ease: EASE_OUT };
  return { duration: DURATION, ease: EASE_OUT };
}

/**
 * Hidden/visible variants for one element.
 *
 * `delay` is only set when given: framer-motion lets a variant's own
 * `transition.delay` (even `0`) override the stagger delay passed down by a
 * parent, which would make every item of a group start at the same time.
 */
export function itemVariants(
  effect: RevealEffect,
  reduce: boolean,
  delay?: number,
): Variants {
  const timing = delay ? { delay } : {};
  if (reduce) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: REDUCED_DURATION, ...timing } },
    };
  }
  return {
    hidden: hiddenStates[effect],
    visible: { ...shownFor(effect), transition: { ...transitionFor(effect), ...timing } },
  };
}

/** Variants for a group: no own animation, it only staggers its items. */
export function groupVariants(stagger: number, delay: number, reduce: boolean): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduce ? 0 : stagger, delayChildren: delay },
    },
  };
}

/** motion props that start the animation on scroll or on mount. */
export function triggerProps(trigger: RevealTrigger, effect?: RevealEffect) {
  if (trigger === "mount") return { initial: "hidden", animate: "visible" };
  const zeroArea = effect !== undefined && ZERO_AREA_EFFECTS.includes(effect);
  return {
    initial: "hidden",
    whileInView: "visible",
    viewport: zeroArea ? zeroAreaViewport : viewport,
  };
}
