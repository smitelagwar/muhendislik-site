# Kirişli Döşemeli Bina Beton, Demir ve Laboratuvar Tahmini — Uygulama Planı

> **Amaç:** `/hesaplamalar` sayfasına, yalnızca kirişli döşemeli betonarme binalar için **sade, gereksiz yazılardan ve karmaşadan tamamen arındırılmış**, alan + kat + taşıyıcı sistem + temel + rijit bodrum seçimine göre tahmini **beton (m³)**, **demir (ton)** ve **2026 tahmini laboratuvar ücretini (TL)** anlık gösteren yeni bir hesaplayıcı eklemek.
> **Rota:** `/hesaplamalar/kirisli-beton-demir`
> **Araştırma Dayanakları:**
> - [01_MEVZUAT_VE_MUHENDISLIK_ARASTIRMASI.md](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/docs/kirisli-beton-demir-tahmini/01_MEVZUAT_VE_MUHENDISLIK_ARASTIRMASI.md)
> - [02_SAHA_PIYASA_VE_YOUTUBE_ARASTIRMASI.md](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/docs/kirisli-beton-demir-tahmini/02_SAHA_PIYASA_VE_YOUTUBE_ARASTIRMASI.md)

---

## Genel Kısıtlar (Kesin Kurallar)

1. **Sıfır Gereksiz Yazı:** Sayfada açıklama paragrafları, yönetmelik özetleri, uzun kartlar, "nasıl çalışır" metinleri, PDF/Excel/PNG modal butonları veya ekstra gelişmiş form yığınları **olmayacaktır**.
2. **İki Giriş Modu (Tek Satır Sekme) ve Yalnızca İstenen Girdiler:**
   - **Mod A — `İnşaat Alanı`:**
     - **Toplam İnşaat Alanı (`m²`)** (bodrum seçiliyse bodrum alanı dahildir) + hızlı presetler (`250`, `600`, `1.200`, `2.500`)
     - **Normal Kat Sayısı** (`−` / sayı / `+`, `1–30`)
   - **Mod B — `Parsel (TAKS / KAKS)`:**
     - **Parsel Alanı (`m²`)** + hızlı presetler (`300`, `500`, `1.000`, `2.000`)
     - **TAKS** (örn. `0.30`) & **KAKS (Emsal)** (örn. `1.50`)
     - Türetilen değer: `Taban = Parsel × TAKS`, `Normal Kat ≈ round(KAKS / TAKS)`, `Toplam Alan = Parsel × KAKS + Bodrum × Taban`
   - **Ortak Yapısal Seçimler:**
     - **Taşıyıcı Sistem** — 3 net seçenek: `Kolon` | `Kolon + Perde` | `Sadece Perdeli`
     - **Temel Tipi** — 2 net seçenek: `Radye Temel` | `Mütemadi Temel`
     - **Bodrum Durumu** — 3 net seçenek: `Yok` | `1 Bodrum (Rijit Perdeli)` | `2 Bodrum (Rijit Perdeli)`
3. **Ekrandaki Doğrudan Çıktılar:**
   - **Tahmini Beton (`m³`)** ve altında tek satır `... m³/m²`
   - **Tahmini Demir (`ton`)** ve altında tek satır `... kg/m² · ... kg/m³`
   - **Tahmini Laboratuvar Ücreti (2026 KDV Dahil TL)** — mevcut `calculateLaboratuvarFee()` motoruna hesaplanan `concreteM3`, `rebarTons` ve `totalFloors` değerleri geçilerek üretilir; altında tek satır `KDV Hariç · Numune/Çip · Demir Takımı` özeti gösterilir.
   - **3 Satırlık Sade Dağılım Tablosu:** `Üst Yapı (Kirişli)` | `Temel` | *(varsa)* `Rijit Bodrum Perdesi` | `Toplam` (sadece `Beton m³` ve `Demir ton` sütunları).
4. **Tema & Responsive Uyumu:** Dark Industrial + Light tema desteği, `font-mono` sayısal sonuçlar, `320px–1920px` yatay taşmasız düzen (`laboratuvar-ucreti` sayfası ile aynı minimalist 2 sütunlu iskelet).
5. **Tek Doğruluk Kaynağı:** `src/lib/calculation-pages.ts` kaydı üzerinden navigasyon, arama dizini, sitemap, route metadata ve `check:site-quality` tam uyumlu olacak.

