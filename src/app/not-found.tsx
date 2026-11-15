import Link from "next/link";
import { Ghost } from "@/components/icons/Mascots";
import { en } from "@/locales/en";
import { BUTTON_PRIMARY, SECTION_TITLE, WRAP } from "@/utils/ui.classes";

export default function NotFound() {
  const t = en.notFound;
  return (
    <section className={`${WRAP} flex flex-col items-start gap-6 py-24`}>
      <Ghost className="w-24" />
      <h1 className={`${SECTION_TITLE} m-0`}>{t.title}</h1>
      <p className="m-0 text-lg text-muted">{t.text}</p>
      <Link href="/" className={BUTTON_PRIMARY}>
        {t.cta}
      </Link>
    </section>
  );
}
