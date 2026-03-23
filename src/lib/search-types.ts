export type SearchItemType = "article" | "topic" | "tool" | "calculation" | "section";

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
