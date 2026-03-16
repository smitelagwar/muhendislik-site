import type { Metadata } from "next";
import BinaMindMap from "@/components/BinaMindMap";

export const metadata: Metadata = {
  title: "Bina Aşamaları",
  description: "Bina Aşamaları kategori ağacı ve alt başlık navigasyonu.",
  alternates: {
    canonical: "/kategori/bina-asamalari",
  },
};

export default function BinaAsamalariPage() {
  return (
    <div className="tool-page-shell py-6 md:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <BinaMindMap />
      </div>
    </div>
  );
}
