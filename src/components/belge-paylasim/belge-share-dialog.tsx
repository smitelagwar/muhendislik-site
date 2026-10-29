"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Ban,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { formatShareExpiryTr, type UseBelgeShareReturn } from "@/hooks/use-belge-share";
import type { StoredBelgeShareLink } from "@/lib/belge-paylasim/local-link-registry";
import { downloadSharedPdf } from "@/lib/belge-paylasim/download-client";

export interface BelgeShareDialogProps {
  share: UseBelgeShareReturn;
  documentTitle?: string;
  hasSensitiveOrSampleData?: boolean;
}

const DOCUMENT_NAME_MAP: Record<string, string> = {
  "beton-dokum-tutanagi": "Beton Döküm Tutanağı",
  "santiye-sefi-taahhutnamesi": "Taahhütname",
  "santiye-sefi-istifa-dilekcesi": "İstifa Dilekçesi",
  "insaat-ruhsati-dilekcesi": "Ruhsat Dilekçesi",
  "santiye-sefi-sozlesmesi": "Hizmet Sözleşmesi",
};

export function BelgeShareDialog({ share, documentTitle, hasSensitiveOrSampleData }: BelgeShareDialogProps) {
  const inputId = useId();
  const fallbackId = useId();
  const [showHistory, setShowHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [confirmRevokeToken, setConfirmRevokeToken] = useState<string | null>(null);
  const [downloadingToken, setDownloadingToken] = useState<string | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);

  const handleDownload = useCallback(async (token: string, fallbackName?: string) => {
    setDownloadingToken(token);
    try {
      await downloadSharedPdf(token, { fallbackFilename: fallbackName });
    } finally {
      setDownloadingToken(null);
    }
  }, []);
  const rawExpiresAt = share.activeLink?.expiresAt;
  const formattedExpiry = useMemo(() => formatShareExpiryTr(rawExpiresAt), [rawExpiresAt]);
  const showDataWarning = hasSensitiveOrSampleData ?? share.hasSensitiveOrSampleData;
  const isQuotaBlocked = Boolean(share.quota && share.quota.used >= share.quota.limit && share.quota.reserved === 0);
  const isQuotaReserved = Boolean(share.quota && share.quota.remaining === 0 && share.quota.reserved > 0);

  const HISTORY_PAGE_SIZE = 10;
  const [nowTimestamp] = useState(() => Date.now());
  const totalHistoryCount = share.deviceLinks.length;
  const totalHistoryPages = Math.max(1, Math.ceil(totalHistoryCount / HISTORY_PAGE_SIZE));
  const currentHistoryPage = Math.min(historyPage, totalHistoryPages);
  const pagedHistoryLinks = useMemo(() => {
    const start = (currentHistoryPage - 1) * HISTORY_PAGE_SIZE;
    return share.deviceLinks.slice(start, start + HISTORY_PAGE_SIZE);
  }, [share.deviceLinks, currentHistoryPage]);

  useEffect(() => {
    if (share.copyFallbackUrl) {
      fallbackInputRef.current?.focus();
      fallbackInputRef.current?.select();
    }
  }, [share.copyFallbackUrl]);

  const handleRevokeActive = async () => {
    if (!share.activeLink) return;
    if (await share.revokeLink(share.activeLink.viewToken, share.activeLink.manageToken)) setConfirmRevokeToken(null);
  };

  const handleRevokeFromHistory = async (link: StoredBelgeShareLink) => {
    if (await share.revokeLink(link.viewToken, link.manageToken)) setConfirmRevokeToken(null);
  };

  const handleCopy = async (url?: string) => {
    await share.copyLink(url);
  };

  let createButtonLabel = "Bağlantı oluştur";
  if (share.isRecovering || share.recoveryStatus === "checking") createButtonLabel = "Önceki işlem kontrol ediliyor";
  else if (share.isCreating) createButtonLabel = "Bağlantı oluşturuluyor…";
  else if (share.activeLink && share.activeLinkIsCurrent && !share.activeLink.isRevoked) createButtonLabel = "Yeni ayrı bağlantı oluştur";
  else if (share.activeLink) createButtonLabel = "Güncel belge için yeni bağlantı oluştur";

  const createDisabled = !share.backendReady || !share.isReady || share.isCreating || share.isRecovering ||
    isQuotaBlocked || isQuotaReserved || Boolean(share.queuedShare) || share.connectionState === "offline";

  return (
    <Dialog open={share.isOpen} onOpenChange={(open) => (!open ? share.closeShareDialog() : null)}>
      <DialogContent
        data-testid="belge-share-dialog"
        showCloseButton={false}
        className="min-w-0 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg gap-4 overflow-x-hidden overflow-y-auto rounded-2xl border border-border/80 bg-card p-5 shadow-2xl sm:p-6"
        aria-describedby="belge-share-desc"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          share.restoreShareDialogFocus();
        }}
      >
        <DialogClose asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Pencereyi kapat"
            className="absolute right-3 top-3 z-10 size-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        </DialogClose>

        <DialogHeader className="min-w-0 space-y-0 pr-8 text-left">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Share2 className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="min-w-0 break-words text-base font-bold leading-tight text-foreground sm:text-lg">
                PDF görüntüleme bağlantısı
              </DialogTitle>
              {documentTitle && (
                <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                  {documentTitle}
                </p>
              )}
            </div>
          </div>
          <DialogDescription id="belge-share-desc" className="sr-only">
            PDF görüntüleme bağlantısı oluşturma ve paylaşma penceresi.
          </DialogDescription>
        </DialogHeader>

        {/* Kota bilgisi görsel olarak kaldırıldı (kullanıcı talebi), test ve ekran okuyucu uyumluluğu için sr-only olarak korunuyor */}
        <section
          className="sr-only"
          aria-live="polite"
          data-testid="belge-share-quota"
        >
          {share.quota ? (
            <p>
              Bugün {share.quota.used} / {share.quota.limit} · {share.quota.remaining} bağlantı hakkınız kaldı
            </p>
          ) : null}
        </section>

        {isQuotaBlocked && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
            <AlertTriangle className="size-4 shrink-0" />
            <span>Günlük bağlantı oluşturma sınırına ulaşıldı. Lütfen daha sonra tekrar deneyin.</span>
          </div>
        )}

        {!share.isReady && (
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300" role="status">
            <Loader2 className="size-4 shrink-0 animate-spin text-amber-600 dark:text-amber-400" />
            <span>Güncel PDF hazırlanıyor. Hazır olduğunda bağlantı oluşturabilirsiniz.</span>
          </div>
        )}

        {share.activeLink ? (
          <div className="min-w-0 space-y-3.5 py-1" data-testid="belge-share-result">
            {share.activeLink.isRevoked ? (
              <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-400">
                <Ban className="size-4 shrink-0" />
                <span className="break-words font-medium">Bağlantı iptal edildi ve artık görüntülenemez.</span>
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-700 dark:text-emerald-400">
                <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="break-words font-medium">Bağlantı oluşturuldu. Bu bağlantı salt okunur PDF gösterir.</span>
              </div>
            )}

            {!share.activeLinkIsCurrent && !share.activeLink.isRevoked && (
              <div
                className="flex min-w-0 items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300"
                data-testid="belge-share-outdated-warning"
              >
                <AlertTriangle className="mr-1 inline size-4 shrink-0 text-amber-500" />
                <span className="break-words">
                  Form değişti. Bu bağlantı önceki belge sürümünü gösterir; yeni formu paylaşmak için güncel belgeye yeni bir bağlantı oluşturun.
                </span>
              </div>
            )}

            <div className="min-w-0 space-y-1.5">
              <label htmlFor={inputId} className="text-xs font-semibold text-foreground">
                Görüntüleme bağlantısı
              </label>
              <div className="flex min-w-0 items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <input
                    id={inputId}
                    type="text"
                    readOnly
                    value={share.activeLink.url}
                    onClick={(event) => event.currentTarget.select()}
                    data-testid="belge-share-url-input"
                    className={`h-11 w-full min-w-0 rounded-xl border border-border/80 bg-muted/50 px-3.5 text-xs font-mono text-foreground outline-none transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 select-all ${
                      share.activeLink.isRevoked ? "line-through opacity-50" : ""
                    }`}
                  />
                </div>
                {!share.activeLink.isRevoked && (
                  <Button
                    type="button"
                    onClick={() => void handleCopy()}
                    data-testid="belge-share-copy-btn"
                    className={`h-11 shrink-0 gap-1.5 rounded-xl px-4 text-xs font-bold shadow-sm transition-all ${
                      share.copied
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600"
                        : "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
                    }`}
                  >
                    {share.copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    <span>{share.copied ? "Kopyalandı" : "Kopyala"}</span>
                  </Button>
                )}
              </div>
            </div>

            {!share.activeLink.isRevoked && (
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <a
                  href={share.activeLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="belge-share-open-link-btn"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted/60"
                >
                  <ExternalLink className="size-3.5 text-muted-foreground" />
                  <span>Bağlantıyı aç</span>
                </a>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={downloadingToken === share.activeLink.viewToken}
                  onClick={() => void handleDownload(share.activeLink!.viewToken, documentTitle)}
                  data-testid="belge-share-download-btn"
                  className="h-9 gap-1.5 rounded-xl border-border/80 px-3 text-xs font-semibold hover:bg-muted/60"
                >
                  {downloadingToken === share.activeLink.viewToken ? (
                    <Loader2 className="size-3.5 animate-spin text-amber-500" />
                  ) : (
                    <Download className="size-3.5 text-muted-foreground" />
                  )}
                  <span>Paylaşılan PDF&apos;yi indir</span>
                </Button>
              </div>
            )}

            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 pt-0.5 text-xs text-muted-foreground">
              {formattedExpiry && !share.activeLink.isRevoked && (
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 shrink-0 text-amber-500" />
                  <span className="break-words">
                    Son kullanım: <strong className="font-semibold text-foreground">{formattedExpiry}</strong> (Türkiye saati)
                  </span>
                </div>
              )}

              {!share.activeLink.isRevoked && confirmRevokeToken !== share.activeLink.viewToken && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmRevokeToken(share.activeLink?.viewToken || null)}
                  className="h-8 gap-1.5 px-2 text-xs font-medium text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="size-3.5" />
                  <span>Bu bağlantıyı iptal et</span>
                </Button>
              )}
            </div>

            {confirmRevokeToken === share.activeLink.viewToken && !share.activeLink.isRevoked && (
              <div className="min-w-0 space-y-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                <p className="break-words font-semibold">
                  Bağlantıyı iptal etmek istediğinize emin misiniz? İptalden sonra erişim kapanır.
                </p>
                <div className="flex min-w-0 items-center gap-2">
                  <Button
                    type="button"
                    disabled={share.isRevoking}
                    onClick={() => void handleRevokeActive()}
                    size="sm"
                    className="h-8 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    {share.isRevoking ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
                    Evet, bağlantıyı iptal et
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmRevokeToken(null)}
                    className="h-8 rounded-lg text-xs"
                  >
                    Vazgeç
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="min-w-0 space-y-3 py-1">
            {showDataWarning && (
              <div
                className="flex min-w-0 items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300"
                data-testid="belge-share-sample-warning"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <div className="min-w-0 break-words">
                  <strong>Paylaşmadan önce kontrol edin:</strong> Bu belgedeki doldurulmuş alanlar bağlantıyı açan kişiler tarafından görülebilir.
                </div>
              </div>
            )}

            <div className="min-w-0 space-y-2.5 rounded-xl border border-border/80 bg-muted/20 p-3.5">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Bu belgeyi salt okunur PDF formatında görüntülemek üzere güvenli bir paylaşım bağlantısı oluşturabilirsiniz.
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 p-2 text-xs">
                  <ShieldCheck className="size-4 shrink-0 text-emerald-500" />
                  <span className="font-medium text-foreground">Salt okunur PDF</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 p-2 text-xs">
                  <Clock className="size-4 shrink-0 text-amber-500" />
                  <span className="font-medium text-foreground">90 gün geçerli</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 p-2 text-xs">
                  <Trash2 className="size-4 shrink-0 text-muted-foreground" />
                  <span className="font-medium text-foreground">İstediğin an iptal</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {share.copyFallbackUrl && (
          <div className="min-w-0 space-y-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs" data-testid="belge-share-copy-fallback">
            <label htmlFor={fallbackId} className="font-semibold text-foreground">Bağlantıyı elle kopyalayın</label>
            <input
              id={fallbackId}
              ref={fallbackInputRef}
              type="text"
              readOnly
              value={share.copyFallbackUrl}
              onClick={(event) => event.currentTarget.select()}
              className="h-10 w-full min-w-0 rounded-lg border border-border bg-background px-3 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[11px] text-muted-foreground">Bağlantı seçildi. Ctrl+C (Mac&apos;te ⌘C) ile kopyalayabilirsiniz.</p>
          </div>
        )}

        {share.error && (
          <div
            className="min-w-0 break-words rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300"
            data-testid="belge-share-error"
            role="alert"
            aria-live="assertive"
          >
            {share.error}
          </div>
        )}

        {share.storageNotice && (
          <div
            data-testid="belge-share-storage-notice"
            className="min-w-0 break-words rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-300"
          >
            {share.storageNotice}
          </div>
        )}

        {share.deviceLinks.length > 0 && (
          <div className="min-w-0 space-y-2 border-t border-border/80 pt-3">
            <button
              type="button"
              onClick={() => setShowHistory((previous) => !previous)}
              className="flex min-h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-left text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              aria-expanded={showHistory}
            >
              <span className="flex min-w-0 items-center gap-2">
                <ShieldAlert className="size-4 shrink-0 text-amber-500" />
                <span className="break-words">Bu cihazdaki bağlantılarım</span>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  {share.deviceLinks.length}
                </span>
              </span>
              {showHistory ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />}
            </button>

            {showHistory && (
              <div className="space-y-2">
                <div data-testid="belge-share-history-list" className="max-h-56 min-w-0 space-y-2 overflow-y-auto overflow-x-hidden pr-1">
                  {pagedHistoryLinks.map((item) => {
                    const docLabel = DOCUMENT_NAME_MAP[item.documentId] || item.documentId;
                    const isRevoked = Boolean(item.revokedAt);
                    const isExpired = Boolean(item.expiresAt && new Date(item.expiresAt).getTime() <= nowTimestamp);
                    return (
                      <div
                        key={item.viewToken}
                        className="flex min-w-0 flex-col gap-2 rounded-xl border border-border/70 bg-muted/20 p-3 text-xs sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5 font-medium">
                            <span className="break-words font-semibold text-foreground">{docLabel}</span>
                            {isRevoked ? (
                              <span className="rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-500">İptal edildi</span>
                            ) : isExpired ? (
                              <span className="rounded-md bg-zinc-500/10 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">Süresi doldu</span>
                            ) : (
                              <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Aktif</span>
                            )}
                          </div>
                          <div className="mt-0.5 break-words text-[10px] text-muted-foreground">
                            Oluşturulma: {formatShareExpiryTr(item.createdAt)} · Geçerlilik: {formatShareExpiryTr(item.expiresAt)}
                          </div>
                        </div>

                        {!isRevoked && (
                          <div className="flex min-w-0 flex-wrap items-center gap-1">
                            {!isExpired && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                disabled={downloadingToken === item.viewToken}
                                onClick={() => void handleDownload(item.viewToken, docLabel)}
                                className="size-8 rounded-lg"
                                title="Paylaşılan PDF'yi indir"
                                data-testid="belge-share-history-download-btn"
                              >
                                {downloadingToken === item.viewToken ? (
                                  <Loader2 className="size-3.5 animate-spin text-amber-500" />
                                ) : (
                                  <Download className="size-3.5" />
                                )}
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => void handleCopy(item.url)}
                              className="size-8 rounded-lg"
                              title="Bağlantıyı kopyala"
                            >
                              <Copy className="size-3.5" />
                            </Button>
                            {confirmRevokeToken === item.viewToken ? (
                              <Button
                                type="button"
                                disabled={share.isRevoking}
                                onClick={() => void handleRevokeFromHistory(item)}
                                className="h-8 whitespace-normal rounded-lg bg-red-600 px-2.5 text-xs font-semibold text-white hover:bg-red-700"
                              >
                                İptal et
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => setConfirmRevokeToken(item.viewToken)}
                                className="size-8 rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400"
                                title="Bağlantıyı iptal et"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {totalHistoryPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs text-muted-foreground">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={currentHistoryPage <= 1}
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      className="h-8 rounded-lg px-2.5 text-xs"
                      data-testid="belge-share-history-prev"
                    >
                      Önceki
                    </Button>
                    <span className="text-[11px]" data-testid="belge-share-history-page-info">
                      Sayfa {currentHistoryPage} / {totalHistoryPages} (Toplam {totalHistoryCount})
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={currentHistoryPage >= totalHistoryPages}
                      onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                      className="h-8 rounded-lg px-2.5 text-xs"
                      data-testid="belge-share-history-next"
                    >
                      Sonraki
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* This is a local *intent*, never a generated public link or cloud-saved document. */}
        <section data-testid="belge-share-offline-queue" aria-label="Çevrimdışı paylaşım" className="space-y-2 rounded-xl border border-border/75 bg-secondary/30 p-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">Bağlantı durumu: {share.connectionState === "offline" ? "İnternet yok" :
              share.connectionState === "weak" ? "Zayıf bağlantı" :
              share.connectionState === "online" ? "İnternete bağlı" : "Kontrol ediliyor"}</span>
            <span className="text-muted-foreground">İnternet erişimi, paylaşım sunucusunun hazır veya bağlantının oluşturulmuş olduğu anlamına gelmez. Yerel taslak ayrıdır.</span>
          </div>
          {share.queuedShare ? (
            <div className="space-y-2" role="status" aria-live="polite">
              <p className="text-foreground">{share.queuedShare.status === "blocked" ?
                "Belge değişti, kimlik doğrulaması yapılamadı veya işlem kalıcı olarak engellendi. Otomatik gönderim durduruldu." :
                share.queuedShare.status === "sending" ?
                "Sunucudan sonuç bekleniyor. Gerçek bağlantı henüz hazır değil." :
                "Paylaşım isteği bu cihaza kaydedildi. Uygulama açıkken bağlantı geldiğinde kontrol edilecek."}</p>
              <div className="flex flex-wrap gap-2">
                {share.queuedShare.status !== "blocked" && (
                  <Button type="button" variant="outline" size="sm" data-testid="belge-offline-retry"
                    disabled={share.isCreating} onClick={() => void share.retryQueuedShare()}>
                    Şimdi dene
                  </Button>
                )}
                <Button type="button" variant="ghost" size="sm" data-testid="belge-offline-cancel"
                  disabled={share.isCreating || (share.queuedShare.status === "sending" &&
                    Boolean(share.queuedShare.leaseUntil && share.queuedShare.leaseUntil > 0))}
                  onClick={() => void share.cancelQueuedShare()}>Bekleyen isteği iptal et</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-muted-foreground">İnternet yokken bağlantı üretilmez. Yalnızca sizin onayınızla gönderim niyeti saklanır; cihaz kapalıyken gönderim garantisi yoktur.</p>
              <Button type="button" variant="outline" size="sm" data-testid="belge-offline-enqueue"
                disabled={!share.isReady || share.isCreating || share.isRecovering}
                onClick={() => void share.queueShareLink()}>
                Bağlantı gelince paylaş
              </Button>
            </div>
          )}
        </section>

        <DialogFooter className="min-w-0 flex-col-reverse gap-2 border-t border-border/80 pt-3 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full min-w-0 rounded-xl text-xs font-medium sm:w-auto"
              data-testid="belge-share-close-btn"
            >
              {share.activeLink ? "Kapat" : "Vazgeç"}
            </Button>
          </DialogClose>

          <Button
            type="button"
            onClick={() => void share.createShareLink()}
            disabled={createDisabled}
            className="h-10 w-full min-w-0 whitespace-normal rounded-xl bg-amber-600 px-4 text-center text-xs font-bold text-white shadow-sm hover:bg-amber-700 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 sm:w-auto"
            data-testid="belge-share-create-btn"
          >
            {share.isCreating || share.isRecovering ? <Loader2 className="mr-1.5 size-4 shrink-0 animate-spin" /> : null}
            <span>{createButtonLabel}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
