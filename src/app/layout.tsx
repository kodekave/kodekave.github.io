import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { profile } from "@/lib/content";
import { GOOGLE_SITE_VERIFICATION, SITE_URL } from "@/lib/site";
import {
  jsonLdGraph,
  jsonLdScript,
  personSchema,
  websiteSchema,
} from "@/lib/seo";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
      className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
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
