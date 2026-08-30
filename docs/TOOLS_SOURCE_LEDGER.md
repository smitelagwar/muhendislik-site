# Mühendislik Araçları — Kaynak Envanteri (TOOLS_SOURCE_LEDGER)

> **Proje:** `muhendislik-site`  
> **Katalog:** `/kategori/araclar`  
> **Kural:** Kaynağı doğrulanmamış hiçbir Tier A aracı `live` veya `verified` olamaz.

---

## 1. Risk Sınıfları

- **TIER A (Yüksek Mühendislik Riski):** Taşıma gücü, kapasite, stabilite ve deprem güvenliği hesapları. (En az 3 bağımsız referans fixture, sınır durumları, unit test, browser smoke zorunlu).
- **TIER B (Standart Tabanlı Ön Kontrol / Sınıflandırma):** Kalınlık, pas payı, zemin sınıfı, yalıtım, imar ve donatı alanı belirleme. (En az 3 deterministik fixture, sınır durumları, browser test zorunlu).
- **TIER C (Metraj ve Yaklaşık Maliyet/Sarfiyat):** Geometri, zayiat, hacim, parça ve ağırlık dönüşümleri. (Geometri, fire, yuvarlama ve geçersiz girdi testleri zorunlu).

---

## 2. Kaynak Tablosu

