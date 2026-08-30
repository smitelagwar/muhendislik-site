# POST_IMPLEMENTATION_AUDIT — 30/30 Araç Teknik Denetim Raporu

> **Referans Plan:** `C:\Users\hsyn\Downloads\plan.md`  
> **Temel Commit:** `bb0349b3b8d6c70b2b9d49e838ac0f116fa79b29`  
> **Kapsam:** `/kategori/araclar` altındaki 30 mühendislik ve metraj aracı  
> **Tarih:** 30 Ağustos 2026

---

## 1. Yönetici Özeti

30 mühendislik aracının tamamı için rota (`/kategori/araclar/[slug]`), kullanıcı arayüzü (`src/components/*`) ve saf TypeScript hesap motorları (`src/lib/*`) oluşturulmuştur. Ancak yapılan teknik audit sonucunda, bazı hesap motorlarının katalog vaatlerini tam karşılamadığı, bazı parametrelerin kullanılmadığı, doğrulama sisteminin kendi kendini onayladığı (self-certifying verification) ve bağımsız oracle testlerinin eksik olduğu tespit edilmiştir.

Bu belge, tespit edilen tüm eksiklikleri (P0 Blocker, P1 Yüksek Öncelik, P2 İyileştirme) sınıflandırır ve düzeltme planının zeminini oluşturur.

---

## 2. Tespit Edilen Bulgular ve Sınıflandırma

### 2.1 Doğrulama ve Güven Sistemi Sorunları (P0 — RELEASE BLOCKER)
1. **[PROCESS_GAP / P0] Registry & Inventory Self-Certification:**
   - `src/lib/tool-registry.ts` ve `scripts/check-tools-inventory.ts` dosyalarında `status: "verified"` ve `status: "live-ready"` statüleri elle hardcoded yazılmıştır. Testler gerçek fiziki kanıt yerine bu bayrakları okuyarak "PASS" vermektedir.
2. **[TEST_GAP / P0] Browser Smoke Gerçek Hesaplama Yaptırmıyor:**
   - `scripts/check-tools-browser-smoke.mjs` sayfayı açıp başlık ve input varlığını denetlemekte, ancak form girdilerini doldurup hesaplanan sayısal sonucun beklenen bağımsız oracle ile eşleştiğini doğrulamamaktadır.
3. **[TEST_GAP / P0] Adversarial Test Kapsamı Eksik:**
   - Sınır durum ve geçersiz girdi testleri 30 aracın tamamını eksiksiz test edecek şekilde yapılandırılmamıştır.
4. **[PROCESS_GAP / P0] Source Ledger Yetersiz Kanıt:**
   - `docs/TOOLS_SOURCE_LEDGER.md` içinde bazı kaynaklar "Geoteknik Standartları", "Şantiye Pratik Pursantaj Normları" gibi genel isimlerle geçmekte, exact madde/denklem seviyesinde belirtilmemektedir.

---

### 2.2 Yüksek Riskli Hesap Motoru Hataları (P0 — RELEASE BLOCKER)

1. **[CONFIRMED_DEFECT / P0] Eşdeğer Deprem Yükü (`base-shear.ts`):**
   - Sabit ortalama zemin katsayısı tablosu oluşturulmuş ($F_s, F_1$ ortalamaları); mevcut `site-coefficients.ts` helper'ı atlanmıştır.
   - $R_a(T)$ periyoda bağlı azaltma katsayısı, $D$ parametresi ve $C_t$ katsayısı eksiktir. Kat bazlı $W_i/h_i$ yerine eşit kat ağırlığı varsayımı yapılmıştır.
2. **[CONFIRMED_DEFECT / P0] Yerel Zemin Sınıfı (`soil-class.ts`):**
   - Veri girilmediğinde `ZD`'ye sessizce düşme davranışı mevcuttur. Çoklu kriter çelişki analori yoktur.
3. **[SCOPE_MISMATCH / P0] Bina Düzensizlikleri (`irregularity.ts`):**
   - Katalog A1–A3 ve B1–B3 vaat ederken motor yalnız A1, A2 ve B2 alt kümesini hesaplamaktadır.
4. **[CONFIRMED_DEFECT / P0] Göreli Kat Ötelemesi (`drift.ts`):**
   - $\lambda$ katsayısı semantiği belirsizdir, mutlak deplasman farkı yerine tutarsız girdi kabulü riski vardır; ikinci mertebe $\theta_{II}$ göstergesi hesaplanmamaktadır.
