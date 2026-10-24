"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addStoredShareLink,
  checkStorageHealth,
  getStoredShareLinks,
  markStoredLinkRevoked,
  type StoredBelgeShareLink,
} from "@/lib/belge-paylasim/local-link-registry";
import {
  bootstrapBrowserShareQuota,
  BrowserBootstrapError,
  type BrowserShareQuotaSnapshot,
} from "@/lib/belge-paylasim/browser-bootstrap";
import { DOCUMENT_EDITABLE_FIELDS } from "@/lib/document-field-contracts";

const OPERATION_TIMEOUT_MS = 8_000;
const OPERATION_RECOVERY_WINDOW_MS = 18_000;
const RECOVERY_POLL_DELAY_MS = 1_500;
const RECOVERY_STORAGE_PREFIX = "belge_paylasim_pending_v1:";

export interface ActiveShareLink {
  url: string;
  viewToken: string;
  manageToken: string;
  expiresAt: string;
  documentId: string;
  createdAt: string;
  isRevoked?: boolean;
  /** A one-way digest of the values and PDF revision used for this link. */
  snapshotFingerprint?: string;
  snapshotRevision?: number | string | null;
}

export interface ShareRecoveryRecord {
  clientRequestId: string;
  replayProof: string;
  documentId: string;
  snapshotFingerprint: string;
  snapshotRevision: number | string | null;
  createdAt: string;
}

export interface UseBelgeShareOptions {
  documentId: string;
  getSnapshotValues?: () => Record<string, string>;
  /** Sharing is enabled only while the visible PDF matches the current form. */
  isReady?: boolean;
  /** Revision of the visible, current PDF. */
  snapshotRevision?: number | string | null;
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
  restoreShareDialogFocus: () => void;
  isCreating: boolean;
  isRecovering: boolean;
  recoveryStatus: "idle" | "checking" | "pending" | "unresolved";
  isRevoking: boolean;
  error: string | null;
  quotaError: string | null;
  quota: BrowserShareQuotaSnapshot | null;
  isReady: boolean;
  snapshotRevision: number | string | null;
  activeLinkIsCurrent: boolean;
  hasSensitiveOrSampleData: boolean;
  activeLink: ActiveShareLink | null;
  copied: boolean;
  copyFallbackUrl: string | null;
  backendReady: boolean;
  deviceLinks: StoredBelgeShareLink[];
  isStoragePersistent: boolean;
  storageNotice: string | null;
  copyLink: (urlToCopy?: string) => Promise<boolean>;
  createShareLink: () => Promise<void>;
  revokeLink: (viewToken?: string, manageToken?: string) => Promise<boolean>;
  resetShareState: () => void;
  refreshDeviceLinks: () => void;
  refreshQuota: () => Promise<void>;
}

interface PendingShareRequest {
  record: ShareRecoveryRecord;
  values: Record<string, string> | null;
}

type OperationStatus =
  | { kind: "ready"; data: Record<string, unknown> }
  | { kind: "pending" }
  | { kind: "failed" | "not-found" | "terminal" };

function isToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function createBrowserShareSecret(): string {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Bu tarayıcı güvenli bağlantı kimliği üretemiyor. PDF dosyasını indirebilirsiniz.");
  }
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export function filterShareSnapshotValues(documentId: string, rawValues: Record<string, string>): Record<string, string> {
  const allowedKeys = DOCUMENT_EDITABLE_FIELDS[documentId as keyof typeof DOCUMENT_EDITABLE_FIELDS];
  const values: Record<string, string> = {};
  if (!allowedKeys) return values;
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(rawValues, key) && rawValues[key] !== undefined) {
      values[key] = String(rawValues[key]);
    }
  }
  return values;
}

function buildSnapshotSeed(
  documentId: string,
  _snapshotRevision: number | string | null,
  values: Record<string, string>,
): string {
  return JSON.stringify({ documentId, values });
}

export async function createShareSnapshotFingerprint(
  documentId: string,
  snapshotRevision: number | string | null,
  values: Record<string, string>,
): Promise<string> {
  return digestShareSnapshotSeed(buildSnapshotSeed(documentId, snapshotRevision, values));
}

