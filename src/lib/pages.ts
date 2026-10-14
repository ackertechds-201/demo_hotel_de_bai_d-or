import fs from "node:fs";
import path from "node:path";
import pagesMeta from "../../content/pages.json";

export type PageMeta = { title: string; bodyClass: string; formsPlugin: boolean };

const META: Record<string, PageMeta> = pagesMeta;
const CONTENT_DIR = path.join(process.cwd(), "content", "pages");

export const ROUTE_SLUGS = Object.keys(META).filter((slug) => slug !== "index" && slug !== "404");

export function getPageMeta(slug: string): PageMeta | undefined {
  return META[slug];
}

export function loadPage(slug: string) {
  const meta = META[slug];
  if (!meta) throw new Error(`Unknown page: ${slug}`);
  return {
    meta,
    html: fs.readFileSync(path.join(CONTENT_DIR, `${slug}.html`), "utf8"),
    script: fs.readFileSync(path.join(CONTENT_DIR, `${slug}.js`), "utf8"),
  };
}
