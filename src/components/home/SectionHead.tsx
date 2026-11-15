import { Reveal } from "@/components/ui/reveal";
import { SECTION_LABEL, SECTION_TITLE } from "@/utils/ui.classes";

/**
 * Number + name label, a display heading with one turquoise word, and an
 * optional note on the right. The heading wipes in like a lower-third.
 */
export function SectionHead({
  id,
  label,
  titleLead,
  titleAccent,
  aside,
}: {
  /** id of the heading, for the section's `aria-labelledby`. */
  id: string;
  label: string;
  titleLead: string;
  titleAccent: string;
  aside?: string;
}) {
  return (
    <div className="mb-[clamp(2rem,1.5rem+1.6vw,3rem)] grid grid-cols-1 items-end gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22.5rem)] lg:gap-10">
      <div>
        <Reveal as="span" className={`${SECTION_LABEL} block`}>
          {label}
        </Reveal>
        <Reveal as="h2" effect="wipe" delay={0.1} className={SECTION_TITLE} id={id}>
          {titleLead} <span className="text-tq">{titleAccent}</span>
        </Reveal>
      </div>
      {aside && (
        <Reveal
          as="p"
          delay={0.25}
          className="m-0 max-w-[22.5rem] text-[17px] leading-[1.55] text-muted"
        >
          {aside}
        </Reveal>
      )}
    </div>
  );
}
