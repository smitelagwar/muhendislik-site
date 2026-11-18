# P08 — Sistem, bodrum ve global kontrol profili

6 Kasım 2026. Aşama08 açık ve kaynaklı girdili hesap profili sonuçlandırıldı. Bu, native üç projenin veya bütün binanın mühendislik kabulü değildir. P09 başlamadı; kullanıcı `devam` komutu beklenir. Commit/push/deploy yapılmadı.

## Uygulama ve veri akışı

`building-classification.ts`: açık BKS → I ve DD-2 SDS → DTS; kat/çatı/bodrum rolleri ve kot farkından HN → BYS → performans kapsamı. Proje adı sınıf üretmez. Çatı uzantısı ancak kaynaklı kararla yükseklikten dışlanır. BYS1 ve ilgili DTS-a/BYS2–3 için yalnız DGT son kabul vermez. Kotlar gerçek model düğümleriyle, kat sırası ve her katın A2/A3 geometri kapsamı birbiriyle doğrulanır.

`global-demand.ts`: her modun üst-alt düğüm farkı önce alınır, sonra CQC uygulanır; iki mutlak maksimum birbirinden çıkarılmaz. Kat kesmesi gerçek modal atalet kuvvetlerinin toplamından; ağırlık, açık doğrultusal eşdeğer kütleden türetilir. Bu profil için kütlenin yerçekimi ağırlığına eşdeğer olduğu girdi sorumluluğudur; genel anizotropik kütle/ayrı W modeli kabul edilmedi. Düşey hat kapsamı açık kaynaklı beyan ister. Perde devrilme payları gerçek imzalı kabuk taban kenarı kuvvetleri ve moment kollarından hesaplanır; bağımsız maksimumlar toplanarak oran yapılmaz. Küresel XY ötelemesi kararları değiştirmez.

`global-checks.ts`: A1, delik/gerekçeli değerlendirme ile A2, iki doğrultulu çıkıntı/gerekçeli değerlendirme ile A3, etkin kesme alanlarıyla B1, iki komşuyla B2, açık aktarım kararıyla B3; DD3/DD2 elastik spektrum oranlı etkili drift, ikinci mertebe göstergesi ve gerekli deprem derzi. B1'de alt dolgu fazla ise iki katta da dolgu dışlanır; zayıf kat katsayısı iki doğrultuya aktarılır. A2/A3 bulgusu elle “yok” yazılarak silinmez. Kabuk modeli beyanı tek başına yük aktarımı kanıtı değildir; bulgu varsa bu özel doğrulama açık kalır. B3'te yasak aktarım başarısız; izin verilebilen iki mesnetli kiriş üstü kolon için bir referans metni düşey deprem hesabının yerine geçmez.

`system-selection.ts`: dökme betonarme A11–A15/A21–A24/A31–A33 R/D/BYS tablosu, süneklik/DTS, farklı doğrultuların uyumu, duvar payı/kenar aks dağılımı ve bağlılık derecesi. Ω için ayrı fiziksel perde parçalarının kuvvet kesitleri, gerçek kesit merkezleri arası mesafe ve eşit-zıt eksenel bileşke gerekir. Uyuşmazlıkta bağ kirişi adıyla sınıf kabul edilmez. Ω>2/3 hedefi ve özel bağ kirişi/eksenel tasarım P11'e bağlıdır. A16, genel karmaşık/bağlı kesit Ct, kirişsiz döşemenin iki aşamalı modeli ve esnek diyaframın ek rijit modeli otomatik kabul edilmedi.

## Gerçek yeniden analiz ve bodrum

