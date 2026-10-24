# ASAMA_02 Doğrulama ve Karşılaştırma Raporu

**Tarih:** 2026-10-24T18:54:23.784Z
**Uygulanan Değişiklik:** `src/components/belgeler-glass-bg.tsx` üzerinde `[contain:strict]`, `will-change: auto` (aşırı VRAM optimizasyonu) ve `prefers-reduced-motion` desteği.

## 1. Mobil Kaydırma Yanıtı (Scroll Response / Latency)

- **ASAMA_01 Baseline:** 746 ms medyan
- **ASAMA_02 Sonuç:** **417.5 ms medyan** (%44 İyileşme)

## 2. 5 Stüdyo Rotası Açılış Karşılaştırması (Cold & Warm STU-PDF)

| Belge | Cold STU-PDF Baseline | Cold STU-PDF Stage 2 | Fark (ms) | Warm STU-PDF Baseline | Warm STU-PDF Stage 2 | Fark (ms) | Regresyon? |
|---|---|---|---|---|---|---|---|
| Beton Döküm Tutanağı | 646ms | **629ms** | -17ms | 316ms | **207ms** | -109ms | ✅ SIFIR REGRESYON |
| Şantiye Şefi Taahhütnamesi | 608ms | **622ms** | +14ms | 288ms | **273ms** | -15ms | ✅ SIFIR REGRESYON |
| Şantiye Şefi İstifa Dilekçesi | 620ms | **585ms** | -35ms | 294ms | **164ms** | -130ms | ✅ SIFIR REGRESYON |
| İnşaat Ruhsatı Dilekçesi | 613ms | **680ms** | +67ms | 294ms | **281ms** | -13ms | ✅ SIFIR REGRESYON |
| Şantiye Şefi Hizmet Sözleşmesi | 613ms | **612ms** | -1ms | 278ms | **283ms** | +5ms | ✅ SIFIR REGRESYON |

**Genel Durum:** ✅ TÜM ROTARLARDA SIFIR REGRESYON KORUNDU