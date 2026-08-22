"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/services", label: "Work with me" },
  { href: "/work", label: "Ventures" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Writing" },
  { href: "/sponsor", label: "Sponsor" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-display text-lg font-medium tracking-tight text-ink"
          onClick={() => setOpen(false)}
        >
          Komal Kedarnath
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-sm text-ink-soft transition-colors after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-accent-deep after:transition-all after:duration-300 hover:text-accent-deep hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#newsletter"
            className="rounded-full bg-ink px-4 py-2 text-sm text-cream transition hover:-translate-y-0.5 hover:bg-accent-deep hover:shadow-sm"
          >
            Newsletter
          </Link>
        </nav>

        <button
          className="-mr-2.5 flex h-11 w-11 items-center justify-center md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 7H20M4 12H20M4 17H20"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-line px-6 py-4 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-2 py-2 text-ink-soft hover:bg-accent-soft"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#newsletter"
            className="mt-2 rounded-full bg-ink px-4 py-2 text-center text-cream"
            onClick={() => setOpen(false)}
          >
            Newsletter
          </Link>
        </nav>
      )}
    </header>
  );
}
