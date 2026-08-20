"use client";

import { useState } from "react";
import { profile } from "@/lib/content";

export default function SponsorForm() {
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

  if (submitted) {
    return (
      <div className="rounded-2xl border border-line bg-cream p-8 text-center">
        <p className="font-display text-xl text-ink">Thanks — got it.</p>
        <p className="mt-2 text-ink-soft">
          This opens your email client with your details filled in — send it
          across and I&rsquo;ll get back to you at {form.email} shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm text-ink-soft">
            Name
          </label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="email" className="text-sm text-ink-soft">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label htmlFor="company" className="text-sm text-ink-soft">
          Company (optional)
        </label>
        <input
          id="company"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          className="mt-1 w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="message" className="text-sm text-ink-soft">
          What did you have in mind?
        </label>
        <textarea
          id="message"
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="mt-1 w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-cream transition-colors hover:bg-accent-deep"
      >
        Send inquiry
      </button>
    </form>
  );
}
