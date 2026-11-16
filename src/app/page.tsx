import { Activities } from "@/components/home/Activities";
import { CaseFile } from "@/components/home/CaseFile";
import { Crew } from "@/components/home/Crew";
import { DiscordBand } from "@/components/home/DiscordBand";
import { FindUs } from "@/components/home/FindUs";
import { Hero } from "@/components/home/Hero";
import { Tapes } from "@/components/home/Tapes";
import { JsonLd } from "@/components/seo/JsonLd";
import { pageMetadata, routes } from "@/lib/seo/metadata";
import { homeStructuredData } from "@/lib/seo/structured-data";

export const metadata = pageMetadata({ path: routes.home });

export default function HomePage() {
  return (
    <>
      <JsonLd data={homeStructuredData()} />
      <Hero />
      <Tapes />
      <Crew />
      <Activities />
      <DiscordBand />
      <FindUs />
      <CaseFile />
    </>
  );
}
