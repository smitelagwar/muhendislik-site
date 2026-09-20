# 01 — Manifesto: çizime güvenerek bakabilmek

> **Araştırma katmanı:** Bu belgedeki alternatifler ve öneriler Gemini için seçim yetkisi değildir. Kullanıcının son talimatıyla [00 — EXEC-2](00_BAGLAYICI_UYGULAMA_KARARLARI.md) ve [19 — sabit uygulama sırası](19_GEMINI_ADIM_ADIM_UYGULAMA.md) geçerlidir. Çelişen seçim/scope ifadeleri tarihsel araştırma olarak kalır; Gemini uygulamaz.

[Dizin](README.md) · [Karar çerçevesi](04_KARAR_CERCEVESI.md) · [Doğrulama](11_DOGRULAMA_PROGRAMI.md)

## Ürünün verdiği değer

Kullanıcı şantiyede telefondan kiriş detayına yakınlaşabilsin; ofiste mütevazı bir dizüstünde kat planını rahatça gezsin; tablette pafta ve katmanlar arasında kaybolmadan geçsin. Çizgi, yazı, tarama ve ölçü değerleri aynı projeyi anlatsın. Dosyayı açarken tarayıcı donmasın; işlem başarısız olduğunda kullanıcı ne olduğunu ve nasıl devam edeceğini görsün.

Bu, tek bir parser geliştirme işi olarak değil, **kaynak dosyadan güvenilir ekrana kadar bütün yolun ürünü** olarak ele alınabilir. Dosya okuma başarısı, çizim doğruluğu, erişim güvenliği, ağ maliyeti ve dokunma davranışı birlikte değerlendirilir.

## Kullanıcının kapsamı

Birincil içerik mimari plan, kesit, görünüş, temel/kolon/kiriş/döşeme paftası, donatı açılımı, detay ve benzer 2D mühendislik çizimleridir. 3D modelleme, orbit, katı model geometrisi, BIM düzenleme, CAD komut dili ve dosyaya geri yazma ürünün hedefi değildir.

2D kapsamı **layout/paper space, viewport, XREF, yazı stilleri, annotation scale veya OCS'yi gereksiz yapmaz**. Bunlar sıradan bir 2D paftanın görünüşünü etkileyebilir. Dosyada tesadüfen 3D veya özel nesne bulunması da mümkün; bunların çizimin 2D içeriğine etkisi sınıflandırılabilir. Kullanıcının “diğer garip şeylerle işim yok” demesi, statik paftadaki bir tabloyu veya ölçü yazısını sessizce düşürmek şeklinde yorumlanmamalı.

Mevcut görüntüleyici bağımsız kalır. V2 bir menü seçeneğiyle açılır. Yeni motorun başarısı mevcut motorun zorla yerinden edilmesine bağlı değildir. Varsayılan motoru değiştirmek bu araştırmanın sonucu veya otomatik devamı sayılmaz.

## “Kusursuz” yerine test edilebilir taahhüt

Hedefi küçültmek yerine dört ayrı doğruluk ekseni tanımlamayı öneriyorum:

| Eksen | Soru | Kanıt örneği |
|---|---|---|
| Geometri | Uç noktalar, yaylar, blok dönüşümleri doğru mu? | Float64 sayısal oracle ve tolerans |
| Anlam | Metin, dimension değeri, görünür katman, pafta doğru mu? | Entity/instance kapsamı ve özellik doğrulaması |
| Görünüş | Çizgi kalınlığı, yazı yerleşimi, tarama ve örtüşme doğru mu? | Ayarları sabit referans görüntü karşılaştırması |
| İşletim | Dosya değişimi, iptal, zayıf cihaz ve ağda davranış güvenilir mi? | Gerçek cihaz, hata enjeksiyonu, uzun oturum |

Önerilen ürün dili: “Doğrulanan 2D DWG/DXF profilinde yüksek uyumluluk”. “Bütün dosyalar her cihazda yüzde yüz kusursuz açılır” iddiası, eksik font/XREF, proxy verisi ve cihaz limitleri nedeniyle doğrulanabilir bir ürün sözü değildir.

