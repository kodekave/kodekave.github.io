/**
 * A small GitHub client for the publishing console.
 *
 * The site is a static export on GitHub Pages, so there is no server to log
 * in to. Instead the console talks to GitHub directly from the browser with a
 * fine-grained personal access token that can write to this one repository.
 * "Publishing" is a commit of `content/posts/<slug>.md` to `main`; the deploy
 * workflow then builds and ships the site, exactly as if the file had been
 * edited on github.com.
 *
 * The token is sent only to the API host below and never anywhere else.
 */

export const API =
  process.env.NEXT_PUBLIC_GITHUB_API?.replace(/\/$/, "") ??
  "https://api.github.com";

export const REPO = {
  owner: "kodekave",
  name: "kodekave.github.io",
  branch: "main",
} as const;

const POSTS_DIR = "content/posts";
const repoPath = `/repos/${REPO.owner}/${REPO.name}`;

export class GitHubError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Words for the failures an author can act on. */
function explain(status: number, apiMessage: string, action: string): string {
  if (status === 401)
    return "GitHub did not accept this token. It may have expired or been revoked; make a new one.";
  if (status === 403)
    return `The token is not allowed to ${action}. It needs "Contents: Read and write" on the ${REPO.name} repository.`;
  if (status === 404)
    return `GitHub could not find ${REPO.owner}/${REPO.name} with this token. Check that the token was given access to that repository.`;
  if (status === 409 || status === 422)
    return "The file changed on GitHub since it was opened. Reload the post and try again.";
  return apiMessage || `GitHub returned an error (${status}).`;
}

async function call<T>(
  token: string,
  path: string,
  action: string,
  init: RequestInit = {},
  accept = "application/vnd.github+json"
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Accept: accept,
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  } catch {
    throw new GitHubError(0, "Could not reach GitHub. Check the connection and try again.");
  }
  if (!res.ok) {
    let apiMessage = "";
    try {
      apiMessage = ((await res.json()) as { message?: string }).message ?? "";
    } catch {
      /* no body */
    }
    throw new GitHubError(res.status, explain(res.status, apiMessage, action));
  }
  if (accept.includes("raw")) return (await res.text()) as T;
  return (await res.json()) as T;
}

/* ---------------------------------------------------------------- encoding */

export function toBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export function textToBase64(text: string): string {
  return toBase64(new TextEncoder().encode(text));
}

