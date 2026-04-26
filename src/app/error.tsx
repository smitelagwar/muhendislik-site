"use client";

import { AlertTriangle, Home, RefreshCw, Route } from "lucide-react";
import { RouteFeedback } from "@/components/route-feedback";
import { Button } from "@/components/ui/button";

interface AppErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: AppErrorProps) {
  return (
    <RouteFeedback
      eyebrow="Sistem uyarısı"
      title="Sayfa işlenirken beklenmeyen bir hata oluştu"
      description="Bu ekran, hatanın boş veya kırık bir sayfa olarak görünmesini engeller. Tekrar deneyebilir ya da ana gezinme noktalarından devam edebilirsiniz."
      actions={[
        { href: "/", label: "Ana sayfa", icon: <Home className="h-4 w-4" /> },
        { href: "/konu-haritasi", label: "Konu haritası", icon: <Route className="h-4 w-4" />, variant: "outline" },
      ]}
    >
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-7 text-red-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 flex-shrink-0 text-red-300" />
            <p>
              Hata kayıt altına alınabilecek şekilde ayrıştırıldı. Sayfayı yeniden oluşturmak için tekrar deneyin.
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