async function digestShareSnapshotSeed(seed: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("Bu tarayıcı güvenli belge özeti oluşturamıyor.");
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(seed),
  );
  return toBase64Url(new Uint8Array(digest));
}

function recoveryStorageKey(documentId: string): string {
  return RECOVERY_STORAGE_PREFIX + documentId;
}

export function parseShareRecoveryRecord(value: unknown, expectedDocumentId?: string): ShareRecoveryRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  if (
    !isToken(item.clientRequestId) || !isToken(item.replayProof) ||
    typeof item.documentId !== "string" || !item.documentId ||
    (expectedDocumentId && item.documentId !== expectedDocumentId) ||
    !isToken(item.snapshotFingerprint) ||
    !(item.snapshotRevision === null || typeof item.snapshotRevision === "number" || typeof item.snapshotRevision === "string") ||
    typeof item.createdAt !== "string" || !Number.isFinite(Date.parse(item.createdAt))
  ) return null;
  return {
    clientRequestId: item.clientRequestId,
    replayProof: item.replayProof,
    documentId: item.documentId,
    snapshotFingerprint: item.snapshotFingerprint,
    snapshotRevision: item.snapshotRevision,
    createdAt: item.createdAt,
  };
}

const inMemoryRecoveryStore = new Map<string, string>();

function readRecoveryRecord(documentId: string): ShareRecoveryRecord | null {
  try {
    let raw: string | null = null;
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        raw = window.sessionStorage.getItem(recoveryStorageKey(documentId));
      }
    } catch {
      raw = inMemoryRecoveryStore.get(recoveryStorageKey(documentId)) ?? null;
    }
    if (!raw) {
      raw = inMemoryRecoveryStore.get(recoveryStorageKey(documentId)) ?? null;
    }
    if (!raw) return null;
    const parsed = parseShareRecoveryRecord(JSON.parse(raw), documentId);
    if (!parsed) {
      try {
        if (typeof window !== "undefined" && window.sessionStorage) {
          window.sessionStorage.removeItem(recoveryStorageKey(documentId));
        }
      } catch {
        // ignore
      }
      inMemoryRecoveryStore.delete(recoveryStorageKey(documentId));
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveRecoveryRecord(record: ShareRecoveryRecord): boolean {
  try {
    const serialized = JSON.stringify(record);
    inMemoryRecoveryStore.set(recoveryStorageKey(record.documentId), serialized);
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.setItem(recoveryStorageKey(record.documentId), serialized);
      }
    } catch {
      // sessionStorage devre dışıysa bellek içi kayıt ile devam edilir
    }
    return true;
  } catch {
    return false;
  }
}

function clearRecoveryRecord(documentId: string): void {
  inMemoryRecoveryStore.delete(recoveryStorageKey(documentId));
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.removeItem(recoveryStorageKey(documentId));
    }
  } catch {
    // In-memory idempotency still applies for this mounted studio.
  }
}

function readRetryAfter(response: Response): string | null {
  const value = response.headers.get("Retry-After");
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds < 60 ? `${Math.max(1, Math.ceil(seconds))} saniye` : `${Math.ceil(seconds / 60)} dakika`;
  }
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    }).format(date);
  }
  return null;
}

function getShareApiError(response: Response, data: unknown, isJson: boolean): string {
  const record = data && typeof data === "object" ? data as Record<string, unknown> : null;
  const message = record && typeof record.message === "string" ? record.message : null;
  const code = record && typeof record.code === "string"
    ? record.code
    : record && typeof record.error === "string" ? record.error : null;
  if (response.status === 429) {
    if (isJson && code === "DAILY_BROWSER_QUOTA_EXCEEDED") {
      const retryAfter = readRetryAfter(response);
      return `${message ?? "Bugün bağlantı oluşturma hakkınız doldu."}${retryAfter ? ` Kota ${retryAfter} sonra yenilenecek.` : ""}`;
    }
    const retryAfter = readRetryAfter(response);
    return message ?? (isJson
      ? "İstek güvenlik veya kullanım sınırı nedeniyle reddedildi; günlük kota bilgisiyle karıştırılmadı."
      : `İstek güvenlik filtresi tarafından sınırlandırıldı (HTTP 429).${retryAfter ? ` Yaklaşık ${retryAfter} sonra tekrar deneyin.` : ""} Bu yanıt günlük kota bilgisi değildir.`);
  }
  if (response.status === 403 && !isJson) return "İstek güvenlik filtresi tarafından reddedildi (HTTP 403). Biraz sonra yeniden deneyin.";
  if (response.status === 503) return message ?? "Paylaşım servisi geçici olarak kullanılamıyor. Lütfen birazdan tekrar deneyin.";
  if (response.status === 409) return message ?? "Bu bağlantı oluşturma işlemi devam ediyor veya çakışma oluştu.";
  if (response.status === 413) return message ?? "Form verisi boyut sınırını (64 KiB) aştı.";
  if (!isJson) return `Sunucu beklenmeyen bir yanıt verdi (HTTP ${response.status}).`;
  return message ?? `Bağlantı oluşturulamadı (HTTP ${response.status}).`;
}

