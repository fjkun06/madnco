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
      className="relative mb-1 h-[92px] scale-[1.06] rotate-[calc(-3deg+var(--p)*6deg)] sm:mb-2.5 sm:h-[150px] md:mt-2.5 md:mb-10 md:h-[190px]"
    >
      <Tape
        words={en.tapes.a}
        className="top-3.5 z-[2] translate-x-[calc(var(--p)*-22vw)] -rotate-[2.4deg] bg-tq text-ink sm:top-6 md:top-[30px]"
        trackClassName="tape-track"
      />
      <Tape
        words={en.tapes.b}
        className="top-[50px] translate-x-[calc(var(--p)*22vw)] rotate-[1.8deg] bg-bordeaux text-paper sm:top-[78px] md:top-24"
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
      className={`absolute -inset-x-[30vw] flex h-[34px] items-center overflow-clip whitespace-nowrap sm:h-[50px] md:h-16 ${className}`}
    >
      <div className={`inline-flex ${trackClassName}`}>
        {[0, 1].map((half) => (
          <Fragment key={half}>
            {loop.map((word, i) => (
              <Fragment key={`${half}-${i}`}>
                <span className="px-[clamp(0.625rem,0.3rem+1.3vw,1.375rem)] font-display text-tape">
                  {word}
                </span>
                <span className="font-mono text-[clamp(0.75rem,0.5rem+0.85vw,1.375rem)] font-extrabold opacity-55">
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
