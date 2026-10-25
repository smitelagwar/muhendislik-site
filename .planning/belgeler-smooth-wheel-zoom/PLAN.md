# BELGELER — Ultra Smooth PDF Zoom ve Sessiz PDF Güncelleme Planı

**Plan ID:** `BELGELER-SMOOTH-WHEEL-ZOOM-SILENT-RENDER-20261026`  
**Revizyon:** `1`  
**Aşama:** Yalnız `ASAMA_01` (A–F alt işleri)  
**Kaynak:** `BELGELER_CTRL_SCROLL_ULTRA_SMOOTH_ZOOM_SESSIZ_PDF_GUNCELLEME_NIHAI_PLAN.md`  

## Kapsam
1. Ctrl+Scroll hassas, timestamp bazlı rAF sürekli hedef takipli ultra-smooth zoom (~%5-9 tekil wheel, 60/120/144Hz uyumlu, cursor anchor sabit).
2. Tek raster render settle (animasyon sırasında ara karelerde gereksiz PDF.js render yok, son hedefte tek kaliteli raster).
3. Fit / wheel / +/- buton / pinch / focus-center komut devir teslimi ve yarış koruması.
4. Üst barda yazarken görünen "Derleniyor..." metni ve spinner'ın kaldırılması (normal form güncellemesinin sessiz olması, ilk yükleme / hata / taslak kayıt göstergelerinin korunması).
5. Kapsamlı birim, Playwright E2E ve görsel ink testleri.
6. Kalite kapıları geçtikten sonra tek atomic commit ile production release ve canlı smoke test.