export async function parseShareCreateResponse(response: Response): Promise<Record<string, unknown>> {
  const isJson = (response.headers.get("content-type") ?? "").toLowerCase().includes("application/json");
  let data: Record<string, unknown> | null = null;
  let malformedJson = false;
  if (isJson) {
    try {
      const parsed: unknown = await response.json();
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) data = parsed as Record<string, unknown>;
      else malformedJson = true;
    } catch {
      malformedJson = true;
    }
  }

  if (!response.ok && response.status !== 202) {
    throw new Error(malformedJson
      ? `Sunucu geçerli JSON yanıtı vermedi (HTTP ${response.status}).`
      : getShareApiError(response, data, isJson));
  }
  if (!isJson || malformedJson || !data) {
    throw new Error("Sunucudan geçersiz veya eksik JSON yanıtı alındı.");
  }
  return data;
}

export function getShareTransportError(error: unknown): string {
  if (error instanceof TypeError) {
    return "Paylaşım servisine ulaşılamadı. İşlem güvenli biçimde saklandı; bağlantınızı kontrol edip yeniden deneyin.";
  }
  if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "TimeoutError") {
    return "Paylaşım sunucusu zamanında yanıt vermedi. İşlem güvenli biçimde saklandı; yeniden kontrol edebilirsiniz.";
  }
  if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") {
    return "İstek tamamlanmadan durduruldu. Aynı güvenli istekle yeniden deneyebilirsiniz.";
  }
  return "Paylaşım servisine ulaşılamadı. İşlem durumu güvenli biçimde saklandı; bağlantınızı kontrol edip yeniden deneyin.";
}

function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
  parentSignal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const abortFromParent = () => controller.abort(parentSignal?.reason);
  if (parentSignal?.aborted) abortFromParent();
  else parentSignal?.addEventListener("abort", abortFromParent, { once: true });
  const timer = setTimeout(() => {
    controller.abort(new DOMException("İstek zaman aşımına uğradı.", "TimeoutError"));
  }, timeoutMs);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
    parentSignal?.removeEventListener("abort", abortFromParent);
  });
}

