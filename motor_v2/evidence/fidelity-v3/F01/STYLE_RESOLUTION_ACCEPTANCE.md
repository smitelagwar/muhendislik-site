# F01 — Renk, Layer, Transparency ve Ekran Renk Uzayı Kabul Kanıtı

**Tarih**: 2026-09-21  
**Durum**: TAMAMLANDI (PASS)  
**Test Dosyası**: `tests/cad-v2/style-resolution.test.ts`  
**Paket Referansı**: `DWG_DXF_Motor_V2_Kanitli_Kok_Neden_ve_Fidelity_Gemini_Uygulama_Plani_v3.md` (F01)  

---

## 1. Paket Özeti ve Kapsamı

F01 paketi, AutoCAD çizimlerinin renk, katman, saydamlık ve ekran renk uzayı fidelitesini AutoCAD standartlarına tam uyumlu hale getirmek üzere tamamlanmıştır:

1. **AutoCAD Color Index (ACI 1–255)**:
   - Standart 256'lık AutoCAD renk paleti ve RGB eşlemesi eksiksiz tanımlandı (`ACI_COLOR_TABLE`).
   - ACI 1–9 standart renkleri (Kırmızı, Sarı, Yeşil, Camgöbeği, Mavi, Eflatun, Beyaz/Siyah, Koyu Gri, Açık Gri) kesin doğrulukla eşlendi.
   - Sınır değerleri (ACI 0, ACI 256 vb.) güvenle ele alındı.

2. **ACI 7 ve Explicit TrueColor Ayrımı (Kör Renk Koyultma Kaldırıldı)**:
   - Önceki motorda yer alan `r > 0.88 && g > 0.88 && b > 0.88` kör renk koyultma mantığı tamamen kaldırıldı.
   - Açık arka planda (light background) yalnızca **ACI 7 (AutoCAD Color Index 7)** dinamik olarak koyu renge (`[0.08, 0.08, 0.08]`) uyarlanır (`isAci7: true`).
   - Kullanıcı veya çizim tarafından açıkça tanımlanmış TrueColor beyaz (`RGB(255, 255, 255)` veya `RGB(230, 230, 230)`) arka plan ne olursa olsun asla tahrif edilmez (`isAci7: false`).

3. **TrueColor + ACI Fallback**:
   - Varlık veya katman hem TrueColor RGB hem de ACI kodu taşıdığında TrueColor önceliklendirilir.
   - TrueColor eksik veya geçersiz olduğunda ACI fallback devreye girer.

4. **ByLayer ve Katman Rengi Çözümlemesi**:
   - Katman rengi ACI veya TrueColor olarak tanımlandığında, `color: "byLayer"` olan varlıklar doğru katman rengini miras alır.
   - Tanımsız veya bulunamayan katmanlar için ACI 7 varsayılanı uygulanır.

5. **ByBlock ve Nested ByBlock Hiyerarşisi**:
   - Blok içindeki bir varlık `color: "byBlock"` ise, bloğu çağıran `INSERT` varlığının rengini alır.
   - `INSERT` de `byBlock` ise, `parentInserts` ebeveyn yığını taranarak ilk açık renk veya en üst katman rengi çözümlenir.

6. **Layer 0 Kalıtımı**:
   - Katman 0'da tanımlanmış blok içi varlıklar, `INSERT` katmanını miras alır (`inheritedLayer`).
   - Kendi özel katmanında (örn: "DOORS") tanımlanmış varlıklar `INSERT` katmanından etkilenmez, kendi katmanını korur.

