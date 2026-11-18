# P11 — Perde, perde grubu ve bağ kirişi tasarım temeli

6 Kasım 2026. Açık girdili sınırlı hesap profili sonuçlandı. Native proje, genel bina, tüm mevzuat, imalat ve nihai rapor kabulü verilmez. Bütün çıktılarda `engineeringAcceptance=false`; hazır üye profili, bina uygunluğu anlamına gelmez. P12 yalnız yeni kullanıcı devam komutuyla başlar.

## Yapılanlar ve geçerlilik sınırı

| Katman | Gerçek hesap | Kabul sınırı |
|---|---|---|
| `wall-section.ts` | Ayrık beton hücreleri ve gerçek düşey barlar; ortak ağırlık merkezi, tarafsız düzlem, eksenel denge, N-M2-M3 | Dikdörtgen ve bağlantılı L/T/U gibi hücre birleşimleri; özel grubun uç bölgesi kabulü ayrıca gerekir |
| `wall-forces.ts` | Gerçek kabuk `kg*u-fg`, tam kesit kenarları ve moment kolları; ortak P06/P07 K ve diyafram dönüşümüyle statik çözüm | Açık nodal yükler, homojen mesnetler; dağıtılmış/eski yük sessizce atılmaz |
| `wall-detailing.ts` | Dikdörtgende kritik yükseklik, gerçek uç/gövde barları, çiroz bağlantıları ve konumları, sarılma ve kenetlenme | Sabit kesit, sürekli bar ve özel indirimsiz yüksek süneklik profili |
| `wall-design.ts` | Gerçek birleşim/kot/taraf, moment diyagramı, kapasite kesmesi, sürtünme, güçlü perde ve tam eleman kapsamı | Açık imzalı deterministik kuvvetler; CQC maksimumları fiziksel kuvvet takımı yapılmaz |
| `coupling-beam.ts` | 7.20 normal/çapraz dal seçimi; gerçek 3B demet yolları, eğim, çubuk aralıkları, ankraj ve etriye | Normal dal P09 hesabını kullanır; çapraz dal saf antisismetrik M-V ve dört köşe barlı iki ayrı demet içindir |
| `wall-system-review.ts` | Her modda gerçek bağ kuvveti, perde eksenel kuvveti ve düşey atalet dengesi; gerçek R yeniden analizi ve bağımlı tasarım kapısı | Ortak kabuk yüzleri doğrulandı; köşe dönmesine bağlı frame-shell uç uyumu otomatik uygun sayılmaz |

### Kesit ve kimlik

Hücreler pozitif alanla kesişemez; fiziksel panel iki adla veya hem grup hem alt parça olarak sayılamaz. Bir kesitteki hücreler gerçek ortak kenarlarla bağlanır; ayrık iki perde, aradaki boşluk betonmuş gibi tek kesit yapılmaz. Kesişen L/T/U kolları önce çakışmasız gerçek hücrelere ayrılmalıdır. Ortak N-M çözümünde beton basınç bölgesi ve ilk momentleri doğrudan kesilerek hesaplanır. Asimetrik kesitte sıfır moment noktası sabit N çevriminin içinde olmalı; talep ışınının en yakın pozitif kesişimi kullanılır. Yön/denge/gerinim doğrulanmazsa kabul yoktur.

Daire/poligon kolonun yaklaşık formülü bu katmana kopyalanmadı. Gerçek hücre/bar koordinatları ve malzeme P09/P10 ile aynı birim sözleşmesindedir: mm, MPa, kN, kNm. Bilinen sıfır talep kapasite uydurulmadan ayrı işaretlenir; minimum donatı ve detay koşulları sürer. Bilinmeyen kuvvet sıfır değildir.

### Dikdörtgen perde

Normal, indirimsiz kalınlık koşulları; `Hw/lw`, `Hcr=min(2lw,max(lw,Hw/6))`, kritik uç uzunluğu, gövde oranları/aralıkları, uç alanı/çapı, enine donatı ve kancalar hesaplanır. Kritik detay bütün yükseklik boyunca korunur; üstte azaltma ve üç katlı geçiş otomatik tasarlanmaz. Gerçek çiroz ön/arka bar kimliklerine bağlanır. Her çirozun U ve Z yönündeki etki alanı kontrol edilir: yeterli toplam adet bir köşeye yığılarak geçilemez. Örtü dışında, kayıp veya tekrar bağlantı reddedilir.

