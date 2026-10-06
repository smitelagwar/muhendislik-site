# A3 — Yükleme Dayanıklılığı: Sessiz Lease Yenileme + Range Sunucusu

**Amaç:** (1) Okurken belge yeniden yüklenmesin. (2) Erişim bağlantısı sessizce yenilensin. (3) Küçük belgeler tamamen indirilsin (süre dolsa da sorun olmasın). (4) Yerel Range endpoint'i standartlara uysun.
**Risk: YÜKSEK** — `pdfjs-studio.tsx` yükleme efektine dokunulur. Cerrahi ol, aşağıdaki kodu **kelimesi kelimesine** uygula.

**Dokunulacak dosyalar:**
- `src/lib/dokumantasyon/studio/pdf/pdfjs-loader.ts`
- `src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx`
- `src/app/api/dokumantasyon/files/[id]/stream/route.ts`
- `tests/document-studio/pdf-v4-stabilite.spec.ts` (yeni testler), `tests/pdf-v4/range.test.ts` (yeni birim test)

## Önce oku
- `pdfjs-studio.tsx`: yükleme efekti (`// 1. PDF Dokümanını Yükle…` yorumundan `}, [accessUrl, onAccessExpired, fileId, reloadKey, currentFileVersion, updateZoomState]);` satırına kadar, ≈585–801).
- `document-studio-shell.tsx`: `refreshCurrentLease`, 60 sn interval, `isAccessLeaseExpiring`, `isLocal`.
- `src/lib/dokumantasyon/` altında lease süresini (TTL) üreten dosyayı bul (`rg "isAccessLeaseExpiring|refreshDocumentAccessLease"`); TTL değerini rapora yaz.

## Bölüm A — Yükleyici: küçük belgeyi tam indir
`pdfjs-loader.ts` içinde `SecurePdfLoadingOptions`'a ekle:
```ts
  /** Dosya boyutu (bayt). Küçük belgelerde tam indirme açılır (bağlantı süresi dolsa da sayfalar kaybolmaz). */
  sizeBytes?: number;
```
ve sabit + hesap:
```ts
/** Bu boyutun altındaki belgeler arka planda tamamen indirilir. */
const TAM_INDIRME_ESIGI_BAYT = 30 * 1024 * 1024;
```
`createSecurePdfLoadingTask` içinde `docParams`:
```ts
  const tamIndir =
    typeof options?.sizeBytes === "number" &&
    options.sizeBytes > 0 &&
    options.sizeBytes <= TAM_INDIRME_ESIGI_BAYT;

  // ...
    disableRange: false,
    disableStream: false,
    disableAutoFetch: options?.disableAutoFetch ?? !tamIndir,
    rangeChunkSize: options?.rangeChunkSize ?? 524288, // 512 KB
```
(`disableAutoFetch` açıkça verilmişse o geçerli; yoksa küçükte kapalı=false.)

## Bölüm B — Studio: kararlı kaynak + sessiz takas
`pdfjs-studio.tsx` içinde aşağıdaki **beş** değişikliği yap; başka satıra dokunma.

### B1 — Ref'ler (≈satır 118–120, `lastContainerWidthRef` yanına ekle)
```ts
  const accessUrlRef = useRef(accessUrl);
  accessUrlRef.current = accessUrl;
  const onAccessExpiredRef = useRef(onAccessExpired);
  onAccessExpiredRef.current = onAccessExpired;
  const sizeBytesRef = useRef(sizeBytes);
  sizeBytesRef.current = sizeBytes;
  /** En son başarıyla yüklenen belgenin kimliği; aynı kimlikte yeni URL = sessiz takas. */
  const loadedDocKeyRef = useRef<string | null>(null);
  const sourceFailureCooldownRef = useRef(0);
```
`currentFileVersion` `useMemo`'su ve `reloadKey` state'i tanımlandıktan **sonra** bir `docKey` türet (yükleme efektinden hemen önce):
```ts
  const docKey = `${fileId ?? "anon"}|${currentFileVersion}|${reloadKey}`;
```

### B2 — Efekt başı (`let isMounted = true;` bloğu)
Mevcut:
```ts
    let isMounted = true;
    setLoading(true);
    setError(null);
    setErrorType(null);
    setLoadProgress(null);
```
Yeni:
```ts
    let isMounted = true;
    // Aynı belge, yalnızca erişim URL'si değişti → kullanıcıya hissettirmeden takas et.
    const silent = pdfDocRef.current !== null && loadedDocKeyRef.current === docKey;
    if (!silent) {
      setLoading(true);
      setError(null);
      setErrorType(null);
      setLoadProgress(null);
    }
    let inFlightTask: { destroy?: () => unknown } | null = null;
```

