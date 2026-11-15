import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Lilita_One, Rubik } from "next/font/google";

import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { InlineScript } from "@/components/layout/InlineScript";
import { MotionProvider, REVEAL_NOSCRIPT_CSS } from "@/components/ui/reveal";
import { PAUSE_KEY } from "@/lib/motion/pause";
import { en } from "@/locales/en";
import { siteConfig } from "@/utils/app.constants";
import { ScrollProgress } from "@/components/ui/scroll/ScrollProgress";

const display = Lilita_One({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: "400",
});
const sans = Rubik({
  variable: "--font-sans-face",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});
const mono = JetBrains_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

/**
 * Runs before the first paint: restores the visitor's "Pause animations"
 * choice (data-motion="paused", see lib/motion/pause.ts) so nothing moves
 * for a frame before React loads.
 */
const BOOT = `(function(){try{if(localStorage.getItem(${JSON.stringify(PAUSE_KEY)})==="paused")document.documentElement.dataset.motion="paused"}catch(e){}})()`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#110a0c",
};

/** Fallbacks; each page sets its own title and canonical (lib/seo/metadata). */
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: en.meta.title,
  description: en.meta.description,
  applicationName: siteConfig.name,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      {/* App Router document: a plain <head> is right here. */}
      <head>
        <InlineScript html={BOOT} />
        <noscript>
          <style>{REVEAL_NOSCRIPT_CSS}</style>
        </noscript>
      </head>
      <body id="top">
        <a
          href="#main"
          className="sr-only z-[70] bg-tq px-4 py-2 label-mono text-sm font-bold text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {en.nav.skip}
        </a>
        <MotionProvider>
          {/* Page scroll progress: a turquoise bar filling across the top. */}
          <ScrollProgress
            page
            aria-hidden
            className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[5px] [--p:0] motion-reduce:hidden"
          >
            <span className="block h-full origin-left scale-x-[var(--p)] bg-tq" />
          </ScrollProgress>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
