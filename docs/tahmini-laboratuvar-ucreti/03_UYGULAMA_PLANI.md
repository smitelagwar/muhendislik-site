# Tahmini Laboratuvar Ücreti Hesaplama Aracı — Uygulama Planı

> **Amaç:** `/hesaplamalar` merkezine sade, gereksiz metinlerden ve karmaşadan tamamen arındırılmış, doğrudan sonucu gösteren **Tahmini Laboratuvar Ücreti (2026)** aracını eklemek.
> **Mimari:** Saf TypeScript hesaplama modülü (`src/lib/calculations/modules/laboratuvar-ucreti/`) + minimalist 2 sütunlu Next.js App Router istemci arayüzü (`src/app/hesaplamalar/laboratuvar-ucreti/`).
> **Araştırma Kaynakları:**
> - [01_MEVZUAT_VE_TARIFE_ARASTIRMASI.md](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/docs/tahmini-laboratuvar-ucreti/01_MEVZUAT_VE_TARIFE_ARASTIRMASI.md)
> - [02_SAHA_PIYASA_VE_YOUTUBE_ARASTIRMASI.md](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/docs/tahmini-laboratuvar-ucreti/02_SAHA_PIYASA_VE_YOUTUBE_ARASTIRMASI.md)

---

## Genel Kısıtlar (Kesin Kurallar)

1. **Sıfır Gereksiz Yazı:** Sayfada açıklayıcı paragraflar, uzun mevzuat özetleri, adım rehberleri, uyarı kutuları, PDF/PNG/Excel modal kalabalığı ve pazarlama metinleri **olmayacaktır**.
2. **Anlık ve Doğrudan Sonuç:** Kullanıcı yalnızca **İnşaat Alanı (m²)** ve **Kat Sayısı** girdiğinde (varsayılan `1.200 m²`, `5 Kat` ile ilk açılışta dahi hazır örnek sonuç görünür) ekranın sağında/üstünde doğrudan **Tahmini Laboratuvar Ücreti (TL)** ve 4 satırlık sade kalem dökümü görünür.
3. **Dark Industrial & Light/Dark Uyumu:** Mevcut site temasıyla (`PROJECT.md`) birebir uyumlu, `font-mono` sayısal çıktılı, mobil ve masaüstü (320px–1920px) taşmasız tasarım.
4. **Tek Doğruluk Kaynağı:** `src/lib/calculation-pages.ts` kaydı üzerinden `CalculationsSectionNav`, `route-metadata.ts`, `search-index.ts`, `sitemap.ts` ve `check-site-quality.ts` tam uyumlu olacak.

---

## İncelenecek Uç Durumlar (Review Focus)

1. **Sıfır / Negatif / Geçersiz Alan veya Kat Girdisi:** Virgül/nokta ayracı (`1200,5`), boş string veya `0` girildiğinde NaN/Infinity üretmeden güvenli doğrulama ve sade boş durum.
2. **C55+ Yüksek Dayanım Kuralı:** `C55+` seçildiğinde TS 13515 gereği taze beton numune adedinin ve buna bağlı EBİS çip adedinin tam `2×` artması.
3. **Küçük Döküm (0–24 m³) vs Büyük Döküm (>600 m³) Geçişleri:** Her katın kendi dökümünde minimum 8 numune sınırının uygulanması ve temel dökümünün alan/hacim kriterlerinden yüksek olanını alması.
4. **Özel Metraj/Fiyat Özelleştirmesi:** Kullanıcı manuel beton (m³), demir (ton), döküm adedi veya çip birim fiyatı girerse otomatik tahminlerin yerine bu değerlerin geçmesi; boş bırakılırsa otomatik değerlere dönmesi.
5. **Türkçe Karakter ve Kalite Kapısı (`check:site-quality`):** `calculation-pages.ts` içindeki tüm metinlerin mojibake olmadan temiz UTF-8 ile yazılması ve `/hesaplamalar` sekme filtresinde (`Maliyet`) yer alması.

---

## Görev Adımları

### Görev 1: Saf Hesaplama Motoru (`src/lib/calculations/modules/laboratuvar-ucreti/`)

**Dosyalar:**
- Oluştur: `src/lib/calculations/modules/laboratuvar-ucreti/types.ts`
- Oluştur: `src/lib/calculations/modules/laboratuvar-ucreti/constants.ts`
- Oluştur: `src/lib/calculations/modules/laboratuvar-ucreti/engine.ts`
- Oluştur: `src/lib/calculations/modules/laboratuvar-ucreti/index.ts`
- Güncelle: `src/lib/calculations/index.ts`

**Model & Formül Tasarımı:**
- **Girdiler (`LaboratuvarUcretiInput`):**
  - `area: number` (Toplam inşaat alanı, m²)
  - `floors: number` (Kat sayısı, 1–50)
  - `concreteGrade: "standard" | "high"` (`C25–C50` | `C55+`)
  - `sampleType: "cube" | "cylinder"` (`Küp` | `Silindir`)
  - `concreteM3?: number` (Opsiyonel; varsayılan `area * 0.38`)
  - `rebarTons?: number` (Opsiyonel; varsayılan `area * 0.036`)
  - `pourCount?: number` (Opsiyonel; varsayılan `1 + floors * 2`)
  - `karotCount?: number` (Opsiyonel; varsayılan `0`)
  - `chipUnitPrice?: number` (Opsiyonel; varsayılan `123.49` TL KDV hariç)
