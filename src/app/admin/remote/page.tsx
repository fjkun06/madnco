import type { Metadata } from "next";
import { Suspense } from "react";
import { RemoteGate } from "@/components/admin/remote/RemoteGate";
import { pageMetadata, routes } from "@/lib/seo/metadata";
import { en } from "@/locales/en";

export const metadata: Metadata = {
  ...pageMetadata({
    path: routes.remote,
    title: `${en.remote.metaTitle} · MadnCo.`,
    index: false,
  }),
  robots: { index: false, follow: false },
};

/** /admin/remote — big buttons for the laptop, tablet or phone while streaming. */
export default function RemotePage() {
  return (
    <section aria-label={en.remote.metaTitle} className="mx-auto w-full max-w-[1280px] px-3 pt-4 pb-10 sm:px-6">
      <Suspense fallback={<p className="label-mono text-xs text-muted">{en.remote.loading}</p>}>
        <RemoteGate />
      </Suspense>
    </section>
  );
}
