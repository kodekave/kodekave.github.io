# Komal Kedarnath — personal site

A fully static Next.js site — home, about, work, blog, and sponsor pages —
deployed to GitHub Pages at [kodekave.github.io](https://kodekave.github.io).

## Getting started

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## How it's put together

- **Pages** live in `src/app/(site)/` — home, `/about`, `/work`, `/blog`,
  `/sponsor`. Copy and bio content (ventures, stats, journey) is centralized
  in `src/lib/content.ts` — edit that file to change it.
- **Blog** posts are markdown files in `content/posts/*.md`, each with
  frontmatter:
  ```md
  ---
  title: Post title
  excerpt: One or two sentences shown on the blog index.
  date: "2026-08-20"
  published: true
  ---
  Post body in markdown.
  ```
  Add a new file there, rebuild, and it appears on `/blog`. Set
  `published: false` to keep a draft out of the build without deleting it.
- **Newsletter form** posts nobody anywhere until you set `SUBSTACK_URL` in
  `src/lib/site.ts`. Once set, the form keeps this site's styling and hands
  off to your Substack subscribe page with the address prefilled, where the
  visitor confirms in one click. Substack rejects cross-origin form POSTs, so
  a fully inline signup is not possible from a static site without embedding
  their iframe. Until the constant is filled in, the form says signup is not
  live yet rather than reporting a false success.
- **Sponsor form** still opens a `mailto:` to `profile.email`.
- There is **no admin panel and no database** — this is a static export
  (`output: 'export'` in `next.config.ts`). Editing content means editing
  files and pushing.

## SEO, GEO and AEO conventions

Read this before touching metadata — two of these are easy to break silently.

**Every page builds its own complete metadata** via `buildMetadata()` in
`src/lib/seo.ts`. Do not set `alternates`, `openGraph` or `twitter` in a
layout. Next merges metadata **shallowly**, so a layout-level
`alternates.canonical` is inherited by every route (which previously made all
seven pages canonicalise to the homepage, telling Google to de-index six of
them), and a page-level `openGraph` **replaces** the inherited object rather
than merging into it (which previously dropped `og:image` from both posts).
Adding a page means calling `buildMetadata({ path, title, description })`.

- Titles: 50-60 characters, leading with the query rather than the brand.
- Descriptions: 150-160 characters.
- `src/lib/site.ts` holds `SITE_URL`. Nothing else should hardcode the
  domain, so moving to a custom domain is a one-line change plus a
  `public/CNAME` file and DNS records.
- `trailingSlash: true` is deliberate. Without it GitHub Pages serves both
  `/about` and `/about.html` with a 200, and 404s on `/about/`. Canonicals
  and the sitemap use the slashed form to match — keep them consistent.

**Structured data** lives in `src/lib/seo.ts`. The root layout emits one
`@graph` with `Person` and `WebSite` nodes carrying stable `@id`s; pages add
`Article`/`BlogPosting`, `BreadcrumbList`, `FAQPage`, `Service` and
`ItemList` nodes that reference `PERSON_ID` rather than restating the author.
Keep it that way so the whole site resolves to one entity. `profile.sameAs`
is the strongest entity-consolidation signal there is — add every profile you
control.

**Answer-engine optimisation.** Posts and guides open each section with a
sentence that stands alone as an answer, because that is the unit a featured
snippet or an AI answer extracts. Posts support `faqs:` in frontmatter, which
renders a visible FAQ block and emits `FAQPage` markup. `/llms.txt` and
`/feed.xml` are generated route handlers, so they stay in sync with content
automatically — no manual editing.

**Adding a post.** Frontmatter supports `title`, `excerpt` (make it 150-160
characters — it becomes the meta description), `date`, `updated`, `published`,
`tags` and `faqs`. Tags drive the related-post links at the foot of a post.

## Things still to fill in

Search the repo for `TODO(komal)`:

- `SUBSTACK_URL` in `src/lib/site.ts` — newsletter signup is inert until set.
- `url` on each entry in `ventures` in `src/lib/content.ts` — four companies
  are named but unlinked, which is the biggest remaining trust gap.
- `currentEmployerUrl` in `profile` — strengthens the `worksFor` schema.

## Deploying

Every push to `main` triggers `.github/workflows/deploy.yml`, which runs
`npm run build` (a static export into `out/`) and publishes it to GitHub
Pages automatically. Nothing to run manually — just commit and push.

To preview the exact static output locally before pushing:

```bash
npm run build
npm run serve   # serves the out/ folder
```

## Adding your photos

`<Portrait>` takes an **extensionless base path** (`src="/images/hero"`) and
renders a `<picture>` that offers AVIF, WebP and JPEG at two widths. It
expects these files to exist:

```
public/images/hero-1x.avif   public/images/hero-2x.avif
public/images/hero-1x.webp   public/images/hero-2x.webp
public/images/hero-1x.jpg    public/images/hero-2x.jpg
```

Generate them all from one source photo:

```bash
python3 scripts/optimize-image.py ~/path/to/photo.jpg --name hero
```

Because `output: 'export'` disables the Next.js image optimiser, these
variants have to be real files — there is no server to resize on request.
Keep the full-resolution original **outside** `public/` so it never ships.
If the files are missing, the component falls back to an initials placeholder.

Crop framing and the navy/khaki duotone are still controlled by the
`objectPosition` and `tinted` props where `<Portrait>` is used. Pass
`priority` on the above-the-fold hero only — that is the LCP element.

## Social sharing image

`public/images/og-card.jpg` is the 1200x630 card used for every page's
`og:image` and Twitter card. It is a generated composite, not a photo — if
the tagline or name changes, regenerate it. A portrait headshot must not be
used here; `summary_large_image` centre-crops it to a sliver.

## Wiring up real forms later

- **Newsletter**: already wired for Substack — set `SUBSTACK_URL` in
  `src/lib/site.ts` to your publication (e.g.
  `https://yourname.substack.com`) and it starts working. To switch provider
  instead, replace `substackSubscribeUrl()` in the same file; Buttondown and
  Kit both accept a plain cross-origin form POST, which Substack does not.
- **Sponsor inquiries**: `src/components/SponsorForm.tsx` still opens a
  `mailto:`. Point it at a form backend like Formspree, or keep the mailto if
  you're fine with inquiries landing directly in your inbox.

This is a static export with no server, so any integration has to be a
client-side call to a third-party endpoint, not a route on this site.
