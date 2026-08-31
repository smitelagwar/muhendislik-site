# Mühendislik Araçları V2 — Nihai Uygulama ve Doğrulama Raporu

> **Tarih:** 31 Ağustos 2026  
> **Kapsam:** Canlı katalogdaki 30 mühendislik aracı  
> **Branch:** `feat/tools-v2-final`  
> **Durum:** ✅ SÜRÜME HAZIR (RELEASE READY)  
> **Kalite Kapısı:** `check:tools` (11/11 suite PASS), `tsc` (0 hata), `lint` (0 hata), `build` (715 sayfa SSG/Static PASS)

---

## 1. 30 Araç Genel Durum Matrisi

| # | ID | Araç Adı | Disiplin | Tier | Rota Tipi | Engine Durumu | UI & Güven Katmanı | Sonuç |
|---|---|---|---|:---:|:---:|:---:|:---:|:---:|
| 1 | `donati-hesabi` | Donatı Alanı Hesabı | Betonarme | B | Dedicated | Korundu | ScopeBadge, SourceStamp, Limitations, SVG Kesit & s_net | ✅ DONE |
| 2 | `kolon-on-boyutlandirma` | Kolon Ön Boyutlandırma | Betonarme | B | Dedicated | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck | ✅ DONE |
| 3 | `kiris-kesiti` | Kiriş Kesiti & Eğilme/Kesme | Betonarme | A | Dedicated | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (Eğilme & Kesme) | ✅ DONE |
| 4 | `doseme-kalinligi` | Döşeme Kalınlığı & Donatı | Betonarme | B | Dedicated | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (Sehim & Kalınlık) | ✅ DONE |
| 5 | `pas-payi` | Pas Payı (Beton Örtüsü) | Betonarme | A | Dedicated | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (Dayanıklılık & Tolerans) | ✅ DONE |
| 6 | `zimbalama-kontrolu` | Döşeme Zımbalama Kontrolü | Betonarme | A | Dedicated | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (vpd vs fctd) | ✅ DONE |
| 7 | `kiris-kesme-etriye` | Kiriş Kesme & Etriye Hesabı | Betonarme | A | Dedicated | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (Vmax ezilme limiti) | ✅ DONE |
| 8 | `kenetlenme-boyu` | Donatı Bindirme & Kenetlenme | Betonarme | A | Dedicated | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (lb & l0) | ✅ DONE |
| 9 | `taban-kesme-kuvveti` | Eşdeğer Deprem Yükü (TBDY) | Deprem | A | Dedicated | Korundu | ScopeBadge, SourceStamp, Limitations, SVG Kat Şeması, GoverningCheck | ✅ DONE |
| 10 | `duzensizlik-kontrolu` | Bina Düzensizlik Kontrolleri | Deprem | A | Dynamic [slug] | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (A1, A2, B2) | ✅ DONE |
| 11 | `zemin-sinifi` | Yerel Zemin Sınıfı Tayini | Geoteknik | A | Dynamic [slug] | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (TBDY Tablo 16.1) | ✅ DONE |
| 12 | `deprem-periyot-hesabi` | Ampirik Periyot & Spektrum | Deprem | A | Dedicated | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (T_amp vs T_ust) | ✅ DONE |
| 13 | `goreli-kat-otelemesi` | Göreli Kat Ötelemesi (Drift) | Deprem | A | Dedicated | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (lambda * delta_max / h) | ✅ DONE |
| 14 | `radye-temel-hesabi` | Radye Temel & Zımbalama | Geoteknik | A | Dynamic [slug] | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (q_zemin & zımbalama) | ✅ DONE |
| 15 | `iksa-toprak-basinci` | İksa Toprak Basıncı (Rankine) | Geoteknik | A | Dedicated | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (Aktif itki & Devrilme) | ✅ DONE |
| 16 | `sev-stabilitesi` | Şev Stabilitesi (Taylor) | Geoteknik | A | Dynamic [slug] | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (Güvenlik Sayısı Fs) | ✅ DONE |
| 17 | `celik-profil-secimi` | Çelik Profil Seçimi & Kapasite | Çelik | A | Dynamic [slug] | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (ÇYTHYE 2018 N/M/V) | ✅ DONE |
| 18 | `celik-birlestesi-hesabi` | Çelik Cıvata & Kaynak Hesabı | Çelik | A | Dynamic [slug] | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (Bulon & Kaynak) | ✅ DONE |
| 19 | `ahsap-eleman-hesabi` | Ahşap Kiriş Taşıma Gücü | Ahşap | A | Dynamic [slug] | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (Eğilme, Kayma, Sehim) | ✅ DONE |
| 20 | `kalip-sokum-suresi` | Kalıp Söküm Süresi | Şantiye | B | Dedicated | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (Sıcaklık & Çimento) | ✅ DONE |
| 21 | `dis-cephe-yalitim-kalinligi` | Dış Cephe Yalıtım (TS 825) | Şantiye | A | Dedicated | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (U_mevcut vs U_hedef) | ✅ DONE |
| 22 | `imar-hesaplayici` | İmar & Emsal Hesaplayıcı | İmar | B | Dedicated | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (TAKS, KAKS, Çekmeler) | ✅ DONE |
| 23 | `beton-metraj-hesabi` | Beton Metrajı & Mikser Seferi | Metraj | C | Dynamic [slug] | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (Brüt sipariş / Sefer) | ✅ DONE |
| 24 | `hafriyat-metraj-hesabi` | Hafriyat Metrajı & Nakliye | Metraj | C | Dynamic [slug] | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (Kabarma & Kamyon) | ✅ DONE |
| 25 | `pratik-donati-metraji` | Pratik Donatı Metrajı | Metraj | C | Dynamic [slug] | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (Ön keşif tonajı) | ✅ DONE |
| 26 | `pratik-kalip-metraji` | Pratik Kalıp & İskele Metrajı | Metraj | C | Dynamic [slug] | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (Kalıp açınımı & Plywood) | ✅ DONE |
| 27 | `duvar-metraji-hesabi` | Duvar & Blok Metrajı | Metraj | C | Dynamic [slug] | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (Alan & Blok adedi) | ✅ DONE |
| 28 | `siva-boya-metraji` | Sıva ve Boya Metrajı | Metraj | C | Dynamic [slug] | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (Yüzey & Sarfiyat) | ✅ DONE |
| 29 | `cati-kaplama-metraji` | Çatı & Ahşap Kaplama Metrajı | Metraj | C | Dynamic [slug] | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (Eğimli yüzey & Kiremit) | ✅ DONE |
| 30 | `seramik-fayans-metraji` | Seramik & Fayans Metrajı | Metraj | C | Dynamic [slug] | Korundu | ScopeBadge, SourceStamp, Limitations, GoverningCheck (Net/Brüt & Kutu adedi) | ✅ DONE |