Yatay gövde kancası gerçek uç bölgesi cebine sığmalıdır. Düşey donatı için açık temel ankraj derinliği, yukarıdaki düz kol, içe dönen kanca kuyruğu ve büküm çapı kontrol edilir. Bu ölçüler imalat için bütün 3B çakışmaları veya stok/ek çözümünü doğrulamaz. Otomatik bindirme, değişen kat kesiti ve boşluk kenar donatısı desteklenmiyorsa açık kalır.

Kat kotları ile ek analiz kesitleri ayrıdır. Bağ kirişi alt/üst yüzleri ek kesit olabilir; bunlar yapay yeni kat veya yeni inşaat derzi sayılmaz. Bütün gerekli kesit tarafları aynı model, rijitlik ve analiz kimliğinde bulunmalıdır.

Narin perdede moment kritik bölge içinde taban değerini korur; üstte kaynak diyagrama paralel doğru ve gerçek momentin elverişsizi alınır. N-M kontrolü gerçek N'de ihtiyatlı ± bileşen sınırlarını denetler; bu köşelerin eşzamanlı fiziksel takım olduğu söylenmez. Eksenel sınırda bütün ULS basınç üst sınırını kullanmak ihtiyatlıdır. Yerel/zayıf doğrultu stabilitesi ve genel ikinci mertebe ayrıca açık kalır; `generalSecondOrderSolved=false`.

Kapasite kesmesinde gerçek taban N kümesindeki ± moment kapasitesi, `1.25Mr`, βv=1.5, gerçek G/E ve `1.2D`/`1.4D` üst sınırı ile Vd alt sınırı vardır. Şekil 7.12'nin 0.5 taban kesmesi alt sınırı, güvenli tarafta tüm yüksekliğe uygulanır. Sıfır Md ile sıfır olmayan kesmede oran uydurulmaz. Vr ve beton üst sınırı; temel/kat derzlerinde ayrıca sürtünme kontrol edilir. En az 5mm pürüzlü derz açık kaynaklı olmalıdır. Çekmede çelik rezervi azaltılır, beton katkısı kullanılmaz; TS500'ün daha sıkı beton üst sınırı da korunur.

Güçlü perde, bağlı gerçek P09 kirişleri ve bağ kirişi tasarımlarından kapasite alır. ± yönde, aynı sabit kesitte gözlenen bütün N'ler arasındaki en küçük perde kapasitesi ve en büyük kiriş kapasitesiyle ihtiyatlı kontrol yapılır. Sabit 1.45 yoktur. Çatı bitişi istisnası diğer kontrolleri kaldırmaz. Uygun olmayan bağlı kiriş, eksik revizyon veya kapasite tasarımı gizlenmez.

### Bağ kirişi ve kuvvet aktarımı

7.20 koşullarından biri sağlanırsa normal dal P09'un gerçek eğilme, kesme, ankraj ve servis hesabını çağırır. İkisi de sağlanmazsa iki gerçek çapraz demet gerekir. Her çubukta sol ankraj, sol yüz, sağ yüz ve sağ ankraj koordinatları bulunur. Eğim bu noktalardan gelir. En az dört bar, `1.5lb`, gerçek perde kalınlığı/boyu/üst-alt boşluğu, demet kafesi, kanca/etriye aralığı ve kesme üst sınırı kontrol edilir. Demetlerin birbirine ve normal kiriş donatısına uzaklığı ankraj bölgesinde de hesaplanır. Ek normal TS500 donatısı ve gövde donatısı ayrıca korunur.

Perde eksenel kuvvetinin bağ bölgesi altından üstüne sıçraması, G ve E için ayrı ayrı gerçek bağ kirişi düşey uç kuvvetiyle eşleşmelidir. Bağ kirişi hesabı başarılı diye sıfır eksenel kuvvetli iki perde uygun sayılmaz. Bölgede başka yük/aktarım varsa bu sınırlı denge profili otomatik kabul etmez. Çapraz dal genel yayılı yük, ortalama moment, eksenel kuvvet veya torsiyon için bir strut-tie çözümünün yerine geçmez. İmalat kesim listesi ve stok/ek geçerliliği ayrıca P15 kapısındadır.

