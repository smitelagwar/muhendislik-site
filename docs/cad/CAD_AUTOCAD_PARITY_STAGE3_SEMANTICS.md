# CAD AutoCAD Parite — Aşama 3 Semantik ve İzolasyon Doğrulama Raporu

**Tarih:** 2026-09-03  
**Kapsam:** TEXT, MTEXT, ATTRIB, DIMENSION semantiği, encoding ve sembol ayrımı, slow-network font race kontratı.

---

## 1. `Ü(1Φ14)` Exact Font Sonrası Yeniden Ölçüm

Aşama 2'de `Arial-Bold.ttf` (`arialbd.ttf`) exact mesh registry'ye alınıp `await` ile önbelleğe alındıktan sonra, hedef çizimdeki anahtar dikey etiket `Ü(1Φ14)` için canonical semantik değerler aşağıdaki gibidir:

| Parametre | AutoCAD Değeri | MLightCAD Exact Değeri | Parite Durumu |
|---|---|---|---|
| **Entity Tipi** | `TEXT` (`AcDbText`) | `AcDbText` (`TEXT`) | Birebir Uyumlu |
| **Stil Adı** | `ARIAL_BOLD` | `ARIAL_BOLD` | Birebir Uyumlu |
| **Çözümlenen Font** | `arialbd.ttf` | `Arial-Bold.ttf` (type: mesh) | Birebir Uyumlu |
| **Glif Dizisi** | `['Ü', '(', '1', 'Φ', '1', '4', ')']` | `['Ü', '(', '1', 'Φ', '1', '4', ')']` | Birebir Uyumlu (Kayıpsız) |
| **'Ü' Karakteri** | `\u00DC` (LATIN CAPITAL U WITH DIAERESIS) | `\u00DC` (Arial Bold glif ID mevcut) | Tam Glif (Dolu Gövde) |
| **'Φ' Karakteri** | `\u03A6` (GREEK CAPITAL LETTER PHI) | `\u03A6` (Arial Bold glif ID mevcut) | Tam Glif (Dolu Gövde) |
| **Yükseklik (Height)** | `25.0` | `25.0` | Birebir Uyumlu |
| **Rotasyon Açısı** | `90.0°` (Dikey) | `90.0°` (Dikey) | Birebir Uyumlu |
| **Hizalama (Justification)**| Center (72: 1), Middle (73: 2) | Center, Middle (11/21 noktası bazlı) | Birebir Uyumlu |
| **Alignment Point (11/21)**| `(57676.89, 18366.58, 0.0)` | `(57676.89, 18366.58, 0.0)` | Birebir Uyumlu |
| **Mesh Çizim Modu** | Dolu gövdeli vektör yazı | Dolu gövdeli vektör yazı | **Tel kafes (wireframe) kalktı** |

> **Önemli İlke:** Hedef çizimdeki `Ü(1Φ14)` koordinatına veya rotasyonuna özel hiçbir tek seferlik ("one-off/hack") offset veya dönüşüm kodu YAZILMAMIŞTIR. Çözüm, font resolver ve MLightCAD'in native hizalama mekanizması üzerinden genel geçer kurallarla elde edilmiştir.

---

## 2. TEXT Semantiği Doğrulama Matrisi

AutoCAD TEXT nesnelerinde (group code 72 > 0 veya group code 73 > 0):
- Group `10/20/30`: Sol alt temel yerleştirme noktasıdır.
- Group `11/21/31`: İkinci hizalama (alignment) noktasıdır.
- Orta veya merkez hizalamada metnin geometrik ağırlık merkezi `11/21/31` noktasına oturtulur.
- Rotasyon (`group 50`): Bu hizalama noktası etrafında saat yönünün tersine (CCW) uygulanır.
- `text-rotation-0-90-180-270.dxf` ve `text-alignment-extrusion.dxf` fixture'ları ile 0°, 90°, 180°, 270° açılarında yönün AutoCAD ile birebir aynı olduğu doğrulanmıştır (`scripts/check-cad-stage3-fixtures.mjs`).

---

## 3. MTEXT ve ATTRIB Semantiği

1. **MTEXT:**
   - Attachment point değerleri (1: Top-Left, 5: Middle-Center, vb.) MLightCAD parser'ı tarafından desteklenmektedir.
   - Inline `\f` font komutları koruma altındadır; exact registry fontları Arial'a zorlanmaz.
   - `\U+####` Unicode escape dizilimleri (`\U+00DC` -> `Ü`, `\U+03A6` -> `Φ`) başarıyla çözülmektedir.
