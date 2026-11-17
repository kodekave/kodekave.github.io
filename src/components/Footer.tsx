import Link from "next/link";
import { profile } from "@/lib/content";
import NewsletterForm from "./NewsletterForm";

/**
 * Footer navigation. Beyond usability this is the crawl path to the guide
 * pages, which are otherwise only reachable from in-body links.
 */
const footerLinks = [
  { href: "/services", label: "Work with me" },
  { href: "/work", label: "Ventures" },
  { href: "/research", label: "Research" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Writing" },
  { href: "/bookshelf", label: "Bookshelf" },
  { href: "/founders-office-guide", label: "Founder's office guide" },
  { href: "/cross-border-operations", label: "Cross-border ops" },
];

const elsewhere = [
  { href: profile.linkedin, label: "LinkedIn", me: true },
  { href: "https://github.com/kodekave", label: "GitHub", me: true },
  { href: "https://orcid.org/0000-0003-4980-5945", label: "ORCID", me: true },
  { href: `mailto:${profile.email}`, label: "Email", me: false },
  { href: "/feed.xml", label: "RSS", me: false },
];

/**
 * The newsletter closes every page: one centred line, one field, one yellow
 * button. Under it, the name, the pages, and the places she can be found.
 */
export default function Footer() {
  return (
    <footer className="border-t border-hair">
      <div id="newsletter" className="scroll-mt-20">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center md:py-24">
          <p className="label label-dot justify-center text-ink-faint">
            The newsletter
          </p>
          <h2 className="font-display mt-6 text-[clamp(2.1rem,4.6vw,3.2rem)] leading-[1.05]">
            Get the next issue.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-ink-soft">
            Notes on founder&rsquo;s-office operations, GTM strategy, and
            building across borders &mdash; sent when there&rsquo;s something
            worth saying, not on a schedule.
          </p>
          <div className="mx-auto mt-9 max-w-md">
            <NewsletterForm />
          </div>
        </div>

        <div className="border-t border-hair">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10 md:flex-row md:items-start md:justify-between md:px-10">
            <div className="flex flex-col gap-3">
              <Link href="/" className="font-display py-3 text-[1.25rem] leading-none">
                Komal Kedarnath
              </Link>
              <p className="label text-ink-faint">
                © {new Date().getFullYear()} {profile.name}
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 sm:gap-14">
              <nav aria-label="Footer" className="flex flex-col">
                {footerLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="link-rule hit hit-x self-start py-[0.7rem] text-[0.9375rem] text-ink-soft hover:text-ink"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <nav aria-label="Elsewhere" className="flex flex-col">
                {elsewhere.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    {...(link.href.startsWith("http")
                      ? {
                          target: "_blank",
                          /*
                            rel="me" marks these as profiles belonging to the
                            same person as the site, which is the HTML-level
                            counterpart to schema sameAs.
                          */
                          rel: link.me
                            ? "me noopener noreferrer"
                            : "noopener noreferrer",
                        }
                      : {})}
                    className="link-rule hit hit-x self-start py-[0.7rem] text-[0.9375rem] text-ink-soft hover:text-ink"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
