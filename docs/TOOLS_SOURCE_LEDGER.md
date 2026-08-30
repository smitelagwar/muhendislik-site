# Mühendislik Araçları — Normatif Kaynak Defteri (TOOLS_SOURCE_LEDGER)

> **Proje:** `smitelagwar/muhendislik-site`
> **Katalog:** `/kategori/araclar`  
> **Kural:** Kaynağı doğrulanmamış hiçbir Tier A aracı `live` veya `verified` olamaz. Heuristic değerler asla normatif olarak sunulamaz.

---

## 1. Risk ve Doğrulama Sınıfları

- **TIER A (Yüksek Mühendislik Riski):** Taşıma gücü, kapasite, stabilite ve deprem güvenliği hesapları. (Exact madde/denklem, en az 3 bağımsız referans fixture, sınır durumları, unit test, browser smoke zorunlu).
- **TIER B (Standart Tabanlı Ön Kontrol / Sınıflandırma):** Kalınlık, pas payı, zemin sınıfı, yalıtım, imar ve donatı alanı belirleme. (Exact standart tablosu, en az 3 deterministik fixture, sınır durumları, browser test zorunlu).
- **TIER C (Metraj ve Yaklaşık Maliyet/Sarfiyat):** Geometri, zayiat, hacim, parça ve ağırlık dönüşümleri. (Preset provenance, geometri, fire, yuvarlama ve geçersiz girdi testleri zorunlu).

### Doğrulama Statüleri:
- `NORMATIVE-VERIFIED`: Resmi standart, yönetmelik veya onaylı referans denklemiyle bağımsız fixture ile doğrulanmış.
- `VERIFICATION-PENDING`: Kodu uygulanmış (implemented) ancak P0/P1 düzeltmeleri ve bağımsız oracle testleri devam eden.
- `HEURISTIC`: Şantiye tecrübesi, piyasa ortalaması veya istatistiksel sarfiyat aralığı (kullanıcıya tahmini olduğu açıkça belirtilen).

---

## 2. 30 Araçlık Normatif Kaynak Kütüğü

