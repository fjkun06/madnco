import { LegalPage, Placeholder } from "@/components/legal/LegalPage";
import { provider } from "@/content/legal/provider";
import { pageMetadata, routes } from "@/lib/seo/metadata";
import { en } from "@/locales/en";

export const metadata = pageMetadata({
  path: routes.privacy,
  title: `${en.legal.privacyTitle} · MadnCo.`,
  index: false,
});

export default function PrivacyPage() {
  return (
    <LegalPage title={en.legal.privacyTitle}>
      <h2>Who is responsible</h2>
      <p>
        <Placeholder>{provider.name}</Placeholder>, contact:{" "}
        <Placeholder>{provider.email}</Placeholder>.
      </p>
      <h2>Hosting</h2>
      <p>
        The site is hosted by Vercel Inc. When you open a page, Vercel processes technical
        data such as your IP address and browser type to deliver it and keep it secure.{" "}
        <Placeholder>[Retention period and Vercel data processing agreement]</Placeholder>
      </p>
      <h2>No tracking, no cookies</h2>
      <p>
        This site uses no analytics and no tracking cookies. Fonts are served from this
        site, not loaded from Google. Your &ldquo;Pause animations&rdquo; choice is stored
        only in your own browser (local storage).
      </p>
      <h2>Links to other platforms</h2>
      <p>
        Links to Discord, TikTok, Twitch and YouTube take you to those services, where
        their own privacy policies apply. Nothing is shared with them until you click.
      </p>
      <h2>Your rights</h2>
      <p>
        You can ask for access to, correction or deletion of your data, and complain to a
        data protection authority.{" "}
        <Placeholder>[Responsible authority for the operator&rsquo;s state]</Placeholder>
      </p>
      <p>
        <Placeholder>
          [Have this page checked before launch: eRecht24, IHK or a lawyer.]
        </Placeholder>
      </p>
    </LegalPage>
  );
}
