import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, ChevronRight, Home } from "lucide-react";

export const metadata: Metadata = {
  title: {
    default: "İnşaat Hesaplamaları | Mühendis-Mimar Portali",
    template: "%s | Hesaplamalar",
  },
  description:
    "İnşaat maliyeti, metraj ve yaklaşık keşif araçları. Kaba iş, ince iş ve diğer giderlerinizi kategoriler bazında hesaplayın.",
};

const CALC_NAV = [
  { label: "Hesaplamalar", href: "/hesaplamalar" },
  { label: "İnşaat Maliyeti", href: "/hesaplamalar/insaat-maliyeti" },
];

export default function HesaplamalarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      {/* Top bar */}
      <div className="border-b border-zinc-800 bg-[#111111]">
        <div className="mx-auto flex max-w-screen-2xl items-center gap-2 px-6 py-3 text-sm sm:px-10 lg:px-16">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Ana Sayfa</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-700" />
          {CALC_NAV.map((item, i) => (
            <span key={item.href} className="flex items-center gap-2">
              <Link
                href={item.href}
                className="text-zinc-400 transition-colors hover:text-amber-400"
              >
                {item.label}
              </Link>
              {i < CALC_NAV.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 text-zinc-700" />
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Hesaplama world header */}
      <div className="border-b border-zinc-800 bg-[#0d0d0d]">
        <div className="mx-auto max-w-screen-2xl px-6 py-4 sm:px-10 lg:px-16">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
              <Calculator className="h-4.5 w-4.5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">
                Hesaplama Araçları
              </p>
              <p className="text-xs text-zinc-500">
                Maliyet · Metraj · Yaklaşık Keşif
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Page content */}
      <main>{children}</main>
    </div>
  );
}
