import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  /**
   * Emit `out/about/index.html` rather than `out/about.html`.
   *
   * Without this, GitHub Pages serves both `/about` and `/about.html` with a
   * 200 and identical content — two crawlable URLs per page — while `/about/`
   * returns a 404, so any inbound link written with a trailing slash breaks.
   * GitHub Pages offers no redirect configuration, so this is the only place
   * that duplication can be fixed.
   *
   * Canonical URLs and the sitemap use the trailing-slash form to match.
   */
  trailingSlash: true,
};

export default nextConfig;