### B3 — Görev oluşturma ve takas (`const task = await createSecurePdfLoadingTask(…` bloğundan `setPdfDoc(doc);` satırına)
`createSecurePdfLoadingTask(accessUrl, {…})` çağrısına `sizeBytes: sizeBytesRef.current,` ekle; `onProgress` ve `onPassword` yalnız `silent` değilken ver:
```ts
        const task = await createSecurePdfLoadingTask(accessUrl, {
          sizeBytes: sizeBytesRef.current,
          onProgress: silent
            ? undefined
            : ({ loaded, total }) => {
                if (isMounted) setLoadProgress({ loaded, total });
              },
          onPassword: silent
            ? undefined
            : (callback, reason) => {
                if (!isMounted) return;
                passwordCallbackRef.current = callback;
                setPasswordReason(reason);
                setIsPasswordModalOpen(true);
                setLoading(false);
              },
        });
        inFlightTask = task;
        loadingTaskRef.current = task;

        const doc = await task.promise;
        if (!isMounted) return;

        if (silent) {
          // Sessiz takas: sayfa nesneleri yeni belgeden yeniden alınır, canvas'lar korunur
          // (PdfPageView aynı ölçek/açıda yeniden çizmez). Eski belge kısa gecikmeyle yok edilir.
          const eskiDoc = pdfDocRef.current;
          pdfDocRef.current = doc;
          setPdfDoc(doc);
          window.setTimeout(() => {
            try {
              eskiDoc?.destroy?.();
            } catch {}
          }, 2000);
          return;
        }

        setPdfDoc(doc);
```
(`setPdfDoc(doc)` satırından sonraki mevcut kod — `pdfDocRef.current = doc;` dahil — aynen kalır.)

Başarılı **sessiz olmayan** yüklemenin sonunda, `setLoading(false);` satırından **hemen önce** ekle:
```ts
        loadedDocKeyRef.current = docKey;
```

### B4 — Catch başı
`catch (err: unknown) {` içinde, `if (!isMounted) return;` satırından sonra ve `AbortException` kontrolünden sonra ekle:
```ts
        if (silent) {
          // Sessiz takas başarısız: mevcut belge çalışmaya devam eder, kullanıcıya hata gösterme.
          console.warn("PDF erişim bağlantısı sessiz yenilenemedi:", err);
          return;
        }
```
Aynı efekt içinde `await onAccessExpired();` çağrısını `await onAccessExpiredRef.current?.();` yap (iki yerde: koşul `isExpiredAccess && onAccessExpired && …` → `onAccessExpiredRef.current`).

### B5 — Cleanup ve bağımlılıklar
Mevcut cleanup (`return () => { isMounted = false; if (loadingTaskRef.current) … if (pdfDocRef.current) … };`) şuna dönüşür:
```ts
    return () => {
      isMounted = false;
      // Yalnız bu efektin başlattığı, henüz tamamlanmamış görev iptal edilir.
      // Yüklenmiş belge burada YOK EDİLMEZ (sessiz takas için); ayrı efekt yok eder.
      try {
        inFlightTask?.destroy?.();
      } catch {}
    };
  }, [accessUrl, docKey, updateZoomState]);
```
(Bağımlılık listesinden `onAccessExpired`, `fileId`, `reloadKey`, `currentFileVersion` çıkar: hepsi `docKey`/ref üzerinden izleniyor. ESLint `react-hooks/exhaustive-deps` uyarısı çıkarsa o satıra `// eslint-disable-next-line react-hooks/exhaustive-deps` + Türkçe gerekçe yorumu ekle.)

Yükleme efektinden **hemen sonra** belge yaşam döngüsü efekti ekle:
```ts
  // Belge kimliği değişince veya bileşen kalkınca eski belgeyi yok et (URL değişimi bunu tetiklemez).
  useEffect(() => {
    return () => {
      loadedDocKeyRef.current = null;
      if (loadingTaskRef.current) {
        try {
          loadingTaskRef.current.destroy?.();
        } catch {}
        loadingTaskRef.current = null;
      }
      if (pdfDocRef.current) {
        try {
          pdfDocRef.current.destroy?.();
        } catch {}
        pdfDocRef.current = null;
      }
    };
  }, [docKey]);
```
**Sıra önemli:** bu efekt, yükleme efektinden **sonra** tanımlanmalı; React cleanup'ları tanım sırasıyla çalıştırır, `docKey` değişince önce eski belge yok edilir, sonra yeni yükleme başlar ve `silent=false` olur (çünkü `pdfDocRef.current` null).

### B6 — Kaynak hatası kancası (A4 kullanacak)
Studio'da, `handleRetry`'ın yanında:
```ts
  /** Sayfa render'ı 401/403 gibi kaynak hatası alırsa çağrılır; en çok 5 sn'de bir lease yeniler. */
  const handleSourceFailure = useCallback(() => {
    const now = Date.now();
    if (now - sourceFailureCooldownRef.current < 5000) return;
    sourceFailureCooldownRef.current = now;
    void Promise.resolve(onAccessExpiredRef.current?.()).catch((err: unknown) => {
      console.warn("PDF kaynağı yenilenemedi:", err);
    });
  }, []);
```
Bu aşamada henüz kimse çağırmaz (`PdfPageView`'a A4'te bağlanır). `noUnusedLocals` hatası verirse `void handleSourceFailure;` ekleme; onun yerine A4'e kadar `PdfPageView`'a **kullanılmayan opsiyonel** `onSourceError` prop'u ver (A4 §E'de tanımlı) — **bu aşamada derleme kırılırsa** B6'yı A4'e ertele ve raporla.

