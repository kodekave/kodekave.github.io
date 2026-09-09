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
  onInk = false,
}: {
  compact?: boolean;
  /** Set on the ink fields, where the rules and placeholder invert. */
  onInk?: boolean;
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
    <div className={compact ? "" : "w-full sm:max-w-sm"}>
      {/*
        A single ruled row rather than a field plus a filled pill: the input
        and the control share one hairline box, so the whole thing reads as a
        form line on a printed page.
      */}
      <form
        onSubmit={handleSubmit}
        className={`flex items-stretch border ${
          onInk ? "border-hair-inv" : "border-ink"
        }`}
      >
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
          className={`label min-w-0 flex-1 bg-transparent px-4 py-3.5 tracking-[0.08em] outline-none ${
            onInk
              ? "text-paper placeholder:text-paper-faint"
              : "text-ink placeholder:text-ink-faint"
          }`}
        />
        <button
          type="submit"
          className={`label shrink-0 border-l px-5 transition-colors ${
            onInk
              ? "border-hair-inv hover:bg-paper hover:text-ink"
              : "border-ink hover:bg-ink hover:text-paper"
          }`}
        >
          Subscribe
        </button>
      </form>

      <p
        aria-live="polite"
        className={`label mt-3 leading-relaxed tracking-[0.08em] ${
          onInk ? "text-paper-faint" : "text-ink-faint"
        }`}
      >
        {state === "sent" && "Taking you to Substack to confirm…"}
        {state === "unconfigured" &&
          "Signup isn’t live yet — the newsletter launches shortly."}
        {state === "idle" &&
          (SUBSTACK_URL
            ? "One click to confirm on Substack. No spam, unsubscribe anytime."
            : "Launching shortly.")}
      </p>
    </div>
  );
}