---

## İncelenecek Uç Durumlar (Review Focus)

1. **Geçersiz / Boş / Virgüllü Alan veya Kat Girdisi:** `0`, negatif değer, `1200,5` gibi virgüllü girişler ve aşırı uç değerlerde (`area > 10_000_000`) `NaN/Infinity` üretmeden güvenli doğrulama ve sade boş durum mesajı.
2. **Bodrum Geçişinde Fiziksel Tutarlılık:** `Yok → 1 Bodrum → 2 Bodrum` seçildiğinde aynı toplam alan içinde rijit çevre perdelerinin ($P = 4{,}15 \sqrt{A_{\text{taban}}}$) fiziksel hacmi eklenerek hem beton hem demir hem de döküm sayısına bağlı laboratuvar ücretinin tutarlı biçimde artması.
3. **Taşıyıcı Sistem Geçişleri:** `Sadece Perdeli` seçildiğinde beton hacminin (`m³`) artması, birim beton başına demir yoğunluğunun (`kg/m³`) `Kolon` sistemine göre daha düşük çıkması; `Kolon + Perde` sisteminin dengeli orta değeri vermesi.
4. **Temel Tipi Geçişleri:** `Radye Temel` seçiminin aynı alanda `Mütemadi Temel` seçimine göre hem temel betonunu hem temel demirini belirgin şekilde yüksek tutması.
5. **Laboratuvar Ücreti Senkronizasyonu:** Hesaplanan beton/demir değiştiğinde ekrandaki **Tahmini Laboratuvar Ücreti** değerinin mevcut `laboratuvar-ucreti` modülü ile birebir aynı Ek-9 / EBİS / TS 708 kurallarıyla anlık güncellenmesi.

---

## Görev Adımları

### Görev 1: Saf Hesaplama Motoru (`src/lib/calculations/modules/kirisli-beton-demir/`)

**Dosyalar:**
- Oluştur: `src/lib/calculations/modules/kirisli-beton-demir/types.ts`
- Oluştur: `src/lib/calculations/modules/kirisli-beton-demir/constants.ts`
- Oluştur: `src/lib/calculations/modules/kirisli-beton-demir/engine.ts`
- Oluştur: `src/lib/calculations/modules/kirisli-beton-demir/index.ts`
- Güncelle: `src/lib/calculations/index.ts`

**Model & Formül Tasarımı:**
- **Girdiler (`KirisliBetonDemirInput`):**
  - `areaM2: number` (Toplam inşaat alanı, `> 0`)
  - `normalFloors: number` (`1–30` tam sayı)
  - `basementFloors: 0 | 1 | 2` (Bodrum kat sayısı; `> 0` ise TBDY 2018 Madde 3.3.1 rijit çevre perdeli)
  - `structuralSystem: "kolon" | "kolonPerde" | "sadecePerde"`
  - `foundationType: "radye" | "mutemadi"`
- **Hesaplama Akışı:**
  1. `totalFloors = normalFloors + basementFloors` ve `footprintAreaM2 = areaM2 / totalFloors`.
  2. **Üst Yapı + Kat Plakları (`areaM2`):**
     - Kirişli döşeme + kirişler: taban `0,195 m³/m²` beton ve `17,5 kg/m²` demir (kat sayısına göre küçük kesit büyüme katsayısı ve çerçeve/perde moment aktarım katsayısı uygulanır).
     - Düşey taşıyıcılar:
       - `kolon`: taban `0,058 m³/m²` × kat katsayısı; donatı yoğunluğu `122 kg/m³`
       - `kolonPerde`: taban `0,075 m³/m²` × kat katsayısı; donatı yoğunluğu `108 kg/m³`
       - `sadecePerde`: taban `0,106 m³/m²` × kat katsayısı; donatı yoğunluğu `84 kg/m³`
  3. **Temel (`footprintAreaM2`):**
     - Radye eşdeğer plak kalınlığı `h_radye = clamp(0.36 + totalFloors * 0.034, 0.40, 0.88)` × sistem katsayısı (`0,97 / 1,00 / 1,04`).
     - `radye`: hacim `footprintAreaM2 * h_radye`, donatı `90 kg/m³`.
     - `mutemadi`: hacim `footprintAreaM2 * h_radye * 0.60`, donatı `105 kg/m³`.
  4. **Rijit Bodrum Çevre Perdesi (`basementFloors > 0` ise):**
     - Çevre uzunluğu `P = 4.15 * Math.sqrt(footprintAreaM2)`
     - Perde kalınlığı `t = basementFloors === 1 ? 0.25 : 0.28` m, kat yüksekliği `3.0` m
     - Beton: `P * 3.0 * t * basementFloors`, donatı: `100 kg/m³`
  5. **Laboratuvar Ücreti (Doğrudan Entegrasyon):**
     - `calculateLaboratuvarFee({ area: areaM2, floors: totalFloors, concreteGrade: "standard", sampleType: "cube", concreteM3: totalConcreteM3, rebarTons: totalRebarTons })`

