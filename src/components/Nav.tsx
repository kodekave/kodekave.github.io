"use client";

import Link from "next/link";
import { useState } from "react";
import LinkedInMark from "@/components/LinkedInMark";
import { profile } from "@/lib/content";

/** Unchanged routes and labels: the redesign restyles, it does not re-lay
 *  out the information architecture. */
const links = [
  { href: "/work", label: "Ventures" },
  { href: "/research", label: "Research" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Writing" },
];

/**
 * A soft panel floating a little below the top edge: the name on the left, the
 * four pages in the middle, the LinkedIn mark on the right. Beside it, the one
 * yellow button the site asks you to press. The page scrolls under both.
 */
export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="relative mx-auto flex max-w-6xl items-center gap-3">
        <div className="grid h-[52px] flex-1 grid-cols-[1fr_auto] items-center rounded-md border border-hair bg-mist/90 pl-5 pr-2 backdrop-blur-md lg:grid-cols-[1fr_auto_1fr]">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="font-display justify-self-start py-3 text-[1.25rem] leading-none whitespace-nowrap"
          >
            Komal Kedarnath
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 lg:flex"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded px-3.5 py-2.5 text-[0.875rem] text-ink-soft transition-colors hover:bg-paper/80 hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <a
            href={profile.linkedin}
            target="_blank"
            rel="me noopener noreferrer"
            aria-label="LinkedIn (opens in a new tab)"
            className="hidden h-11 w-11 items-center justify-center justify-self-end rounded text-ink-soft transition-colors hover:text-ink lg:flex"
          >
            <LinkedInMark className="h-[17px] w-[17px]" />
          </a>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center justify-self-end lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="nav-menu"
            onClick={() => setOpen(!open)}
          >
            <svg width="20" height="20" viewBox="0 0 22 22" aria-hidden="true">
              <path
                d={open ? "M4 4L18 18" : "M2 7H20"}
                stroke="currentColor"
                strokeWidth="1.25"
              />
              <path
                d={open ? "M18 4L4 18" : "M2 15H20"}
                stroke="currentColor"
                strokeWidth="1.25"
              />
            </svg>
          </button>
        </div>

        {/* `.btn` sets its own display, which beats the `hidden` utility, so
            the wrapper does the hiding. */}
        <div className="hidden lg:block">
          <Link href="/#contact" className="btn btn-solid-paper h-[52px]">
            Start a conversation
          </Link>
        </div>

        {open && (
          <nav
            id="nav-menu"
            aria-label="Primary"
            className="absolute inset-x-0 top-[calc(100%+8px)] overflow-hidden rounded-md border border-hair bg-mist lg:hidden"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-display-text block border-b border-hair px-5 py-4 text-[1.25rem]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/#newsletter"
              onClick={() => setOpen(false)}
              className="block border-b border-hair px-5 py-4 text-ink-soft"
            >
              Newsletter
            </Link>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="me noopener noreferrer"
              className="flex items-center gap-3 border-b border-hair px-5 py-4 text-ink-soft"
            >
              <LinkedInMark className="h-4 w-4" />
              LinkedIn
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <div className="p-3">
              <Link
                href="/#contact"
                onClick={() => setOpen(false)}
                className="btn btn-solid-paper w-full justify-center"
              >
                Start a conversation
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