7. **Saydamlık (Alpha) ve Kaynak Görünürlüğü Ayrımı**:
   - `alpha: 0.0` (tam saydam) varlıklar render motorunda `opacity: 0.0` ile çizim komutunu korur.
   - `visible: false` olan varlıklar ise derleyici seviyesinde tamamen ayıklanır (primitives array'e eklenmez).

8. **Viewport Katman Ezmesi (VPLAYER Override)**:
   - Viewport katman ezmesi (`layerOverrides[layerName].color`) tanımlandığında, viewport içinde bu katmanın global rengi ezilir.

9. **İkili Protokol (DV2SCN01) ve DrawCommand İletimi**:
   - Derlenen `drawCommands` ve `layerRuns`/`triangleRuns` yapılarına `isAci7` ve `alpha` alanları eklendi.
   - Farklı renk, `isAci7` veya `alpha` taşıyan varlıkların bitişik komutlarda birbirine karışması engellendi.

10. **Monokrom ve Arka Plan Tahribatsızlığı**:
    - `userData.isAci7` ve `userData.originalColor` korunarak, monokrom mod açılıp kapandığında veya arka plan rengi değiştiğinde renkler bozulmadan aslına döner.

---

## 2. Test Sonuçları (10/10 PASS)

```text
============================================================================
DWG/DXF MOTOR V2 — F01 STYLE & COLOR RESOLUTION TESTİ
============================================================================
1. ACI 1-9 ve Standart 256 Renk Paleti Doğrulaması...
  ✓ ACI 1-255 standart renk paleti ve sınırları PASS
2. ACI 7 ve Explicit TrueColor Ayrımı (r > 0.88 kör koyultma yok)...
  ✓ ACI 7 ve TrueColor ayrımı, arka plan adaptasyon doğrulaması PASS
3. TrueColor + ACI Fallback Çözümlemesi...
  ✓ TrueColor + ACI fallback doğrulaması PASS
4. ByLayer Çözümlemesi...
  ✓ ByLayer katman rengi çözümlemesi PASS
5. ByBlock ve Nested ByBlock Çözümlemesi...
  ✓ ByBlock ve nested ByBlock çözümleme yığını PASS
6. Layer 0 Kalıtımı ve EntityVisitor Doğrulaması...
  ✓ Layer 0 kalıtımı ve bağımsız katman izolasyonu PASS
7. Saydamlık (Alpha) ve Görünürlük Ayrımı...
  ✓ Saydamlık (alpha) ve görünürlük ayrımı PASS
8. Viewport Katman Ezmesi (VPLAYER Override)...
  ✓ Viewport katman ezmesi doğrulaması PASS
9. Sahne Derleyicisi DrawCommands isAci7 ve Alpha İletimi...
  ✓ Binary chunk drawCommands içinde isAci7 ve alpha iletimi PASS
10. Geriye Dönük Uyumluluk (resolveEntityColor)...
  ✓ resolveEntityColor geriye dönük uyumluluğu PASS

============================================================================
F01 STYLE & COLOR RESOLUTION: TÜM KABUL KAPILARI GEÇTİ (PASS)
============================================================================
```

---

## 3. Regresyon ve Kalite Kapıları Doğrulaması

- `npm run check:cad-v2:unit` (24 test): **24/24 PASS**
- `npm run check:cad-v2:integration`: **PASS** (R001–R004 gerçek corpus doğruluğu, 30x benchmark, durable service, admin menu, public share)
- `npm run check:cad-v2:ui`: **PASS** (Kamera etkileşimi, WebGL context-lost, mobile touch, UI kalite kabulleri)
- `npm run check:cad-v2:release`: **PASS** (Tüm hat uçtan uca yeşil)

---

## 4. Değiştirilen ve Eklenen Dosyalar

1. `src/lib/cad-v2/canonical/types.ts`: `CadColor.isAci7` alanı eklendi.
2. `src/lib/cad-v2/compile/cad-color-resolver.ts`: ACI 256 paleti, `resolveCadStyle`, recursive `ByBlock`, `Layer 0`, VPLAYER override, alpha desteği.
3. `src/lib/cad-v2/compile/entity-visitor.ts`: `VisitorContext` güncellendi, `resolveCadStyle` ile `isAci7` ve `alpha` segmentlere aktarıldı.
4. `src/lib/cad-v2/compile/scene-compiler.ts`: `OrderedPrimitive` ve `RawDrawCommand` yapıları `isAci7` ve `alpha` ile ayrıştırıldı.
5. `src/lib/cad-v2/decode/dwg-adapter.ts`: TrueColor RGB önceliği ve alpha çözümlemesi eklendi.
6. `src/lib/cad-v2/decode/dxf-adapter.ts`: TrueColor RGB önceliği ve alpha çözümlemesi eklendi.
7. `src/lib/cad-v2/render/cad-v2-renderer.ts`: `setRGB` helper'ları eklendi, kör 0.88 koyultma kaldırıldı, ACI 7 arka plan adaptasyonu sağlandı.
8. `package.json`: `tests/cad-v2/style-resolution.test.ts` `check:cad-v2:unit` paketine kaydedildi, integration test bellek sınırı `--import tsx` ile optimize edildi.
9. `tests/cad-v2/style-resolution.test.ts`: F01 kabul testi.
