# P09 — Kiriş tasarım temeli

6 Kasım2026. Açık, imzalı deterministik kuvvet girdili uniform prizmatik betonarme kiriş profili sonuçlandırıldı. Genel bina/native kabulü değildir. P10 başlamadı;sonraki `devam` komutu beklenir. Commit/push/deploy yok.

## Yeni hesap sınırı

- `rc-beam-section.ts`: yerinde döküm beton C16–C50 için TS500 k1 tablosu, γc1.5/γs1.15, Es200000MPa; tablo/denklem veya açık deney kanıtıyla fctk/Ec. Beyan edilen tablodan farklı değer reddedilir. Yüksek süneklikte en az C25 ve B420C/B500C profili;S420 ek koşulları mühendis değerlendirmesinde kalır. Bu değerler yeni projeye varsayılan malzeme olarak yazılmaz.
- Dikdörtgen ve monolitik simetrik T/tek taraflı L için gerçek komşu net mesafe/tabla kalınlığı/mesnet sınıfından etkili genişlik. Genel asimetrik kesit desteklenmez. Gerçek donatı koordinatları, imzalı moment ve eksenel kuvvetle düzlem kesit/εcu.003/elastoplastik çelik dengesi bisection ile çözülür. Brüt eşdeğer beton bloğu kullanılır. Basınç çeliği akmış varsayılmaz;gerilmesi şekil değiştirmeden çıkar. Kopma uzaması.1, min/max/denge oranı ve çekme akması ayrıca denetlenir.
- `beam-forces.ts`: P06'nın salım/rijit kaçıklık sonrası yerel uç kuvvetlerinden gerçek esnek boyu alır. kN/kNm/m → mm kesit sınırı açık. Sol/sağ mesnet yüzü, orta ve kesmenin sıfır olduğu analitik moment ekstremumları;ilave istasyonlar vardır. Uç kuvvet/yayılı yük dengesi her bileşenin kendi ölçeğiyle sınanır. Birleşimler model/rijitlik/analiz snapshot kimliğiyle uyumlu olmalıdır. Bağımsız CQC/SRSS maksimumları eşzamanlı fiziksel N-M-V-T diye kabul edilmez.

## Donatı ve detay

`beam-design.ts`, mevcut donatıyı doğrulama ve katalogdan yeniden tasarımı ayırır. Çap/adet/sıra, net örtü, agrega ve gerçek yatay/düşey net aralığa göre bar merkezleri üretilir;çakışan/sığmayan yerleşim reddedilir. İki yüz donatısı bütün açıklık boyunca süreklidir;kuramsal kesme noktasında çubuk kesilmez. Böylece açıklıkta en az1/3 ve mesnet üstünde en az1/4 süreklilik koşulları bu profil için fazlasıyla korunur. Daha az donatılı kısaltılmış bar optimizasyonu yapılmadı.

Katalog60bin olası çift ve en fazla5000 tam değerlendirme bütçesiyle sınırlıdır. M≤N*h/2+Σ(As*fyd*y) denge üst sınırı kesin yetersiz adayları çözüme girmeden eler;bu eleme kabul üretmez. Bütçe tükenmesi kesit yetersizliği kanıtı veya başarılı tasarım değildir. Katalogda ilk geçerli yerleşim seçilir;global metraj optimumu iddiası yok. Kritik birleşim/istasyon, kullanım oranı, gereken/seçilen alan ve bütün kuvvet/kapasite kayıtları saklıdır. Yalnız ilk10eleman işlenmez.

`beam-detailing.ts`: TS500 kesme/eğik çatlama/üst basınç sınırı ve denge burulması;dış etriye kolu alanı, gerçek çekirdek alan/çevresi ve ek boyuna alan. Uygunluk burulması azaltımı otomatik uygulanmaz. İhmal yalnız kaynaklı küçük burulma eşiğindedir. Burulma boyuna alanının yarısı her ana yüzde eğilmeye ek rezerv olarak istenir;yan gövde donatısı bu rezervden düşülmez. V/T için bağımsız en büyük bileşenlerin beraber kullanıldığı kontrol ihtiyatlı bir üst sınırdır, fiziksel eşzamanlı kuvvet takımı değildir.

Yüksek süneklik nesnesi verilirse TBDY7.4 profili uygulanır: gerçek imzalı düşey/deprem bileşenlerinden iki yönlü1.4Mr kapasite kesmesi ve gerçek D-artırılmış toplam üst sınırı. Her uç moment kapasitesi ilgili birleşimin gerçek eksenel kuvvetiyle yeniden hesaplanır. Sarılma bölgesinde deprem kesme payı koşulunda Vc=0 olur. Sarılma boyu2h,ilk etriye25mm;uç/orta aralıklar ayrı. Bu profil elverişli DTS'de oranı%30'a indirmez;alt/üst için ihtiyatlı%50 kullanır.

Düz ankraj veya90°filletli kanca için gerçek kullanılabilir boy/örtü/aralık ve kaynak gerekir. Gerekli boy,konumI/II,çap ve örtü/aralık çarpanlarıyla belirlenir;fazla donatı indirimi yapılmaz. Düz yüksek süneklikte en az50φ da aranır. Kancada yatay/düşey kol,iç çap ve gerçek yay/teğet kesim boyu kaydedilir. Tam boy çubuk stok boyunu aşarsa uygun sayılmaz. Bindirme için bağımsız yerel boy/sargı/yasak bölge kontrolü vardır;bu tek başına şaşırtma/kalabalık/gerçek parça yerleşimi kabulü değildir. Otomatik tasarımda ekli/kısaltılmış çubuk profili açıkça desteklenmiyor.

