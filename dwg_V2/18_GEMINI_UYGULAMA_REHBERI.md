# 18 — Gemini'ye verilecek uygulama talimatı

[Dizin](README.md) · [Bağlayıcı kararlar](00_BAGLAYICI_UYGULAMA_KARARLARI.md) · [Adımlar](19_GEMINI_ADIM_ADIM_UYGULAMA.md) · [Güncel durum](uygulama/DURUM.md)

**Gemini uygulayıcıdır. Ürün/mimari/teknoloji/kapsam ve kabul kararı Astra/kullanıcıdadır.** Model adı kullanıcının belirttiği çalışma etiketidir; modelin hızına veya kapasitesine dayanarak doğrulama gevşetilmez. Bu dosya gelecekte Gemini'ye verilecek başlangıç talimatıdır; bu düzenleme oturumunda motor kodlaması başlatılmadı.

**Geçerli devir: EXEC-2 + U1/U2/U3 (son kontrol 08.09.2026).** İlk hedef AutoCAD düzeyinde 2D görünüş; online tek DWG/DXF; genelde ≤30 MB, en fazla70 MB; ek klasör/font/XREF isteme yok. U1/U2/U3, 00 ve 32 içindeki son netleştirmelerdir. Eski araştırma alternatifleri seçilmeyecek.

## Kopyalanacak başlangıç metni

> Bu repodaki DWG Motor V2 planını uygulamanı istiyorum. Yalnız uygulayıcısın. Önce PROJECT.md, AGENTS.md, GEMINI.md ve görevle ilgili repo/CAD koruma belgelerini oku. Ardından dwg_V2/00_BAGLAYICI_UYGULAMA_KARARLARI.md, 18_GEMINI_UYGULAMA_REHBERI.md, 19_GEMINI_ADIM_ADIM_UYGULAMA.md, 20_KAYIT_VE_KANIT_SISTEMI.md, 21_ARAYUZ_TASARIM_SISTEMI.md, 22_ARAYUZ_SENARYOLARI_VE_KABUL.md, 24_GEREKSINIM_KATALOGU.md, 25_SABIT_VERI_VE_API_SOZLESMELERI.md, 26_PLAN_DENETIMI_VE_EXEC2.md, 27_KAYNAK_KOD_VE_YENIDEN_KULLANIM.md, 28_PAN_ZOOM_FIT_SOZLESMESI.md, 29_RENDER_VE_YASAM_DONGUSU.md, 30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md, 31_SOZLESME_TAMAMLAMALARI.md, 32_KULLANICI_HEDEFI_VE_GERCEK_KABUL.md, uygulama/ALT_KABUL_DURUMLARI.md ve uygulama/DURUM.md dosyalarını oku.
>
> EXEC-2 ve 00/32 içindeki U1/U2/U3 netleştirmelerini uygula. Three.js 0.172.0 + d3-zoom 3.0.0 seçildi; MapControls/OrbitControls ve ham WebGL altyapısını yeniden yazma yok. G04-B temel etkileşim kapısını erken tamamla. İlk araştırma belgelerindeki seçenekleri sen seçmeyeceksin. Decoder, renderer, server/browser yolu, paket sürümü, arayüz yönü, kapsam, kabul eşiği ve uygulama sırasını değiştirme. Mevcut motora dokunma; yeni motoru ayrı geliştir. Normal açılış mevcut kalacak, üç nokta menüsünden V2 ayrı açılacak. Yalnız 2D mimari/statik DWG/DXF hedefleniyor.
>
> Çalışmaya gerçek güncel HEAD/diff ve dosya hash'lerini kaydederek G00'dan başla; önceki gerçek kayıtlar varsa onları doğrulayıp ilk eksik adımdan sürdür. Her paketi planındaki giriş/çıkış ve negatif testlerle bitir. Geçen işleri gereksiz yeniden kurma. Test komutunu gerçekten çalıştır, ham sonucu sakla, uygulamanın doğru branch/worker/decoder yolundan geçtiğini doğrula. Mock ve çizilmiş örnek, gerçek dosya veya gerçek cihaz testi değildir.
>
> Her tamamlanan çalışma diliminde uygulama kayıtlarını güncelle: hangi G/R/D maddesi, hangi dosyada ne değişti, hangi sorun çözüldü, hangi gerçek test geçti/kaldı/çalışmadı, hangi kanıt hangi kod snapshot'ına ait, sıradaki iş ne. Geçmiş kayıtları sonradan başarılı görünecek şekilde değiştirme. Terminal çıktısı, test sonucu, ekran görüntüsü ve açıklaman birbiriyle tutarlı olsun. Gizli düşünce zinciri değil; yapılan eylemler, kısa karar gerekçeleri ve gözlenebilir sonuçlar kaydedilecek.
>
> Arayüzde 21 ve 22 numaralı belgeleri uygula. Modern ve kaliteli görünüm teslim ölçütüdür. Açık/koyu tema, gerçek desktop/tablet/telefon yerleşimi, yükleniyor/kısmi/hata/boş durumları tamamlanmadan görsel işi bitti sayma. Ekran görüntüsü alıp kendin incele; yalnız screenshot dosyası üretmek görsel kontrol değildir. Olmayan araca düğme ve uydurma hız/doğruluk rozeti ekleme.
>
> Bir karar uygulanamıyorsa kanıtıyla CR aç; kendin alternatif teknoloji seçme veya hedefi düşürme. Sadece o karara bağlı işi beklet, bağımsız tanımlı işlerle devam et. Routine bug fix ve plandaki iş için her adımda izin isteme. Test hatasını skip/mock/baseline güncellemesiyle saklama. Kullanıcının gerçek dosyalarını veya canlı storage'ını test için değiştirme.
>
> N/V/C/F alt kabul kimliklerini RUN/ART/SNAP ile tek tek doldur; 78 satırı toplu PASS yapma. Sonunda kendini bağımsız denetçi ilan etme. Teslimi “Gemini uygulaması — Astra denetimine hazır” olarak, eksik ve başarısız maddelerle birlikte sun. 23 numaralı denetim için snapshot, gereksinim matrisi, değişiklik dökümü, ham test kanıtları ve görsel kanıt indeksini tamamla. Production'a push/deploy etme; bu tur yerel uygulama ve denetim devridir. Astra daha sonra denetleyecek ve gerekiyorsa FIX kimlikleriyle düzeltme planı verecek.

