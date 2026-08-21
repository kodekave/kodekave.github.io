"use client";

import { useId, useState } from "react";
import { SUBSTACK_URL, substackSubscribeUrl } from "@/lib/site";

/**
 * Newsletter signup.
 *
 * Substack rejects cross-origin form POSTs, so a static site cannot subscribe
 * someone inline without embedding Substack's iframe. Instead this keeps the
 * site's own form styling and hands off to the Substack subscribe page with
 * the address prefilled, where the visitor confirms in one click.
 *
 * Previously this opened a `mailto:` asking the visitor to email a request to
 * be added, then reported success whether or not anything was sent.
 */
export default function NewsletterForm({
  compact = false,
}: {
  compact?: boolean;
}) {
  // This component renders more than once per page (footer plus post CTA),
  // so the input id has to be unique or the labels point at the wrong field.
  const fieldId = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sent" | "unconfigured">("idle");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const target = substackSubscribeUrl(email);
    if (!target) {
      setState("unconfigured");
      return;
    }
    setState("sent");
    window.location.href = target;
  }

  return (
    <div className={compact ? "" : "sm:max-w-md"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={fieldId} className="sr-only">
          Email address
        </label>
        <input
          id={fieldId}
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-full border border-line bg-paper px-5 py-3 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-accent px-6 py-3 text-sm font-medium text-cream transition hover:-translate-y-0.5 hover:bg-accent-deep hover:shadow-sm"
        >
          Subscribe
        </button>
      </form>

      <p aria-live="polite" className="mt-3 text-sm text-ink-faint">
        {state === "sent" && (
          <span className="text-accent-deep">
            Taking you to Substack to confirm&hellip;
          </span>
        )}
        {state === "unconfigured" && (
          <span className="text-accent-deep">
            Signup isn&rsquo;t live yet — the newsletter launches shortly.
          </span>
        )}
        {state === "idle" &&
          (SUBSTACK_URL
            ? "One click to confirm on Substack. No spam, unsubscribe anytime."
            : "Launching shortly.")}
      </p>
    </div>
  );
}