---

## 2. P0 Doğruluk Borcu ve Normatif Kapsam Denetimi

1. **Düzensizlik Overclaim Temizliği (F0-02):**  
   Katalog ve detay sayfalarında yalnızca motorda gerçeklenen **A1 (Burulma)**, **A2 (Döşeme Süreksizliği)** ve **B2 (Yumuşak Kat)** düzensizlik kontrolleri listelendi. 6 düzensizlik vaadi kaldırıldı.
2. **Tier C Güven Dili Temizliği (F0-03):**  
   8 adet metraj aracında (`pratik-donati-metraji`, `pratik-kalip-metraji`, `duvar-metraji-hesabi`, `siva-boya-metraji`, `cati-kaplama-metraji`, `seramik-fayans-metraji`, `beton-metraj-hesabi`, `hafriyat-metraj-hesabi`) "normatif oran", "kesin sonuç" gibi ifadeler temizlenerek "Yaklaşık Metraj & Ön Keşif" standardına çekildi.
3. **Çelik Profil Veri Kaynağı (F0-04):**  
   Yerel IPE dizisi kaldırıldı; tek canonical kaynak olan `@/lib/engineering/steel/profile-selection` (`STEEL_PROFILES_DATABASE`) bağlandı.
4. **Beton Metrajı Kapsamı (F0-05):**  
   Motor harç hesabı yapmadığı için "Beton & Harç" ifadesi kaldırılarak "Beton Metrajı & Mikser Seferi" olarak netleştirildi.