**Doğrulama:**
- `tests/calculations/kirisli-beton-demir.test.ts` yazılarak 3 taşıyıcı sistem, 2 temel tipi, bodrum `0/1/2` geçişleri, laboratuvar ücreti entegrasyonu ve geçersiz girdiler birim testleriyle doğrulanır.

---

### Görev 2: Portal Kaydı ve Vitrin Entegrasyonu

**Dosyalar:**
- Güncelle: `src/lib/calculation-pages.ts` (`order: 7`, `id: "kirisli-beton-demir"`, `href: "/hesaplamalar/kirisli-beton-demir"`, `title: "Kirişli Döşeme Beton & Demir"`, `navLabel: "Beton & Demir Tahmini"`)
- Güncelle: `src/app/hesaplamalar/page.tsx`:
  - `activeTab === "quantity"` filtresine `tool.id === "kirisli-beton-demir"` eklenmesi
  - Canlı modül sayacının dinamik `{TOOLS.length} Canlı Modül Hazır` yapılması
  - Kart alt mikro görseline `Beton · Demir · Laboratuvar` özeti eklenmesi

---

### Görev 3: Sade Kullanıcı Arayüzü (`/hesaplamalar/kirisli-beton-demir`)

**Dosyalar:**
- Oluştur: `src/app/hesaplamalar/kirisli-beton-demir/page.tsx`
- Oluştur: `src/app/hesaplamalar/kirisli-beton-demir/kirisli-beton-demir-client.tsx`

**Ekran Düzeni:**
- **Üst Başlık:** `Kirişli Döşeme Beton & Demir Tahmini`
- **Sol Panel (5 Sade Girdi):**
  1. `Toplam İnşaat Alanı (m²)` + presetler (`250`, `600`, `1.200`, `2.500`)
  2. `Normal Kat Sayısı` (`−` / giriş / `+`)
  3. `Taşıyıcı Sistem` (`Kolon` | `Kolon + Perde` | `Sadece Perdeli`)
  4. `Temel Tipi` (`Radye` | `Mütemadi`)
  5. `Bodrum` (`Yok` | `1 Bodrum` | `2 Bodrum`)
- **Sağ Panel (Doğrudan Çıktılar):**
  1. İki yan yana ana kutu: **Tahmini Beton (`m³`)** ve **Tahmini Demir (`ton`)** (altlarında `m³/m²`, `kg/m²` ve `kg/m³`)
  2. Vurgulu tek kutu: **Tahmini Laboratuvar Ücreti (2026 KDV Dahil TL)** + tek satır özet (`KDV Hariç · Numune/Çip · Demir Takımı`)
  3. 3–4 satırlık sade kalem tablosu (`Üst Yapı`, `Temel`, varsa `Rijit Bodrum Perdesi`, `Toplam`)

---

### Görev 4: Test, Kalite Kapıları ve Doğrulama

1. `npx tsx --test tests/calculations/kirisli-beton-demir.test.ts` — birim testleri PASS
2. `npx tsc -p tsconfig.next.json --noEmit` — 0 hata
3. `npm run check:site-quality` — 0 sorun
4. `npm run build` — production build PASS
5. `tests/site-audit/kirisli-beton-demir.spec.ts` ile Playwright masaüstü/mobil (`1366×768` ve `390×844`) doğrulaması: taşmasız, konsol hatasız, anlık hesap güncellemesi.
