import { Fragment } from "react";
import { en } from "@/locales/en";

/**
 * Two crossed tapes scrolling in opposite directions. Each track holds its
 * words twice so the -50 % loop is seamless. Purely decorative (the same
 * words appear elsewhere as real text), so screen readers skip it.
 */
export function Tapes() {
  return (
    <div
      aria-hidden="true"
      className="tapes-tilt relative mb-2.5 h-[150px] md:mt-2.5 md:mb-10 md:h-[190px]"
    >
      <Tape
        words={en.tapes.a}
        className="top-6 z-[2] -rotate-[2.4deg] bg-tq text-ink md:top-[30px]"
        trackClassName="tape-track"
      />
      <Tape
        words={en.tapes.b}
        className="top-[78px] rotate-[1.8deg] bg-bordeaux text-paper md:top-24"
        trackClassName="tape-track-reverse"
      />
    </div>
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
      className={`absolute -inset-x-10 flex h-[50px] items-center overflow-clip whitespace-nowrap md:h-16 ${className}`}
    >
      <div className={`inline-flex ${trackClassName}`}>
        {[0, 1].map((half) => (
          <Fragment key={half}>
            {loop.map((word, i) => (
              <Fragment key={`${half}-${i}`}>
                <span className="px-3.5 font-display text-2xl md:px-[22px] md:text-[34px]">
                  {word}
                </span>
                <span className="font-mono text-base font-extrabold opacity-55 md:text-[22px]">
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
