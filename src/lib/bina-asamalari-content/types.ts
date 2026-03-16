import type { ArticleData } from "../articles-data";

export interface BinaGuideSection {
  id: string;
  title: string;
  content: string;
  subsections: { id: string; title: string }[];
}

export interface BinaGuideSource {
  title: string;
  shortCode: string;
  type: "regulation" | "standard" | "official-tool" | "official-guide" | "manufacturer" | "academic";
  clause?: string;
  url?: string;
  note?: string;
}

export interface BinaGuideRuleRow {
  parameter: string;
  limitOrRequirement: string;
  reference: string;
  note: string;
}

export interface BinaGuideExampleInput {
  label: string;
  value: string;
  note?: string;
}

export interface BinaGuideExampleStep {
  title: string;
  formula?: string;
  result?: string;
  note?: string;
}

export interface BinaGuideExample {
  title: string;
  inputs: BinaGuideExampleInput[];
  assumptions: string[];
  steps: BinaGuideExampleStep[];
  checks: string[];
  engineeringComment: string;
}

export interface BinaGuideTool {
  category: string;
  name: string;
  purpose: string;
}

export interface BinaGuideEquipment {
  group: string;
  name: string;
  purpose: string;
  phase?: string;
}

export interface BinaGuideMistake {
  wrong: string;
  correct: string;
  reference?: string;
}

export interface BinaGuidePageSpec {
  slugPath: string;
  kind: "branch" | "topic";
  quote: string;
  tip: string;
  intro: string[];
  theory: string[];
  ruleTable: BinaGuideRuleRow[];
  designOrApplicationSteps: string[];
  criticalChecks: string[];
  numericalExample: BinaGuideExample;
  tools: BinaGuideTool[];
  equipmentAndMaterials: BinaGuideEquipment[];
  mistakes: BinaGuideMistake[];
  designVsField: string[];
  conclusion: string[];
  sources: readonly BinaGuideSource[];
  keywords: string[];
  relatedPaths?: string[];
}

export interface BinaGuideData {
  slugPath: string;
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  badgeLabel: string;
  author: string;
  authorTitle: string;
  date: string;
  readTime: string;
  image: string;
  quote: { text: string };
  sections: BinaGuideSection[];
  relatedPaths: string[];
  parentPath?: string;
  childPaths: string[];
  standards: string[];
  keywords: string[];
  sources: readonly BinaGuideSource[];
}

export type BinaGuideArticle = ArticleData & {
  keywords?: string[];
};
