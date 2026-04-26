"use client";

import { AlertTriangle, GitBranchPlus, Home, RefreshCw, Wrench } from "lucide-react";
import { RouteFeedback } from "@/components/route-feedback";
import { Button } from "@/components/ui/button";

interface CategoryErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CategoryError({ error, reset }: CategoryErrorProps) {
  return (
    <RouteFeedback
      eyebrow="Kategori uyarısı"
      title="Kategori içerikleri yüklenemedi"
      description="Kategori sayfası beklenen içerik listesini üretemedi. Aynı sayfayı yeniden deneyebilir veya kritik kategori girişlerinden devam edebilirsiniz."
      actions={[
        { href: "/", label: "Ana sayfa", icon: <Home className="h-4 w-4" /> },
        { href: "/kategori/bina-asamalari", label: "Bina aşamaları", icon: <GitBranchPlus className="h-4 w-4" />, variant: "outline" },
        { href: "/kategori/araclar", label: "Araçlar", icon: <Wrench className="h-4 w-4" />, variant: "outline" },
      ]}
    >
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-7 text-red-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 flex-shrink-0 text-red-300" />
            <p>
              İçerik listesi tekrar oluşturulabilir. Hata devam ederse ilgili kategori bağlantısı kontrol edilmeli.
              {error.digest ? <span className="mt-2 block font-mono text-xs text-red-200">Hata kodu: {error.digest}</span> : null}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={reset} className="h-10 shrink-0 rounded-full border-red-400/30 bg-red-950/20 text-red-100 hover:bg-red-500/15">
            <RefreshCw className="h-4 w-4" />
            Tekrar dene
          </Button>
        </div>
      </div>
    </RouteFeedback>
  );
}
