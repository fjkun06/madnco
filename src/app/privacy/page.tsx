import { LegalPage } from "@/components/legal/LegalPage";
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
        {provider.name}, {provider.street}, {provider.city}. Contact:{" "}
        <a href={`mailto:${provider.email}`}>{provider.email}</a>.
      </p>
      <h2>Hosting</h2>
      <p>
        The site is hosted by Vercel Inc. When you open a page, Vercel processes technical
        data such as your IP address and browser type to deliver it and keep it secure.
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
        data protection authority.
      </p>
    </LegalPage>
  );
}
