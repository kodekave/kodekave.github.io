"use client";

import { useState } from "react";
import { profile } from "@/lib/content";

export default function NewsletterForm({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = "Newsletter signup";
    const body = `Please add ${email} to the newsletter list.`;
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  }

  return (
    <div className={compact ? "" : "sm:max-w-md"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-full border border-line bg-paper px-5 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-accent px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-accent-deep"
        >
          Subscribe
        </button>
      </form>
      {submitted && (
        <p className="mt-3 text-sm text-accent-deep">
          This opens your email client to notify me directly — a proper
          signup form is coming soon.
        </p>
      )}
    </div>
  );
}