### Mod, bağlılık ve gerçek yeniden analiz

Nv, gerçek bağlantı elemanlarının düşey uç kuvvetlerinden her modda toplanır. Perde düşey atalet etkisi ayrıca tutulur; kesit eksenel kuvvetiyle mod bazında denge sınanır. Moment kolları toplanmadan mutlak değer alınmaz. Ω, ortak mod vektörlerinin CQC sonucundan hesaplanır; bağımsız maksimumlar birbirine bölünüp eşzamanlı takım kurulmaz.

Ω<1/3 ise her perde parçası kendi taban kesiti, ağırlık merkezi ve kaynaklı kenar aksıyla boşluksuz perde olarak yeniden sınıflanır. P08 gerçek modal/global hesabı yeniden çalışır. Bağ elemanları fiziksel modelden silinmez. R/sistem kararı değişince bütün bağımlı elemanlar, donatı/metraj ve rapor snapshot'ı geçersizdir. Güncel kuvvetleri sağlayan yeniden üretim callback'i yoksa `rebuild_required`; eski paket verilirse hata vardır. Callback sonrasında P11 ve varsa P10 eleman kontrolleri tekrar hesaplanır. Karar kararsızsa dört tur sonunda yakınsamayan sonuç korunur. Ω>2/3 için genel modal eksenel/etkileşim kanıtı eksikse açık kontrol kalır.

Köşe düğümüne bağlanan bir çubuğun kabuğun drilling dönmesi, gerçek rijit perde uç dönmesi kabul edilmedi. Bu yol `connection_incomplete` üretir. Ortak kabuk yüzleriyle bağlanan örnek doğrulandı. Döşeme kısıtından bağ kabuğunun içine yük geliyorsa bunu iki uçlu yüksüz kiriş diye aktarmak reddedilir. Son örnek bu karışımı gizlemek yerine, katın altında açık ve gerçek yüzleri olan bağ bölgesi kullanır.

## P08'e yapılan üç amaçlı değişiklik

1. `global-demand`: varsayılan eski yol korunarak gerçek bağ elemanı entegrasyonu sağlayan evaluator eklendi.
2. `global-review`: bu evaluator gerçek her R çözümüne aktarılır; tüm eski çağrılar iki argümanla çalışır.
3. `global-period`: bağlı grubun gerçek ayrık dikdörtgen perde parçaları Ct alanına alınır. Kaynak Denk.4.28 ayrıca doğrulandı: `At=min(ΣAw,ΣAw(0.2+lw/HN)^2)`. Önceki ifade yalnız `lw/HN` terimini kareliyordu; düzeltildi. Ct'nin 0.07'ye takılmadığı bağımsız test bu hatayı yakalar.

Diğer önceki kaynaklar korunur. `intended-refactors.json`, bu üç dosyadaki yalnız belgelenen değişiklikler tersine çevrilince başlangıç hash'lerinin geri elde edildiğini doğrular.

## Gerçek doğrulama