function waitForRetry(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason ?? new DOMException("İstek durduruldu.", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(signal.reason ?? new DOMException("İstek durduruldu.", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
  });
}

async function readOperationStatus(
  record: ShareRecoveryRecord,
  signal: AbortSignal,
  deadline: number,
): Promise<OperationStatus> {
  const remaining = Math.max(1, deadline - Date.now());
  const response = await fetchWithTimeout(
    `/api/belgeler/paylasim/islem/${encodeURIComponent(record.clientRequestId)}`,
    {
      method: "GET",
      headers: { "x-belge-share-replay-proof": record.replayProof },
      credentials: "same-origin",
      cache: "no-store",
    },
    Math.min(OPERATION_TIMEOUT_MS, remaining),
    signal,
  );
  if (response.status === 404) return { kind: "not-found" };
  if (response.status === 409) return { kind: "failed" };
  if (response.status === 410) return { kind: "terminal" };
  const data = await parseShareCreateResponse(response);
  if (response.status === 202 || data.status === "pending") return { kind: "pending" };
  if (data.code === "OPERATION_NOT_FOUND") return { kind: "not-found" };
  if (data.code === "CREATE_FAILED") return { kind: "failed" };
  if (data.code === "OPERATION_EXPIRED") return { kind: "terminal" };
  return { kind: "ready", data };
}

async function pollOperationStatus(record: ShareRecoveryRecord, signal: AbortSignal): Promise<OperationStatus> {
  const deadline = Date.now() + OPERATION_RECOVERY_WINDOW_MS;
  while (Date.now() < deadline) {
    const result = await readOperationStatus(record, signal, deadline);
    if (result.kind !== "pending") return result;
    if (Date.now() >= deadline) break;
    await waitForRetry(Math.min(RECOVERY_POLL_DELAY_MS, deadline - Date.now()), signal);
  }
  return { kind: "pending" };
}

function getReadyLink(data: Record<string, unknown>, record: ShareRecoveryRecord): ActiveShareLink {
  if (typeof data.viewToken !== "string" || typeof data.manageToken !== "string" || typeof data.url !== "string") {
    throw new Error("Sunucudan geçersiz veya eksik bağlantı bilgisi alındı.");
  }
  const fullUrl = data.url;
  const parsedUrl = new URL(fullUrl);
  if (
    !validateShareLinkSecurity(fullUrl) ||
    !isToken(data.viewToken) || !isToken(data.manageToken) ||
    parsedUrl.pathname !== `/b/${data.viewToken}`
  ) throw new Error("Sunucudan gelen paylaşım bağlantısı doğrulanamadı.");

  return {
    url: fullUrl,
    viewToken: data.viewToken,
    manageToken: data.manageToken,
    expiresAt: typeof data.expiresAt === "string" ? data.expiresAt : "",
    documentId: typeof data.documentId === "string" ? data.documentId : record.documentId,
    createdAt: new Date().toISOString(),
    isRevoked: false,
    snapshotFingerprint: record.snapshotFingerprint,
    snapshotRevision: record.snapshotRevision,
  };
}

function saveLinkToDevice(link: ActiveShareLink): { success: boolean; persistent: boolean } {
  try {
    addStoredShareLink({
      viewToken: link.viewToken,
      manageToken: link.manageToken,
      documentId: link.documentId,
      url: link.url,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
    });
    const health = checkStorageHealth();
    return { success: true, persistent: health.isPersistent };
  } catch (err) {
    console.warn("Yerel bağlantı kaydedilemedi:", err);
    return { success: false, persistent: false };
  }
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
    const date = new Date(expiresAt);
    if (!Number.isFinite(date.getTime())) return "";
    return new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return String(expiresAt);
  }
}

