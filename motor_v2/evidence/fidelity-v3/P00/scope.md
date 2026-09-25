# P00 — Başlangıç Fotoğrafı, Kapsam ve Referans Profili

**Tarih:** 20 Eylül 2026  
**Git HEAD:** `ebf244dadd4a18dcc9734cad322142e75ee0868f` (main branch, working tree clean)  
**Uygulayıcı:** Antigravity / Gemini 3.8 Flash High  
**Amaç:** V2 motorunun kök neden ve AutoCAD görünüş doğruluğu v3 planı kapsamında başlangıç baseline'ını, kaynak hash'lerini, geri dönüş noktasını, inceleme kayıtlarını ve referans profilini kurmak.  
**Production Kod Değişikliği:** YOK (P00 salt dokümantasyon, kanıt ve profil hazırlığıdır).

---

## 1. Kaynak ve Ortam Doğrulaması

### 1.1 Git ve Bağımlılık Hash'leri

| Varlık | Değer / SHA-256 | Durum |
|---|---|---|
| Git HEAD | `ebf244dadd4a18dcc9734cad322142e75ee0868f` | Doğrulandı (temiz) |
| Git Branch | `main` | Güncel |
| Rollback Ref | `ebf244dadd4a18dcc9734cad322142e75ee0868f` | Sabitlendi |
| `package.json` | `fabee4f427316f6e0e4ebbaad95ab0cb9391f130300ada2ac74ffc3cede14ef1` | Doğrulandı |
| `package-lock.json` | `a50f471eca80a0277e60525d36d1f97b82438beff186f7f967f9659e8a953f6a` | Doğrulandı |
| `audit.ts` Script | `8b41b106a66c768a040770f9c3552e9e918687b86f08d621f524f10d3b29bca2` | Doğrulandı |
| Plan v3 Belgesi | `51f51d9fc5cedd52100e156d5a2043ed22246d1c4d92f9a47e4e539113ced199` | Doğrulandı |

### 1.2 Fixture Kaynak Dosyaları

| Fixture ID | Dosya Yolu | Boyut (Byte) | SHA-256 |
|---|---|---:|---|
| **R001** | `eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg` | 3.444.087 | `17a92cb544830845fc59717abcc22d3cdcf97c12b8450602c9c70ec4a507f086` |
| **R002** | `eklediklerim/ornek_dosyalar/kiris_acilimlari_tum_katlar.dwg` | 2.139.550 | `9a59ff9e5496e2a3c62b378f062e5f0f3cfa707b9bd4b5a0bf6749cd8bf52459` |
| **R003** | `eklediklerim/ornek_dosyalar/MUSTAFA SELVİ 1.KISIM STATİK.dwg` | 16.084.252 | `8ff5680fa4f9d570fed738def92bc6ca8149fde1b5aed9e0a495dd2baaf521e6` |
| **R004** | `eklediklerim/ornek_dosyalar/SÜHEYLA KARA STATİK (HAFİF).dxf` | 55.259.742 | `36f87f826fe4dd9a8f03f8c83bafeeddfc84f1e0efada5c0fded8014a2ef7cf1` |

---

## 2. Kanıt Defteri: Ölçülen Bulgular, Kod Kusurları ve Çürütülen Hipotezler

### 2.1 Somut Kod Kusurları ve Ölçülmüş Bulgular

