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
 * Google Search Console verification token (the `content` value from the
 * "HTML tag" method, NOT the whole <meta> tag).
 *
 * Kept in version control rather than as a file in public/, because a stray
 * verification file is easy to remove in a future cleanup and that silently
 * un-verifies the property.
 */
export const GOOGLE_SITE_VERIFICATION =
  "gzpm78azL7E4dmq05tdiU-EXhGg8i8D-SeeVgTSwioE";

/**
 * Substack destination for the newsletter form.
 *
 * Note this is a Substack *profile* (substack.com/@handle), not a publication
 * (handle.substack.com). Profiles have no `/subscribe?email=` endpoint, so the
 * form cannot prefill an address against one — it links out instead, and the
 * visitor subscribes on Substack. If a publication is created later, put its
 * URL here and the prefill path below starts working automatically.
 *
 * Tracking parameters (r=, utm_*) are stripped: they belong on links shared
 * elsewhere, not on a link from the author's own site.
 */
export const SUBSTACK_URL = "https://substack.com/@komalkedarnath";

/** True when SUBSTACK_URL is a publication rather than a reader profile. */
function isPublication(url: string): boolean {
  return /^https?:\/\/[a-z0-9-]+\.substack\.com/i.test(url);
}

/**
 * Where the newsletter form sends people. A publication gets the address
 * prefilled so the visitor only has to confirm; a profile cannot, so it just
 * links out rather than appending a parameter Substack would ignore.
 */
export function substackSubscribeUrl(email: string): string | null {
  if (!SUBSTACK_URL) return null;
  if (!isPublication(SUBSTACK_URL)) return SUBSTACK_URL;
  return `${SUBSTACK_URL}/subscribe?email=${encodeURIComponent(email)}`;
}

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
