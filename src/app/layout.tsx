import type { Metadata } from "next";
import { Bodoni_Moda, Newsreader, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { profile } from "@/lib/content";
import { GOOGLE_SITE_VERIFICATION, SITE_URL } from "@/lib/site";
import {
  jsonLdGraph,
  jsonLdScript,
  personSchema,
  websiteSchema,
} from "@/lib/seo";

/**
 * Three faces, three jobs: a Didone for display, a text serif for reading,
 * and a monospace for every label, date and control.
 *
 * `opsz` has to be requested explicitly — next/font ships only the weight
 * axis by default — and it does the work a light weight would elsewhere:
 * Bodoni Moda starts at 400, so the fine Didone hairlines in the name
 * treatment come from driving optical size up, not from thinning the stroke.
 */
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  axes: ["opsz"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

/**
 * Root metadata deliberately sets NO `alternates`, `openGraph` or `twitter`.
 *
 * Those keys are inherited by every child route, and Next merges metadata
 * shallowly — so a single `alternates.canonical` here resolved to the
 * homepage on all seven pages and told Google to de-index the other six.
 * Each page now builds its own complete set via `buildMetadata()`.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${profile.name} — ${profile.role}`,
    template: `%s — ${profile.shortName} Kedarnath`,
  },
  description: profile.schemaDescription,
  authors: [{ name: profile.name, url: `${SITE_URL}/` }],
  creator: profile.name,
  publisher: profile.name,
  // Omitted entirely when the token is unset, so no empty meta tag ships.
  ...(GOOGLE_SITE_VERIFICATION
    ? { verification: { google: GOOGLE_SITE_VERIFICATION } }
    : {}),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${bodoni.variable} ${newsreader.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {/*
          One @graph containing the Person and WebSite nodes, cross-referenced
          by @id so consumers resolve them as a single connected entity rather
          than duplicate look-alike nodes. Page-level scripts add their own
          nodes (BlogPosting, BreadcrumbList, FAQPage) that point back here.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(
            jsonLdGraph(personSchema(), websiteSchema())
          )}
        />
        {children}
      </body>
    </html>
  );
}