1. **Görünmez Blok Child'larının Çizilmesi (ÖLÇÜLDÜ + KOD KUSURU):**
   - Kaynak kod: [`src/lib/cad-v2/decode/dwg-adapter.ts#L95`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/lib/cad-v2/decode/dwg-adapter.ts#L95) içinde görünürlük `!ent.off && !ent.isInvisible` ile okunmaktadır. Kilitli `@mlightcad/libredwg-web@0.7.10` paketinde gerçek alan `isVisible`'dir.
   - Kaynak kod: [`src/lib/cad-v2/compile/block-transformer.ts#L128`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/lib/cad-v2/compile/block-transformer.ts#L128) child varlıkları işlerken `child.visible` kontrolü yapmamaktadır.
   - Ölçüm: R001 blok tanımlarında `isVisible === false` olan **3.973** adet child varlık vardır.
   - Kritik Outlier: `*U317` anonim bloğunda 157 varlığın **144'ü görünmezdir**. Parent INSERT `C6BC` üzerinden bu nesneler dünya koordinatlarında `[-13988.176, 21822.055]` aralığına fırlayarak sahne bounding box'ını yapay olarak sola çekmektedir.
   - Yalnız bellekte görünmezleri eleyen simülasyonda BBox `[-12538.174, 1832.357, 13671.170, 5174.717]` aralığına normalize olmakta ve chunk sayısı 35'ten 31'e düşmektedir.

2. **HATCH Alan Eşlemesi Kusuru (ÖLÇÜLDÜ + KOD KUSURU):**
   - Kaynak kod: [`src/lib/cad-v2/decode/dwg-adapter.ts#L260`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/lib/cad-v2/decode/dwg-adapter.ts#L260) içinde `const rawLoops = ent.loops || ent.boundaryLoops || [];` aranmaktadır.
   - Kilitli paketin gerçek alanı `boundaryPaths`'tir.
   - Ölçüm: R001 model space'inde 104 adet HATCH vardır; tüm bloklar dahil toplam 467 HATCH vardır ve **tamamında boundaryPaths mevcuttur**. Ancak mevcut adaptör ile canonical belgeye dönüştürüldüğünde **104 HATCH'in 104'ünde de loops dizisi BOŞ (`[]`)** kalmaktadır. Hiçbir tarama dolgusu çizilememektedir.

3. **Birim (INSUNITS) Eşleme Kusuru (ÖLÇÜLDÜ + KOD KUSURU):**
   - Kaynak kod: [`src/lib/cad-v2/decode/dwg-adapter.ts#L365`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/lib/cad-v2/decode/dwg-adapter.ts#L365) içinde `units: rawDb.header?.insunits || 5, // 5 = meters` yazılmıştır.
   - Kilitli pakette alan `rawDb.header.INSUNITS` (büyük harf) şeklindedir.
   - Ölçüm: R001 dosyasında `rawHeader.INSUNITS = 4` (milimetre)'dir. Küçük harfli alan `undefined` olduğu için `|| 5` fallback'i devreye girmekte ve canonical belgeye `units: 5` (santimetre) olarak geçmektedir. Ayrıca kod yorumundaki "5 = meters" varsayımı da teknik olarak yanlıştır (AutoCAD standardında 4=mm, 5=cm, 6=m).

4. **OCS ve Ters Z Extrusion (ÖLÇÜLDÜ + KOD KUSURU):**
   - Kaynak kod: `dwg-adapter.ts` ve `block-transformer.ts` extrusion vektörünü canonical'a taşımamakta ve tüm INSERT'leri standart WCS z=1 düzleminde kabul etmektedir.
   - Ölçüm: R001'de `extrusionDirection: [0, 0, -1]` olan **36 adet INSERT** vardır. Probe handle'ları: `1528D`, `1668B`, `14FEB`, `163E9`, `177EE`, `189FB`. Bu nesneler negatif X bölgesinde ters düzlem nedeniyle yanlış koordinatlara gitmektedir.

5. **Blok İçi Metin Kaybı (KOD KUSURU):**
   - Kaynak kod: [`src/lib/cad-v2/compile/block-transformer.ts#L143-L342`](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/src/lib/cad-v2/compile/block-transformer.ts#L143-L342) switch bloğunda `LINE`, `CIRCLE`, `ARC`, `LWPOLYLINE`, `HATCH`, `INSERT` yer almakta; `TEXT` ve `MTEXT` için hiçbir case bulunmamaktadır (`default: break`).
   - Ölçüm: Blok tanımlarında 763 TEXT ve 2.910 MTEXT bulunmaktadır. Ayrıca 1.814 üst DIMENSION nesnesi `*D` anonim blok INSERT'ine çevrilmektedir. Blok içi tüm ölçü metinleri ve açıklamalar expandInsert sırasında sessizce düşürülmektedir.

### 2.2 R001 İçin Çürütülen Eski Hipotezler

Aşağıdaki hipotezler önceki v2 planında ana neden olarak ileri sürülmüştü; R001 üzerinde yapılan gerçek çalıştırma ve ölçüm ile **ana neden olmadıkları kesin olarak kanıtlanmıştır**:

1. **Non-Uniform Scale Hipotezi (ÇÜRÜTÜLDÜ):**
   - İddia: "Blokların farklı X/Y ölçekleri nedeniyle elips/ark geometrileri bozuluyor ve üst üste biniyor."
   - Ölçüm: R001 içindeki tüm bloklarda `insertNonUniform = 0`'dır. R001'de hiçbir non-uniform INSERT bulunmamaktadır.
2. **500.000 Genişletme Sınırı Hipotezi (ÇÜRÜTÜLDÜ):**
   - İddia: "500.000 genişletme tavanı aşıldığı için çizim erken kesiliyor."
   - Ölçüm: R001'de toplam genişletme sayacı **69.668**'dir. Tavanın (%14'ü) çok altındadır. Limiti 1 milyona çıkarmak R001 için hiçbir şeyi değiştirmemektedir.
3. **Blok Tanımlarının Model Space'e Sızması Hipotezi (ÇÜRÜTÜLDÜ):**
   - İddia: "Blok definition varlıkları doğrudan model space koleksiyonuna karışıyor."
   - Ölçüm: `nonSpaceOverlapCount = 0`'dır. Model space varlıkları ile normal blok definition varlıkları arasında hiçbir handle çakışması yoktur.
4. **Paper Space Sızıntısı Hipotezi (ÇÜRÜTÜLDÜ):**
   - İddia: "Pafta nesneleri model alanına karışıp üst üste biniyor."
   - Ölçüm: R001'de `*Paper_Space` ve `*Paper_Space0` blokları tamamen boştur (`count = 0`).

---

## 3. Entrypoint Ayrımı ve Legacy Dokunulmazlığı

### 3.1 Korunan Legacy CAD Hattı (READ-ONLY)
- Dosyalar:
  - `src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx`
  - `src/components/dokumantasyon/preview/cad-upstream-viewer.tsx`
  - `src/components/dokumantasyon/preview/cad-viewer.tsx`
  - `src/components/dokumantasyon/preview/dxf-viewer-worker.ts`
  - `src/lib/dokumantasyon/cad-upstream/**`
- Korunan Golden Baseline: `909c59cb9dcac8e722b3bda4c66fd9d8a25755c8` (IGNORE2)
- Kurallar: Kullanıcı açıkça talep etmedikçe bu dosyalara dokunulmaz, refactor edilmez, fallback sırası değiştirilmez.

### 3.2 V2 Motor Kapsamı
- Dosyalar:
  - `src/components/dokumantasyon/cad-v2/**`
  - `src/lib/cad-v2/**`
  - `src/workers/cad-v2/cad-v2-scene-worker.ts`
  - `src/app/api/dokumantasyon/cad-v2/**`
- Erişim: `/dokumantasyon/dosya/[fileId]?cadEngine=v2`
- Testler: `check:cad-v2:unit`, `check:cad-v2:integration`, `check:cad-v2:ui`, `check:cad-v2:release`

### 3.3 Test İsmi Belirsizlik Kaydı
- `package.json` içindeki `check:cad-preview-v2` komutu `tests/document-studio/*.spec.ts` dosyalarını çalıştırır; bu komut legacy CAD preview motorunu test eder.
- `check:cad-preview-v2` komutunun PASS olması, `src/lib/cad-v2` motorunun test edildiği veya çalıştığı anlamına gelmez. V2 motoru yalnızca `check:cad-v2:*` scriptleri ile doğrulanır.

---

## 4. Test Çıktısı İzolasyon Politikası

- Kural: Testler ve CLI araçları kullanıcının `.data/cad-v2-scenes` klasörüne ve üretim Blob depolama alanına yazamaz.
- İzole Dizin: Test çıktıları `test-output/cad-v2-tmp/` veya OS geçici dizininde tutulur.
- Kullanıcının `.data/dok_db.json` ve mevcut sahne verileri korunur.

---

## 5. AutoCAD Referans ve Oracle Durumu

- Mevcut Durum: **NOT_RUN / BLOCKED**
- Gerekçe: Bu aşamada fiziksel ve lisanslı bir AutoCAD ortamından bağımsız referans raster/vektör çıktısı alınmamıştır.
- Kural: Hayali golden üretilmez. Legacy motor görüntüsü "AutoCAD referansı" olarak kabul edilemez.
- 10 Semantik ROI: `reference-profile.json` dosyasında tanımlanmış olup, P01-P08 ve F01-F08 paketlerinde doğrulanacak geometrik ve anlamsal bölgeleri belirler.

---

## 6. Bağımlılık Haritası ve Uygulama Sırası

```text
[P00: Baseline & Profil] (TAMAMLANDI)
  │
  ▼
[P01: Census, Provenance & Kalite Muhasebesi]
  │
  ▼
[P02: Transfer, Manifest & Worker/Host Doğruluğu]
  │
  ▼
[P03: Artifact Kimliği & Publish Transaction]
  │
  ▼
[P04: Gerçek Decoder Sözleşmesi (Visibility, HATCH, Ellipse, Units)]
  │
  ▼
[P05: OCS, Affine Stack & Mirrored Geometri]
  │
  ▼
[P06: Ortak Entity Compiler & Blok İçi Text]
  │
  ▼
[P07: Gerçek Sahne Komutları, Fill/Maske & Çizim Sırası]
  │
  ▼
[P08: R001 Kök Düzeltme Kabulü]
  │
  ▼
[F01..F08: Renk, Lineweight, Linetype, Font, Dim, Layout, Hassasiyet, Bellek]
  │
  ▼
[R01: Production Hazırlama & Çok Süreç Dayanıklılığı]
  │
  ▼
[V01: Son Kabul & Release Adayı]
```

---

## 7. Geri Dönüş / Rollback Talimatı

P00 sonrasında repo çalışma ağacı temiz kalmıştır. Gelecekteki herhangi bir pakette motor geri alınmak istenirse:

```bash
# Başlangıç noktasına tam geri dönüş:
git checkout main
git reset --hard ebf244dadd4a18dcc9734cad322142e75ee0868f
```

*Not: Legacy motor için korunan IGNORE2 commit'i `909c59cb9dcac8e722b3bda4c66fd9d8a25755c8`'dir. V2 motor dosyaları legacy commit'ine restore edilmez; V2'nin başlangıç referansı `ebf244dadd4a18dcc9734cad322142e75ee0868f`'tir.*
