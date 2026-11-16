import { serializeJsonLd } from "@/lib/seo/structured-data";

/** Structured data for search engines; renders nothing visible. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
