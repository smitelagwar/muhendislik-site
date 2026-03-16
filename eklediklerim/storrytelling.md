
Rolün: Kıdemli front-end geliştirici + motion designer + premium web tasarımcısı.
Hedef: Apple tarzı scroll-driven (scrollytelling) bir bölüm tasarla ve uygula.

Konu: İnşaat odaklı “Bir binanın sıfırdan sona yapımı” animasyonu.
Senaryo (aşamalar):
1) Arazi / hafriyat / kazı
2) Temel (radye temel) + bohçalama/su yalıtımı
3) Betonarme: kolon-perde-kiriş + döşeme kat kat yükselsin
4) Dış duvar (bims) + iç duvar (tuğla)
5) Çatı (eğimli + kiremit)
6) Dış cephe mantolama (EPS) + sıva + boya
7) Pencere-doğrama
8) MEP (tesisat) sembolik, aşırı detaylı değil
9) Islak hacimler seramik + diğer alanlar parke (iç mekân kısa kesit)
10) Peyzaj + bina tamamlanmış final “anahtar teslim” sahne

Görsel Stil:
- Premium, minimal, Apple seviyesinde; temiz tipografi, soft gölgeler, yüksek kaliteli render/illüstrasyon.
- Renkler: nötr (beyaz, gri, kömür) + vurgu rengi (turuncu/yeşil) sadece kritik yerlerde.
- Kamera: hafif izometrik veya yandan kesit; derinlik hissi; akıcı geçişler.

Scroll Davranışı (çok önemli):
- Sayfa aşağı kaydırılırken bu bölüm 100vh olarak “pinlenmeli” (sticky/pinned).
- Scroll ilerledikçe animasyon scrub ederek 0%→100% akmalı.
- Kullanıcı tüm animasyonu gördükten sonra bölüm unpin olup sayfa normal kaymaya devam etmeli.
- Bölüm içinde küçük bir ilerleme göstergesi (% veya çizgi) ekle.

Performans / Hız:
- Siteyi yavaşlatma. Hedef: 60fps, düşük CPU/GPU.
- Animasyonu video yerine optimize edilmiş yöntemle yap:
  (Tercih 1) Lottie/vektör animasyon veya
  (Tercih 2) AVIF/WebP frame-sequence (sıkıştırılmış) ve lazy-load.
- Yalnızca bu bölüm ekrana yaklaşınca asset’leri yükle (IntersectionObserver).
- İlk yükte en fazla ~1-2MB, kalanları kademeli indir.
- Mobilde daha hafif varyant kullan (daha az frame / daha az detay).

Erişilebilirlik / Uyumluluk:
- “prefers-reduced-motion” açık ise animasyonu otomatik sadeleştir: tek görsel + aşama aşama fade geçişleri.
- SEO ve performans için HTML içerik (başlık/açıklama) gerçek metin olsun.
- Tüm tarayıcılarda sorunsuz çalışsın.

Çıktı:
- Bu scrollytelling bölümünün sayfa yerleşimini (hero + pinned section + sonrası içerik) öner.
- Kullanılacak animasyon tekniğini seç ve nedenini açıkla.
- Uygulama için gerekli yapı taşlarını (container yapısı, pinned davranış, progress mapping, lazy-load) net şekilde tarif et.
``

Animasyon tekniği olarak Lottie/vektör yaklaşımını seç.
- İnşaat aşamalarını vektör/izometrik illüstrasyon ile anlat.
- Geçişler: çizimden dolguya, parçaların yerine oturması, mask reveal.
- Frame sayısı çok yüksek olmasın; akıcılığı easing ile ver.
``


3D kullanacaksan:
- Low/medium poly model + baked textures + minimal real-time ışık.
- Kamera sadece küçük hareketler yapsın (parallax gibi).
- WebGL/Three.js aşırı ağır olmayacak; mobilde 2D fallback zorunlu.
- Gerekirse sadece tek 3D sahne + aşama aşama parçaların görünmesi.
``


Create a high-quality scroll-driven animation section for my construction website.

Concept:
The animation should visually show the construction process of a reinforced concrete building from start to finish. The animation must progress as the user scrolls down the page.

Animation stages:

1. Empty land / foundation excavation
2. Reinforcement and foundation concrete
3. Columns and beams rising
4. Floor slabs forming
5. Brick wall construction
6. Roof completion
7. Exterior facade finishing
8. Windows installation
9. Fully completed modern building

Scroll behavior:

* The animation should be controlled by the scroll (scroll-driven animation).
* When the user reaches this section, the page scroll should temporarily pause and the animation should play as the user continues scrolling.
* After the animation completes, normal page scrolling should resume.

Visual style:

* Clean, modern, Apple-style product animation
* Minimalistic but realistic 3D look
* High detail but optimized for performance
* Smooth transitions between stages
* Slight camera movement or parallax for depth

Performance requirements:

* Must be lightweight and optimized for fast loading
* Use WebGL / Three.js or optimized canvas animation
* Avoid heavy video files
* Mobile and tablet compatible
* Maintain 60fps smooth animation

Technical requirements:

* Implement using scroll-based animation techniques
* Use GSAP ScrollTrigger or similar performant scroll control
* Lazy load assets if necessary
* Ensure responsive behavior on mobile devices

Goal:
Create a visually impressive but performant construction timeline animation that explains how a building is constructed step-by-step while the user scrolls.




Bir inşaat firması web sitesi için Apple.com tarzında scroll-driven (kaydırma ile 
tetiklenen) bir hero animasyon bölümü oluştur. Aşağıdaki tüm kriterlere uy:

