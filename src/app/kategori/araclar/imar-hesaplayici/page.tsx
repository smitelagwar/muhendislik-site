import type { Metadata } from "next";
import ImarCalculatorPage from "@/app/araclar/imar-hesaplayici/page";

export const metadata: Metadata = {
  title: "İmar Hesaplayıcı",
  description:
    "Arsa alanı, TAKS, KAKS, bodrum katı ve çekme mesafelerine göre taban alanı, yapılaşma özeti ve kat karşılığını hızlıca ön değerlendirin.",
  alternates: {
    canonical: "/kategori/araclar/imar-hesaplayici",
  },
};

export default ImarCalculatorPage;
