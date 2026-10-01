# PDF Görüntüleyici v3 — Faz R0 Teşhis ve Baz Çizgisi Raporu

> **Tarih:** 2026-10-01  
> **Branch:** `pdf-v3` (temel: `pdf-v2` HEAD / `a2bb50e` canlı dağıtımı)  
> **Canlı Dağıtım (Production):** `https://muhendislik-site.vercel.app` (Deployment `dpl_2n7gf8NAWrWeL9ABrrRrE8gqVyaU`)  
> **Önceki Kararlı Sürüm (v1 Baseline):** Git tag `pdf-v1-baseline` (`4511677`), Vercel Deployment `dpl_5xrsMtgshSvcwTN4oH3FBNkecoeo`  
> **İncelenen Test Dosyaları:**
> 1. `tests/fixtures/pdf/manual/Copilot - korelasyon.pdf` (353.490 bayt, 13 sayfa, kullanıcı bildirimi yapılan dosya)
> 2. Canlı sistemdeki gerçek dokümanlar (`A3 KAĞIT DEMİRCİYE VERİLECEK HER KATTA-Model.pdf`, `MUSTAFA SELVİ MİMARİ-Model.pdf`, `beton-dokum-tutanagi.pdf`, vb.)

---

## 1. 0.1 Canlı Durum Kaydı

- **v1 Baseline:** `pdf-v1-baseline` etiketi (`4511677`). V1'de sayfa kesilmesi (clipping) yoktu; arama vurgu ofseti kayması bilinen tek eksikti.
- **v2 Faz Commit Listesi (`pdf-v1-baseline..HEAD`):**
  - `b2399a3` feat(pdf-v2): faz K — kalite kapisi guncellemesi ve dogrulama [skip ci]
  - `2283aee` feat(pdf-v2): faz J — performans butcesi ve regresyon raporu [skip ci]
  - `402052a` feat(pdf-v2): faz I — erisilebilirlik ve mobil duzen [skip ci]
  - `c877c1c` feat(pdf-v2): faz H — okuma konumu ve ayarlar [skip ci]
  - `014419b` feat(pdf-v2): faz G — gezinme, scrubber, icindekiler, linkler ve kucuk resimler [skip ci]
  - `f29a48c` feat(pdf-v2): faz F — zoom, jestler ve klavye kisayollari [skip ci]
  - `06ad005` feat(pdf-v2): faz E — arama motoru, vurgulama, aktif eslesme ve sonuc paneli [skip ci]
  - `ff5b698` feat(pdf-v2): faz D — metin katmani, secim, kopyalama ve hizalama [skip ci]
  - `8af42cb` feat(pdf-v2): faz C — sayfa yerlesimi, cift tampon, render kuyrugu ve pencereleme [skip ci]
  - `c392978` feat(pdf-v2): faz B — yukleme hatti: guvenlik, range, retry, sifre, onbellek [skip ci]
  - `e22c3ca` chore(pdf-v2): update regenerated pdf binary fixtures [skip ci]
  - `14a5efe` fix(pdf-v2): faz A1 — test 1 assertion katiligi ve dinamik manifest dogrulamasi [skip ci]
  - `a6a560b` feat(pdf-v2): faz A1 — test altyapisi ve fixture'lar [skip ci]
  - `b9420f7` docs(pdf-v2): faz A0 denetim ve baz cizgisi raporu
- **Canlı Dağıtım Durumu:** `origin/main` branch'inde `a2bb50e` commit'i ile Vercel Production'a deploy edilmiş, canlıda çalışmaktadır.

---

## 2. 0.2 Yeniden Üretim ve Karşılaştırma Matrisi

`Copilot - korelasyon.pdf` dosyası üzerinde gözlenen H1–H5 hatalarının ortamlar arası varlık tablosu:

