# Ahşap Eleman Hesabı — Normatif ve Kapsam Denetimi (2026)

> **Tarih:** 2026-08-31
> **Araç:** hsap-eleman-hesabi
> **İlgili Dosyalar:** src/lib/engineering/timber/timber-member.ts, src/components/timber-member-calculator.tsx, src/lib/tools-data.ts
> **Görev:** F0-06 (NORMATIVE_AUDIT)

---

## 1. Mevcut Durum Analizi

### 1.1 UI İddiası ve Görünüm
- **Katalog Başlığı:** Ahşap Eleman Hesabı
- **UI Başlığı:** Ahşap Kiriş ve Dikme Hesabı
- **UI Açıklaması:** Eurocode 5 (TS EN 1995-1-1) standartlarına göre masif ahşap ve lamine (glulam) kirişlerde eğilme mukavemeti, kayma gerilmesi ve sehim sınır durumu tahkiklerini gerçekleştirin.
- **UI Girdileri:**
  - Ahşap Sınıfı (C18, C24, C30, GL24h)
  - Yük Süresi Sınıfı (Kalıcı, Orta, Kısa)
  - Genişlik b (mm), Yükseklik h (mm), Açıklık L (m)
  - Düşey Düzgün Yayılı Yük q (kN/m)
- **UI Eksikliği:** Kullanıcı arayüzünde eksenel basınç yükü (Ned), narinlik/burkulma boyu veya dikme modu için hiçbir girdi alanı bulunmamaktadır.

### 1.2 Hesap Motoru Durumu (	imber-member.ts)
- Motorda Eurocode 5 Madde 6.3.2 formülasyonuyla narinlik lambda, göreli narinlik lambda_rel, burkulma katsayısı kc ve eksenel basınç kapasitesi Nc,Rd = kc * A * fc0d kodlanmıştır.
- Ancak UI tarafında Ned ve memberType parametreleri motora aktarılmamaktadır (varsayılan: Ned = 0, memberType = beam).
- Motor sonuçları arasında eksenel kapasite üretilse de, component yalnızca kiriş eğilme momenti, kesme gerilmesi ve sehim oranını göstermektedir.

---

## 2. Normatif Referanslar ve Türkiye Mevzuatı

### 2.1 Yürürlükteki Standartlar
1. **TS EN 1995-1-1:2004+A2:2014 (Eurocode 5):** Ahşap yapıların tasarımı - Genel - Ortak kurallar ve binalar için kurallar.
2. **TS 647 (Tarihsel):** Ahşap Yapıların Hesap ve Yapım Kuralları (Eski gerilme yöntemi).
3. **Türkiye Ahşap Bina Yönetmeliği (TABY 2025):** 1 Ocak 2025 tarihinde yürürlüğe giren ulusal ahşap bina tasarım yönetmeliği.

### 2.2 Formülasyon Uyumu
- Mevcut motordaki katsayılar (kmod: 0.6 / 0.8 / 0.9, gammaM: 1.30 / 1.25) Eurocode 5 temel değerleriyle tam uyumludur.
- Sehim sınırı L/300 olarak uygulanmaktadır.

---

## 3. Karar ve Eylem Planı

1. **P0 Güven Dili / Scope Düzeltmesi (Bu Faz):**
   - UI başlığı ve vitrin kartı, fiilen hesaplanan kapsama uygun olarak **Ahşap Kiriş Taşıma Gücü ve Sehim Hesabı** olarak netleştirilecektir.
   - Böylece kullanıcıya sunulmayan bir dikme hesabı vaat edilmeyecektir.
2. **Gelişmiş Dikme / Kolon Modu (Faz 5 / Faz 10):**
   - Dikme modu, ayrı bir ENGINE_EXTENSION görevi olarak ele alınacaktır.
   - Kolon modu için UI tarafına:
     - Eleman türü seçimi (Kiriş / Dikme),
     - Eksenel yük Ned (kN),
     - Etkili burkulma boyu Lk (m)
     girdileri eklenecektir.
   - Bu genişletme yapılmadan önce altın test fixtürleri hazırlanacaktır.

---

## 4. Sonuç
Motor ile UI arasındaki kapsam açığı belgelenmiş, faz kuralı uyarınca UI başlığının daraltılması ve dikme modunun onaylı fixtürlerle ayrı faza bırakılması kararlaştırılmıştır.