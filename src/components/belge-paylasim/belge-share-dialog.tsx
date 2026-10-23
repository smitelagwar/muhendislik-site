"use client";

import { useId, useMemo, useState } from "react";
import {
  Dialog,
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

export function BelgeShareDialog({
  share,
  documentTitle,
  hasSensitiveOrSampleData = true,
}: BelgeShareDialogProps) {
  const inputId = useId();
  const [showHistory, setShowHistory] = useState(false);
  const [confirmRevokeToken, setConfirmRevokeToken] = useState<string | null>(null);

  const rawExpiresAt = share.activeLink?.expiresAt;
  const formattedExpiry = useMemo(() => {
    return formatShareExpiryTr(rawExpiresAt);
  }, [rawExpiresAt]);

  const handleRevokeActive = async () => {
    if (!share.activeLink) return;
    await share.revokeLink(share.activeLink.viewToken, share.activeLink.manageToken);
    setConfirmRevokeToken(null);
  };

  const handleRevokeFromHistory = async (link: StoredBelgeShareLink) => {
    await share.revokeLink(link.viewToken, link.manageToken);
    setConfirmRevokeToken(null);
  };

  return (
    <Dialog open={share.isOpen} onOpenChange={(open) => (!open ? share.closeShareDialog() : null)}>
      <DialogContent
        data-testid="belge-share-dialog"
        className="max-w-lg rounded-2xl border-border bg-card p-6 shadow-2xl sm:p-7 max-h-[90vh] overflow-y-auto"
        aria-describedby="belge-share-desc"
      >
        <DialogHeader className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <ShieldCheck className="size-5" />
            </span>
            <DialogTitle className="text-lg font-bold sm:text-xl">
              PDF görüntüleme bağlantısı{documentTitle ? ` — ${documentTitle}` : ""}
            </DialogTitle>
          </div>
          <DialogDescription id="belge-share-desc" className="text-xs text-muted-foreground sm:text-sm">
            Bağlantıya sahip herkes bu belgeyi 90 gün görüntüleyebilir. PDF düzenlenemez; bağlantıyı bu cihazdan iptal edebilirsin.
          </DialogDescription>
        </DialogHeader>

        {share.activeLink ? (
          <div className="space-y-4 py-2" data-testid="belge-share-result">
            {share.activeLink.isRevoked ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                <div className="flex items-center gap-2 font-semibold">
                  <Ban className="size-4 shrink-0" />
                  Bağlantı İptal Edildi (Artık Görüntülenemez)
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                <div className="flex items-center gap-2 font-semibold">
                  <Check className="size-4 shrink-0" />
                  Bağlantı oluşturuldu (Salt-okunur PDF)
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor={inputId} className="text-xs font-semibold text-foreground">
                Görüntüleme Bağlantısı
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={inputId}
                  type="text"
                  readOnly
                  value={share.activeLink.url}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  data-testid="belge-share-url-input"
                  className={`flex-1 rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    share.activeLink.isRevoked ? "line-through opacity-60" : ""
                  }`}
                />
                {!share.activeLink.isRevoked && (
                  <Button
                    type="button"
                    onClick={() => void share.copyLink()}
                    data-testid="belge-share-copy-btn"
                    className="min-h-10 gap-1.5 rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
                  >
                    {share.copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {share.copied ? "Kopyalandı" : "Kopyala"}
                  </Button>
                )}
              </div>
            </div>

            {formattedExpiry && !share.activeLink.isRevoked && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5 text-amber-500" />
                <span>
                  Son kullanım: <strong>{formattedExpiry}</strong> (Türkiye saati)
                </span>
              </div>
            )}

            {!share.activeLink.isRevoked && (
              <div className="pt-1">
                {confirmRevokeToken === share.activeLink.viewToken ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 space-y-2 text-xs text-red-600 dark:text-red-400">
                    <p className="font-semibold">
                      Bağlantıyı iptal etmek istediğinize emin misiniz? İptal edildikten sonra bağlantıya kimse erişemez.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={share.isRevoking}
                        onClick={() => void handleRevokeActive()}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs"
                      >
                        {share.isRevoking ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
                        Evet, Bağlantıyı İptal Et
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmRevokeToken(null)}
                        className="rounded-lg text-xs"
                      >
                        Vazgeç
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmRevokeToken(share.activeLink?.viewToken || null)}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 gap-1.5 p-0 h-auto font-medium"
                  >
                    <Trash2 className="size-3.5" />
                    Bu bağlantıyı iptal et
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {hasSensitiveOrSampleData && (
              <div
                className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-400"
                data-testid="belge-share-sample-warning"
              >
                <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <strong>Bilgi:</strong> Formdaki mevcut verilerle dondurulmuş bir salt-okunur PDF snapshot&apos;ı oluşturulacaktır. Örnek veya kişisel verilerin doğruluğunu kontrol edin.
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Info className="size-3.5 text-amber-500" />
                Sözleşme Koşulları:
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                <li>Geçerlilik süresi: <strong>90 gün sabit</strong></li>
                <li>Görüntüleme formatı: <strong>Salt-okunur düzleştirilmiş PDF</strong></li>
                <li>İptal yetkisi: <strong>Yalnız bu tarayıcıdaki yönetim anahtarıyla</strong></li>
              </ul>
            </div>

            {share.error && (
              <div
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400"
                data-testid="belge-share-error"
              >
                {share.error}
              </div>
            )}
          </div>
        )}

        {/* Bu Cihazdaki Bağlantılarım Geçmişi */}
        {share.deviceLinks.length > 0 && (
          <div className="border-t border-border/80 pt-3 space-y-2">
            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className="flex w-full items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground py-1"
            >
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="size-3.5 text-amber-500" />
                Bu Cihazdaki Bağlantılarım ({share.deviceLinks.length})
              </span>
              {showHistory ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>

            {showHistory && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {share.deviceLinks.map((item) => {
                  const docLabel = DOCUMENT_NAME_MAP[item.documentId] || item.documentId;
                  const isRevoked = Boolean(item.revokedAt);

                  return (
                    <div
                      key={item.viewToken}
                      className="rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="truncate">{docLabel}</span>
                          {isRevoked ? (
                            <span className="rounded bg-red-500/10 px-1 py-0.2 text-[10px] text-red-500">
                              İptal Edildi
                            </span>
                          ) : (
                            <span className="rounded bg-emerald-500/10 px-1 py-0.2 text-[10px] text-emerald-500">
                              Aktif
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {formatShareExpiryTr(item.createdAt)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {!isRevoked && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => void share.copyLink(item.url)}
                              className="h-7 px-2 text-xs"
                              title="Bağlantıyı Kopyala"
                            >
                              <Copy className="size-3.5" />
                            </Button>

                            {confirmRevokeToken === item.viewToken ? (
                              <Button
                                type="button"
                                size="sm"
                                disabled={share.isRevoking}
                                onClick={() => void handleRevokeFromHistory(item)}
                                className="h-7 px-2 bg-red-600 hover:bg-red-700 text-white text-[11px]"
                              >
                                İptal Et
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmRevokeToken(item.viewToken)}
                                className="h-7 px-2 text-red-500 hover:text-red-700"
                                title="Bağlantıyı İptal Et"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border/80">
          <Button
            type="button"
            variant="outline"
            onClick={share.closeShareDialog}
            className="min-h-10 rounded-xl text-xs"
            data-testid="belge-share-close-btn"
          >
            {share.activeLink ? "Kapat" : "Vazgeç"}
          </Button>

          {!share.activeLink && (
            <Button
              type="button"
              onClick={() => void share.createShareLink()}
              disabled={!share.backendReady || share.isCreating}
              className="min-h-10 rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
              data-testid="belge-share-create-btn"
            >
              {share.isCreating ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Oluşturuluyor…
                </>
              ) : (
                "Bağlantı oluştur"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
