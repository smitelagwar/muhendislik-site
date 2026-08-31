# Tools V2 Progress

## Baseline Durumu (feat/tools-v2-final)
- check:tools-inventory: PASS (30/30 araç, 15 dedicated, 15 dynamic)
- check:tools-registry: PASS (30/30 kayıt, live-state senkron)
- check:tools-adversarial: PASS (14 test suite, 30/30 motor)
- check:tools: PASS (Phase 4, Phase 5, Phase 6, Phase 7-8, Adversarial, Browser Smoke 30/30 PASS)
- npx tsc --noEmit: PASS (0 hata)
- npm run lint: PASS (0 hata, 312 uyarı)

---

## Görev İlerleme Tablosu

| ID | Görev | Durum | Commit | Test | Not |
|---|---|---|---|---|---|
| F0-01 | Catalog/evidence audit | DONE | docs(tools): audit catalog registry and evidence drift | check:tools-inventory, check:tools-registry | 30 araç metadata audit tamamlandı (P0-P2 sınıflandı) |
| F0-02 | Düzensizlik overclaim hotfix | DONE | fix(tools): align irregularity scope with implemented checks | check:tools-adversarial, check:tools-earthquake-geotech-phase5 | Katalog ve vitrinde yalnız çalışan A1/A2/B2 belirtildi |
| F0-03 | Tier C güven dili temizliği | DONE | fix(quantity): align estimate wording with evidence tier | check:tools-quantity-phase7-8, check:tools-adversarial, tsc | 8 metraj aracında normatif dil kaldırıldı, ön keşif ve doğrulama notları eklendi |
| F0-04 | Çelik profil veri kaynağını tekilleştir | DONE | fix(steel): use one canonical profile database | check:tools-steel-timber-phase6, check:tools-adversarial, tsc | Yerel IPE_PROFILES kaldırıldı, canonical STEEL_PROFILES_DATABASE bağlandı |
| F0-05 | Beton metraj katalog kapsamı | TODO | | | |
| F0-06 | Ahşap kapsam + normatif audit | TODO | | | |
| F0-07 | Kaynak label drift hotfix | TODO | | | |
| F1-01 | Public metadata contract | TODO | | | |
| F1-02 | Metadata cross-check CI | TODO | | | |
| F1-03 | ToolScopeBadge primitive | TODO | | | |
| F1-04 | ToolSourceStamp primitive | TODO | | | |
| F1-05 | ToolLimitations primitive | TODO | | | |
| F1-06 | EngineeringDiagramFrame | TODO | | | |
| F1-07 | GoverningCheckCard | TODO | | | |
| F2-01 | Donatı Hesabı constructability pilot | TODO | | | |
| F2-02 | Kiriş Kesiti açıklanabilir sonuç pilot | TODO | | | |
| F2-03 | Eşdeğer Deprem Yükü bina/kat görsel pilot | TODO | | | |
| F2-04 | Beton Metrajı Tier C workflow pilot | TODO | | | |
| F3-01 | Kolon Ön Boyutlandırma (02) | TODO | | | |
| F3-02 | Kiriş Kesiti V2 (03) | TODO | | | |
| F3-03 | Döşeme Kalınlığı (04) | TODO | | | |
| F3-04 | Pas Payı (05) | TODO | | | |
| F3-05 | Zımbalama Kontrolü (06) | TODO | | | |
| F3-06 | Kiriş Kesme & Etriye (07) | TODO | | | |
| F3-07 | Kenetlenme & Ek Boyu (08) | TODO | | | |
| F4-01 | Eşdeğer Deprem Yükü V2 (09) | TODO | | | |
| F4-02 | Düzensizlik Kontrolleri V2 (10) | TODO | | | |
| F4-03 | Yerel Zemin Sınıfı (11) | TODO | | | |
| F4-04 | Ampirik Periyot & Spektrum (12) | TODO | | | |
| F4-05 | Göreli Kat Ötelemesi (13) | TODO | | | |
| F4-06 | Radye Temel (14) | TODO | | | |
| F4-07 | İksa Toprak Basıncı (15) | TODO | | | |
| F4-08 | Şev Stabilitesi (16) | TODO | | | |
| F5-01 | Çelik Profil Seçimi (17) | TODO | | | |
| F5-02 | Çelik Cıvata & Kaynak (18) | TODO | | | |
| F5-03 | Ahşap Eleman (19) | TODO | | | |
| F6-01 | Kalıp Söküm Süresi (20) | TODO | | | |
| F6-02 | Dış Cephe Yalıtım Kalınlığı (21) | TODO | | | |
| F6-03 | İmar Hesaplayıcı (22) | TODO | | | |
| F7-01 | Beton Metrajı V2 (23) | TODO | | | |
| F7-02 | Hafriyat & Kamyon Sefer (24) | TODO | | | |
| F7-03 | Pratik Donatı Metrajı (25) | TODO | | | |
| F7-04 | Pratik Kalıp Metrajı (26) | TODO | | | |
| F7-05 | Duvar & Tuğla Metrajı (27) | TODO | | | |
| F7-06 | Sıva & Boya Metrajı (28) | TODO | | | |
| F7-07 | Çatı & Ahşap Metrajı (29) | TODO | | | |
| F7-08 | Seramik & Fayans Metrajı (30) | TODO | | | |
| F8-01 | Katalog V2 Filtreler | TODO | | | |
| F8-02 | Katalog V2 Kart Güven Bilgisi | TODO | | | |
| F8-03 | Katalog V2 Arama | TODO | | | |
| F8-04 | Katalog V2 Son Kullanılanlar | TODO | | | |
| F9-01 | Raporlama ve Paylaşım Altyapısı | TODO | | | |
| F10-01 | Normative Extensions (A3/B1/B3/Ahşap Dikme vb.) | TODO | | | |
| RELEASE | Full Release Gate & Rapor | TODO | | | |
