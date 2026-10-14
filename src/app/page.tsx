import type { Metadata } from "next";
import StitchPage from "@/components/StitchPage";
import { getPageMeta } from "@/lib/pages";

export const metadata: Metadata = { title: getPageMeta("index")?.title };

export default function HomePage() {
  return <StitchPage slug="index" />;
}
