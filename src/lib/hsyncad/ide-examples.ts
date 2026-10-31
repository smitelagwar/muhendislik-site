/** Sample identities only. Project bytes stay on the owner's computer. */
export const IDE_EXAMPLES = [
  { id: "suheyla-kara", name: "Süheyla Kara", detail: "218 ada 50 parsel · Statik" },
  { id: "mustafa-selvi-2", name: "Mustafa Selvi · 2. Kısım", detail: "Statik proje" },
  { id: "mustafa-selvi-1", name: "Mustafa Selvi · 1. Kısım", detail: "Statik proje" },
  { id: "mustafa-selvi-1-trial", name: "Mustafa Selvi · 1. Kısım · Son kayıt", detail: "IDE11 Trial · Masaüstündeki düzenlenen proje" },
] as const;

export type IdeExampleId = typeof IDE_EXAMPLES[number]["id"];
