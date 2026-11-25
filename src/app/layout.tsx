import type { Metadata, Viewport } from "next";
import { DM_Sans, Newsreader, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { profile } from "@/lib/content";
import { themeInit } from "@/lib/theme";
import { GOOGLE_SITE_VERIFICATION, SITE_URL } from "@/lib/site";
import {
  jsonLdGraph,
  jsonLdScript,
  personSchema,
  websiteSchema,
} from "@/lib/seo";

/**
 * Three faces, three jobs: a light serif for the name, the statements and the
 * titles; a quiet sans for body text and controls; and a monospace for the
 * small labels and dates only.
 *
 * Newsreader carries the first screen (the name and the statement are serif),
 * so its upright cut is preloaded. The italic cut is only used inside blog
 * posts and one line on the research page, so it is a separate face that loads
 * on demand instead of queuing ahead of the portrait.
 */
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal"],
});

const newsreaderItalic = Newsreader({
  variable: "--font-newsreader-italic",
  preload: false,
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400"],
});

/**
 * Root metadata deliberately sets NO `alternates`, `openGraph` or `twitter`.
 *
 * Those keys are inherited by every child route, and Next merges metadata
 * shallowly — so a single `alternates.canonical` here resolved to the
 * homepage on all seven pages and told Google to de-index the other six.
 * Each page now builds its own complete set via `buildMetadata()`.
 */
/** The paper colour, so a phone's address bar matches the page. */
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${profile.tagline.replace(/\.$/, "")} — ${profile.name}`,
    template: `%s — ${profile.shortName} Kedarnath`,
  },
  description: profile.schemaDescription,
  authors: [{ name: profile.name, url: `${SITE_URL}/` }],
  creator: profile.name,
  publisher: profile.name,
  // Omitted entirely when the token is unset, so no empty meta tag ships.
  // Bing Webmaster Tools proves ownership with a meta tag named msvalidate.01.
  verification: {
    ...(GOOGLE_SITE_VERIFICATION ? { google: GOOGLE_SITE_VERIFICATION } : {}),
    other: { "msvalidate.01": "BE63E7A48BA043DECAA50540A8EB56F6" },
  },
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
      // `data-theme` is set by the script below before the page paints.
      suppressHydrationWarning
      className={`${dmSans.variable} ${newsreader.variable} ${newsreaderItalic.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
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
