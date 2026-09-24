import type { Metadata } from "next";
import {
  buildBinaGuideMetadata,
  getBinaGuideStaticParams,
  renderBinaGuidePage,
} from "@/app/rehber/guide-page";

interface TechnicalGuidePageProps {
  params: Promise<{ slug: string[] }>;
}

export function generateStaticParams() {
  return getBinaGuideStaticParams();
}

export async function generateMetadata({ params }: TechnicalGuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  return buildBinaGuideMetadata(slug);
}

export default async function TechnicalGuidePage({ params }: TechnicalGuidePageProps) {
  const { slug } = await params;
  return renderBinaGuidePage(slug);
}
