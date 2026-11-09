"use client";

import { useMemo, useRef, useState } from "react";
import { renderPreview } from "@/lib/preview";
import { slugify, wordCount, type Issue, type PostDraft } from "@/lib/post-file";

type Edit = { value: string; start: number; end: number };

type ToolId = "h2" | "h3" | "bold" | "italic" | "link" | "ul" | "ol" | "quote" | "code";

const TOOLS: { id: ToolId; label: string; title: string }[] = [
  { id: "h2", label: "H2", title: "Section heading" },
  { id: "h3", label: "H3", title: "Sub-heading" },
  { id: "bold", label: "B", title: "Bold (Ctrl or Cmd + B)" },
  { id: "italic", label: "I", title: "Italic (Ctrl or Cmd + I)" },
  { id: "link", label: "Link", title: "Link (Ctrl or Cmd + K)" },
  { id: "ul", label: "• List", title: "Bulleted list" },
  { id: "ol", label: "1. List", title: "Numbered list" },
  { id: "quote", label: "Quote", title: "Quote" },
  { id: "code", label: "Code", title: "Code" },
];

/**
 * The writing surface: the post's fields, a markdown editor with a small
 * toolbar and a live preview, and the buttons that save or publish it.
 *
 * It holds no copy of the post. The draft lives in the console above and every
 * keystroke goes up through `onChange`, so an import, a load from GitHub and a
 * restored draft are all the same thing to this component.
 */
