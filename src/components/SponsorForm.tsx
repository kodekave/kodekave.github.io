"use client";

import { useState } from "react";
import { profile } from "@/lib/content";

export default function SponsorForm({ onInk = false }: { onInk?: boolean }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = `Sponsorship inquiry from ${form.name}`;
    const body = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      form.company && `Company: ${form.company}`,
      "",
      form.message,
    ]
      .filter(Boolean)
      .join("\n");
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  }

  // Fields are ruled on one edge rather than boxed, so the form reads as
  // lines on a page instead of a stack of inputs.
  const field = `w-full border-b bg-transparent px-0 py-3 outline-none focus:border-current ${
    onInk
      ? "border-hair-inv text-paper placeholder:text-paper-faint"
      : "border-hair text-ink placeholder:text-ink-faint"
  }`;
  const labelCls = `label block ${onInk ? "text-paper-faint" : "text-ink-faint"}`;

  if (submitted) {
    return (
      <div
        className={`border p-8 ${
          onInk ? "border-hair-inv" : "border-hair"
        }`}
      >
        <p className="font-display text-2xl">Thanks — got it.</p>
        <p
          className={`mt-3 leading-relaxed ${
            onInk ? "text-paper-soft" : "text-ink-soft"
          }`}
        >
          This opens your email client with your details filled in — send it
          across and I&rsquo;ll get back to you at {form.email} shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelCls}>
            Name
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={field}
          />
        </div>
      </div>
      <div>
        <label htmlFor="company" className={labelCls}>
          Company (optional)
        </label>
        <input
          id="company"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          className={field}
        />
      </div>
      <div>
        <label htmlFor="message" className={labelCls}>
          What did you have in mind?
        </label>
        <textarea
          id="message"
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={`${field} resize-y`}
        />
      </div>
      <button
        type="submit"
        className={`btn self-start ${onInk ? "btn-paper" : "btn-ink"}`}
      >
        Send inquiry
      </button>
    </form>
  );
}
