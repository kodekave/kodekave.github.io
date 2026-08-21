import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/posts";

export const dynamic = "force-static";

const siteUrl = "https://kodekave.github.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/about`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${siteUrl}/work`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${siteUrl}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/sponsor`, changeFrequency: "yearly", priority: 0.5 },
  ];

  const postRoutes: MetadataRoute.Sitemap = getPublishedPosts().map(
    (post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: post.published_at,
      changeFrequency: "monthly",
      priority: 0.6,
    })
  );

  return [...staticRoutes, ...postRoutes];
}
