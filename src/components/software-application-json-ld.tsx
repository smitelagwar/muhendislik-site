import { JsonLd, generateBreadcrumbSchema, generateCalculatorSchema } from "@/components/seo/json-ld";
import { resolveMediaUrl, resolveSiteUrl } from "@/lib/site-config";

type SectionCrumb = {
  title: string;
  href: string;
};

interface SoftwareApplicationJsonLdProps {
  name: string;
  description: string;
  pathname: string;
  image?: string | null;
  keywords?: string[];
  section: SectionCrumb;
}

export function SoftwareApplicationJsonLd({
  name,
  description,
  pathname,
  image,
  keywords,
  section,
}: SoftwareApplicationJsonLdProps) {
  const applicationSchema = generateCalculatorSchema({
    name,
    description,
    url: resolveSiteUrl(pathname),
    image: resolveMediaUrl(image ?? undefined),
    keywords,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Ana Sayfa", item: "/" },
    { name: section.title, item: section.href },
    { name, item: pathname },
  ]);

  return (
    <>
      <JsonLd schema={applicationSchema} />
      <JsonLd schema={breadcrumbSchema} />
    </>
  );
}