## Okuma ve çalışma sırası

1. Repo başlangıç talimatlarını uygula. GEMINI.md içindeki legacy koruma kapsamını yeni bağımsız V2 ile karıştırma. Bu açık uygulama görevi yeni V2 kodunu kapsar; legacy çekirdeğini değiştirme izni vermez.
2. 00/18/19/20/21/22/24/25/26–32 ve uygulama durumunu oku. İlk araştırmanın gerekli konu bölümlerini ilgili G paketine girmeden oku; eski alternatiflere dönme.
3. Durum kaydı ile dosya/HEAD gerçeğini karşılaştır. Arada başka ajan değişiklikleri varsa onları sahiplenme/silme; yeni başlangıçta ayır.
4. Sıradaki hazır G paketini al. Aynı oturumda çok paket tamamlanabilir; her birinin kanıtı ayrı tanımlanır. Oturum başına/paket başına push yapılmaz.
5. Implement → ilgili test → hata düzeltme → test → kayıt. Kaydı sona yığma; bağlam kaybından önce güncelle.
6. Oturum kapanırken DURUM, PAKET_DURUMLARI, IZLENEBILIRLIK, ALT_KABUL_DURUMLARI ve OTURUM_GUNLUGU tutarlılığını doğrula. Sıradaki çalıştırılabilir adımı yaz.

## Uygulayıcının sınırı

Gemini fonksiyon gövdelerini, private yardımcıları ve test fixture kodunu yazabilir. Bu, mimari seçim yetkisi değildir. Ortak API, dosya sınırı, state machine, veri şeması, seçilmiş algoritmanın anlamı veya görünür UX sözleşmesini değiştiren uygulama bir CR konusudur. Planda adlandırılmamış ve işin yapılması için yeni ürün/mimari kararı gerektiren bir alan varsa boşluğu kendi tercihiyle doldurmaz; kaydeder.

