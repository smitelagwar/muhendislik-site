"use client";

import { useCallback, useRef, useState } from "react";
import {
  addStoredShareLink,
  getStoredShareLinks,
  markStoredLinkRevoked,
  type StoredBelgeShareLink,
} from "@/lib/belge-paylasim/local-link-registry";
import { DOCUMENT_EDITABLE_FIELDS } from "@/lib/document-field-contracts";

export interface ActiveShareLink {
  url: string;
  viewToken: string;
  manageToken: string;
  expiresAt: string;
  documentId: string;
  createdAt: string;
  isRevoked?: boolean;
}

export interface UseBelgeShareOptions {
  documentId: string;
  getSnapshotValues?: () => Record<string, string>;
  isReady?: boolean;
  /** Test veya geliştirme ortamı için başlangıç bağlantı mock'u */
  initialActiveLink?: ActiveShareLink | null;
  /** Sunucu servisinin hazır olup olmadığını belirtir (varsayılan true) */
  backendReady?: boolean;
}

export interface UseBelgeShareReturn {
  documentId: string;
  isOpen: boolean;
  openShareDialog: () => void;
  closeShareDialog: () => void;
  isCreating: boolean;
  isRevoking: boolean;
  error: string | null;
  activeLink: ActiveShareLink | null;
  copied: boolean;
  backendReady: boolean;
  deviceLinks: StoredBelgeShareLink[];
  copyLink: (urlToCopy?: string) => Promise<boolean>;
  createShareLink: () => Promise<void>;
  revokeLink: (viewToken?: string, manageToken?: string) => Promise<boolean>;
  resetShareState: () => void;
  refreshDeviceLinks: () => void;
}

export function createInitialShareState(options: UseBelgeShareOptions) {
  return {
    isOpen: false,
    isCreating: false,
    error: null,
    activeLink: options.initialActiveLink ?? null,
    copied: false,
    backendReady: options.backendReady ?? true,
    documentId: options.documentId,
  };
}

export function formatShareExpiryTr(expiresAt: string | undefined | null): string {
  if (!expiresAt) return "";
  try {
    const d = new Date(expiresAt);
    return new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return String(expiresAt);
  }
}

export function validateShareLinkSecurity(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  if (!url.startsWith("https://") && !url.startsWith("http://localhost")) return false;
  const lower = url.toLowerCase();
  if (
    lower.includes("whatsapp") ||
    lower.includes("wa.me") ||
    lower.includes("telegram") ||
    lower.includes("t.me") ||
    lower.includes("mailto:")
  ) {
    return false;
  }
  return true;
}

