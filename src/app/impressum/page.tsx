import { LegalPage, Placeholder } from "@/components/legal/LegalPage";
import { provider } from "@/content/legal/provider";
import { pageMetadata, routes } from "@/lib/seo/metadata";
import { en } from "@/locales/en";
import { isPlaceholder } from "@/utils/app.constants";

export const metadata = pageMetadata({
  path: routes.impressum,
  title: `${en.legal.impressumTitle} · MadnCo.`,
  index: false,
});

/** Shows a provider fact, highlighted while it is still a placeholder. */
function Fact({ value }: { value: string }) {
  return isPlaceholder(value) ? <Placeholder>{value}</Placeholder> : <>{value}</>;
}

export default function ImpressumPage() {
  return (
    <LegalPage title={en.legal.impressumTitle} lang="de">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        <Fact value={provider.name} />
        <br />
        <Fact value={provider.street} />
        <br />
        <Fact value={provider.city} />
        <br />
        {provider.country}
      </p>
      <h2>Kontakt</h2>
      <p>
        E-Mail: <Fact value={provider.email} />
      </p>
      <h2>Verantwortlich für den Inhalt</h2>
      <p>
        <Fact value={provider.name} />, Anschrift wie oben.
      </p>
      <p>
        <Placeholder>
          [Have this page checked before launch: eRecht24, IHK or a lawyer.]
        </Placeholder>
      </p>
    </LegalPage>
  );
}
