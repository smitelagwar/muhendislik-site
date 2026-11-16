# Tahmini Laboratuvar Ücreti — Mevzuat, Standartlar ve Resmî Tarife Araştırması (2026)

> **Kapsam:** Türkiye'de 4708 sayılı Yapı Denetimi Hakkında Kanun kapsamındaki yapılarda yapı malzemeleri laboratuvarı giderlerinin yasal dayanakları, numune alma standartları, EBİS çip (beton etiketi) bedelleri ve 2026 resmî tarife/birim fiyat mekanizması.

---

## 1. Yasal Çerçeve ve Ödeme Sorumluluğu (22 Şubat 2024 Dönüm Noktası)

- **Ana Mevzuat:**
  - **4708 sayılı Yapı Denetimi Hakkında Kanun** (özellikle Madde 5 ve Madde 12)
  - **Yapı Denetimi Uygulama Yönetmeliği**
  - **Yapı Malzemeleri ve Zemin Laboratuvarları Uygulama Yönetmeliği**
- **Kritik Değişiklik (22 Şubat 2024 — RG 32468):**
  - 22 Şubat 2024 tarihinden sonra yapı denetimi hizmet sözleşmesi imzalanan **betonarme yapılarda** taşıyıcı sisteme ilişkin:
    1. Taze beton deney bedelleri,
    2. Sertleşmiş beton (karot) deney bedelleri,
    3. Betonarme çeliği (donatı çekme/kütle) deney bedelleri,
    4. EBİS beton deneylerinin izlenmesine yönelik **etiket (RFID çip)** bedelleri
    artık yapı denetim hizmet bedelinden ayrılmış olup **doğrudan yapı müteahhidi** tarafından karşılanır.
  - Bu kapsamda yapı müteahhidi ile Bakanlıktan izin belgeli laboratuvar kuruluşu arasında Yönetmelik **Ek-10 (Laboratuvar Hizmet Sözleşmesi)** imzalanır ve faturalar doğrudan laboratuvara ödenir.
  - **İstisna:** Betonarme dışındaki yapılarda (çelik, yığma, prefabrik vb.) taşıyıcı sistem deney bedelleri hâlâ yapı denetim hizmet bedeline dahildir. Ayrıca taşıyıcı sistem dışındaki özel deneyler (ısı/ses/yangın yalıtımı vb.) talep edilirse bedeli yapı sahibince karşılanır.

---

## 2. Taze Beton Deney Tarifesi — Ek-9 Tarife Cetveli ve 2026 Projeksiyonu

### 2.1. Resmî Taban Fiyatlar (RG 32132 — 14 Mart 2023 & RG 32304 — 9 Eylül 2023)
Yönetmeliğin **Ek-9 Tarife Cetveli**, laboratuvarlara ödenecek taze beton deneyi bedellerinin (çökme/slump, şantiyeden numune alma, kürleme ve basınç dayanımı dahil — **1 adet numune için**) alt ve üst sınırlarını belirler. Fiyatlar **KDV hariçtir**:

| Numune Türü (1 Adet) | 2023 Baz Asgari (TL) | 2023 Baz Azami (TL) |
| --- | ---: | ---: |
| **Küp Numune** (çökme + alma + kür + basınç) | 68,74 TL | 114,58 TL |
| **Silindir Numune** (çökme + alma + kür + basınç) | 95,18 TL | 158,64 TL |

### 2.2. Yönetmelik Güncelleme Formülü (2024–2026)
Yönetmelik Ek-9 hükmüne göre birim fiyatlar her yıl **1 Ocak** tarihinden geçerli olmak üzere güncellenir ve küsuratlar **bir üst tamsayıya tamamlanır**:
- **2024 ve 2025 yılları:** Bir önceki yılın Aralık ayı **TÜİK Yİ-ÜFE** yıllık değişim oranıyla güncellenir:
  - Aralık 2023 Yİ-ÜFE: **%44,22**
  - Aralık 2024 Yİ-ÜFE: **%28,52**