5. **Ahşap Eleman Kapsamı (F0-06):**  
   `docs/tools/timber-normative-audit-2026.md` audit dokümanı üretildi. UI başlığı ve kapsamı "Ahşap Kiriş Taşıma Gücü & Sehim" olarak daraltıldı; dikme/burkulma vaadi kaldırıldı.

---

## 3. Normative Extensions / Gelecek Faz Kayıtları (BLOCKED)

Aşağıdaki özellikler, normatif kaynak fixture ve katsayı ayrımı gerektirdiğinden planın temel kuralı (R-02 / R-09) gereğince güvenli olarak **BLOCKED** olarak işaretlenmiş ve izlemeye alınmıştır:

| Görev Kodu | Modül | Kapsam | Durum | Gerekçe / Şart |
|---|---|---|:---:|---|
| `EXT-01` | Düzensizlik | A3 — Planda Çıkıntılar | 🛑 BLOCKED | Geometri girdi modeli ve TBDY Tablo 3.6 fixture seti onaylandığında açılacak. |
| `EXT-02` | Düzensizlik | B1 — Zayıf Kat (Dayanım Düzensizliği) | 🛑 BLOCKED | Kat etkili kesme alanı (Akolon + Aperde + 0.15Aduvar) girdi modeli gerektirir. |
| `EXT-03` | Düzensizlik | B3 — Düşey Eleman Süreksizliği | 🛑 BLOCKED | Kolon/perde aks transfer girdi modeli gerektirir. |
| `EXT-04` | Ahşap | Dikme & Basınç Burkulması | 🛑 BLOCKED | TS EN 1995-1-1 Madde 6.3 narinlik ve kc katsayıları normatif fixture seti hazırlanmalıdır. |
| `EXT-05` | Geoteknik | Şev Kritik Dairesel Kayma Arama Ağı (Grid Search) | 🛑 BLOCKED | Şu anda Taylor basitleştirilmiş eğrisi çalışmaktadır; dilim grid optimizasyon motoru gerektirir. |
| `EXT-06` | Geoteknik | Çok Tabakalı Zemin Profili | 🛑 BLOCKED | Çoklu SPT/Vs30 derinlik ağırlıklı harmonik ortalama modeli gerektirir. |

---

## 4. Test Sonuçları Özeti

- **Metadata Cross-Check CI:** 30/30 araç, 0 mismatch (PASS)
- **Inventory & Evidence:** 30/30 canlı araç, 15 dedicated + 15 dynamic kayıtlı (PASS)
- **Baseline Regression:** TS 500, TS EN 1992, TBDY 2018 motorlarında 0 regresyon (PASS)
- **Phase 4-8 Motor Testleri:** 30/30 hesap motoru doğrulandı (PASS)
- **Adversarial & Boundary Testleri:** 14 test suite, 30 motor (aşırı yük, sıfır bölme, negatif input) (PASS)
- **Browser Smoke Testi:** 30/30 rota puppeteer headless ortamında hatasız (PASS)
- **TypeScript Derlemesi (`tsc`):** 0 hata (PASS)
- **ESLint (`lint`):** 0 hata (PASS)
- **Production Build (`npm run build`):** 715 statik sayfa derlendi (PASS)

---

## 5. Kalan Risk Değerlendirmesi

1. **Performans & Bundle:** Yeni ağır kütüphane eklenmedi; tüm görselleştirmeler hafif SVG ve CSS ile inşa edildi.
2. **Erişilebilirlik (a11y):** Tüm grafik ve kartlarda text fallback ve semantik başlık hiyerarşisi uygulandı.
3. **Mobil Uyumluluk:** 320px - 1440px arası horizontal overflow kontrolleri smoke testinde doğrulandı.