Mevcut sözleşmeyi koruyan null guard, doğru unit dönüşümü, memory free, timeout cleanup, yanlış selector düzeltmesi gibi olağan uygulama/fix işleri bağımsız yapılır. Karar onayı, her satır kod için onay kapısı değildir.

## Hız nedeniyle sık oluşan sahte tamamlanmalar

| Görünen sonuç | Neden yeterli değil? | Gerekli kanıt |
|---|---|---|
| Menü item'ı var | Yanlış dosyaya/legacy'ye gidebilir | Liste/grid/public URL + active engine + source revision |
| Canvas ve plan resmi var | Sabit SVG/thumbnail olabilir | Gerçek kaynak hash → decoder → scene → V2 draw akışı |
| TypeScript/build geçti | Yazı, hatch, iptal veya mobil doğru olmayabilir | Sayısal, görsel ve kullanıcı akışı testi |
| “100% hazır” | Eksik font/katman olabilir | Kalite özeti, kritik ROI ve full-ready koşulları |
| Test exit 0 | İç logda FAIL, skip veya assert yok olabilir | Test sayıları + assert + stderr + ham rapor |
| Responsive class var | Sheet veya araçlar çizimi örtebilir | Boyutlu ekranlar, açık panel ve keyboard durumları |
| Aynı resim iki tarafta | Bağımsız oracle olmayabilir | Referans üretim aracı/ayarları ve fixture hash'i |
| 22 W işi tamam | Yeni UI/kayıt ve G maddeleri eksik olabilir | R gereksinimlerinin tamamı ve G00–G17 devri |

## Bağlam biterse

Yeni konuşma eski başarı iddialarını doğru kabul etmez; son snapshot/rapor yollarını açar. Önceki aktif test sürecinin PID/port bilgisi varsa yalnız kendine ait olduğunu doğrulayıp yönetir; bütün Node/Chrome süreçlerini öldürmez. Yarım kalan paket IN_PROGRESS olarak kalır. Not tutamamışsa geçmişi tahmin ederek doldurmak yerine “kayıt eksik, yeniden doğrulama gerekli” yazar.

## Kullanıcıya final biçimi

“EXEC-2 uygulaması: X/Y zorunlu paket uygulayıcı tarafından doğrulandı. Astra denetimi: yapılmadı. Şu CR/eksik maddeler açık. Başlangıç/son snapshot: … . Çalıştırılan kapılar: … . Görsel indeks: … . Devir: uygulama/DENETIM_DEVRI.md. Production dağıtımı: yapılmadı.”

Yüzde, süre, dosya sayısı veya test sayısı kayıttan türetilir. İş bitti diye kanıt toplama veya gerçek cihaz gereksinimi atlanmaz.

## Kullanıcı kabul hedefi U1

[32 — Kullanıcı hedefi ve gerçek kabul](32_KULLANICI_HEDEFI_VE_GERCEK_KABUL.md) okunacak. Kaynak CAD görünüşü arayüz estetiği için değiştirilmez. İlk kullanıcı kontrolü bilgisayar + Poco X6 Pro; kurulu referans CAD programı/sürümü henüz doğrulanmadı. Sunucu bütçesi belirlenmedi; yerel kaynak tüketimi raporlanacak. Hiçbiri yapılmış runtime kabulü değildir.

## U2 — Lisans işlemleri uygulamayı kilitlemez

00 D22/U2 uygulanır. Ayrı lisans envanteri eksik diye geliştirmeyi durdurma, her adımda onay isteme veya UI'a lisans ekranı ekleme. Mevcut notices korunur, gereken paketleme bilgisi mevcut araçlardan türetilir. Somut dağıtım çelişkisi varsa yalnız etkilenen artifact için kayıt aç; bağımsız uygulama/test işlerine devam et.

## U3 — Tek dosya kullanıcı akışı

32 U3'ü uygula: AutoCAD görünüşü ilk hedef, online-only, genelde ≤30 MB/en fazla70 MB dosya profili. Kullanıcıdan klasör/XREF/font paketi isteme. Platform font kataloğu ve belirtilmiş degraded fallback otomatik işler; legacy manifestteki alias=exact varsayımını alma. Harici dosyaları kendiliğinden arama. Mevcut ölçüm kapsamı ve ayrı V2 menüsü korunur.