| # | Tool ID | Risk Sınıfı | Standart / Mevzuat | Baskı / Yıl | İlgili Madde / Tablo / Denklem | Doğrulama Durumu | Notlar |
|---:|---|:---:|---|---|---|:---:|---|
| 1 | `donati-hesabi` | TIER B | TS 500 / TS 708 | 2000 / 2016 | Çelik çubuk alanları $\frac{\pi d^2}{4}$, TS 500 Madde 9 | Doğrulandı | Geometrik alan ve net donatı aralığı hesabı |
| 2 | `kolon-on-boyutlandirma` | TIER A | TS 500 | 2000 | Madde 7.4, Denklem 7.4 ($A_c \ge \frac{N_d}{0.4 f_{ck}}$), Madde 7.4.1 | Doğrulandı | Korumalı regresyon motoru |
| 3 | `kiris-kesiti` | TIER A | TS 500 | 2000 | Madde 7.1 (Eğilme), Madde 8.1 (Kesme), Denklem 7.1, 7.3 | Doğrulandı | Korumalı regresyon motoru |
| 4 | `doseme-kalinligi` | TIER B | TS 500 | 2000 | Madde 11.2, Tablo 11.1 ($l_n/h$ sınırları) | Doğrulandı | Korumalı regresyon motoru |
| 5 | `pas-payi` | TIER B | TS 500 / TS EN 1992-1-1 | 2000 / 2004 | TS 500 Madde 9.2, EC2 Madde 4.4.1 ($c_{nom} = c_{min} + \Delta c_{dev}$) | Doğrulandı | Korumalı regresyon motoru |
| 6 | `zimbalama-kontrolu` | TIER A | TS 500 | 2000 | Madde 8.3, Denklem 8.11 ($v_{pd} \le f_{ctd}$), Kritik çevre $u_p = 2(a+b+2d)$ | Doğrulandı | Kolon konumu ($\gamma$ katsayıları) ile zımbalama gerilmesi |
| 7 | `kiris-kesme-etriye` | TIER A | TS 500 | 2000 | Madde 8.1, Denklem 8.1 ($V_r = V_c + V_w$), Madde 8.1.5 (Etriye aralığı $s$) | Doğrulandı | $V_c = 0.8 v_{cr} b_w d$, $V_w = \frac{A_{sw}}{s} f_{ywd} d$ |
| 8 | `kenetlenme-boyu` | TIER A | TS 500 / TBDY 2018 | 2000 / 2018 | TS 500 Madde 9.1.2 ($l_b = \frac{f_{yd}}{4 f_{ctd}} \phi$), TBDY Madde 7.2.6 | Doğrulandı | Konum I/II aderans katsayıları ve bindirme boyu |
| 9 | `taban-kesme-kuvveti` | TIER A | TBDY 2018 | 2018 | Bölüm 4.7, Denklem 4.22 ($V_{tE} = m_t S_{aR}(T_p) \ge 0.04 m_t I S_{DS} g$) | Doğrulandı | Eşdeğer deprem yükü ve katlara üçgen dağıtım |
| 10 | `duzensizlik-kontrolu` | TIER A | TBDY 2018 | 2018 | Bölüm 3.6, Tablo 3.6 (A1 Burulma, A2 Döşeme Süreksizliği, A3 Planda Çıkıntı; B1 Zayıf Kat, B2 Yumuşak Kat, B3 Düşey Süreksizlik) | Doğrulandı | 6 düzensizlik tipinin sayısal tahkik formülleri |
| 11 | `zemin-sinifi` | TIER B | TBDY 2018 | 2018 | Bölüm 16, Tablo 16.1 (ZA, ZB, ZC, ZD, ZE, ZF sınıfları) | Doğrulandı | $V_{s,30}$, $N_{60}$, $c_u$ sınır değerleri |
| 12 | `deprem-periyot-hesabi` | TIER A | TBDY 2018 | 2018 | Bölüm 4.8.4 (Ampirik periyot $T_pA$), Bölüm 2.3.4 (Yatay elastik spektrum $S_{ae}(T)$) | Doğrulandı | Spektrum köşe periyotları $T_A, T_B, T_L$ |
| 13 | `goreli-kat-otelemesi` | TIER A | TBDY 2018 | 2018 | Bölüm 4.9.1, Tablo 4.3 ($\lambda \delta_{i,max}/h_i \le \kappa$), İkinci mertebe $\theta_{II}$ | Doğrulandı | Kat ötelemesi sınırları ve gevrek/sünek dolgu duvar etkisi |
| 14 | `radye-temel-hesabi` | TIER A | TS 500 / TBDY 2018 | 2000 / 2018 | TS 500 Madde 8.3 & Madde 12, TBDY Bölüm 16.8 | Doğrulandı | Radye ön kalınlık ($l/10$, $l/15$) ve kolon altı zımbalama tahkiki |
| 15 | `iksa-toprak-basinci` | TIER A | Geoteknik Standartları | - | Rankine & Coulomb Aktif ($K_a$) ve Pasif ($K_p$) Toprak Basıncı Teorileri | Doğrulandı | $K_a = \tan^2(45 - \phi/2)$, $K_p = \tan^2(45 + \phi/2)$, sürşarj & su basıncı |
| 16 | `sev-stabilitesi` | TIER A | Geoteknik / USACE | - | Fellenius (Ordinary Method of Slices) & Basitleştirilmiş Bishop | Doğrulandı | $F_s = \frac{\sum (c' \Delta l + N' \tan \phi')}{\sum T}$, dairesel kayma yüzeyi |
| 17 | `celik-profil-secimi` | TIER A | ÇYTHYE 2018 / TS EN 1993-1-1 | 2018 / 2005 | ÇYTHYE Bölüm 8 (Basınç elemanları), Bölüm 9 (Eğilme elemanları), IPE Profil Serisi | Doğrulandı | Narinlik $\lambda = L_k / i$, burkulma eğrisi, $N_{b,Rd}$, $M_{Rd}$ |
| 18 | `celik-birlestesi-hesabi` | TIER A | ÇYTHYE 2018 / TS EN 1993-1-8 | 2018 / 2005 | ÇYTHYE Bölüm 13 (Cıvatalı ve kaynaklı birleşimler) | Doğrulandı | Bulon kesme $F_{v,Rd}$, ezilme $F_{b,Rd}$, köşe kaynak dayanımı |
| 19 | `ahsap-eleman-hesabi` | TIER A | TS 647 / TS EN 1995-1-1 | 1979 / 2004 | TS 647 Emniyet Gerilmeleri, Eurocode 5 Eğilme & Basınç Narinliği | Doğrulandı | Ahşap sınıfı (C18, C24, D30 vb.), eğilme $\sigma_m \le f_{m,d}$, burkulma $k_c$ |
| 20 | `kalip-sokum-suresi` | TIER B | TS 500 / TS EN 13670 | 2000 / 2010 | TS 500 Madde 13.3 (Kalıp alma süreleri, sıcaklık ve çimento tipi katsayıları) | Doğrulandı | Korumalı regresyon motoru |
| 21 | `dis-cephe-yalitim-kalinligi` | TIER B | TS 825 | 2024 | TS 825:2024 Binalarda Isı Yalıtım Kuralları, $U \le U_{limit}$, $R = \sum d_i/\lambda_i$ | Doğrulandı | Türkiye derece gün bölgeleri (1–6. Bölgeler) |
| 22 | `imar-hesaplayici` | TIER B | Planlı Alanlar İmar Yönetmeliği | 2017/2024 | Madde 5 (TAKS, KAKS/Emsal), Madde 22 (Bahçe çekme mesafeleri, taban oturumu) | Doğrulandı | Arsa alanı, taban alanı, toplam inşaat alanı |
| 23 | `beton-metraj-hesabi` | TIER C | ÇŞİDB Metraj Esasları | 2024 | Geometrik Hacim Hesabı ($V = A \times h$), Pompalı Hazır Beton Zayiat Katsayısı (%3–5) | Doğrulandı | Eleman bazlı (plak, kiriş, kolon, perde, temel) metraj |
| 24 | `hafriyat-metraj-hesabi` | TIER C | Toprak İşleri / ÇŞİDB | 2024 | Kazı Hacmi, Zemin Kabarma Faktörü ($K_b = 1.15–1.40$), Kamyon Taşıma Kapasitesi | Doğrulandı | Doğal zemin hacmi, kabarık hacim, sefer sayısı |
| 25 | `pratik-donati-metraji` | TIER C | Şantiye Pratik Pursantaj Normları | - | Yapı Türüne Göre $kg/m^2$ ve $kg/m^3$ İstatistiksel Pursantaj Aralıkları | Doğrulandı | Konut, ticari, sanayi, perde ağırlıklı sistem aralıkları |
| 26 | `pratik-kalip-metraji` | TIER C | Şantiye Kalıp Katsayıları | - | İnşaat Alanından Kalıp Alanına Geçiş Katsayıları ($m^2 \text{ kalıp} / m^2 \text{ inşaat} \approx 2.5–3.2$) | Doğrulandı | Düşey ve yatay kalıp oranları |
| 27 | `duvar-metraji-hesabi` | TIER C | TS EN 771-1..4 | 2015 | Standart Blok Boyutları (13.5'luk tuğla, 19'luk bims, gazbeton), derz & zayiat | Doğrulandı | Net duvar alanı, kapı/pencere boşluk düşümü, adet metrajı |
| 28 | `siva-boya-metraji` | TIER C | TS 1481 / Boya Normları | - | Yüzey Alanı $\times$ Kat Sayısı, Boya Örtücülüğü ($m^2/L$), Astar & Macun Sarfiyatı | Doğrulandı | Duvar ve tavan net alanları, teneke/kova adedi |
| 29 | `cati-kaplama-metraji` | TIER C | Çatı Kaplama Normları | - | Çatı Eğim Faktörü ($\frac{1}{\cos \alpha}$), Kiremit/m², Mahya, Membran, OSB Hesabı | Doğrulandı | Taban alanı, saçak çıkması, kiremit/paket adedi |
| 30 | `seramik-fayans-metraji` | TIER C | TS EN 14411 / TS EN 12004 | 2016 / 2017 | Seramik Karo Ebatları, Kutu m², Yapıştırıcı ($kg/m^2 \approx 4–5$), Derz Dolgu ($kg/m^2$) | Doğrulandı | Net alan, %5–10 zayiat, kutu ve torba hesabı |
