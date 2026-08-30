# Mühendislik Araçları — Yaşayan Uygulama Durumu (TOOLS_IMPLEMENTATION_STATE)

> **Proje:** `muhendislik-site`  
> **Katalog:** `/kategori/araclar`  
> **Hedef:** 30 / 30 Gerçek Çalışan Mühendislik Aracı  
> **Mevcut Durum:** 30 / 30 TAM ÇALIŞAN, SAF MOTORLARA BAĞLI VE DOĞRULANMIŞ  

---

## 1. 30 Araçlık Uygulama Matrisi

| # | ID | Araç Adı | Dedicated Route | Registry Renderer | Hesap Motoru | Standart / Norm | Doğrulama & Test | Durum |
|---:|---|---|:---:|:---:|---|---|---|:---:|
| 1 | `donati-hesabi` | Donatı Hesabı | ✅ Var | — | `src/lib/rebar-calculations.ts` | TS 500 / TS 708 | `check:donati-hesabi` | 🟢 Canlı (Live) |
| 2 | `kolon-on-boyutlandirma` | Kolon Ön Boyutlandırma | ✅ Var | — | `src/lib/concrete-tools/column.ts` | TS 500 (Madde 7.4) | `check:tools-baseline` | 🟢 Canlı (Protected) |
| 3 | `kiris-kesiti` | Kiriş Kesiti | ✅ Var | — | `src/lib/concrete-tools/beam.ts` | TS 500 (Madde 7.1 & 8.1) | `check:tools-baseline` | 🟢 Canlı (Protected) |
| 4 | `doseme-kalinligi` | Döşeme Kalınlığı | ✅ Var | — | `src/lib/concrete-tools/slab.ts` | TS 500 (Madde 11.2) | `check:tools-baseline` | 🟢 Canlı (Protected) |
| 5 | `pas-payi` | Pas Payı | ✅ Var | — | `src/lib/concrete-tools/cover.ts` | TS 500 / TS EN 1992-1-1 | `check:tools-baseline` | 🟢 Canlı (Protected) |
| 6 | `zimbalama-kontrolu` | Döşeme Zımbalama Kontrolü | ✅ Var | — | `src/lib/concrete-tools/punching.ts` | TS 500 (Madde 8.3) | `check:tools-concrete-phase4` | 🟢 Canlı (Live) |
| 7 | `kiris-kesme-etriye` | Kiriş Kesme & Etriye Hesabı | ✅ Var | — | `src/lib/concrete-tools/shear-stirrup.ts` | TS 500 (Madde 8.1) | `check:tools-concrete-phase4` | 🟢 Canlı (Live) |
| 8 | `kenetlenme-boyu` | Donatı Kenetlenme & Ek Boyu | ✅ Var | — | `src/lib/concrete-tools/splice.ts` | TS 500 (Madde 9.1) | `check:tools-concrete-phase4` | 🟢 Canlı (Live) |
| 9 | `taban-kesme-kuvveti` | Eşdeğer Deprem Yükü | ✅ Var | — | `src/lib/engineering/tbdy2018/base-shear.ts` | TBDY 2018 (Bölüm 4.7) | `check:tools-existing` | 🟢 Canlı (Live) |
| 10 | `duzensizlik-kontrolu` | Düzensizlik Kontrolü | ❌ [slug] | `IrregularityCalculator` | `src/lib/engineering/tbdy2018/irregularity.ts` | TBDY 2018 (Tablo 3.6) | `check:tools-earthquake-geotech-phase5` | 🟢 Canlı (Live) |
| 11 | `zemin-sinifi` | Yerel Zemin Sınıfı | ❌ [slug] | `SoilClassCalculator` | `src/lib/engineering/tbdy2018/soil-class.ts` | TBDY 2018 (Tablo 16.1) | `check:tools-earthquake-geotech-phase5` | 🟢 Canlı (Live) |
| 12 | `deprem-periyot-hesabi` | Ampirik Periyot & Elastik Spektrum | ✅ Var | — | `src/lib/engineering/tbdy2018/period.ts` | TBDY 2018 (Bölüm 4.8.4 & Bölüm 2) | `check:tools-existing` | 🟢 Canlı (Live) |
| 13 | `goreli-kat-otelemesi` | Göreli Kat Ötelemesi (Drift) | ✅ Var | — | `src/lib/engineering/tbdy2018/drift.ts` | TBDY 2018 (Bölüm 4.9 & Tablo 4.3) | `check:tools-earthquake-geotech-phase5` | 🟢 Canlı (Live) |
| 14 | `radye-temel-hesabi` | Radye Temel Kalınlık & Zımbalama | ❌ [slug] | `MatFoundationCalculator` | `src/lib/concrete-tools/mat-foundation.ts` | TS 500 / TBDY 2018 Bölüm 16 | `check:tools-concrete-phase4` | 🟢 Canlı (Live) |
| 15 | `iksa-toprak-basinci` | İksa Perdesi Toprak Basıncı | ✅ Var | — | `src/lib/engineering/geotech/retaining-wall.ts` | Rankine & Coulomb | `check:tools-earthquake-geotech-phase5` | 🟢 Canlı (Live) |
| 16 | `sev-stabilitesi` | Şev Stabilitesi Güvenlik Katsayısı | ❌ [slug] | `SlopeStabilityCalculator` | `src/lib/engineering/geotech/slope-stability.ts` | Fellenius & Bishop | `check:tools-earthquake-geotech-phase5` | 🟢 Canlı (Live) |
| 17 | `celik-profil-secimi` | Çelik Profil Seçimi & Narinlik | ❌ [slug] | `SteelProfileCalculator` | `src/lib/engineering/steel/profile-selection.ts` | ÇYTHYE 2018 / TS EN 1993-1-1 | `check:tools-steel-timber-phase6` | 🟢 Canlı (Live) |
| 18 | `celik-birlestesi-hesabi` | Çelik Cıvata & Kaynak Hesabı | ❌ [slug] | `SteelConnectionCalculator` | `src/lib/engineering/steel/connection.ts` | ÇYTHYE 2018 Bölüm 13 | `check:tools-steel-timber-phase6` | 🟢 Canlı (Live) |
| 19 | `ahsap-eleman-hesabi` | Ahşap Kiriş & Dikme Taşıma Gücü | ❌ [slug] | `TimberMemberCalculator` | `src/lib/engineering/timber/timber-member.ts` | TS 647 / TS EN 1995-1-1 | `check:tools-steel-timber-phase6` | 🟢 Canlı (Live) |
| 20 | `kalip-sokum-suresi` | Kalıp Söküm Süresi | ✅ Var | — | `src/lib/concrete-tools/stripping.ts` | TS 500 / TS EN 13670 | `check:tools-baseline` | 🟢 Canlı (Protected) |
| 21 | `dis-cephe-yalitim-kalinligi` | Dış Cephe Yalıtım Kalınlığı | ✅ Var | — | `src/lib/ts825/calculator.ts` | TS 825:2024 | `check:ts825-wall` | 🟢 Canlı (Live) |
| 22 | `imar-hesaplayici` | İmar Hesaplayıcı | ✅ Var | — | `src/lib/imar/calculator.ts` | Planlı Alanlar İmar Yönetmeliği | `check:tools-existing` | 🟢 Canlı (Live) |
| 23 | `beton-metraj-hesabi` | Şantiye Beton & Harç Metrajı | ❌ [slug] | `ConcreteQuantityCalculator` | `src/lib/engineering/quantity/concrete-volume.ts` | ÇŞİDB Metraj Esasları | `check:tools-quantity-phase7-8` | 🟢 Canlı (Live) |
| 24 | `hafriyat-metraj-hesabi` | Hafriyat & Kamyon Sefer | ❌ [slug] | `ExcavationQuantityCalculator` | `src/lib/engineering/quantity/excavation.ts` | Prizmoid Simpson & Kabarma | `check:tools-quantity-phase7-8` | 🟢 Canlı (Live) |
| 25 | `pratik-donati-metraji` | Pratik Demir Metrajı | ❌ [slug] | `RebarQuantityCalculator` | `src/lib/engineering/quantity/rebar-ratio.ts` | TS 500 / TBDY Pursantaj Normları | `check:tools-quantity-phase7-8` | 🟢 Canlı (Live) |
| 26 | `pratik-kalip-metraji` | Pratik Kalıp Metrajı | ❌ [slug] | `FormworkQuantityCalculator` | `src/lib/engineering/quantity/formwork-ratio.ts` | Açınım Yüzey Analizi | `check:tools-quantity-phase7-8` | 🟢 Canlı (Live) |
| 27 | `duvar-metraji-hesabi` | Duvar & Tuğla Metrajı | ❌ [slug] | `MasonryQuantityCalculator` | `src/lib/engineering/quantity/masonry.ts` | TS EN 771 Blok Standartları | `check:tools-quantity-phase7-8` | 🟢 Canlı (Live) |
| 28 | `siva-boya-metraji` | Sıva & Boya Metrajı | ❌ [slug] | `PlasterPaintCalculator` | `src/lib/engineering/quantity/plaster-paint.ts` | TS 1481 Sarfiyat Normları | `check:tools-quantity-phase7-8` | 🟢 Canlı (Live) |
| 29 | `cati-kaplama-metraji` | Çatı & Ahşap Metrajı | ❌ [slug] | `RoofCoveringCalculator` | `src/lib/engineering/quantity/roof-covering.ts` | Çatı Eğim Geometrisi | `check:tools-quantity-phase7-8` | 🟢 Canlı (Live) |
| 30 | `seramik-fayans-metraji` | Seramik & Fayans Metrajı | ❌ [slug] | `TileQuantityCalculator` | `src/lib/engineering/quantity/tile-flooring.ts` | TS EN 14411 / TS EN 12004 | `check:tools-quantity-phase7-8` | 🟢 Canlı (Live) |

---

## 2. Son Durum Özeti

- **Toplam Katalog Kaydı:** 30 / 30
- **Canlı & Tam Çalışan:** 30 / 30 (%100)
- **Saf Hesap Motoru Bağlı:** 30 / 30 (%100)
- **Placeholder Sayısı:** 0 / 30 (%0)
- **Dedicated Route:** 15 / 30
- **Registry Renderer [slug] Fallback:** 15 / 30
- **Korumalı Temel Hesaplayıcılar Regresyonu:** 0 (5/5 Tam Korundu)
