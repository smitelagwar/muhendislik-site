import type { Metadata } from "next";
import { buildBinaGuideMetadata, renderBinaGuidePage } from "@/app/kategori/bina-asamalari/guide-page";

const SLUG = ["dis-kapi"] as const;

export async function generateMetadata(): Promise<Metadata> {
  return buildBinaGuideMetadata(SLUG);
}

export default async function Page() {
  return renderBinaGuidePage(SLUG);
}