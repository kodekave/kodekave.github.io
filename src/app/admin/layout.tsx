import type { Metadata } from "next";
import "./admin.css";

/**
 * The publishing console sits outside the public site: no navigation, no
 * footer, and kept out of search results. It is also left out of the sitemap
 * and links from nowhere.
 */
export const metadata: Metadata = {
  title: { absolute: "Publishing console" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="on-paper min-h-screen">{children}</div>;
}
