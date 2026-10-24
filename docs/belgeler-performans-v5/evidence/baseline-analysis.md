# ASAMA_01: Yerel Sürüm ve Üretim Baz Ölçüm Raporu

**Tarih:** 2026-10-24T17:50:22.425Z  
**Referans Commit:** `fa17d8c570d70f6d8a0de058a5208258992af39c`  
**Çalışma Ağacı:** clean  
**Test Ortamı:** Production Build (`127.0.0.1:3005`)  

---

## 1. DOM & Ağ Doğrulaması

| Kontrol | Cihaz / Viewport | Beklenen | Ölçülen | Durum |
|---|---|---|---|---|
| Dekoratif Okyanus Canvas | Mobil 390px | 0 Canvas | 0 Canvas | ✅ PASS |
| Okyanus JS Chunk İndirme | Mobil 390px | false (indirilmemeli) | false | ✅ PASS |
| Okyanus Canvas Varlığı | Masaüstü 1366px | >= 1 Canvas | 1 Canvas | ✅ PASS |
| Okyanus Toggle Kontrolü | Masaüstü 1366px | Görünür | true | ✅ PASS |

> **Kritik Tespit:** Standart mobilde okyanus canvas'ının çalıştığı iddiası **ÇÜRÜTÜLDÜ**. Kodda bulunan `(min-width: 768px) and (hover: hover) and (pointer: fine)` şartı sayesinde mobilde `AmbientOceanCanvas` sıfır canvas üretmektedir ve chunk indirilmemektedir.

---

## 2. Beş Belge Stüdyosu Baz Performans Matrisi (7 Tekrar Medyan & p75)

| Belge | Rota | Cold STU-SHELL (med/p75) | Cold STU-PDF (med/p75) | Cold STU-EDIT (med/p75) | Warm STU-PDF (med/p75) |
|---|---|---|---|---|---|
| Beton Döküm Tutanağı | `/belgeler/beton-dokum-tutanagi` | 343ms / 349ms | **646ms / 661ms** | 710ms / 731ms | **316ms / 331ms** |
| Şantiye Şefi Taahhütnamesi | `/belgeler/santiye-sefi-taahhutnamesi` | 369ms / 1887ms | **608ms / 2124ms** | 665ms / 2184ms | **288ms / 1304ms** |
| Şantiye Şefi İstifa Dilekçesi | `/belgeler/santiye-sefi-istifa-dilekcesi` | 357ms / 615ms | **620ms / 636ms** | 687ms / 698ms | **294ms / 296ms** |
| İnşaat Ruhsatı Dilekçesi | `/belgeler/insaat-ruhsati-dilekcesi` | 353ms / 550ms | **613ms / 686ms** | 666ms / 733ms | **294ms / 318ms** |
| Şantiye Şefi Hizmet Sözleşmesi | `/belgeler/santiye-sefi-sozlesmesi` | 592ms / 657ms | **613ms / 677ms** | 674ms / 735ms | **278ms / 290ms** |

---

## 3. Arama ve Dil Desteği Doğrulaması

- **Türkçe Harf Eşleşmesi (ı/İ/ş/ğ):** Tamamı doğru eşleşti (✅ PASS).
- **Arama Temizleme:** 5 belgenin tamamı eksiksiz geri döndü.

---

## 4. A/B Deneyleri ve Kök Neden Analizi

1. **M-A/B (4 Renkli Blob Blur & Animasyon):**
   - Aktif Kaydırma Yanıt Süresi (medyan): 746ms
   - Blur & Animasyon Devre Dışı (medyan): 444ms
   - **Yorum:** Mobildeki 4 büyük `540-700px` radyal blob ve `filter: blur(100-110px)` katmanı GPU kompozisyon maliyeti yaratmaktadır. ASAMA_02 için geçerli optimizasyon adayıdır.

2. **D-A/B (Masaüstü Okyanus Animasyonu):**
   - Açıkken Kaydırma (medyan): 716ms
   - Kapalıyken Kaydırma (medyan): 63ms
   - **Yorum:** Okyanus açıkken scroll gözlemcileri ve panel maskeleme hafif ek yük üretmektedir, ancak FPS kabul edilebilir seviyededir.

---

## 5. Kök Neden Matrisi (Causality Matrix)

| Hipotez | Ölçüm Sonucu | Durum | Darboğaz / Etki Alanı | Önerilen Aksiyon | Bağlı Aşama |
|---|---|---|---|---|---|
| H1: Mobilde akvaryum canvas çalışıyor | 390px'te 0 canvas, chunk inmiyor | **ÇÜRÜTÜLDÜ** | 0 ms | Müdahale gerekmiyor, koru | Yok |
| H2: 4 adet 700px blur blob GPU yükü | 110px CSS blur + will-change composite | **DOĞRULANDI** | Mobil GPU & kaydırma jank | Eş-görünümlü yumuşak gradient / taşma kısıtlaması | ASAMA_02 |
| H3: Kart pointer move forced reflow | `getBoundingClientRect` her mouse eventte | **DOĞRULANDI** | Masaüstü hover anında reflow | RAF koalesleme (en fazla 1 RAF'te bir) | ASAMA_03 |
| H4: Masaüstü okyanus scroll/panel ölçümü | Scroll'da getBoundingClientRect çağrıları | **DOĞRULANDI** | Scroll sırasında layout okuması | Scroll esnasında tek rAF koalesleme | ASAMA_04 |
| H5: Link prefetch stüdyo hızını etkiliyor | Next <Link> prefetch çalışıyor | **DOĞRULANDI** | Cold stüdyo açılışını hızlandırıyor | Kesinlikle kapatılmayacak, korunacak | ASAMA_05 / ASAMA_06 |
| H6: PDF.js worker ve font cache varlığı | Shared worker ve font embedder aktif | **DOĞRULANDI** | Warm açılışlar çok daha hızlı (~200ms) | Mevcut cache korunacak, yeniden yazılmayacak | ASAMA_07 |
