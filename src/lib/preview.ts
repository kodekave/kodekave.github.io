import { renderMarkdown } from "@/lib/markdown";

/**
 * Markdown to safe HTML for the editor's preview pane.
 *
 * The preview shows whatever is in the editor, including a file just uploaded
 * from somewhere else, and the console holds a GitHub token. So the HTML is
 * parsed into an inert document (nothing in it runs), rebuilt from an
 * allow-list of tags and attributes, and links are limited to web, mail and
 * same-site addresses. The published site renders only files that were
 * committed by the owner; this path is the one that has to assume otherwise.
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "pre", "code",
  "strong", "b", "em", "i", "del", "s", "sup", "sub", "a", "img",
  "table", "thead", "tbody", "tr", "th", "td",
]);
/** Removed with everything inside them, rather than unwrapped. */
const DROP_WITH_CONTENT = new Set([
  "script", "style", "iframe", "object", "embed", "noscript", "template",
  "svg", "math", "form", "textarea", "select", "button", "link", "meta", "base",
]);
const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "title"],
  img: ["src", "alt", "title"],
  th: ["align"],
  td: ["align"],
};

/** Web, mail, same-site paths and in-page anchors; nothing that can run code. */
function safeUrl(value: string): boolean {
  const v = value.trim().replace(/[\u0000-\u001f\u007f\s]+/g, "");
  if (v === "") return false;
  if (v.startsWith("//")) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return /^(https?:|mailto:)/i.test(v);
  return true; // relative path or #anchor
}

function clean(node: Node): void {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.COMMENT_NODE) {
      node.removeChild(child);
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    const el = child as Element;
    const tag = el.tagName.toLowerCase();

    if (DROP_WITH_CONTENT.has(tag)) {
      node.removeChild(el);
      continue;
    }

    clean(el);

    if (!ALLOWED_TAGS.has(tag)) {
      // Keep the text, lose the element.
      while (el.firstChild) node.insertBefore(el.firstChild, el);
      node.removeChild(el);
      continue;
    }

    const allowed = ALLOWED_ATTRS[tag] ?? [];
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (!allowed.includes(name)) {
        el.removeAttribute(attr.name);
      } else if ((name === "href" || name === "src") && !safeUrl(attr.value)) {
        el.removeAttribute(attr.name);
      }
    }
    if (tag === "a" && el.getAttribute("href")) {
      el.setAttribute("rel", "noopener noreferrer");
      el.setAttribute("target", "_blank");
    }
  }
}

export function renderPreview(markdown: string): string {
  const doc = new DOMParser().parseFromString(
    `<body>${renderMarkdown(markdown)}</body>`,
    "text/html"
  );
  clean(doc.body);
  return doc.body.innerHTML;
}