export function base64ToText(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/* ------------------------------------------------------------------- calls */

/**
 * Check a token and say who it belongs to. A token that can read the
 * repository but not write to it is rejected here, with the fix, rather than
 * after someone has written a post.
 */
export async function verifyToken(token: string): Promise<{ login: string }> {
  const user = await call<{ login: string }>(token, "/user", "read your profile");
  const repo = await call<{ permissions?: { push?: boolean } }>(
    token,
    repoPath,
    "read this repository"
  );
  if (repo.permissions && repo.permissions.push === false) {
    throw new GitHubError(
      403,
      `This token can read ${REPO.name} but not change it. Make a token with "Contents: Read and write".`
    );
  }
  return { login: user.login };
}

export type PostSummary = {
  slug: string;
  title: string;
  date: string;
  published: boolean;
};

/** Every post file, with its title, date and live/draft state. */
export async function listPosts(token: string): Promise<PostSummary[]> {
  const entries = await call<{ name: string; type: string }[]>(
    token,
    `${repoPath}/contents/${POSTS_DIR}?ref=${REPO.branch}`,
    "list the posts"
  );
  const files = entries.filter(
    (e) => e.type === "file" && e.name.endsWith(".md") && !e.name.startsWith("_")
  );

  const read = async (name: string): Promise<PostSummary> => {
    const slug = name.replace(/\.md$/, "");
    try {
      const raw = await call<string>(
        token,
        `${repoPath}/contents/${POSTS_DIR}/${name}?ref=${REPO.branch}`,
        "read a post",
        {},
        "application/vnd.github.raw+json"
      );
      const head = /^---\n([\s\S]*?)\n---/.exec(raw.replace(/\r\n/g, "\n"))?.[1] ?? "";
      const field = (k: string) =>
        new RegExp(`^${k}:\\s*(.+)$`, "m").exec(head)?.[1]?.trim().replace(/^["']|["']$/g, "") ?? "";
      return {
        slug,
        title: field("title") || slug,
        date: field("date"),
        published: field("published") !== "false",
      };
    } catch {
      return { slug, title: slug, date: "", published: true };
    }
  };

  // A handful at a time, so a long list does not open dozens of requests at once.
  const out: PostSummary[] = [];
  for (let i = 0; i < files.length; i += 6) {
    out.push(...(await Promise.all(files.slice(i, i + 6).map((f) => read(f.name)))));
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPost(
  token: string,
  slug: string
): Promise<{ raw: string; sha: string }> {
  const file = await call<{ content: string; sha: string }>(
    token,
    `${repoPath}/contents/${POSTS_DIR}/${slug}.md?ref=${REPO.branch}`,
    "read this post"
  );
  return { raw: base64ToText(file.content), sha: file.sha };
}

export type CommitResult = { sha: string; fileSha: string; url: string };

async function putFile(
  token: string,
  path: string,
  contentB64: string,
  message: string,
  sha?: string
): Promise<CommitResult> {
  const res = await call<{
    content: { sha: string };
    commit: { sha: string; html_url: string };
  }>(token, `${repoPath}/contents/${path}`, "save this file", {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: contentB64,
      branch: REPO.branch,
      ...(sha ? { sha } : {}),
    }),
  });
  return { sha: res.commit.sha, fileSha: res.content.sha, url: res.commit.html_url };
}

/** The current `sha` of a file, or undefined when it does not exist yet. */
async function fileSha(token: string, path: string): Promise<string | undefined> {
  try {
    const f = await call<{ sha: string }>(
      token,
      `${repoPath}/contents/${path}?ref=${REPO.branch}`,
      "read a file"
    );
    return f.sha;
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return undefined;
    throw e;
  }
}

/** Write the encrypted sign-in file, replacing the old one if there is one. */
export async function saveVault(
  token: string,
  path: string,
  json: string
): Promise<CommitResult> {
  const sha = await fileSha(token, path);
  return putFile(token, path, textToBase64(json), "Update admin sign-in", sha);
}

/** Create or update `content/posts/<slug>.md`. Pass `sha` when updating. */
export function savePost(
  token: string,
  slug: string,
  markdown: string,
  message: string,
  sha?: string
): Promise<CommitResult> {
  return putFile(token, `${POSTS_DIR}/${slug}.md`, textToBase64(markdown), message, sha);
}

/**
 * Add an image to `public/blog/` and return the path to use in the post. A
 * name already taken gets a number, so an upload never overwrites a picture
 * another post is using.
 */
export async function uploadImage(
  token: string,
  file: File,
  slug: string
): Promise<string> {
  const dot = file.name.lastIndexOf(".");
  const ext = (dot >= 0 ? file.name.slice(dot + 1) : "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const base = file.name
    .slice(0, dot >= 0 ? dot : undefined)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "image";
  const bytes = new Uint8Array(await file.arrayBuffer());
  const b64 = toBase64(bytes);

  for (let n = 0; n < 5; n++) {
    const name = `${slug || "post"}-${base}${n ? `-${n + 1}` : ""}.${ext}`;
    try {
      await putFile(token, `public/blog/${name}`, b64, `Add image ${name}`);
      return `/blog/${name}`;
    } catch (e) {
      // Without a `sha`, GitHub answers 422 when the path already exists.
      if (e instanceof GitHubError && (e.status === 422 || e.status === 409)) continue;
      throw e;
    }
  }
  throw new GitHubError(422, "Could not find a free name for this image.");
}

export type Deploy = {
  state: "queued" | "building" | "live" | "failed" | "unknown";
  url?: string;
};

/**
 * Where the site build for a commit has got to. Needs "Actions: Read" on the
 * token; without it the state is `unknown` and the console says so plainly.
 */
export async function deployFor(token: string, commitSha: string): Promise<Deploy> {
  try {
    const res = await call<{
      workflow_runs: {
        head_sha: string;
        status: string;
        conclusion: string | null;
        html_url: string;
      }[];
    }>(
      token,
      `${repoPath}/actions/runs?branch=${REPO.branch}&per_page=10`,
      "read deploys"
    );
    const run = res.workflow_runs.find((r) => r.head_sha === commitSha);
    if (!run) return { state: "queued" };
    if (run.status !== "completed")
      return { state: run.status === "queued" ? "queued" : "building", url: run.html_url };
    return {
      state: run.conclusion === "success" ? "live" : "failed",
      url: run.html_url,
    };
  } catch {
    return { state: "unknown" };
  }
}