## Bölüm C — Range endpoint
`src/app/api/dokumantasyon/files/[id]/stream/route.ts`: dosyanın üstüne **saf, dışa aktarılan** fonksiyon ekle:
```ts
/** RFC 9110 tek aralık: "bytes=a-b", "bytes=a-", "bytes=-n". Geçersiz/karşılanamaz → null (416). */
export function parseByteRange(
  header: string,
  size: number
): { start: number; end: number } | null {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || size <= 0) return null;
  const [, a, b] = m;
  if (a === "" && b === "") return null;
  let start: number;
  let end: number;
  if (a === "") {
    const n = parseInt(b, 10);
    if (!Number.isFinite(n) || n <= 0) return null;
    start = Math.max(size - n, 0);
    end = size - 1;
  } else {
    start = parseInt(a, 10);
    end = b === "" ? size - 1 : Math.min(parseInt(b, 10), size - 1);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= size || start > end) return null;
  return { start, end };
}
```
> Next.js route dosyaları yalnız belirli adları (`GET`, `dynamic`…) dışa aktarabilir; **`parseByteRange`'i route'tan export etme**. Onu `src/lib/dokumantasyon/range.ts` içine koy, route oradan import etsin. (Bunu yapmazsan `next build` hata verir.)

Route gövdesi:
- Range başlığı varsa `parseByteRange`; `null` ise 416 + `Content-Range: bytes */${fileSize}`.
- Akış: `import { Readable } from "node:stream";` ve
  ```ts
  const akis = fs.createReadStream(diskPath, { start, end });
  const govde = Readable.toWeb(akis) as unknown as ReadableStream;
  ```
  hem 206 hem 200 yanıtında kullan (200 için `{}` seçeneksiz tam akış). `fs.readFileSync` ve elle yazılmış `new ReadableStream({ start… })` kaldırılır.
- 200 ve 206 yanıtlarına `Accept-Ranges: bytes` zaten var; 416'ya da ekle.
- Mevcut yetkilendirme (`requireDokumantasyonAdmin`) ve başlıklar **aynen** kalır.

## Testler
1. **Birim:** `tests/pdf-v4/range.test.ts` (`tsx` ile, diğer `tests/pdf-v3/*.test.ts` kalıbında, `node:assert`): `bytes=0-99`→{0,99}; `bytes=100-`→{100,size-1}; `bytes=-500`→{size-500,size-1}; `bytes=0-99999999` size=1000 →{0,999}; `bytes=1000-` size=1000 →null; `bytes=5-2`→null; `abc`→null; `bytes=-0`→null; `bytes=--`→null. `package.json` `check:pdf-v3:unit` zincirine **değil**, yeni script `"check:pdf-v4:unit": "tsx tests/pdf-v4/range.test.ts"` olarak ekle.
2. **E2E (A1-T3):** lease yenilemesi sonrası `pdf-viewer-status` görünmemeli, `scrollTop` ±2 px içinde korunmalı, `pdf-page-3` hâlâ DOM'da. Yerel dosyada tetiklenemiyorsa `skip` kalır; bu durumda **ek test**: sayfa 3'teyken `window.dispatchEvent`'le değil, studio'ya `accessUrl` prop'unu değiştiren küçük bir test sayfası **yazma**. Bunun yerine `docs/pdf-studio-v4/MANUEL-KONTROL.md` içine "lease yenileme" manuel adımı ekle (A7 listesine girer) ve raporda belirt.
3. **Range e2e (yerel dosya):** `request.get(streamUrl, { headers: { Range: "bytes=-100" } })` → 206 ve `content-length: 100`; `bytes=0-99999999999` → 206 ve `content-range` `…/size`; `bytes=999999999999-` → 416.
4. Regresyon: `check:pdf-v3:unit`, `check:pdf-v3:invariants`, `pdf-viewer-v2-faz-b/-e/-h` spec'leri (yükleme, hata sınıflandırma, okuma konumu) hâlâ yeşil. Özellikle **parola**, **bozuk PDF**, **404** senaryoları (hata ekranları) ve "okuma konumu geri yükleme" testleri.

## Kapı
`tsc` yeşil + `check:pdf-v4:unit` yeşil + yukarıdaki regresyon spec'leri A1 tabanından **kötüleşmedi** + T3 (varsa) yeşil.

## Geri alma
`git restore` ile üç `src/` dosyasını geri al, `src/lib/dokumantasyon/range.ts` ve yeni testleri sil.
