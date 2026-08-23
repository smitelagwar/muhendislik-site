# DXF Render Fidelity — Stage 1 Contract

Bu aşama kullanıcı arayüzü eklemez; render veri hattının doğruluğunu sabitler.

- Varsayılan renk modu `source`: ACI/TrueColor/BYLAYER/BYBLOCK çözümlendikten sonra kaynak CAD rengi kontrast düzeltmesiyle değiştirilmez.
- Runtime renk modu `source | monochrome` olarak değiştirilebilir; geçiş DXF'i yeniden parse etmez ve geometri/kamera/layer state'ini değiştirmez.
- DXF group `370` lineweight değeri entity → layer → drawing default zincirinde çözülür; `BYLAYER (-2)`, `BYBLOCK (-1)` ve `DEFAULT (-3)` ayrı semantiklerdir.
- Lineweight, polyline start/end width (`40/41/43`) ile birleştirilmez.
- Lineweight değeri batch/material metadata hattında korunur. Farklı lineweight değerleri aynı render batch anahtarına indirgenmez.
- Coincident/duplicate çizgiler koordinat benzerliğine göre deduplicate edilmez. Kaynakta iki ayrı LINE varsa vertex verisinde iki ayrı segment kalır.
- Mevcut WebGL `GL_LINES` backend'i güvenilir fiziksel/screen-space kalınlık üretmediği için Stage 1 sahte CSS/`linewidth` efekti uygulamaz. Capability `lineweightRasterization: false` olarak açıkça bildirilir; gerçek wide-line rasterizer Stage 2 kapsamındadır.

Doğrulama:

```bash
npm run check:document-studio:cad-render-stage1
```
