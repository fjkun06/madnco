import { render } from "@testing-library/react";
import type { Transition } from "framer-motion";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import { groupVariants, itemVariants, triggerProps, type RevealEffect } from "./effects";

const visibleTransition = (...args: Parameters<typeof itemVariants>) =>
  (itemVariants(...args).visible as { transition: Transition }).transition;

const effects: RevealEffect[] = [
  "fade-up",
  "fade",
  "scale",
  "pop",
  "slide-left",
  "slide-right",
  "wipe",
  "stamp",
  "spin",
  "draw",
];

describe("itemVariants", () => {
  // A transition.delay (even 0) overrides the stagger delay from a parent
  // RevealGroup, so items without a delay must not set one at all.
  it.each(effects.flatMap((e) => [[e, false] as const, [e, true] as const]))(
    "sets no delay for %s (reduced motion: %s) unless one is given",
    (effect, reduce) => {
      expect(visibleTransition(effect, reduce)).not.toHaveProperty("delay");
      expect(visibleTransition(effect, reduce, 0.3)).toHaveProperty("delay", 0.3);
    },
  );

  it.each(effects)(
    "animates %s back on exactly the properties it starts from",
    (effect) => {
      const { hidden, visible } = itemVariants(effect, false);
      const shown = { ...(visible as Record<string, unknown>) };
      delete shown.transition;
      expect(Object.keys(shown).sort()).toEqual(Object.keys(hidden).sort());
    },
  );

  it("draws a line from zero width to full width", () => {
    const v = itemVariants("draw", false);
    expect(v.hidden).toEqual({ scaleX: 0 });
    expect(v.visible).toMatchObject({ scaleX: 1 });
  });

  it("wipes a headline in from the left", () => {
    const v = itemVariants("wipe", false);
    expect(v.hidden).toMatchObject({ clipPath: "inset(0 100% 0 0)" });
    expect(v.visible).toMatchObject({ clipPath: "inset(0 0% 0 0)", x: 0 });
  });

  it("uses an opacity-only fade for reduced motion", () => {
    expect(itemVariants("stamp", true).hidden).toEqual({ opacity: 0 });
    expect(itemVariants("wipe", true).hidden).toEqual({ opacity: 0 });
  });
});

describe("Reveal components", () => {
  it("render the requested element with its classes and children", () => {
    const { container } = render(
      <RevealGroup as="section" className="group" id="g">
        <RevealItem as="li" className="item">
          step
        </RevealItem>
        <Reveal as="p" className="single">
          note
        </Reveal>
      </RevealGroup>,
    );

    expect(container.querySelector("section#g.group")).not.toBeNull();
    expect(container.querySelector("li.item")?.textContent).toBe("step");
    expect(container.querySelector("p.single")?.textContent).toBe("note");
  });
});

describe("groupVariants", () => {
  it("staggers items and delays the first one", () => {
    expect(groupVariants(0.1, 0.3, false).visible).toEqual({
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    });
  });

  it("drops the stagger for reduced motion", () => {
    expect(groupVariants(0.1, 0, true).visible).toMatchObject({
      transition: { staggerChildren: 0 },
    });
  });
});

describe("triggerProps", () => {
  it("animates on mount or once when scrolled into view", () => {
    expect(triggerProps("mount")).toEqual({ initial: "hidden", animate: "visible" });
    expect(triggerProps("view")).toMatchObject({
      initial: "hidden",
      whileInView: "visible",
      viewport: { once: true },
    });
  });

  it("uses the same viewport for every effect", () => {
    expect(triggerProps("view").viewport).toMatchObject({ amount: 0.15 });
  });
});

describe("zero-area effects", () => {
  // Chrome clips an IntersectionObserver target by its own clip-path, so a
  // fully wiped-out element never fired and section headings stayed hidden.
  it.each(["wipe", "draw"] as const)(
    "%s animates an inner element inside an unclipped wrapper",
    (effect) => {
      const { container } = render(
        <Reveal as="h2" effect={effect} className="title" id="t">
          Heading
        </Reveal>,
      );
      const outer = container.querySelector("h2#t.title");
      expect(outer).not.toBeNull();
      expect(outer).not.toHaveAttribute("data-reveal");
      expect(outer?.querySelector("span[data-reveal]")?.textContent).toBe("Heading");
    },
  );

  it("keeps a single element for other effects", () => {
    const { container } = render(<Reveal as="p">text</Reveal>);
    expect(container.querySelector("p")).toHaveAttribute("data-reveal");
    expect(container.querySelector("p span")).toBeNull();
  });
});
