import type { CalculationPageIconKey } from "@/lib/calculation-pages";
import type { SiteSectionId } from "@/lib/site-sections";
import type { ToolIconKey } from "@/lib/tools-data";

export interface HomeArticle {
  title: string;
  slug: string;
  sectionId: SiteSectionId;
  category: string;
  description: string;
  image: string;
  date: string;
  readTime: string;
}

interface HomeResourceBase {
  id: string;
  title: string;
  href: string;
  description: string;
  label: string;
  reference: string;
}

export type HomeResource =
  | (HomeResourceBase & {
      kind: "calculation";
      iconKey: CalculationPageIconKey;
    })
  | (HomeResourceBase & {
      kind: "tool";
      iconKey: ToolIconKey;
    });

export interface HomeProjectPhase {
  id: string;
  title: string;
  summary: string;
  href: string;
  image: string;
}

export interface HomeStandard {
  code: string;
  label: string;
  href: string;
}