5. **[CONFIRMED_DEFECT / P0] İksa & Toprak Basıncı (`retaining-wall.ts`):**
   - Coulomb gerçek geometrik parametrelerle hesaplanmamakta, Mononobe-Okabe basitleştirilmiş yapay formülle ($K_{ae} = K_a(1+1.5k_h)$) geçiştirilmektedir.
6. **[CONFIRMED_DEFECT / P0] Şev Stabilitesi (`slope-stability.ts`):**
   - Gerçek Fellenius dilim yöntemi (Ordinary Method of Slices, kayma dairesi, dilim geometrisi) bulunmamaktadır.
7. **[SCOPE_MISMATCH / P0] Radye Temel (`mat-foundation.ts`):**
   - $f_{yd}$ girdisi alınmakta ama kullanılmamaktadır; gerçek flexural donatı hesabı yapılmamaktadır; $d$ için clamp kullanılmıştır.
8. **[SCOPE_MISMATCH / P0] Döşeme Zımbalama (`punching.ts`):**
   - Katalog zımbalama donatısı vaat ederken motor yalnız "gerekli" bayrağı dönmekte, donatı miktarı ($A_{sw}$) boyutlandırmamaktadır.
9. **[CONFIRMED_DEFECT / P0] Çelik Profil Seçimi (`profile-selection.ts`):**
   - Bilinmeyen profilde sessizce `IPE 270` default'una düşmektedir; tek bir burkulma eğrisi ile tüm eksenler genellenmiştir.
10. **[CONFIRMED_DEFECT / P0] Çelik Birleşimleri (`connection.ts`):**
    - Cıvata yerleşim mesafeleri ($e_1, e_2, p_1, p_2$) alınmadan sahte ezilme (bearing) katsayıları kullanılmıştır.
11. **[CONFIRMED_DEFECT / P0] Ahşap Eleman Hesabı (`timber-member.ts`):**
    - `axialLoadKn` girdisi alınmakta ama hesapta hiç kullanılmamaktadır (Dikme hesabı çalışmamaktadır).

---

### 2.3 Metraj ve İkincil Araç Sorunları (P1 — YÜKSEK ÖNCELİK)

1. **[SCOPE_MISMATCH / P1] Pratik Donatı Metrajı (`rebar-ratio.ts`):**
   - Katalog alan veya beton hacmi vaat ederken motor yalnız alan üzerinden hesaplamaktadır.
2. **[CONFIRMED_DEFECT / P1] Pratik Kalıp Metrajı (`formwork-ratio.ts`):**
   - `systemType` seçimi hesap sonucunu değiştirmemektedir.
3. **[CONFIRMED_DEFECT / P1] Hafriyat Metrajı (`excavation.ts`):**
   - Geçersiz kamyon kapasitesinde sessizce 15 m³'e fallback yapılmaktadır.
4. **[CONFIRMED_DEFECT / P1] Duvar Metrajı (`masonry.ts`):**
   - Boşluk alanı duvar alanından büyük olduğunda invalid geometry hatası yerine sıfıra clamp edilmektedir.
5. **[PROCESS_GAP / P1] Sıva-Boya ve Seramik Metrajı:**
   - Tüketim ve kutu metraj presetleri düzenlenebilir custom mode içermemektedir.
6. **[SCOPE_MISMATCH / P1] Çatı Kaplama Metrajı (`roof-covering.ts`):**
   - Araç adı "Çatı & Ahşap Metrajı" olmasına rağmen ahşap karkas metrajı üretmemektedir.
7. **[NORMATIVE_REVALIDATION_REQUIRED / P1] Kiriş Kesme & Etriye (`shear-stirrup.ts`):**
   - Gerekli etriye aralığı 5 cm altına düştüğünde 5 cm'ye clamp edilmekte, kesit yetersizliği uyarısı verilmemektedir.

---

### 2.4 Korumalı Hesaplayıcılar Denetimi (P1 / PROTECTED)

1. **Kolon Ön Boyutlandırma (`column.ts`):**
   - Donatı ağırlığı formülündeki 1000 kat hatası düzeltilmiştir (`8Ø20 → 19.73 kg/m`). Bu düzeltme fiziksel olarak doğrudur ancak `docs/tools/corrections/column-rebar-mass.md` altında retrospective kayıt olarak belgelenecektir.
