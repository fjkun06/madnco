import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminGate } from "@/components/admin/AdminGate";
import { pageMetadata, routes } from "@/lib/seo/metadata";
import { en } from "@/locales/en";
import { WRAP } from "@/utils/ui.classes";

export const metadata: Metadata = {
  ...pageMetadata({
    path: routes.admin,
    title: `${en.admin.metaTitle} · MadnCo.`,
    index: false,
  }),
  robots: { index: false, follow: false },
};

/**
 * /admin — the control room. The page shell is static; everything that needs
 * the login cookie or the saved state streams in inside <Suspense>, as
 * cacheComponents requires.
 */
export default function AdminPage() {
  return (
    <section aria-label={en.admin.metaTitle} className={`${WRAP} pt-6 pb-16 sm:pt-10`}>
      <Suspense
        fallback={<p className="label-mono text-xs text-muted">{en.admin.saving}</p>}
      >
        <AdminGate />
      </Suspense>
    </section>
  );
}
