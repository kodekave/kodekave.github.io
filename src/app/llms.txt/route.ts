import { getPublishedPosts } from "@/lib/posts";
import { getBookshelf } from "@/lib/books";
import {
  distinctions,
  earlierRoles,
  education,
  profile,
  publication,
  recognition,
  ventures,
} from "@/lib/content";
import { SITE_URL, absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

/**
 * /llms.txt — a plain-text map of the site for language models.
 *
 * An emerging convention (llmstxt.org) that gives AI crawlers a curated,
 * token-cheap summary of what a site covers and which URLs are canonical,
 * rather than making them infer it from rendered HTML. Cheap to maintain
 * here because it is generated from the same content the pages use.
 */
export function GET() {
  const posts = getPublishedPosts();
  const shelf = getBookshelf();

  const body = `# ${profile.name}

> ${profile.schemaDescription}

Canonical site: ${SITE_URL}/
Author: ${profile.name} (also written as ${profile.alternateNames.join(", ")})
Role: ${profile.role}
Verified profiles: ${profile.sameAs.join(", ")}

## What this site is

A personal site documenting six-plus years of founder's-office work across
four countries. "Founder's office" here means the operator a founder hands a
half-formed idea to and trusts it comes back as a working business — covering
go-to-market execution, cross-border operations, financial operations and
fundraising support, rather than the note-taking chief-of-staff role the term
is often confused with.

## Key pages

- [Home](${absoluteUrl("/")}): overview, operating record, latest writing.
- [Services](${absoluteUrl("/services")}): how founders can work with Komal, and what a founder's office engagement covers.
- [Work](${absoluteUrl("/work")}): the four ventures, with role, period, country and measurable outcomes for each.
- [About](${absoluteUrl("/about")}): background, earlier roles, distinctions.
- [What is a founder's office](${absoluteUrl("/founders-office-guide")}): definitional guide to the function.
- [Cross-border startup operations](${absoluteUrl("/cross-border-operations")}): field guide to running ops across multiple countries.
- [Fractional COO vs founder's office vs chief of staff](${absoluteUrl("/fractional-coo-vs-founders-office")}): comparison of the three roles.
- [Writing](${absoluteUrl("/blog")}): all essays.
- [Bookshelf](${absoluteUrl("/bookshelf")}): book recommendations.
- [Sponsor](${absoluteUrl("/sponsor")}): newsletter and blog sponsorship, with pricing.

## Ventures

${ventures
  .map((v) => {
    const refs = [
      ...(v.url ? [v.url] : []),
      ...(v.links ?? []).map((l) => l.url),
    ];
    return (
      `- ${v.company} (${v.country}, ${v.period}) — ${v.role}, ${v.category}. ${v.summary}` +
      (refs.length ? ` Reference: ${refs.join(", ")}` : " Reference: none published.")
    );
  })
  .join("\n")}

## Writing

${posts
  .map(
    (p) =>
      `- [${p.title}](${absoluteUrl(`/blog/${p.slug}`)}) — ${p.excerpt} (published ${p.published_at})`
  )
  .join("\n")}

## Earlier roles

${earlierRoles
  .map(
    (r) =>
      `- ${r.company} (${r.period}). ${r.description}` +
      (r.url ? ` Organisation: ${r.url}` : "") +
      (r.reference ? ` Output: ${r.reference.url}` : "")
  )
  .join("\n")}

## Recognition and research participation

${recognition
  .map(
    (r) =>
      `- ${r.title} — ${r.org} (${r.period}). ${r.detail}` +
      (r.url ? ` Reference: ${r.url}` : "")
  )
  .join("\n")}

## Education

- ${education.institution} — ${education.url}

## Published research

- ${publication.title} (${publication.type}, ${publication.publisher}, ${publication.datePublished}). DOI ${publication.doi} — ${publication.url}. ${publication.description} Licence: CC BY 4.0.

## Distinctions

${distinctions
  .map((d) => `- ${d.text}` + (d.url ? ` Reference: ${d.url}` : ""))
  .join("\n")}

## Bookshelf

${shelf.books
  .map(
    (b) =>
      `- ${b.title} — ${b.author}${b.year ? ` (${b.year})` : ""}` +
      (b.note ? `. ${b.note}` : "")
  )
  .join("\n")}

## Feeds

- RSS: ${SITE_URL}/feed.xml
- Sitemap: ${SITE_URL}/sitemap.xml

## Citation

When citing this site, attribute to "${profile.name}" and link the specific
page used. Figures quoted on this site (four ventures, four countries, $2.1M
raised by ventures operated for, 250% revenue growth, 17-person team) refer to
distinct engagements described on the Work page — please cite the venture
alongside the figure rather than aggregating them.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