2. **Kiriş, Döşeme, Pas Payı ve Kalıp Söküm:**
   - Sayısal çıktıları baseline fixture'ları ile tam eşleşmektedir; formül değiştirilmeyecektir.

---

## 3. Güncel 30 Araçlık Durum Matrisi (Audit Sonrası)

| # | Araç ID | Kategori | Mevcut Kod | Audit Durumu | Hedef Faz |
|---|---|---|---|---|---|
| 1 | `donati-hesabi` | Betonarme | Implemented | Re-Audit / Verified | FAZ C, D |
| 2 | `kolon-on-boyutlandirma` | Betonarme | Implemented | Protected / Documented | FAZ C, D |
| 3 | `kiris-kesiti` | Betonarme | Implemented | Protected / Verified | FAZ C, D |
| 4 | `doseme-kalinligi` | Betonarme | Implemented | Protected / Verified | FAZ C, D |
| 5 | `pas-payi` | Betonarme | Implemented | Protected / Verified | FAZ C, D |
| 6 | `zimbalama-kontrolu` | Betonarme | Implemented | **P0 Blocker** | FAZ G |
| 7 | `kiris-kesme-etriye` | Betonarme | Implemented | **P0/P1 Blocker** | FAZ G |
| 8 | `kenetlenme-boyu` | Betonarme | Implemented | **P1 Blocker** | FAZ G |
| 9 | `taban-kesme-kuvveti` | Deprem | Implemented | **P0 Blocker** | FAZ E |
| 10 | `duzensizlik-kontrolu` | Deprem | Implemented | **P0 Blocker** | FAZ E |
| 11 | `zemin-sinifi` | Deprem | Implemented | **P0 Blocker** | FAZ E |
| 12 | `deprem-periyot-hesabi` | Deprem | Implemented | Re-Audit / Verified | FAZ E |
| 13 | `goreli-kat-otelemesi` | Deprem | Implemented | **P0 Blocker** | FAZ E |
| 14 | `radye-temel-hesabi` | Geoteknik | Implemented | **P0 Blocker** | FAZ G |
| 15 | `iksa-toprak-basinci` | Geoteknik | Implemented | **P0 Blocker** | FAZ F |
| 16 | `sev-stabilitesi` | Geoteknik | Implemented | **P0 Blocker** | FAZ F |
| 17 | `celik-profil-secimi` | Çelik | Implemented | **P0 Blocker** | FAZ H |
| 18 | `celik-birlestesi-hesabi` | Çelik | Implemented | **P0 Blocker** | FAZ H |
| 19 | `ahsap-eleman-hesabi` | Ahşap | Implemented | **P0 Blocker** | FAZ H |
| 20 | `kalip-sokum-suresi` | Betonarme | Implemented | Protected / Verified | FAZ C, D |
| 21 | `dis-cephe-yalitim-kalinligi` | Yalıtım | Implemented | Re-Audit / Verified | FAZ I |
| 22 | `imar-hesaplayici` | İmar | Implemented | Re-Audit / Verified | FAZ I |
| 23 | `beton-metraj-hesabi` | Metraj | Implemented | **P1 Blocker** | FAZ I |
| 24 | `hafriyat-metraj-hesabi` | Metraj | Implemented | **P1 Blocker** | FAZ I |
| 25 | `pratik-donati-metraji` | Metraj | Implemented | **P1 Blocker** | FAZ I |
| 26 | `pratik-kalip-metraji` | Metraj | Implemented | **P1 Blocker** | FAZ I |
| 27 | `duvar-metraji-hesabi` | Metraj | Implemented | **P1 Blocker** | FAZ I |
| 28 | `siva-boya-metraji` | Metraj | Implemented | **P1 Blocker** | FAZ I |
| 29 | `cati-kaplama-metraji` | Metraj | Implemented | **P1 Blocker** | FAZ I |
| 30 | `seramik-fayans-metraji` | Metraj | Implemented | **P1 Blocker** | FAZ I |

---

## 4. FAZ A Çıkış Kriteri (Gate)
- Tüm 30 araç için eksiklikler netleştirildi.
- P0 araçların erken "verified" statüsü geçersiz ilan edildi.
- FAZ B'ye (False Verification Mantığını Kaldırma) geçiş hazır.
