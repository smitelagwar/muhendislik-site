// ============================================================================
// PDF v4 — BELGE KAYNAĞI (lease'ten bağımsız, kararlı açılış)
// ----------------------------------------------------------------------------
// Sorun (D2): imzalı URL (lease) yenilenince `accessUrl` prop'u değişir; eski kod bunu
// "yeni belge" sayıp belgeyi yok edip baştan yüklüyordu. Okuyan kullanıcı görünümü kaybediyordu.
// Çözüm: Belge kimliği URL'den ayrılır. Bayt'lar bir kez, güncel URL ile alınır:
//   - toplam boyut <= FULL_FETCH_LIMIT_BYTES  → tüm bayt'lar çekilir, getDocument({ data })
//   - daha büyük (ve sunucu Range destekliyorsa) → özel aralık aktarımı; her aralık isteği O ANKİ URL'i kullanır
// 401/403 → yeni lease istenir (refresh), en çok 3 deneme, üstel bekleme.
// Bu dosya pdf.js'e BAĞIMLI DEĞİL (aktarım sınıfı dışarıdan enjekte edilir) → Node'da test edilir.
// ============================================================================

export const FULL_FETCH_LIMIT_BYTES = 24 * 1024 * 1024; // bunun altı: tamamen indir
export const HARD_LIMIT_BYTES = 256 * 1024 * 1024; // Range desteği yoksa bunun üstü reddedilir
export const PROBE_BYTES = 64 * 1024; // ilk istek: 0..64KB-1

export interface PdfSourceCallbacks {
  /** Her çağrıda GÜNCEL lease URL'ini döndürür (ref üzerinden okur). */
  getUrl: () => string;
  /** 401/403'te çağrılır. Yeni lease dönerse `url` alanı kullanılır; yoksa getUrl() yeniden okunur. */
  refresh?: () => Promise<unknown>;
  onProgress?: (p: { loaded: number; total: number }) => void;
  onRefreshing?: (active: boolean) => void;
  /** Aralık aktarımı sırasında (belge açıldıktan sonra) kurtarılamayan hata. pdf.js aktarımında hata kanalı yoktur. */
  onFatal?: (err: unknown) => void;
  signal: AbortSignal;
  fetchImpl?: typeof fetch; // test için
  sleepImpl?: (ms: number, signal: AbortSignal) => Promise<void>; // test için
}

export class PdfSourceError extends Error {
  constructor(
    message: string,
    readonly kind: "http" | "range-unsupported" | "too-large" | "aborted" | "network",
    readonly status?: number
  ) {
    super(message);
    this.name = "PdfSourceError";
  }
}

export type PdfOpenSource =
  | { kind: "data"; data: Uint8Array }
  | { kind: "range"; length: number; initialData: Uint8Array; transport: RangeTransportLike };

/** pdf.js PDFDataRangeTransport'un kullandığımız yüzü. */
export interface RangeTransportLike {
  onDataRange(begin: number, chunk: Uint8Array): void;
}
export interface RangeTransportCtor<T extends RangeTransportLike> {
  new (length: number, initialData: Uint8Array): T & { requestDataRange?: (b: number, e: number) => void };
}

class LeaseUrl {
  private url: string;
  private seenProp: string;
  constructor(private readonly read: () => string) {
    this.url = this.seenProp = read();
  }
  current(): string {
    const p = this.read();
    if (p !== this.seenProp) {
      this.seenProp = p;
      this.url = p; // arka plan yenilemesi daha yeni URL getirdi
    }
    return this.url;
  }
  set(u: string): void {
    this.url = u;
  }
}

const defaultSleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new PdfSourceError("aborted", "aborted"));
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => { clearTimeout(t); reject(new PdfSourceError("aborted", "aborted")); }, { once: true });
  });

export function createLeaseFetcher(cb: PdfSourceCallbacks) {
  const lease = new LeaseUrl(cb.getUrl);
  const doFetch = cb.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
  const sleep = cb.sleepImpl ?? defaultSleep;

  async function fetchRange(range: string | null, attempt = 0): Promise<Response> {
    let res: Response;
    try {
      res = await doFetch(lease.current(), {
        signal: cb.signal,
        credentials: "same-origin",
        headers: range ? { Range: range } : undefined,
      });
    } catch (err) {
      if (cb.signal.aborted) throw new PdfSourceError("aborted", "aborted");
      throw new PdfSourceError(err instanceof Error ? err.message : "network", "network");
    }
    if ((res.status === 401 || res.status === 403) && cb.refresh && attempt < 3) {
      cb.onRefreshing?.(true);
      try {
        await sleep(500 * 2 ** attempt, cb.signal);
        const fresh = await cb.refresh();
        const u = (fresh as { url?: unknown } | null | undefined)?.url;
        if (typeof u === "string" && u) lease.set(u);
      } finally {
        cb.onRefreshing?.(false);
      }
      return fetchRange(range, attempt + 1);
    }
    return res;
  }
  return { fetchRange };
}

