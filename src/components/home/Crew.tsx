import { en } from "@/locales/en";
import { WRAP } from "@/utils/ui.classes";
import { CrewSelect } from "./CrewSelect";
import { SectionHead } from "./SectionHead";

/** 01 / The crew — Mad hosts, Co joins, guests drop in. */
export function Crew() {
  const t = en.crew;
  return (
    <section id="crew" aria-labelledby="crew-title" className={`${WRAP} py-16 md:py-24`}>
      <SectionHead
        id="crew-title"
        label={t.label}
        titleLead={t.titleLead}
        titleAccent={t.titleAccent}
        aside={t.aside}
      />
      <CrewSelect text={t} />
    </section>
  );
}
