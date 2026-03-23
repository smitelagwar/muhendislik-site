const SEARCH_CHAR_MAP: Record<string, string> = {
  c: "c",
  g: "g",
  i: "i",
  o: "o",
  s: "s",
  u: "u",
  "\u00e7": "c",
  "\u011f": "g",
  "\u0131": "i",
  "\u00f6": "o",
  "\u015f": "s",
  "\u00fc": "u",
};

export function normalizeSearchValue(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[\u00e7\u011f\u0131\u00f6\u015f\u00fc]/g, (character) => SEARCH_CHAR_MAP[character] ?? character)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9/.\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripMarkdownForSearch(value: string): string {
  return value
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, " $1 ")
    .replace(/`{1,3}[^`]*`{1,3}/g, " ")
    .replace(/^#{1,6}\s+/gm, " ")
    .replace(/[>*_~|]/g, " ")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
