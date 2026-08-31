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
| F0-05 | Beton metraj katalog kapsamı | DONE | fix(quantity): align concrete quantity scope with engine | check:tools-inventory, check:tools-registry, check:tools-adversarial | Katalog ve vitrinde harç ifadesi kaldırıldı, Beton Metrajı & Mikser Seferi yapıldı |
| F0-06 | Ahşap kapsam + normatif audit | DONE | docs(timber): audit current normative and scope coverage | check:tools-steel-timber-phase6, check:tools-adversarial, tsc | docs/tools/timber-normative-audit-2026.md oluşturuldu, UI başlığı Ahşap Kiriş Taşıma Gücü & Sehim olarak netleştirildi |
| F0-07 | Kaynak label drift hotfix | DONE | fix(tools): align public source labels with evidence | check:tools-inventory, check:tools-registry, check:tools-adversarial, tsc | Showcase kartlarındaki kaynak etiketleri engine verileriyle senkronize edildi |
| F1-01 | Public metadata contract | DONE | feat(tools): add public metadata contract | tsc | src/lib/tool-public-meta.ts 30 araç için eksiksiz oluşturuldu |
| F1-02 | Metadata cross-check CI | DONE | feat(tools): add metadata cross-check CI test and chain | npm run check:tools-metadata, tsc | scripts/check-tools-metadata.ts eklendi ve check:tools zincirine bağlandı |
| F1-03 | ToolScopeBadge primitive | DONE | feat(ui): add core engineering primitives | tsc | src/components/engineering-primitives/tool-scope-badge.tsx |
| F1-04 | ToolSourceStamp primitive | DONE | feat(ui): add core engineering primitives | tsc | src/components/engineering-primitives/tool-source-stamp.tsx |
| F1-05 | ToolLimitations primitive | DONE | feat(ui): add core engineering primitives | tsc | src/components/engineering-primitives/tool-limitations.tsx |
| F1-06 | EngineeringDiagramFrame primitive | DONE | feat(ui): add core engineering primitives | tsc | src/components/engineering-primitives/engineering-diagram-frame.tsx |
| F1-07 | GoverningCheckCard primitive | DONE | feat(ui): add core engineering primitives | tsc | src/components/engineering-primitives/governing-check-card.tsx |
| F2-01 | Donatı Hesabı constructability pilot | DONE | feat(rebar): add constructability check and engineering diagram | npm run check:donati-hesabi, npm run check:tools-metadata, tsc | Kiriş genişliği parametresi, net aralık ön tahkiki, SVG kiriş kesiti ve ToolLimitations eklendi |
| F2-02 | Kiriş Kesiti açıklanabilir sonuç pilot | DONE | feat(beam): add governing checks and explainable telemetry | npm run check:tools-existing, npm run check:tools-adversarial, tsc | GoverningCheckCard (eğilme ve kesme için), ToolScopeBadge, ToolSourceStamp ve ToolLimitations eklendi |
| F2-03 | Eşdeğer Deprem Yükü bina/kat görsel pilot | DONE | feat(seismic): add story force distribution diagram and limit checks | npm run check:tools-existing, npm run check:tools-adversarial, tsc | SVG bina kat kuvvetleri şeması, TBDY 2018 Vt,min GoverningCheckCard ve ToolLimitations eklendi |
| F2-04 | Beton Metrajı Tier C workflow pilot | DONE | feat(quantity): add procurement telemetry and limit notes | npm run check:tools-quantity-phase7-8, npm run check:tools-adversarial, tsc | GoverningCheckCard (brüt sipariş/mikser dengesi), ToolScopeBadge, ToolSourceStamp ve ToolLimitations eklendi |
| F2-05 | 4 Pilot araç browser smoke genişletmesi | DONE | test(smoke): assert scope, limitations and diagram in pilot tools | npm run check:tools-browser-smoke, npm run check:tools | check-tools-browser-smoke.mjs 4 pilot için ScopeBadge, Limitations, Diagram kontrolleriyle genişletildi ve 30/30 PASS |
| F3-01 | Kolon Ön Boyutlandırma (02) | DONE | feat(column): add axial capacity governing check and limitations | npm run check:tools-concrete-phase4, npm run check:tools-adversarial, tsc | GoverningCheckCard (eksenel yük & kesit kapasitesi), ToolScopeBadge, ToolSourceStamp ve ToolLimitations eklendi |
| F3-02 | Kiriş Kesiti V2 (03) | DONE | feat(beam): complete V2 standardization | npm run check:tools-concrete-phase4, npm run check:tools-adversarial, tsc | F2-02 pilotunda GoverningCheckCard, ToolScopeBadge, ToolSourceStamp ve ToolLimitations tamamlandı |
| F3-03 | Döşeme Kalınlığı (04) | DONE | feat(slab): add deflection governing check and limitations | npm run check:tools-concrete-phase4, npm run check:tools-adversarial, tsc | GoverningCheckCard (sehim & kalınlık tahkiki), ToolScopeBadge, ToolSourceStamp ve ToolLimitations eklendi |
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
