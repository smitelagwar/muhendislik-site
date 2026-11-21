import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import { HomeStudioClient } from "@/components/home/home-studio-client";
import { JsonLd } from "@/components/seo/json-ld";
import { buildCollectionPageSchema, buildHomeMetadata } from "@/lib/seo";

const bricolageDisplay = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-hp-display",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hp-sans",
  display: "swap",
});

export const metadata: Metadata = buildHomeMetadata();

export default function Home() {
  const schema = buildCollectionPageSchema({
    title: "İnşaat mühendisliği ve mimarlık için teknik çalışma alanı",
    description:
      "Mühendis ve mimarlar için hesaplamalar, yapısal araçlar, yönetmelik içerikleri ve teknik uygulama rehberleri.",
    pathname: "/",
    items: [
      { name: "İnşaat hesaplamaları", href: "/hesaplamalar" },
      { name: "Yapısal araçlar", href: "/kategori/araclar" },
      { name: "Deprem ve yönetmelikler", href: "/kategori/deprem-yonetmelik" },
      { name: "Belgeler ve şablonlar", href: "/belgeler" },
      { name: "Dokümantasyon arşivi", href: "/dokumantasyon" },
    ],
  });

  return (
    <div className={`${bricolageDisplay.variable} ${plusJakartaSans.variable}`}>
      <JsonLd schema={schema} />
      <HomeStudioClient />
    </div>
  );
}
