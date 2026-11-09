"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  GitHubError,
  deployFor,
  getPost,
  listPosts,
  savePost,
  uploadImage,
  verifyToken,
  type Deploy,
  type PostSummary,
} from "@/lib/github";
import {
  emptyDraft,
  parsePostFile,
  serializePost,
  validateDraft,
  type PostDraft,
} from "@/lib/post-file";
import { SITE_URL } from "@/lib/site";
import LoginPanel from "./LoginPanel";
import PostEditor from "./PostEditor";

const TOKEN_KEY = "kk-admin-token";
const DRAFT_KEY = "kk-admin-draft-v1";

type Session = { token: string; remember: boolean };
/** An existing post being edited: its file's current `sha` is what GitHub needs to accept an update. */
type Editing = { slug: string; sha: string; startedLive: boolean };
type Saved = { slug: string; published: boolean; commitUrl: string; commit: string };

/* The browser may refuse storage (private windows, blocked cookies), and the
   console must still work without it, so every access is guarded. */
function readSession(): Session | null {
  try {
    const kept = localStorage.getItem(TOKEN_KEY);
    if (kept) return { token: kept, remember: true };
    const once = sessionStorage.getItem(TOKEN_KEY);
    if (once) return { token: once, remember: false };
  } catch {
    /* storage unavailable */
  }
  return null;
}
function storeSession(s: Session) {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    (s.remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, s.token);
  } catch {
    /* storage unavailable */
  }
}
function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}
function readDraft(): PostDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? ({ ...emptyDraft(), ...JSON.parse(raw) } as PostDraft) : null;
  } catch {
    return null;
  }
}
function writeDraft(d: PostDraft | null) {
  try {
    if (d) localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    else localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage unavailable */
  }
}

const message = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong. Try again.";

const DEPLOY_TEXT: Record<Deploy["state"], string> = {
  queued: "Waiting for GitHub to start building the site…",
  building: "Building the site…",
  live: "The site is updated.",
  failed: "The site build failed, so nothing changed on the live site.",
  unknown:
    "Saved. The site updates in a minute or two (this token cannot read build status).",
};

/**
 * The publishing console.
 *
 * Two ways to put a post on the site, one destination. Write in the editor, or
 * upload a markdown file: either way the result is a draft in the same form,
 * checked against the build's rules, then committed to the repository, which
 * deploys it. Existing posts open in the same form for editing.
 */