- **2026 yılı ve sonrası:** Yönetmelik revizyonu ile bir önceki yılın **(Yİ-ÜFE + TÜFE) / 2** ortalaması esas alınmaya başlanmıştır (bkz. `yapi-denetim-ucreti` modülü ile aynı endeks):
  - Aralık 2025 Yİ-ÜFE: **%27,67**
  - Aralık 2025 TÜFE: **%30,89**
  - **2026 Güncelleme Oranı:** `(27,67 + 30,89) / 2 = %29,28`

| Yıl | Endeks Artışı | Küp Asgari (KDV Hariç) | Küp Azami (KDV Hariç) | Silindir Asgari (KDV Hariç) | Silindir Azami (KDV Hariç) |
| --- | :---: | ---: | ---: | ---: | ---: |
| **2023 Baz (RG 32304)** | — | 68,74 TL | 114,58 TL | 95,18 TL | 158,64 TL |
| **2024 (1 Ocak)** | %44,22 | 100 TL | 166 TL | 138 TL | 229 TL |
| **2025 (1 Ocak)** | %28,52 | 129 TL | 214 TL | 178 TL | 295 TL |
| **2026 (1 Ocak Projeksiyonu)** | %29,28 | **167 TL** *(ham: 165)* | **277 TL** *(ham: 275)* | **231 TL** *(ham: 228)* | **382 TL** *(ham: 379)* |
| **2026 KDV Dahil (%20)** | — | **~200 TL / adet** | **~332 TL / adet** | **~277 TL / adet** | **~458 TL / adet** |

> **Not:** Danıştay 6. Dairesi ve İdari Dava Daireleri Kurulu kararlarıyla Bakanlığın Ek-9 kapsamında asgari-azami sınır belirleme yetkisi hukuka uygun bulunmuştur; laboratuvarlar asgarinin altında, azaminin üstünde taze beton ücreti uygulayamaz.

---

## 3. ÇŞİDB Döner Sermaye 2026 Birim Fiyat Listesi (Çelik & Beton Tekil Deneyler)

Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Strateji Geliştirme Başkanlığı Döner Sermaye İşletmesi Müdürlüğü'nün **2026 Yılı Birim Fiyat Listesi** içinde yer alan doğrulanmış yapı malzemesi deney kalemleri:

| Deney Kalemi | Kapsam / Standart | KDV Hariç | KDV (%20) | KDV Dahil |
| --- | --- | ---: | ---: | ---: |
| **Beton Çelik Çubuklar — Çekme Deneyi** | Akma-çekme dayanımı ve % uzama (her çap için **3 adet**, TS 708 / TS EN ISO 6892-1) | **666,30 TL** | 133,26 TL | **799,56 TL** |
| **Beton Çelik Çubuklar — Gözle Muayene ve Kütle Tayini** | Her çap için **3 adet** | **106,61 TL** | 21,32 TL | **127,93 TL** |
| **Beton Çelik Çubuklar — Kimyasal Analiz** | Her çap için 1 adet (opsiyonel/özel durum) | 1.332,60 TL | 266,52 TL | 1.599,12 TL |
| **Sertleşmiş Beton Basınç / Tekil Muayene** | TS EN 12390-3 tekil laboratuvar basınç testi veya çekiç/başlıklama kalemi | 106,61 TL | 21,32 TL | 127,93 TL |

*Standart bir donatı çeliği çap grubunda rutin kabul için **Çekme + Kütle/Gözle Muayene** birlikte yapıldığında resmî referans toplam: `666,30 + 106,61 = 772,91 TL` KDV hariç (**927,49 TL** KDV dahil / takım).*

---

## 4. EBİS RFID Beton Etiketi (Çip) Bedeli

- **Yürütücü Kurum:** ÇŞİDB ve Savunma Sanayii Başkanlığı iş birliğiyle **Aselsannet** (`ebistr.com`).
- **Mevzuat Esası:** Etiket bedeli her yıl **15 Ocak** tarihinden itibaren geçerli olmak üzere güncellenir.
- **Tarihsel & Güncel Bedel:**
  - Sistem ilk kurulduğunda tebliğ başlangıcında KDV dahil **8 TL** idi.
  - Güncel 2025–2026 verilerinde:
    - Şantiye fatura/saha paylaşım verilerinde (YouTube şantiye günlükleri): `100 adet çip = 11.500 TL` (**115 TL / adet**).
    - 2026 yılı resmî Aselsannet fatura kaleminde (`ASN-5000-0086 Beton Etiketi`): **123,49 TL** (KDV hariç referans birim tutar; %20 KDV ile **148,19 TL**; kullanıcı arayüzünde birim fiyat düzenlenebilir olmalıdır).