2. **ATTRIB / BLOCK INSERT:**
   - `insert-attrib-transforms.dxf` fixture'ında blok içi metinlerin ve niteliklerin (ATTRIB) ana blok transformu ve lokal rotasyon ile doğru birleştiği test edilmiştir.
   - Çağrı dairesi içindeki `DZ01 d=15` ve `KZ01/22` etiketleri blok merkeziyle eş merkezli kalmaktadır.

---

## 4. Sembol ve Glif Ayrımı (Symbol Normalization)

| Girdi | Tür | Karakter Kodu | İşleme Kuralı |
|---|---|---|---|
| `Φ` | Gerçek Unicode | `\u03A6` (Greek Phi) | Asla `%%c` veya `Ø`'ye dönüştürülmez; Arial Bold içindeki gerçek Phi glifi basılır. |
| `Ø` | Gerçek Unicode | `\u00D8` (Latin O-slash) | Asla `Φ` veya `%%c`'ye dönüştürülmez; özgün glif basılır. |
| `%%c` | AutoCAD Kod | Kontrol Kodu | SHX/GDT sembol fontu aramasında çap simgesine eşlenir. |
| `±` / `°` | Sembol | `\u00B1` / `\u00B0` | Arial içindeki tam sembol glifleri kullanılır. |
| `Ü, ü, Ş, ş, Ğ, ğ, İ, ı, Ö, ö, Ç, ç` | Türkçe Harfler | ISO/Unicode | Her iki fontta da tam glif ID'si doğrulanmıştır. |

---

## 5. DXF Encoding Politikası

`scripts/check-cad-encoding-semantics.mjs` testleri ile sabitlenen kurallar:
1. **Modern AutoCAD ($ACADVER >= AC1021):** $DWGCODEPAGE değeri ne olursa olsun dosya her zaman UTF-8 olarak çözümlenir (AutoCAD 2007+ resmi standardı).
2. **Eski AutoCAD ($ACADVER < AC1021):** `$DWGCODEPAGE ANSI_1254` tanımlı ise `windows-1254` ile çözülür; Türkçe baytlar kayıpsız korunur.
3. **Başlıksız / Geçersiz UTF-8:** Western legacy fallback olan `windows-1252` keyfi olarak değiştirilmemiş, repo geriye dönük uyumluluğu korunmuştur.

---

## 6. Slow-Network Font Race Kontratı

`scripts/check-cad-font-preload-contract.mjs` ile doğrulanan mimari:
- `adapter.ts` içinde `await Promise.all([fetch("Arial-Regular.ttf"), fetch("Arial-Bold.ttf")])` ile deterministik yükleme yapılır.
- `fontManager.awaitFontsBeforeDraw = true` ayarı ile fontlar belleğe ve IndexedDB'ye tam yazılmadan çizim tetiklenmez.
- Ağ gecikmesi durumunda ekran "yanlış font" veya "tel kafes" ile açılıp sonradan sıçrama (layout jump) yapmaz.

---

## 7. STOP GATE 3 Doğrulama Sonuçları

- [x] **`Ü(1Φ14)` glyphleri parçalanmıyor:** Arial Bold içindeki tam `Ü` ve `Φ` glifleri dolu gövde olarak çiziliyor.
- [x] **Yatay/dikey rotation yönü AutoCAD ile aynı:** 90° açılı dikey etiketler saat yönünün tersine doğru yönde hizalanıyor.
- [x] **Bounding box ve anchor kabul sınırında:** Group 11/21/31 center-middle anchor noktası tam merkezde.
- [x] **TEXT/MTEXT/ATTRIB/DIMENSION fixture'ları yeşil:** `scripts/check-cad-stage3-fixtures.mjs` PASSED.
- [x] **`%%c`, `Φ`, `Ø`, Türkçe karakterler birbirine yanlış çevrilmiyor:** `scripts/check-cad-text-symbol-semantics.mjs` PASSED.
- [x] **ANSI_1254 testi yeşil; global 1252 fallback keyfi değiştirilmedi:** `scripts/check-cad-encoding-semantics.mjs` PASSED.
- [x] **Slow-network'te first-frame font race yok:** `scripts/check-cad-font-preload-contract.mjs` PASSED.
- [x] **Next.js Typecheck:** `npx tsc --project tsconfig.next.json --noEmit` hatasız (0 hata).
