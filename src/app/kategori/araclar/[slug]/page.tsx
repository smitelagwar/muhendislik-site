import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Sliders, Sparkles } from "lucide-react";
import { ToolIcon } from "@/components/tool-icon";
import { ToolWatermarkIllustration } from "@/components/tool-watermarks";
import { getLiveTools, getToolDefinition } from "@/lib/tools-data";
import { buildSeoMetadata } from "@/lib/seo";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const tools = getLiveTools();
  return tools.map((tool) => ({ slug: tool.id }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolDefinition(slug);

  if (!tool) {
    return {
      title: "Araç Bulunamadı",
    };
  }

  return buildSeoMetadata({
    title: tool.name,
    description: tool.description,
    pathname: `/kategori/araclar/${slug}`,
  });
}

import { ToolRegistryRenderer } from "@/components/tool-registry-renderer";
import { SoftwareApplicationJsonLd } from "@/components/software-application-json-ld";

export default async function GenericToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolDefinition(slug);

  if (!tool) {
    notFound();
  }

  return (
    <>
      <SoftwareApplicationJsonLd
        name={tool.name}
        description={tool.description}
        pathname={`/kategori/araclar/${slug}`}
        section={{ title: "Araçlar", href: "/kategori/araclar" }}
      />
      <ToolRegistryRenderer tool={tool} />
    </>
  );
}
