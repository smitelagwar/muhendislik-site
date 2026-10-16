/** Folds Turkish casing and accents so searches work with or without diacritics. */
export function normalizeBelgelerSearchText(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}