- **2026 Birim Fiyat Sabitleri (KDV Hariç):**
  - Ek-9 Küp: `167 TL` (Asgari) · `222 TL` (Orta) · `277 TL` (Azami)
  - Ek-9 Silindir: `231 TL` (Asgari) · `307 TL` (Orta) · `382 TL` (Azami)
  - EBİS RFID Çip (Aselsannet 2026 ref.): `123,49 TL / adet`
  - Demir Çekme + Kütle/Gözle Muayene (ÇŞİDB 2026 Döner Sermaye, 3'lü takım): `772,91 TL / takım`
  - Ek Karot (opsiyonel): `1.800 TL / adet` (piyasa ortalama)
  - KDV Oranı: `%20`
- **Numune Hesabı:**
  - Temel dökümü hacmi `~%28` toplam beton (veya taban alanı `area / floors`), kalan dökümler `(pourCount - 1)` eşit kat dökümü olarak bölünür; her döküm TS 13515 tablosundan `8 / 12 / 16 / 20 / 24 / 28 / 32 / 36 / 40+` numune üretir; `high` ise `×2`.
  - Demir takımı: `4–8` çap/parti grubu + 90 ton üstü her 30 tonda `+1` takım.
- **Çıktılar (`LaboratuvarUcretiResult`):**
  - `sampleCount`, `chipCount`, `steelTeamCount`, `pourCount`, `estimatedConcreteM3`, `estimatedRebarTons`
  - `concreteTestCostNet`, `chipCostNet`, `steelTestCostNet`, `karotCostNet`
  - `subtotalNet`, `vatAmount`, `totalGross` (ve asgari–azami aralığı: `minGross`, `maxGross`, `perSquareMeterGross`)

**Doğrulama:**
- `tests/calculations/laboratuvar-ucreti.test.ts` yazılarak TS 13515 kademeleri, C55+ `2×` kuralı, küp/silindir farkı, opsiyonel override'lar ve geçersiz girdiler test edilecek.

---

### Görev 2: Portal Entegrasyonu (`calculation-pages.ts` & `/hesaplamalar`)

**Dosyalar:**
- Güncelle: `src/lib/calculation-pages.ts` (order: 6, `id: "laboratuvar-ucreti"`, `href: "/hesaplamalar/laboratuvar-ucreti"`, `title: "Tahmini Laboratuvar Ücreti"`, `navLabel: "Laboratuvar Ücreti"`)
- Güncelle: `src/app/hesaplamalar/page.tsx`:
  - `activeTab === "cost"` filtresine `tool.id === "laboratuvar-ucreti"` eklenmesi
  - `6 Canlı Modül Hazır` güncellenmesi
  - Kart alt rozeti: `Ek-9 · EBİS · TS 708 · 2026`

---

### Görev 3: Sade Kullanıcı Arayüzü (`/hesaplamalar/laboratuvar-ucreti`)

**Dosyalar:**
- Oluştur: `src/app/hesaplamalar/laboratuvar-ucreti/page.tsx`
- Oluştur: `src/app/hesaplamalar/laboratuvar-ucreti/laboratuvar-ucreti-client.tsx`

**Ekran Düzeni (Maksimum Sadeliğe Odaklı):**
- **Üst Başlık:** Yalnızca başlık: `Tahmini Laboratuvar Ücreti` (altında tek satır kısa etiket: `2026 · Beton, EBİS Çip ve Demir Deneyi`).
- **Sol Panel (Girdiler):**
  1. `İnşaat Alanı (m²)` — sayı girişi (varsayılan `1200`)
  2. `Kat Sayısı` — sayı girişi (varsayılan `5`)
  3. `Beton Sınıfı` — `C25–C50` | `C55+`
  4. `Numune` — `Küp` | `Silindir`
  5. Tek satır açılır buton (`İsteğe Bağlı: Metraj ve Fiyat Ayarları`, varsayılan kapalı): `Beton (m³)`, `Demir (ton)`, `Döküm Sayısı`, `Ek Karot`, `Çip Fiyatı (TL)`
- **Sağ Panel (Sonuç — Direkt Çıktı):**
  - Ana Kart: **Tahmini Laboratuvar Ücreti (KDV Dahil)** büyük font-mono değer + hemen altında tek satır: `KDV Hariç: ... TL` · `m² Başına: ... TL/m²` · `Aralık: ... – ... TL`
  - Sade Döküm Listesi (yalnızca kalem adı, miktar ve tutar):
    - Taze Beton Deneyi (`N adet`)
    - EBİS Çip / Etiket (`N adet`)
    - Demir Çekme Deneyi (`K takım`)
    - *(Varsa)* Karot Deneyi (`M adet`)
    - KDV (%20)

---

### Görev 4: Test, Kalite Kapıları ve Vercel Yayını

1. `npx tsx --test tests/calculations/laboratuvar-ucreti.test.ts` — tüm birim testleri PASS
2. `npx tsc -p tsconfig.next.json --noEmit` — 0 hata
3. `npm run check:site-quality` — 0 sorun
4. `npm run build` — production build PASS
5. Yerel tarayıcı doğrulaması (Playwright: masaüstü `1366×768` ve mobil `390×844` taşmasız, sıfır console/page error, girdi değişiminde anlık sonuç güncellemesi)
6. Kullanıcı onayı sonrası yalnızca görev dosyaları (`git add`) tek atomik commit ile `main` branch'e push edilerek Vercel Production yayını doğrulanır.
