"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
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
  Info,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { formatShareExpiryTr, type UseBelgeShareReturn } from "@/hooks/use-belge-share";
import type { StoredBelgeShareLink } from "@/lib/belge-paylasim/local-link-registry";

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
  const fallbackInputRef = useRef<HTMLTextAreaElement | null>(null);
  const rawExpiresAt = share.activeLink?.expiresAt;
  const formattedExpiry = useMemo(() => formatShareExpiryTr(rawExpiresAt), [rawExpiresAt]);
  const showDataWarning = hasSensitiveOrSampleData ?? share.hasSensitiveOrSampleData;
  const quotaResetTime = formatShareExpiryTr(share.quota?.resetAt);
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
    isQuotaBlocked || isQuotaReserved;

  return (
    <Dialog open={share.isOpen} onOpenChange={(open) => (!open ? share.closeShareDialog() : null)}>
      <DialogContent
        data-testid="belge-share-dialog"
        showCloseButton={false}
        className="min-w-0 max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-lg gap-3 overflow-x-hidden overflow-y-auto rounded-2xl border-border bg-card p-3 shadow-2xl sm:gap-4 sm:p-6"
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
            className="absolute right-2 top-2 z-10 min-h-11 min-w-11 rounded-full"
          >
            <X className="size-4" />
          </Button>
        </DialogClose>

        <DialogHeader className="min-w-0 space-y-2 pr-10 text-left">
          <div className="flex min-w-0 items-start gap-2">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <ShieldCheck className="size-5" />
            </span>
            <DialogTitle className="min-w-0 break-words text-base font-bold leading-6 sm:text-xl">
              PDF görüntüleme bağlantısı{documentTitle ? ` — ${documentTitle}` : ""}
            </DialogTitle>
          </div>
          <DialogDescription id="belge-share-desc" className="break-words text-xs text-muted-foreground sm:text-sm">
            Bağlantıya sahip herkes bu belgeyi 90 gün görüntüleyebilir. PDF düzenlenemez; bağlantıyı bu cihazdan iptal edebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <section
          className="min-w-0 rounded-xl border border-border bg-muted/30 p-3 text-xs"
          aria-live="polite"
          data-testid="belge-share-quota"
        >
          {share.quota ? (
            <>
              <p className="font-semibold text-foreground">
                Bugün {share.quota.used} / {share.quota.limit} · {share.quota.remaining} bağlantı hakkınız kaldı
              </p>
              {share.quota.reserved > 0 && (
                <p className="mt-1 text-muted-foreground">
                  {share.quota.reserved} bağlantı isteği sonuçlanmayı bekliyor; bunlar henüz başarılı bağlantı sayılmaz.
                </p>
              )}
              {quotaResetTime && <p className="mt-1 text-muted-foreground">Günlük haklar {quotaResetTime} Türkiye saatinde yenilenir.</p>}
              {share.quotaError && <p className="mt-1 text-amber-700 dark:text-amber-300">{share.quotaError}</p>}
            </>
          ) : share.quotaError ? (
            <p className="text-muted-foreground">{share.quotaError}</p>
          ) : (
            <p className="text-muted-foreground">Günlük bağlantı hakkı sunucudan kontrol ediliyor…</p>
          )}
        </section>

        {!share.isReady && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300" role="status">
            Güncel PDF hazırlanıyor. Bağlantı, form ve PDF aynı sürümü gösterdiğinde oluşturulabilir.
          </p>
        )}

        {share.activeLink ? (
          <div className="min-w-0 space-y-4 py-1" data-testid="belge-share-result">
            {share.activeLink.isRevoked ? (
              <div className="min-w-0 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                <div className="flex min-w-0 items-start gap-2 font-semibold">
                  <Ban className="mt-0.5 size-4 shrink-0" />
                  <span className="break-words">Bağlantı iptal edildi ve artık görüntülenemez.</span>
                </div>
              </div>
            ) : (
              <div className="min-w-0 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
                <div className="flex min-w-0 items-start gap-2 font-semibold">
                  <Check className="mt-0.5 size-4 shrink-0" />
                  <span className="break-words">Bağlantı oluşturuldu. Bu bağlantı salt okunur PDF gösterir.</span>
                </div>
              </div>
            )}

            {!share.activeLinkIsCurrent && !share.activeLink.isRevoked && (
              <div
                className="min-w-0 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300"
                data-testid="belge-share-outdated-warning"
              >
                <AlertTriangle className="mr-2 inline size-4 align-text-bottom text-amber-500" />
                Form değişti. Bu bağlantı önceki belge sürümünü gösterir; yeni formu paylaşmak için güncel belgeye yeni bir bağlantı oluşturun.
              </div>
            )}

            <div className="min-w-0 space-y-2">
              <label htmlFor={inputId} className="text-xs font-semibold text-foreground">Görüntüleme bağlantısı</label>
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
                <textarea
                  id={inputId}
                  readOnly
                  rows={2}
                  value={share.activeLink.url}
                  onClick={(event) => event.currentTarget.select()}
                  data-testid="belge-share-url-input"
                  className={`min-h-11 w-full min-w-0 resize-none break-all rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 sm:flex-1 ${
                    share.activeLink.isRevoked ? "line-through opacity-60" : ""
                  }`}
                />
                {!share.activeLink.isRevoked && (
                  <Button
                    type="button"
                    onClick={() => void handleCopy()}
                    data-testid="belge-share-copy-btn"
                    className="min-h-11 w-full shrink-0 gap-1.5 rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 sm:w-auto"
                  >
                    {share.copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {share.copied ? "Kopyalandı" : "Kopyala"}
                  </Button>
                )}
              </div>
            </div>

            {formattedExpiry && !share.activeLink.isRevoked && (
              <div className="flex min-w-0 items-start gap-1.5 text-xs text-muted-foreground">
                <Clock className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                <span className="break-words">Son kullanım: <strong>{formattedExpiry}</strong> (Türkiye saati)</span>
              </div>
            )}

            {!share.activeLink.isRevoked && (
              <div className="min-w-0 pt-1">
                {confirmRevokeToken === share.activeLink.viewToken ? (
                  <div className="min-w-0 space-y-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                    <p className="break-words font-semibold">Bağlantıyı iptal etmek istediğinize emin misiniz? İptalden sonra erişim kapanır.</p>
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        disabled={share.isRevoking}
                        onClick={() => void handleRevokeActive()}
                        className="min-h-11 whitespace-normal rounded-lg bg-red-600 text-xs text-white hover:bg-red-700"
                      >
                        {share.isRevoking ? <Loader2 className="size-4 animate-spin" /> : null}
                        Evet, bağlantıyı iptal et
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setConfirmRevokeToken(null)} className="min-h-11 rounded-lg text-xs">
                        Vazgeç
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setConfirmRevokeToken(share.activeLink?.viewToken || null)}
                    className="min-h-11 w-full justify-start gap-2 rounded-lg px-2 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="size-4" />
                    Bu bağlantıyı iptal et
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="min-w-0 space-y-4 py-1">
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

            <div className="min-w-0 space-y-1 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <div className="flex min-w-0 items-start gap-2 font-medium text-foreground">
                <Info className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <span>Sözleşme koşulları</span>
              </div>
              <ul className="list-disc space-y-1 pl-5">
                <li>Geçerlilik süresi: <strong>90 gün</strong></li>
                <li>Görüntüleme: <strong>salt okunur PDF</strong></li>
                <li>Bağlantıyı bu cihazdaki yönetim anahtarıyla iptal edebilirsiniz.</li>
              </ul>
            </div>
          </div>
        )}

        {share.copyFallbackUrl && (
          <div className="min-w-0 space-y-1 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs" data-testid="belge-share-copy-fallback">
            <label htmlFor={fallbackId} className="font-semibold text-foreground">Bağlantıyı elle kopyalayın</label>
            <textarea
              id={fallbackId}
              ref={fallbackInputRef}
              readOnly
              rows={2}
              value={share.copyFallbackUrl}
              onClick={(event) => event.currentTarget.select()}
              className="min-h-11 w-full min-w-0 resize-none break-all rounded-lg border border-border bg-background px-2 py-2 font-mono text-xs text-foreground"
            />
            <p className="text-muted-foreground">Bağlantı seçildi. Ctrl+C (Mac&apos;te ⌘C) ile kopyalayın.</p>
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
              className="flex min-h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg px-1 text-left text-xs font-semibold text-muted-foreground hover:text-foreground"
              aria-expanded={showHistory}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <ShieldAlert className="size-4 shrink-0 text-amber-500" />
                <span className="break-words">Bu cihazdaki bağlantılarım ({share.deviceLinks.length})</span>
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
                        className="flex min-w-0 flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5 font-medium">
                            <span className="break-words">{docLabel}</span>
                            {isRevoked ? (
                              <span className="rounded bg-red-500/10 px-1 py-0.5 text-[10px] text-red-500">İptal edildi</span>
                            ) : isExpired ? (
                              <span className="rounded bg-zinc-500/10 px-1 py-0.5 text-[10px] text-zinc-500">Süresi doldu</span>
                            ) : (
                              <span className="rounded bg-emerald-500/10 px-1 py-0.5 text-[10px] text-emerald-600">Cihazda kayıtlı</span>
                            )}
                          </div>
                          <div className="break-words text-[10px] text-muted-foreground">
                            Oluşturulma: {formatShareExpiryTr(item.createdAt)} · Geçerlilik: {formatShareExpiryTr(item.expiresAt)}
                          </div>
                        </div>

                        {!isRevoked && (
                          <div className="flex min-w-0 flex-wrap items-center gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => void handleCopy(item.url)}
                              className="min-h-11 min-w-11"
                              title="Bağlantıyı kopyala"
                            >
                              <Copy className="size-4" />
                            </Button>
                            {confirmRevokeToken === item.viewToken ? (
                              <Button
                                type="button"
                                disabled={share.isRevoking}
                                onClick={() => void handleRevokeFromHistory(item)}
                                className="min-h-11 whitespace-normal bg-red-600 px-3 text-xs text-white hover:bg-red-700"
                              >
                                İptal et
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => setConfirmRevokeToken(item.viewToken)}
                                className="min-h-11 min-w-11 text-red-500 hover:text-red-700"
                                title="Bağlantıyı iptal et"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {totalHistoryPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border/50 pt-1 text-xs text-muted-foreground">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={currentHistoryPage <= 1}
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      className="min-h-9 px-2.5 text-xs"
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
                      className="min-h-9 px-2.5 text-xs"
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

        <DialogFooter className="min-w-0 flex-col-reverse gap-2 border-t border-border/80 pt-3 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full min-w-0 rounded-xl text-xs sm:w-auto"
              data-testid="belge-share-close-btn"
            >
              {share.activeLink ? "Kapat" : "Vazgeç"}
            </Button>
          </DialogClose>

          <Button
            type="button"
            onClick={() => void share.createShareLink()}
            disabled={createDisabled}
            className="min-h-11 w-full min-w-0 whitespace-normal rounded-xl bg-amber-600 px-3 text-center text-xs font-bold text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400 sm:w-auto"
            data-testid="belge-share-create-btn"
          >
            {share.isCreating || share.isRecovering ? <Loader2 className="size-4 shrink-0 animate-spin" /> : null}
            <span>{createButtonLabel}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
