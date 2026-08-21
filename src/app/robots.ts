import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * robots.txt
 *
 * Everything is allowed, including the AI crawlers, because the goal here is
 * citation: being quoted by ChatGPT, Perplexity or Google's AI surfaces is
 * distribution for a personal brand, not leakage. Blocking GPTBot and friends
 * would remove the site from exactly the answers it should appear in.
 *
 * To opt out later, add per-agent rules here — but note that blocking a
 * training crawler (GPTBot, ClaudeBot, Google-Extended) and blocking a
 * retrieval crawler (OAI-SearchBot, PerplexityBot) have different effects:
 * the second one removes you from live answers, the first does not.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