export function validateShareLinkSecurity(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return (parsed.protocol === "https:" ||
      (parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname))) &&
      !parsed.username && !parsed.password && !parsed.search && !parsed.hash &&
      /^\/b\/[A-Za-z0-9_-]{43}$/.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function useBelgeShare(options: UseBelgeShareOptions): UseBelgeShareReturn {
  const {
    documentId,
    getSnapshotValues,
    isReady = true,
    snapshotRevision = null,
    backendReady = true,
    initialActiveLink = null,
  } = options;
  const normalizedRevision = snapshotRevision ?? null;
  const currentSnapshotValues = filterShareSnapshotValues(documentId, getSnapshotValues ? getSnapshotValues() : {});
  const currentSnapshotSeed = buildSnapshotSeed(documentId, normalizedRevision, currentSnapshotValues);
  const hasSensitiveOrSampleData = Object.values(currentSnapshotValues).some((value) => value.trim().length > 0);

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<"idle" | "checking" | "pending" | "unresolved">("idle");
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [quota, setQuota] = useState<BrowserShareQuotaSnapshot | null>(null);
  const [activeLink, setActiveLink] = useState<ActiveShareLink | null>(initialActiveLink);
  const [copied, setCopied] = useState(false);
  const [copyFallbackUrl, setCopyFallbackUrl] = useState<string | null>(null);
  const [deviceLinks, setDeviceLinks] = useState<StoredBelgeShareLink[]>(() => {
    if (typeof window !== "undefined") return getStoredShareLinks();
    return [];
  });
  const [storageHealth] = useState(() => checkStorageHealth());
  const [storageNotice, setStorageNotice] = useState<string | null>(() => {
    const health = checkStorageHealth();
    return health.isPersistent ? null : (health.warning ?? null);
  });

  const mountedRef = useRef(false);
  const dialogOpenerRef = useRef<HTMLElement | null>(null);
  const generationRef = useRef(0);
  const createInFlightRef = useRef(false);
  const recoveryInFlightRef = useRef(false);
  const pendingRequestRef = useRef<PendingShareRequest | null>(null);
  const activeControllersRef = useRef(new Set<AbortController>());
  const quotaFlightRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    const activeControllers = activeControllersRef.current;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      for (const controller of activeControllers) controller.abort();
      activeControllers.clear();
    };
  }, []);

  const [fingerprintResult, setFingerprintResult] = useState<{ seed: string; fingerprint: string } | null>(null);
  const currentFingerprint = fingerprintResult?.seed === currentSnapshotSeed ? fingerprintResult.fingerprint : null;

  useEffect(() => {
    let current = true;
    if (!isReady || normalizedRevision === null) return () => { current = false; };
    void digestShareSnapshotSeed(currentSnapshotSeed)
      .then((fingerprint) => { if (current) setFingerprintResult({ seed: currentSnapshotSeed, fingerprint }); })
      .catch(() => { /* Sharing remains unavailable until a valid current digest exists. */ });
    return () => { current = false; };
  }, [currentSnapshotSeed, isReady, normalizedRevision]);

  const activeLinkIsCurrent = Boolean(
    activeLink && isReady && activeLink.documentId === documentId &&
    activeLink.snapshotFingerprint && currentFingerprint &&
    activeLink.snapshotFingerprint === currentFingerprint,
  );

  const createController = useCallback(() => {
    const controller = new AbortController();
    activeControllersRef.current.add(controller);
    return controller;
  }, []);

  const releaseController = useCallback((controller: AbortController) => {
    activeControllersRef.current.delete(controller);
  }, []);

  const refreshDeviceLinks = useCallback(() => {
    setDeviceLinks(getStoredShareLinks());
  }, []);

  const refreshQuota = useCallback((): Promise<void> => {
    if (quotaFlightRef.current) return quotaFlightRef.current;
    const controller = createController();
    const quotaFetcher: typeof fetch = (input, init) =>
      fetchWithTimeout(input, init ?? {}, OPERATION_TIMEOUT_MS, controller.signal);
    let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
    const quotaTimeout = setTimeout(() => {
      controller.abort(new DOMException("Kota isteği zaman aşımına uğradı.", "TimeoutError"));
    }, 18_000);
    const operation = Promise.race([
      bootstrapBrowserShareQuota(quotaFetcher, { timeoutMs: OPERATION_TIMEOUT_MS }),
      new Promise<never>((_, reject) => {
        deadlineTimer = setTimeout(
          () => reject(new DOMException("Kota isteği zaman aşımına uğradı.", "TimeoutError")),
          18_500,
        );
      }),
    ])
      .then((nextQuota) => {
        if (!mountedRef.current) return;
        setQuota(nextQuota);
        setQuotaError(null);
      })
      .catch((cause: unknown) => {
        if (!mountedRef.current) return;
        if (cause instanceof BrowserBootstrapError && cause.code === "COOKIE_UNAVAILABLE") {
          setQuotaError("Tarayıcı çerezi kabul etmedi. Paylaşım için çerezleri etkinleştirin.");
        } else if (cause instanceof DOMException && cause.name === "TimeoutError") {
          setQuotaError("Kota bilgisi zamanında alınamadı. Bağlantı oluşturulurken sunucu sonucu esas alınır.");
        } else {
          // Bootstrap error responses are deliberately not treated as daily quota failures.
          setQuotaError("Kota bilgisi şu anda alınamıyor. Biraz sonra yeniden kontrol edin.");
        }
      })
      .finally(() => {
        clearTimeout(quotaTimeout);
        if (deadlineTimer) clearTimeout(deadlineTimer);
        releaseController(controller);
        if (quotaFlightRef.current === operation) quotaFlightRef.current = null;
      });
    quotaFlightRef.current = operation;
    return operation;
  }, [createController, releaseController]);

  const acceptReadyResult = useCallback((data: Record<string, unknown>, record: ShareRecoveryRecord, generation: number) => {
    const link = getReadyLink(data, record);
    let saveResult = { success: false, persistent: false };
    try {
      saveResult = saveLinkToDevice(link);
    } catch {
      // Storage hatası durumunda dahi activeLink UI'dan kaybolmaz
    }
    clearRecoveryRecord(documentId);
    pendingRequestRef.current = null;
    if (generation === generationRef.current && mountedRef.current) {
      setActiveLink(link);
      setRecoveryStatus("idle");
      setError(null);
      if (!saveResult.persistent) {
        setStorageNotice("Bağlantı oluşturuldu ancak tarayıcı kalıcı geçmişine kaydedilemedi. Sayfayı kapatmadan önce bağlantıyı kopyalayın.");
      }
      refreshDeviceLinks();
    }
    void refreshQuota();
  }, [documentId, refreshDeviceLinks, refreshQuota]);

  const recoverPendingOperation = useCallback(async () => {
    const stored = pendingRequestRef.current?.record ?? (typeof window !== "undefined" ? readRecoveryRecord(documentId) : null);
    if (!stored || stored.documentId !== documentId || recoveryInFlightRef.current || createInFlightRef.current) return;
    recoveryInFlightRef.current = true;
    pendingRequestRef.current = { record: stored, values: pendingRequestRef.current?.values ?? null };
    setIsRecovering(true);
    setRecoveryStatus("checking");
    const generation = generationRef.current;
    const controller = createController();
    try {
      const result = await pollOperationStatus(stored, controller.signal);
      if (result.kind === "ready") {
        acceptReadyResult(result.data, stored, generation);
      } else if (result.kind === "pending") {
        setRecoveryStatus("pending");
        setError("Önceki bağlantı isteği sunucuda sürüyor. Yeni bir istek gönderilmeden sonucu yeniden kontrol edin.");
      } else {
        setRecoveryStatus("unresolved");
        setError("Önceki bağlantı isteğinin sonucu henüz kesinleşmedi. Form değişmişse önce bu işlem güvenle çözümlenir.");
      }
    } catch (cause) {
      setRecoveryStatus("unresolved");
      setError(cause instanceof Error ? cause.message : getShareTransportError(cause));
    } finally {
      releaseController(controller);
      recoveryInFlightRef.current = false;
      if (mountedRef.current) setIsRecovering(false);
    }
  }, [acceptReadyResult, createController, documentId, releaseController]);

  const openShareDialog = useCallback(() => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      dialogOpenerRef.current = document.activeElement;
    }
    setError(null);
    setQuotaError(null);
    setCopied(false);
    setCopyFallbackUrl(null);
    refreshDeviceLinks();
    setIsOpen(true);
    void refreshQuota();
    void recoverPendingOperation();
  }, [recoverPendingOperation, refreshDeviceLinks, refreshQuota]);

  const closeShareDialog = useCallback(() => {
    // Closing the UI does not cancel an already accepted server operation.
    setIsOpen(false);
  }, []);

  const restoreShareDialogFocus = useCallback(() => {
    const opener = dialogOpenerRef.current;
    dialogOpenerRef.current = null;
    opener?.focus();
  }, []);

  const resetShareState = useCallback(() => {
    generationRef.current += 1;
    setActiveLink(null);
    setError(null);
    setCopied(false);
    setCopyFallbackUrl(null);
    setIsCreating(false);
    setIsRecovering(false);
    setIsRevoking(false);
    setRecoveryStatus("idle");
  }, []);

  const copyLink = useCallback(async (urlToCopy?: string): Promise<boolean> => {
    const targetUrl = urlToCopy || activeLink?.url;
    if (!targetUrl) {
      setError("Kopyalanacak bağlantı bulunamadı.");
      return false;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(targetUrl);
        setCopied(true);
        setError(null);
        setCopyFallbackUrl(null);
        setTimeout(() => setCopied(false), 3_000);
        return true;
      }

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
        setError(null);
        setCopyFallbackUrl(null);
        setTimeout(() => setCopied(false), 3_000);
        return true;
      }
    } catch {
      // The read-only field below provides an accessible manual-copy fallback.
    }
    setCopied(false);
    setCopyFallbackUrl(targetUrl);
    setError("Panoya kopyalanamadı. Bağlantı alanı seçildi; Ctrl+C ile elle kopyalayın.");
    return false;
  }, [activeLink?.url]);

  const createShareLink = useCallback(async () => {
    if (createInFlightRef.current) return;
    if (recoveryInFlightRef.current) {
      setError("Önceki bağlantı isteğinin sonucu kontrol ediliyor. Kontrol tamamlanınca yeniden deneyin.");
      return;
    }
    if (!backendReady) {
      setError("Bağlantı oluşturma servisi hazırlanıyor. Sunucu entegrasyonu tamamlandığında aktif olacaktır.");
      return;
    }
    if (!isReady || normalizedRevision === null) {
      setError("Güncel PDF hazırlanıyor. Hazır olduğunda bağlantı oluşturabilirsiniz.");
      return;
    }

    createInFlightRef.current = true;
    setIsCreating(true);
    setError(null);
    setCopyFallbackUrl(null);
    const generation = ++generationRef.current;
    const controller = createController();

    try {
      // Freeze the exact allowlisted values once, at the user's click.
      const values = { ...currentSnapshotValues };
      const revision = normalizedRevision;
      const fingerprint = await createShareSnapshotFingerprint(documentId, revision, values);
      setFingerprintResult({ seed: buildSnapshotSeed(documentId, revision, values), fingerprint });

      let request = pendingRequestRef.current;
      if (!request && typeof window !== "undefined") {
        const stored = readRecoveryRecord(documentId);
        if (stored) request = { record: stored, values: null };
      }

      if (request) {
        const outcome = await pollOperationStatus(request.record, controller.signal);
        if (outcome.kind === "ready") {
          acceptReadyResult(outcome.data, request.record, generation);
          return;
        }
        if (outcome.kind === "pending") {
          pendingRequestRef.current = request;
          setRecoveryStatus("pending");
          setError("Önceki bağlantı isteği sunucuda sürüyor. Sonuç kesinleşmeden yeni bir bağlantı oluşturulmaz.");
          return;
        }

        const sameSnapshot = outcome.kind !== "terminal" && request.record.documentId === documentId &&
          request.record.snapshotFingerprint === fingerprint;
        if (!sameSnapshot) {
          clearRecoveryRecord(documentId);
          pendingRequestRef.current = null;
          request = null;
        } else {
          // Same digest means the same canonical allowlisted values and PDF revision.
          request = { record: request.record, values };
        }
      }

      if (!request) {
        const record: ShareRecoveryRecord = {
          clientRequestId: createBrowserShareSecret(),
          replayProof: createBrowserShareSecret(),
          documentId,
          snapshotFingerprint: fingerprint,
          snapshotRevision: revision,
          createdAt: new Date().toISOString(),
        };
        request = { record, values };
      }

      if (!saveRecoveryRecord(request.record)) {
        throw new Error("Tarayıcı güvenli işlem kurtarma kaydını saklayamadı. Bağlantı isteği gönderilmedi; tarayıcı depolamasını etkinleştirin.");
      }
      pendingRequestRef.current = request;

      const response = await fetchWithTimeout("/api/belgeler/paylasim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-belge-share-replay-proof": request.record.replayProof,
        },
        body: JSON.stringify({
          clientRequestId: request.record.clientRequestId,
          documentId,
          values,
        }),
        credentials: "same-origin",
        cache: "no-store",
      }, OPERATION_TIMEOUT_MS, controller.signal);

      const data = await parseShareCreateResponse(response);
      if (response.status === 202 || data.status === "pending") {
        setRecoveryStatus("checking");
        const outcome = await pollOperationStatus(request.record, controller.signal);
        if (outcome.kind === "ready") {
          acceptReadyResult(outcome.data, request.record, generation);
          return;
        }
        if (outcome.kind === "pending") {
          setRecoveryStatus("pending");
          throw new Error("Bağlantı isteği sunucuda sürüyor. Sonucu yeniden kontrol edebilirsiniz; ikinci bir kota hakkı kullanılmadı.");
        }
        if (outcome.kind === "failed") throw new Error("Bağlantı oluşturulamadı. Aynı güvenli istekle yeniden deneyebilirsiniz.");
        throw new Error("İşlem durumu bulunamadı. Aynı istek güvenli biçimde korunuyor; form değişikliği yeni istek olarak gönderilmedi.");
      }

      acceptReadyResult(data, request.record, generation);
    } catch (cause) {
      if (mountedRef.current && generation === generationRef.current) {
        const isTransportFailure = cause instanceof TypeError ||
          (typeof DOMException !== "undefined" && cause instanceof DOMException);
        setError(isTransportFailure ? getShareTransportError(cause) : cause instanceof Error ? cause.message : getShareTransportError(cause));
        setRecoveryStatus(pendingRequestRef.current ? "unresolved" : "idle");
        void refreshQuota();
      }
    } finally {
      releaseController(controller);
      createInFlightRef.current = false;
      if (mountedRef.current && generation === generationRef.current) setIsCreating(false);
    }
  }, [
    acceptReadyResult,
    backendReady,
    createController,
    currentSnapshotValues,
    documentId,
    isReady,
    normalizedRevision,
    refreshQuota,
    releaseController,
  ]);

  const revokeLink = useCallback(async (viewTokenParam?: string, manageTokenParam?: string): Promise<boolean> => {
    const targetViewToken = viewTokenParam || activeLink?.viewToken;
    const targetManageToken = manageTokenParam || activeLink?.manageToken;
    if (!targetViewToken || !targetManageToken) {
      setError("İptal edilecek bağlantı veya yönetim anahtarı bulunamadı.");
      return false;
    }

    const controller = createController();
    setIsRevoking(true);
    setError(null);
    try {
      const response = await fetchWithTimeout(`/api/belgeler/paylasim/${targetViewToken}`, {
        method: "DELETE",
        headers: { "x-manage-token": targetManageToken },
        credentials: "same-origin",
        cache: "no-store",
      }, OPERATION_TIMEOUT_MS, controller.signal);
      if (!response.ok) {
        let data: unknown = null;
        try { data = await response.json(); } catch { /* HTML WAF response is reported by status. */ }
        throw new Error(getShareApiError(response, data, response.headers.get("content-type")?.includes("application/json") ?? false));
      }

      markStoredLinkRevoked(targetViewToken);
      if (activeLink?.viewToken === targetViewToken) {
        setActiveLink((previous) => previous ? { ...previous, isRevoked: true } : null);
      }
      refreshDeviceLinks();
      return true;
    } catch (cause) {
      const isTransportFailure = cause instanceof TypeError ||
        (typeof DOMException !== "undefined" && cause instanceof DOMException);
      setError(isTransportFailure ? getShareTransportError(cause) : cause instanceof Error ? cause.message : "Bağlantı iptal edilirken bir hata oluştu.");
      return false;
    } finally {
      releaseController(controller);
      setIsRevoking(false);
    }
  }, [activeLink, createController, refreshDeviceLinks, releaseController]);

  useEffect(() => {
    if (!isOpen) return;
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") void refreshQuota();
    };
    window.addEventListener("focus", refreshIfVisible);
    window.addEventListener("pageshow", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);

    let midnightTimer: ReturnType<typeof setTimeout> | undefined;
    if (quota) {
      const duration = Math.max(1_000, Date.parse(quota.resetAt) - Date.parse(quota.serverNow) + 1_000);
      midnightTimer = setTimeout(() => { void refreshQuota(); }, Math.min(duration, 2_147_000_000));
    }
    return () => {
      window.removeEventListener("focus", refreshIfVisible);
      window.removeEventListener("pageshow", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      if (midnightTimer) clearTimeout(midnightTimer);
    };
  }, [isOpen, quota, refreshQuota]);

  return {
    documentId,
    isOpen,
    openShareDialog,
    closeShareDialog,
    restoreShareDialogFocus,
    isCreating,
    isRecovering,
    recoveryStatus,
    isRevoking,
    error,
    quotaError,
    quota,
    isReady,
    snapshotRevision: normalizedRevision,
    activeLinkIsCurrent,
    hasSensitiveOrSampleData,
    activeLink,
    copied,
    copyFallbackUrl,
    backendReady,
    deviceLinks,
    isStoragePersistent: storageHealth.isPersistent,
    storageNotice,
    copyLink,
    createShareLink,
    revokeLink,
    resetShareState,
    refreshDeviceLinks,
    refreshQuota,
  };
}
