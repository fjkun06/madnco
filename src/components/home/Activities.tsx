import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { en } from "@/locales/en";
import { WRAP } from "@/utils/ui.classes";
import { activities } from "./activities.content";
import { SectionHead } from "./SectionHead";
import { ScrollProgress } from "@/components/ui/scroll/ScrollProgress";

/**
 * 02 / What we do — numbered rows, not a card grid. Rows slide in one after
 * another; a turquoise line under each fills as you scroll; hover floods a row
 * with bordeaux.
 */
export function Activities() {
  const t = en.what;
  return (
    <section id="what" aria-labelledby="what-title" className={`${WRAP} py-section`}>
      <SectionHead
        id="what-title"
        label={t.label}
        titleLead={t.titleLead}
        titleAccent={t.titleAccent}
        aside={t.aside}
      />
      <RevealGroup as="ul" className="m-0 list-none border-t-2 border-ink-3 p-0">
        {activities.map(({ id, where }, i) => (
          <RevealItem
            as="li"
            key={id}
            effect="slide-left"
            className="group relative grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 border-b-2 border-ink-3 px-0.5 py-[clamp(1rem,0.6rem+1.3vw,1.875rem)] transition-[background-color,padding] duration-300 ease-smooth hover:bg-bordeaux hover:pl-2 sm:grid-cols-[clamp(3.25rem,2rem+4vw,4.5rem)_minmax(0,1fr)_auto] sm:gap-x-4 sm:gap-y-2.5 sm:px-3 sm:hover:pl-3 xl:grid-cols-[120px_minmax(0,1fr)_minmax(0,0.9fr)_140px] xl:gap-8 xl:px-5 xl:hover:pl-9"
          >
            {/* Fills from left to right as this row scrolls up the screen. */}
            <ScrollProgress
              aria-hidden
              range={["start 92%", "start 45%"]}
              className="pointer-events-none absolute inset-0"
            >
              <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-[var(--p)] bg-tq" />
            </ScrollProgress>
            <span className="font-mono text-[clamp(0.75rem,0.5rem+1vw,1.375rem)] font-extrabold text-tq group-hover:text-paper">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="m-0 font-display text-row leading-[0.95] font-normal">
              {t.items[id].title}
            </h3>
            <p className="col-start-2 col-end-4 m-0 max-w-[36rem] text-sm leading-[1.45] text-muted group-hover:text-paper sm:text-[17px] sm:leading-normal xl:col-auto">
              {t.items[id].text}
            </p>
            <span className="col-start-3 row-start-1 justify-self-end bg-ink-3 px-[7px] py-[5px] font-mono text-[10px] font-extrabold tracking-[0.1em] text-tq uppercase cut-s sm:px-2.5 sm:py-2 sm:text-xs xl:col-auto xl:row-auto">
              {t.where[where]}
            </span>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