async function readBody(res: Response, expectedTotal: number, cb: PdfSourceCallbacks, already = 0): Promise<Uint8Array> {
  const total = expectedTotal > 0 ? expectedTotal : 0;
  if (!res.body) {
    const buf = new Uint8Array(await res.arrayBuffer());
    cb.onProgress?.({ loaded: already + buf.length, total: total || already + buf.length });
    return buf;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    if (loaded + already > HARD_LIMIT_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new PdfSourceError("PDF çok büyük", "too-large");
    }
    cb.onProgress?.({ loaded: already + loaded, total: total || already + loaded });
  }
  const out = new Uint8Array(loaded);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

function parseContentRangeTotal(h: string | null): number | null {
  const m = h?.match(/\/(\d+)\s*$/);
  return m ? Number(m[1]) : null;
}

/**
 * Belgeyi açmak için kaynak hazırlar.
 * İlk istek `Range: bytes=0-65535` (probe): toplam boyutu ve Range desteğini öğretir.
 */
export async function openPdfSource<T extends RangeTransportLike>(
  cb: PdfSourceCallbacks,
  Transport?: RangeTransportCtor<T>
): Promise<PdfOpenSource> {
  const { fetchRange } = createLeaseFetcher(cb);
  const probe = await fetchRange(`bytes=0-${PROBE_BYTES - 1}`);

  if (probe.status === 404) throw new PdfSourceError("PDF bulunamadı", "http", 404);
  if (probe.status === 401 || probe.status === 403) throw new PdfSourceError("Erişim reddedildi", "http", probe.status);

  // Sunucu Range'i yok saydı: gövde tüm dosyadır.
  if (probe.status === 200) {
    const len = Number(probe.headers.get("content-length") ?? 0);
    if (len > HARD_LIMIT_BYTES) throw new PdfSourceError("PDF çok büyük", "too-large");
    return { kind: "data", data: await readBody(probe, len, cb) };
  }
  // 416 Range Not Satisfiable: dosya 64KB'dan küçük olabilir veya Range desteklenmiyor; tüm dosyayı çekmeyi dene
  if (probe.status === 416) {
    const full = await fetchRange(null);
    if (!full.ok) throw new PdfSourceError(`HTTP ${full.status}`, "http", full.status);
    const len = Number(full.headers.get("content-length") ?? 0);
    if (len > HARD_LIMIT_BYTES) throw new PdfSourceError("PDF çok büyük", "too-large");
    return { kind: "data", data: await readBody(full, len, cb) };
  }
  if (probe.status !== 206) throw new PdfSourceError(`HTTP ${probe.status}`, "http", probe.status);

  const total = parseContentRangeTotal(probe.headers.get("content-range"));
  const first = new Uint8Array(await probe.arrayBuffer());
  if (!total || first.length >= total) {
    // Küçük dosya ya da toplam bilinmiyor: tek parça yeterli
    if (total && first.length >= total) {
      cb.onProgress?.({ loaded: total, total });
      return { kind: "data", data: first };
    }
    const full = await fetchRange(null);
    if (!full.ok) throw new PdfSourceError(`HTTP ${full.status}`, "http", full.status);
    return { kind: "data", data: await readBody(full, Number(full.headers.get("content-length") ?? 0), cb) };
  }

  if (total <= FULL_FETCH_LIMIT_BYTES || !Transport) {
    if (total > HARD_LIMIT_BYTES) throw new PdfSourceError("PDF çok büyük", "too-large");
    cb.onProgress?.({ loaded: first.length, total });
    const rest = await fetchRange(`bytes=${first.length}-`);
    if (rest.status === 200) {
      // Sunucu bu kez Range'i yok saydı: gövde tüm dosya
      return { kind: "data", data: await readBody(rest, total, cb) };
    }
    if (rest.status !== 206) throw new PdfSourceError(`HTTP ${rest.status}`, "http", rest.status);
    const tail = await readBody(rest, total - first.length, cb, first.length);
    if (first.length + tail.length !== total) throw new PdfSourceError("Eksik indirme", "network");
    const out = new Uint8Array(total);
    out.set(first, 0);
    out.set(tail, first.length);
    return { kind: "data", data: out };
  }

  // Büyük dosya: özel aralık aktarımı
  const transport = new Transport(total, first);
  transport.requestDataRange = (begin: number, end: number) => {
    void (async () => {
      try {
        const res = await fetchRange(`bytes=${begin}-${end - 1}`);
        if (res.status !== 206) throw new PdfSourceError(`Range ${res.status}`, res.status === 200 ? "range-unsupported" : "http", res.status);
        transport.onDataRange(begin, new Uint8Array(await res.arrayBuffer()));
      } catch (err) {
        if (!cb.signal.aborted) cb.onFatal?.(err);
      }
    })();
  };
  return { kind: "range", length: total, initialData: first, transport };
}
