import type { Metadata } from "next";
import StitchPage from "@/components/StitchPage";
import { ROUTE_SLUGS, getPageMeta } from "@/lib/pages";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return ROUTE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: getPageMeta(slug)?.title };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <StitchPage slug={slug} />;
}