- Son domain paketi: **147/147**, skip 0; 124 regresyon +23 yeni test. Lint sıfır uyarı, uygulama tsc başarılı. Genel tsc **552 eski tanıyla başarısız**; yeni/çıkan tanı imzası 0.
- Bağımsız P10 iki eksenli kesit, L hücrelerinde ayrı lif integrasyonu, dönüş/öteleme, gerçek kabuk tabanında 800kN/10kN/30kNm kapalı denge, minimum/başarısız donatı ve kayıp/yoğunlaşmış çirozlar sınandı. Bu rakamlar verilen küçük benchmark yükleridir; kaynak proje cevabı değildir.
- Bağ kirişi gerçek eğimi, Φ36 demet alanı, kısa ankraj, kafes ve normal bar çakışmaları; gerçek N sıçraması, değişen kiriş donatısıyla güçlü perde oranı, eski/missing kesit, bilinen sıfır/unknown ve yanlış bodrum rolü karşı testleri var.
- Ortak yüzlü FE modelinde bağlılık değişimi ve gerçek P08 yeniden çözüm; altı perde ve bir bağ kirişi yeniden üretilip kontrol edildi. A12/R7 adayı, ayrı A13 parçalarıyla nominal R6 ve dağılım koşuluyla kullanılan R≈4.8'e geçti. Yeni gerçek K/T statik çözümünden bütün ilgili kuvvetler tekrar alındı. Örnek bir katın ana doğrultu doğrulamasıdır; genel X/Y CQC etkileşimi veya native bina kabulü değildir.
- 32/64 hücre %1 hedefini geçmedi. Tolerans değiştirilmedi. Ω sırasıyla64/128/256/512 hücrede `0.0123542111 / 0.0122051812 / 0.0121679199 / 0.0121586153`;128–256 farkı≈%0.306,256–512≈%0.077. Bu yakınsama bağ ağına ve sabit pier modeline aittir; tüm gerçek bina ağı doğrulaması değildir. Son CLI global örneği128bağ hücresi kullanır.
- CLI: hazır/12perde/çapraz demet/global/tekrar0; eksik/başarısız/bodrum/eski/uyumsuz bağlantı/yeniden üretim bekliyor2; mevcut çıktıyı ezme1.12perdenin tamamı işlenir. Üye ve global tekrar çıktıları byte eşittir; girdi SHA kontrol edilir.

CLI: `node --import tsx scripts/hsyncad/export-wall-design.ts --input <mutlak.json> --output <yeni-mutlak.json>`. `members` açık eleman paketini; `system` gerçek global model, aktarım tanımı ve varsa yeniden üretilmiş tasarım paketini alır. CLI fiziksel kuvvetleri veya bilinmeyen tasarımları kendiliğinden doldurmaz. Genel uygulama adaptörü/Worker/UI bağlantısı P17'dir.

Kanıt kökü: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\statik-rapor-uygulama-2026-11-05\asama-11`. Sonuç/koruma: `preservation-and-closure.json`; komutlar ve başarısız ara denemeler kendi `result.json/stdout.log/stderr.log` dosyalarındadır. İlk UTF8 konsol, ankraj, kaynak enum, strict float, kaba ağ ve yanlış bağlantı modeli denemeleri saklandı; geçtiler diye sayılmaz. Kaynak metinler dışında yeni PDF üretilmedi.

Kaynak: [TBDY teknik eki TDMD kopyası](https://www.tdmd.org.tr/Eklenti/24,54-tbdy2018pdf.pdf?0=), [TS500 CU kopyası](https://abs.cu.edu.tr/Dokumanlar/2016/IMZ312/363439620_ts_500_-_betonarme_yapilarin_tasarimi_ve_yapim_kurallari.pdf).11TBDY ve5TS500sayfası görüntüden incelendi; indisler/orijinal/render hash'leri `source-manifest.json` içindedir. Resmî kopya/tadil zinciri ve tam mevzuat onayı verilmedi.

## Açık kalan gerçek kapsam

MS1/SK native alan/revizyon/G-Q/malzeme aktarımı ve yerel sistem/donatı kıyası tamam değil; sentetik modeller bu kabulün yerine geçmez. L/T/U ortak kesit kapasitesi var, özel uç/sarılma/kol etkileşimi tasarımı açık. Bodrum çevre perdesinin toprak/su/mesnet ve iki yönlü panel koşulları üst deprem perdesiyle karıştırılmaz; ayrı model tamam değilse `requires_engineering` kalır. Genel kesit/rijitlik geçişi, boşluk çevresi, ek/kısaltma, yerel zayıf yön stabilitesi, genel ikinci mertebe/torsiyon, frame-shell rijit uç kısıtı, yüksek bağlılıkta modal eksenel/etkileşim, genel CQC eşzamanlı etkileşim ve tüm imalat/metraj/UI/PDF kapıları açıktır.

Zemin etüt PDF'si zorunlu yapılmadı. Bu aşamada yeni ideCAD/REA/native, UI/browser/build/Linux/Worker veya nihai birleşik PDF koşusu yapılmadı. Önceki somut REA kanıtları korundu; yeni REA testi diye sunulmadı.20özgün/5kullanıcı dosyası ve129önceki kaynak aynı;3amaçlı P08değişikliği,17son kaynak hash'i ve HEAD/main denetlendi. Commit/push/deploy yoktur.
