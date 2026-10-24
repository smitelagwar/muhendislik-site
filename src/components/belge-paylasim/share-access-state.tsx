"use client";

import { AlertCircle, Ban, Clock, RefreshCw } from "lucide-react";

const states = {
  invalid: { title: "Geçersiz Bağlantı", description: "Görüntüleme bağlantısı eksik veya geçersiz.", icon: AlertCircle, retry: false },
  not_found: { title: "Belge Bulunamadı", description: "Bu paylaşım bağlantısı bulunamadı. Bağlantıyı belgeyi paylaşan kişiden kontrol etmesini isteyin.", icon: AlertCircle, retry: false },
  revoked: { title: "Bağlantı İptal Edildi", description: "Bu belge bağlantısı oluşturan kişi tarafından iptal edilmiştir ve artık erişilemez.", icon: Ban, retry: false },
  expired: { title: "Süre Doldu", description: "Bu paylaşım bağlantısının geçerlilik süresi dolmuştur. Yeni bir bağlantı için belge sahibiyle iletişime geçin.", icon: Clock, retry: false },
  not_ready: { title: "Belge Hazırlanıyor", description: "Belge henüz görüntülemeye hazır değil. Lütfen biraz sonra yeniden deneyin.", icon: Clock, retry: true },
  unavailable: { title: "Belgeye Şu Anda Erişilemiyor", description: "Paylaşım hizmetine şu anda ulaşılamıyor. Bağlantınızın durumunu doğrulayamadık. Lütfen biraz sonra yeniden deneyin.", icon: AlertCircle, retry: true },
  error: { title: "Belge Görüntülenemedi", description: "Belge açılırken beklenmeyen bir sorun oluştu. Lütfen yeniden deneyin.", icon: AlertCircle, retry: true },
} as const;

export function ShareAccessState({ state, onRetry }: { state: keyof typeof states; onRetry?: () => void }) {
  const { title, description, icon: Icon, retry } = states[state];
  return (
    <section data-testid="share-access-state" data-state={state} className="flex min-h-dvh items-center justify-center bg-background p-4 text-foreground" aria-labelledby="share-state-title">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 text-center shadow-xl sm:p-8">
        <Icon aria-hidden="true" className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 id="share-state-title" className="text-xl font-bold">{title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        {retry && <button type="button" onClick={onRetry ?? (() => window.location.reload())} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <RefreshCw aria-hidden="true" className="h-4 w-4" />Yeniden dene
        </button>}
      </div>
    </section>
  );
}
