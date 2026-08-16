# Belgeler & Canlı PDF Stüdyosu — Tecrübe ve Tavsiye Notları

> **ÖNEMLİ (Token Tasarrufu):**  
> Bu doküman **SADECE** `/belgeler` sayfası, PDF motoru (`pdf-engine.ts`) veya interaktif form doldurucu stüdyoları ile ilgili bir geliştirme/hata çözümü yapılacağı zaman okunmalıdır. Eğer mevcut göreviniz belgeler konusuyla ilgili **DEĞİLSE**, bu dosyayı okumanıza gerek yoktur; doğrudan atlayabilirsiniz.

---

## Yaşanan Teknik Sorunlar, Kök Nedenler ve Tavsiyeler

Bu notlar, belgeler modülünün inşası sırasında karşılaşılan teknik engelleri, yapılan denemeleri ve en iyi sonucu veren pratik yöntemleri gelecekteki yapay zeka ajanlarına rehberlik etmesi amacıyla özetler.

### 1. AcroForm Hayalet Leke ve Yazı Problemi (Ghost Stains / Artifacts)
- **Yaşanan Durum:** Kullanıcı "Temizle" butonuna bastığında veya form alanını sildiğinde, PDF üzerinde eski metnin izleri, noktalar veya garip çizgiler (leke gibi) görünmeye devam ediyordu.
- **Kök Neden:** PDF şablonları hazırlanırken form alanlarının arka planına önceden işlenmiş görünüm akışları (`AP` - Appearance Streams) ve varsayılan değerler (`DV`) gömülüyor. `pdf-lib` ile alan değeri silinse bile, PDF görüntüleyici (PDF.js) arkada kalan `AP` akışını render etmeye devam ediyor.
- **Nerede Yaşıyor?:** Yapılan derin incelemede, `AP` ve `DV` akışlarının sadece üst `AcroField` objesinde değil, `field.acroField.getWidgets()` içindeki her bir **widget annotation** seviyesinde saklandığı tespit edildi.
- **Tavsiye Edilen Çözüm:** `pdf-engine.ts` içinde form doldurulurken hem ana field'dan hem de her bir widget'tan `dict.delete('AP')` ve `dict.delete('DV')` çağrılarak eski stream'ler tamamen temizlenmelidir.

### 2. Font Kalınlığı (Bold vs. Regular) Dengesi
- **Yaşanan Durum:** İlk sürümlerde tüm PDF tek bir kalın fontla render ediliyordu; bu da resmi dilekçe gövde metinlerinin, adreslerin ve açıklamaların kaba görünmesine yol açıyordu.
- **Tavsiye:** `pdf-engine.ts` çift font (`Arial-Bold.ttf` ve `Arial-Regular.ttf`) yükleyecek şekilde yapılandırıldı. Dilekçe gövde paragrafları (`ana_paragraf`), sonuç cümleleri ve adres detayları için `bold: false` (Regular); kurum hitapları, başlıklar ve isim/imza alanları için `bold: true` (Bold) kullanılması resmi evrak estetiği açısından önerilir.

### 3. Zoom Sırasında Yavaşlık / Yeniden Derleme
- **Yaşanan Durum:** Kullanıcı zoom yaptığında PDF her seferinde sıfırdan derlendiği için arayüzde donmalar ve "Derleniyor..." gecikmeleri yaşanıyordu.
- **Tavsiye:** Form verisi değiştiğinde PDF bir kez derlenip `cachedPdfDocRef` içine alınmalı; zoom değiştiğinde ise PDF'i yeniden derlemek yerine önbellekteki PDF.js dokümanı üzerinden sadece canvas anlık olarak yeniden çizilmelidir (60fps anlık zoom).

### 4. Alan Bazlı Sıfırlama ve Kullanıcıyı Engellemeyen Validasyon
- **Tavsiye (Yerel Sıfırlama):** Bir alandaki değer değiştirildiğinde hemen yanında beliren `↺ Sıfırla` butonu kullanıcı deneyimini çok artırdı.
- **Tavsiye (Validasyon):** YİBF numarasında olduğu gibi belirli hane/format kuralları varsa, kullanıcının yazmasını kesin olarak engellemek yerine (harf sınırlaması gibi) alanı kırmızı çerçeveye alıp yanına bilgilendirici bir uyarı metni koymak çok daha kullanıcı dostu bir yaklaşımdır.

### 5. Sade Başlıklar ve Dış Kaydırma
- **Tavsiye:** Başlıklarda son kullanıcıyı ilgilendirmeyen `(AcroForm)` gibi teknik etiketler kullanılmamalıdır.
- **Tavsiye:** Masaüstü stüdyo düzeninde dış sayfa kaydırması (`outer scroll`) engellenip `100vh` tam ekrana oturtulduğunda, sol form kendi içinde kayıp sağ PDF tam sığdığında en temiz kullanım deneyimi elde edilmektedir.

---
*Daha kapsamlı mimari detaylar ve adım adım yeni belge ekleme rehberi için gerektiğinde [docs/BELGELER_SISTEMI.md](file:///c:/Users/hsyn/Desktop/muhendis-mimar-portali/docs/BELGELER_SISTEMI.md) dosyasına göz atabilirsiniz.*
