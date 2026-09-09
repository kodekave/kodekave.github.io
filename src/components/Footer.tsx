import Link from "next/link";
import { profile } from "@/lib/content";
import NewsletterForm from "./NewsletterForm";
import Reveal from "./Reveal";

/**
 * Footer navigation. Beyond usability this is the crawl path to the guide
 * pages, which are otherwise only reachable from in-body links.
 */
const footerLinks = [
  { href: "/services", label: "Work with me" },
  { href: "/work", label: "Ventures" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Writing" },
  { href: "/bookshelf", label: "Bookshelf" },
  { href: "/founders-office-guide", label: "Founder's office guide" },
  { href: "/cross-border-operations", label: "Cross-border ops" },
  { href: "/sponsor", label: "Sponsor" },
];

const elsewhere = [
  { href: profile.linkedin, label: "LinkedIn", me: true },
  { href: "https://github.com/kodekave", label: "GitHub", me: true },
  { href: `mailto:${profile.email}`, label: "Email", me: false },
  { href: "/feed.xml", label: "RSS", me: false },
];

/**
 * The newsletter closes every page, so it gets the last ink field on the
 * site rather than being tucked into the small print below it.
 */
export default function Footer() {
  return (
    <footer className="on-ink grain overflow-hidden">
      <div id="newsletter" className="scroll-mt-20">
        <div className="relative mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
          {/* Cropped wordmark, bleeding off the bottom edge. */}
          <span
            aria-hidden="true"
            className="ghost absolute -bottom-[0.24em] -left-2 text-[22vw] text-paper/[0.05] md:text-[15vw]"
          >
            Kodekave
          </span>

          <Reveal className="relative">
            <div className="grid gap-x-12 gap-y-8 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="label text-paper-faint">The newsletter</p>
                <h2 className="font-display mt-4 text-3xl sm:text-4xl">
                  Get the next issue.
                </h2>
                <p className="mt-4 max-w-md text-paper-soft">
                  Notes on founder&rsquo;s-office operations, GTM strategy, and
                  building across borders — sent when there&rsquo;s something
                  worth saying, not on a schedule.
                </p>
              </div>
              <NewsletterForm onInk />
            </div>
          </Reveal>
        </div>

        <div className="relative border-t border-hair-inv">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 md:flex-row md:items-start md:justify-between md:px-10">
            <div className="flex flex-col gap-3">
              <Link href="/" className="wordmark text-sm leading-none" style={{ fontVariationSettings: '"opsz" 24' }}>
                Komal Kedarnath
              </Link>
              <p className="label text-paper-faint">
                © {new Date().getFullYear()} {profile.name}
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <nav aria-label="Footer" className="flex flex-col gap-2.5">
                {footerLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="label link-rule self-start text-paper-soft hover:text-paper"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <nav aria-label="Elsewhere" className="flex flex-col gap-2.5">
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
                    className="label link-rule self-start text-paper-soft hover:text-paper"
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
