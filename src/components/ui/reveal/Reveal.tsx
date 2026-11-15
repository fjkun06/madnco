"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";
import { motionTags, useReduceMotion, type MotionTag } from "./motion";
import {
  DEFAULT_STAGGER,
  groupVariants,
  itemVariants,
  triggerProps,
  type RevealEffect,
  type RevealTrigger,
} from "./effects";

/**
 * Entrance animations, triggered when an element scrolls into view.
 *
 * - `Reveal`      — one element that animates on its own.
 * - `RevealGroup` — a container that staggers its `RevealItem` descendants
 *                   (they may sit at any depth, even inside server components).
 * - `RevealItem`  — a child of a `RevealGroup`; has no trigger of its own.
 *
 * Every element animates only once. Users with `prefers-reduced-motion`
 * get a short opacity fade without any movement; `[data-reveal]` in
 * globals.css also forces them visible in case scripts never run.
 */

type ElementProps = {
  as?: MotionTag;
  className?: string;
  id?: string;
  /** Static layout styles only (e.g. a bar's width); motion owns transforms. */
  style?: CSSProperties;
  role?: string;
  /** For purely decorative elements, e.g. a `draw` line. */
  "aria-hidden"?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  children?: ReactNode;
};

type TriggerProps = {
  /** `"view"` (default) animates on scroll, `"mount"` right away (above the fold). */
  trigger?: RevealTrigger;
  /** Seconds before this element (or the group's first item) starts. */
  delay?: number;
};

/** A single element with its own entrance. */
export function Reveal({
  as = "div",
  effect = "fade-up",
  delay = 0,
  trigger = "view",
  ...rest
}: ElementProps & TriggerProps & { effect?: RevealEffect }) {
  const Tag = motionTags[as] as ElementType;
  return (
    <Tag
      {...rest}
      data-reveal=""
      {...triggerProps(trigger, effect)}
      variants={itemVariants(effect, useReduceMotion(), delay)}
    />
  );
}

/** Container that reveals its `RevealItem` descendants one after another. */
export function RevealGroup({
  as = "div",
  delay = 0,
  stagger = DEFAULT_STAGGER,
  trigger = "view",
  ...rest
}: ElementProps & TriggerProps & { /** Seconds between two items. */ stagger?: number }) {
  const Tag = motionTags[as] as ElementType;
  return (
    <Tag
      {...rest}
      {...triggerProps(trigger)}
      variants={groupVariants(stagger, delay, useReduceMotion())}
    />
  );
}

/**
 * One staggered item; must render inside a `RevealGroup`. Its timing comes
 * from the group's stagger. A `RevealItem` nested in another one starts
 * together with its parent item.
 */
export function RevealItem({
  as = "div",
  effect = "fade-up",
  ...rest
}: ElementProps & { effect?: RevealEffect }) {
  const Tag = motionTags[as] as ElementType;
  return (
    <Tag {...rest} data-reveal="" variants={itemVariants(effect, useReduceMotion())} />
  );
}
