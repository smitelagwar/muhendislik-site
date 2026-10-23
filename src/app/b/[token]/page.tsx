// ============================================================================
// /b/[token] — GÜVENLİ SALT-OKUNUR PDF GÖRÜNTÜLEYİCİ SAYFASI
// ============================================================================

import type { Metadata } from "next";
import { getShareByViewToken } from "@/lib/belge-paylasim/service-core";
import { BelgeShareViewer } from "@/components/belge-paylasim/belge-share-viewer";
import { AlertCircle, Clock, Ban } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paylaşılan PDF Belgesi | İnşa Blog",
  description: "Salt-okunur güvenli PDF belgesi görüntüleyici",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

const DOCUMENT_TITLES: Record<string, string> = {
  "beton-dokum-tutanagi": "Beton Döküm Tutanağı",
  "santiye-sefi-taahhutnamesi": "Şantiye Şefi İşe Başlama Taahhütnamesi",
  "santiye-sefi-istifa-dilekcesi": "Şantiye Şefliği İstifa Dilekçesi",
  "insaat-ruhsati-dilekcesi": "İnşaat Ruhsatı Başvuru Dilekçesi",
  "santiye-sefi-sozlesmesi": "Şantiye Şefliği Hizmet Sözleşmesi",
};

interface BelgeViewerPageProps {
  params: Promise<{ token: string }>;
}

export default async function BelgeViewerPage({ params }: BelgeViewerPageProps) {
  const { token } = await params;

  if (!token || !token.trim()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-neutral-900 text-neutral-100">
        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 text-center shadow-xl space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold">Geçersiz Bağlantı</h1>
          <p className="text-sm text-neutral-400">
            Görüntüleme belirteci eksik veya geçersiz.
          </p>
        </div>
      </div>
    );
  }

  const result = await getShareByViewToken(token.trim());

  if (result.status === "not_found") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-neutral-900 text-neutral-100">
        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 text-center shadow-xl space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-700 bg-neutral-800 text-neutral-400">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold">Belge Bulunamadı</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Görüntülemek istediğiniz paylaşım bağlantısı sistemde bulunamadı veya silinmiş.
          </p>
        </div>
      </div>
    );
  }

  if (result.status === "revoked") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-neutral-900 text-neutral-100">
        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 text-center shadow-xl space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500">
            <Ban className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold">Bağlantı İptal Edildi</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Bu belge bağlantısı oluşturan kişi tarafından iptal edilmiştir ve artık erişilemez.
          </p>
        </div>
      </div>
    );
  }

  if (result.status === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-neutral-900 text-neutral-100">
        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 text-center shadow-xl space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-500">
            <Clock className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold">Süre Doldu</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Bu paylaşım bağlantısının 90 günlük geçerlilik süresi dolmuştur. Yeni bir bağlantı için belge sahibiyle iletişime geçiniz.
          </p>
        </div>
      </div>
    );
  }

  const documentTitle =
    DOCUMENT_TITLES[result.record.documentId] || "Paylaşılan PDF Belgesi";

  return (
    <BelgeShareViewer
      viewToken={token.trim()}
      documentTitle={documentTitle}
      initialExpiresAt={result.record.expiresAt.toISOString()}
    />
  );
}