`global-review.ts` girilen/ilk/seçilen/önerilen/kullanılan R, D ve gerekçeyi kaydeder. Her katsayı değişiminde gerçek modal spektrum işi yeniden yürütülür; kuvvet/deplasman, global kontroller, eleman tasarım bağımlılıkları ve rapor snapshot'ı geçersizleşir. Kararlı sonuç şarttır; döngü veya 1–8 iterasyon bütçesinin tükenmesi eski sonucu kabul ettirmez. Kullanıcının daha düşük R'si yeniden tekrar tekrar azaltılmaz. P09–13 tasarımları henüz yoktur; JSON geçersizleşme kaydı onların yapılmış olduğu anlamına gelmez.

Rijit bodrum için en az üç rijit çevreleme yönü kararı ve aynı rijitlikte bütün kütle/yalnız üst kütle çözümleri birlikte gerekir. Bodrum üstündeki zemin kat döşeme kütlesi ikinci periyot hesabına alınmaz. Her X/Y hakim periyot oranı ihtiyatlı kesin `<1.1` ile değerlendirilir; kaynak metin/denklem eşitlik farkı eşitlikte otomatik kabul üretmez. Tüm modelde en büyük katılımlı mod ile üst kütle etkisinin karşılığı ayrı ailelerse mühendis değerlendirmesi gerekir; bodrum yerel moduyla üst mod sessizce oranlanmaz.

Rijit kabul edilirse alt kütle, R/I=2.5 ve D=1.5 ile gerçekten ayrıca çözülür. `global-regional-forces.ts`, bütün çubuk/kabuklara üst/alt bölgeyi gerçek kotlarından atar. Üst bölge için üst β ve βII; bodrum için ham birinci/ikinci yükleme durumlarıyla sünek dalda 1+1, sünek olmayan dalda 0.6Düst + Dalt bileşen sınırları üretilir. Üst katsayılar bodruma yayılmaz. Tabanı geçen bölünmemiş veya taban düzleminde yatay eleman belirsiz kalır ve kabulü engeller. Temel kapasite tasarımı P13'tür. Ham mod/kovaryans ve iki ayrı durum saklıdır; istatistiksel bileşen sınırları eşzamanlı fiziksel N-M-V-T değildir.

`global-period.ts` gerçek K/F/M ile Denk.4.26 Rayleigh hesabını yapar. Fiktif yükler kütle×yükseklikle orantılıdır; 100kN normalizasyonu sonucu değiştirmez. Ct gerçek sistem ve kabul edilen dikdörtgen perde kesitlerinden çıkarılır. Manuel periyot/Ct gerçek hesapla uyuşmazsa override yapılmaz. Ham özperiyot değiştirilmez. Ampirik sınır/asgari taban kesmesi yalnız kuvvet dalındadır; drift dalı ayrı periyot/büyütme kullanır. βII kuvvet büyütmesidir; P-Delta/geometrik nonlineer çözüm değildir. Derzde bilinmeyen komşu deplasmanı sıfır olmaz; hesaplanamayan mevcut komşu için açık karar gerekir. Kısmi3m asgari derz aralığı ihtiyatlı yukarı tamamlanır.

## UI, kayıt ve CLI

Analiz ayarlarında A2/A3/B3 için bilinmiyor/var/yok, değerlendiren ve gerekçe; B3 aktarım türü/düşey analiz referansı vardır. Varsayılan bilinmiyor, yok kararı gerekçesiz kaydedilemez. JSON indir/aç alanları korur; kayıt revizyonu artırır, önceki R sonucunu temizler. Etüt PDF zorunluluğu yoktur. Bu UI yalnız girdi saklar; yeni global motoru çalışma alanına bağlamak P17 kapsamıdır.

`node --import tsx scripts/hsyncad/export-global-review.ts --input <mutlak-yeni-girdi.json> --output <mutlak-yeni-sonuc.json>`

Girdi `{input: GlobalReviewInput, maxModes: 1..128}`. Çıktı kaynak SHA256, bütün kontrol/bağımlılık/gerekçe/önlem ve gerçek çözüm izlerini taşır. Exit0 yalnız `checks_ready`, eksik/başarısız/yakınsamayan dal exit2, hatalı girdi veya var olan çıktı exit1. `checks_ready`, genel bina uygunluğu değildir; `engineeringAcceptance` ve `wholeBuildingApproved` her zaman false.

