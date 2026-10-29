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
import { computeSchemaFingerprint } from "@/lib/belge-draft-storage";
import {
  getShareIntent, enqueueShareIntent, cancelShareIntent, claimShareIntent,
  releaseShareIntent, markShareIntentBlocked, resetShareIntentRetry,
  type OfflineShareIntent,
} from "@/lib/belgeler-offline/outbox";
import { probeConnectivity, type Connectivity } from "@/lib/belgeler-offline/connectivity";

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
  createShareLink: () => Promise<boolean>;
  queueShareLink: () => Promise<void>;
  cancelQueuedShare: () => Promise<void>;
  retryQueuedShare: () => Promise<void>;
  queuedShare: OfflineShareIntent | null;
  connectionState: Connectivity;
  revokeLink: (viewToken?: string, manageToken?: string) => Promise<boolean>;
  resetShareState: () => void;
  refreshDeviceLinks: () => void;
  refreshQuota: () => Promise<boolean>;
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
  if (response.status >= 500) {
    const id = record && typeof record.requestCorrelationId === "string" &&
      /^[0-9a-f-]{36}$/i.test(record.requestCorrelationId) ? record.requestCorrelationId : null;
    const explanation = message ?? "Paylaşım sunucusu geçici olarak yanıt veremiyor. Daha sonra aynı işlemle tekrar deneyin.";
    return id ? explanation + " (Destek kodu: " + id + ")" : explanation;
  }
  if (response.status === 409) return message ?? "Bu bağlantı oluşturma işlemi devam ediyor veya çakışma oluştu.";
  if (response.status === 413) return message ?? "Form verisi boyut sınırını (64 KiB) aştı.";
  if (!isJson) return `Sunucu beklenmeyen bir yanıt verdi (HTTP ${response.status}).`;
  return message ?? `Bağlantı oluşturulamadı (HTTP ${response.status}).`;
}

export class ShareHttpError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = "ShareHttpError"; }
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
    throw new ShareHttpError(response.status, malformedJson
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
  return parseShareOperationStatusResponse(response);
}

/** Only authenticated, code-bearing status responses may change recovery state.
 * An intermediary's HTML 404/409/410 must never be mistaken for a definitive
 * missing/failed/expired operation (which could trigger an unsafe retry). */