- Her alınan taze beton numunesi (7 günlük ve 28 günlük küp/silindirlerin her biri) içine **1 adet RFID çip** yerleştirilir; dolayısıyla **toplam çip sayısı = toplam taze beton numune sayısıdır**.

---

## 5. Numune Alma Sıklığı Kuralları

### 5.1. Taze Beton Numunesi — TS 13515 (Çizelge B1.1) & 2022/7 Sayılı Genelge
Her döküm gününde iki kriterden (**1. Kriter: Dökülen beton hacmi m³**, **2. Kriter: Dökülen alan m²**) hangisi daha fazla numune gerektiriyorsa o uygulanır:

| Günlük Beton Hacmi (m³) | Dökülen Alan (m²) | Asgari Mikser Sayısı | 7 Günlük | 28 Günlük | Toplam Numune |
| :--- | :--- | :---: | :---: | :---: | :---: |
| Tek yük / 0 – 24 m³ | Alt sınır | 1–2 | 2 | 6 | **8** |
| 25 – 100 m³ | < 450 m² | 3 | 3 | 9 | **12** |
| 101 – 150 m³ | 451 – 650 m² | 4 | 4 | 12 | **16** |
| 151 – 200 m³ | 651 – 850 m² | 5 | 5 | 15 | **20** |
| 201 – 250 m³ | 851 – 1.050 m² | 6 | 6 | 18 | **24** |
| 251 – 300 m³ | 1.051 – 1.250 m² | 7 | 7 | 21 | **28** |
| 301 – 400 m³ | 1.251 – 1.450 m² | 8 | 8 | 24 | **32** |
| 401 – 500 m³ | 1.451 – 1.650 m² | 9 | 9 | 27 | **36** |
| 501 – 600 m³ | 1.651 – 1.850 m² | 10 | 10 | 30 | **40** |
| **> 600 m³** | **> 1.850 m²** | +1 mikser / her 200 m³ (veya 200 m²) | +1 | +3 | **+4** |

- **C55/67 ve üzeri yüksek dayanımlı betonlar:** Tablodaki tüm numune sayıları **2 katına (×2)** çıkarılır.

### 5.2. Donatı Çeliği (Demir) Numunesi — TS 708
- Aynı sınıf ve anma çapındaki donatılar bir parti sayılır; **her çap (Ø8, Ø10, Ø12, Ø14, Ø16, Ø20 vb.) ayrı parti** olarak değerlendirilir.
- Her çaptan **ilk 90 tona kadar 1 takım (3 adet 1 m çubuk)** numune alınır.
- 90 tonu aşan miktarlarda **her 30 ton için +1 takım (3 adet)** ilave edilir (uygulamada farklı sevkiyat/farklı üretici partilerinde ek takım gerekebilir).
- Tipik bir konut yapısında ortalama **4–6 farklı demir çapı** kullanılır.

### 5.3. Karot (Sertleşmiş Beton) ve Zemin Laboratuvarı
- **Karot (TS EN 12504-1 / TS EN 13791):** Yeni yapılan bir inşaatta taze beton 28 günlük kırımları standardı sağladığı sürece **karot alınmaz (0 TL)**. Yalnız dayanım şüphesi/düşük sonuç veya mevcut bina performans/riskli yapı analizinde devreye girer. Piyasa + üniversite karot alma + test maliyeti adet başına ortalama **1.200 – 3.500 TL** (6–12 numunelik tam bina analizi **18.000 – 45.000 TL**) aralığındadır.
- **Zemin Mekaniği Laboratuvarı:** Ruhsat öncesi **Zemin Etüdü** kapsamında jeoteknik firma tarafından yaptırılır (sondaj + SPT + MASW + elek/Atterberg/üç eksenli laboratuvar deneyleri dahil komple paket konutlarda **25.000 – 60.000 TL**, ticari yapılarda **100.000 – 200.000 TL**). Müteahhidin Ek-10 yapı laboratuvarı sözleşmesinden ayrıdır.
