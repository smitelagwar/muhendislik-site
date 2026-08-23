# CAD Upstream Migration — Aşama 4 Site Host Entegrasyonu

Tarih: 23 Ağustos 2026

Branch: `feat/cad-upstream-transplant`

## Amaç

Aşama 3'te doğrulanan upstream-only adapter'ı sitenin önizleme kabuğuyla uyumlu bir React host component içine almak; bunu yaparken upstream CAD semantiğini yeniden yazmamak ve production runtime seçimini Aşama 5'e kadar değiştirmemek.

## Site sorumlulukları korunur

`FilePreviewShell` halihazırda şu görevleri üstlenir ve upstream host bunları tekrar uygulamaz:

- dosya başlığı ve metadata,
- geri navigasyonu,
- indirme,
- paylaşma,
- tam ekran,
- yeniden adlandırma,
- silme,
- PDF/image/text/markdown/CAD preview routing.

Bu görevler CAD motorundan ayrıdır ve olduğu gibi korunur.

## Yeni host

`src/components/dokumantasyon/preview/cad-upstream-viewer.tsx` yalnız şu görevleri üstlenir:

1. non-zero bir CAD viewport sağlar,
2. `CadUpstreamAdapter.create()` ile upstream çekirdeği başlatır,
3. access URL, display name ve extension değerlerini adapter'a verir,
4. loading/ready/error durumunu site UI tokenlarıyla gösterir,
5. hata halinde kontrollü retry sağlar,
6. `document.documentElement` class değişimini izleyerek light/dark temayı upstream'e uygular,
7. sistem renk tercihini de takip eder,
8. fetch/open işlemini `AbortController` ile mount lifecycle'a bağlar,
9. unmount/retry sırasında önceki `AcApDocManager.destroy()` tamamlanmadan yeni singleton başlatmaz,
10. `onReady` ve `onViewerFailure` callback'leri ile Aşama 5 orkestrasyonuna temiz sinyal verir.

## Bilerek yapılmayanlar

Aşama 4'te host:

- `dxf-viewer` import etmez,
- DXF normalize etmez,
- entity parse/render etmez,
- custom HATCH/linetype/lineweight/text mantığı yazmaz,
- APS seçmez,
- DWG→DXF conversion başlatmaz,
- MLightCAD simple-ui/export plugin eklemez,
- site download/share/fullscreen davranışını kopyalamaz.

Böylece site kabuğu ile CAD motoru arasındaki sınır korunur.

## Production routing

`FilePreviewShell` bu aşamada hâlâ mevcut `./cad-viewer` modülünü dynamic import eder. Yeni `DokCadUpstreamViewer` production CAD seçicisine bağlanmaz. Fast → Upstream → mevcut viewer → APS kararı Aşama 5'in konusudur.

Bu ayrım rollback güvenliği açısından zorunludur: Aşama 4 başarısız olsa dahi kullanıcıların mevcut `/dokumantasyon` CAD davranışı değişmez.

## Aşama 3 kanıtı

GitHub Actions `CAD upstream Stage 3 gate` run `32659843153`, job `97244320099` aşağıdaki adımların tamamını `success` ile bitirdi:

- exact root `npm ci --ignore-scripts`,
- upstream worker/WASM asset sync,
- Stage 3 contract gate,
- site-wide TypeScript typecheck,
- frozen production CAD surface diff kontrolü.

## Aşama 4 kabul kriterleri

Aşama 4 ancak aşağıdakilerin tamamı sağlanırsa kapatılır:

1. host yalnız stable upstream adapter'a bağlıdır,
2. custom CAD parser/renderer/fidelity katmanlarına coupling yoktur,
3. theme sync light/dark ve system değişimini kapsar,
4. listener/observer cleanup aynı callback referansı ile deterministiktir,
5. retry/unmount yeni singleton ile eski singleton arasında lifecycle yarışına izin vermez,
6. hata ve ready sinyalleri Aşama 5 için callback olarak dışarı verilir,
7. `FilePreviewShell` download/share/fullscreen sorumluluklarını korur,
8. production CAD route hâlâ mevcut `DokCadViewer` kullanır,
9. Stage 4 static contract gate `PASS` verir,
10. targeted lint ve site-wide typecheck başarılıdır,
11. production `next build` başarılıdır,
12. mevcut CAD/APS/worker/persistence routing dosyalarında istemsiz diff yoktur.

Aşama 5'e yalnız bu kabul kapısı yeşil olduğunda geçilir.
