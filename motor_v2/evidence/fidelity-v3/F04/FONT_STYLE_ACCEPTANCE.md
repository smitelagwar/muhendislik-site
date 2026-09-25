# F04 — Font, TEXT, MTEXT ve Türkçe Karakter Doğruluğu Kabul Kanıtı

**Tarih**: 2026-09-21  
**Durum**: TAMAMLANDI (PASS)  
**Test Dosyası**: `tests/cad-v2/font-style-layout.test.ts`  
**Paket Referansı**: `DWG_DXF_Motor_V2_Kanitli_Kok_Neden_ve_Fidelity_Gemini_Uygulama_Plani_v3.md` (F04)  

---

## 1. Paket Özeti ve Kapsamı

F04 paketi, AutoCAD font çözümlemesi, TEXT varlığı hizalama ve geometrik dönüşümleri, MTEXT zengin run tabanlı biçimlendirmeleri ve Türkçe karakter setinin tam doğruluğunu sağlar:

1. **Authoritative Font Resolver & STYLE Çözümlemesi**:
   - `FontLayoutEngine.resolveFontStyle`: Dokümandaki `STYLE` adı, gerçek font dosya adı ve font türünü (`SHX` vs `TTF`) tam olarak ayırt eder.
   - Diskte mevcut olan yazı tipleri (`Arial-Regular.ttf`, `IBMPlexSerif-Regular.ttf`) için `status: "exact"`, `isSubstitute: false` döner.
   - Bulunamayan SHX (`simplex.shx`) ve TTF fontları için güvenli varsayılan ikame (`Arial-Regular.ttf`) uygulanır ve kesinlikle `status: "substitute"`, `isSubstitute: true` olarak işaretlenir; asla sahte "exact" dönülmez.
   - Teşhisler (`FontDegradedDiagnostic`: `shx_not_found`, `ttf_not_found`, `fallback_applied`) per-compilation bağlamında izole edilir; istekler arasında global log sızıntısı engellenmiştir.

2. **Deterministik Font Kataloğu Parmak İzi (Font Digest)**:
   - Yüklü font dosyalarının byte içerikleri üzerinden SHA-256 özetleri alınarak deterministik `getFontDigest()` üretilir.
   - Font digest değeri `computeSceneIdentity` üzerinden sahne kimliğine (`sceneId`), `exactCacheKey` ve `canonicalFingerprint` değerlerine girer.
   - Font seti veya font sürümü değiştiğinde otomatik cache invalidation tetiklenir.

3. **TEXT Alignment Matrisi ve 2. Hizalama Noktası (Alignment Point)**:
   - AutoCAD standardı: `horizontalMode == 0 && verticalMode == 0` (Sol / Taban Çizgisi) durumunda 1. nokta ($P_1$) kullanılır, $P_2$ yok sayılır.
   - Diğer tüm hizalamalarda (Orta, Sağ, Middle, vb.) 2. hizalama noktası ($P_2$, `alignmentPoint`) otorite alınır.
   - **Aligned Modu (hMode = 3)**: $P_1$ ile $P_2$ arasındaki mesafeye göre hem metin yüksekliği hem de genişliği orantılı olarak ölçeklenir; açı $P_1 \to P_2$ vektöründen hesaplanır.
   - **Fit Modu (hMode = 5)**: Metin yüksekliği sabit tutulur, metin genişlik katsayısı ($widthFactor$) metnin toplam uzunluğu $P_1 \to P_2$ mesafesine eşit olacak şekilde otomatik ayarlanır.
   - **Düşey Hizalamalar**: Taban Çizgisi (0), Alt (1, descender), Orta (2, capHeight/2), Üst (3, capHeight) ofsetleri font metrikleriyle analitik olarak hesaplanır.

4. **Generation Mirror Bayrakları ve Oblique Shear**:
   - Bit 2 (`isBackwards`): $x \to -x$ yatay ayna dönüşümü (sağdan sola ters yazı).
   - Bit 4 (`isUpsideDown`): $y \to -y$ düşey ayna dönüşümü (baş aşağı ters yazı).
   - Oblique Açısı ($\theta$): $x \to x + y \cdot \tan\theta$ analitik kaykılma (shear) dönüşümü uygulanır.

5. **Zengin Run Tabanlı MTEXT Yerleşim Motoru**:
   - `@mlightcad/mtext-parser` ile formatlama belirteçleri (tokens) ayrıştırılır:
     - Inline renk kodları (`\C1;` kırmızı, `\C3;` yeşil, `\c...;` RGB).
     - Inline yükseklik faktörleri (`\H2.0x;`, `\H5;`).
     - Harf aralığı/izleme katsayısı (`\T1.5;`, tracking).
     - Kesirler (Stacked fractions, `\S`): Diyagonal çizgi (`#`), yatay çizgi (`/`) ve tolerans (`^`) formatları.
     - Alt çizgi (`\L...\l`) ve üst çizgi (`\O...\o`).
     - Paragraf sonu (`\P`) satır atlamaları.
   - **Otomatik Satır Kaydırma (Word Wrap)**: `referenceWidth > 0` tanımlandığında sözcükler sınır genişliğine göre alt satırlara kaydırılır.
   - **9 Attachment Noktası**: Top-Left (1), Top-Center (2), Top-Right (3), Middle-Left (4), Middle-Center (5), Middle-Right (6), Bottom-Left (7), Bottom-Center (8), Bottom-Right (9) için eksiksiz bounding box yerleşimi.
   - **Arka Plan Maskesi (Background Mask)**: `backgroundMask: true` olduğunda metni çevreleyen koruyucu maske dikdörtgeni üretilir.

