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
    <div className="mb-8 flex flex-wrap items-end justify-between gap-6 md:mb-12">
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
          className="m-0 max-w-[360px] text-[17px] leading-relaxed text-muted"
        >
          {aside}
        </Reveal>
      )}
    </div>
  );
}
