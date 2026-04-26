import { SoftwareApplicationJsonLd } from "@/components/software-application-json-ld";
import { buildSeoMetadata } from "@/lib/seo";
import { QuickQuantityClient } from "./quick-quantity-client";

const PAGE_TITLE = "Hızlı Metraj Hesaplayıcı";
const PAGE_DESCRIPTION =
  "Kat alanı, kat sayısı, deprem talebi, plan kompaktlığı ve bodrum çevre perdesine göre yaklaşık beton, donatı, kalıp ve yardımcı kaba iş metrajını; resmî yaklaşık maliyetle birlikte görün.";
const PAGE_PATH = "/hesaplamalar/hizli-metraj";
const PAGE_KEYWORDS = [
  "hızlı metraj",
  "beton metrajı",
  "donatı tonajı",
  "kalıp alanı",
  "ön keşif",
  "yaklaşık metraj",
];

export const metadata = buildSeoMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  pathname: PAGE_PATH,
  keywords: PAGE_KEYWORDS,
});

export default function HizliMetrajPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        pathname={PAGE_PATH}
        keywords={PAGE_KEYWORDS}
        section={{ title: "Hesaplamalar", href: "/hesaplamalar" }}
      />
      <QuickQuantityClient />
    </>
  );
}
