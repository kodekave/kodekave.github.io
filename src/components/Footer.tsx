import Link from "next/link";
import { profile } from "@/lib/content";
import NewsletterForm from "./NewsletterForm";
import Reveal from "./Reveal";

/**
 * Footer navigation. Beyond usability this is the crawl path to the guide
 * pages, which are otherwise only reachable from in-body links.
 */
const footerLinks = [
  { href: "/services", label: "Services" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Writing" },
  { href: "/founders-office-guide", label: "Founder's office guide" },
  { href: "/cross-border-operations", label: "Cross-border ops" },
  { href: "/sponsor", label: "Sponsor" },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div
        id="newsletter"
        className="mx-auto max-w-5xl px-6 py-16 scroll-mt-24"
      >
        <Reveal>
          <div className="grid gap-10 md:grid-cols-2 md:items-start">
            <div>
              <h2 className="font-display text-2xl text-ink">
                Get the next issue.
              </h2>
              <p className="mt-2 max-w-sm text-ink-soft">
                Notes on founder&rsquo;s-office operations, GTM strategy, and
                building across borders — sent when there&rsquo;s something
                worth saying, not on a schedule.
              </p>
            </div>
            <div>
              <NewsletterForm />
            </div>
          </div>
        </Reveal>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-line pt-8 text-sm text-ink-faint sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {profile.name}
          </p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-accent-deep"
              >
                {link.label}
              </Link>
            ))}
            {/*
              rel="me" marks these as profiles belonging to the same person as
              the site, which is the HTML-level counterpart to schema sameAs.
            */}
            <a
              href={profile.linkedin}
              target="_blank"
              rel="me noopener noreferrer"
              className="transition-colors hover:text-accent-deep"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com/kodekave"
              target="_blank"
              rel="me noopener noreferrer"
              className="transition-colors hover:text-accent-deep"
            >
              GitHub
            </a>
            <a
              href={`mailto:${profile.email}`}
              className="transition-colors hover:text-accent-deep"
            >
              Email
            </a>
            <a
              href="/feed.xml"
              className="transition-colors hover:text-accent-deep"
            >
              RSS
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
