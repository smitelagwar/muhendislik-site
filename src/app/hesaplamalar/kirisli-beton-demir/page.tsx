import { SoftwareApplicationJsonLd } from "@/components/software-application-json-ld";
import { buildSeoMetadata } from "@/lib/seo";
import { KirisliBetonDemirClient } from "./kirisli-beton-demir-client";

const PAGE_TITLE = "Kirişli Döşeme Beton & Demir Tahmini";
const PAGE_DESCRIPTION =
  "İnşaat alanı veya parsel (TAKS/KAKS) seçerek kirişli döşemeli binada tahmini beton, demir ve 2026 laboratuvar ücretini hesaplayın.";
const PAGE_PATH = "/hesaplamalar/kirisli-beton-demir";
const PAGE_KEYWORDS = [
  "kirişli döşeme beton demir",
  "tahmini beton miktarı",
  "tahmini demir miktarı",
  "taks kaks beton demir",
  "radye temel demir",
  "mütemadi temel beton",
  "rijit bodrum perdesi",
  "tahmini laboratuvar ücreti",
];

export const metadata = buildSeoMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  pathname: PAGE_PATH,
  keywords: PAGE_KEYWORDS,
});

export default function KirisliBetonDemirPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        pathname={PAGE_PATH}
        keywords={PAGE_KEYWORDS}
        section={{ title: "Hesaplamalar", href: "/hesaplamalar" }}
      />
      <KirisliBetonDemirClient />
    </>
  );
}
