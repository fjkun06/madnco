import { BuildDemo, BuildHero, BuildHow, BuildInside, BuildVote } from "@/components/build/BuildSections";
import { pageMetadata, routes } from "@/lib/seo/metadata";
import { en } from "@/locales/en";

export const metadata = pageMetadata({
  path: routes.build,
  title: en.build.metaTitle,
  description: en.build.metaDescription,
});

/** /build — the public showcase: the overlay in demo mode, how it's made. */
export default function BuildPage() {
  return (
    <>
      <BuildHero />
      <BuildDemo />
      <BuildInside />
      <BuildHow />
      <BuildVote />
    </>
  );
}
