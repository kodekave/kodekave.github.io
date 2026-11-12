"use client";

import Link from "next/link";
import { useState } from "react";
import LinkedInMark from "@/components/LinkedInMark";
import { profile } from "@/lib/content";

/** Unchanged routes and labels — the redesign restyles, it doesn't re-lay
 *  out the information architecture. */
const links = [
  { href: "/work", label: "Ventures" },
  { href: "/research", label: "Research" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Writing" },
];

/**
 * Every page opens on an ink field — the homepage's first act and each
 * sub-page's masthead — so the bar can be one fixed surface rather than
 * something that has to sense and match whatever sits beneath it.
 */
export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-hair-inv bg-ink text-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4 md:px-10">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="wordmark flex items-center gap-2 text-base leading-none tracking-[0.04em] whitespace-nowrap"
        >
          Komal Kedarnath
          {/* The prompt's cursor: a lamp left on beside the name. */}
          <span aria-hidden="true" className="cursor-lamp" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="label link-rule text-paper-soft hover:text-paper"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={profile.linkedin}
            target="_blank"
            rel="me noopener noreferrer"
            aria-label="LinkedIn (opens in a new tab)"
            className="nav-in -mr-2 flex h-9 w-9 items-center justify-center text-paper-soft hover:text-brass"
          >
            <LinkedInMark className="h-[18px] w-[18px]" />
          </a>
          {/* The one filled control in the bar: the action the site exists
              to produce. The newsletter lives in the footer and the menu. */}
          <Link href="/#contact" className="btn btn-solid-paper -my-1">
            Get in touch
          </Link>
        </nav>

        <button
          type="button"
          className="-mr-2.5 flex h-11 w-11 items-center justify-center lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="nav-menu"
          onClick={() => setOpen(!open)}
        >
          {/* Two rules, closing to an X — the bar's own hairline vocabulary. */}
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <path
              d={open ? "M4 4L18 18" : "M2 7H20"}
              stroke="currentColor"
              strokeWidth="1"
            />
            <path
              d={open ? "M18 4L4 18" : "M2 15H20"}
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        </button>
      </div>

      {open && (
        <nav
          id="nav-menu"
          aria-label="Primary"
          className="border-t border-hair-inv lg:hidden"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="label block border-b border-hair-inv px-6 py-4 text-paper-soft"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#newsletter"
            onClick={() => setOpen(false)}
            className="label block border-b border-hair-inv px-6 py-4 text-paper-soft"
          >
            Newsletter
          </Link>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="me noopener noreferrer"
            className="label flex items-center gap-3 px-6 py-4 text-brass"
          >
            <LinkedInMark className="h-4 w-4" />
            LinkedIn
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </nav>
      )}
    </header>
  );
}
