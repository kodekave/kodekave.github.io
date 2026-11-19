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
 * One field and one yellow button on a single row; the reassurance line sits
 * under them in the same quiet sans as the rest of the page.
 */
export default function NewsletterForm({
  compact = false,
  onInk = false,
}: {
  compact?: boolean;
  /** Set on a dark panel, where the field and the line invert. */
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
    <div className={compact ? "" : "w-full"}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch"
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
          className={`min-w-0 flex-1 rounded-md border px-4 py-3 text-[0.9375rem] outline-none transition-colors focus:border-ink ${
            onInk
              ? "border-hair-inv bg-transparent text-on-panel placeholder:text-paper-faint"
              : "border-hair bg-field text-ink placeholder:text-ink-faint"
          }`}
        />
        <button type="submit" className="btn btn-solid-paper justify-center">
          Subscribe
        </button>
      </form>

      <p
        aria-live="polite"
        className={`mt-3 text-[0.8125rem] leading-relaxed ${
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