export default function PostEditor({
  draft,
  onChange,
  isNew,
  startedLive,
  issues,
  showChecks,
  busy,
  onSave,
  onImage,
}: {
  draft: PostDraft;
  onChange: (patch: Partial<PostDraft>) => void;
  isNew: boolean;
  /** An existing post that is already on the site. */
  startedLive: boolean;
  issues: Issue[];
  /** Errors stay quiet on a fresh form until a save has been attempted. */
  showChecks: boolean;
  busy: boolean;
  onSave: (publish: boolean) => void;
  /** Upload a picture; resolves to the path to put in the post, or null. */
  onImage: (file: File) => Promise<string | null>;
}) {
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [tagsText, setTagsText] = useState(() => draft.tags.join(", "));
  const [view, setView] = useState<"write" | "split" | "preview">(() =>
    typeof window !== "undefined" && window.innerWidth >= 1100 ? "split" : "write"
  );
  const [imageBusy, setImageBusy] = useState(false);

  const preview = useMemo(
    () => (view === "write" ? "" : renderPreview(draft.body)),
    [draft.body, view]
  );
  const words = wordCount(draft.body);
  const excerptLen = draft.excerpt.trim().length;
  const excerptOk = excerptLen >= 140 && excerptLen <= 165;
  const errors = showChecks ? issues.filter((i) => i.level === "error") : [];
  const warnings = issues.filter((i) => i.level === "warning");

  /* ----------------------------------------------------- the toolbar's edits */

  function edit(fn: (value: string, start: number, end: number) => Edit) {
    const el = bodyRef.current;
    if (!el) return;
    const r = fn(draft.body, el.selectionStart, el.selectionEnd);
    onChange({ body: r.value });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(r.start, r.end);
    });
  }

  const wrap = (before: string, after: string, placeholder: string) =>
    edit((v, s, e) => {
      const sel = v.slice(s, e) || placeholder;
      return {
        value: v.slice(0, s) + before + sel + after + v.slice(e),
        start: s + before.length,
        end: s + before.length + sel.length,
      };
    });

  /** Put a prefix on every line the selection touches. */
  const prefixLines = (prefix: (i: number) => string) =>
    edit((v, s, e) => {
      const from = v.lastIndexOf("\n", s - 1) + 1;
      let to = v.indexOf("\n", e);
      if (to === -1) to = v.length;
      const block = v
        .slice(from, to)
        .split("\n")
        .map((line, i) => prefix(i) + line)
        .join("\n");
      return { value: v.slice(0, from) + block + v.slice(to), start: from, end: from + block.length };
    });

  const insertAtCursor = (text: string) =>
    edit((v, s, e) => ({
      value: v.slice(0, s) + text + v.slice(e),
      start: s + text.length,
      end: s + text.length,
    }));

  async function pickImage(file: File | undefined) {
    if (!file) return;
    setImageBusy(true);
    const path = await onImage(file);
    setImageBusy(false);
    if (path) {
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      insertAtCursor(`\n\n![${alt}](${path})\n\n`);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function runTool(id: ToolId) {
    switch (id) {
      case "h2":
        return prefixLines(() => "## ");
      case "h3":
        return prefixLines(() => "### ");
      case "bold":
        return wrap("**", "**", "bold text");
      case "italic":
        return wrap("*", "*", "italic text");
      case "link":
        return wrap("[", "](https://)", "link text");
      case "ul":
        return prefixLines(() => "- ");
      case "ol":
        return prefixLines((i) => `${i + 1}. `);
      case "quote":
        return prefixLines(() => "> ");
      case "code":
        return wrap("`", "`", "code");
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.metaKey || e.ctrlKey)) return;
    const shortcut: Record<string, ToolId> = { b: "bold", i: "italic", k: "link" };
    const id = shortcut[e.key.toLowerCase()];
    if (!id) return;
    e.preventDefault();
    runTool(id);
  }

  /* --------------------------------------------------------------- the form */

  return (
    <div>
      {/* Title and address */}
      <label htmlFor="title" className="field-label">
        Title
      </label>
      <input
        id="title"
        className="field font-display text-3xl leading-tight"
        value={draft.title}
        placeholder="A title that answers the question"
        onChange={(e) => {
          const title = e.target.value;
          onChange(slugTouched ? { title } : { title, slug: slugify(title) });
        }}
      />

      <label htmlFor="slug" className="field-label mt-6">
        Web address
      </label>
      <div className="flex items-stretch">
        <span className="label flex items-center border border-r-0 border-hair bg-mist px-3 text-ink-faint">
          /blog/
        </span>
        <input
          id="slug"
          className="field font-mono text-sm"
          value={draft.slug}
          readOnly={!isNew}
          aria-describedby="slug-help"
          onChange={(e) => {
            setSlugTouched(true);
            onChange({ slug: e.target.value.toLowerCase() });
          }}
        />
      </div>
      <p id="slug-help" className="mt-2 text-sm text-ink-faint">
        {isNew
          ? "Built from the title. Lowercase letters, numbers and hyphens. It cannot be changed after publishing."
          : "The address of a published post is fixed."}
      </p>

      <div className="mt-6 flex items-baseline justify-between">
        <label htmlFor="excerpt" className="field-label !mb-0">
          Summary
        </label>
        <span
          className={`label tabular ${excerptOk ? "text-brass-deep" : "text-ink-faint"}`}
          aria-live="polite"
        >
          {excerptLen} · aim for 150–160
        </span>
      </div>
      <textarea
        id="excerpt"
        rows={3}
        className="field mt-2"
        value={draft.excerpt}
        placeholder="Shown on the blog and in search results. Write it to stand on its own."
        onChange={(e) => onChange({ excerpt: e.target.value })}
      />

      <div className="mt-6 grid gap-6 sm:grid-cols-[11rem_1fr]">
        <div>
          <label htmlFor="date" className="field-label">
            Date
          </label>
          <input
            id="date"
            type="date"
            className="field font-mono text-sm"
            value={draft.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="tags" className="field-label">
            Tags
          </label>
          <input
            id="tags"
            className="field"
            value={tagsText}
            placeholder="Go-to-market, Hiring, Startup operations"
            onChange={(e) => {
              setTagsText(e.target.value);
              onChange({
                tags: e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              });
            }}
          />
        </div>
      </div>

      {/* The body */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <p className="field-label !mb-0">Article</p>
        <div
          role="group"
          aria-label="Editor view"
          className="flex border border-hair"
        >
          {(["write", "split", "preview"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`label px-3.5 py-2 ${
                view === v ? "bg-ink text-paper" : "text-ink-soft hover:bg-mist"
              } ${v === "split" ? "hidden min-[1100px]:block" : ""}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className={`mt-3 ${view === "split" ? "grid gap-5 min-[1100px]:grid-cols-2" : ""}`}>
        {view !== "preview" && (
          <div>
            <div className="flex flex-wrap gap-1.5 border border-b-0 border-hair bg-mist p-2">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  title={t.title}
                  onClick={() => runTool(t.id)}
                  className="tool-btn label"
                >
                  {t.label}
                </button>
              ))}
              <button
                type="button"
                title="Upload a picture and insert it"
                disabled={imageBusy}
                onClick={() => fileRef.current?.click()}
                className="tool-btn label"
              >
                {imageBusy ? "Uploading…" : "Image"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                className="sr-only"
                tabIndex={-1}
                aria-label="Choose an image to insert"
                onChange={(e) => void pickImage(e.target.files?.[0])}
              />
            </div>
            <textarea
              ref={bodyRef}
              aria-label="Article, in markdown"
              className="field min-h-[30rem] resize-y font-mono text-[0.9rem] leading-[1.65]"
              value={draft.body}
              spellCheck
              onKeyDown={onKey}
              onChange={(e) => onChange({ body: e.target.value })}
              placeholder={"Open with a sentence that answers the title on its own.\n\n## A section heading\n\nBody copy."}
            />
          </div>
        )}
        {view !== "write" && (
          <div
            className="prose-post min-h-[30rem] overflow-auto border border-hair bg-paper p-6"
            aria-label="Preview"
            dangerouslySetInnerHTML={{
              __html: preview || "<p>Nothing to preview yet.</p>",
            }}
          />
        )}
      </div>
      <p className="label mt-2 text-ink-faint">
        {words} words · {Math.max(1, Math.round(words / 220))} min read
      </p>

      {/* FAQs */}
      <details className="mt-10 border-t border-hair pt-6" open={draft.faqs.length > 0}>
        <summary className="label cursor-pointer text-ink-soft">
          Questions and answers (optional) · {draft.faqs.length}
        </summary>
        <p className="mt-3 max-w-xl text-sm text-ink-faint">
          Shown under the article and published as FAQ data, which is what
          search and AI answers quote. Write answers that stand alone.
        </p>
        <div className="mt-5 space-y-6">
          {draft.faqs.map((f, i) => (
            <div key={i} className="border border-hair p-4">
              <label htmlFor={`q${i}`} className="field-label">
                Question {i + 1}
              </label>
              <input
                id={`q${i}`}
                className="field"
                value={f.q}
                onChange={(e) =>
                  onChange({
                    faqs: draft.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)),
                  })
                }
              />
              <label htmlFor={`a${i}`} className="field-label mt-4">
                Answer
              </label>
              <textarea
                id={`a${i}`}
                rows={3}
                className="field"
                value={f.a}
                onChange={(e) =>
                  onChange({
                    faqs: draft.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)),
                  })
                }
              />
              <button
                type="button"
                className="label link-rule mt-3 text-ink-soft"
                onClick={() => onChange({ faqs: draft.faqs.filter((_, j) => j !== i) })}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ink"
            onClick={() => onChange({ faqs: [...draft.faqs, { q: "", a: "" }] })}
          >
            Add a question
          </button>
        </div>
      </details>

      {/* Checks */}
      {errors.length + warnings.length > 0 && (
        <ul className="mt-10 space-y-2 border-t border-hair pt-6" aria-label="Checks before publishing">
          {errors.map((i, n) => (
            <li key={`e${n}`} className="flex gap-3 text-[0.95rem]">
              <span className="stamp adm-live shrink-0">Fix</span>
              <span>{i.message}</span>
            </li>
          ))}
          {warnings.map((i, n) => (
            <li key={`w${n}`} className="flex gap-3 text-[0.95rem] text-ink-soft">
              <span className="stamp shrink-0">Note</span>
              <span>{i.message}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Actions */}
      <div className="sticky bottom-0 -mx-6 mt-10 flex flex-wrap items-center gap-3 border-t border-hair bg-paper px-6 py-4 md:-mx-0 md:px-0">
        {startedLive ? (
          <>
            <button
              type="button"
              disabled={busy}
              className="btn btn-solid-ink disabled:opacity-50"
              onClick={() => onSave(true)}
            >
              {busy ? "Saving…" : "Update post"}
            </button>
            <button
              type="button"
              disabled={busy}
              className="btn btn-ink disabled:opacity-50"
              onClick={() => onSave(false)}
            >
              Unpublish
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={busy}
              className="btn btn-solid-ink disabled:opacity-50"
              onClick={() => onSave(true)}
            >
              {busy ? "Publishing…" : "Publish"}
            </button>
            <button
              type="button"
              disabled={busy}
              className="btn btn-ink disabled:opacity-50"
              onClick={() => onSave(false)}
            >
              Save draft
            </button>
          </>
        )}
        {errors.length > 0 && (
          <span className="label text-ink-faint">
            {errors.length} to fix before this can go out
          </span>
        )}
      </div>
    </div>
  );
}
