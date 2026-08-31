# Mühendislik Araçları V2 — Metadata, Registry & Evidence Audit (30 Araç)

> **Tarih:** 2026-08-31
> **Kapsam:** Canlı katalogdaki 30 araç
> **Dosyalar:** src/lib/tools-data.ts, src/lib/tool-registry.ts, src/lib/tool-evidence-manifest.ts, src/components/ToolsWorkbenchShowcase.tsx, src/components/tool-registry-renderer.tsx
> **Görev:** F0-01 (AUDIT_ONLY, kod değiştirilmedi)

---

## 1. 30 Araçlık Detaylı Audit Tablosu

| # | ID | Başlık | Public Scope (Kart / Showcase) | Card Source Label | Registry Source | Evidence Source | Tier | Engine | Component | Mismatch & Seviye |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | donati-hesabi | Donatı Hesabı | Çap ve adet girerek donatı alanı ve eşdeğer seçenekler | TS 500 / TS EN 1992 | TS 500 / TS 708 | TS 708 / TS 500 | B | rebar-calculations.ts | rebar-calculator.tsx | P1: Card label Eurocode 2 derken engine TS 500/708. Constructability uyarısı eksik. |
| 02 | kolon-on-boyutlandirma | Kolon Ön Boyutlandırma | Dikdörtgen kolonlar için ilk kesit ve tasarım alanı | TS 500 / TBDY 2018 | TS 500 Madde 7.4 | TS 500 Madde 7.4 | A | concrete-tools/column.ts | column-preliminary-sizing-calculator.tsx | P2: Uyumlu. Ön boyutlandırma kapsam sınırı (P-M, biaxial yok) belirtilmeli. |
| 03 | kiris-kesiti | Kiriş Kesiti | Eğilme donatısı ve kesme kontrolü TS 500 mantığıyla | TS 500 | TS 500 Madde 7.1 | TS 500 Madde 7.1 | A | concrete-tools/beam.ts | beam-section-calculator.tsx | P2: Uyumlu. Md ve Vd harici analiz girdisi olduğu açıkça vurgulanmalı. |
| 04 | doseme-kalinligi | Döşeme Kalınlığı | Açıklık-kalınlık oranı ve minimum donatı aralığı | TS 500 | TS 500 Madde 11.2 | TS 500 Madde 11.2 | A/B | concrete-tools/slab.ts | slab-thickness-calculator.tsx | P2: Registry tier B, Evidence tier A. Sınır ön boyutlandırma olarak netleştirilmeli. |
| 05 | pas-payi | Pas Payı | Nominal beton örtüsü ve pratik pas payı | TS EN 1992-1-1 | TS EN 1992-1-1 / TS 500 | TS EN 1992-1-1 / TS 500 | A/B | concrete-tools/cover.ts | concrete-cover-calculator.tsx | P2: Registry tier B, Evidence tier A. Ara bileşenler (durability, tolerance) görünür olmalı. |
| 06 | zimbalama-kontrolu | Döşeme Zımbalama Kontrolü | Kolon çevresi kayma gerilmesi ve zımbalama donatısı | TS 500 / Eurocode 2 | TS 500 Madde 8.3 / TBDY 2018 | TS 500 Madde 8.3 / TBDY 2018 | A | concrete-tools/punching.ts | punching-calculator.tsx | P1: Showcase Eurocode 2 diyor fakat engine TS 500 / TBDY 2018. Kaynak etiketi düzeltilmeli. |
| 07 | kiris-kesme-etriye | Kiriş Kesme / Etriye | Vc + Vw kayma dayanımı ve sıklaştırma aralığı s | TS 500 (Bölüm 8) | TS 500 Madde 8.1 / TBDY 2018 7.4 | TS 500 Madde 8.1 / TBDY 2018 7.4 | A | concrete-tools/shear-stirrup.ts | shear-stirrup-calculator.tsx | P2: Uyumlu. TBDY 2018 sıklaştırma kuralı kart labelına da yansıtılmalı. |
| 08 | kenetlenme-boyu | Donatı Kenetlenme / Bindirme | Çekme/basınç kenetlenme boyu ve bindirmeli ek | TS 500 (Bölüm 9) | TS 500 Madde 9.1 / 9.2 | TS 500 Madde 9.1 / 9.2 | A | concrete-tools/splice.ts | splice-calculator.tsx | P2: Uyumlu. Gerçek boyut ve detaylandırma şeması eksik. |
| 09 | taban-kesme-kuvveti | Eşdeğer Deprem Yükü | Toplam taban kesme kuvveti Vt ve kat dağılımı | TBDY 2018 (Bölüm 4) | TBDY 2018 Bölüm 4.7 | TBDY 2018 Bölüm 4.7 | A | engineering/earthquake/base-shear.ts | base-shear-calculator.tsx | P2: Uyumlu. Kat kuvveti elevasyon diyagramı eksik. |
| 10 | duzensizlik-kontrolu | Bina Düzensizlik Kontrolleri | Kart: A1, A2, A3, B1, B2, B3 (6 farklı kontrol) | TBDY 2018 Tablo 3.6 | TBDY 2018 Bölüm 3.6 (A1, A2, B2) | TBDY 2018 Bölüm 3.6 (A1, A2, B2) | A | engineering/earthquake/irregularity.ts | irregularity-calculator.tsx | **P0 (OVERCLAIM):** Kart 6 kontrol vadediyor fakat engine yalnız A1, A2, B2 hesaplıyor! Acil düzeltilmeli. |
| 11 | zemin-sinifi | Yerel Zemin Sınıfı Tayini | Vs30, SPT-N60 ve cu parametreleriyle zemin sınıfı | TBDY 2018 (Tablo 16.1) | TBDY 2018 Bölüm 16.4 | TBDY 2018 Bölüm 16.4 | A | engineering/geotech/soil-class.ts | soil-class-calculator.tsx | P2: Uyumlu. ZF sınıfı için özel araştırma uyarısı belirginleştirilmeli. |
| 12 | deprem-periyot-hesabi | Deprem Periyodu / Spektrum | Ampirik hakim doğal titreşim periyodu Tp ve spektrum | TBDY 2018 | TBDY 2018 Bölüm 4.7.3 / 2.3 | TBDY 2018 Bölüm 4.7.3 / 2.3 | A | engineering/earthquake/period-spectrum.ts | period-spectrum-calculator.tsx | P2: Uyumlu. Grafik altı erişilebilir veri tablosu eksik. |
| 13 | goreli-kat-otelemesi | Göreli Kat Ötelemesi | Kat drift oranı lambda * delta_i / h_i kontrolü | TBDY 2018 (Bölüm 4.9) | TBDY 2018 Bölüm 4.9 | TBDY 2018 Bölüm 4.9 | A | engineering/earthquake/story-drift.ts | story-drift-calculator.tsx | P2: Uyumlu. İki kat deformasyon görseli eksik. |
| 14 | radye-temel-hesabi | Radye Temel Kalınlık / Zımbalama | Zemin gerilmesi, ampatman ve zımbalama ön tahkiki | TS 500 / TBDY 2018 | TS 500 / TBDY 2018 | TS 500 / TBDY 2018 | A | engineering/geotech/raft-foundation.ts | raft-foundation-calculator.tsx | P2: Uyumlu. Taşıma gücünün harici geoteknik veri olduğu belirtilmeli. |
| 15 | iksa-toprak-basinci | İksa Perdesi Toprak Basıncı | Rankine aktif/pasif zemin basıncı ve devrilme | Rankine / Coulomb | Rankine Teorisi / TS 7994 | Rankine Teorisi / TS 7994 | A | engineering/geotech/retaining-wall.ts | retaining-wall-calculator.tsx | P1: Showcase Coulomb diyor fakat engine Rankine formülasyonu kullanıyor. Kaynak netleştirilmeli. |
| 16 | sev-stabilitesi | Şev Stabilitesi | Fellenius yöntemiyle güvenlik katsayısı Fs | Fellenius (İsveç Dilim) | Fellenius Dilim Yöntemi | Fellenius Dilim Yöntemi | A | engineering/geotech/slope-stability.ts | slope-stability-calculator.tsx | P2: Uyumlu. Kritik kayma yüzeyi aramasının yapılmadığı tek daire varsayımı açıklanmalı. |
| 17 | celik-profil-secimi | Çelik Profil Seçimi / Kapasite | Profil geometrisi, narinlik ve N/M/V taşıma gücü | ÇYTHYE 2018 / AISC 360 | ÇYTHYE 2018 / AISC 360-16 | ÇYTHYE 2018 / AISC 360-16 | A | engineering/steel/profile-selection.ts | steel-profile-calculator.tsx | **P0 (DB DUPLICATION):** Component içi local IPE_PROFILES ile engine STEEL_PROFILES_DATABASE ikiliği var! |
| 18 | celik-birlestesi-hesabi | Çelik Cıvata / Kaynak | Kayma, ezilme ve köşe kaynak dikişi dayanımı | ÇYTHYE 2018 (Bölüm 13) | ÇYTHYE 2018 Bölüm 13 | ÇYTHYE 2018 Bölüm 13 | A | engineering/steel/connection.ts | steel-connection-calculator.tsx | P2: Uyumlu. Basitleştirilmiş birleşim modeli sınırı vurgulanmalı. |
| 19 | ahsap-eleman-hesabi | Ahşap Kiriş / Dikme Hesabı | Başlık Kiriş / Dikme diyor fakat engine yalnız kiriş | TS EN 1995-1-1 / TS 647 | TS EN 1995-1-1 / TS 647 | TS EN 1995-1-1 / TS 647 | B | engineering/timber/timber-member.ts | timber-member-calculator.tsx | **P0 (SCOPE OVERCLAIM):** UI Kiriş / Dikme diyor fakat enginede dikme/burkulma yok, yalnız eğilme kirişi var! |
| 20 | kalip-sokum-suresi | Kalıp Söküm Süresi Hesabı | Sıcaklık ve çimento tipine göre minimum söküm süresi | TS 500 / ACI 347R | TS 500 Madde 5.4 / ACI 347R | TS 500 Madde 5.4 / ACI 347R | B | engineering/construction/stripping-time.ts | stripping-time-calculator.tsx | P1: Güvenlik dili. Tahmini süredir; sahadaki gerçek beton basınç dayanımı esastır uyarısı güçlendirilmeli. |
| 21 | dis-cephe-yalitim-kalinligi | Yalıtım Kalınlığı ve U Değeri | TS 825 derece gün bölgelerine göre EPS/XPS/Taşyünü | TS 825 (Bölüm 6) | TS 825 Standardı | TS 825 Standardı | A | engineering/thermal/ts825-wall.ts | insulation-calculator.tsx | P2: Uyumlu. Katman kesiti SVG ve U değeri karşılaştırması güçlendirilmeli. |
| 22 | imar-hesaplayici | İmar Hesaplayıcı (TAKS/KAKS) | Taban alanı, toplam inşaat alanı ve çekme mesafesi | 3194 Sayılı İmar Kanunu | 3194 Sayılı İmar Kanunu | 3194 Sayılı İmar Kanunu | B | engineering/planning/zoning.ts | zoning-calculator.tsx | P1: Ön fizibilite niteliğindedir; yerel belediye imar planı notları ve terkinler geçerlidir uyarısı zorunlu. |
| 23 | beton-metraj-hesabi | Beton Metrajı / Mikser Seferi | Kart: Beton / Harç Metrajı diyor fakat harç yok | Saha Pratiği / Çevre Şehircilik | Saha Pratiği / Çevre Şehircilik | Saha Pratiği / Çevre Şehircilik | C | engineering/quantity/concrete-volume.ts | concrete-quantity-calculator.tsx | **P0 (MISMATCH):** Kart Beton / Harç diyor; enginede harç hesabı yok, sadece beton var. Kapsam daraltılmalı. |
| 24 | hafriyat-metraj-hesabi | Hafriyat Metrajı / Kamyon Seferi | Temel kazısı, kabarma payı ve damperli kamyon seferi | Saha Pratiği / Karayolları | Saha Pratiği / Karayolları | Saha Pratiği / Karayolları | C | engineering/quantity/excavation.ts | excavation-quantity-calculator.tsx | P2: Uyumlu. Zemin kabarma katsayısı override ve aralık gösterilmeli. |
| 25 | pratik-donati-metraji | Pratik Donatı (Demir) Metrajı | Kart: TS 500 / TBDY 2018 Normatif Oranlar | TS 500 / TBDY 2018 | Saha Pratiği / İMO | Saha Pratiği / İMO | C | engineering/quantity/rebar-ratio.ts | rebar-quantity-calculator.tsx | **P0 (FALSE NORMATIVE CLAIM):** Tier C yaklaşık metraj için Normatif Oranlar denmiş! Yaklaşık ön tahmin dili getirilmeli. |
| 26 | pratik-kalip-metraji | Pratik Kalıp / İskele Metrajı | Brüt inşaat alanından kalıp yüzeyi ve iskele | Saha Pratiği / ÇŞB | Saha Pratiği / Çevre Şehircilik | Saha Pratiği / Çevre Şehircilik | C | engineering/quantity/formwork-ratio.ts | formwork-quantity-calculator.tsx | P1: Kesin/normatif dili kaldırılmalı, keşif ön tahmini ve katsayı override eklenmeli. |
| 27 | duvar-metraji-hesabi | Duvar Metrajı Hesabı | Tuğla/Bims/Gazbeton adet ve harç miktarı | Çevre Şehircilik Pozları | ÇŞB Standart Pozları | ÇŞB Standart Pozları | C | engineering/quantity/masonry.ts | masonry-quantity-calculator.tsx | P1: Boşluk oranı ve fire kullanıcı ayarlı hale getirilmeli; yaklaşık metraj etiketi konmalı. |
| 28 | siva-boya-metraji | Sıva ve Boya Metrajı Hesabı | Kaba/ince sıva kum-çimento ve astar/boya sarfiyatı | Çevre Şehircilik Pozları | ÇŞB Standart Pozları | ÇŞB Standart Pozları | C | engineering/quantity/plaster-paint.ts | plaster-paint-quantity-calculator.tsx | P1: Ürün datasheet sarfiyat uyarısı ve kullanıcı override eklenmeli. |
| 29 | cati-kaplama-metraji | Çatı Kaplama / Eğim Metrajı | Eğim faktörü, kiremit/membran ve saçak metrajı | TS EN 490 / ÇŞB | TS EN 490 / ÇŞB Standartları | TS EN 490 / ÇŞB Standartları | C | engineering/quantity/roof-covering.ts | roof-quantity-calculator.tsx | P1: Eğim görseli ve yaklaşık sipariş aralığı gösterilmeli. |
| 30 | seramik-fayans-metraji | Seramik / Fayans Metrajı | Net döşeme alanı, derz payı, fire ve kutu sayısı | TS EN 14411 / ÇŞB | TS EN 14411 / ÇŞB | TS EN 14411 / ÇŞB | C | engineering/quantity/tile-flooring.ts | tile-quantity-calculator.tsx | P1: Kutu yuvarlama, fire senaryosu ve yapıştırıcı sarfiyat override eklenmeli. |

