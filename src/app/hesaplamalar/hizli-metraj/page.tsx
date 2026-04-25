import type { Metadata } from "next";
import { QuickQuantityClient } from "./quick-quantity-client";
import { buildSeoMetadata } from "@/lib/seo";
import { SITE_NAME, resolveSiteUrl } from "@/lib/site-config";

export const metadata: Metadata = buildSeoMetadata({
  title: "Hızlı Metraj Hesaplayıcı",
  description:
    "Kat alanı, kat sayısı, deprem talebi, plan kompaktlığı ve bodrum çevre perdesine göre yaklaşık beton, donatı, kalıp ve yardımcı kaba iş metrajını; resmî yaklaşık maliyetle birlikte görün.",
  pathname: "/hesaplamalar/hizli-metraj",
  keywords: [
    "hızlı metraj",
    "beton metrajı",
    "donatı tonajı",
    "kalıp alanı",
    "ön keşif",
    "yaklaşık metraj",
  ],
});

const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Hızlı Metraj Hesaplayıcı",
  applicationCategory: "EngineeringApplication",
  operatingSystem: "Any",
  inLanguage: "tr-TR",
  url: resolveSiteUrl("/hesaplamalar/hizli-metraj"),
  description:
    "Betonarme bina ön keşfi için yaklaşık beton, donatı, kalıp, yardımcı kaba iş metrajı ve kaba taşıyıcı maliyet bandını hesaplar.",
  featureList: [
    "Yaklaşık beton hacmi hesabı",
    "Yaklaşık donatı tonajı hesabı",
    "Kalıp alanı ve kaba taşıyıcı maliyet",
    "Kazı, bohçalama ve drenaj ön keşfi",
    "Resmî yaklaşık maliyet ile karşılaştırma",
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "TRY",
  },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: resolveSiteUrl("/"),
  },
};

export default function HizliMetrajPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
      />
      <QuickQuantityClient />
    </>
  );
}
