// ============================================================================
// PUBLIC PAYLAŞIM VE İNDİRME SAYFASI (/p/[token])
// ============================================================================

import { Metadata } from "next";
import { cookies } from "next/headers";
import {
  getPublicShareInfo,
  verifyShareAccessJwt,
} from "@/lib/dokumantasyon/public-share";
import { SharePasswordScreen } from "@/components/dokumantasyon/public/password-screen";
import { PublicShareDownloadView } from "@/components/dokumantasyon/public/download-view";
import {
  AlertTriangle,
  Clock,
  Ban,
  FileQuestion,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dosya Paylaşımı | Mühendis & Mimar Portalı",
  description: "Güvenli süreli dosya indirme bağlantısı",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

interface PublicSharePageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicSharePage({ params }: PublicSharePageProps) {
  const { token } = await params;
  const shareInfo = await getPublicShareInfo(token);

  // 1. Hata ve Geçersiz Durum Ekranları
  if (shareInfo.status !== "ok" || !shareInfo.link || !shareInfo.items) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <div className="mx-auto max-w-md w-full rounded-2xl border border-border bg-card p-6 text-center shadow-2xl backdrop-blur-md sm:p-8 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500">
            {shareInfo.status === "expired" ? (
              <Clock className="h-7 w-7" />
            ) : shareInfo.status === "revoked" ? (
              <Ban className="h-7 w-7" />
            ) : shareInfo.status === "limit_reached" ? (
              <ShieldAlert className="h-7 w-7" />
            ) : (
              <FileQuestion className="h-7 w-7" />
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {shareInfo.status === "expired"
                ? "Bağlantının Süresi Doldu"
                : shareInfo.status === "revoked"
                ? "Bağlantı İptal Edildi"
                : shareInfo.status === "limit_reached"
                ? "İndirme Sınırına Ulaşıldı"
                : "Bağlantı Bulunamadı"}
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {shareInfo.errorMessage ||
                "Bu paylaşım bağlantısına şu anda erişilemiyor."}
            </p>
          </div>

          <div className="pt-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                Ana Sayfaya Dön
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const link = shareInfo.link;

  // 2. Şifre Doğrulama Kontrolü
  if (link.password_hash) {
    const cookieStore = await cookies();
    const cookieJwt = cookieStore.get(`dok_share_${link.id}`)?.value;
    const isAuthorized = await verifyShareAccessJwt(cookieJwt, link.id);

    if (!isAuthorized) {
      return (
        <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
          <SharePasswordScreen
            rawToken={token}
            title={link.title}
            totalFiles={shareInfo.totalFiles || 0}
          />
        </div>
      );
    }
  }

  // 3. Doğrulanmış İndirme Görünümü
  return (
    <div className="min-h-[75vh] px-4 py-10 sm:px-6 lg:px-8">
      <PublicShareDownloadView
        rawToken={token}
        link={link}
        items={shareInfo.items}
        totalFiles={shareInfo.totalFiles || 0}
        totalSizeBytes={shareInfo.totalSizeBytes || 0}
      />
    </div>
  );
}
