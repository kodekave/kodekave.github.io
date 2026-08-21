import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/posts";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

/**
 * Sitemap.
 *
 * URLs use the trailing-slash form to match `trailingSlash: true` and the
 * canonical tags — a sitemap that lists a different URL shape than the
 * canonical is a contradictory signal.
 *
 * `changeFrequency` and `priority` are deliberately omitted: Google ignores
 * both, and stating them invites the temptation to fake them. `lastModified`
 * is set only where a real date exists, rather than stamping build time on
 * every page, which would claim the whole site changed on each deploy.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    "/",
    "/services",
    "/work",
    "/about",
    "/blog",
    "/founders-office-guide",
    "/cross-border-operations",
    "/fractional-coo-vs-founders-office",
    "/sponsor",
  ].map((path) => ({ url: absoluteUrl(path) }));

  const postRoutes: MetadataRoute.Sitemap = getPublishedPosts().map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.updated_at,
  }));

  return [...staticRoutes, ...postRoutes];
}