Destek tablosunda her özellik için `doğrulandı`, `kısmi`, `desteklenmiyor`, `henüz test edilmedi` durumları olabilir. Bilinmeyen durum destekleniyor gibi sunulmaz. Dosyanın büyük bölümünü göstermek değerli olabilir, fakat eksikliği görünür ve ölçülebilir olmalıdır.

## Ürün kalitesinin öncelikleri

1. Kaynak içeriği ve dosya yetkisi korunur.
2. Yanlış veya eksik çizim tam başarı gibi gösterilmez.
3. Kullanıcı çizime erken erişir; ilerleme, iptal ve hata davranışı güvenilirdir.
4. Pan/zoom ve katman kullanımı cihazına uygun akıcıdır.
5. Tekrar açılış ve başka cihazdan açılış hazırlanmış sonuçlardan yararlanır.
6. Sistem anlaşılır, sürümlenebilir ve düzeltilebilir kalır.

Bu sıralama teknik bir öneridir. Kritik bir donatı yazısını kaybederek kazanılan 500 ms ürün iyileştirmesi sayılmaz. Bir dosyanın hiç açılamadığı durumda dürüst kısmi önizleme ise kullanıcı için yararlı olabilir; durum ve sınırlar açıkça gösterilir.

## Sıfırdan neyi sahiplenmek mantıklı?

Sitenin kontrol edebileceği yüksek değerli alanlar: viewer deneyimi, 2D sahne sözleşmesi, veri hazırlama, kaynaklara erişim, bellek bütçesi, render planlayıcısı, cache, kalite denetimi, cihaz stratejisi ve test corpus'u. Bunların özgün geliştirilmesi, altta kullanılan bütün matematik veya DWG çözümleme kodunun da özgün olması anlamına gelmez.

Ham DWG decoder'ını sıfırdan geliştirmek istenirse bunun kendi başarı ölçütü ve bakım bütçesi olur. Ürünün teslimi decoder Ar-Ge'sine bağlanmadan iki çalışma birlikte yürüyebilir. Ayrıntı: [alternatif yollar](12_YOL_HARITALARI.md).

## Uygulama ve bağımsız denetim rolleri

Astra tasarım/teknoloji/kapsam kararlarını verir ve Gemini'nin uygulamasını bağımsız denetler. Gemini sabit kararları uygular, test eder ve gerçek eylem/sonuç geçmişini kaydeder. Kendi kendine yeni motor seçme veya bağımsız kabul verme yetkisi yoktur. [Geçerli EXEC-2 kararları](00_BAGLAYICI_UYGULAMA_KARARLARI.md).

İlk araştırma alternatifleri korunur; sonraki açık kullanıcı talebi nedeniyle Gemini'ye bu alternatifler arasında seçim bırakılmaz. Uygulanamayan karar kanıtıyla CR olarak devredilir. Modelin hızlı kod üretmesi, gerçek çizim/cihaz/görsel doğrulamayı azaltma gerekçesi değildir.

LLM çizim açılırken üretim parser'ı veya geometri tamamlayıcısı olarak kullanılmaz. Eksik kolon, okunamayan donatı yazısı veya çözülemeyen ölçü değeri tahminle üretilmez. AI geliştirme sürecine yardımcı olur; kullanıcının gördüğü çizim deterministik kaynak verisine dayanır.

## Manifestonun günlük karşılığı

Bir aday motoru değerlendirirken şu cümle tamamlanabilmeli: “Şu dosya ve cihaz grubunda, şu kalite düzeyini koruyarak, şu ölçümde iyileşme gösterdik; şu dosyalarda sonuç hâlâ bilinmiyor.” Bu cümleyi kuramıyorsak elimizde fikir veya demo vardır. Araştırma değerli olsa da ürün kanıtının yerine geçmez.
