import Link from "next/link";
import { profile } from "@/lib/content";
import NewsletterForm from "./NewsletterForm";
import Reveal from "./Reveal";

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
              <h3 className="font-display text-2xl text-ink">
                Get the next issue.
              </h3>
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
          <div className="flex gap-6">
            <Link href="/work" className="transition-colors hover:text-accent-deep">
              Work
            </Link>
            <Link href="/blog" className="transition-colors hover:text-accent-deep">
              Writing
            </Link>
            <Link href="/sponsor" className="transition-colors hover:text-accent-deep">
              Sponsor
            </Link>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-accent-deep"
            >
              LinkedIn
            </a>
            <a
              href={`mailto:${profile.email}`}
              className="transition-colors hover:text-accent-deep"
            >
              Email
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
