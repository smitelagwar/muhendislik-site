# G09 — Uygulama paketi kaydı

[Dizin](README.md) · [Kayıt sözleşmesi](20_KAYIT_VE_KANIT_SISTEMI.md)

| Alan | Kayıt |
|---|---|
| Plan revizyonu / D / R / UI | EXEC-2 + U1/U2/U3 · D01, D06, D13 · R13, R14 · V12 · C02 · F06, F15 |
| G / SES / başlangıç SNAP / son SNAP | G09 · SES-20260919-10 · SNAP-0001 → SNAP-0001 |
| Uygulama durumu | IMPLEMENTER_VERIFIED |
| Bağımsız denetim | NOT_REVIEWED — yalnız Astra doldurur |
| Giriş koşulları ve gerçek kanıt | G08 (eğri, hatch, çizgi ve çizim sırası) doğrulandı |

## Uygulanan davranış

1. **Pafta ve Viewport Yöneticisi (LayoutManager):**
   - `src/lib/cad-v2/layout/layout-manager.ts`:
     - **Model -> Paper 2D Affine Dönüşüm Matrisi (`modelToPaper`):** Viewport kağıt merkezi, boyutu, model görünüm merkezi, görünüm yüksekliği ve twist (rotasyon) açısını birleştiren 2D afin dönüşüm matrisi (`a, b, c, d, tx, ty`) hesaplandı.
     - **Ters Dönüşüm Matrisi (`paperToModel`):** Kağıt üzerindeki bir noktanın model uzayındaki karşılığını tam matematiksel terslenebilirlikle ($P = M^{-1}(M(P))$) geri çözer.
     - **Viewport Twist (Rotasyon Açısı):** Model alanı döndürülmüş olsa dahi paftanın dünya eksenleri bağımsız kalır; kamera rotasyonu ve viewport twist ayrımı korundu.
     - **Liang-Barsky 2D Çizgi Kırpma:** Model alanı varlıklarının viewport sınırları dışına taşması kağıt alanı BBox sınırlarında parametrik olarak kırpılır; taşma ve sızıntı önlenir.
     - **Viewport Başına Katman Dondurma (`frozenLayers`):** Aynı paftada iki farklı viewport tanımlandığında (örneğin Mimari ve Elektrik), global katman görünürlüğünün yanı sıra viewport'a özel dondurulan katmanların görünmezliği teyit edildi.

2. **Dış Bağımlılık (XREF) Grafiği ve Güvenlik Sınırları:**
   - `src/lib/cad-v2/layout/layout-manager.ts`:
     - XREF bağımlılık grafiğinde döngüsel referanslar (`A -> B -> C -> A`) derinlemesine arama (DFS) ile tespit edilerek `ERR_CYCLIC_XREF_DETECTED` tanısıyla engellendi.
     - Dosya yollarında `..` veya mutlak sistem yolları içeren Path Traversal saldırı girişimleri `SEC_PATH_TRAVERSAL_DETECTED` tanısıyla engellendi.
     - Güvenli olmayan harici HTTP/UNC fetch veya aktif OLE içerik çalıştırma kesin olarak devre dışı bırakıldı (R14).

## Değişiklik dökümü

| Dosya / sembol | Ekleme/değiştirme/silme | Neden / R | Önce/sonra hash veya SNAP | Korunan davranış |
|---|---|---|---|---|
| `src/lib/cad-v2/layout/layout-manager.ts` | Ekleme | R13, R14 pafta, viewport ve XREF yöneticisi | Yeni dosya | Bağımsız V2 |
| `tests/cad-v2/layout-viewport.test.ts` | Ekleme | G09 pafta ve viewport test paketi | Yeni dosya | İzolasyon korundu |
| `package.json` | Değiştirme | `check:cad-v2:unit` güncellemesi | SNAP-0001 | Korundu |

## Test ve görsel kanıt

| R / UI | Gerçek komut/test | RUN / ART / SNAP | Sonuç | Eksik / sınırlama |
|---|---|---|---|---|
| R13, R14 | `npx tsx tests/cad-v2/layout-viewport.test.ts` | RUN-0019 / SNAP-0001 | PASS (exit 0) | 6 test (ModelToPaper, Invertibility, Twist, Liang-Barsky clip, Per-viewport freeze, Cyclic XREF & Path traversal) geçti |
| Regresyon | `npm run check:cad-v2:release` | RUN-0020 / SNAP-0001 | PASS (exit 0) | G00–G09 tüm testler ve CLI derleme geçti |
| Tip Kontrolü | `npx tsc --noEmit -p tsconfig.next.json` | RUN-0021 / SNAP-0001 | PASS (exit 0) | 0 hata |

## Başarısızlık ve düzeltmeler

Viewport twist açısının $\theta$ olması durumunda dönüşüm formülü $a = s \cos\theta, b = -s \sin\theta, c = s \sin\theta, d = s \cos\theta$ ve model merkezinin ötelemesi $tx = px - (a \cdot mx + c \cdot my)$ şeklinde düzenlenerek ters matrisin birebir orijinal noktayı geri getirdiği test edildi.

## Açık CR / eksik / sonraki bağımlılık

Açık CR yoktur. Sıradaki adım: G10 (Chunk, scheduler ve RAM cache).

## Uygulayıcı kapanışı

G09 paketi (pafta ve model ayrımı, viewport afin dönüşümü, ters dönüşüm, Liang-Barsky kırpma, viewport katman dondurma ve döngüsel XREF koruması) başarıyla tamamlandı ve doğrulandı.
