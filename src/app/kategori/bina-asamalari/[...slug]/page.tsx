import type { Metadata } from "next";
import {
  buildBinaGuideMetadata,
  getBinaGuideStaticParams,
  renderBinaGuidePage,
} from "@/app/kategori/bina-asamalari/guide-page";

interface BinaGuidePageProps {
  params: Promise<{ slug: string[] }>;
}

export function generateStaticParams() {
  return getBinaGuideStaticParams();
}

export async function generateMetadata({ params }: BinaGuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  return buildBinaGuideMetadata(slug);
}

export default async function BinaGuideCatchAllPage({ params }: BinaGuidePageProps) {
  const { slug } = await params;
  return renderBinaGuidePage(slug);
}
