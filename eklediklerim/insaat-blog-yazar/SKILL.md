---
name: insaat-blog-yazar
description: >
  İnşaat mühendisliği blog yazıları üretmek için kapsamlı bir içerik üretim skili. 
  Kullanıcı bir inşaat, yapı, deprem, zemin, betonarme, çelik, tasarım veya şantiye 
  konusunda blog yazısı yazmak istediğinde MUTLAKA bu skili kullan. 
  Konu hakkında önce araştırma yapar, ardından akademik makale kalitesinde, 
  sayısal örnekler + yönetmelik madde referansları + yazılım/araç listeleri + 
  sık yapılan hatalar bölümleri içeren, hem saha hem tasarım mühendislerine hitap eden 
  Türkçe blog içeriği üretir. "Blog yaz", "makale yaz", "içerik üret", "yazı hazırla", 
  "detaylı anlat", "konu anlat" gibi ifadeler kullanıldığında tetikle.
---

# İnşaat Mühendisliği Blog Yazarı

## Hedef

Yüzeysel özet yazıları değil, saha mühendisi, tasarım mühendisi ve akademisyenlerin **gerçekten okumaya değer** bulduğu, **teknik derinliği olan** Türkçe blog içeriği üretmek.

## Hedef Kitle

- **Saha mühendisleri:** Pratik uygulama, kontrol noktaları, dikkat edilecekler
- **Tasarım mühendisleri:** Formüller, hesap adımları, yönetmelik maddeleri, sayısal örnekler
- **Akademisyenler:** Kaynak/referans ağırlıklı, standart madde numaraları, literatür

---

## Adım 1 — Araştırma Yap

Konuyu yazmadan önce `web_search` ile **en az 3-5 arama** yap:

1. Konunun Türkçe yönetmelik (TBDY 2018, TS 500, TS EN 1992, TS EN 1993, vb.) kapsamını araştır
2. İlgili standart madde numaralarını bul
3. Tipik sayısal değerleri, sınır değerleri, formülleri araştır
4. Kullanılan yazılım ve araçları araştır
5. Sık yapılan hataları ve pratik uyarıları araştır

> Araştırmadan yazma. Sayısal değer ve madde numaraları için önce teyit et.

---

## Adım 2 — Yazı Yapısını Kur

Her yazıda **şu bölümler zorunludur:**

```
1. Giriş ve Kapsam
2. Teorik Temel / Kavramsal Çerçeve
3. Yönetmelik / Standart Gereksinimleri (madde numaralı)
4. Hesap Yöntemi / Tasarım Adımları
5. Sayısal Çözümlü Örnek
6. Kullanılan Yazılım ve Araçlar
7. Sık Yapılan Hatalar ve Dikkat Edilecekler
8. Özet ve Sonuç
9. Kaynaklar / Referanslar
```

Konuya göre ek bölümler eklenebilir (ör. "Karşılaştırmalı Analiz", "Tarihsel Gelişim", "İklim / Bölge Farklılıkları").

---

## Adım 3 — İçerik Standartları

### 3.1 Giriş ve Kapsam
- Konunun neden önemli olduğunu 2-3 paragrafta açıkla
- Yazının kapsamını ve hedef kitlesini belirt
- Varsa önceki yönetmelikle farkı vurgula

### 3.2 Teorik Temel
- Konunun fizik/mühendislik altyapısını açıkla
- Temel formülleri LaTeX benzeri gösterimle yaz (ör. `σ = N/A`)
- Varsayımları ve sınır koşullarını belirt

### 3.3 Yönetmelik / Standart Gereksinimleri
- **Her madde için tam referans ver:** Yönetmelik adı + Bölüm + Madde numarası
  - Örnek: `TBDY 2018, Bölüm 4, Madde 4.3.2`
  - Örnek: `TS 500:2000, Madde 7.4.1`
- Zorunlu koşulları açık biçimde tabloya al
- Minimum/maksimum sınır değerlerini tabloda göster

**Tablo örneği:**
| Parametre | Sınır Değer | Referans Madde |
|-----------|------------|----------------|
| Minimum boyuna donatı oranı (ρ_min) | 0.01 (SDY kiriş) | TBDY 2018, Md. 7.4.1 |
| Maksimum boyuna donatı oranı (ρ_max) | 0.04 | TBDY 2018, Md. 7.4.1 |

### 3.4 Hesap Adımları
- Adım adım, numaralı liste halinde yaz
- Her adımda hangi formülün uygulandığını belirt
- Ara hesapları göster, sonuca atlamadan