6. **Türkçe Karakter Oracle ve AutoCAD Sembolleri**:
   - Türkçe karakter setinin tamamı (`Ğ, Ü, Ş, İ, Ö, Ç, ğ, ü, ş, ı, ö, ç`) temizlenir ve vektör glifleri eksiksiz üretilir.
   - AutoCAD Unicode kaçış dizileri: `\U+011E`, `\U+0130`, `\U+015E`, `\U+00D6`, `\U+00DC`, `\U+00C7` ve çift kaçışlı `\\U+XXXX` çözümlenir.
   - AutoCAD kontrol sembolleri:
     - `%%c` / `%%C` $\to$ `Ø` (çap)
     - `%%d` / `%%D` $\to$ `°` (derece)
     - `%%p` / `%%P` $\to$ `±` (artı/eksi tolerans)
     - `%%%` $\to$ `%` (yüzde)
     - `\~` $\to$ bölünemez boşluk (NBSP)

7. **TTF Kontur (Contour) vs SHX Çizgi (Stroke) Ayrımı**:
   - TTF fontlarından üretilen glif segmentleri `isContour: true` taşır (dolgulu veya dış hat poligonları için).
   - SHX fontlarından üretilen glif segmentleri `isContour: false` taşır (merkez çizgisi vuruşları için).

---

## 2. Test Sonuçları (8/8 PASS)

```text
[F04 Test] Font, TEXT, MTEXT ve Türkçe Karakter Doğruluğu Testi Başlatılıyor...
  Gate 1: Authoritative Font Resolver & STYLE Resolution...
    -> Gate 1: PASS
  Gate 2: Exact vs Substitute Status & Deterministic Font Digest...
    -> Gate 2: PASS
  Gate 3: TEXT Alignment Matrix & 2nd Alignment Point...
    -> Gate 3: PASS
  Gate 4: Generation Mirror Flags & Oblique Shear...
    -> Gate 4: PASS
  Gate 5: MTEXT Run-Based Layout...
    -> Gate 5: PASS
  Gate 6: Turkish Character Oracle & AutoCAD Control Symbols...
    -> Gate 6: PASS
  Gate 7: Cache Invalidation Verification...
    -> Gate 7: PASS
  Gate 8: TTF Contour Tagging vs SHX Stroke Tagging...
    -> Gate 8: PASS

============================================================================
>>> F04 FONT, TEXT, MTEXT VE TÜRKÇE KARAKTER DOĞRULUĞU TESTİ GEÇTİ (PASS) <<<
============================================================================
```

---

## 3. Regresyon ve Kalite Kapıları Doğrulaması

- `npm run check:cad-v2:unit` (27 test): **27/27 PASS**
- `npm run check:cad-v2:integration` (7 test): **7/7 PASS**
- `npm run check:cad-v2:ui` (4 test): **4/4 PASS**
- `npm run check:cad-v2:release`: **PASS** (tüm test zincirleri tam yeşil)
- `npx tsc --noEmit`: **0 CAD V2 Hata**

---

## 4. Değiştirilen ve Eklenen Dosyalar

| Dosya | Değişiklik Türü | Açıklama |
|---|---|---|
| `src/lib/cad-v2/canonical/types.ts` | GÜNCELLENDİ | `CadMTextEntity` içine `backgroundMask?: boolean` eklendi. |
| `src/lib/cad-v2/canonical/diagnostics.ts` | GÜNCELLENDİ | `FONT_SUBSTITUTE_APPLIED`, `FONT_MISSING`, `FONT_GLYPH_MISSING` tanı kodları eklendi. |
| `src/lib/cad-v2/decode/dxf-adapter.ts` | GÜNCELLENDİ | `TEXT` için `alignmentPoint`, `horizontalMode`, `verticalMode`, `generationFlag`; `MTEXT` için `backgroundMask`, `drawingDirection`, `lineSpacingFactor` eşlendi. |
| `src/lib/cad-v2/decode/dwg-adapter.ts` | GÜNCELLENDİ | `MTEXT` için `backgroundMask` eşlendi. |
| `src/lib/cad-v2/text/font-layout-engine.ts` | GÜNCELLENDİ | Font resolver, SHA-256 font kataloğu parmak izi, TEXT 1./2. hizalama noktası matrisi (Sol, Orta, Sağ, Middle, Aligned, Fit), ayna bayrakları, oblique dönüşümü, MTEXT run tabanlı zengin biçimlendirme, stacked fractions, 9 attachment noktası, background mask ve Türkçe karakter oracle entegrasyonu tamamlandı. |
| `src/lib/cad-v2/compile/block-transformer.ts` | GÜNCELLENDİ | `BlockExpansionOptions` içine `textStyles` eklendi. |
| `src/lib/cad-v2/compile/entity-visitor.ts` | GÜNCELLENDİ | `EntityVisitorOptions` içine `textStyles` eklendi, `layoutText`/`layoutMText`'e iletildi ve inline segment renkleri çözümlendi. |
| `src/lib/cad-v2/compile/scene-compiler.ts` | GÜNCELLENDİ | `doc.textStyles` ve `fontDiagnostics` `FontLayoutEngine`'e bağlandı; `manifest.dependencyDigest` olarak `FontLayoutEngine.getFontDigest()` atandı; eksik font durumunda `FONT_SUBSTITUTE_APPLIED` ve `degraded` durumu eklendi. |
| `tests/cad-v2/font-style-layout.test.ts` | YENİ | 8 kapılık kapsamlı F04 font, metin, mtext ve Türkçe karakter kabul testi yazıldı. |
| `package.json` | GÜNCELLENDİ | `check:cad-v2:unit` scriptine `tests/cad-v2/font-style-layout.test.ts` eklendi (toplam 27 test). |