Gövde/yan yüz çubukları alan/çap/aralığa göre gerçek koordinatla üretilir. Etriye merkezleri ve135°kanca/6φ-en az80mm kuyruk şartı kaydedilir;nihai etriye kesim boyu null kalır. P15'in gerçek imalat kesim listesi/metrajı yapılmış sayılmaz. Dolaylı mesnette askı kuvveti beyanı yeterli değildir;yerleşim/topoloji doğrulaması açık kalır. Komşuluk karşılıklı fiziksel düğüm/kimlik/revizyonla denetlenir;kolon-kiriş birleşim kabulü P10'dur.

## Servis ve çıktı

`beam-service.ts`: gerçek servis toplam/kalıcı/live kuvvet durumları;çatlamış kesitin dönüştürülmüş alan integralleri, tarafsız eksen, Ig/Icr ve TS500 etkili atalet. Gerçek uniform moment eğriliği integre edilir;basit/sürekli kirişte mesnet kirişine göre,cantileverde sabit uca göre sehim bulunur. Çift ankastre ve basit kiriş kapalı çözümleri bağımsız oracle'dır. Süre ve basınç donatısı oranıyla λ/ek uzun süre sehmi;çevreye göre çatlak sınırı ve gerçek elastik çelik gerilmesi hesaplanır. Bölme duvarlı durumda tam uzun süre toplamını kıyaslamak ihtiyatlıdır. Servis eksenel/iki eksenli/burulmalı çatlak etkileşimi bu profilde reddedilir. Malzeme,süre,çevre veya servis verisi eksikken genel kabul yok.

`node --import tsx scripts/hsyncad/export-beam-design.ts --input <mutlak.json> --output <yeni-mutlak.json>`

Girdi `{beams: BeamDesignInput[]}`;en fazla5000kimlikli kiriş,30MB CLI sınırı,her kiriş en fazla128ULS durumu. Bunlar kapasite sınırıdır,5000eleman performans kabulü değildir. Kaynak SHA,bütün kiriş sonuçları ve kimlikler korunur. Hazır exit0;eksik/başarısız/bütçe/tekil tanı exit2;bozuk ana girdi veya mevcut çıktının üzerine yazma exit1. `design_ready` yalnız tanımlı hesap profili;kamu/kurum/normatif uygunluk değildir. engineeringAcceptance/wholeBuildingApproved false.

## Gerçek doğrulama ve açık işler

Kanıt: `C:\Users\hsyn\Desktop\hsyncad\incelemeler\statik-rapor-uygulama-2026-11-05\asama-09`.

Son104domain test(85önceki+19yeni),skip0;lint ve uygulama tsc geçti. Genel tsc552eski tanıyla başarısız,yeni/çıkan imza0. Tek/çift donatılı kapalı denge,pozitif tabla/negatif gövde,eksenel denge/kopma sınırı,gerçek P06 reaksiyon/istasyon,sehim kapalı çözümleri,malzeme kaynağı,sığmama,kötü kesme/burulma,ankraj/bindirme,gerçek torsiyon ve eksenel kapasite kesmesi,yükle değişen donatı,eski snapshot/eksik/bütçe ve12elemanın tamamı sınandı. Sabit native rapor sonucu oracle olmadı.

Son CLI hazır/yüksek yük/12eleman/tekrar0;eksik servis/başarısız/bütçe2;üzerine yazma1. Hazır örnek59.4kNm talepte4φ12alt/4φ12üst seçti;247.5kNm talepte9φ14iki sıra alt/4φ12üst seçti. İkinci örnek78tam aday değerlendirdi,1699kesin yetersiz adayı eledi. Bunlar ölçülen fixture sonuçlarıdır,ürün sabiti değildir. Tekrar byte-eşit,girdiler SHA ile korunur. İlk testlerde yanlış sınır girdileri/minimum etriyenin baskın olduğu assertion ve yetersiz arama kapsamı görüldü;test yükü veya tolerans gevşetilmeden kaynak/bütçe/eleme ayrımı düzeltildi. Parse/terminal UTF8 ara hataları ve eski başarısız loglar saklıdır. İlk materyal varsayımı yerini açık tablo/denklem/deney sözleşmesine bıraktı.

TS500 orijinal TSE metninin Çukurova Üniversitesi kopyası81sayfa edinildi;TBDY özgün teknik ek kopyası önceki kaynaktan. Toplam31sayfa görüntüden incelendi;TS500 T1/T2 eklerinin ilgili metinleri ayrıca okundu. Kaynak/görüntü SHA ve URL `source-manifest.json` içindedir. Bütün tadil seti,resmî sunucu byte eşitliği ve tam normatif kabul yok. Yeni REA/native üç proje eşleştirmesi yapılmadı;önceki REA repo kanıtı korundu. Yeni UI/bundle bağlantısı yok;build/browser/PDF/Worker/Linux koşulmadı,önceki P08 build/browser yeni test diye sunulmadı.

Genel noktasal/değişken yük ve çok parça fiziksel kiriş adaptörü,iki eksenli/servis eksenel-burulma etkileşimi,otomatik bindirme/kesim ve askı yerleşimi,genel minimum ağırlık optimizasyonu,kirişsiz/bant döşeme modeli,P11 bağ kirişi özel donatısı,CQC etkileşim kabulü,native alanlar ve UI/PDF/imalat listesi açıktır. Bu durumlar uygun diye doldurulmaz. P09 bu sınırlar içindeki kiriş tasarım temeliyle sonuçlandırıldı;tam bina kabulü false,P10 için devam beklenir.
