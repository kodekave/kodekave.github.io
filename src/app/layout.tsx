import type { Metadata } from "next";
import { Archivo, Newsreader, IBM_Plex_Mono } from "next/font/google";
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
 * Three faces, three jobs: a grotesque for the nameplate and headings, a text
 * serif for reading, and a monospace for every label, date and control.
 *
 * The headline face is Archivo with its width axis, drawn narrow and heavy: the
 * lettering of a case, a datasheet masthead or a front panel. It replaced
 * Instrument Serif, whose high-contrast editorial cut read as the 2020s rather
 * than the early 1980s the site is built to evoke.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
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

/**
 * Decides, before first paint, whether this visit gets the boot sequence: the
 * homepage only, no hash in the URL, once per session, never with reduced
 * motion and never for automation (crawlers, audits, tests). It only sets an attribute; the stylesheet does the rest (see
 * BootPost). Wrapped so a blocked storage API cannot break the page.
 */
const POST_SCRIPT = `try{var d=document.documentElement;if(location.pathname==="/"&&!location.hash&&!navigator.webdriver&&!sessionStorage.getItem("post")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){d.setAttribute("data-post","1");sessionStorage.setItem("post","1")}}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${newsreader.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: POST_SCRIPT }} />
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
