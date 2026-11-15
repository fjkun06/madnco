import Link from "next/link";
import type { ReactNode } from "react";
import { en } from "@/locales/en";
import { SECTION_TITLE, WRAP } from "@/utils/ui.classes";

/** Shared frame for the Impressum and privacy pages: plain, readable, no motion. */
export function LegalPage({
  title,
  lang,
  children,
}: {
  title: string;
  /** Language of the body text when it differs from the page (German Impressum). */
  lang?: string;
  children: ReactNode;
}) {
  return (
    <article lang={lang} className={`${WRAP} max-w-[860px] py-16 md:py-24`}>
      <Link href="/" className="label-mono text-xs text-muted no-underline hover:text-tq">
        ← {en.legal.back}
      </Link>
      <h1 className={`${SECTION_TITLE} mb-10`}>{title}</h1>
      <div className="flex flex-col gap-6 text-[17px] leading-relaxed text-muted [&_h2]:mt-6 [&_h2]:mb-0 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:font-normal [&_h2]:text-paper [&_p]:m-0">
        {children}
      </div>
    </article>
  );
}

/** A `[...]` fact: highlighted so it can't be missed, and kept out of search snippets. */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <span data-nosnippet className="bg-bordeaux px-1 text-paper">
      {children}
    </span>
  );
}
