import { marked } from "marked";

marked.setOptions({ breaks: true, gfm: true });

export function renderMarkdown(source: string) {
  return marked.parse(source, { async: false }) as string;
}