## Bu aşamada gerçekten doğrulananlar

Kanıt kökü: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\statik-rapor-uygulama-2026-11-05\asama-08`.

- Son domain85/85, skip0: P06/P07 regresyonları57, P03 şema9 ve yeni global/kalıcılık19 test. Sınır eşitsizlikleri, yasak/bilinmeyen değerlendirme, R kararlılığı, gerçek kabuk talepleri, Rayleigh, XY öteleme değişmezliği, gerçek bodrum yükleme ve mod ailesi belirsizliği kapsandı.
- Kabuk fixture'ında X R6→4.8; ham taban kesmesi26.7833→27.2308kN ve düğüm deplasmanı1.33205e-5→1.35527e-5m oldu; iki iterasyonda kararlı. Bunlar ölçülen test çıktılarıdır, üretim kuralı veya sabit native oracle değildir.
- İki katlı fixture'da tüm/üst X periyotları0.0157042723/0.0157042687s; alt yükleme taban kesmesi4.65896kN. Bodrum kütlesi artırılıp baskın mod ailesi ayrıldığında eksik mühendis kararı sonucu doğrulandı.
- Son lint ve uygulama TypeScript geçti. Genel TypeScript552 önceki tanıyla başarısız; yeni/çıkan imza0 kontrolü kapanış audit'te tutulur. Önce nullable hatası ve readonly fixture hatası bulundu/düzeltildi; başarısız loglar saklı.
- Yerel production build ve dört browser testi geçti: girdi doğrulama/odak, kaydet/indir/yeniden aç, birim/diğer proje izolasyonu, eski motor kapısı ve dürüst eksik PDF. Mobil etiket sıkışması görüntüden görülüp düzeltildi; ikinci build/browser ve son görüntü incelendi. Verification becerisi bu yerel storage akışında kullanıldı; dış API/DB gerekmedi.
- Son CLI hazır/bodrum/tekrar0, eksik/iterasyon2, üzerine yazma1. Tekrar byte-eşit; girdiler SHA ile korundu. İlk sayısal testte ikili kayan nokta için yanlış kesin eşitlik assertion'ı toleranslı karşılaştırmaya düzeltildi; hesap sonucu yuvarlanmadı.

## Kaynak ve açık kabul kapıları

Kaynak, önceki aşamada edinilen TDMD barındırmalı özgün teknik ek PDF: https://www.tdmd.org.tr/Eklenti/24,54-tbdy2018pdf.pdf?0= ; SHA256 `b3d0ab5480a57044709e9c517d10c6f6595a1273b2f73c108c94d0fade7bb154`. Bu aşamada24sayfa Poppler görüntüsünden incelendi; manifest sayfa/görüntü SHA'larını taşır. Resmî sunucu byte eşitliği, tüm metin ve tadil seti kabul edilmedi. Örnek rapor TOC'sindeki B1 eşitsizliği kaynak metnin yerine kullanılmadı.

MS1 A13/R değişimi ve SK A15/R7/bağlı perde ailesi yalnız kaynakla uyumlu kural senaryolarıdır. Üç native dosyada mühendislik alanları ve revizyon/kuvvet aktarımı henüz kanıtlanmadığı için gerçek native bina karşılaştırması yapılmadı, uygun sayılmadı. Önceki REA repo kanıtları korunur; bu aşamada yeni native/REA çalışması yapılmadı. Genel poligon/warped kabuk, genel esnek diyafram, gerçek bina/W kaynağı, tasarım etkileşimi, TS500 eleman kontrolleri, P17 entegrasyonu ve P16–19 nihai PDF açıktır. Büyük model/Worker/Linux koşuları bu aşamada tekrarlanmadı; önceki performans sonuçları P08 sayılmaz.
