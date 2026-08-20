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
- **Newsletter / Sponsor forms** don't have a backend yet — submitting
  either one opens the visitor's email client with the details pre-filled
  (via a `mailto:` link), addressed to the email in `profile.email` in
  `content.ts`. See "Wiring up real forms" below for hooking up an actual
  newsletter provider or form service later.
- There is **no admin panel and no database** — this is a static export
  (`output: 'export'` in `next.config.ts`). Editing content means editing
  files and pushing.

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

The `<Portrait>` component expects an image at `public/images/hero.jpg`,
used on both the homepage hero and the About page. Drop a file at that path
and it's picked up automatically; until then a placeholder with your
initials is shown. Crop framing and the navy/khaki color-blend tint are
controlled by the `objectPosition` and `tinted` props where `<Portrait>` is
used.

## Wiring up real forms later

Right now the newsletter and sponsor forms just open a `mailto:` link —
no emails are stored anywhere. When you're ready for the real thing:

- **Newsletter**: sign up for a provider (Buttondown, Kit/ConvertKit,
  Mailchimp) and swap the `handleSubmit` in
  `src/components/NewsletterForm.tsx` for that provider's embed form or API
  call.
- **Sponsor inquiries**: point `src/components/SponsorForm.tsx` at a form
  backend like Formspree, or keep the mailto approach if you're fine with
  inquiries landing directly in your inbox.

Both are static exports with no server, so any integration needs to be a
client-side call to a third-party endpoint (not a route on this site).