| Hata Kodu | Hata Tanımı | Canlı Sitede (`a2bb50e`) | Local v2 HEAD | `pdf-v1-baseline` |
|---|---|---|---|---|
| **H1** | Sayfa içeriği sağ kenarda kesiliyor (kırpılma) | **VAR** (Kanıt: `r0-live-5-zoom-custom.png`, 90.7 px kırpılma) | **VAR** | **YOK** (v1'de `currentWidth / renderedWidth` oranı kullanıldığı için taşma imkansızdı) |
| **H2** | Metin bulanık (Düşük bitmap çözünürlüğü) | **VAR** (`bitmapPerCssPx = 0.524` ~ 0.64; bitmap CSS ile büyütülüyor) | **VAR** | **YOK / KISMEN** (v1'de render doğrudan DPR ile çiziliyordu) |
| **H3** | Bazı harflerin şekil bozukluğu ("ə" benzeri görünüm) | **VAR** (Bulanıklık ve CSS scale enterpolasyonundan kaynaklı piksellenme) | **VAR** | **YOK** |
| **H4** | Kopyalamada küçük "i" → "Ĝ" (U+011C) olması | **VAR** (461 adet `\u011c` karakteri, 0 adet `i`) | **VAR** | **VAR** (Chrome Native / Acrobat / pypdf'te de aynı; PDF ToUnicode kaynaklı) |
| **H5** | "i" içeren kelimelerde aramanın eşleşmemesi | **VAR** ("ilişki" bulunamıyor; "korelasyon" bulunuyor) | **VAR** | **VAR** (H4'e doğrudan bağlı) |

---

## 3. 0.3 Geometri ve Netlik Ölçümleri (Ampirik Kanıtlar)

Canlı sitede (`https://muhendislik-site.vercel.app/dokumantasyon/dosya/e99ee357-3107-42d6-a353-fa0706795123`) Playwright ile çalışan `scripts/diagnostics/measure-live-pdf.mjs` betiği üzerinden alınan ölçümler:

| Adım / Mod | Zoom Göstergesi | `pageBox` (Kutu) W×H | `canvasBox` (Görünür Tuval) W×H | `bitmap` (Px) W×H | `bitmapPerCssPx` | `hasTransform` & Transform Değeri | Metin Taşması / Kırpılma (`textClippedPx`) |
|---|---|---|---|---|---|---|---|
| **1. Başlangıç (Genişlik)** | 229% | 1363 × 1927 px | 714 × 1010 px | [714, 1010] | 1.000 | false (`none`) | 0 px (Tuval kutudan küçük kalmış) |
| **2. Sayfaya Sığdır (Sayfa)** | 92% | 547 × 774 px | **219.8 × 311.0 px** | [714, 1010] | 3.248 | true (`scale(0.401747)`) | 0 px (Tuval sol üst köşeye büzülmüş, sayfa kutusunun %40'ını kaplıyor!) |
| **3. Genişliğe Sığdır (Genişlik)** | 229% | 1363 × 1927 px | 1363 × 1927 px | [714, 1010] | **0.524** (Bulanık!) | false (`none`) | 0 px |
| **4. Orijinal Boyut (%100)** | 100% | 595 × 841 px | 595 × 841 px | [595, 841] | 1.000 | false (`none`) | 0 px |
| **5. Özel Zoom (Yakınlaştırma)** | 195% | **1160 × 1641 px** | **1450 × 2051 px** | [928, 1313] | **0.640** (Bulanık!) | true (`scale(1.25)`) | **90.7 px KESİLME (H1 KANITI)** |

### 0.3 Analiz ve H1 Kırpılma Kanıtı:
- Adım 5'te sayfa kutusu genişliği `1160px` (`overflow: hidden`).
- Canvas ve TextLayer `transform: scale(1.25)` ile genişletilerek `1450px` genişliğe ulaşıyor.
- Metin katmanındaki sağ sınır `maxSpanRight = 1383.2px`, sayfa kutusu sağ kenarı ise `1292.5px`.
- **Fark:** `1383.2 - 1292.5 = 90.7 px`.
- Sağ kenardaki metinler ("ilişkinin (birlikte değ...", "(deneysel işlem) yapılmayan araşt...") beyaz kartın sağından taşarak CSS `overflow: hidden` nedeniyle **tam 90.7 piksel boyunca jilet gibi kesilmektedir**.
- Görsel kanıt: [r0-live-5-zoom-custom.png](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/docs/pdf-viewer-v3/kanit/r0-live-5-zoom-custom.png)

---

## 4. 0.4 Hata Hangi Commit'te Başladı? (Kök Neden Tespiti)

### H1 (Sağ Kenar Kesilmesi) ve H2 (Bulanıklık) Kök Nedeni:
- **Kaynak Dosya:** `src/components/dokumantasyon/studio/pdf/pdf-page-view.tsx` (Satır 356–357, 404–406, 422–424) ve `pdfjs-studio.tsx`.
- **Bozulmanın Başladığı Faz:** `8af42cb` (Faz C) ve `f29a48c` (Faz F) / `06ad005` (Faz E).
- **Mekanizma Açıklaması:**
  1. `pdf-v1-baseline`'da transform oranı şu şekilde hesaplanıyordu:
     ```ts
     const visualRatio = renderedWidth > 0 ? currentWidth / renderedWidth : 1;
     ```
     Bu formülde `renderedWidth * visualRatio === currentWidth` olmak **zorundaydı**. Tuval hiçbir zaman dış kapsayıcı `currentWidth`'ten daha büyük olamazdı.
  2. Faz C ve Faz F'de bu mantık değiştirilerek şu hale getirildi:
     ```ts
     const visualRatio = lastRenderedScale > 0 ? scale / lastRenderedScale : 1;
     ```
  3. Ancak `renderedWidth` değeri zaten `viewport.width` (`Math.floor(baseWidth * effectiveRenderedScale)`) üzerinden hesaplanmaktadır.
  4. React render döngüsünde `effectiveRenderedScale` güncellendiğinde `viewport` yeni ölçeğe geçer, fakat `lastRenderedScale` state'i ancak kuyruktaki render tamamlandığında güncellenir.
  5. Sonuç: Canvas zaten yeni ölçekteki genişliğe (`renderedWidth`) sahipken, üstüne bir kez daha CSS `transform: scale(scale / lastRenderedScale)` uygulanır (**çifte ölçekleme / double scaling**).
  6. Yakınlaştırmada canvas kutudan %25–%40 daha büyük hale gelir ve `overflow: hidden` sağ kenarı keser (H1).
  7. Küçültmede (Sayfa modunda) canvas kutunun içinde küçücük bir köşeye büzülür (`scale(0.40)`).
  8. Düşük çözünürlüklü bitmap (örn. 714px veya 928px), CSS ile 1363px/1450px'e gerdirildiği için `bitmapPerCssPx` 0.52'ye düşer ve harfler bulanıklaşır (H2).

---

## 5. 0.5 Metin ve Font Teşhisi (H3, H4, H5)

### a) Referans Karşılaştırma Tablosu (`Copilot - korelasyon.pdf`):
| Görüntüleyici / Araç | Ekranda Görünen Metin | Kopyalanan / Çıkarılan Metin |
|---|---|---|
| **Google Chrome Native PDF Viewer** | "ilişkinin", "değişken" | `ĜlĜşkĜnĜn`, `değĜşken` |
| **Adobe Acrobat Reader** | "ilişkinin", "değişken" | `ĜlĜşkĜnĜn`, `değĜşken` |
| **Python `pypdf` kütüphanesi** | — | `ĜlĜşkĜnĜn`, `değĜşken` |
| **Sitemiz (pdfjs-dist 6.3.289)** | "ilişkinin", "değişken" | `ĜlĜşkĜnĜn`, `değĜşken` |

### b) Ham Metin ve Karakter Kod Noktaları Dökümü (`scripts/diagnostics/diagnose-text-and-fonts.mjs`):
- Toplam karakter sayısı: 7332
- `Ĝ` (U+011C, LATIN CAPITAL LETTER G WITH CIRCUMFLEX) karakter sayısı: **461 adet (%6.29)**
- Standart küçük `i` (U+0069, LATIN SMALL LETTER I) karakter sayısı: **0 adet (%0.00)**
- Kod noktası analizi:
  - `Ĝ` -> `U+011c`
  - `l` -> `U+006c`
  - `ş` -> `U+015f`
  - `k` -> `U+006b`
  - `n` -> `U+006e`
  - Çıkarılan satır: `"ĜlĜşkĜnĜn (bĜrlĜkte değĜşĜmĜn)"`

### c) Font Bilgisi:
- PDF üreticisi (Microsoft Word / Copilot PDF Exporter), alt-küme font oluştururken `i` harfinin glif indeksini Unicode `U+011C` (`Ĝ`) karakterine eşleyen bozuk bir **ToUnicode CMap** tablosu gömmüştür.
- Glif vektörü Türkçe küçük "i" çizmektedir (bu yüzden ekranda doğru görünür), fakat metin eşleme tablosu `U+011C` vermektedir.

### d) Teşhis Kararı:
- **Hipotez K1 (PDF Kaynaklı Bozuk ToUnicode Eşlemesi) %100 KESİNLİKLE DOĞRULANMIŞTIR.**
- Hata sitemizin font veya pdf.js motoru kaynaklı değildir; PDF'in kendi binary ToUnicode yapısından kaynaklanmaktadır.
- H5 (arama çalışmaması), H4'ün doğrudan bir sonucudur: Kullanıcı "ilişki" aradığında, çıkarılan metinde sadece "ĜlĜşkĜ" bulunduğu için string araması başarısız olmaktadır.

---

## 6. Teşhis Tablosu

| Hata | Belirti | Doğrulanmış Kök Neden | Dosya ve Satır | Düzeltme Fazı | v1'de Var mıydı? |
|---|---|---|---|---|---|
| **H1** | Sayfa sağ kenarında 90px kesilme | `pdf-page-view.tsx` içindeki `visualRatio` hesabı (`scale / lastRenderedScale`) ile `renderedWidth` çifte ölçekleniyor; container `overflow: hidden` kesiyor. | `src/components/dokumantasyon/studio/pdf/pdf-page-view.tsx:356-372` | **Faz R2** | **HAYIR** (v1'de yoktu) |
| **H2** | Metin bulanık | `bitmapPerCssPx` değerinin 0.52'ye düşmesi; eski/küçük bitmap'in CSS transform ile gerdirilmesi. | `src/components/dokumantasyon/studio/pdf/pdf-page-view.tsx:210-235` | **Faz R2** | **HAYIR** (v1'de yoktu) |
| **H3** | Bazı harflerin şekil bozukluğu | H2 bulanıklığı ve CSS `scale()` enterpolasyonunun alt-piksel render artefaktı. | `src/components/dokumantasyon/studio/pdf/pdf-page-view.tsx:406` | **Faz R2** | **HAYIR** (v1'de yoktu) |
| **H4** | Kopyalamada `i` -> `Ĝ` | PDF'in gömülü ToUnicode CMap tablosunun bozuk olması (Hypothesis K1). | PDF binary yapısı (`Copilot - korelasyon.pdf`) | **Faz R3 (Durum B: 1:1 onarım)** | **EVET** (Tüm PDF okuyucularda var) |
| **H5** | Arama "i" harfinde çalışmıyor | H4 nedeniyle metin indeksinde "ilişki" yerine "ĜlĜşkĜ" bulunması. | `src/lib/dokumantasyon/studio/pdf/pdf-search-engine.ts` | **Faz R3 (Durum B: arama indeksi onarımı)** | **EVET** |

---

## 7. Karar Kapısı (Decision Gate) ve AI Önerisi

Planda sunulan üç seçenek:
- **(a) İleriye doğru düzelt (Faz R1 → R2 → R3):**
  - R1'de geometri değişmezlerini (I1–I8) ölçen testleri yazıp kırmızı yapmak.
  - R2'de tek doğruluk kaynaklı geometri (`computePageGeometry`), epoch kontrolü ve container/canvas uyumu ile H1, H2, H3'ü çözmek.
  - R3'te Durum B kapsamında tespit imzalı (`Ĝ >= 1% && ASCII i < 0.5%`) 1:1 şeffaf metin onarımı (`pdf-text-repair.ts`) ile H4 ve H5'i çözmek.
- **(b) Kusurlu faz commit'lerini geri almak (`git revert`):**
  - Faz C/E/F'i geri almak, Faz G/H/I/J/K'deki gezinme, scrubber, gece modu gibi stabil özellikleri de bozacaktır.
- **(c) `pdf-v1-baseline`'a tam dönüş (Vercel Instant Rollback):**
  - Canlı sitedeki kesilmeyi anında durdurmak için Vercel üzerinde önceki v1 dağıtımı geçici olarak promote edilebilir; geliştirme `pdf-v3` branch'inde sürdürülür.

### AI Kanıta Dayalı Önerisi:
Kök nedenler matematiksel olarak tek bir dosyada (`pdf-page-view.tsx` içindeki `visualRatio` ve geometri hesabı) ve font ToUnicode yapısında kesinleştiği için **Seçenek (a) İleriye Doğru Düzeltme (R1 → R3)** en temiz ve en sağlam yoldur. v2 ile gelen gece modu, içindekiler, scrubber, sayfa önbelleği ve klavye kısayolları korunarak H1, H2, H3, H4, H5 kalıcı olarak çözülecektir.
Canlıdaki kullanıcı deneyimini acil kurtarmak istenirse Vercel Dashboard'dan tek tıkla v1 dağıtımı promote edilebilir.

---

## 8. Faz R0 Kabul Kriterleri Doğrulama Özeti

| Kriter | Durum | Kanıt |
|---|---|---|
| H1–H4 v1 / HEAD karşılaştırması | ✅ | Bölüm 2 tablosu ve Bölüm 4 git analizi |
| İlk bozan commit tespiti | ✅ | `8af42cb` (Faz C) / `06ad005` (Faz E) `visualRatio` değişikliği |
| Kök neden kanıtlı tespiti | ✅ | Bölüm 3 geometri ölçüm tablosu (`90.7px` kesilme, `bitmapPerCssPx = 0.524`) |
| 0.5a referans karşılaştırma tablosu | ✅ | Bölüm 5 tablosu (Chrome Native, Acrobat, pypdf, sitemiz) |
| Görsel kanıtlar | ✅ | `docs/pdf-viewer-v3/kanit/r0-live-5-zoom-custom.png`, `r0-live-2-sayfa-fit-page.png`, `r0-live-geometry.json` |
| Kaynak koda dokunmama kuralı | ✅ | Kaynak kod değiştirilmedi, yalnız teşhis betikleri ve kanıtlar üretildi |
