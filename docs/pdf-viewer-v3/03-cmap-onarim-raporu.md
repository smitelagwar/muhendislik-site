# FAZ R3 — Bozuk ToUnicode CMap Metin Onarımı Raporu (H4 & H5 Çözümü)

**Tarih:** 2026-10-01  
**Dönem:** PDF Görüntüleyici v3 Regresyon ve Düzeltme  
**Branch:** `pdf-v3`  
**Hedef Hatalar:** 
- **H4:** Kopyalamada 'i' harfinin 'Ĝ' (U+011C) olması
- **H5:** 'i' içeren kelimelerin ("ilişki", "değişken", "istatistik") aranamaması

---

## 1. Kök Neden ve Teşhis Özeti
Faz R0 teşhisinde kanıtlandığı üzere:
- `Copilot - korelasyon.pdf` belgesinde font üreticisi (Word/Copilot PDF exporter) Identity-H CMap tablosunda küçük 'i' karakterinin glif kodunu `0x004c` olarak atamış, ancak ToUnicode CMap eşleme tablosunda bunu Unicode `U+0069` ('i') yerine `U+011C` ('Ĝ' - LATIN CAPITAL LETTER G WITH CIRCUMFLEX) olarak haritalandırmıştır.
- Bu hata PDF dosyasının kendi gömülü ToUnicode tablosundan kaynaklanmakta olup Adobe Acrobat, Chrome yerel PDF okuyucu, Firefox ve Edge'de de kopyalama yapıldığında `'Ĝ'` üretmektedir.
- Plan Karar Ağacı: **Durum B (PDF kaynaklı K1 hatası)** işletilmiştir.

---

## 2. Mimari ve Uygulanan Çözüm

### 2.1 Saf Onarım Modülü (`src/lib/dokumantasyon/studio/pdf/pdf-text-repair.ts`)
- **1:1 Karakter Değişmezi:** Tek karakter (`Ĝ`) -> Tek karakter (`i`). Karakter uzunluğu asla değişmez (`repaired.length === raw.length`). Bu sayede arama indeksi, sayfa ofsetleri ve arama vurgu koordinatları piksel düzeyinde kusursuz korunur.
- **Tespit İmzası (False-Positive Koruması):**
  Belgenin ilk 3 sayfasındaki metin örneklemi incelenir:
  `Ĝ` oranı $\ge \%1$ VE ASCII `i` oranı $< \%0.5$ (Türkçe'de normal 'i' sıklığı $\approx \%8$).
  İmza eşleşmezse normal PDF'lerde kural listesi boş döner ve metne kesinlikle dokunulmaz.
- **Doküman Düzeyinde Tespit:**
  `detectBrokenMappingFromDoc(pdfDoc)` fonksiyonu doküman yüklendiğinde arka planda asenkron çalışır ve bulunan kuralları önbelleğe alır.

### 2.2 Entegrasyon Noktaları (TextLayer DOM'una Kesinlikle Müdahale Edilmedi)
1. **Panoya Kopyalama (`src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx`):**
   `window.addEventListener('copy', handleCopy)` dinleyicisi eklenmiştir. Kullanıcı fare ile metin seçip `Ctrl+C` veya sağ tık ile kopyaladığında, kopyalanan metindeki bozuk harfler anında `repairExtractedText` ile onarılarak panoya (`e.clipboardData.setData('text/plain', repaired)`) yazılır.
2. **Arama Motoru (`src/lib/dokumantasyon/studio/pdf/pdf-search-engine.ts`):**
   `buildPageIndex` metin dizinini oluştururken `repairRules` uygular. Böylece kullanıcı "ilişki", "değişken" veya "istatistik" arattığında arama motoru bu kelimeleri doğrudan bulur.
3. **Arama Vurgu Katmanı (`src/components/dokumantasyon/studio/pdf/pdf-highlight-layer.tsx`):**
   1:1 uzunluk korunduğu için TextLayer üzerindeki karakter ofsetleri doğrudan eşleşir ve vurgu kutusu (highlight mark) kelimenin tam üzerine yerleşir.
4. **Şeffaflık & Rozet & Ayar (`pdf-viewer-toolbar.tsx`):**
   Bozuk harf eşlemesi tespit edilen belgelerde araç çubuğunda `"Metin onarıldı"` rozeti ve tooltip'i görüntülenir. Ayarlar menüsünden kullanıcı isterse `"Bozuk harf onarımı (Ĝ -> i)"` seçeneğini kapatabilir (varsayılan: açık).

---

## 3. Doğrulama ve Kabul Kriterleri Kanıtları

### 3.1 Birim Testler
- `tests/pdf-v3/text-repair.test.ts`:
  - Bozuk ToUnicode imzası tespiti: **PASS**
  - Normal metinde yanlış pozitif üretmeme: **PASS**
  - 1:1 uzunluk değişmezi: **PASS**
  - Kelime kelime dönüşüm (`ĜlĜşkĜnĜn` -> `ilişkinin`): **PASS**
- `tests/pdf-v3/text-quality.test.ts`:
  - Belge metin kalitesi ve I7/I8 değişmezleri: **PASS**

### 3.2 E2E Değişmezler ve Regresyon Test Paketi (`npm run check:pdf-v3:invariants`)
```text
Running 5 tests using 1 worker
  ok 1 TEST-I1 & TEST-I3: Sayfaya Sığdır (Fit Page) modunda Canvas kutusu == Sayfa kutusu ve taşma olmamalı
  ok 2 TEST-I1 & TEST-I3: Zoom In (%137-%195) esnasında H1 Sağ Kenar Kırpılması (Clipping) olmamalı
  ok 3 TEST-I2: Netlik (Sharpness) değişmezi sağlanmalı (bitmap / CSS oranı >= 0.95 * DPR)
  ok 4 TEST-I5: Mod Geçiş Dizisi (Genişlik -> Sayfa -> %100 -> + -> -) tüm adımlarda değişmezleri korumalı
  ok 5 TEST-I7 & TEST-I8: Bozuk CMap (Ĝ -> i) otomatik onarılmalı, arama ('ilişki', 'değişken') çalışmalı ve kopyalama doğru olmalı

5 passed (1.3m)
```

**TEST-I8 Kopyalama Testi Çıktısı:**
- `hasRawG: true` (Orijinal belgede ham metin gerçekten bozuk `Ĝ` içeriyor)
- `hasIliski: true` (Panoya kopyalanan onarılmış metin "ilişki" / "ilişkinin" içeriyor)
- `hasG: false` (Panoya kopyalanan metinde 1 tane bile bozuk `Ĝ` kalmadı)

**Görsel Kanıt:**
- `docs/pdf-viewer-v3/kanit/r3-search-iliski-highlight.png`

---

## 4. Kullanıcıya Öneri
Bu tür PDF dosyaları Word veya benzeri kaynaklardan üretilirken PDF export ayarlarında font alt kümesi (subsetting) ToUnicode CMap tabloları hasarlı oluşturulmuştur. Belgeleri hazırlarken Microsoft Word'de "Farklı Kaydet -> PDF" yerine "Yazdır -> Microsoft Print to PDF" kullanılması glif eşlemelerinin standart Unicode olarak üretilmesini sağlayacaktır.