export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(readSession);
  const [user, setUser] = useState<string | null>(null);
  const [checking, setChecking] = useState(() => readSession() !== null);
  const [loginError, setLoginError] = useState("");

  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [listError, setListError] = useState("");

  const [restored] = useState(readDraft);
  const [draft, setDraft] = useState<PostDraft>(restored ?? emptyDraft());
  const [editing, setEditing] = useState<Editing | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [intake, setIntake] = useState<"write" | "upload">("write");
  const [banner, setBanner] = useState(
    restored ? "Restored your unsaved draft from this device." : ""
  );
  const [dirty, setDirty] = useState(restored !== null);
  const [showIssues, setShowIssues] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Saved | null>(null);
  const [deploy, setDeploy] = useState<Deploy>({ state: "queued" });
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [wide] = useState(() => window.innerWidth >= 1024);

  /** On a phone the editor sits below the list, so bring it into view. */
  const showEditor = () => {
    if (window.innerWidth < 1024) {
      requestAnimationFrame(() =>
        document.getElementById("editor")?.scrollIntoView({ block: "start" })
      );
    }
  };

  const isNew = editing === null;
  const issues = validateDraft(draft, {
    isNew,
    existingSlugs: (posts ?? []).map((p) => p.slug),
  });

  /* -------------------------------------------------------------- effects */

  // Check the token on arrival (a remembered one) and after sign-in.
  useEffect(() => {
    if (!session || user) return;
    let live = true;
    verifyToken(session.token)
      .then((r) => {
        if (!live) return;
        storeSession(session);
        setUser(r.login);
        setChecking(false);
      })
      .catch((e) => {
        if (!live) return;
        clearSession();
        setSession(null);
        setLoginError(message(e));
        setChecking(false);
      });
    return () => {
      live = false;
    };
  }, [session, user]);

  const token = session?.token ?? "";
  const refreshPosts = (t: string) =>
    listPosts(t)
      .then((p) => {
        setPosts(p);
        setListError("");
      })
      .catch((e) => setListError(message(e)));

  useEffect(() => {
    if (user && token) void refreshPosts(token);
  }, [user, token]);

  // Keep an unsent new post on this device, so a closed tab loses nothing.
  useEffect(() => {
    if (editing || !dirty) return;
    const t = setTimeout(() => writeDraft(draft), 400);
    return () => clearTimeout(t);
  }, [draft, editing, dirty]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // After a save, follow the site build until it finishes.
  const commit = saved?.commit ?? "";
  useEffect(() => {
    if (!token || !commit) return;
    let live = true;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      const d = await deployFor(token, commit);
      if (!live) return;
      setDeploy(d);
      tries += 1;
      if (d.state === "queued" || d.state === "building") {
        if (tries < 90) timer = setTimeout(tick, 6000);
      }
    };
    timer = setTimeout(tick, 4000);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [token, commit]);

  /* -------------------------------------------------------------- actions */

  function signIn(t: string, remember: boolean, note?: string) {
    setLoginError("");
    setChecking(true);
    setSession({ token: t, remember });
    if (note) setBanner(note);
  }

  function signOut() {
    if (dirty && !window.confirm("You have unsaved changes. Sign out anyway?")) return;
    clearSession();
    setSession(null);
    setUser(null);
    setPosts(null);
  }

  function change(patch: Partial<PostDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
    setError("");
  }

  const confirmDiscard = () =>
    !dirty || window.confirm("Discard the changes you have not saved?");

  function startNew() {
    if (!confirmDiscard()) return;
    writeDraft(null);
    setDraft(emptyDraft());
    setEditing(null);
    setEditorKey((k) => k + 1);
    setIntake("write");
    setBanner("");
    setDirty(false);
    setSaved(null);
    setError("");
    setShowIssues(false);
  }

  async function openPost(slug: string) {
    if (!confirmDiscard()) return;
    setError("");
    try {
      const file = await getPost(token, slug);
      const { draft: d, problems } = parsePostFile(file.raw, `${slug}.md`);
      d.slug = slug;
      setDraft(d);
      setEditing({ slug, sha: file.sha, startedLive: d.published });
      setEditorKey((k) => k + 1);
      setIntake("write");
      setBanner(problems.join(" "));
      setDirty(false);
      setSaved(null);
      setShowIssues(false);
      showEditor();
    } catch (e) {
      setError(message(e));
    }
  }

  async function importFile(file: File | undefined) {
    if (!file) return;
    setError("");
    if (file.size > 1_000_000) {
      setError("That file is over 1 MB, which is too large for a post.");
      return;
    }
    if (!confirmDiscard()) return;
    const raw = await file.text();
    const { draft: d, problems } = parsePostFile(raw, file.name);

    // A file whose address matches a post already on the site replaces that
    // post, so a revised export can be uploaded over the old one.
    const existing = posts?.find((p) => p.slug === d.slug);
    let nextEditing: Editing | null = null;
    let note = problems.join(" ");
    if (existing) {
      try {
        const current = await getPost(token, existing.slug);
        nextEditing = { slug: existing.slug, sha: current.sha, startedLive: existing.published };
        note = `This replaces the existing post "${existing.title}". ${note}`.trim();
      } catch (e) {
        setError(message(e));
        return;
      }
    }

    setDraft(d);
    setEditing(nextEditing);
    setEditorKey((k) => k + 1);
    setIntake("write");
    setBanner(
      `Imported from ${file.name}. Check the details, then publish. ${note}`.trim()
    );
    setDirty(true);
    setSaved(null);
    setShowIssues(true);
  }

  async function save(publish: boolean) {
    setShowIssues(true);
    const next: PostDraft = { ...draft, published: publish };
    const found = validateDraft(next, {
      isNew,
      existingSlugs: (posts ?? []).map((p) => p.slug),
    });
    if (found.some((i) => i.level === "error")) {
      setError("Fix the items marked below, then try again.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const text = serializePost(next, !isNew);
      const verb = isNew ? "Add" : "Update";
      const res = await savePost(
        token,
        next.slug,
        text,
        `${verb} post: ${next.title.trim()}${publish ? "" : " (draft)"}`,
        editing?.sha
      );
      setDraft(next);
      setEditing({ slug: next.slug, sha: res.fileSha, startedLive: publish });
      setDirty(false);
      writeDraft(null);
      setSaved({ slug: next.slug, published: publish, commitUrl: res.url, commit: res.sha });
      setDeploy({ state: "queued" });
      void refreshPosts(token);
    } catch (e) {
      setError(
        e instanceof GitHubError && e.status === 422 && isNew
          ? "GitHub already has a post at this address. Open it from the list, or choose another address."
          : message(e)
      );
    } finally {
      setBusy(false);
    }
  }

  async function addImage(file: File): Promise<string | null> {
    setError("");
    if (file.size > 5_000_000) {
      setError("That image is over 5 MB. Resize it first so the site stays quick.");
      return null;
    }
    try {
      return await uploadImage(token, file, draft.slug);
    } catch (e) {
      setError(message(e));
      return null;
    }
  }

  /* ----------------------------------------------------------------- views */

  if (checking) {
    return (
      <p className="label mx-auto max-w-5xl px-6 py-24 text-ink-faint">
        Signing you in…
      </p>
    );
  }
  if (!session || !user) {
    return <LoginPanel onSubmit={signIn} error={loginError} busy={checking} />;
  }

  const liveUrl = saved?.published ? `${SITE_URL}/blog/${saved.slug}/` : "";

  return (
    <div>
      <header className="on-ink border-b border-hair-inv">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-4 md:px-10">
          <p className="label flex items-center gap-3 text-paper">
            <span aria-hidden="true" className="adm-lamp" />
            Publishing console
          </p>
          <nav aria-label="Console" className="label flex flex-wrap items-center gap-x-6 gap-y-2 text-paper-soft">
            <span>Signed in as {user}</span>
            <Link href="/blog/" className="link-rule hover:text-paper">
              View the blog
            </Link>
            <button type="button" onClick={signOut} className="link-rule hover:text-paper">
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-x-14 gap-y-12 px-6 py-10 md:px-10 lg:grid-cols-[17rem_1fr]">
        {/* The posts */}
        <aside aria-label="Posts">
          <button type="button" onClick={startNew} className="btn btn-solid-ink w-full justify-center">
            New post
          </button>
          {/* Open beside the editor on a wide screen; folded away on a phone,
              where it would otherwise push the editor off the first screen. */}
          <details className="mt-8" open={wide}>
          <summary className="label cursor-pointer text-ink-faint">
            Your posts · {posts?.length ?? "…"}
          </summary>
          {listError && (
            <p role="alert" className="mt-3 text-sm">
              {listError}
            </p>
          )}
          {posts === null && !listError && (
            <p className="label mt-4 text-ink-faint">Loading…</p>
          )}
          <ul className="mt-3 border-b border-hair">
            {(posts ?? []).map((p) => {
              const current = editing?.slug === p.slug;
              return (
                <li key={p.slug} className="border-t border-hair">
                  <button
                    type="button"
                    onClick={() => void openPost(p.slug)}
                    aria-current={current ? "true" : undefined}
                    className={`block w-full px-2 py-3.5 text-left transition-colors hover:bg-mist ${
                      current ? "bg-mist shadow-[inset_3px_0_0_var(--color-brass-deep)]" : ""
                    }`}
                  >
                    <span className="font-display-text block text-[1.05rem] leading-snug">
                      {p.title}
                    </span>
                    <span className="mt-2 flex items-center gap-3">
                      <span className="label tabular text-ink-faint">{p.date}</span>
                      <span className={`stamp ${p.published ? "adm-live" : ""}`}>
                        {p.published ? "Live" : "Draft"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          </details>
        </aside>

        {/* The editor */}
        <section id="editor" aria-label="Editor" className="min-w-0 scroll-mt-4">
          <div role="group" aria-label="How to add a post" className="flex w-full max-w-md border border-hair">
            {(
              [
                ["write", "Write in the editor"],
                ["upload", "Upload a .md file"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={intake === id}
                onClick={() => setIntake(id)}
                className={`label flex-1 px-4 py-3 ${
                  intake === id ? "bg-ink text-paper" : "text-ink-soft hover:bg-mist"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {intake === "upload" && (
            <div
              className={`mt-6 border border-dashed p-10 text-center transition-colors ${
                dragging ? "border-ink bg-mist" : "border-ink-faint"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void importFile(e.dataTransfer.files[0]);
              }}
            >
              <p className="font-display text-2xl">Drop a markdown file here</p>
              <p className="mx-auto mt-3 max-w-md text-[0.95rem] text-ink-soft">
                A <span className="font-mono text-[0.85rem]">.md</span> file with
                or without a header block. It opens in the editor first, so you
                can check the title, summary and date before anything is
                published. A file with the same web address as an existing post
                replaces that post.
              </p>
              <button
                type="button"
                className="btn btn-ink mt-6"
                onClick={() => fileRef.current?.click()}
              >
                Choose a file
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".md,.markdown,.txt,text/markdown,text/plain"
                className="sr-only"
                tabIndex={-1}
                aria-label="Choose a markdown file"
                onChange={(e) => {
                  void importFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          )}

          {banner && (
            <p role="status" className="mt-6 border border-hair bg-mist p-4 text-[0.95rem]">
              {banner}
            </p>
          )}

          {saved && (
            <div role="status" className="adm-panel mt-6 p-5">
              <p className="flex flex-wrap items-center gap-3">
                <span className="stamp adm-live">
                  {saved.published ? "Published" : "Draft saved"}
                </span>
                <span className="text-[0.95rem]">
                  Saved to GitHub.{" "}
                  <a
                    href={saved.commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-rule"
                  >
                    View the change
                  </a>
                </span>
              </p>
              <p className="label mt-4 text-ink-soft">
                {saved.published || deploy.state !== "live"
                  ? DEPLOY_TEXT[deploy.state]
                  : "The site is updated. This draft is not shown on it."}
                {deploy.url && deploy.state === "failed" && (
                  <>
                    {" "}
                    <a href={deploy.url} target="_blank" rel="noopener noreferrer" className="link-rule">
                      Open the build log
                    </a>
                  </>
                )}
              </p>
              {liveUrl && deploy.state === "live" && (
                <p className="mt-3">
                  <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="link-rule break-all">
                    {liveUrl}
                  </a>
                </p>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="mt-6 border border-brass-deep p-4 text-[0.95rem]">
              <span className="stamp adm-live mr-3">Problem</span>
              {error}
            </p>
          )}

          <div className="mt-8">
            <PostEditor
              key={editorKey}
              draft={draft}
              onChange={change}
              isNew={isNew}
              startedLive={editing?.startedLive ?? false}
              issues={issues}
              showChecks={showIssues}
              busy={busy}
              onSave={(p) => void save(p)}
              onImage={addImage}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
