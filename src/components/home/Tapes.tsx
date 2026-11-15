import { Fragment } from "react";
import { en } from "@/locales/en";
import { ScrollProgress } from "@/components/ui/scroll/ScrollProgress";

/**
 * Linked to the page scroll, the tapes tilt across and slide in opposite
 * directions on top of their own marquee.
 *
 * Two crossed tapes scrolling in opposite directions. Each track holds its
 * words twice so the -50 % loop is seamless. Purely decorative (the same
 * words appear elsewhere as real text), so screen readers skip it.
 */
export function Tapes() {
  return (
    <ScrollProgress
      aria-hidden
      className="relative mb-2.5 h-[150px] scale-[1.06] rotate-[calc(-3deg+var(--p)*6deg)] md:mt-2.5 md:mb-10 md:h-[190px]"
    >
      <Tape
        words={en.tapes.a}
        className="top-6 z-[2] -rotate-[2.4deg] translate-x-[calc(var(--p)*-22vw)] bg-tq text-ink md:top-[30px]"
        trackClassName="tape-track"
      />
      <Tape
        words={en.tapes.b}
        className="top-[78px] rotate-[1.8deg] translate-x-[calc(var(--p)*22vw)] bg-bordeaux text-paper md:top-24"
        trackClassName="tape-track-reverse"
      />
    </ScrollProgress>
  );
}

function Tape({
  words,
  className,
  trackClassName,
}: {
  words: readonly string[];
  className: string;
  trackClassName: string;
}) {
  // Four copies: long enough to cover wide screens with the short tape too.
  const loop = [...words, ...words, ...words, ...words];
  return (
    <div
      className={`absolute -inset-x-[30vw] flex h-[50px] items-center overflow-clip whitespace-nowrap md:h-16 ${className}`}
    >
      <div className={`inline-flex ${trackClassName}`}>
        {[0, 1].map((half) => (
          <Fragment key={half}>
            {loop.map((word, i) => (
              <Fragment key={`${half}-${i}`}>
                <span className="px-[clamp(0.875rem,0.6rem+0.8vw,1.375rem)] font-display text-tape">
                  {word}
                </span>
                <span className="font-mono text-[clamp(1rem,0.8rem+0.6vw,1.375rem)] font-extrabold opacity-55">
                  {"//"}
                </span>
              </Fragment>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
