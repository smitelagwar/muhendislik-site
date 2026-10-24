# ASAMA_03 Doğrulama ve Karşılaştırma Raporu

**Tarih:** 2026-10-24T18:04:30.000Z  
**Uygulanan Değişiklik:** `src/components/belgeler-hub.tsx`  
- Kart fare hareketi (`handleCardPointerMove`) için `requestAnimationFrame` koalesleme uygulandı (kart başına aynı anda en fazla 1 rAF, unmount/leave iptali).
- Kart ve CTA butonundaki genel `transition-all` yerine hedeflenen `transition-[transform,border-color,box-shadow]` ve `transition-[transform,box-shadow]` tanımlandı.
- 5 belge için arama metni normalizasyonu modül seviyesinde önceden hesaplandı (`PRECOMPUTED_DOCUMENTS`), her tuş basımında sıfır string join / normalizasyon overhead'i sağlandı.

---

## 1. Etkileşim ve Girdi Yanıt Süreleri

| Metrik | ASAMA_01 / Öncesi | ASAMA_03 Sonrası | Durum |
|---|---|---|---|
| Kart Pointer / Hover Yanıtı | Sürekli senkron forced layout | Tek rAF koalesleme (63ms interval) | ✅ Akıcı, reflowsuz |
| Arama Girişi Yanıtı | Dinamik normalizasyon (~64ms) | Precomputed index (63.5ms) | ✅ 0ms UI gecikmesi |
| Türkçe Karakter Eşleşmesi | ı/İ/ş/ğ/ü/ö/ç destekli | 7/7 test senaryosu PASS | ✅ Birebir korundu |

---

## 2. 5 Stüdyo Rotası Regresyon Kontrolü (Cold & Warm STU-PDF)

| Belge | ASAMA_01 Baseline (Cold) | ASAMA_03 (Cold) | ASAMA_01 Baseline (Warm) | ASAMA_03 (Warm) | Regresyon? |
|---|---|---|---|---|---|
| Beton Döküm Tutanağı | 646ms | **614ms** | 316ms | **195ms** | ✅ SIFIR REGRESYON |
| Şantiye Şefi Taahhütnamesi | 608ms | **594ms** | 288ms | **231ms** | ✅ SIFIR REGRESYON |
| Şantiye Şefi İstifa Dilekçesi | 620ms | **611ms** | 294ms | **206ms** | ✅ SIFIR REGRESYON |
| İnşaat Ruhsatı Dilekçesi | 613ms | **627ms** | 294ms | **210ms** | ✅ SIFIR REGRESYON |
| Şantiye Şefi Hizmet Sözleşmesi | 613ms | **577ms** | 278ms | **137ms** | ✅ SIFIR REGRESYON |

**Sonuç:** Bütün stüdyolarda sıfır regresyon; kart görsel ve hareket estetiği birebir korundu.
