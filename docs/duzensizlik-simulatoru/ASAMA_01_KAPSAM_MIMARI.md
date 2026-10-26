# TBDY 2018 — 3B Bina Düzensizliği Simülatörü / Aşama 1

**Durum:** Kapsam ve mimari kararları donduruldu · 26.10.2026  
**Dal:** `feat/tbdy-duzensizlik-3d-simulatoru`  
**Hedef rota:** `/kategori/araclar/duzensizlik-simulatoru`  
**Yayın politikası:** Bu aşamada preview/production deploy yok; main dalına yazma yok.

## Doğrulanmış mevcut durum

- Next.js App Router / React / TypeScript altyapısı mevcut.
- Ortak `SiteShell` üzerinden Navbar ve Footer render ediliyor. `/kategori/araclar/hsyncad` için banner'sız ve fullscreen özel dal bulunuyor; aynı yaklaşım **ayrı rota koşuluyla** izole biçimde kullanılabilir.
- `/kategori/araclar/simulasyonlar/[slug]` altında çalışan mevcut 3B donatı stüdyosu, Three.js görüntüleyicisi, kamera ve öğrenme panelleri, testler ve 2B fallback mimarisi var. Yeniden kullanım önce arayüz/altyapı sözleşmesi açısından incelenecek; mevcut uygulama yeniden yazılmayacak veya kırılmayacak.
- Eski düzensizlik kontrol sayfası `/deprem-yonetmelik/araclar/duzensizlik-kontrolu` altında. Bu sayfanın kullanıcı girişinden karar veren mantığı bağımsız mühendislik doğrulaması gerektiriyor; görsel simülasyonun hesap motoru olarak **aynen alınmayacak**.
- Araçlar kataloğu `src/lib/tools-data` tarafından besleniyor. Yeni simülatör kayıt/görünürlük değişikliği diğer araçların envanter testlerini bozmamalı.

## Sınır ve hedefler

**Hedef:** Öğrenci/yeni başlayan mühendis için A1, A2, A3, B1, B2, B3 kavramlarını karşılaştırmalı 3B eğitsel hareketle anlaşılır kılmak. Bu bir yapı tasarım onay yazılımı değildir.

**Kapsam içinde:** kamera orbit/pan/zoom; ön/yan/üst açıları; altı sahne; normal–düzensiz örnek karşılaştırması; başlat/duraklat/sıfırla/hız; kritik bölge vurgusu; aç-kapa katmanları; kısa öğretici adımlar; klavye ve dokunmatik kullanım; erişilebilir azaltılmış hareket modu.

**Kapsam dışında (ilk sürüm):** gerçek zamanlı sonlu elemanlar analizi, deprem yönetmeliğine göre kesin proje onayı, serbest 3B bina editörü, DWG/IFC içe aktarma, yoğun parçacık efekti, sunucu gerektiren hesaplama, kullanıcı yüklemesi.

## Terminoloji — değiştirilemez teknik ayrım

| Tip | Resmî anlam odak noktası | Öğretici görsel |
|---|---|---|
| A1 | Burulma düzensizliği | Kat düzleminde dönme ve kenar ötelenmesi farkı |
| A2 | Döşeme süreksizliği | Döşeme boşluğu/süreksizliği ve aktarım güzergâhı |
| A3 | Planda çıkıntılar | Girintili/çıkıntılı plan, köşede kritik etki vurgusu |
| B1 | Komşu katlar arası dayanım düzensizliği (zayıf kat) | Göreli dayanım farkının kavramsal sunumu |
| B2 | Komşu katlar arası rijitlik düzensizliği (yumuşak kat) | Katlar arası ötelenmenin altta yoğunlaşması |
| B3 | Taşıyıcı sistemin düşey elemanlarında süreksizlik | Düşey yük yolunda süreksizlik / aktarma |

**Uyarı:** B1 ≠ B2. Önceki mevcut kontrol aracındaki B1'in “yumuşak kat” olarak etiketlenmiş olabileceği tespit edildi; bu kavram hatası yeni sistemde taşınmayacak. A2 ve B3 “yapıyı sallama” animasyonundan ibaret olmayacak; boşluk/yük yolu ve süreksizliğin görsel gösterimi öne çıkacak. Yönetmelik şartları ve eşikleri resmî metin üzerinde ikinci bir doğrulamadan geçmeden **uygun/uygunsuz** hesabı yapılmayacak.

## Nihai deneyim sözleşmesi