---

## 2. P0 Kritik Mismatch Özeti

1. **duzensizlik-kontrolu (P0 - Overclaim):**
   - Kartta: A1, A2, A3, B1, B2, B3 (6 Farklı Kontrol) vaat ediliyor.
   - Gerçek: src/lib/engineering/earthquake/irregularity.ts motoru yalnız A1, A2 ve B2 hesaplıyor.
   - Çözüm (F0-02): Kart ve vitrin açıklaması yalnız A1, A2 ve B2 olarak düzeltilecek; olmayan kontroller vaat edilmeyecek.

2. **celik-profil-secimi (P0 - DB Duplication):**
   - steel-profile-calculator.tsx içinde yerel IPE_PROFILES arrayi tanımlı ve bu liste ile profile-selection.ts içindeki STEEL_PROFILES_DATABASE arasında drift riski var.
   - Çözüm (F0-04): Canonical DB tekilleştirilecek.

3. **ahsap-eleman-hesabi (P0 - Scope Mismatch):**
   - UI Başlığı: Ahşap Kiriş / Dikme Hesabı.
   - Gerçek: timber-member.ts motorunda dikme/burkulma yok; yalnız yayılı yüklü basit kiriş eğilme/kesme/sehim hesabı var.
   - Çözüm (F0-06): UI başlığı ve kapsamı Ahşap Kiriş Taşıma Gücü / Sehim Hesabı olarak netleştirilecek.

4. **beton-metraj-hesabi (P0 - Scope Mismatch):**
   - Kartta: Beton / Harç Metrajı.
   - Gerçek: Motor harç hesabı yapmıyor; temel/kolon/kiriş/döşeme beton hacmi ve mikser seferi hesaplıyor.
   - Çözüm (F0-05): Kart başlığı ve kapsamı Beton Metrajı / Mikser Seferi olarak düzeltilecek.

5. **pratik-donati-metraji (P0 - False Normative Claim):**
   - Kartta: TS 500 / TBDY 2018 Normatif Oranlar.
   - Gerçek: Tier C ampirik m² başına kg katsayısı; normatif dizayn değildir.
   - Çözüm (F0-03): Normatif ifadesi kaldırılacak, Yaklaşık Metraj / Ön Tahmin dili uygulanacak.

---

## 3. Kabul
30 aracın tamamı audit edilmiş, mismatch seviyeleri belirlenmiştir. Bu aşamada kaynak kod değiştirilmemiştir.