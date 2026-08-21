import type { Metadata } from "next";
import { OG_IMAGE, SITE_URL, absoluteUrl } from "@/lib/site";
import { profile } from "@/lib/content";

/**
 * Builds a complete, self-contained metadata object for one route.
 *
 * Why a helper instead of per-page literals: Next merges metadata from
 * layout and page *shallowly*, so a page that defines `openGraph` replaces
 * the layout's entire `openGraph` object rather than merging into it — which
 * is how this site previously lost `og:image` on both blog posts. Building
 * the whole object in one place means every page ships a complete, correct
 * set of tags and a self-referencing canonical.
 *
 * See node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md
 * ("Merging").
 */
export function buildMetadata({
  path,
  title,
  description,
  type = "website",
  publishedTime,
  modifiedTime,
  image = OG_IMAGE,
}: {
  /** Site-relative path, e.g. "/about". Use "/" for the homepage. */
  path: string;
  /** Full <title> text. Not run through the layout template. */
  title: string;
  description: string;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  modifiedTime?: string;
  image?: typeof OG_IMAGE;
}): Metadata {
  const url = absoluteUrl(path);

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: url,
      types: {
        "application/rss+xml": `${SITE_URL}/feed.xml`,
      },
    },
    openGraph: {
      type: type === "profile" ? "profile" : type,
      url,
      siteName: profile.name,
      locale: "en_US",
      title,
      description,
      images: [image],
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}

/**
 * The Person node. This is the site's primary entity, and the thing search
 * engines and language models use to decide that every mention of "Komal
 * Kedarnath G" and "Komal Kedarnath" refers to one person.
 *
 * `@id` is a stable identifier other nodes reference, so the graph resolves
 * to a single person rather than several look-alike nodes.
 */
export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export function personSchema() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: profile.name,
    alternateName: profile.alternateNames,
    jobTitle: profile.role,
    description: profile.schemaDescription,
    url: absoluteUrl("/"),
    image: {
      "@type": "ImageObject",
      url: `${SITE_URL}/images/hero-2x.jpg`,
      width: 832,
      height: 1248,
    },
    sameAs: profile.sameAs,
    knowsAbout: profile.knowsAbout,
    homeLocation: { "@type": "Place", name: "India" },
    worksFor: {
      "@type": "Organization",
      name: "Travel Hands UK",
      description:
        "UK accessibility-technology company improving urban mobility for blind and low-vision commuters.",
      ...(profile.currentEmployerUrl ? { url: profile.currentEmployerUrl } : {}),
    },
    alumniOf: {
      "@type": "Organization",
      name: "Indian Institute of Technology Bombay (FOSSEE)",
      url: "https://fossee.in/",
    },
    hasOccupation: {
      "@type": "Occupation",
      name: "Founder's Office Operator",
      occupationLocation: [
        { "@type": "Country", name: "India" },
        { "@type": "Country", name: "Maldives" },
        { "@type": "Country", name: "United States" },
        { "@type": "Country", name: "United Kingdom" },
      ],
      skills: profile.knowsAbout,
    },
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: absoluteUrl("/"),
    name: profile.name,
    description: profile.schemaDescription,
    inLanguage: "en",
    publisher: { "@id": PERSON_ID },
    author: { "@id": PERSON_ID },
  };
}

/** Wraps nodes in a single @graph so all @id cross-references resolve. */
export function jsonLdGraph(...nodes: object[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

export function breadcrumbSchema(
  trail: { name: string; path: string }[]
) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Renders a JSON-LD script tag. Kept here so escaping is handled once. */
export function jsonLdScript(data: object) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}
