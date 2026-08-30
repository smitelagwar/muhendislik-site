# CAD Review Workspace V1 — Kullanıcı ve Mimari Kılavuzu

## 1. Ürün Kapsamı ve Mimari İlkeler

CAD Review Workspace V1, mühendis ve mimarların DWG ve DXF formatındaki teknik çizimler üzerinde işbirliği yapmasını, ölçüm almasını, inceleme notları eklemesini ve revizyon bulutları ile işaretleme yapmasını sağlayan profesyonel bir inceleme ortamıdır.

> [!IMPORTANT]
> **CAD Editörü Değildir — Taban Çizim İmutability İlkesi:**
> Bu sistem orijinal DWG/DXF model space'ini veya entity tablosunu asla mutate etmez (değiştirmez). Tüm inceleme verileri (ölçümler, pinler, şekiller, bulutlar ve eskizler) ayrık bir **Overlay Katmanı** (`cad_reviews` şeması) olarak dünya koordinatlarında saklanır.

---

## 2. İnceleme Araçları Kılavuzu

### 2.1 Ölçüm Araçları (Measurements)
- **İki Nokta Mesafe Ölçümü (`distance`)**: İki nokta tıklanarak mesafe hesaplanır ve gerçek çizim birimiyle etiketlenir.
- **Zincir Mesafe Ölçümü (`chain_distance`)**: Çoklu kırıklı aks veya güzergâh boyunca kümülatif toplam mesafe ve segment mesafeleri hesaplanır.
- **Alan Ölçümü (`area`)**: Çokgen tepe noktaları seçilerek poligon alanı ve çevre uzunluğu hesaplanır (`Enter` veya mobilde `Bitir` butonu ile tamamlanır).
- **Birim Kalibrasyonu**: Referans bilinen bir mesafe seçilerek özel çizim ölçeği kalibre edilebilir.

### 2.2 Metin Arama (CAD Text Search)
- **Global Arama**: Çizimdeki tüm `TEXT`, `MTEXT`, `INSERT`, `ATTRIB` ve `DIMENSION` metinlerini katsayı/katman bazında arar.
- **Bölgesel Arama (Regional Search)**: Dikdörtgen seçim kutusu çizilerek yalnızca belirli bir pafta bölgesindeki metinler taranır.
- **Odaklanma**: Arama sonucuna tıklandığında çizim kamerası otomatik olarak ilgili metin sınırlarına odaklanır (`zoomToBounds`).

### 2.3 Yorum ve Yapılandırılmış İşaretleme (Markup & Comments)
- **Yorum Pini (`comment_pin`)**: Sıralı numaralandırma (`#1, #2, #3...`) ile çizim üzerine pin yerleştirilir. Boş yorum kaydedilmez.
- **Durum Yönetimi**: İnceleme maddeleri `open` (Açık), `question` (Soru), `answered` (Yanıtlandı) veya `closed` (Çözüldü) olarak güncellenebilir.
- **Şekiller**: Dikdörtgen (`shape_rect`), Daire (`shape_circle`) ve Revizyon Bulutu (`shape_cloud`).
- **Callout Oku (`callout`)**: İşaret edilen detaya ok ucu ve metin baloncuğu ekler.
- **Metin Notu (`text`)**: Çizim üzerine serbest metin açıklaması ekler.

### 2.4 Serbest El Eskizi ve Silgi (Sketch & Eraser)
- **Serbest El Çizim (`stroke`)**: Pointer donanım hızlandırmalı coalesced event desteği ve RDP (Ramer-Douglas-Peucker) algoritması ile çizgileri optimize eder.
- **Nesne Silgisi (`eraser`)**: Seçilen veya tıklanan overlay işaretleme elemanını tek işlemle kaldırır.
- **Geri Al / Yinele**: `Ctrl+Z` ve `Ctrl+Y` ile tüm işlemler komut yığını üzerinden geri alınabilir.

---

## 3. Responsive ve Erişilebilirlik (A11y) Standartları

- **Desktop Görünümü**: Sol tarafta kompakt dikey araç çubuğu (`rail`) ve sağ tarafta çok sekmeli panel host'u (`search`, `measurements`, `comments`, `layers`).
- **Mobil Görünümü**: Alt kenarda sabitlenen dokunmatik dock (`bottom-dock`) ve ekranı kaplayan güvenli çekmece (`drawer`).
- **Dokunma Hedefleri**: Tüm mobil kontrol butonları WCAG 2.1 standardına uygun olarak **minimum 44×44 piksel** boyutundadır.
- **Klavye Kısayolları**: `Escape`, `Enter`, `Delete`, `Ctrl+Z`, `Ctrl+Y`, `/` veya `Ctrl+F` kısayolları. Giriş kutularında (`input`, `textarea`) izolasyon sağlanmıştır.
- **Focus Trap**: Çekmece açıldığında Tab odağı modal içinde tutulur ve Escape ile tetikleyiciye iade edilir.

---

## 4. Dışa Aktarma (Export) ve Birlikte Çalışabilirlik

1. **Review JSON**: Zod şeması (`cadReviewDocumentSchema`) ile tam round-trip desteğine sahip, versiyonlu JSON dosyası.
2. **Review-Only DXF**: Üçüncü taraf CAD araçlarında (AutoCAD, DWG FastView vb.) XREF / altlık olarak açılabilecek standart DXF:
   - `REVIEW_MEASURE` (Kırmızı): Ölçüm çizgileri ve metinler.
   - `REVIEW_COMMENT` (Sarı): Yorum pinleri ve açıklamalar.
   - `REVIEW_MARKUP` (Mavi): Şekiller, revizyon bulutları, callout okları.
   - `REVIEW_SKETCH` (Camgöbeği/Cyan): Serbest el çizgileri.
3. **WYSIWYG PNG & PDF**: Çizim ve inceleme katmanının geçici UI elemanlarından arındırılmış yüksek çözünürlüklü görsel çıktısı.

---

## 5. Güvenlik, Gizlilik ve Operasyon

- **Girdi Güvenliği**: Prototype pollution, `NaN`, `Infinity` ve XSS enjeksiyonları Zod ve sanitizasyon motoru ile engellenir.
- **Gizlilik Odaklı Telemetri**: Kullanıcı yorumları, dosya adları, CAD metinleri ve ham koordinatlar asla telemetri sunucularına iletilmez. Yalnızca süre kovaları ve araç kullanım sayaçları tutulur.
- **Feature Flag ve Rollback**: `NEXT_PUBLIC_CAD_REVIEW_V1=false` yapıldığında yeni inceleme arayüzü gizlenir; taban çizim görüntüleyici ve eski ölçümler kesintisiz çalışmaya devam eder, mevcut inceleme verisi silinmez.

---

## 6. Sürüm ve Kalite Doğrulama Komutları

```bash
# Tip denetimi
npx tsc --noEmit --incremental false

# Statik kod analizi
npx eslint "src/lib/dokumantasyon/cad-review/**/*.ts" "src/components/dokumantasyon/preview/cad-review-*.tsx" "tests/document-studio/cad-*.spec.ts"

# Kompozit Tüm Sürüm Kapısı (Testler + Build + DB İzolasyonu)
npm run check:cad-review:release
```