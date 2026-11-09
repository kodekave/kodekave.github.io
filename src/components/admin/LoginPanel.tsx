"use client";

import { useState } from "react";
import { REPO } from "@/lib/github";

const NEW_TOKEN_URL = "https://github.com/settings/personal-access-tokens/new";

/**
 * Sign-in for the publishing console. The "login" is a GitHub fine-grained
 * access token limited to this one repository: the site has no server, so
 * GitHub is the thing that decides who may publish. The token stays in this
 * browser and is sent only to GitHub.
 */
export default function LoginPanel({
  onSubmit,
  error,
  busy,
}: {
  onSubmit: (token: string, remember: boolean) => void;
  error: string;
  busy: boolean;
}) {
  const [token, setToken] = useState("");
  const [remember, setRemember] = useState(false);

  return (
    <div className="mx-auto grid max-w-5xl gap-x-16 gap-y-12 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-2">
      <div>
        <p className="label text-ink-faint">Publishing console</p>
        <h1 className="font-display mt-5 text-4xl leading-[1.05] sm:text-5xl">
          Sign in to publish.
        </h1>
        <form
          className="mt-10"
          onSubmit={(e) => {
            e.preventDefault();
            if (token.trim()) onSubmit(token.trim(), remember);
          }}
        >
          <label htmlFor="token" className="field-label">
            GitHub access token
          </label>
          <input
            id="token"
            type="password"
            autoComplete="off"
            spellCheck={false}
            className="field font-mono text-sm"
            placeholder="github_pat_…"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />

          <label className="mt-5 flex items-start gap-3 text-[0.95rem] text-ink-soft">
            <input
              type="checkbox"
              className="mt-1.5 h-4 w-4 accent-[var(--color-ink)]"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>
              Remember me on this device. Leave this off on a shared computer;
              the token is then forgotten when the tab closes.
            </span>
          </label>

          {error && (
            <p role="alert" className="mt-6 border border-brass-deep p-4 text-[0.95rem]">
              <span className="stamp adm-live mr-3">Problem</span>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !token.trim()}
            className="btn btn-solid-ink mt-8 disabled:opacity-50"
          >
            {busy ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>

      <aside className="adm-panel p-7 text-ink">
        <p className="label text-ink-faint">One-time setup, two minutes</p>
        <ol className="mt-6 space-y-4 text-[0.97rem] leading-relaxed text-ink-soft">
          <li>
            <a
              href={NEW_TOKEN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="link-rule text-ink"
            >
              Open GitHub&rsquo;s new-token page
            </a>{" "}
            and name it &ldquo;Site publishing&rdquo;.
          </li>
          <li>
            Under <strong className="font-medium text-ink">Repository access</strong>,
            choose <em>Only select repositories</em> and pick{" "}
            <span className="font-mono text-[0.85rem] text-ink">
              {REPO.owner}/{REPO.name}
            </span>
            .
          </li>
          <li>
            Under <strong className="font-medium text-ink">Permissions</strong>, set{" "}
            <em>Contents</em> to <em>Read and write</em>. Optionally set{" "}
            <em>Actions</em> to <em>Read-only</em> so the console can show when
            the site has finished updating.
          </li>
          <li>Generate the token, copy it and paste it here.</li>
        </ol>
        <p className="mt-7 border-t border-hair pt-5 text-[0.9rem] leading-relaxed text-ink-faint">
          The token can change this one repository and nothing else. It is kept
          in this browser only and is sent to GitHub alone. Set it to expire in
          90 days and make a new one then.
        </p>
      </aside>
    </div>
  );
}
