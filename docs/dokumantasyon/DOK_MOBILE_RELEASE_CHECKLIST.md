# Dökümantasyon Mobil UX — Release Checklist

Bu checklist mobil Dökümantasyon değişikliklerinin `main` entegrasyonunda kullanılacaktır.

## 10 Eylül 2026 — yerel sertleştirme kanıtı

`docs/DOK_MOBILE_HARDENING_2026-09-10.md` içindeki son yerel doğrulama için tamamlanan maddeler:

- [x] Değişiklikler yalnız Dökümantasyon mobil UX/test/doc ve branch-özel deploy kilidi kapsamındadır.
- [x] Touch/pen marquee başlatmıyor.
- [x] Tek touch tap yalnız bir aksiyon üretiyor.
- [x] Scroll sırasında seçim/açma oluşmuyor.
- [x] Long-press seçim/açma oluşturmuyor.
- [x] Checkbox ve işlem menüsü parent satırı tetiklemiyor.
- [x] Mobil seçim hedefleri >= 44×44 px.
- [x] Mobil liste gerçek satır yüksekliği 56 px virtualizer sözleşmesiyle aynı.
- [x] Selection dock fixed overlay değil ve nowrap.
- [x] 390×844 Chromium gerçek mobil kabul testi geçiyor.
- [x] 320×568 Chromium gerçek mobil kabul testi geçiyor.
- [x] iPhone 13 / WebKit gerçek mobil kabul testi geçiyor.
- [x] Drive V3 Stage 1→9 kontrolleri geçiyor.
- [x] Desktop Chromium Drive V3 regresyonu geçiyor.
- [x] Çalışma dalında Vercel preview/production deployment üretilmedi.
- [x] Final diff CAD/DWG/DXF motoru ve Dökümantasyon backend/API/storage kodunu değiştirmiyor.

Main entegrasyonu ve production smoke maddeleri bu yerel çalışmanın dışındadır; aşağıdaki ana checklist bunlar için korunur.

- [ ] Değişiklikler yalnız Dökümantasyon mobil UX/test/doc ve branch-özel deploy kilidi kapsamındadır.
- [ ] Touch/pen marquee başlatmıyor.
- [ ] Tek touch tap yalnız bir aksiyon üretiyor.
- [ ] Scroll sırasında seçim/açma oluşmuyor.
- [ ] Long-press seçim/açma oluşturmuyor.
- [ ] Checkbox ve işlem menüsü parent satırı tetiklemiyor.
- [ ] Mobil seçim hedefleri >= 44×44 px.
- [ ] Mobil liste gerçek satır yüksekliği 56 px virtualizer sözleşmesiyle aynı.
- [ ] Selection dock fixed overlay değil ve nowrap.
- [ ] 390×844 Chromium gerçek mobil kabul testi geçiyor.
- [ ] 320×568 Chromium gerçek mobil kabul testi geçiyor.
- [ ] iPhone 13 / WebKit gerçek mobil kabul testi geçiyor.
- [ ] Drive V3 Stage 1→9 kontrolleri geçiyor.
- [ ] Desktop Chromium Drive V3 regresyonu geçiyor.
- [ ] Çalışma dalında Vercel preview/production deployment üretilmedi.
- [ ] Final diff CAD/DWG/DXF motoru ve Dökümantasyon backend/API/storage kodunu değiştirmiyor.
- [ ] Main entegrasyonundan sonra tek production deployment READY oluyor.
- [ ] Production `/dokumantasyon` temel mobil görünüm/scroll/tap kontrolü tamamlanıyor.
