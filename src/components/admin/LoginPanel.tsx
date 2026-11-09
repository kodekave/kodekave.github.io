"use client";

import { useState } from "react";
import { REPO, saveVault, verifyToken } from "@/lib/github";
import {
  MIN_PASSWORD,
  VAULT_PATH,
  createVault,
  fetchVault,
  openVault,
} from "@/lib/vault";

const NEW_TOKEN_URL = "https://github.com/settings/personal-access-tokens/new";

/**
 * Sign-in for the publishing console: a username and a password.
 *
 * Behind it sits a GitHub token kept encrypted in the repository (see
 * lib/vault.ts); the password unlocks it in the browser. The first time, or to
 * change the password, "Set up sign-in" takes the token once, seals it under a
 * new username and password, and saves it, so after that nobody handles the
 * token again.
 */
export default function LoginPanel({
  onSubmit,
  error: outerError,
  busy: outerBusy,
}: {
  onSubmit: (token: string, remember: boolean, note?: string) => void;
  error: string;
  busy: boolean;
}) {
  const [mode, setMode] = useState<"signin" | "setup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [token, setToken] = useState("");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const message = (e: unknown) =>
    e instanceof Error ? e.message : "Something went wrong. Try again.";

  async function signIn() {
    setError("");
    setBusy(true);
    try {
      const vault = await fetchVault();
      if (!vault) {
        setError(
          "No sign-in has been set up on this site yet. Use “Set up sign-in” below. If you just did, the site takes about two minutes to update."
        );
        return;
      }
      const found = await openVault(vault, username, password);
      if (!found) {
        setError("That username or password is not right.");
        return;
      }
      onSubmit(found, remember);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }

  async function setUp() {
    setError("");
    if (username.trim().length < 3) {
      setError("Choose a username of at least 3 characters.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(
        `Use a password of at least ${MIN_PASSWORD} characters. A few unrelated words works well.`
      );
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const t = token.trim();
      await verifyToken(t);
      const vault = await createVault(t, username, password);
      await saveVault(t, VAULT_PATH, JSON.stringify(vault, null, 2) + "\n");
      onSubmit(
        t,
        remember,
        "Sign-in saved. It works on other devices once the site has finished updating, in about two minutes."
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }

  const working = busy || outerBusy;
  const shown = error || outerError;
  const isSetup = mode === "setup";

  return (
    <div className="mx-auto grid max-w-5xl gap-x-16 gap-y-12 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-2">
      <div>
        <p className="label text-ink-faint">Publishing console</p>
        <h1 className="font-display mt-5 text-4xl leading-[1.05] sm:text-5xl">
          {isSetup ? "Set up sign-in." : "Sign in to publish."}
        </h1>

        <form
          className="mt-10"
          onSubmit={(e) => {
            e.preventDefault();
            void (isSetup ? setUp() : signIn());
          }}
        >
          {isSetup && (
            <>
              <label htmlFor="token" className="field-label">
                GitHub access token (this once)
              </label>
              <input
                id="token"
                type="password"
                autoComplete="off"
                spellCheck={false}
                className="field mb-6 font-mono text-sm"
                placeholder="github_pat_…"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </>
          )}

          <label htmlFor="username" className="field-label">
            Username
          </label>
          <input
            id="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className="field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label htmlFor="password" className="field-label mt-6">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isSetup ? "new-password" : "current-password"}
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {isSetup && (
            <>
              <label htmlFor="confirm" className="field-label mt-6">
                Password again
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                className="field"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <p className="mt-3 text-sm text-ink-faint">
                At least {MIN_PASSWORD} characters. The sign-in file is public,
                so a long password is what protects it: four or more unrelated
                words is better than a short one with symbols.
              </p>
            </>
          )}

          <label className="mt-6 flex items-start gap-3 text-[0.95rem] text-ink-soft">
            <input
              type="checkbox"
              className="mt-1.5 h-4 w-4 accent-[var(--color-ink)]"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>
              Keep me signed in on this device. Leave this off on a shared
              computer.
            </span>
          </label>

          {shown && (
            <p role="alert" className="mt-6 border border-brass-deep p-4 text-[0.95rem]">
              <span className="stamp adm-live mr-3">Problem</span>
              {shown}
            </p>
          )}

          <button
            type="submit"
            disabled={
              working ||
              !username.trim() ||
              !password ||
              (isSetup && (!token.trim() || !confirm))
            }
            className="btn btn-solid-ink mt-8 disabled:opacity-50"
          >
            {working
              ? isSetup
                ? "Saving…"
                : "Checking…"
              : isSetup
                ? "Save and sign in"
                : "Sign in"}
          </button>
        </form>

        <p className="mt-8 text-[0.95rem] text-ink-soft">
          <button
            type="button"
            className="link-rule"
            onClick={() => {
              setMode(isSetup ? "signin" : "setup");
              setError("");
              setPassword("");
              setConfirm("");
            }}
          >
            {isSetup
              ? "Back to sign in"
              : "First time, or changing your password? Set up sign-in"}
          </button>
        </p>
      </div>

      <aside className="adm-panel p-7 text-ink">
        {isSetup ? (
          <>
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
                Under <strong className="font-medium text-ink">Permissions</strong>,
                set <em>Contents</em> to <em>Read and write</em>. Optionally set{" "}
                <em>Actions</em> to <em>Read-only</em> so the console can show
                when the site has finished updating.
              </li>
              <li>
                Generate the token, paste it on the left, and choose the
                username and password you will use from now on.
              </li>
            </ol>
          </>
        ) : (
          <>
            <p className="label text-ink-faint">How this sign-in works</p>
            <p className="mt-6 text-[0.97rem] leading-relaxed text-ink-soft">
              Your username and password unlock a key that lets this page save
              posts to the site. The unlocking happens in your browser, and
              nothing you type is sent anywhere.
            </p>
          </>
        )}
        <p className="mt-7 border-t border-hair pt-5 text-[0.9rem] leading-relaxed text-ink-faint">
          The token can change this one repository and nothing else, and it is
          stored encrypted. You can revoke it on GitHub at any time, and
          setting up again replaces it.
        </p>
      </aside>
    </div>
  );
}