export function useBelgeShare(options: UseBelgeShareOptions): UseBelgeShareReturn {
  const {
    documentId,
    getSnapshotValues,
    backendReady = true,
    initialActiveLink = null,
  } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLink, setActiveLink] = useState<ActiveShareLink | null>(initialActiveLink);
  const [copied, setCopied] = useState(false);
  const [deviceLinks, setDeviceLinks] = useState<StoredBelgeShareLink[]>(() => {
    if (typeof window !== "undefined") {
      return getStoredShareLinks();
    }
    return [];
  });

  // Aynı form snapshot'ı için retry'larda kullanılacak clientRequestId
  const clientRequestIdRef = useRef<string | null>(null);

  const refreshDeviceLinks = useCallback(() => {
    setDeviceLinks(getStoredShareLinks());
  }, []);

  const openShareDialog = useCallback(() => {
    setError(null);
    setCopied(false);
    refreshDeviceLinks();
    setIsOpen(true);
  }, [refreshDeviceLinks]);

  const closeShareDialog = useCallback(() => {
    setIsOpen(false);
    setIsCreating(false);
    setIsRevoking(false);
  }, []);

  const resetShareState = useCallback(() => {
    setActiveLink(null);
    setError(null);
    setCopied(false);
    setIsCreating(false);
    setIsRevoking(false);
    clientRequestIdRef.current = null;
  }, []);

  const copyLink = useCallback(async (urlToCopy?: string): Promise<boolean> => {
    const targetUrl = urlToCopy || activeLink?.url;
    if (!targetUrl) return false;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(targetUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
        return true;
      }

      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = targetUrl;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [activeLink?.url]);

  const createShareLink = useCallback(async () => {
    if (!backendReady) {
      setError("Bağlantı oluşturma servisi hazırlanıyor. Sunucu entegrasyonu tamamlandığında aktif olacaktır.");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // 1. Formun o anki değerlerini dondur (freeze) ve allowlist alanlarını filtrele
      const rawValues = getSnapshotValues ? getSnapshotValues() : {};
      const allowedKeys = DOCUMENT_EDITABLE_FIELDS[documentId as keyof typeof DOCUMENT_EDITABLE_FIELDS];
      const values: Record<string, string> = {};
      if (allowedKeys) {
        for (const k of allowedKeys) {
          if (k in rawValues && rawValues[k] !== undefined) {
            values[k] = String(rawValues[k]);
          }
        }
      } else {
        Object.assign(values, rawValues);
      }

      // 2. İstek için deterministik/benzersiz bir kimlik ata veya mevcut olanı tekrar kullan
      if (!clientRequestIdRef.current) {
        clientRequestIdRef.current = `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      }
      const clientRequestId = clientRequestIdRef.current;

      const response = await fetch("/api/belgeler/paylasim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientRequestId,
          documentId,
          values,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Çok sık bağlantı oluşturdunuz. Lütfen 15 dakika sonra tekrar deneyin.");
        }
        if (response.status === 409) {
          throw new Error("Bu bağlantı oluşturma işlemi devam ediyor veya çakışma oluştu.");
        }
        if (response.status === 413) {
          throw new Error("Form verisi boyut sınırını (64 KiB) aştı.");
        }
        if (response.status === 503) {
          throw new Error("Paylaşım servisi geçici olarak kullanılamıyor. Lütfen birazdan tekrar deneyin.");
        }
        throw new Error(data?.message || "Bağlantı oluşturulamadı.");
      }

      if (!data || !data.viewToken || !data.manageToken) {
        throw new Error("Sunucudan geçersiz yanıt alındı.");
      }

      // Tam URL oluştur (origin ile)
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const fullUrl = data.url.startsWith("http") ? data.url : `${origin}${data.url}`;

      const newLink: ActiveShareLink = {
        url: fullUrl,
        viewToken: data.viewToken,
        manageToken: data.manageToken,
        expiresAt: data.expiresAt,
        documentId: data.documentId || documentId,
        createdAt: new Date().toISOString(),
        isRevoked: false,
      };

      // 3. Yerel kayıt defterine ekle
      addStoredShareLink({
        viewToken: newLink.viewToken,
        manageToken: newLink.manageToken,
        documentId: newLink.documentId,
        url: newLink.url,
        createdAt: newLink.createdAt,
        expiresAt: newLink.expiresAt,
      });

      setActiveLink(newLink);
      refreshDeviceLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bağlantı oluşturulurken bir hata oluştu.");
    } finally {
      setIsCreating(false);
    }
  }, [backendReady, documentId, getSnapshotValues, refreshDeviceLinks]);

  const revokeLink = useCallback(
    async (viewTokenParam?: string, manageTokenParam?: string): Promise<boolean> => {
      const targetViewToken = viewTokenParam || activeLink?.viewToken;
      const targetManageToken = manageTokenParam || activeLink?.manageToken;

      if (!targetViewToken || !targetManageToken) {
        setError("İptal edilecek bağlantı veya yönetim anahtarı bulunamadı.");
        return false;
      }

      setIsRevoking(true);
      setError(null);

      try {
        const response = await fetch(`/api/belgeler/paylasim/${targetViewToken}`, {
          method: "DELETE",
          headers: {
            "x-manage-token": targetManageToken,
          },
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.message || "Bağlantı iptal edilemedi.");
        }

        // Yerel kayıt defterini güncelle
        markStoredLinkRevoked(targetViewToken);

        // Eğer aktif bağlantı ise durumunu güncelle
        if (activeLink && activeLink.viewToken === targetViewToken) {
          setActiveLink((prev) => (prev ? { ...prev, isRevoked: true } : null));
        }

        refreshDeviceLinks();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bağlantı iptal edilirken bir hata oluştu.");
        return false;
      } finally {
        setIsRevoking(false);
      }
    },
    [activeLink, refreshDeviceLinks]
  );

  return {
    documentId,
    isOpen,
    openShareDialog,
    closeShareDialog,
    isCreating,
    isRevoking,
    error,
    activeLink,
    copied,
    backendReady,
    deviceLinks,
    copyLink,
    createShareLink,
    revokeLink,
    resetShareState,
    refreshDeviceLinks,
  };
}
