import { loadPage } from "@/lib/pages";
import PageScripts from "./PageScripts";

export default function StitchPage({ slug }: { slug: string }) {
  const { meta, html, script } = loadPage(slug);
  const className = `${meta.bodyClass} min-h-screen${meta.formsPlugin ? "" : " stitch-no-forms"}`;
  return (
    <>
      <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
      <PageScripts page={slug} code={script} title={slug === "404" ? meta.title : undefined} />
    </>
  );
}