| # | Tool ID | Tier | Standart / Mevzuat | Baskı / Yıl | Exact Madde / Tablo / Denklem | Doğrulama Durumu | Provenance / Yöntem |
|---:|---|:---:|---|---|---|:---:|---|
| 1 | `donati-hesabi` | TIER B | TS 500 / TS 708 | 2000 / 2016 | TS 500 Madde 9, $A_s = n \frac{\pi \phi^2}{4}$, Çelik kütlesi $\rho = 7850 \text{ kg/m}^3$ | `NORMATIVE-VERIFIED` | Analitik geometri & TS 708 standart çubuk tablosu |
| 2 | `kolon-on-boyutlandirma` | TIER A | TS 500 | 2000 | Madde 7.4.1, Denklem 7.4 ($A_c \ge \frac{N_d}{0.4 f_{ck}}$), Madde 7.4 | `NORMATIVE-VERIFIED` | Korumalı regresyon; donatı kütlesi `docs/tools/corrections/column-rebar-mass.md` |
| 3 | `kiris-kesiti` | TIER A | TS 500 | 2000 | Madde 7.1 (Eğilme kapasitesi), Madde 8.1, Denklem 7.1, 7.3 | `NORMATIVE-VERIFIED` | Korumalı regresyon motoru |
| 4 | `doseme-kalinligi` | TIER B | TS 500 | 2000 | Madde 11.2, Tablo 11.1 ($l_n/h$ narinlik sınırları) | `NORMATIVE-VERIFIED` | Korumalı regresyon motoru |
| 5 | `pas-payi` | TIER B | TS 500 / TS EN 1992-1-1 | 2000 / 2004 | TS 500 Madde 9.2, EC2 Madde 4.4.1 ($c_{nom} = c_{min} + \Delta c_{dev}$) | `NORMATIVE-VERIFIED` | Korumalı regresyon motoru |
| 6 | `zimbalama-kontrolu` | TIER A | TS 500 / TBDY 2018 | 2000 / 2018 | TS 500 Madde 8.3, Denklem 8.11 ($v_{pd} \le f_{ctd}$), $u_p = 2(a+b+2d)$ | `VERIFICATION-PENDING` | Donatı boyutlandırması ($A_{sw}$) ekleniyor (FAZ G) |
| 7 | `kiris-kesme-etriye` | TIER A | TS 500 / TBDY 2018 | 2000 / 2018 | TS 500 Madde 8.1, Denklem 8.1 ($V_r = V_c + V_w$), TBDY Madde 7.4 | `VERIFICATION-PENDING` | Etriye clamp kaldırılması ve $A_{sw}/s$ doğrulaması (FAZ G) |
| 8 | `kenetlenme-boyu` | TIER A | TS 500 / TBDY 2018 | 2000 / 2018 | TS 500 Madde 9.1.2 ($l_b = \frac{f_{yd}}{4 f_{ctd}} \phi$), TBDY Madde 7.2.6 | `VERIFICATION-PENDING` | Aderans konumu ve bindirme boyu kuralı (FAZ G) |
| 9 | `taban-kesme-kuvveti` | TIER A | TBDY 2018 | 2018 | Bölüm 4.7, Denklem 4.21–4.23 ($V_{tE} = m_t S_{aR}(T_p)$), $\Delta F_{NE}$ | `VERIFICATION-PENDING` | `site-coefficients.ts` reuse ve $R_a(T)$ düzeltmesi (FAZ E) |
| 10 | `duzensizlik-kontrolu` | TIER A | TBDY 2018 | 2018 | Bölüm 3.6, Tablo 3.6 (A1, A2, A3; B1, B2, B3) | `VERIFICATION-PENDING` | 6 düzensizlik tipinin tam sayısal motoru (FAZ E) |
| 11 | `zemin-sinifi` | TIER B | TBDY 2018 | 2018 | Bölüm 16, Tablo 16.1 (ZA, ZB, ZC, ZD, ZE, ZF sınıfları) | `VERIFICATION-PENDING` | No-data default kaldırılması & çelişki analizi (FAZ E) |
| 12 | `deprem-periyot-hesabi` | TIER A | TBDY 2018 | 2018 | Bölüm 4.8.4 (Ampirik periyot $T_pA$), Bölüm 2.3.4 (Yatay elastik spektrum $S_{ae}(T)$) | `NORMATIVE-VERIFIED` | Mevcut `horizontal-spectrum.ts` & `period.ts` |
| 13 | `goreli-kat-otelemesi` | TIER A | TBDY 2018 | 2018 | Bölüm 4.9.1, Tablo 4.3 ($\lambda \delta_{i,max}/h_i \le \kappa$), Madde 4.9.2 $\theta_{II}$ | `VERIFICATION-PENDING` | Mutlak deplasman sözleşmesi ve $\theta_{II}$ (FAZ E) |
| 14 | `radye-temel-hesabi` | TIER A | TS 500 / TBDY 2018 | 2000 / 2018 | TS 500 Madde 8.3 & Madde 12, TBDY Bölüm 15 | `VERIFICATION-PENDING` | Flexural donatı hesabı ve $f_{yd}$ bağlantısı (FAZ G) |
| 15 | `iksa-toprak-basinci` | TIER A | TBDY 2018 / Geoteknik | 2018 / 2024 | TBDY Bölüm 16.6, Rankine ($K_a, K_p$), Coulomb & Mononobe-Okabe | `VERIFICATION-PENDING` | Gerçek Coulomb/M-O parametrik ayrımı (FAZ F) |
| 16 | `sev-stabilitesi` | TIER A | TBDY 2018 / Geoteknik | 2018 / 2024 | TBDY Bölüm 16.8, Fellenius (Ordinary Method of Slices) | `VERIFICATION-PENDING` | Gerçek kayma dairesi ve dilim geometrisi (FAZ F) |
| 17 | `celik-profil-secimi` | TIER A | ÇYTHYE 2018 / TS EN 1993-1-1 | 2018 / 2005 | ÇYTHYE Bölüm 8 (Basınç & Burkulma), IPE/HEA/HEB serisi | `VERIFICATION-PENDING` | Çift eksenli burkulma eğrileri & invalid kontrolü (FAZ H) |
| 18 | `celik-birlestesi-hesabi` | TIER A | ÇYTHYE 2018 / TS EN 1993-1-8 | 2018 / 2005 | ÇYTHYE Bölüm 13 (Cıvatalı ve kaynaklı birleşimler) | `VERIFICATION-PENDING` | Gerçek cıvata yerleşim geometrisi ve ezilme tahkiki (FAZ H) |
| 19 | `ahsap-eleman-hesabi` | TIER A | TS EN 1995-1-1 (EC5) / TS 647 | 2004 / 1979 | Eurocode 5 Madde 6.1 (Eğilme/Kesme), Madde 6.3 (Basınç/Burkulma) | `VERIFICATION-PENDING` | Kiriş ve Dikme modları ayrımı & eksenel yük (FAZ H) |
| 20 | `kalip-sokum-suresi` | TIER B | TS 500 / TS EN 13670 | 2000 / 2010 | TS 500 Madde 13.3 (Kalıp alma süreleri, sıcaklık ve çimento katsayıları) | `NORMATIVE-VERIFIED` | Korumalı regresyon motoru (`stripping.ts`) |
| 21 | `dis-cephe-yalitim-kalinligi` | TIER B | TS 825 | 2024 | TS 825:2024 Binalarda Isı Yalıtım Kuralları, $U \le U_{limit}$, $R = \sum d_i/\lambda_i$ | `NORMATIVE-VERIFIED` | TS 825:2024 iklim bölgeleri |
| 22 | `imar-hesaplayici` | TIER B | Planlı Alanlar İmar Yönetmeliği | 2017/2024 | Madde 5 (TAKS, KAKS/Emsal), Madde 22 (Bahçe çekme mesafeleri) | `NORMATIVE-VERIFIED` | İmar mevzuatı genel sınırları |
| 23 | `beton-metraj-hesabi` | TIER C | ÇŞİDB Metraj Esasları | 2024 | Geometrik Hacim ($V = A \times h$), Pompalı Hazır Beton Zayiatı (%3–5) | `HEURISTIC` | Geometrik hacim & mikser seferi |
| 24 | `hafriyat-metraj-hesabi` | TIER C | Toprak İşleri / ÇŞİDB | 2024 | Kazı Hacmi, Zemin Kabarma Faktörü ($K_b = 1.15–1.40$), Kamyon Hacmi | `HEURISTIC` | Prizma geometrisi & kamyon hesabı |
| 25 | `pratik-donati-metraji` | TIER C | Şantiye Pratik Pursantaj Normları | 2024 | Yapı Türüne Göre $kg/m^2$ ve $kg/m^3$ İstatistiksel Pursantaj Aralıkları | `HEURISTIC` | Alan ve Beton Hacmi modları |
| 26 | `pratik-kalip-metraji` | TIER C | Şantiye Kalıp Katsayıları | 2024 | İnşaat Alanından Kalıp Alanına Geçiş Katsayıları ($m^2 \text{ kalıp} / m^2 \text{ inşaat}$) | `HEURISTIC` | Kalıp sistemi (Ahşap, Çelik, Tünel) |
| 27 | `duvar-metraji-hesabi` | TIER C | TS EN 771-1..4 | 2015 | Standart Blok Boyutları (13.5'luk tuğla, 19'luk bims, gazbeton), derz & zayiat | `HEURISTIC` | Net duvar alanı & kapı/pencere boşluk düşümü |
| 28 | `siva-boya-metraji` | TIER C | TS 1481 / Üretici Normları | 2024 | Yüzey Alanı $\times$ Kat Sayısı, Boya Örtücülüğü ($m^2/L$), Sarfiyat ($kg/m^2$) | `HEURISTIC` | Düzenlenebilir sarfiyat ve ambalaj hesabı |
| 29 | `cati-kaplama-metraji` | TIER C | Çatı Kaplama & Ahşap Normları | 2024 | Çatı Eğim Faktörü ($\frac{1}{\cos \alpha}$), Mertek/Aşık Karkas & Kaplama | `HEURISTIC` | Çatı tipi geometrisi & ahşap karkas metrajı |
| 30 | `seramik-fayans-metraji` | TIER C | TS EN 14411 / TS EN 12004 | 2016 / 2017 | Seramik Karo Ebatları, Kutu $m^2$, Yapıştırıcı ($kg/m^2$), Derz Dolgu ($kg/m^2$) | `HEURISTIC` | Karo geometrisi & sarfiyat katsayıları |
