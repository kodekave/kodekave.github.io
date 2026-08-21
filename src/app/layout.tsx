import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { profile } from "@/lib/content";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = "https://kodekave.github.io";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${profile.name} — ${profile.tagline}`,
    template: `%s — ${profile.name}`,
  },
  description:
    "Komal Kedarnath is a founder's-office operator and GTM strategist who has scaled four ventures across four countries — India, the Maldives, the US, and the UK — from early-stage idea to operating revenue.",
  keywords: [
    "founder's office operator",
    "GTM strategist",
    "startup operations consultant",
    "cross-border operations",
    "business development leader",
    "founder's office",
    "startup scaling",
  ],
  authors: [{ name: profile.name, url: siteUrl }],
  creator: profile.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: profile.name,
    title: `${profile.name} — ${profile.tagline}`,
    description: profile.subTagline,
    images: [{ url: "/images/hero.jpg", width: 832, height: 1248 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} — ${profile.tagline}`,
    description: profile.subTagline,
    images: ["/images/hero.jpg"],
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: profile.role,
  url: siteUrl,
  image: `${siteUrl}/images/hero.jpg`,
  email: profile.email,
  sameAs: [profile.linkedin],
  knowsAbout: [
    "Founder's Office Operations",
    "Go-to-Market Strategy",
    "Cross-Border Business Operations",
    "Startup Scaling",
    "Business Development",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
