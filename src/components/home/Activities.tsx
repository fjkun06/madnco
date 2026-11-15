import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { en } from "@/locales/en";
import { WRAP } from "@/utils/ui.classes";
import { activities } from "./activities.content";
import { SectionHead } from "./SectionHead";

/**
 * 02 / What we do — numbered rows, not a card grid. Rows slide in one after
 * another and draw a turquoise line under themselves; hover floods a row
 * with bordeaux.
 */
export function Activities() {
  const t = en.what;
  return (
    <section id="what" aria-labelledby="what-title" className={`${WRAP} py-16 md:py-24`}>
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
            className="group relative grid grid-cols-[52px_minmax(0,1fr)] items-center gap-x-4 gap-y-2.5 border-b-2 border-ink-3 px-1 py-6 transition-[background-color,padding] duration-200 hover:bg-bordeaux hover:pl-3 md:grid-cols-[120px_minmax(0,1fr)_minmax(0,0.9fr)_140px] md:gap-8 md:px-5 md:py-[30px] md:hover:pl-9"
          >
            <RevealItem
              as="span"
              effect="draw"
              aria-hidden
              className="absolute inset-x-0 -bottom-0.5 h-[3px] origin-left bg-tq"
            />
            <span className="font-mono text-base font-extrabold text-tq group-hover:text-paper md:text-[22px]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="font-display m-0 text-[40px] leading-[0.95] font-normal md:text-[clamp(40px,4.6vw,68px)]">
              {t.items[id].title}
            </h3>
            <p className="col-start-2 m-0 text-[17px] leading-normal text-muted group-hover:text-paper md:col-start-auto">
              {t.items[id].text}
            </p>
            <span className="cut-s label-mono col-start-2 justify-self-start bg-ink-3 px-2.5 py-2 text-xs font-extrabold text-tq md:col-start-auto md:justify-self-end">
              {t.where[where]}
            </span>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