### 3.5 Sayısal Çözümlü Örnek (**ZORUNLU**)
- Gerçekçi, pratik bir örnek seç (ör. 4 katlı bina kolonu, 6m açıklıklı kiriş)
- **Veri tablosu** ile başla (kesit, malzeme, yük)
- Her hesap adımını göster
- Sonuçları tabloya aktar
- Kontrol adımını unutma (ör. "TS 500 şartı sağlanıyor mu?")

Örnek format:
```
### Örnek: 30x60 Kiriş Donatı Hesabı

**Verilen:**
- Kesit: b = 300 mm, h = 600 mm
- Beton: C30/37 → fck = 30 MPa, fcd = 20 MPa
- Çelik: B420C → fyk = 420 MPa, fyd = 365 MPa
- Tasarım momenti: Md = 180 kNm

**Çözüm:**
Adım 1: Faydalı yükseklik → d = h - pas payı - Φ/2 = 600 - 30 - 10 = 560 mm
Adım 2: ...
```

### 3.6 Kullanılan Yazılım ve Araçlar (**ZORUNLU**)
Her konuya özgü araç listesi hazırla. Şu kategorilere göre ayır:

| Kategori | Araç/Yazılım | Açıklama |
|----------|-------------|----------|
| Analiz yazılımı | İdecad, SAP2000, ETABS | Taşıyıcı sistem analizi |
| Çizim | AutoCAD, Revit | Proje çizimi |
| Hesap | Excel şablonları, Python | Manuel kontrol |
| Saha ekipmanı | Schmidt çekici, karot makinesi | Mevcut bina tespiti |

> Konuya göre doğru araçları seç. Her konuya aynı listeyi verme.

### 3.7 Sık Yapılan Hatalar (**ZORUNLU**)
En az **5 madde** yaz. Her hata için:
- ❌ Yanlış uygulama ne
- ✅ Doğru uygulama ne
- 📌 Referans madde (varsa)

Örnek:
> ❌ **Hata:** Deprem yükü hesabında zemin sınıfını varsayılan ZC alarak geçmek  
> ✅ **Doğru:** Zemin etüdü raporundan VS30 değerini alarak TBDY 2018 Tablo 2.1'e göre zemin sınıfını belirlemek  
> 📌 TBDY 2018, Madde 2.3.1

### 3.8 Özet Tablosu
Yazının sonunda tüm kritik değerleri tek tabloda topla.

### 3.9 Kaynaklar
- TBDY 2018, DBYBHY 2007
- TS 500, TS EN 1992, TS EN 1993 (konuya göre)
- Resmi yayınlar, akademik makaleler
- İlgili yönetmelik/tebliğ

---

## Adım 4 — İçindekiler

Yazının en üstüne **İçindekiler tablosu** ekle. Tüm başlık ve alt başlıkları içersin. Uzun bir yazıda okuyucu nereye bakacağını bilmeli.

---

## Adım 5 — Ton ve Dil

- **Dil:** Türkçe, teknik ama anlaşılır
- **Ton:** Akademik ama saha gerçekliğini yansıtan
- Akademik terim kullan ama gereksiz yere ağırlaştırma
- Her bölüm kendi içinde tamamlanmış olsun
- Formüller satır içi gösterimle: `M_d = 180 kNm`
- Büyük formüller ayrı satırda:
  ```
  A_s = M_d / (fyd × (d - a/2))
  ```
- Önemli uyarılar için 📌 veya ⚠️ işareti kullan

---

## Adım 6 — Uzunluk Hedefi

| Konu türü | Minimum uzunluk |
|-----------|----------------|
| Yönetmelik karşılaştırması | 2500-3500 kelime |
| Hesap yöntemi | 3000-4500 kelime |
| Malzeme / teknik konu | 2000-3000 kelime |
| Şantiye / uygulama | 2000-3000 kelime |

> Uzun olsun diye doldurmak değil, eksik bırakmamak önemli.

---

## Referans Dosyaları

Aşağıdaki referans dosyalarını konuya göre oku:

- `references/yonetmelikler.md` — Türk inşaat yönetmelikleri ve madde yapısı rehberi
- `references/malzemeler.md` — Beton, çelik, donatı standart değerleri tabloları
- `references/yaygin-konular.md` — Sık yazılan konuların şablon notları

---

## Hızlı Kontrol Listesi

Yazıyı bitirmeden önce kontrol et:

- [ ] İçindekiler tablosu var mı?
- [ ] En az bir sayısal çözümlü örnek var mı?
- [ ] Her önemli değer için yönetmelik madde numarası verilmiş mi?
- [ ] Yazılım/araç tablosu var mı?
- [ ] En az 5 sık yapılan hata yazılmış mı?
- [ ] Kaynaklar bölümü var mı?
- [ ] Uzunluk hedefine ulaşıldı mı?
- [ ] Formüller doğru ve tutarlı mı?
