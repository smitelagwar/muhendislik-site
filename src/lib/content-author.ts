export const DEPREM_CONTENT_AUTHOR = {
  name: "İnşaat Mühendisi Hüseyin GÜNAYDIN",
  title: "İnşaat Mühendisi",
  monogram: "HG",
} as const;

type AuthorLike = {
  sectionId: string;
  author: string;
  authorTitle: string;
};

function normalizeForComparison(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");
}

export function normalizeDepremContentAuthor<T extends AuthorLike>(article: T): T {
  if (article.sectionId !== "deprem-yonetmelik") {
    return article;
  }

  return {
    ...article,
    author: DEPREM_CONTENT_AUTHOR.name,
    // Mesleki unvan canonical author string'inin içinde. İkinci kez render edilmesini engelle.
    authorTitle: "",
  };
}

export function getArticleAuthorPresentation(article: AuthorLike) {
  if (article.sectionId === "deprem-yonetmelik") {
    return {
      name: DEPREM_CONTENT_AUTHOR.name,
      title: "",
      monogram: DEPREM_CONTENT_AUTHOR.monogram,
    } as const;
  }

  const name = article.author.trim();
  const title = article.authorTitle.trim();
  const normalizedName = normalizeForComparison(name);
  const normalizedTitle = normalizeForComparison(title);
  const visibleTitle = normalizedTitle && !normalizedName.startsWith(normalizedTitle) ? title : "";
  const monogram = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toLocaleUpperCase("tr-TR");

  return { name, title: visibleTitle, monogram };
}