1. **Uygulama kabuğu:** Sayfa Navbar/Footer olmadan `100dvh` alanı kullanır; üstte minimal geri dönüş simgesi bulunur. Geri düğmesi güvenli varsayılan olarak Araçlar'a gider; güvenilir iç geçmiş varsa tarayıcı geri davranışı değerlendirilebilir.
2. **Sahne önceliği:** Masaüstünde 3B sahne görünür alanın en az yaklaşık %70'ini kullanır. Öğretici panel sağda yaklaşık 300–360 px; kapandığında sahne alanı genişler ve WebGL context yeniden yaratılmaz.
3. **Kaydırma:** Dış sayfa kaydırılmaz, sadece gerektiğinde panel kendi içinde kaydırılır. Kısa telefon ekranlarında kontrolleri erişilmez bırakacak mutlak scroll kilidi uygulanmaz; panel bottom sheet/drawer olur.
4. **Araç çubuğu:** Senaryo seçimi, oynat/duraklat, sıfırla, görünüm yönleri, katman ve panel aç/kapa. Düğmeler doğrudan anlaşılır, küçük ekranlarda ikincil kontroller menüye alınır.
5. **Kamera:** Döndürme düşük hassasiyetli ve damping ile akıcı; pinch, zoom, tek parmak orbit, iki parmak pan; fit/reset model sınırlarını hesaba katar.
6. **Sağ eğitim paneli:** Her sahnede en fazla bir cümlelik tanım, 2–3 kısa gözlem, tek odak eylemi ve “sonraki adım”. Açıkça “Eğitsel gösterim — hesap sonucu değildir” bilgisi.
7. **Hareket:** Zaman bazlı deterministik animasyon; durdur, geri al, tekrar başlat; aşırı salınım ve sahte gerilme sayıları yok. Renkler açıklaması olan semantik vurgularla kullanılır.
8. **Düşük performans/erişilebilirlik:** `prefers-reduced-motion` varsayılanına saygı; WebGL desteklenmez veya context kaybolursa 2B öğretici fallback. Klavye ile sahne dışındaki tüm kontrol erişilebilir.
9. **Dil:** Türkçe, kısa, terimler TBDY ile tutarlı; panelde tekrar eden uzun açıklamalar yok.

## Mimari taslak (Aşama 2'de uygulanacak)

- `src/app/kategori/araclar/duzensizlik-simulatoru/page.tsx`: metadata ve ince route giriş noktası.
- `src/components/duzensizlik-simulatoru/`: `SimulatorWorkspace`, `BuildingScene`, `ScenarioControls`, `LearningPanel`, `Fallback2D`.
- `src/lib/duzensizlik-simulatoru/`: `scenario-registry.ts`, `types.ts`, `motion.ts`, `camera-presets.ts`, `education.ts`.
- `src/components/site-shell.tsx`: **sadece** yeni rota için dar kapsamlı immersive koşul; hsynCAD ve normal shell davranışı aynen korunur.
- Mevcut `src/components/simulations` ve `src/lib/simulations` dosyaları risk analizi olmadan değiştirilmez.
- 3B motoru Next.js için yalnız istemcide lazy-load; her frame'de React state set etmek yerine referans tabanlı animasyon; resize/unmount/context cleanup zorunlu.

## Kalite kapıları

- Altı sahnenin anlatısı birbirinden gerçekten farklı ve kavramsal olarak doğru.
- A1/B1/B2 kavramları birbiriyle karışmıyor; özellikle dayanım/rijitlik ayrımı doğru.
- Her sahnede normal durum ile düzensizlik durumu görsel olarak ayırt edilebilir.
- Sidebar kapalıyken sahne dramatik şekilde büyür, kamera hedefi kaybolmaz.
- 1366×768, 1920×1080, 390×844, 844×390 görünüm testleri; taşma ve ulaşılamayan kontroller yok.
- Mevcut `/kategori/araclar/simulasyonlar`, hsynCAD, hesaplama ve mevzuat ekranları regressionsız kalır.
- Etkileşim ve performans testlerinde uzun seans, hızlı senaryo değiştirme, fullscreen, panel toggle ve sekme gizleme/geri getirme kontrol edilir.
- Her aşama küçük, geri alınabilir commit'lerle ve ayrı özellik dalında ilerler; preview deploy ancak planın geç aşamasında, production ise son onay ve regresyon kontrollerinden sonra.

## Aşama 1 kabul durumu

- [x] Hedef kullanım, rota, ekran ve kullanıcı deneyimi tanımlandı.
- [x] Mevcut SiteShell, 3B altyapı ve eski düzensizlik kontrol konumu incelendi.
- [x] TBDY düzensizlik terimleri ve kritik B1/B2 ayrımı belgelendi.
- [x] Tasarım ve teknik sınırlar netleştirildi.
- [x] Yayını tetiklemeyecek geliştirme dalı ayrıldı.
- [ ] Aşama 2: route, fullscreen shell ve boş çalışma alanının kodlanması (sonraki “devam” komutu).

**Not:** Bu aşamada kod çalıştırma/E2E test veya deploy yapılmadı; bunlar sonraki aşamaların kabul ölçütleridir.
