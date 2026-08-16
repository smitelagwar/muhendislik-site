export type SearchItemType = "article" | "topic" | "tool" | "calculation" | "section" | "document";

export interface SearchIndexItem {
  id: string;
  href: string;
  title: string;
  category: string;
  description: string;
  type: SearchItemType;
  priority: number;
  searchText: string;
}