---

GENEL KONSEPT:
Kullanıcı sayfayı aşağı kaydırdıkça, bir binanın sıfırdan tamamlanmasını gösteren 
sahne-sahne bir animasyon oynasın. Kullanıcı sayfayı kaydırmayı bırakırsa animasyon 
duraksın. Animasyon tamamlanmadan sayfa ileriye kaymaya devam etmesin 
(scroll hijacking ile sabitle).

ANIMASYON AŞAMALARI (8 aşama):
1. Boş arazi — sadece toprak ve gökyüzü görünür
2. Zemin kazısı — ekskavatör çalışıyor, toprak kaldırılıyor
3. Temel atılması — beton dökülüyor, demir kafes görünür
4. Kolonlar ve kirişler yükseliyor — betonarme iskelet şekilleniyor
5. Döşemeler tamamlanıyor — kat kat bina yükseliyor
6. Dış cephe kaplanıyor — cam ve metal paneller yerleşiyor
7. Çevre düzenlemesi — ağaçlar, yol, otopark beliriyor
8. Tamamlanmış modern bina — gün batımı ışığında final görünüm

TEKNİK GEREKSINIMLER:
- Tamamen HTML, CSS ve Vanilla JS ile yazılsın (framework kullanma)
- Animasyon için SVG veya Canvas (WebGL değil) kullan — performans için
- ScrollTrigger mantığını GSAP veya Intersection Observer ile kurgula
- "Sticky scroll" yöntemi: section height çok uzun tutulur (örn. 600vh), 
  canvas/SVG sabit kalır, scroll pozisyonu animasyon frame'ine map edilir
- 60fps hedef, will-change ve requestAnimationFrame kullan
- Mobil uyumlu olsun, touch scroll da çalışsın
- Her aşama arasında smooth interpolasyon olsun (ani geçiş yok)
- Metin katmanı: Her aşamada sağda/solda fade-in ile açıklayıcı başlık ve 
  kısa metin belirsin (örn. "Güçlü Temeller", "Çelik İskelet", "Modern Cephe")
- Animasyon bittikten sonra scroll kilidi otomatik çözülsün

GÖRSEL STIL:
- Profesyonel, modern, temiz tasarım
- Renk paleti: Koyu lacivert (#0a1628), turuncu vurgu (#f97316), beyaz metin
- İnşaat aşamaları: Vektörel / çizgisel ilustrasyon tarzı (teknik çizim estetiği)
- Arka planda hafif paralaks gök rengi geçişi (gündüz → akşam)
- Partikül efekti: Toz/toprak parçacıkları kazı aşamasında uçuşsun

PERFORMANS:
- Tüm animasyon varlıkları SVG inline olsun, dış dosya yüklenmesin
- Scroll event'i throttle edilsin (16ms — 60fps)
- Görünür olmayan elementler display:none yapılsın
- Lazy render: Sadece aktif aşama render edilsin

ÇIKTI:
Tek bir .html dosyası olarak ver. Tüm CSS ve JS inline olsun. 
Dosya tarayıcıda direkt açılınca çalışsın.




"Bir inşaat projesi için Apple tarzı, sayfayı kaydırdıkça çalışan yüksek kaliteli bir 'scroll-jacking' animasyonu kodlamanı istiyorum. Konsept: Kullanıcı aşağı kaydırdıkça ekranda bir binanın sıfırdan tamamlanana kadar inşa edildiğini göreceğiz.

Lütfen aşağıdaki teknik gereksinimlere sıkı sıkıya uyarak HTML, CSS ve JavaScript kodlarını oluştur:

Performans ve Teknoloji (Apple Standardı): Videoların veya ağır 3D modellerin (Three.js) siteyi yavaşlatmasını istemiyorum. Performansı en üst düzeyde tutmak için HTML5 <canvas> elementi ve Image Sequence (Kare Kare Görsel) yöntemini kullan. Animasyonu kaydırma hareketine bağlamak için GSAP ve ScrollTrigger kütüphanelerini entegre et.

Scroll Pinning (Kaydırmayı Durdurma/Sabitleme): Kullanıcı animasyon bölümüne geldiğinde, o bölüm ekrana tam oturmalı ve sabitlenmeli (pinned). Kullanıcı fare tekerleğini çevirdikçe sayfa aşağı inmemeli, bunun yerine bina inşa animasyonu kare kare ilerlemeli. Animasyon son kareye gelip bina tamamlandığında, sabitleme kalkmalı ve kullanıcı sayfanın geri kalanına doğru kaydırmaya devam edebilmeli.

Görsel Ön Yükleme (Preloading): Animasyonun takılmadan, su gibi akması için kullanılacak tüm karelerin (örneğin 150-200 adet görsel) JavaScript ile arka planda önceden yüklenmesini (preload) sağlayan bir fonksiyon yaz.

Duyarlılık (Responsive Layout): Canvas elementi ekranı düzgün bir şekilde kaplamalı ve cihaz boyutu değiştiğinde (resize) görsellerin en-boy oranı bozulmadan yeniden hesaplanmalı.

Örnekleme ve Entegrasyon: Benim için 1'den 150'ye kadar adlandırılmış (frame_0001.webp - frame_0150.webp) sahte bir görsel dizisi döngüsü kur. Kendi 3D render görsellerimi projeye entegre ederken nelere dikkat etmem gerektiğini kod içindeki yorum satırlarında belirt."













