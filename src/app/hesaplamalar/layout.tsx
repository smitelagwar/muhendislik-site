import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Home } from "lucide-react";

export const metadata: Metadata = {
  title: {
    default: "Insaat Hesaplamalari | Muhendis Mimar Portali",
    template: "%s | Hesaplamalar",
  },
  description:
    "Tahmini insaat alani, kat bazli alan dagilimi, insaat maliyeti ve resmi birim maliyet araclari.",
};

const CALC_LINKS = [
  { label: "Genel Bakis", href: "/hesaplamalar" },
  { label: "Tahmini Insaat Alani", href: "/hesaplamalar/tahmini-insaat-alani" },
  { label: "Insaat Maliyeti", href: "/hesaplamalar/insaat-maliyeti" },
  { label: "Resmi Birim Maliyet 2026", href: "/hesaplamalar/resmi-birim-maliyet-2026" },
];

export default function HesaplamalarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-zinc-200/80 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center gap-3 px-6 py-3 sm:px-10 lg:px-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          >
            <Home className="h-4 w-4" />
            Ana Sayfa
          </Link>

          <div className="mx-1 hidden h-5 w-px bg-zinc-200 dark:bg-zinc-800 sm:block" />

          <div className="flex flex-wrap gap-2">
            {CALC_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-transparent px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-b border-zinc-200/80 bg-gradient-to-r from-amber-50 via-white to-blue-50 dark:border-zinc-800 dark:from-amber-500/10 dark:via-zinc-950 dark:to-blue-500/10">
        <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-6 py-4 sm:px-10 lg:px-16">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-600 dark:text-amber-300">
              Hesaplama Araclari
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Alan fizibilitesi | maliyet | resmi referans | metraj odakli karar destegi
            </p>
          </div>
        </div>
      </div>

      <main>{children}</main>
    </div>
  );
}
