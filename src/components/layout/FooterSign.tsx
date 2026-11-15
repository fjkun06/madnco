import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/reveal";

/**
 * The ENDLESS MADNESS sign. Drawn as SVG text with `textLength`, so it spans
 * exactly the content width at any screen size, whatever the font's metrics:
 * one line from `md`, one word per line on phones. An outlined copy sits
 * underneath; the solid copy wipes in over it once the sign is in view
 * (reduced motion: shown at once).
 */
export function FooterSign({ first, second }: { first: string; second: string }) {
  return (
    <div className="relative" role="img" aria-label={`${first} ${second}`}>
      <SignArt first={first} second={second} solid={false} />
      {/* Painted in from left to right, all the way, once it comes into view. */}
      <Reveal effect="wipe" aria-hidden className="absolute inset-0">
        <SignArt first={first} second={second} solid />
      </Reveal>
    </div>
  );
}

/** Font size and baseline in SVG units; the viewBox height fits the caps. */
const SIZE = 128;
const BASELINE = 104;
const HEIGHT = 112;

function SignArt({
  first,
  second,
  solid,
}: {
  first: string;
  second: string;
  solid: boolean;
}) {
  // Outline: the first word is stroked, the second always solid turquoise.
  const firstPaint = solid
    ? { fill: "var(--color-paper)" }
    : { fill: "transparent", stroke: "var(--color-line)", strokeWidth: 2.5 };
  const secondPaint = { fill: "var(--color-tq)" };
  return (
    <>
      {/* Tablet and desktop: one line, edge to edge. */}
      <SignLine className="hidden md:block" width={1000}>
        <tspan style={firstPaint}>{first}</tspan>{" "}
        <tspan style={secondPaint}>{second}</tspan>
      </SignLine>
      {/* Phones: each word fills the width on its own line. */}
      <div className="w-[80%] md:hidden">
        <SignLine width={500}>
          <tspan style={firstPaint}>{first}</tspan>
        </SignLine>
        <SignLine width={500}>
          <tspan style={secondPaint}>{second}</tspan>
        </SignLine>
      </div>
    </>
  );
}

function SignLine({
  width,
  className = "block",
  children,
}: {
  width: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      className={`${className} h-auto w-full overflow-visible`}
      viewBox={`0 0 ${width} ${HEIGHT}`}
      aria-hidden="true"
      focusable="false"
    >
      <text
        x="0"
        y={BASELINE}
        fontSize={SIZE}
        textLength={width}
        lengthAdjust="spacingAndGlyphs"
        className="font-display"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {children}
      </text>
    </svg>
  );
}