export async function parseShareOperationStatusResponse(response: Response): Promise<OperationStatus> {
  const isJson = (response.headers.get("content-type") ?? "").toLowerCase().includes("application/json");
  if (response.status === 404 || response.status === 409 || response.status === 410) {
    let code: unknown;
    if (isJson) {
      try {
        const body: unknown = await response.json();
        if (body && typeof body === "object" && !Array.isArray(body)) {
          code = (body as Record<string, unknown>).code;
        }
      } catch { /* malformed status responses are not authoritative */ }
    }
    if (response.status === 404 && code === "OPERATION_NOT_FOUND") return { kind: "not-found" };
    if (response.status === 409 && code === "CREATE_FAILED") return { kind: "failed" };
    if (response.status === 410 && code === "OPERATION_EXPIRED") return { kind: "terminal" };
    throw new ShareHttpError(response.status,
      "İşlem durumunun güvenilir yanıtı alınamadı (HTTP " + response.status + "). Önceki istek korunuyor.");
  }
  const data = await parseShareCreateResponse(response);
  if (response.status === 202 && data.status === "pending") return { kind: "pending" };
  if (response.status === 200 && data.status === "ready") return { kind: "ready", data };
  throw new Error("İşlem durumu doğrulanamadı. Önceki bağlantı isteği korunuyor.");
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
  const [queuedShare, setQueuedShare] = useState<OfflineShareIntent | null>(null);
  const [connectionState, setConnectionState] = useState<Connectivity>("checking");
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
  const shareAttemptKindRef = useRef<"pending" | "retryable" | "blocked">("retryable");
  const outboxFlightRef = useRef(false);
  const nextOutboxProbeRef = useRef(0);
  const quotaFlightRef = useRef<Promise<boolean> | null>(null);

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

  const refreshQuota = useCallback((): Promise<boolean> => {
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
        if (mountedRef.current) {
          setQuota(nextQuota);
          setQuotaError(null);
        }
        return true;
      })
      .catch((cause: unknown) => {
        if (mountedRef.current) {
          if (cause instanceof BrowserBootstrapError && cause.code === "COOKIE_UNAVAILABLE") {
            setQuotaError("Tarayıcı çerezi kabul etmedi. Paylaşım için çerezleri etkinleştirin.");
          } else if (cause instanceof DOMException && cause.name === "TimeoutError") {
            setQuotaError("Paylaşım sunucusunun kimlik kontrolü zaman aşımına uğradı. Tekrar deneyin.");
          } else {
            setQuotaError("Paylaşım sunucusuna erişilemiyor. İnterneti kontrol edip tekrar deneyin.");
          }
        }
        return false;
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
    // Deleting the matching durable queue never affects the existing draft.
    void cancelShareIntent(documentId, record.clientRequestId)
      .then(() => { if (mountedRef.current) setQueuedShare(null); })
      .catch(() => { /* The same idempotent operation remains recoverable on next open. */ });
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
      if (!(await refreshQuota())) {
        throw new Error("Paylaşım kimliği doğrulanamadı. Önceki bağlantı isteğiniz korunuyor; interneti kontrol edip tekrar deneyin.");
      }
      const result = await pollOperationStatus(stored, controller.signal);
      if (result.kind === "ready") {
        acceptReadyResult(result.data, stored, generation);
      } else if (result.kind === "pending") {
        setRecoveryStatus("pending");
        setError("Önceki bağlantı isteği sunucuda sürüyor. Yeni bir istek gönderilmeden sonucu yeniden kontrol edin.");
      } else {
        setRecoveryStatus("unresolved");
        if (result.kind === "failed") {
          setError("Önceki paylaşım tamamlanamadı. Aynı güvenli istekle yeniden denemek için Bağlantı oluştur'a basın.");
        } else if (result.kind === "not-found") {
          setError("Önceki işlem sunucuda bulunamadı. İstek kimliği korundu; aynı işlemle yeniden deneyebilirsiniz.");
        } else {
          setError("Önceki işlemin süresi dolmuş veya işlem iptal edilmiş. Güncel belge için yeni bağlantı oluşturabilirsiniz.");
        }
      }
    } catch (cause) {
      setRecoveryStatus("unresolved");
      setError(cause instanceof Error ? cause.message : getShareTransportError(cause));
    } finally {
      releaseController(controller);
      recoveryInFlightRef.current = false;
      if (mountedRef.current) setIsRecovering(false);
    }
  }, [acceptReadyResult, createController, documentId, refreshQuota, releaseController]);

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
    if (navigator.onLine) {
      void refreshQuota();
      void recoverPendingOperation();
    }
    void probeConnectivity().then(setConnectionState);
    void getShareIntent(documentId).then(setQueuedShare).catch(() => {});
  }, [documentId, recoverPendingOperation, refreshDeviceLinks, refreshQuota]);

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

  const createShareLink = useCallback(async (): Promise<boolean> => {
    shareAttemptKindRef.current = "retryable";
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("İnternet yok. Önce 'Bağlantı gelince paylaş' seçeneğini kullanın.");
      return false;
    }
    if (createInFlightRef.current) return false;
    if (recoveryInFlightRef.current) {
      setError("Önceki bağlantı isteğinin sonucu kontrol ediliyor. Kontrol tamamlanınca yeniden deneyin.");
      return false;
    }
    if (!backendReady) {
      setError("Bağlantı oluşturma servisi hazırlanıyor. Sunucu entegrasyonu tamamlandığında aktif olacaktır.");
      return false;
    }
    if (!isReady || normalizedRevision === null) {
      setError("Güncel PDF hazırlanıyor. Hazır olduğunda bağlantı oluşturabilirsiniz.");
      return false;
    }

    createInFlightRef.current = true;
    setIsCreating(true);
    setError(null);
    setCopyFallbackUrl(null);
    const generation = ++generationRef.current;
    const controller = createController();

    try {
      // Always finish the browser-identity cookie roundtrip before the create
      // POST or a proof-authenticated recovery GET. A fast first click may race
      // the quota request started by opening the dialog.
      if (!(await refreshQuota())) {
        throw new Error("Paylaşım kimliği henüz doğrulanamadı. İnterneti veya çerez ayarlarını kontrol edip tekrar deneyin; yeni bağlantı isteği gönderilmedi.");
      }
      // Freeze the exact allowlisted values once, at the user's click.
      const values = { ...currentSnapshotValues };
      const revision = normalizedRevision;
      const fingerprint = await createShareSnapshotFingerprint(documentId, revision, values);
      setFingerprintResult({ seed: buildSnapshotSeed(documentId, revision, values), fingerprint });

      // A durable offline intent has priority only when its immutable content digest still matches.
      // Normal online sharing must continue even on browsers without IndexedDB.
      const queued = await getShareIntent(documentId).catch(() => null);
      if (queued) {
        if (queued.status === "blocked" || queued.snapshotFingerprint !== fingerprint ||
            queued.schemaFingerprint !== computeSchemaFingerprint(documentId as keyof typeof DOCUMENT_EDITABLE_FIELDS)) {
          shareAttemptKindRef.current = "blocked";
          setError("Belge değişti veya kuyruk engellendi. Eski isteği iptal edip yeniden onaylayın.");
          return false;
        }
      }
      let request = pendingRequestRef.current;
      if (queued && request && request.record.clientRequestId !== queued.clientRequestId) {
        shareAttemptKindRef.current = "blocked";
        setError("Önceki paylaşım işlemi çözümlenmeden farklı bir istek başlatılamaz.");
        return false;
      }
      if (queued && !request) {
        request = { record: {
          clientRequestId: queued.clientRequestId,
          replayProof: queued.replayProof,
          documentId,
          snapshotFingerprint: queued.snapshotFingerprint,
          snapshotRevision: revision,
          createdAt: queued.createdAt,
        }, values };
      }
      if (!request && typeof window !== "undefined") {
        const stored = readRecoveryRecord(documentId);
        if (stored) request = { record: stored, values: null };
      }

      if (request) {
        const outcome = await pollOperationStatus(request.record, controller.signal);
        if (outcome.kind === "ready") {
          acceptReadyResult(outcome.data, request.record, generation);
          return true;
        }
        if (outcome.kind === "pending") {
          pendingRequestRef.current = request;
          setRecoveryStatus("pending");
          setError("Önceki bağlantı isteği sunucuda sürüyor. Sonuç kesinleşmeden yeni bir bağlantı oluşturulmaz.");
          shareAttemptKindRef.current = "pending";
          return false;
        }

        const sameSnapshot = outcome.kind !== "terminal" && request.record.documentId === documentId &&
          request.record.snapshotFingerprint === fingerprint;
        if (!sameSnapshot && queued) {
          shareAttemptKindRef.current = "blocked";
          setError("Sunucuda önceki istek süresi dolmuş veya belge değişmiş. Kuyruğu iptal edip yeniden onaylayın.");
          return false;
        }
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
          return true;
        }
        if (outcome.kind === "pending") {
          setRecoveryStatus("pending");
          shareAttemptKindRef.current = "pending";
          throw new Error("Bağlantı isteği sunucuda sürüyor. Sonucu yeniden kontrol edebilirsiniz; ikinci bir kota hakkı kullanılmadı.");
        }
        if (outcome.kind === "failed") throw new Error("Bağlantı oluşturulamadı. Aynı güvenli istekle yeniden deneyebilirsiniz.");
        throw new Error("İşlem durumu bulunamadı. Aynı istek güvenli biçimde korunuyor; form değişikliği yeni istek olarak gönderilmedi.");
      }

      acceptReadyResult(data, request.record, generation);
      return true;
    } catch (cause) {
      if (cause instanceof ShareHttpError) {
        shareAttemptKindRef.current = cause.status >= 400 && cause.status < 500 &&
          cause.status !== 408 && cause.status !== 429 ? "blocked" : "retryable";
      }
      if (mountedRef.current && generation === generationRef.current) {
        const isTransportFailure = cause instanceof TypeError ||
          (typeof DOMException !== "undefined" && cause instanceof DOMException);
        setError(isTransportFailure ? getShareTransportError(cause) : cause instanceof Error ? cause.message : getShareTransportError(cause));
        setRecoveryStatus(pendingRequestRef.current ? "unresolved" : "idle");
        if (navigator.onLine) void refreshQuota();
      }
      return false;
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

  const queueShareLink = useCallback(async () => {
    if (!isReady || normalizedRevision === null) {
      setError("PDF hazır olmadan bekleyen paylaşım kaydedilemez."); return;
    }
    if (pendingRequestRef.current || readRecoveryRecord(documentId)) {
      setError("Önceki paylaşım isteğini çözmeden ikinci bir işlem kaydedilemez."); return;
    }
    try {
      const values=filterShareSnapshotValues(documentId, getSnapshotValues ? getSnapshotValues() : {});
      const hash=await createShareSnapshotFingerprint(documentId,null,values);
      const item=await enqueueShareIntent({
        documentId, snapshotFingerprint:hash,
        schemaFingerprint:computeSchemaFingerprint(documentId as keyof typeof DOCUMENT_EDITABLE_FIELDS),
        clientRequestId:createBrowserShareSecret(), replayProof:createBrowserShareSecret(),
        createdAt:new Date().toISOString(),status:"queued",attempts:0,nextRetryAt:0,
      });
      setQueuedShare(item);
      setError(null);
    }catch(cause){
      setError(cause instanceof Error ? cause.message : "Paylaşım kuyruğa alınamadı. PDF'yi indirin.");
    }
  },[documentId,getSnapshotValues,isReady,normalizedRevision]);
  const cancelQueuedShare = useCallback(async () => {
    try {
      const item=await getShareIntent(documentId);
      if (!item) {setQueuedShare(null);return}
      if (item.status==="sending" && item.leaseUntil && item.leaseUntil>Date.now()) {
        setError("İşlem sunucuya gönderiliyor; sonuç kontrol edilmeden iptal edilemez.");return;
      }
      await cancelShareIntent(documentId,item.clientRequestId);
      setQueuedShare(null);
      if (pendingRequestRef.current?.record.clientRequestId===item.clientRequestId) {
        // A lost POST response can still have produced a real link on the server.
        // Cancel only local future attempts; retain the session recovery proof.
        setRecoveryStatus("unresolved");
      }
    }catch(cause){setError(cause instanceof Error?cause.message:"İptal kaydedilemedi.")}
  },[documentId]);
  const processQueuedShare = useCallback(async (manual=false) => {
    if (typeof document==="undefined" || document.visibilityState!=="visible" ||
        !backendReady || !isReady || normalizedRevision===null || createInFlightRef.current) return;
    if (outboxFlightRef.current || (!manual && nextOutboxProbeRef.current > Date.now())) return;
    outboxFlightRef.current = true;
    try {
    const item=await getShareIntent(documentId).catch(()=>null);
    if(!item || item.status==="blocked" || (!manual && item.nextRetryAt>Date.now()))return;
    const values=filterShareSnapshotValues(documentId,getSnapshotValues ? getSnapshotValues() : {});
    const hash=await createShareSnapshotFingerprint(documentId,null,values).catch(()=>null);
    if(hash!==item.snapshotFingerprint ||
       item.schemaFingerprint!==computeSchemaFingerprint(documentId as keyof typeof DOCUMENT_EDITABLE_FIELDS)){
      await markShareIntentBlocked(documentId).catch(()=>{});
      setQueuedShare(await getShareIntent(documentId).catch(()=>null));
      setError("Belge içeriği değişti. Yanlış sürüm paylaşılmadı; eski isteği iptal edip yeniden onaylayın.");
      return;
    }
    const connectivity=await probeConnectivity();
    setConnectionState(connectivity);
    if(connectivity==="offline")return;
    const token=createBrowserShareSecret();
    const leased=await claimShareIntent(documentId,token).catch(()=>null);
    if(!leased)return; // competing tab or retry backoff
    setQueuedShare(leased);
    let worked=false;
    try {
      // createShareLink first verifies the browser identity. Failure is
      // retryable; the durable outbox remains intact and no POST is sent.
      worked=await createShareLink();
      if(worked) {
        await cancelShareIntent(documentId,leased.clientRequestId);
      } else {
        const blocked=shareAttemptKindRef.current==="blocked";
        await releaseShareIntent(documentId,token,blocked?"blocked":"retryable",blocked?"identity":"server");
      }
    }catch{
      await releaseShareIntent(documentId,token,"retryable","network").catch(()=>{});
    }finally{
      setQueuedShare(await getShareIntent(documentId).catch(()=>null));
    }
    } finally {
      outboxFlightRef.current=false;
      nextOutboxProbeRef.current=Date.now()+12000;
    }
  },[backendReady,createShareLink,documentId,getSnapshotValues,isReady,normalizedRevision]);
  const retryQueuedShare = useCallback(async () => {
    try {
      await resetShareIntentRetry(documentId);
      setQueuedShare(await getShareIntent(documentId));
      await processQueuedShare(true);
    } catch (cause) {setError(cause instanceof Error ? cause.message : "Tekrar deneme başarısız.");}
  },[documentId,processQueuedShare]);
  // The parent studio passes a fresh getSnapshotValues closure on form edits.
  // Preserve the newest callback without resubscribing/re-reading IndexedDB on every render.
  const latestQueueProcessorRef = useRef(processQueuedShare);
  useEffect(() => { latestQueueProcessorRef.current = processQueuedShare; }, [processQueuedShare]);
  // Works while this document is open/visible. No background sync, push or silent sending on a closed app.
  useEffect(() => {
    let active=true;
    void getShareIntent(documentId).then(item=>{if(active)setQueuedShare(previous =>
      previous?.clientRequestId === item?.clientRequestId &&
      previous?.status === item?.status &&
      previous?.attempts === item?.attempts &&
      previous?.nextRetryAt === item?.nextRetryAt &&
      previous?.leaseUntil === item?.leaseUntil ? previous : item)}).catch(()=>{});
    const resume=()=>{if(document.visibilityState==="visible")void latestQueueProcessorRef.current().catch(()=>{})};
    window.addEventListener("online",resume);
    window.addEventListener("pageshow",resume);
    document.addEventListener("visibilitychange",resume);
    // A one-shot timer could fire during another tab's lease and never wake again.
    // Keep rearming while this visible document has an unfinished intent, without Background Sync.
    let timer: number | undefined;
    const schedule = () => {
      if (!active || !queuedShare || queuedShare.status === "blocked") return;
      const now = Date.now();
      const earliest = Math.max(
        now + 15_000,
        queuedShare.nextRetryAt || 0,
        queuedShare.leaseUntil && queuedShare.leaseUntil > now ? queuedShare.leaseUntil + 750 : 0,
        nextOutboxProbeRef.current,
      );
      timer = window.setTimeout(() => { if (active) { resume(); schedule(); } },
        Math.min(60_000, Math.max(1000, earliest - now)));
    };
    if (queuedShare) { resume(); schedule(); }
    return ()=>{active=false;window.removeEventListener("online",resume);
      window.removeEventListener("pageshow",resume);
      document.removeEventListener("visibilitychange",resume);
      if(timer)clearTimeout(timer)};
  },[documentId,queuedShare?.clientRequestId,queuedShare?.nextRetryAt,queuedShare?.leaseUntil,queuedShare?.status]);

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
    queueShareLink,
    cancelQueuedShare,
    retryQueuedShare,
    queuedShare,
    connectionState,
    revokeLink,
    resetShareState,
    refreshDeviceLinks,
    refreshQuota,
  };
}
