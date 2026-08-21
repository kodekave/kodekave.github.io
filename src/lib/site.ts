/**
 * Single source of truth for anything that depends on where the site lives.
 *
 * Everything else in the codebase imports from here, so moving to a custom
 * domain later means changing SITE_URL on the line below and nothing else.
 * (You would also add a `public/CNAME` file containing the bare domain, and
 * point DNS at GitHub Pages — see README.)
 */
export const SITE_URL = "https://kodekave.github.io";

/**
 * Substack publication URL, without a trailing slash.
 *
 * TODO(komal): replace with your real publication, e.g.
 *   "https://kodekave.substack.com"
 * Until this is set, the newsletter form tells the visitor that signup
 * isn't live yet instead of pretending to have subscribed them.
 */
export const SUBSTACK_URL = "";

/** Where the newsletter form sends people, with their email prefilled. */
export function substackSubscribeUrl(email: string): string | null {
  if (!SUBSTACK_URL) return null;
  return `${SUBSTACK_URL}/subscribe?email=${encodeURIComponent(email)}`;
}

/**
 * Google Search Console verification token (the `content` value from the
 * "HTML tag" method, NOT the whole <meta> tag).
 *
 * Chosen over the HTML-file method because it lives in version control and
 * survives a rebuild — a file dropped in public/ is easy to lose in a future
 * cleanup, and losing it silently un-verifies the property.
 *
 * TODO(komal): paste the token, then deploy BEFORE clicking Verify in Search
 * Console — Google fetches the live page at the moment you click.
 */
export const GOOGLE_SITE_VERIFICATION =
  "gzpm78azL7E4dmq05tdiU-EXhGg8i8D-SeeVgTSwioE";

/** Absolute URL for a site-relative path. Keeps trailing slashes consistent. */
export function absoluteUrl(path = "/"): string {
  if (path === "/") return `${SITE_URL}/`;
  const clean = path.replace(/^\/+|\/+$/g, "");
  return `${SITE_URL}/${clean}/`;
}

/**
 * The site's canonical social sharing image. 1200x630 landscape, which is
 * what `summary_large_image` and Open Graph consumers actually want — the
 * portrait headshot gets centre-cropped to a sliver in that slot.
 */
export const OG_IMAGE = {
  url: "/images/og-card.jpg",
  width: 1200,
  height: 630,
  alt: "Komal Kedarnath G — Founder's Office Operator & GTM Strategist",
};
