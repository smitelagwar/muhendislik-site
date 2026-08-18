module.exports=[18744,a=>{"use strict";var b=a.i(522734),c=a.i(814747);let d="https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf",e={tbdy:{category:"TBDY 2018 Rehberi",color:"bg-red-600 text-white",badge:"TBDY 2018",sourceLabel:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",sourceHref:d},"tbdy-betonarme":{category:"TBDY Betonarme Detayları",color:"bg-orange-600 text-white",badge:"TBDY Bölüm 7",sourceLabel:"AFAD — TBDY 2018, Bölüm 7",sourceHref:d},ts500:{category:"TS 500 Betonarme",color:"bg-blue-600 text-white",badge:"TS 500",sourceLabel:"ÇŞİDB — Betonarme İşleri Genel Teknik Şartnamesi",sourceHref:"https://webdosya.csb.gov.tr/db/yfk/icerikler/c18---betonarme-isler--20190412161656.pdf"},"mevcut-guclendirme":{category:"Mevcut Binalar ve Güçlendirme",color:"bg-fuchsia-700 text-white",badge:"TBDY Bölüm 15",sourceLabel:"AFAD — TBDY 2018, Bölüm 15",sourceHref:d},"yapi-denetimi":{category:"Yapı Denetimi ve Malzeme",color:"bg-amber-600 text-zinc-950",badge:"Saha Kontrolü",sourceLabel:"ÇŞİDB — Yapı Denetimi Mevzuatı",sourceHref:"https://yapiisleri.csb.gov.tr/yapi-denetimi-daire-baskanligi-mevzuati-90235"},yangin:{category:"Yangın Yönetmeliği",color:"bg-orange-700 text-white",badge:"Yangın",sourceLabel:"ÇŞİDB — Yangın mevzuatı",sourceHref:"https://meslekihizmetler.csb.gov.tr/"},otopark:{category:"Otopark Yönetmeliği",color:"bg-slate-700 text-white",badge:"Otopark",sourceLabel:"ÇŞİDB — Otopark mevzuatı",sourceHref:"https://meslekihizmetler.csb.gov.tr/"},imar:{category:"İmar Mevzuatı",color:"bg-emerald-700 text-white",badge:"İmar",sourceLabel:"ÇŞİDB — İmar mevzuatı",sourceHref:"https://meslekihizmetler.csb.gov.tr/"},bep:{category:"BEP-TR / TS 825",color:"bg-lime-600 text-zinc-950",badge:"Enerji",sourceLabel:"ÇŞİDB — Enerji verimliliği mevzuatı",sourceHref:"https://meslekihizmetler.csb.gov.tr/"},"su-zemin":{category:"Zemin, Temel ve Su",color:"bg-cyan-700 text-white",badge:"Zemin ve Temel",sourceLabel:"ÇŞİDB — Zemin ve Temel Etüdü Tebliği",sourceHref:"https://bartin.csb.gov.tr/zemin-ve-temel-etudu-uygulama-esaslari-ve-rapor-formatina-dair-teblig-yayimlandi-haber-238675"},engelsiz:{category:"Engelsiz Tasarım",color:"bg-violet-700 text-white",badge:"Erişilebilirlik",sourceLabel:"ÇŞİDB — Erişilebilirlik mevzuatı",sourceHref:"https://meslekihizmetler.csb.gov.tr/"},eurocode:{category:"Eurocode Standartları",color:"bg-indigo-700 text-white",badge:"Eurocode",sourceLabel:"Türk Standardları Enstitüsü",sourceHref:"https://www.tse.org.tr/"},akustik:{category:"Akustik ve Gürültü",color:"bg-zinc-700 text-white",badge:"Akustik",sourceLabel:"ÇŞİDB — Binaların Gürültüye Karşı Korunması",sourceHref:"https://meslekihizmetler.csb.gov.tr/"},asansor:{category:"Asansör Yönetmeliği",color:"bg-teal-700 text-white",badge:"Asansör",sourceLabel:"Sanayi ve Teknoloji Bakanlığı",sourceHref:"https://www.sanayi.gov.tr/"},isg:{category:"İSG ve Şantiye Güvenliği",color:"bg-amber-700 text-white",badge:"İSG",sourceLabel:"Çalışma ve Sosyal Güvenlik Bakanlığı",sourceHref:"https://www.csgb.gov.tr/"},cevre:{category:"Çevre Mevzuatı",color:"bg-green-700 text-white",badge:"Çevre",sourceLabel:"ÇŞİDB — Çevre mevzuatı",sourceHref:"https://cygm.csb.gov.tr/"}},f=[{slug:"tbdy-bks-dts-bys-belirleme",title:"BKS, DTS ve BYS'nin Birlikte Belirlenmesi",description:"Bina kullanım sınıfı, deprem tasarım sınıfı ve bina yükseklik sınıfını tek karar akışında ele alır.",seriesId:"tbdy",decision:"Önce kullanım ve önem katsayısı, ardından harita-parametre-zemin ilişkisi, son olarak bina yüksekliği okunur. Bu sıra bozulursa taşıyıcı sistem tablosu yanlış seçilebilir.",checks:["BKS ve bina önem katsayısını kullanım amacıyla eşleştirin.","SDS üzerinden DTS'yi, özel durumlarda ilgili alt sınıfı belirleyin.","Toplam bina yüksekliğini doğru referans kotundan ölçerek BYS'yi seçin."],keywords:["BKS","DTS","BYS","bina yüksekliği"]},{slug:"tbdy-performans-hedefleri-dd-sh-kh-go",title:"DD Düzeylerine Göre SH, KH ve GÖ Performans Hedefleri",description:"Deprem yer hareketi düzeyleri ile sınırlı hasar, kontrollü hasar ve göçmenin önlenmesi hedeflerini eşleştirir.",seriesId:"tbdy",decision:"Performans hedefi analiz sonunda verilen bir etiket değil, kullanılacak değerlendirme yöntemini ve kabul sınırlarını baştan belirleyen tasarım girdisidir.",checks:["Bina kullanım sınıfına göre hedef performans tablosunu seçin.","DD-1, DD-2, DD-3 ve DD-4 düzeylerini birbirine karıştırmayın.","Yeni bina ve mevcut bina hedeflerini aynı kabul tablosuyla değerlendirmeyin."],keywords:["performans hedefi","SH","KH","GÖ","DD-2"]},{slug:"tbdy-etkin-kesit-rijitlikleri",title:"Kiriş, Kolon, Perde ve Döşemelerde Etkin Kesit Rijitlikleri",description:"Çatlama etkisini temsil eden etkin rijitliklerin analiz modeline nasıl aktarılacağını açıklar.",seriesId:"tbdy",decision:"Brüt kesit rijitliğinin kontrolsüz kullanılması periyot, ötelenme ve iç kuvvet dağılımını değiştirir; eleman türüne uygun etkin değerler model notlarında kayıt altına alınmalıdır.",checks:["Eleman bazında eğilme ve kesme rijitliği kabullerini listeleyin.","Perde, bağ kirişi ve döşeme kabullerini ayrı tanımlayın.","Model raporundaki değerleri proje hesap özetiyle karşılaştırın."],keywords:["etkin rijitlik","çatlamış kesit","modelleme"]},{slug:"tbdy-kutle-kaynagi-hareketli-yuk-katilimi",title:"Deprem Hesabında Kütle Kaynağı ve Hareketli Yük Katılımı",description:"Sabit yükler ile hareketli yüklerin deprem kütlesine hangi mantıkla katıldığını gösterir.",seriesId:"tbdy",decision:"Kütle kaynağı yalnız program menüsündeki bir seçim değildir; kat ağırlığını, taban kesmesini ve modal katılımı doğrudan belirler.",checks:["Sabit yük, kaplama ve duvar yüklerinin kütleye dahil edildiğini doğrulayın.","Hareketli yük katılım katsayısını kullanım türüne göre seçin.","Kütlenin katlara ve diyaframa doğru dağıldığını kontrol edin."],keywords:["kütle kaynağı","hareketli yük","katılım katsayısı"]},{slug:"tbdy-rijit-yari-rijit-diyafram",title:"Rijit ve Yarı Rijit Diyafram Seçimi",description:"Döşeme düzlem içi davranışının hangi durumda rijit, hangi durumda kabuk elemanlarla modellenmesi gerektiğini açıklar.",seriesId:"tbdy",decision:"Büyük boşluklar, düzensiz planlar ve kuvvet aktarımında kesintiler varsa tek rijit diyafram kabulü gerçek iç kuvvet yolunu gizleyebilir.",checks:["Döşeme boşluklarını, konsolları ve dar bağlantı bölgelerini inceleyin.","Aynı katta bağımsız diyafram gerektiren blokları ayırın.","Yarı rijit modelde ağ sıklığını ve toplayıcı kuvvetlerini kontrol edin."],keywords:["rijit diyafram","yarı rijit diyafram","döşeme"]},{slug:"tbdy-esdeger-deprem-yuku-uygulanma-sinirlari",title:"Eşdeğer Deprem Yükü Yönteminin Uygulanma Sınırları",description:"Yöntemin bina yüksekliği, düzensizlik ve taşıyıcı sistem koşullarına göre kullanılabilirliğini özetler.",seriesId:"tbdy",decision:"Yöntem kolay olduğu için değil, yönetmelikteki uygulanabilirlik şartları sağlandığı için seçilmelidir.",checks:["DTS ve BYS koşullarını birlikte değerlendirin.","Plan ve düşey düzensizliklerin yöntem seçimine etkisini kontrol edin.","Bulunan taban kesmesini modal analiz gereklilikleriyle karşılaştırın."],keywords:["eşdeğer deprem yükü","analiz yöntemi","taban kesme"]},{slug:"tbdy-yeterli-mod-modal-kutle-katilimi",title:"Yeterli Titreşim Modu ve Modal Kütle Katılımı",description:"Modal analizde hesaba katılacak mod sayısını ve kütle katılımının nasıl izleneceğini açıklar.",seriesId:"tbdy",decision:"Sabit sayıda mod kullanmak yerine her iki yatay doğrultuda yeterli toplam katılım sağlanana kadar analiz genişletilmelidir.",checks:["X ve Y doğrultularındaki birikimli modal kütleyi ayrı okuyun.","Burulma modlarının sonuçlara etkisini inceleyin.","Yetersiz katılımda mod sayısını ve model serbestliklerini gözden geçirin."],keywords:["mod sayısı","modal kütle","titreşim"]},{slug:"tbdy-modal-taban-kesme-olceklendirme",title:"Modal Taban Kesme Kuvvetinin Ölçeklendirilmesi",description:"Mod birleştirme sonucunun yönetmelikteki alt sınırla karşılaştırılması ve ölçeklenmesini ele alır.",seriesId:"tbdy",decision:"Ölçek katsayısı yalnız toplam taban kesmesine uygulanıp eleman sonuçları unutulmamalı; ilgili tepki büyüklükleri tutarlı biçimde ölçeklenmelidir.",checks:["Modal taban kesmesini referans değere göre her doğrultuda karşılaştırın.","Ölçek katsayısının hangi sonuç gruplarına uygulandığını belgeleyin.","Birleşim ve tasarım zarflarının ölçekli sonuçlardan üretildiğini doğrulayın."],keywords:["modal ölçekleme","taban kesme","spektrum analizi"]},{slug:"tbdy-yuzde-100-yuzde-30-birlesimi",title:"Birbirine Dik Deprem Doğrultularının %100–%30 Birleşimi",description:"İki yatay deprem doğrultusunun eleman tasarım etkilerinde birlikte ele alınmasını açıklar.",seriesId:"tbdy",decision:"Kolon, perde ve birleşim tasarımında yalnız baskın doğrultuya bakmak iki eksenli talepleri eksik bırakır.",checks:["Her iki işaret ve doğrultu birleşimini üretin.","Kolon P-M-M ve perde kuvvet zarflarını birleşik etkilerle oluşturun.","Yazılım kombinasyonlarını hesap raporunda açıkça gösterin."],keywords:["100 30 kuralı","iki doğrultu","yük birleşimi"]},{slug:"tbdy-dusey-deprem-etkisi",title:"Düşey Deprem Etkisinin Hesaba Katılması",description:"Düşey deprem bileşeninin zorunlu olduğu eleman ve açıklıklarda yük birleşimlerine nasıl girdiğini ele alır.",seriesId:"tbdy",decision:"Uzun açıklık, konsol, transfer ve öngerme benzeri düşey dinamik talebe duyarlı bölgeler proje özelinde ayıklanmalıdır.",checks:["Düşey etkinin zorunlu olduğu elemanları modelden önce listeleyin.","Düşey spektrum veya eşdeğer etkinin yük birleşimlerine girişini doğrulayın.","Mesnet tepkileri ve açıklık momentlerindeki işaret değişimlerini inceleyin."],keywords:["düşey deprem","konsol","yük birleşimi"]},{slug:"tbdy-deprem-derzi-hesabi",title:"Deprem Derzinin Hesabı ve Taşıyıcı Sistem Detayları",description:"Komşu blokların çarpışmasını önleyecek derz genişliğini ve mimari-taşıyıcı süreklilik detaylarını açıklar.",seriesId:"tbdy",decision:"Derz genişliği tek blok ötelenmesinden değil, komşu yapıların göreli hareket olasılığından türetilir.",checks:["Komşu blokların kat kotlarını ve ötelenmelerini birlikte inceleyin.","Derzi kaplama, cephe ve tesisat detaylarında kapatmayın.","Temelden çatıya kesintisiz derz sürekliliğini projede gösterin."],keywords:["deprem derzi","çarpışma","ötelenme"]},{slug:"tbdy-bolum-17-basitlestirilmis-tasarim",title:"TBDY Bölüm 17 Basitleştirilmiş Tasarım Yönteminin Kapsamı",description:"Düzenli yerinde dökme betonarme binalar için basitleştirilmiş yöntemin ön koşullarını açıklar.",seriesId:"tbdy",decision:"Bölüm 17 genel bir kısa yol değildir; bina türü, kat sayısı, geometri ve düzensizlik sınırları birlikte sağlanmalıdır.",checks:["Binanın kapsam ve yükseklik sınırlarını doğrulayın.","Plan/düşey düzenlilik koşullarını ayrı kontrol edin.","Yöntem dışına çıkan tek bir koşulda genel analiz bölümlerine dönün."],keywords:["TBDY Bölüm 17","basitleştirilmiş tasarım","düzenli bina"]},{slug:"tbdy-uygulama-esaslari-taslak-statusu",title:"TBDY Uygulama Esasları Tebliğ Taslağının Resmî Statüsü",description:"2026 yılında paylaşılan taslak metin ile yürürlükteki TBDY hükümlerinin nasıl ayrılacağını açıklar.",seriesId:"tbdy",decision:"Resmî Gazete'de yayımlanmayan taslak değerler yürürlükteki proje kuralı gibi kullanılmamalıdır; sürüm ve kaynak bilgisi hesap raporunda yazılmalıdır.",checks:["Metnin Resmî Gazete yayımlanma bilgisini doğrulayın.","Taslak hükümleri TBDY 2018 maddeleriyle karıştırmayın.","Proje raporuna kullanılan mevzuatın tarih ve sürümünü ekleyin."],keywords:["TBDY 2026","tebliğ taslağı","yürürlük"]},{slug:"tbdy-betonarme-ozel-deprem-etriyesi-ciroz",title:"Özel Deprem Etriyesi ve Çiroz Düzenleme Kuralları",description:"Etriye kancası, çiroz, sarılma ve boyuna donatı mesnetleme koşullarını birlikte açıklar.",seriesId:"tbdy-betonarme",decision:"Sadece etriye aralığına bakmak yeterli değildir; kanca geometrisi, kapalı çevrim ve her boyuna çubuğun yanal tutulması birlikte sağlanır.",checks:["Kanca açılarını ve uzantılarını donatı detayında gösterin.","Çirozların ardışık sıralarda şaşırtılmasını kontrol edin.","Köşe ve ara boyuna donatıların yanal tutulduğunu doğrulayın."],keywords:["deprem etriyesi","çiroz","sarılma"]},{slug:"tbdy-betonarme-kenetlenme-bindirme-manson-bolgeleri",title:"Kenetlenme, Bindirme ve Mekanik Manşonların Yasaklı Bölgeleri",description:"Deprem talebinin yüksek olduğu bölgelerde donatı eki ve kenetlenme kararlarını ele alır.",seriesId:"tbdy-betonarme",decision:"Plastikleşme beklenen uç bölgelerde bindirme ekinden kaçınılmalı; ek yöntemi, konumu ve kalite belgesi projede tanımlanmalıdır.",checks:["Kolon ve kiriş uç bölgelerinde ek konumlarını işaretleyin.","Bindirmelerin aynı kesitte yığılmasını önleyin.","Mekanik manşon sınıfı ve deney belgesini proje şartıyla eşleştirin."],keywords:["bindirme","kenetlenme","mekanik manşon"]},{slug:"tbdy-betonarme-kolon-kesit-eksenel-yuk-siniri",title:"Yüksek Süneklikli Kolonlarda Kesit ve Eksenel Yük Sınırları",description:"Kolon boyutları ile normalize eksenel basınç düzeyinin sünek davranış üzerindeki etkisini açıklar.",seriesId:"tbdy-betonarme",decision:"Eksenel yük büyüdükçe dönme kapasitesi azalır; kesit seçimi yalnız düşey yük kapasitesine göre yapılamaz.",checks:["Kolonun en küçük kesit boyutunu doğrulayın.","Eksenel yük oranını depremli birleşimlerden hesaplayın.","Sınırı aşan kolonlarda kesit veya sistem düzenini revize edin."],keywords:["kolon boyutu","eksenel yük","yüksek süneklik"]},{slug:"tbdy-betonarme-kolon-boyuna-donati-duzeni",title:"Kolon Boyuna Donatısının Dağılım ve Süreklilik Kuralları",description:"Kolon donatı oranı, çevre boyunca dağılım ve katlar arası süreklilik kararlarını açıklar.",seriesId:"tbdy-betonarme",decision:"Toplam donatı alanı yeterli olsa bile çubukların kesitte ve birleşim boyunca yanlış dağılımı detayın çalışmasını engeller.",checks:["Minimum ve maksimum toplam donatı oranını kontrol edin.","Çubukları kesit çevresine dengeli dağıtın.","Kat geçişindeki çap ve adet değişimlerini kenetlenmeyle birlikte çözün."],keywords:["kolon donatısı","donatı oranı","süreklilik"]},{slug:"tbdy-betonarme-kolon-sarilma-bolgeleri",title:"Kolon Sarılma Bölgelerinin Belirlenmesi",description:"Kolon uçlarında ve birleşim çevresinde sıklaştırılmış enine donatı bölgelerini tanımlar.",seriesId:"tbdy-betonarme",decision:"Sarılma boyu; kat yüksekliği, kesit boyutu ve olası plastik mafsal bölgesi birlikte değerlendirilerek çizime aktarılır.",checks:["Alt ve üst uç sarılma boylarını ayrı gösterin.","Etriye aralığı ile ilk etriye konumunu kontrol edin.","Temel üstü ve bindirme bölgelerindeki özel koşulları uygulayın."],keywords:["kolon sarılma","etriye sıklaştırma","plastik mafsal"]},{slug:"tbdy-betonarme-kolon-kapasite-kesme",title:"Kolonlarda Kapasite Tasarımına Göre Kesme Güvenliği",description:"Kolon kesme kuvvetinin analiz sonucuyla sınırlı kalmadan moment kapasitesinden türetilmesini açıklar.",seriesId:"tbdy-betonarme",decision:"Amaç, eğilme mekanizması oluşmadan gevrek kesme kırılmasının meydana gelmesini önlemektir.",checks:["Kolon uç moment kapasitelerinden kapasite kesmesini hesaplayın.","Analiz kesmesi ve kapasite kesmesinin belirleyici değerini alın.","Beton katkısı ve enine donatı sınırlarını ilgili deprem durumuyla kontrol edin."],keywords:["kolon kesme","kapasite tasarımı","gevrek kırılma"]},{slug:"tbdy-betonarme-kiris-boyut-eksen-kacikligi",title:"Kiriş Kesit Boyutları ve Kolon-Kiriş Eksen Kaçıklıkları",description:"Deprem kirişlerinde genişlik, yükseklik ve kolonla birleşim geometrisi koşullarını açıklar.",seriesId:"tbdy-betonarme",decision:"Kirişin kolona dışmerkezli bağlanması birleşim bölgesindeki kuvvet aktarımını ve burulma talebini değiştirir.",checks:["Kiriş genişlik ve yükseklik sınırlarını kontrol edin.","Kiriş ekseninin kolon çekirdeğine göre konumunu ölçün.","Kaçıklık varsa birleşim ve burulma etkilerini ayrıca çözün."],keywords:["kiriş boyutu","eksen kaçıklığı","birleşim"]},{slug:"tbdy-betonarme-kiris-mesnet-donati-surekliligi",title:"Kiriş Mesnet Donatılarının Sürekliliği",description:"Üst ve alt kiriş donatılarının kolon yüzü, birleşim ve açıklık boyunca devam koşullarını ele alır.",seriesId:"tbdy-betonarme",decision:"Moment işaretinin deprem sırasında değişebilmesi nedeniyle alt ve üst donatı sürekliliği birlikte değerlendirilir.",checks:["Kolon yüzündeki pozitif ve negatif moment donatısını kontrol edin.","Birleşim çekirdeği içinde yeterli kenetlenme sağlayın.","Kesilen çubukların teorik kesim noktasından sonraki devam boyunu gösterin."],keywords:["kiriş donatısı","mesnet","süreklilik"]},{slug:"tbdy-betonarme-kiris-sarilma-bolgeleri",title:"Kiriş Sarılma Bölgeleri ve Etriye Sıklaştırması",description:"Kiriş uçlarında plastikleşme beklenen bölgelerin uzunluğu ve etriye düzenini açıklar.",seriesId:"tbdy-betonarme",decision:"İlk etriyenin kolon yüzüne uzaklığı ve sıklaştırma bölgesinin devamı, uygulama çiziminde ölçülendirilmeyen bir not olarak bırakılmamalıdır.",checks:["Her iki kiriş ucunda sarılma bölgesini ölçülendirin.","İlk etriye konumu ve aralık sınırlarını doğrulayın.","Bindirme eklerini sarılma ve plastikleşme bölgelerinden uzaklaştırın."],keywords:["kiriş sarılma","etriye","plastikleşme"]},{slug:"tbdy-betonarme-kiris-kapasite-kesme",title:"Kirişlerde Kapasite Tasarımına Göre Kesme Kuvveti",description:"Kiriş uç moment kapasitelerinden tasarım kesmesinin elde edilmesini açıklar.",seriesId:"tbdy-betonarme",decision:"Depremde sünek eğilme davranışı hedefleniyorsa kirişin kesme dayanımı olası uç momentlerden doğan talebi karşılamalıdır.",checks:["Her iki deprem yönü için uç moment kapasitelerini belirleyin.","Düşey yük kesmesini kapasite kesmesiyle doğru işaretle birleştirin.","Etriye hesabını belirleyici tasarım kesmesine göre yenileyin."],keywords:["kiriş kesme","kapasite tasarımı","etriye"]},{slug:"tbdy-betonarme-kusatilmamis-birlesim",title:"Kuşatılmış ve Kuşatılmamış Kolon-Kiriş Birleşimleri",description:"Birleşim bölgesinin çevre kirişlerle kuşatılma durumunu ve tasarıma etkisini açıklar.",seriesId:"tbdy-betonarme",decision:"Birleşimin kuşatılmış sayılması yalnız dört yönde kiriş bulunmasına değil, kiriş boyutları ve birleşim geometrisine de bağlıdır.",checks:["Birleşime bağlanan kirişleri iki doğrultuda değerlendirin.","Kiriş genişliği ve derinliğinin kuşatma şartlarını sağladığını doğrulayın.","Kuşatılmamış birleşim için daha elverişsiz kesme koşulunu kullanın."],keywords:["kolon kiriş birleşimi","kuşatılmış birleşim"]},{slug:"tbdy-betonarme-birlesim-kesme-guvenligi",title:"Kolon-Kiriş Birleşim Bölgesi Kesme Güvenliği",description:"Birleşim çekirdeğindeki yatay kesme talebi ile dayanım kontrolünü özetler.",seriesId:"tbdy-betonarme",decision:"Kolon ve kirişler ayrı ayrı yeterli görünse bile birleşim çekirdeğinde oluşan kesme gerilmesi sistemin gevrek zayıf halkası olabilir.",checks:["Kiriş donatısı kuvvetlerinden birleşim kesmesini çıkarın.","Birleşim alanını ve kuşatılma sınıfını doğru seçin.","Kolon enine donatısının birleşim içinde devamını gösterin."],keywords:["birleşim kesmesi","kolon kiriş","çekirdek"]},{slug:"tbdy-betonarme-perde-kolon-geometri-ayrimi",title:"Perde ve Kolon Ayrımı İçin Geometrik Koşullar",description:"Betonarme düşey elemanın perde veya kolon olarak ele alınmasını belirleyen boyut oranlarını açıklar.",seriesId:"tbdy-betonarme",decision:"Elemanın yazılımda perde adıyla tanımlanması yeterli değildir; geometrik koşul ve taşıyıcı sistem sınıfı birlikte sağlanmalıdır.",checks:["Kesit boyut oranını her katta kontrol edin.","Perde sürekliliğini ve doğrultusunu modelde izleyin.","Sistem sınıfındaki perde katkısını gerçek perde elemanlarla hesaplayın."],keywords:["perde","kolon","kesit oranı"]},{slug:"tbdy-betonarme-perde-kritik-yukseklik-uc-bolge",title:"Perde Kritik Yüksekliği ve Uç Bölgeleri",description:"Perde tabanındaki kritik bölgeyi ve özel sınır elemanı gereken uç bölgelerini açıklar.",seriesId:"tbdy-betonarme",decision:"Perde moment ve eğrilik talebinin yoğunlaştığı kritik yükseklik boyunca uç bölge detayları kat bazında kesintisiz sürdürülmelidir.",checks:["Kritik perde yüksekliğini temel üstünden belirleyin.","Uç bölge gereksinimini basınç talebiyle kontrol edin.","Uç bölge boyut ve donatısını kat geçişlerinde izleyin."],keywords:["perde kritik yüksekliği","uç bölge","sınır elemanı"]},{slug:"tbdy-betonarme-perde-govde-uc-donati",title:"Perde Gövde ve Uç Bölgesi Donatı Düzeni",description:"Yatay-düşey gövde donatısı ile yoğunlaştırılmış uç bölge donatısını birlikte ele alır.",seriesId:"tbdy-betonarme",decision:"Perde toplam donatı oranı tek başına yeterli değildir; çift sıra düzeni, bağlantı donatıları ve uç bölge sarılması çizimde okunabilmelidir.",checks:["Yatay ve düşey minimum gövde donatısını ayrı kontrol edin.","Çift sıra donatı ve bağlantı elemanlarını gösterin.","Uç bölge boyuna donatısını kapalı etriye ve çirozlarla sarın."],keywords:["perde donatısı","gövde donatısı","uç bölge"]},{slug:"tbdy-betonarme-perde-moment-kesme-zarfi",title:"Perdelerde Tasarım Momenti ve Kesme Kuvveti Zarfları",description:"Analiz sonuçlarının perde boyunca yönetmelik tasarım zarfına dönüştürülmesini açıklar.",seriesId:"tbdy-betonarme",decision:"Perdeyi yalnız analiz programındaki ham kat kuvvetleriyle donatmak kapasite tasarımı ve moment büyütme koşullarını atlayabilir.",checks:["Perde moment zarfını kritik yükseklik boyunca düzenleyin.","Kesme kuvvetini kapasite ve büyütme kurallarıyla kontrol edin.","Kabuk sonuçlarını kesit tasarım kuvvetlerine tutarlı biçimde dönüştürün."],keywords:["perde momenti","perde kesmesi","tasarım zarfı"]},{slug:"tbdy-betonarme-bag-kirisli-perde",title:"Bağ Kirişli Perdeler ve Çapraz Donatılı Bağ Kirişleri",description:"Boşluklu perdelerde bağ kirişi davranışı ve çapraz donatı gereksinimini açıklar.",seriesId:"tbdy-betonarme",decision:"Kısa ve derin bağ kirişlerinde geleneksel kiriş donatısı yüksek kesme talebini sünek biçimde taşıyamayabilir.",checks:["Bağ kirişi açıklık/yükseklik oranını belirleyin.","Çapraz donatı gerektiren durumu kontrol edin.","Çapraz demetlerin kenetlenme ve sargı detaylarını perde içine taşıyın."],keywords:["bağ kirişi","boşluklu perde","çapraz donatı"]},{slug:"tbdy-betonarme-perde-bosluklari-modelleme",title:"Perdelerde Kapı ve Pencere Boşluklarının Modellenmesi",description:"Perde boşluklarının rijitlik, gerilme yığılması ve bağ kirişi davranışına etkisini ele alır.",seriesId:"tbdy-betonarme",decision:"Mimari boşluğu kabuk modelde yok saymak perde rijitliğini ve kuvvet yolunu olduğundan farklı gösterir.",checks:["Tüm sürekli boşlukları analiz geometrisine aktarın.","Boşluk köşelerinde ağ kalitesini ve gerilme yığılmasını inceleyin.","Boşluklar arasındaki elemanı bağ kirişi veya perde parçası olarak doğru tanımlayın."],keywords:["perde boşluğu","kapı boşluğu","kabuk model"]},{slug:"tbdy-betonarme-diyafram-toplayici-baslik",title:"Döşeme Diyaframları, Toplayıcı Elemanlar ve Başlık Donatıları",description:"Kat deprem kuvvetlerinin döşemeden perde ve çerçevelere aktarılma yolunu açıklar.",seriesId:"tbdy-betonarme",decision:"Diyafram kuvveti kendiliğinden perdeye ulaşmaz; boşluk çevresi, toplayıcı şerit ve başlık donatısı açık bir yük yolu oluşturmalıdır.",checks:["Diyafram kesme ve eksenel kuvvetlerini çıkarın.","Perdelere uzanan toplayıcı bölgeleri tanımlayın.","Büyük boşlukların çevresinde başlık ve kenar donatısını detaylandırın."],keywords:["diyafram","toplayıcı","başlık donatısı"]},{slug:"mevcut-bina-riskli-yapi-ve-bolum-15-farki",title:"Riskli Yapı Tespiti ile TBDY Bölüm 15 Performans Analizi Arasındaki Fark",description:"6306 kapsamındaki risk tespiti ile deprem performansı ve güçlendirme değerlendirmesinin farklı amaçlarını açıklar.",seriesId:"mevcut-guclendirme",decision:"Riskli yapı tespiti sonucu, Bölüm 15 kapsamında seçilen performans hedefi ve güçlendirme projesinin yerine geçmez.",checks:["İşin hukuki ve teknik amacını başlangıçta tanımlayın.","Kullanılacak veri toplama ve hesap yöntemini doğru dokümandan seçin.","Rapor başlığında yöntemi ve kapsamı açıkça belirtin."],keywords:["riskli yapı","Bölüm 15","performans analizi"]},{slug:"mevcut-bina-bilgi-duzeyleri",title:"Mevcut Binalarda Bilgi Düzeylerinin Belirlenmesi",description:"Proje belgesi, saha ölçümü ve malzeme verisinin bilgi düzeyine etkisini açıklar.",seriesId:"mevcut-guclendirme",decision:"Bilgi düzeyi, yalnız elde proje olup olmamasına göre değil, taşıyıcı sistem ve malzeme bilgilerinin sahada doğrulanma kapsamına göre seçilir.",checks:["Mevcut proje ve ruhsat belgelerinin güvenilirliğini inceleyin.","Geometri ve donatı tespit kapsamını yönetmelikle eşleştirin.","Bilgi düzeyi katsayısını hesap modelinde belgeleyin."],keywords:["bilgi düzeyi","mevcut bina","rölöve"]},{slug:"mevcut-bina-tasiyici-rolove-hasar-belgeleme",title:"Taşıyıcı Sistem Rölövesi ve Hasar Belgeleme",description:"Kolon, kiriş, perde ve döşemelerin mevcut durumunun ölçülerek modele aktarılmasını açıklar.",seriesId:"mevcut-guclendirme",decision:"Mimari rölöve taşıyıcı sistem rölövesinin yerine geçmez; kesitler, aks kaçıklıkları, boşluklar ve hasarlar ayrı kaydedilir.",checks:["Tüm katlarda eleman boyutlarını ve aks konumlarını ölçün.","Sonradan açılan boşluk ve kaldırılan elemanları işaretleyin.","Hasarı fotoğraf, kat-aks kodu ve ölçüyle ilişkilendirin."],keywords:["taşıyıcı rölöve","hasar","saha ölçümü"]},{slug:"mevcut-bina-karot-beton-dayanimi",title:"Karot Sayısı ve Mevcut Beton Dayanımının Belirlenmesi",description:"Karot yerleşimi, deney sonucu ve mevcut beton dayanımına geçiş sürecini açıklar.",seriesId:"mevcut-guclendirme",decision:"Tek bir yüksek veya düşük sonuç bina betonunu temsil etmez; numune dağılımı kat ve eleman çeşitliliğini kapsamalıdır.",checks:["Karot sayısını bina büyüklüğü ve bilgi düzeyine göre belirleyin.","Donatıya ve kritik hasarlı bölgeye zarar vermeyen numune yeri seçin.","Deney sonuçlarını boyut ve narinlik düzeltmeleriyle değerlendirin."],keywords:["karot","beton dayanımı","mevcut bina"]},{slug:"mevcut-bina-donati-tespiti-korozyon",title:"Donatı Tespiti, Sıyırma, Numune ve Korozyon İncelemesi",description:"Mevcut elemanlarda donatı adedi, çapı, yerleşimi ve malzeme durumunun belirlenmesini açıklar.",seriesId:"mevcut-guclendirme",decision:"Tarama cihazı sonucu seçili sıyırmalarla doğrulanmalı; korozyon ve aderans kaybı yalnız çap bilgisiyle temsil edilmemelidir.",checks:["Tarama ve sıyırma noktalarını kat/eleman bazında dağıtın.","Boyuna donatı ile enine donatıyı ayrı kaydedin.","Korozyon, kesit kaybı ve pas payı durumunu fotoğraflayın."],keywords:["donatı tespiti","sıyırma","korozyon"]},{slug:"mevcut-bina-beklenen-dayanim-bilgi-katsayisi",title:"Beklenen Malzeme Dayanımları ve Bilgi Katsayıları",description:"Mevcut yapı analizinde deney sonuçlarının beklenen dayanımlara ve kapasite hesabına nasıl girdiğini açıklar.",seriesId:"mevcut-guclendirme",decision:"Yeni bina tasarımındaki karakteristik-tasarım dayanımı yaklaşımı mevcut bina değerlendirmesine doğrudan taşınmamalıdır.",checks:["Beton ve çelik için kullanılacak beklenen dayanımı ayrı belirleyin.","Bilgi düzeyi katsayısını eleman kapasitesine doğru uygulayın.","Malzeme kabullerini deney raporlarıyla izlenebilir kılın."],keywords:["beklenen dayanım","bilgi katsayısı","malzeme"]},{slug:"mevcut-bina-sunek-gevrek-hasar-siniflamasi",title:"Sünek ve Gevrek Eleman Davranışlarının Ayrılması",description:"Mevcut elemanların şekil değiştirme veya kuvvet kontrollü davranış olarak sınıflandırılmasını açıklar.",seriesId:"mevcut-guclendirme",decision:"Kesme gibi gevrek davranışlar, eğilme plastikleşmesi için kullanılan hasar sınırlarıyla kabul edilemez.",checks:["Elemanın baskın davranış türünü kapasite sonuçlarıyla belirleyin.","Kesme güvenliği yetersiz elemanları ayrı işaretleyin.","Şekil değiştirme taleplerini doğru performans sınırıyla karşılaştırın."],keywords:["sünek davranış","gevrek davranış","hasar sınırı"]},{slug:"mevcut-bina-dogrusal-degerlendirme-sinirlari",title:"Doğrusal Değerlendirme Yönteminin Uygulanma Sınırları",description:"Mevcut binada doğrusal yöntemin seçilme şartlarını ve talep-kapasite değerlendirmesini açıklar.",seriesId:"mevcut-guclendirme",decision:"Yapının düzensizliği ve doğrusal olmayan davranış yaygınlığı arttıkça doğrusal kabul sonuçları temsil etmeyebilir.",checks:["Yöntemin bina ve sistem için uygulanabilirliğini doğrulayın.","Eleman talep-kapasite oranlarını doğru iç kuvvetlerle üretin.","Yöntem sınırı aşılıyorsa doğrusal olmayan değerlendirmeye geçin."],keywords:["doğrusal değerlendirme","talep kapasite","mevcut bina"]},{slug:"guclendirme-betonarme-perde-eklenmesi",title:"Mevcut Binaya Betonarme Perde Eklenmesi",description:"Yeni perdelerin plandaki yeri, mevcut döşemeyle bağlantısı ve temel aktarımını açıklar.",seriesId:"mevcut-guclendirme",decision:"Perde eklemek yalnız yatay kapasiteyi artırmaz; rijitlik merkezini, kat kuvvet dağılımını ve temel taleplerini değiştirir.",checks:["Perdeleri burulmayı artırmayacak dengeli konumlara yerleştirin.","Döşeme toplayıcıları ve eski-yeni beton bağlantısını tasarlayın.","Yeni perde yüklerini karşılayacak temel çözümünü birlikte geliştirin."],keywords:["perde ekleme","güçlendirme","toplayıcı"]},{slug:"guclendirme-temel-sistemi-yuk-aktarimi",title:"Güçlendirmede Temel Sistemi ve Yük Aktarımının Yeniden Düzenlenmesi",description:"Üstyapı güçlendirmesinin mevcut temel, zemin basıncı ve bağlantı detaylarına etkisini açıklar.",seriesId:"mevcut-guclendirme",decision:"Kolon mantolaması veya perde eklenmesiyle büyüyen kuvvetler mevcut temele güvenli biçimde aktarılmadan sistem güçlendirilmiş sayılmaz.",checks:["Güçlendirme öncesi ve sonrası temel tepkilerini karşılaştırın.","Mevcut temel geometrisi ve donatısını sahada doğrulayın.","Yeni temel parçalarının ankraj, kesme sürtünmesi ve oturma uyumunu çözün."],keywords:["temel güçlendirme","yük aktarımı","ankraj"]},{slug:"zemin-temel-etudu-rapor-kategorileri",title:"Zemin ve Temel Etüdü Tebliği Rapor Kategorileri",description:"Yapı ve zemin koşullarına göre etüt kategorisinin ve rapor kapsamının nasıl belirlendiğini açıklar.",seriesId:"su-zemin",decision:"Sondaj sayısı gibi tek bir girdiden önce yapı özellikleri, komşu yapılar ve geoteknik risklere göre rapor kategorisi seçilmelidir.",checks:["Yapı yüksekliği, bodrum ve komşu yapı koşullarını tanımlayın.","Şev, sıvılaşma ve özel zemin risklerini tarayın.","Kategoriye uygun arazi ve laboratuvar programını raporda doğrulayın."],keywords:["zemin etüdü","rapor kategorisi","tebliğ"]},{slug:"zemin-raporu-verilerinin-yapi-modeline-aktarimi",title:"Zemin Raporundaki Verilerin Taşıyıcı Sistem Modeline Aktarılması",description:"Yerel zemin sınıfı, yatak katsayısı ve temel parametrelerinin statik modele aktarılmasını açıklar.",seriesId:"su-zemin",decision:"Rapor verisi kopyalanmadan önce parametrenin servis, taşıma gücü veya deprem hesabına ait olup olmadığı ayrılmalıdır.",checks:["ZA–ZF sınıfı ile spektrum parametrelerini eşleştirin.","Karakteristik ve tasarım zemin parametrelerini ayırın.","Yatak katsayısını temel boyutu ve model yaklaşımıyla uyumlu kullanın."],keywords:["zemin raporu","yatak katsayısı","yerel zemin sınıfı"]},{slug:"temel-tasima-gucu-oturma-kontrolu",title:"Yüzeysel Temellerde Taşıma Gücü ve Oturma Kontrolü",description:"Zemin göçmesi ile toplam/farklı oturma kontrollerinin ayrı tasarım durumları olduğunu açıklar.",seriesId:"su-zemin",decision:"Taşıma gücü yeterli bir temel, servis yüklerinde kabul edilemez farklı oturma yapabilir; iki kontrol birbirinin yerine geçmez.",checks:["Tasarım yükleriyle taşıma gücü sınır durumunu kontrol edin.","Servis yükleriyle toplam ve farklı oturmayı hesaplayın.","Temel rijitliği ile üstyapı hassasiyetini birlikte değerlendirin."],keywords:["taşıma gücü","oturma","yüzeysel temel"]},{slug:"temel-kayma-devrilme-guvenligi",title:"Temellerde Kayma ve Devrilme Güvenliği",description:"Yatay deprem yükleri altında temel tabanındaki kayma ve bileşke konumu kontrollerini açıklar.",seriesId:"su-zemin",decision:"Yatay reaksiyonları yalnız düşey taşıma gücü kontrolü içinde bırakmak taban sürtünmesi ve devrilme riskini görünmez kılar.",checks:["Temel tabanındaki yatay ve düşey bileşkeyi çıkarın.","Sürtünme ve izin verilen pasif direnç kabullerini raporla eşleştirin.","Temas alanı ve taban basıncı dağılımını devrilmeyle birlikte kontrol edin."],keywords:["temel kayması","devrilme","taban sürtünmesi"]},{slug:"radye-temel-zemin-yayi-yatak-katsayisi",title:"Radye Temellerde Zemin Yayı ve Yatak Katsayısı Seçimi",description:"Radye modelinde yayların alan, ağ ve zemin davranışıyla uyumlu tanımlanmasını açıklar.",seriesId:"su-zemin",decision:"Tek bir yatak katsayısını düğüm yayına doğrudan girmek ağ sıklaştıkça toplam zemin rijitliğini değiştirebilir.",checks:["Alan katsayısını düğüm veya eleman alanıyla tutarlı dönüştürün.","Çekme taşımayan zemin kabulünü gerekiyorsa tanımlayın.","Temas basıncı ve oturma sonuçlarını geoteknik raporla karşılaştırın."],keywords:["radye","zemin yayı","yatak katsayısı"]},{slug:"bodrum-perdesi-statik-dinamik-zemin-basinci",title:"Bodrum Perdelerinde Statik ve Dinamik Zemin Basınçları",description:"Bodrum çevre perdelerinde toprak, su ve deprem etkilerinin birlikte ele alınmasını açıklar.",seriesId:"su-zemin",decision:"Sükûnet, aktif veya dinamik basınç seçimi perdenin hareket imkânına bağlıdır; bina bodrum perdesi serbest istinat duvarı gibi kabul edilmemelidir.",checks:["Perdenin mesnet ve hareket koşuluna uygun basınç modelini seçin.","Yeraltı suyu ve drenaj arızası durumunu ayrı yükleyin.","Dinamik zemin basıncını deprem birleşimleriyle eşleştirin."],keywords:["bodrum perdesi","zemin basıncı","yeraltı suyu"]},{slug:"yapi-denetimi-statik-proje-kontrolu",title:"4708 Kapsamında Betonarme Statik Proje Kontrolü",description:"Statik projenin mimari, zemin raporu, hesap modeli ve uygulama paftalarıyla tutarlılık kontrolünü açıklar.",seriesId:"yapi-denetimi",decision:"Kontrol yalnız hesap raporunun onaylanması değil, bütün proje belgelerinde aynı taşıyıcı sistem kararının izlenmesidir.",checks:["Aks, kot ve taşıyıcı elemanları mimari projeyle karşılaştırın.","Zemin parametrelerinin hesap modeline doğru geçtiğini doğrulayın.","Hesap donatısı ile uygulama paftalarını eleman bazında eşleştirin."],keywords:["4708","statik proje kontrolü","yapı denetimi"]},{slug:"yapi-denetimi-betonarme-uygulama-cizimleri",title:"Betonarme Uygulama Çizimlerinde Bulunması Gereken Detaylar",description:"Kalıp, donatı, kesit ve birleşim paftalarında uygulamacının ihtiyaç duyduğu temel bilgileri listeler.",seriesId:"yapi-denetimi",decision:"Hesapta doğru olan donatı, paftada çap, adet, aralık, boy ve konumuyla açık gösterilmezse sahada doğrulanamaz.",checks:["Kalıp planlarında aks, kot ve kesitleri eksiksiz gösterin.","Kolon, kiriş ve perde açılımlarında bindirme/sarılma bölgelerini ölçülendirin.","Temel filizleri ile üstyapı donatı devamını detaylarda bağlayın."],keywords:["uygulama çizimi","donatı paftası","kalıp planı"]},{slug:"yapi-denetimi-dokum-oncesi-kalip-donati",title:"Beton Dökümü Öncesi Kalıp ve Donatı Kontrolü",description:"Döküm izni verilmeden önce geometri, pas payı, donatı ve gömülü eleman kontrollerini açıklar.",seriesId:"yapi-denetimi",decision:"Betondan sonra erişilemeyecek her unsur döküm öncesi kayıt altına alınmalı; uygunsuzluk kapatılmadan döküm başlatılmamalıdır.",checks:["Kesit, aks, kot ve kalıp stabilitesini ölçün.","Donatı çap/adet/aralık, bindirme ve pas payını kontrol edin.","Tesisat geçişleri, ankrajlar ve filizleri fotoğraflı tutanağa bağlayın."],keywords:["beton dökümü","donatı kontrolü","kalıp"]},{slug:"yapi-denetimi-beton-tanimlama-en206-ts13515",title:"TS EN 206+A2 ve TS 13515'e Göre Beton Tanımlama",description:"Beton sınıfının yanında çevresel etki, kıvam, agrega ve klorür gibi sipariş bilgilerinin önemini açıklar.",seriesId:"yapi-denetimi",decision:"Yalnız C sınıfı yazmak betonun durabilite ve uygulama gereksinimlerini tanımlamaz; proje ve irsaliye tam tarifle eşleşmelidir.",checks:["Dayanım ve çevresel etki sınıflarını proje koşullarına göre seçin.","Kıvam, en büyük agrega ve klorür sınıfını belirtin.","Santral irsaliyesini sipariş ve döküm elemanıyla eşleştirin."],keywords:["TS EN 206+A2","TS 13515","beton sınıfı"]},{slug:"yapi-denetimi-ebis-beton-numunesi-kabul",title:"Taze Beton Numunesi, EBİS ve 7/28 Günlük Kabul Süreci",description:"Numune alma, kimliklendirme, kür ve basınç sonuçlarının izlenebilir kabul akışını açıklar.",seriesId:"yapi-denetimi",decision:"Numune sonucu ancak doğru döküm, doğru takım ve kesintisiz kimlik zinciriyle ilişkilendirildiğinde yapı denetimi açısından anlamlıdır.",checks:["Numuneyi ilgili döküm ve beton irsaliyesiyle eşleştirin.","EBİS kimliği, kalıp alma ve laboratuvar teslim kayıtlarını kontrol edin.","7 günlük erken izleme ile 28 günlük kabul sonucunu ayırın."],keywords:["EBİS","beton numunesi","28 gün"]},{slug:"yapi-denetimi-dusuk-beton-dayanimi-karot",title:"Düşük Beton Dayanımında Uygunsuzluk ve Karot Süreci",description:"Standart numune sonucu yetersiz olduğunda kayıt incelemesinden karot değerlendirmesine uzanan süreci açıklar.",seriesId:"yapi-denetimi",decision:"Tek bir düşük küp sonucu doğrudan yıkım veya kabul kararı değildir; takım sonuçları, üretim kayıtları ve yerindeki inceleme birlikte yürütülür.",checks:["Numune takımını ve istatistiksel kabul ölçütlerini doğrulayın.","Aynı betonla dökülen elemanları ve üretim kayıtlarını belirleyin.","Karot planını taşıyıcı eleman güvenliğini koruyacak şekilde hazırlayın."],keywords:["düşük beton dayanımı","karot","uygunsuzluk"]},{slug:"yapi-denetimi-ts708-donati-celigi-kabul",title:"TS 708 Donatı Çeliği Belgesi ve Şantiye Kabul Kontrolü",description:"Donatı çeliğinin sınıf, nervür, etiket, belge ve gerektiğinde deney üzerinden kabulünü açıklar.",seriesId:"yapi-denetimi",decision:"Çap ölçüsünün uygun olması malzeme sınıfının ve süneklik özelliklerinin doğrulandığı anlamına gelmez.",checks:["Etiket, üretici, döküm/parti ve uygunluk belgesini kaydedin.","Çelik sınıfını statik proje notlarıyla eşleştirin.","Şüpheli partileri ayırarak çekme-bükme deney sürecini başlatın."],keywords:["TS 708","donatı çeliği","malzeme kabulü"]},{slug:"yapi-denetimi-en13670-yerlestirme-kur-tolerans",title:"TS EN 13670'e Göre Yerleştirme, Tolerans ve Kür Kontrolleri",description:"Betonun yerleştirilmesi, sıkıştırılması, sıcak-soğuk hava önlemleri ve geometrik toleransları ele alır.",seriesId:"yapi-denetimi",decision:"Uygun beton sınıfı tek başına yeterli değildir; yerleştirme ve erken yaş bakımı nihai dayanım ile durabiliteyi belirler.",checks:["Döküm hızı, tabaka kalınlığı ve vibrasyon planını uygulayın.","Hava koşullarına göre yüzey koruma ve kür süresini belirleyin.","Kalıp sökümü sonrası kesit, düşeylik ve kot toleranslarını ölçün."],keywords:["TS EN 13670","kür","beton yerleştirme"]}],g=new Map;for(let a of f){let b=g.get(a.seriesId)??[];b.push(a),g.set(a.seriesId,b)}let h=f.map(a=>{let b,c,d,f=g.get(a.seriesId)??[],h=f.findIndex(b=>b.slug===a.slug),i=[1,2,3].map(a=>f[(h+a)%f.length]?.slug).filter(b=>!!(b&&b!==a.slug));return b=e[a.seriesId],{slug:a.slug,title:a.title,description:a.description,seoTitle:`${a.title} | M\xfchendis Mimar Portalı`,seoDescription:a.description,sectionId:"deprem-yonetmelik",seriesId:a.seriesId,regulationStatus:"tbdy-uygulama-esaslari-taslak-statusu"===a.slug?"draft":"ts500"===a.seriesId?"standard":"in-force",category:b.category,categoryColor:b.color,badgeLabel:"tbdy-uygulama-esaslari-taslak-statusu"===a.slug?"Taslak — yürürlükte değil":b.badge,author:"Mühendis Mimar Portalı",authorTitle:"Teknik İçerik Ekibi",date:"11 Ağustos 2026",updatedAt:"11 Ağustos 2026",readTime:"3 dk",image:"/covers/yonetmelik.svg",sections:[{id:"kapsam-ve-karar",title:"Kapsam ve karar",content:`${a.description}

${a.decision}`,subsections:[]},{id:"proje-kontrol-sirasi",title:"Proje kontrol sırası",content:a.checks.map(a=>`- ${a}`).join("\n"),subsections:[]},{id:"dayanak",title:"Mevzuat dayanağı",content:`Bu başlık i\xe7in ana dayanak **${b.sourceLabel}** kaynağıdır. Hesap raporunda kullanılan madde, s\xfcr\xfcm ve proje kabul\xfc a\xe7ık bi\xe7imde belirtilmelidir. Sayfanın altındaki kaynak bağlantısı resm\xee metne erişim sağlar.`,subsections:[]}],relatedSlugs:i,keywords:Array.from(new Set([...a.keywords,b.badge,"betonarme"])),tags:a.keywords,references:(d=[{label:(c=e[a.seriesId]).sourceLabel,href:c.sourceHref,note:"Madde, tablo ve yürürlük bilgisi proje tarihinde resmî kaynaktan doğrulanmalıdır."}],"tbdy"===a.seriesId&&d.push({label:"AFAD — Türkiye Bina Deprem Yönetmeliği sayfası",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"}),"mevcut-guclendirme"===a.seriesId&&a.slug.includes("riskli-yapi")&&d.push({label:"Riskli Yapıların Tespit Edilmesine İlişkin Esaslar",href:"https://webdosya.csb.gov.tr/db/altyapi/icerikler/r-skl--yapilarin-tesp-t-ed-lmes-ne-il-sk-n-esaslar-20190218134628.pdf"}),"tbdy-uygulama-esaslari-taslak-statusu"===a.slug&&d.push({label:"İMO — Yeni TBDY tebliği hakkındaki duyuru",href:"https://obs.imo.org.tr/bulten/news/3812/sosyal-mecralarda-yer-alan-yeni-tbdy-tebligi-hakkinda-duyuru/144309"}),"yapi-denetimi-ebis-beton-numunesi-kabul"===a.slug&&d.push({label:"ÇŞİDB — Taze beton numunesine ilişkin 2022/7 Genelge",href:"https://isparta.csb.gov.tr/haberler/bakanligimizca-taze-beton-okumune-ve-numune-alimina-iliskin-2022-02-nolu-genelge-revize-edilerek-2022-07-nolu-genelge-yayinlanmistir.-267988"}),d)}});if(56!==h.length)throw Error(`Deprem konu kataloğunda 56 yerine ${h.length} i\xe7erik bulundu.`);let i="https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf",j={"kisa-kolon-etkisi-tbdy-2018":"Kısa Kolon Etkisi: Neden Tehlikelidir ve Nasıl Önlenir?","tbdy-tasarim-spektrumu-cizimi":"Tasarım Spektrumu Nasıl Çizilir?","tbdy-mod-birlesim-srss-cqc":"Mod Birleşim Yöntemleri: SRSS ve CQC Karşılaştırması","turkiyede-tarihsel-depremler-ve-yonetmelik-evrimi":"Türkiye'de Tarihsel Depremler ve Yönetmelik Evrimi","1999-marmara-depreminden-cikarilan-muhendislik-dersleri":"1999 Marmara Depremi'nden Çıkarılan Mühendislik Dersleri","betonarme-perde-tasarimi-depremde-tip-ve-boyutlandirma-kurallari":"Betonarme Perde Tasarımı: Tip ve Boyutlandırma Kuralları","duzensiz-binalarda-dinamik-analiz-zorunlulugu":"Düzensiz Binalarda Dinamik Analiz Zorunluluğu","deprem-yuku-ile-ruzgar-yuku-kombinasyonu":"Deprem Yükü ile Rüzgâr Yükünün Birlikte Değerlendirilmesi","mevcut-binalarin-deprem-guvenligi-nasil-degerlendirilir":"Mevcut Binaların Deprem Güvenliği Nasıl Değerlendirilir?","kolon-guclendirme-yontemleri-cfrp-ve-beton-mantolu":"Kolon Güçlendirme Yöntemleri: CFRP ve Beton Mantolama","hasarli-bina-tespiti-yesil-sari-kirmizi-etiket-sistemi":"Deprem Sonrası Hızlı Hasar Tespiti ve Etiket Sistemi","deprem-sigortasi-dask-ve-muhendislik-baglantisi":"Deprem Sigortası ile Yapısal Güvenlik Arasındaki Fark","yatay-yuk-tasima-sistemleri-cerceve-perde-cekirdek":"Yatay Yük Taşıma Sistemleri: Çerçeve, Perde ve Çekirdek","byy-bina-kullanim-siniflari-tehlike-kategorileri":"Bina Kullanım Sınıfları ve Yangın Tehlike Kategorileri","yangin-bolmesi-koridoru-kacis-yolu-boyutlandirma":"Yangın Bölmesi, Koridor ve Kaçış Yolu Boyutlandırması","tasiyici-sistemlerin-yangina-dayanim-suresi-r30-r60-r90-r120":"Taşıyıcı Sistemlerin Yangına Dayanım Süresi: R30–R120","sprinkler-sistemi-zorunluluk-sinirlari":"Sprinkler Sistemi Zorunluluk Sınırları","duman-tahliyesi-mekanik-ve-dogal-sistemler":"Duman Tahliyesi: Mekanik ve Doğal Sistemler","kacis-merdiveni-tasarim-kriterleri":"Kaçış Merdiveni Tasarım Kriterleri","yangin-kapisi-dosleme-duvar-gecis-detaylari":"Yangın Kapısı ile Döşeme ve Duvar Geçiş Detayları","yangin-algilama-ve-ihbar-sistemi-gereksinimleri":"Yangın Algılama ve İhbar Sistemi Gereksinimleri","yuksek-binalarda-ozel-yangin-onlemleri-bolum-9":"Yüksek Binalarda Özel Yangın Önlemleri","bodrum-otopark-mutfak-yangin-uygulamalari":"Bodrum, Otopark ve Mutfaklarda Yangın Uygulamaları","otopark-kullanim-turune-gore-minimum-alan-hesabi":"Kullanım Türüne Göre Minimum Otopark Alanı","otopark-rampa-egimi-genislik-donus-yaricapi":"Otopark Rampası: Eğim, Genişlik ve Dönüş Yarıçapı","otopark-kapali-havalandirma-co-konsantrasyonu":"Kapalı Otoparklarda Havalandırma ve CO Kontrolü","otopark-yapisal-yuk-kombinasyonlari-arac-deprem":"Otoparklarda Araç ve Deprem Yükü Birleşimleri","otopark-elektrikli-arac-sarj-mevzuati":"Otoparklarda Elektrikli Araç Şarj Mevzuatı","imar-taks-kaks-emsal-hesabi":"TAKS, KAKS ve Emsal Hesabı","imar-kat-yuksekligi-bina-yuksekligi-farki":"Kat Yüksekliği ile Bina Yüksekliği Arasındaki Fark","imar-bahce-mesafeleri-on-arka-yan-bahce-kurallari":"Ön, Arka ve Yan Bahçe Mesafeleri","imar-bodrum-kat-mevzuati-teknik-hacim-iskan-taban-alani":"Bodrum Katlarda Teknik Hacim, İskân ve Taban Alanı","imar-cekme-kat-asma-kat-kosullari":"Çekme Kat ve Asma Kat Koşulları","imar-balkon-cikma-sacak-emsal-disi-sartlari":"Balkon, Çıkma ve Saçakların Emsal Dışı Kalma Koşulları","imar-ruhsat-sureci-basvurudan-iskan-kadar":"Başvurudan İskâna Yapı Ruhsatı Süreci","imar-parsel-tevhid-ifraz-prosedurleri":"Parsel Tevhit ve İfraz Prosedürleri","imar-plan-notu-celiskisi-uygulama-onceligi":"Plan Notu Çelişkilerinde Uygulama Önceliği","bep-isi-yalitim-u-degeri-yogusma-kontrolu":"Isı Yalıtımında U Değeri ve Yoğuşma Kontrolü","bep-ts-825-yontemi-isi-kaybi-hesabi":"TS 825 Yöntemiyle Isı Kaybı Hesabı","bep-enerji-kimlik-belgesi-a-g-siniflandirma":"Enerji Kimlik Belgesi: A–G Sınıflandırması","bep-yenilenebilir-enerji-zorunlulugu-1000m2":"Binalarda Yenilenebilir Enerji Zorunluluğu","bep-yazilimi-hesaplama-akisi":"BEP-TR Yazılımında Hesaplama Akışı","bep-isil-kopru-detaylari-ve-cozum-yontemleri":"Isıl Köprü Detayları ve Çözüm Yöntemleri","zemin-etudu-minimum-sondaj-sayisi-ve-derinligi":"Zemin Etüdünde Sondaj Sayısı ve Derinliği","tbdy-bolum-16-zemin-yapi-etkilesimi":"TBDY Bölüm 16: Zemin-Yapı Etkileşimi","zemin-sivlasma-riski-degerlendirmesi":"Zemin Sıvılaşma Riskinin Değerlendirilmesi","su-yalitimi-ts-4749-uygulama-detaylari":"Su Yalıtımı ve Uygulama Detayları","yagmur-suyu-drenaji-ve-sizma-tesisi-hesabi":"Yağmur Suyu Drenajı ve Sızdırma Tesisi Hesabı","engelsiz-tekerlekli-sandalye-manevra-alani-koridor-genislikleri":"Tekerlekli Sandalye Manevra Alanı ve Koridor Genişlikleri","engelsiz-rampa-egimi-korkuluk-yuzey-standartlari":"Engelsiz Rampalarda Eğim, Korkuluk ve Yüzey Standartları","engelsiz-wc-asansor-kapi-boyutlari":"Engelsiz WC, Asansör ve Kapı Boyutları","engelsiz-yapi-ruhsatinda-uyum-kontrolu":"Yapı Ruhsatında Erişilebilirlik Uyum Kontrolü","eurocode-ts-en-1990-yuk-kombinasyonlari-ve-guvenlik-katsayilari":"TS EN 1990: Yük Birleşimleri ve Güvenlik Katsayıları","eurocode-ts-en-1991-1-1-hareketli-yukler-bolume-gore-degerler":"TS EN 1991-1-1: Kullanım Alanlarına Göre Hareketli Yükler","eurocode-ts-en-1991-1-3-kar-yuku-hesabi-bolge-haritasi-ile":"TS EN 1991-1-3: Kar Yükü Hesabı","eurocode-ts-en-1991-1-4-ruzgar-yuku-hesabi-turkiye-bolgeleri":"TS EN 1991-1-4: Rüzgâr Yükü Hesabı","eurocode-ts-en-1992-1-1-ec2-ts-500-ile-karsilastirmali-analiz":"TS EN 1992-1-1 ile TS 500'ün Karşılaştırılması","akustik-ts-en-iso-12354-ile-yalitim-hesabi":"TS EN ISO 12354 ile Ses Yalıtımı Hesabı","asansor-boslugu-boyutlandirma-kapasite-alan-tablosu":"Asansör Kuyusu Boyutlandırması ve Kapasite","asansor-makine-daireli-ve-dairesiz-sistemler":"Makine Daireli ve Makine Dairesiz Asansörler","asansor-guvenlik-aksesuarlari-ve-periyodik-bakim-zorunlulugu":"Asansör Güvenlik Aksesuarları ve Periyodik Bakım","asansor-deprem-sirasinda-otomatik-park-ozelligi":"Deprem Sırasında Asansör Otomatik Park Özelliği","isg-santiye-guvenlik-plani-zorunlu-icerik":"Şantiye Güvenlik Planının Zorunlu İçeriği","isg-uzmani-gorevlendirme-tehlike-sinifi-isci-sayisi":"İSG Uzmanı Görevlendirme Koşulları","isg-yuksekte-calisma-ve-iskele-guvenligi":"Yüksekte Çalışma ve İskele Güvenliği","isg-kazi-guvenligi-iksa-tasarimi-ve-kontrol":"Kazı Güvenliği, İksa Tasarımı ve Kontrolü","isg-beton-dokumunde-topraklama-ve-elektrik-guvenligi":"Beton Dökümünde Topraklama ve Elektrik Güvenliği","cevre-ced-zorunlulugu-proje-buyuklugu-esikleri":"ÇED Zorunluluğu ve Proje Eşikleri","cevre-insaat-atigi-yonetimi-yonetmeligi":"İnşaat ve Yıkıntı Atıklarının Yönetimi","cevre-gurultu-ve-toz-santiye-yukumlulukleri":"Şantiyede Gürültü ve Toz Yükümlülükleri","cevre-yagmur-suyu-kirliligi-ve-santiye-filtrasyonu":"Şantiye Yağmur Suyu Kirliliği ve Filtrasyon"},k={tbdy:{category:"TBDY 2018 Rehberi",color:"bg-red-600 text-white",badge:"TBDY 2018",description:"TBDY 2018 kapsamındaki analiz, sistem ve deprem tasarımı kararlarını açıklar.",checks:["Kullanılan yönetmelik maddesini ve proje kabulünü belirleyin.","Hesap modeli ile uygulama projesinin aynı kararı yansıttığını doğrulayın.","Sonucu ilgili sınır ve yük birleşimleriyle kontrol edin."],source:{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:i}},"tbdy-betonarme":{category:"TBDY Betonarme Detayları",color:"bg-orange-600 text-white",badge:"TBDY Bölüm 7",description:"Betonarme elemanın deprem davranışı ve detaylandırma gereklerini ele alır.",checks:["Eleman geometrisini ve iç kuvvetlerini doğrulayın.","Süneklik ve kapasite tasarımı koşullarını kontrol edin.","Donatı detayını hesapla ve birleşen elemanlarla eşleştirin."],source:{label:"AFAD — TBDY 2018, Bölüm 7",href:i}},ts500:{category:"TS 500 Betonarme",color:"bg-blue-600 text-white",badge:"TS 500",description:"Betonarme taşıma gücü, kullanılabilirlik ve donatı hesabındaki temel kontrolleri açıklar.",checks:["Tasarım kuvvetini doğru yük birleşiminden alın.","Kesit kapasitesi ve minimum-maksimum donatı sınırlarını kontrol edin.","Hesap donatısını uygulanabilir pafta detayına dönüştürün."],source:{label:"ÇŞİDB — Betonarme İşleri Genel Teknik Şartnamesi",href:"https://webdosya.csb.gov.tr/db/yfk/icerikler/c18---betonarme-isler--20190412161656.pdf"}},"mevcut-guclendirme":{category:"Mevcut Binalar ve Güçlendirme",color:"bg-fuchsia-700 text-white",badge:"TBDY Bölüm 15",description:"Mevcut binanın veri toplama, performans ve güçlendirme sürecini açıklar.",checks:["Geometri ve malzeme verisini sahada doğrulayın.","Değerlendirme yöntemini amaç ve bilgi düzeyine göre seçin.","Güçlendirme kararını temel dahil bütün yük yoluyla kontrol edin."],source:{label:"AFAD — TBDY 2018, Bölüm 15",href:i}},"yapi-denetimi":{category:"Yapı Denetimi ve Malzeme",color:"bg-amber-600 text-zinc-950",badge:"Saha Kontrolü",description:"Proje, malzeme ve uygulama kontrollerini yapı denetimi süreci içinde ele alır.",checks:["Belge ile sahadaki imalatı eşleştirin.","Uygunsuzluğu döküm veya kapatma öncesi kayıt altına alın.","Kabul sonucunu parti, eleman ve deney kaydıyla izlenebilir tutun."],source:{label:"ÇŞİDB — Yapı Denetimi Mevzuatı",href:"https://yapiisleri.csb.gov.tr/yapi-denetimi-daire-baskanligi-mevzuati-90235"}},yangin:{category:"Yangın Yönetmeliği",color:"bg-orange-700 text-white",badge:"Yangın",description:"Yangın güvenliği kararını kullanım, kaçış ve koruma sistemi açısından özetler.",checks:["Bina kullanım ve tehlike sınıfını belirleyin.","Kaçış ve kompartıman sürekliliğini kontrol edin.","Mimari, mekanik ve taşıyıcı sistem kararlarını birlikte doğrulayın."],source:{label:"ÇŞİDB — Mesleki Hizmetler Genel Müdürlüğü",href:"https://meslekihizmetler.csb.gov.tr/"}},otopark:{category:"Otopark Yönetmeliği",color:"bg-slate-700 text-white",badge:"Otopark",description:"Otopark planlama, dolaşım ve teknik sistem koşullarını özetler.",checks:["Kullanım türü ve araç kapasitesini belirleyin.","Rampa, dönüş ve dolaşım geometrisini kontrol edin.","Havalandırma, yangın ve taşıyıcı yükleri projeler arasında eşleştirin."],source:{label:"ÇŞİDB — Mesleki Hizmetler Genel Müdürlüğü",href:"https://meslekihizmetler.csb.gov.tr/"}},imar:{category:"İmar Mevzuatı",color:"bg-emerald-700 text-white",badge:"İmar",description:"Planlı alanlardaki yapılaşma ve ruhsat kararlarını uygulanabilir biçimde özetler.",checks:["Plan, plan notu ve yönetmelik sırasını doğrulayın.","Parsel ve yapı ölçülerini güncel belge üzerinden hesaplayın.","Kararı ruhsat eki projelerin tamamında tutarlı gösterin."],source:{label:"ÇŞİDB — Mesleki Hizmetler Genel Müdürlüğü",href:"https://meslekihizmetler.csb.gov.tr/"}},bep:{category:"BEP-TR / TS 825",color:"bg-lime-600 text-zinc-950",badge:"Enerji",description:"Bina kabuğu ve enerji performansı hesabındaki temel kararları açıklar.",checks:["İklim ve kullanım verisini doğrulayın.","Kabuk katmanları ile hesap girdilerini eşleştirin.","Isı köprüsü, yoğuşma ve belge sonucunu birlikte kontrol edin."],source:{label:"ÇŞİDB — Mesleki Hizmetler Genel Müdürlüğü",href:"https://meslekihizmetler.csb.gov.tr/"}},"su-zemin":{category:"Zemin, Temel ve Su",color:"bg-cyan-700 text-white",badge:"Zemin ve Temel",description:"Zemin, temel, drenaj ve su etkilerine ilişkin proje kararlarını açıklar.",checks:["Arazi ve rapor verisini proje yeriyle doğrulayın.","Geoteknik parametreyi doğru sınır durumda kullanın.","Üstyapı, temel ve su kontrolü arasındaki veri aktarımını denetleyin."],source:{label:"ÇŞİDB — Zemin ve Temel Etüdü Tebliği",href:"https://bartin.csb.gov.tr/zemin-ve-temel-etudu-uygulama-esaslari-ve-rapor-formatina-dair-teblig-yayimlandi-haber-238675"}},engelsiz:{category:"Engelsiz Tasarım",color:"bg-violet-700 text-white",badge:"Erişilebilirlik",description:"Erişilebilir dolaşım ve mekân ölçülerini proje kontrolü açısından özetler.",checks:["Kesintisiz erişilebilir güzergâhı plan üzerinde izleyin.","Net ölçüleri kapı kanadı ve donatılarla birlikte kontrol edin.","Rampa, asansör ve ıslak hacim detaylarını kesitlerle doğrulayın."],source:{label:"ÇŞİDB — Mesleki Hizmetler Genel Müdürlüğü",href:"https://meslekihizmetler.csb.gov.tr/"}},eurocode:{category:"Eurocode Standartları",color:"bg-indigo-700 text-white",badge:"Eurocode",description:"İlgili Eurocode standardının kapsamını ve Türkiye'deki proje kullanımını açıklar.",checks:["Standardın güncel baskı ve ulusal ek durumunu doğrulayın.","Yük ve güvenlik katsayılarını seçilen standarda göre tutarlı uygulayın.","TS 500 ve TBDY ile birlikte kullanım sınırını proje raporunda belirtin."],source:{label:"Türk Standardları Enstitüsü",href:"https://www.tse.org.tr/"}},akustik:{category:"Akustik ve Gürültü",color:"bg-zinc-700 text-white",badge:"Akustik",description:"Bina elemanlarında hava ve darbe sesi performansını özetler.",checks:["Hedef performansı kullanım türüne göre belirleyin.","Duvar ve döşeme birleşimlerinden yan geçişleri kontrol edin.","Laboratuvar değeri ile yerindeki beklenen performansı ayırın."],source:{label:"ÇŞİDB — Mesleki Hizmetler Genel Müdürlüğü",href:"https://meslekihizmetler.csb.gov.tr/"}},asansor:{category:"Asansör Yönetmeliği",color:"bg-teal-700 text-white",badge:"Asansör",description:"Asansör kuyusu, güvenlik ve işletme koşullarını özetler.",checks:["Kapasite ve kullanım senaryosunu belirleyin.","Kuyu, kapı ve güvenlik boşluklarını proje üzerinden kontrol edin.","Bakım, enerji kesintisi ve acil durum işlevlerini doğrulayın."],source:{label:"Sanayi ve Teknoloji Bakanlığı",href:"https://www.sanayi.gov.tr/"}},isg:{category:"İSG ve Şantiye Güvenliği",color:"bg-amber-700 text-white",badge:"İSG",description:"Şantiye riskini iş programı, ekipman ve saha kontrolüyle birlikte ele alır.",checks:["Tehlikeyi işe başlamadan önce saha özelinde tanımlayın.","Toplu koruma, erişim ve ekipman kontrollerini belgeleyin.","Değişen iş programına göre risk değerlendirmesini güncelleyin."],source:{label:"Çalışma ve Sosyal Güvenlik Bakanlığı",href:"https://www.csgb.gov.tr/"}},cevre:{category:"Çevre Mevzuatı",color:"bg-green-700 text-white",badge:"Çevre",description:"Şantiye ve proje kaynaklı çevresel yükümlülükleri özetler.",checks:["Faaliyet ve proje eşiğini güncel mevzuattan doğrulayın.","Atık, su, toz ve gürültü akışlarını saha planında gösterin.","Taşıma, ölçüm ve bertaraf kayıtlarını izlenebilir tutun."],source:{label:"ÇŞİDB — Çevre Yönetimi Genel Müdürlüğü",href:"https://cygm.csb.gov.tr/"}}},l=[{label:"ÇŞİDB — Betonarme İşleri Genel Teknik Şartnamesi",href:"https://webdosya.csb.gov.tr/db/yfk/icerikler/c18---betonarme-isler--20190412161656.pdf",note:"Madde, tablo ve yürürlük bilgisi proje tarihinde resmî kaynaktan doğrulanmalıdır."}];function m(a){let b=a.references?[...l,...a.references]:l;return{slug:a.slug,title:a.title,description:a.description,seoTitle:a.seoTitle??`${a.title} | M\xfchendis Mimar Portalı`,seoDescription:a.seoDescription??a.description,sectionId:"deprem-yonetmelik",seriesId:"ts500",regulationStatus:"standard",category:"TS 500 Betonarme",categoryColor:"bg-blue-600 text-white",badgeLabel:"TS 500",author:"Mühendis Mimar Portalı",authorTitle:"Teknik İçerik Ekibi",date:"13 Ağustos 2026",updatedAt:"13 Ağustos 2026",readTime:a.readTime??"8 dk",image:a.image??"/covers/yonetmelik.svg",sections:a.sections,relatedSlugs:a.relatedSlugs??[],keywords:Array.from(new Set([...a.keywords,"TS 500","betonarme","TS 500 Betonarme"])),tags:a.tags??a.keywords.slice(0,5),references:b}}let n=[m({slug:"ts500-beton-sinifi-secimi",title:"Beton Sınıfı Seçimi: C20'den C35'e Doğru Tercih Kriterleri (TS 500)",description:"TS 500 ve TBDY çerçevesinde doğru beton dayanım sınıfının seçim kriterleri; çevresel etki sınıfları, taşıyıcı sistem gereksinimleri ve sık yapılan hatalar.",image:"/covers/ts500/beton-sinifi.png",readTime:"10 dk",keywords:["beton sınıfı","C25","C30","C35","fck","fcd","karakteristik dayanım","tasarım dayanımı","beton seçimi","TBDY beton"],sections:[{id:"neden-onemli",title:"Beton Sınıfı Seçimi Neden Kritiktir?",content:`Beton sınıfı se\xe7imi m\xfchendisliğin en temel kararlarından biridir. Ancak bu karar \xe7oğu zaman yanlış basitleştirilerek yapılır: "Daha y\xfcksek sınıf her zaman daha iyidir" ya da "C25 standart binadır, yeter."

Her iki yaklaşım da tek başına yetersizdir. Beton sınıfı se\xe7ilirken en az şu başlıklar **birlikte** değerlendirilmelidir:

- Y\xf6netmelik minimum sınırları (TS 500 + TBDY 2018)
- Yapının taşıyıcı sistem gereksinimleri
- Deprem tasarım koşulları
- Kolon ve perde eksenel y\xfck seviyeleri
- \xc7evresel etkilere maruz kalma (XC, XD, XS, XF, XA sınıfları)
- Servis \xf6mr\xfc hedefi
- Şantiye kalite kontrol kapasitesi
- Beton \xf6rt\xfcs\xfc ve \xe7atlak kontrol\xfc gereksinimleri

> [!IMPORTANT]
> **TBDY 2018 kapsamındaki yeni betonarme binalarda yalnızca TS 500 minimum sınırlarına bakmak yeterli değildir.** Deprem y\xf6netmeliğinin beton dayanımı ve malzeme koşulları da karşılanmalıdır. Kesin alt sınırlar i\xe7in y\xfcr\xfcrl\xfckteki TBDY 2018 metnini resmi kaynaktan doğrulayın.`,subsections:[]},{id:"tanimlar",title:"Temel Kavramlar: fck, fcd ve γmc",content:`## Beton Sınıfı Nedir?

T\xfcrkiye'de hazır beton sınıfları \xe7oğunlukla **C25/30, C30/37, C35/45** gibi silindir/k\xfcp \xe7ifti şeklinde ifade edilir.

Bu g\xf6sterimde:
- **İlk değer:** Standart silindir numunenin karakteristik basın\xe7 dayanımı (MPa)
- **İkinci değer:** Standart k\xfcp numunenin karakteristik basın\xe7 dayanımı (MPa)

TS 500 hesaplarında kullanılan **fck** değeri silindir dayanımını ifade eder (C30/37 i\xe7in fck = 30 MPa).

> [!WARNING]
> **Sık yapılan hata:** C30/37 betonun ikinci değeri olan 37 MPa'yı fck yerine kullanmak kesit kapasitesini hatalı bi\xe7imde y\xfckseltir. TS 500 form\xfcllerinde daima silindir dayanımını kullanın.

## Karakteristik Dayanım (fck)

Karakteristik dayanım, malzemenin ortalama dayanımı **değildir**. \xdcretimde ortaya \xe7ıkan doğal sa\xe7ılmayı ve istatistiksel değişkenliği dikkate alan g\xfcvenilir bir alt sınır yaklaşımıdır:

**ortalama deney sonucu ≠ karakteristik dayanım ≠ tasarım dayanımı**

## Tasarım Dayanımı (fcd)

Taşıma g\xfcc\xfc hesabında karakteristik dayanım doğrudan kullanılmaz; malzeme g\xfcvenlik katsayısıyla (γmc) b\xf6l\xfcn\xfcr:

\`\`\`
fcd = fck / γmc

Yaygın değer: γmc = 1.50 (yerinde d\xf6kme beton)
\`\`\`

Donatı \xe7eliği i\xe7in:

\`\`\`
fyd = fyk / γms

Yaygın değer: γms = 1.15
\`\`\`

## Pratik Hesap Tablosu

| fck (MPa) | fcd = fck/1.50 | 0.85\xb7fcd | fctk ≈ 0.35√fck | Ec ≈ 3250√fck+14000 |
|----------:|---------------:|---------:|----------------:|--------------------:|
| 20 | 13.33 | 11.33 | 1.57 MPa | 28 530 MPa |
| 25 | 16.67 | 14.17 | 1.75 MPa | 30 250 MPa |
| 30 | 20.00 | 17.00 | 1.92 MPa | 31 800 MPa |
| 35 | 23.33 | 19.83 | 2.07 MPa | 33 230 MPa |
| 40 | 26.67 | 22.67 | 2.21 MPa | 34 550 MPa |
| 45 | 30.00 | 25.50 | 2.35 MPa | 35 800 MPa |
| 50 | 33.33 | 28.33 | 2.47 MPa | 36 980 MPa |

> [!NOTE]
> **fcd ile 0.85\xb7fcd aynı şey değildir.** fcd = fck/γmc olarak tanımlanan tasarım basın\xe7 dayanımıdır. 0.85\xb7fcd ise eşdeğer basın\xe7 bloğu hesabında kullanılan etkin gerilme d\xfczeyidir. C30 i\xe7in: fcd = 20 MPa, 0.85\xb7fcd = 17 MPa.`,subsections:[]},{id:"c25-c30-c35-karsilastirmasi",title:"C25 – C30 – C35 Karşılaştırması",content:`## C25

**Avantajları:**
- Yaygın \xfcretim ve santral kapasitesi
- Normal bina uygulamalarında yeterli olabilecek dayanım
- Ekonomik olabilir

**Sınırlamaları:**
- Y\xfcksek eksenel y\xfckl\xfc kolonlarda b\xfcy\xfck kesit gerektirebilir
- Y\xfcksek katlı veya yoğun perdeli sistemlerde ekonomik olmayan \xe7\xf6z\xfcmlere yol a\xe7abilir
- Agresif \xe7evre koşullarında salt dayanım sınıfına g\xfcvenmek yeterli değildir

## C30

Bir\xe7ok normal betonarme bina i\xe7in dengeli bir ara seviye. C25'e g\xf6re fck %20 daha y\xfcksektir; ancak elastisite mod\xfcl\xfc yalnızca yaklaşık %5 artar:

\`\`\`
C25: Ec ≈ 30 250 MPa
C30: Ec ≈ 31 800 MPa
Artış: (31 800 - 30 250) / 30 250 ≈ %5.1
\`\`\`

> [!IMPORTANT]
> **Dayanım artışı ≠ Rijitlik artışı.** Deprem \xf6telenmesini yalnızca beton sınıfını C25'ten C30'a \xe7ıkararak \xe7\xf6zmeye \xe7alışmak \xe7oğu durumda etkisizdir. \xd6telenme i\xe7in genellikle daha etkili olan: perde alanını artırmak, kolon/kiriş boyutlarını artırmak veya taşıyıcı sistem geometrisini iyileştirmektir.

## C35

C35'in C25'e g\xf6re tasarım basın\xe7 dayanımı yaklaşık %40 daha y\xfcksektir:

| Sınıf | fck | fcd | fcd artışı (C25'e g\xf6re) |
|-------|-----|-----|------------------------|
| C25 | 25 MPa | 16.67 MPa | — |
| C30 | 30 MPa | 20.00 MPa | +%20 |
| C35 | 35 MPa | 23.33 MPa | +%40 |

**"C35 kullanınca kolon %40 k\xfc\xe7\xfcl\xfcr" sonucu \xe7ıkarılamaz.** Kolon kapasitesi beton, boyuna donatı, eksantrisite, moment, ikinci mertebe etkileri, minimum kesit, deprem detaylandırması ve birleşim b\xf6lgesi gereksinimleriyle birlikte belirlenir.`,subsections:[]},{id:"yuksek-sinif-her-zaman-iyi-mi",title:"Yüksek Beton Sınıfı Her Zaman Daha İyi midir?",content:`Hayır. Y\xfcksek beton dayanımı bazı avantajlar sağlar; ancak beraberinde riskler getirir.

## Avantajları

- Kolon/perde basın\xe7 kapasitesinde artış
- Bazı elemanlarda daha k\xfc\xe7\xfck kesit imk\xe2nı
- Doğru karışım tasarımıyla d\xfcş\xfck ge\xe7irgenlik potansiyeli
- Bazı agresif ortam koşullarında daha iyi durabilite potansiyeli

## Riskleri

- Y\xfcksek dayanımlı beton genel olarak **daha gevrek** davranabilir
- \xc7imento dozajının gereksiz y\xfckseltilmesi r\xf6tre ve hidratasyon ısısını artırabilir
- D\xfcş\xfck su/bağlayıcı oranı işlenebilirliği zorlaştırabilir
- K\xf6t\xfc k\xfcr y\xfcksek dayanım hedefinin avantajını ortadan kaldırabilir
- Aşırı kesit k\xfc\xe7\xfcltme deprem davranışı a\xe7ısından sorun yaratabilir
- Donatı sıkışıklığı artar, birleşim b\xf6lgelerinde beton yerleştirmek zorlaşabilir

**Doğru yaklaşım:** Beton sınıfı, taşıyıcı sistem optimizasyonunun bir par\xe7asıdır; tek başına optimizasyon değildir.`,subsections:[]},{id:"eleman-bazinda-etki",title:"Eleman Türüne Göre Beton Sınıfının Etkisi",content:`## Kolonlar

Kolonlarda beton sınıfının etkisi kirişlere g\xf6re daha belirgindir \xe7\xfcnk\xfc betonun basın\xe7 taşıma katkısı y\xfcksektir.

**\xd6rnek (\xf6ğretici karşılaştırma):**

Beton alanı Ac = 0.40 \xd7 0.60 = 0.24 m\xb2 olan bir kolon i\xe7in yalnızca beton katkısına bakıldığında:

\`\`\`
C25: fcd \xd7 Ac = 16.67 \xd7 0.24 \xd7 1000 ≈ 4 000 kN
C35: fcd \xd7 Ac = 23.33 \xd7 0.24 \xd7 1000 ≈ 5 600 kN
\`\`\`

> [!WARNING]
> Bu değerler kolonun ger\xe7ek tasarım taşıma g\xfcc\xfc değildir — yalnızca beton dayanımı artışının teorik etkisini g\xf6sterir. Ger\xe7ek kolon kapasitesinde beton gerilme bloğu, donatı, eksantrisite, moment, s\xfcneklik ve y\xf6netmelik sınırları uygulanır.

## Kirişler

Tek donatılı dikd\xf6rtgen kesitte:

\`\`\`
T = As \xd7 fyd    (\xe7ekme kuvveti)
C = 0.85\xb7fcd \xd7 b \xd7 a    (beton basın\xe7 kuvveti)
T = C denge koşulundan: As\xb7fyd = 0.85\xb7fcd\xb7b\xb7a
\`\`\`

Beton dayanımı arttığında aynı \xe7ekme donatısı i\xe7in basın\xe7 bloğu derinliği k\xfc\xe7\xfcl\xfcr ve i\xe7 kuvvet kolu artar. Ancak normal donatılı kirişlerde kapasite artışı fck artışıyla birebir orantılı değildir. Kiriş tasarımında \xe7oğu zaman kesit y\xfcksekliği, donatı alanı, sehim ve kesme daha belirleyicidir.

## Perdeler

Perdelerde y\xfcksek beton sınıfı \xf6zellikle y\xfcksek eksenel y\xfck, alt katlar, perde u\xe7 b\xf6lgeleri ve y\xfcksek binalarda avantaj sağlayabilir. Ancak beton dayanımını y\xfckseltip perde alanını aşırı k\xfc\xe7\xfcltmek:

- Bina rijitliğini azaltabilir
- \xd6telenmeleri artırabilir
- Donatı oranını ve detaylandırma zorluğunu artırabilir

Perde tasarımında **dayanım + rijitlik + s\xfcneklik** birlikte d\xfcş\xfcn\xfclmelidir.

## Temeller

Temellerde beton sınıfı se\xe7imi yalnızca basın\xe7 dayanımına g\xf6re yapılmaz. Eğilme, kesme, zımbalama, \xe7evresel koşullar ve ge\xe7irimsizlik gereksinimleri baskın olabilir. \xd6zellikle radye ve suya maruz bodrumlarda durabilite gereksinimleri salt yapısal minimum sınıfından daha belirleyici olabilir.`,subsections:[]},{id:"secim-karar-akisi",title:"Beton Sınıfı Seçim Karar Akışı",content:`Sistematik bir se\xe7im i\xe7in şu adımları izleyin:

## Adım 1 — Yapı Kapsamını Belirle

- Yeni bina mı, mevcut yapı mı?
- Deprem tasarımına tabi bina mı?
- Prefabrike, end\xfcstriyel veya \xf6zel yapı mı?

## Adım 2 — Y\xf6netmelik Minimumlarını Belirle

TS 500 tek başına yeterli olmayabilir. Kontrol:

| Kapsam | Kaynaklar |
|--------|-----------|
| Yeni betonarme bina | TS 500 + TBDY 2018 |
| Beton tanımlama | TS EN 206 + TS 13515 |
| Proje şartname | \xd6zel teknik şartname |

## Adım 3 — \xc7evresel Etki Sınıfını Belirle

| Sınıf | Etki | \xd6rnekler |
|-------|------|----------|
| X0 | Minimal risk | Kuru i\xe7 mek\xe2n, beton korumalı |
| XC1–XC4 | Karbonatlaşma korozyonu | Nemli i\xe7 mek\xe2n → ıslanma–kuruma d\xf6ng\xfcs\xfc |
| XD1–XD3 | Tuzlu su dışı klor\xfcr | Buz \xe7\xf6z\xfcc\xfc tuz, klor\xfcrl\xfc end\xfcstriyel ortam |
| XS1–XS3 | Deniz suyu klor\xfcr\xfc | Deniz aerosolu → gelgit → dalma |
| XF1–XF4 | Donma–\xe7\xf6z\xfclme | Islak y\xfczey ve buz \xe7\xf6z\xfcc\xfc madde |
| XA1–XA3 | Kimyasal saldırı | Agresif toprak veya yeraltı suyu |

## Adım 4 — Taşıyıcı Sistem İhtiyacını Değerlendir

Kolon y\xfckleri, kat sayısı, a\xe7ıklıklar, mimari kesit kısıtlamaları ve rijitlik ihtiyacı doğrultusunda gerekli minimum fcd'yi belirleyin.

## Adım 5 — \xdcretilebilirliği Kontrol Et

- Santral kapasitesi ve nakliye s\xfcresi
- Pompalanabilirlik ve donatı yoğunluğu
- Mevsimsel koşullar (yaz–kış \xf6nlemleri)

## Adım 6 — Ekonomi Değerlendirmesi

Yalnızca m\xb3 beton fiyatına bakma. Daha y\xfcksek beton sınıfı bazen kolon kesitini k\xfc\xe7\xfclterek net kullanım alanını artırabilir. Bazen ise hi\xe7bir ekonomik fayda sağlamaz.`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`M\xfchendislik pratiğinde ve web i\xe7eriklerinde yaygın olarak karşılaşılan hatalar:

## Form\xfcl Hataları

- **fck yerine fcd kullanmak** → kapasite hesabı yanlış azaltılır
- **fcd yerine 0.85\xb7fcd yazmak** → iki farklı kavramın karıştırılması
- **K\xfcp dayanımını silindir dayanımı sanmak** → C30/37 i\xe7in 37 MPa yerine 30 MPa kullanılmalı
- **Karakteristik dayanımı ortalama dayanım olarak tanımlamak** → istatistiksel g\xfcvenlik payı g\xf6z ardı edilir
- **Tek numune sonucuyla beton sınıfı kabul\xfc yapmak** → TS 13515'e g\xf6re istatistiksel değerlendirme gerekir
- **Donatı i\xe7in fyk'yı doğrudan tasarım hesabında kullanmak** → fyd = fyk/γms uygulanmalı

## Kavramsal Hatalar

- **Beton sınıfı y\xfckseldiğinde Ec'nin aynı oranda arttığını sanmak** → C25'ten C30'a %20 dayanım artışı yalnızca %5 rijitlik artışına karşılık gelir
- **Y\xfcksek dayanımlı betonun her durumda daha s\xfcnek olduğunu d\xfcş\xfcnmek** → aksine daha gevrek davranabilir
- **Beton sınıfını durabiliteyle eş anlamlı kullanmak** → durabilite; sınıf, ge\xe7irgenlik, \xf6rt\xfc, k\xfcr ve \xe7atlak kontrol\xfcn\xfcn b\xfct\xfcn\xfcd\xfcr
- **Şantiye kalitesini yalnızca 28 g\xfcnl\xfck basın\xe7 dayanımıyla değerlendirmek** → yerleştirme, vibrasyon ve k\xfcr de en az dayanım kadar \xf6nemlidir

> [!NOTE]
> **1 MPa = 1 N/mm\xb2** eşitliği betonarme kesit hesaplarında pratik kullanım sağlar: N/mm\xb2 \xd7 mm\xb2 = N (Newton).`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makaledeki hesap mantığı ve yaklaşımlar aşağıdaki kaynaklara dayanmaktadır. Projede kullanılan s\xfcr\xfcm, madde numarası ve yerel idare kararları **g\xfcncel resm\xee belgeden doğrulanmalıdır**.

- **TS 500** — Betonarme Yapıların Tasarım ve Yapım Kuralları (TSE g\xfcncel/lisanslı metin)
- **TBDY 2018** — T\xfcrkiye Bina Deprem Y\xf6netmeliği (18 Mart 2018, AFAD)
- **TS EN 206+A2** — Beton: \xd6zellik, Performans, İmalat ve Uygunluk
- **TS 13515** — TS EN 206'nın uygulanmasına ilişkin tamamlayıcı standart

Kesin minimum beton sınıfı değerleri, malzeme g\xfcvenlik katsayıları ve kabul\xfc değerlendirme kriterleri i\xe7in bu kaynakların y\xfcr\xfcrl\xfckteki baskıları esas alınmalıdır.`,subsections:[]}],references:[{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — Türk Standardları",href:"https://www.tse.org.tr",note:"TS 500, TS EN 206 ve TS 13515 için TSE kataloğu."}],relatedSlugs:["ts500-beton-ortusu-durabilite","ts500-karakteristik-tasarim-dayanimlari","ts500-egilme-donatisi-hesabi"],tags:["beton sınıfı","fck","fcd","C25 C30 C35","malzeme dayanımı"]}),m({slug:"ts500-beton-ortusu-durabilite",title:"Beton Örtüsü (Pas Payı) ve Durabilite",description:"Betonarme elemanlarda beton örtüsünün dört işlevi, çevresel etki sınıfları, optimum örtü seçimi ve durabiliteyi etkileyen faktörler.",image:"/covers/ts500/beton-ortusu.png",readTime:"9 dk",keywords:["beton örtüsü","pas payı","durabilite","çevresel etki sınıfı","XC XD XS","karbonatlaşma","klorür korozyonu","donatı korozyonu","nominal örtü"],sections:[{id:"tanim-ve-onemi",title:"Beton Örtüsü Nedir ve Neden Önemlidir?",content:`Beton \xf6rt\xfcs\xfc, beton y\xfczeyi ile donatı y\xfczeyi arasındaki koruyucu beton tabakasıdır. G\xfcndelik dilde "pas payı" olarak da bilinir.

**Beton \xf6rt\xfcs\xfc bir boşluk değildir.** Donatı ile dış ortam arasındaki yapısal ve kimyasal a\xe7ıdan kritik bir koruyucu tabaladır.

Teknik i\xe7erikte dikkat edilmesi gereken kavramlar:

| Kavram | Tanım |
|--------|-------|
| Net beton \xf6rt\xfcs\xfc | Donatı y\xfczeyi ile dış beton y\xfczeyi arasındaki \xf6l\xe7\xfclen mesafe |
| Nominal beton \xf6rt\xfcs\xfc | Tasarım ve paftalarda kullanılan hedef değer |
| Minimum beton \xf6rt\xfcs\xfc | Y\xf6netmelik ve standartların izin verdiği alt sınır |

> [!IMPORTANT]
> "Her yerde 2.5 cm pas payı yeter" yaklaşımı yanlıştır. Beton \xf6rt\xfcs\xfc eleman t\xfcr\xfcne, \xe7evresel koşullara, beton kalitesine ve yangın dayanımı gereksinimlerine g\xf6re değişir.`,subsections:[]},{id:"dort-ana-gorev",title:"Beton Örtüsünün Dört Ana Görevi",content:`## 1. Korozyon Koruması

Betonun y\xfcksek alkaliliği (pH ≈ 12–13) donatı \xfczerinde pasif bir koruyucu tabaka oluşturur. Yeterli ve kaliteli beton \xf6rt\xfcs\xfc:

- CO₂ girişini yavaşlatır (karbonatlaşma cephesini geciktirir)
- Klor\xfcr iyonlarının donatıya ulaşmasını yavaşlatır
- Su ve oksijen taşınımını azaltır

## 2. Aderans

Donatı kuvvetinin betona aktarılması i\xe7in donatının \xe7evresinde yeterli beton bulunmalıdır. Yetersiz \xf6rt\xfcde:

- Boyuna yarılma \xe7atlakları oluşabilir
- Ankraj ve kenetlenme sorunları \xe7ıkabilir
- Donatı y\xfczeyinde sıyrılma riski artar

## 3. Yangın Dayanımı

Beton \xf6rt\xfcs\xfc donatının hızlı ısınmasını geciktirir. Yangında \xe7elik sıcaklığı arttık\xe7a akma dayanımı ve elastisite mod\xfcl\xfc azalır. Bu nedenle yangın tasarımı i\xe7in gereken \xf6rt\xfc değerleri, yalnızca durabilite i\xe7in gerekenden farklı olabilir.

## 4. Fiziksel Koruma

Donatıyı darbeler, aşınma, nem ve kimyasal etkilere karşı korur.`,subsections:[]},{id:"cevresel-etki-siniflari",title:"Çevresel Etki Sınıfları (XC, XD, XS, XF, XA)",content:`TS EN 206 yaklaşımında betonun maruz kaldığı \xe7evre etkileri sınıflandırılır. Bu sınıflar minimum beton performansını, su/\xe7imento oranını ve beton \xf6rt\xfcs\xfcn\xfc etkiler.

| Sınıf | Etki T\xfcr\xfc | Tipik Koşullar |
|-------|-----------|----------------|
| **X0** | Risk yok | Kuru i\xe7 mek\xe2n, beton korumalı |
| **XC1** | Karbonatlaşma — kuru | Daima kuru veya daima ıslak i\xe7 mek\xe2n |
| **XC2** | Karbonatlaşma — uzun s\xfcreli ıslak | Dış y\xfczey, uzun s\xfcreli ıslak |
| **XC3** | Karbonatlaşma — orta nem | Korunan dış y\xfczeyler, orta nem |
| **XC4** | Karbonatlaşma — ıslanma-kuruma | Yağmur etkisine a\xe7ık y\xfczeyler |
| **XD1** | Klor\xfcr — orta nem | Buz \xe7\xf6z\xfcc\xfc tuz serpilen yollar |
| **XD2** | Klor\xfcr — ıslak-nadir kuru | Y\xfczme havuzu, end\xfcstriyel |
| **XD3** | Klor\xfcr — ıslanma-kuruma | K\xf6pr\xfc g\xfcvertesi, otopark d\xf6şemesi |
| **XS1** | Deniz klor\xfcr\xfc — hava taşımalı | Denize yakın kıyı yapıları |
| **XS2** | Deniz klor\xfcr\xfc — daima dalmış | Deniz yapıları, daima su altı |
| **XS3** | Deniz klor\xfcr\xfc — gelgit ve sı\xe7rama | Gelgit b\xf6lgesi, sı\xe7rama b\xf6lgesi |
| **XF1** | Don — orta suya doygunluk | Yağmur ve don etkisindeki dikey y\xfczeyler |
| **XF2** | Don — orta + buz \xe7\xf6z\xfcc\xfc | Buz \xe7\xf6z\xfcc\xfc tuz + don etkisi |
| **XF3** | Don — y\xfcksek suya doygunluk | Yatay y\xfczeyler, don etkisi |
| **XF4** | Don — y\xfcksek + buz \xe7\xf6z\xfcc\xfc | Karayolu k\xf6pr\xfcleri, yatay y\xfczeyler |
| **XA1–XA3** | Kimyasal saldırı | Agresif toprak, s\xfclfatlı yeraltı suyu |

> [!NOTE]
> Bir eleman birden fazla \xe7evre sınıfına tabi olabilir. \xd6rneğin denize yakın bir k\xf6pr\xfc ayağı aynı anda XS3 + XF4 koşullarında değerlendirilebilir. Her iki sınıfın gereksinimlerinin birlikte sağlanması gerekir.`,subsections:[]},{id:"karbonlasma-klorur",title:"Karbonatlaşma ve Klorür Korozyonu",content:`## Karbonatlaşma

Beton i\xe7indeki alkalilik zamanla atmosferik CO₂ etkisiyle azalır. Bu s\xfcre\xe7:

1. Karbonatlaşma cephesi donatı seviyesine ulaşır
2. Pasif koruyucu tabaka bozulur
3. Nem ve oksijen varlığında korozyon başlar
4. Pas \xfcr\xfcnleri \xe7elikten daha b\xfcy\xfck hacim kaplar
5. İ\xe7 basın\xe7 oluşur → boyuna \xe7atlak → \xf6rt\xfc d\xf6k\xfclebilir → donatı kesit kaybı

## Klor\xfcr Korozyonu

Klor\xfcr iyonları donatıya ulaştığında pasif tabakayı bozar. Karbonatlaşmadan farklı olarak **lokal/pitting tipi** ciddi kesit kayıplarına yol a\xe7abilir. Deniz yapıları, kıyı yapıları ve buz \xe7\xf6z\xfcc\xfc tuz kullanılan yerlerde en y\xfcksek risk d\xfczeyindedir.

> [!WARNING]
> **"C35 beton kullandım, sorun \xe7\xf6z\xfcl\xfcr"** yaklaşımı klor\xfcr a\xe7ısından yanlıştır. Denizkıyı yapıları i\xe7in b\xfct\xfcn şunlar birlikte sağlanmalıdır:
> - D\xfcş\xfck su/bağlayıcı oranı
> - Uygun \xe7imento/bağlayıcı t\xfcr\xfc
> - Yeterli ve nitelikli beton \xf6rt\xfcs\xfc
> - \xc7atlak genişliği kontrol\xfc
> - Doğru k\xfcr s\xfcresi ve y\xf6ntemi`,subsections:[]},{id:"optimum-ortu",title:"Optimum Örtü: Ne Çok Az, Ne Çok Fazla",content:`## Yetersiz \xd6rt\xfcn\xfcn Sonu\xe7ları

- Donatı korozyonu hızlanır
- Beton \xe7atlayabilir ve y\xfczey d\xf6k\xfcl\xfcr
- Aderans (kenetlenme) azalır
- Yangın dayanımı d\xfcşer
- Yapı \xf6mr\xfc kısalır

## Aşırı \xd6rt\xfcn\xfcn Sonu\xe7ları

"Pas payını ne kadar artırırsak o kadar iyidir" yaklaşımı da yanlıştır:

- Y\xfczey \xe7atlağı genişliği artabilir
- Kapak betonunun kontrols\xfcz \xe7atlamasına zemin hazırlanır
- **Faydalı y\xfckseklik azalır**

Kirişlerde:

\`\`\`
d = h − \xf6rt\xfc − etriye \xe7apı − 0.5 \xd7 boyuna donatı \xe7apı
\`\`\`

\xd6rt\xfc arttık\xe7a faydalı y\xfckseklik (d) azalır. Moment kapasitesi Mr ≈ As\xb7fyd\xb7z ilişkisinden hareketle z değeri d\xfcşer ve kapasite azalabilir.

**Gereksiz b\xfcy\xfck \xf6rt\xfc yapısal olarak n\xf6tr değildir.**

## Mesafe Tutucular

Projede doğru \xf6rt\xfc \xe7izmek yeterli değildir. Şantiyede donatı mesafe tutucular olmadan kalıba yaslanabilir, sarkabilir veya deforme olabilir. Mesafe tutucuların:

- Doğru \xe7ap ve boyda se\xe7ilmesi
- Yeterli sıklıkta yerleştirilmesi
- Kalıp ve d\xf6k\xfcm sırasında yerinde kalması

sağlanmalıdır.`,subsections:[]},{id:"kur-ve-durabilite",title:"Kür ve Durabilite İlişkisi",content:`K\xfcr yalnızca "beton daha y\xfcksek dayanım alsın" diye yapılmaz. İyi k\xfcr:

- Hidratasyonu s\xfcrd\xfcr\xfcr ve y\xfczey betonunu yoğunlaştırır
- Plastik r\xf6tre \xe7atlaklarını azaltır
- Betonun ge\xe7irgenliğini azaltır
- Dış ortam etkilerine karşı dayanıklılığı artırır

> [!IMPORTANT]
> **Beton \xf6rt\xfcs\xfc 40 mm olsa bile ilk 10–15 mm'lik y\xfczey betonu k\xf6t\xfc k\xfcr nedeniyle \xe7ok ge\xe7irgense, teorik \xf6rt\xfc avantajının \xf6nemli b\xf6l\xfcm\xfc kaybedilebilir.**

**"Durabiliteyi santimetre değil, kaliteli santimetre korur."**

## Su/\xc7imento Oranı ve Ge\xe7irgenlik

Betonun ge\xe7irgenliğini belirleyen en \xf6nemli parametrelerden biri su/bağlayıcı oranıdır. Genel prensip: su/\xe7imento oranı arttık\xe7a kapiler boşluk yapısı artabilir ve ge\xe7irgenlik y\xfckselir. Ancak d\xfcş\xfck su/\xe7imento oranı tek başına kalite garantisi değildir — yetersiz işlenebilirlik, vibrasyon sorunları veya k\xf6t\xfc k\xfcr y\xfcksek kaliteli bir karışımı olumsuz yapıya d\xf6n\xfcşt\xfcrebilir.`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`## Projede

- "Her yerde 25 mm \xf6rt\xfc" kabul\xfc yapılması — eleman t\xfcr\xfc ve \xe7evreye g\xf6re değişir
- Temel altında donatı \xf6rt\xfcs\xfcn\xfcn \xfcst/alt y\xfczde eşit alınması — serbest y\xfczey, kalıba y\xfczey ve toprağa y\xfczey farklı değer gerektirebilir
- Bodrum perdelerinde i\xe7/dış y\xfcz \xf6rt\xfcs\xfcn\xfcn aynı alınması — toprak taraflı y\xfcz genellikle daha y\xfcksek \xf6rt\xfc gerektirir

## Şantiyede

- Mesafe tutucuların \xe7imento bazlı yerine plastik se\xe7ilmesi (klor\xfcr ge\xe7irgen ortamlarda sorun yaratabilir)
- Mesafe tutucuların yetersiz sıklıkta yerleştirilmesi
- Kalıp d\xf6k\xfcm aşamasında donatının kayması ve \xf6rt\xfcn\xfcn değişmesi
- Birden fazla donatı katmanı varken yalnızca dış \xe7apı dikkate almak

> [!NOTE]
> **Beton \xf6rt\xfcs\xfc yalnızca tasarımda doğru belirlenmeli değil, şantiyede de doğrulanmalıdır.** Beton d\xf6k\xfcm\xfc \xf6ncesi kalıp ve donatı kontrol\xfc sırasında \xf6rt\xfc fotoğraflı tutanağa bağlanmalıdır.`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makalede ele alınan kavramlar aşağıdaki kaynaklara dayanmaktadır. Projede kullanılan kesin değerler **g\xfcncel resm\xee belgeden doğrulanmalıdır**.

- **TS 500** — Betonarme Yapıların Tasarım ve Yapım Kuralları (TSE)
- **TS EN 206+A2** — Beton: \xd6zellik, Performans, İmalat ve Uygunluk
- **TS 13515** — TS EN 206'nın uygulanmasına ilişkin tamamlayıcı standart
- **TBDY 2018** — T\xfcrkiye Bina Deprem Y\xf6netmeliği (AFAD)
- **TS EN 1992-1-1** — Betonarme yapıların tasarımı: Genel kurallar (EC2)`,subsections:[]}],references:[{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500, TS EN 206, TS 13515",href:"https://www.tse.org.tr",note:"TSE kataloğunda güncel baskı doğrulanmalıdır."}],relatedSlugs:["ts500-beton-sinifi-secimi","ts500-karakteristik-tasarim-dayanimlari","ts500-catlak-genisligi-kontrolu"],tags:["beton örtüsü","pas payı","durabilite","çevresel etki sınıfı","karbonatlaşma"]}),m({slug:"ts500-karakteristik-tasarim-dayanimlari",title:"Karakteristik ve Tasarım Dayanımları ile Malzeme Katsayıları",description:"TS 500 taşıma gücü yaklaşımında fck, fcd, fyk ve fyd kavramları; malzeme güvenlik katsayılarının anlamı ve kesit hesabında doğru değerlerin kullanımı.",image:"/covers/ts500/beton-sinifi.png",readTime:"8 dk",keywords:["fck","fcd","fyk","fyd","karakteristik dayanım","tasarım dayanımı","malzeme güvenlik katsayısı","γmc","γms","ortalama dayanım","beton çekme dayanımı"],sections:[{id:"uc-seviye",title:"Ortalama, Karakteristik ve Tasarım Dayanımı",content:`M\xfchendislik hesabında malzeme dayanımı deterministik değildir — aynı sınıftaki betonun deney sonu\xe7ları bile değişkenlik g\xf6sterir. Bu nedenle \xfc\xe7 farklı dayanım seviyesi tanımlanır:

## Ortalama Dayanım

Bir numune grubunun aritmetik ortalamasıdır. Sembol olarak genellikle **fcm** kullanılır.

## Karakteristik Dayanım (fck)

\xdcretimde ortaya \xe7ıkan doğal sa\xe7ılmayı ve istatistiksel değişkenliği dikkate alan g\xfcvenilir bir alt sınır değeridir. Karakteristik değer, tipik olarak belirli bir aşım olasılığıyla (\xf6rneğin %5 red olasılığıyla) tanımlanır.

**fck, ortalama dayanımdan k\xfc\xe7\xfckt\xfcr.**

## Tasarım Dayanımı (fcd)

Kesit hesabında doğrudan kullanılan, g\xfcvenlik katsayısıyla azaltılmış değerdir.

**Kritik zincir:**

\`\`\`
Deney sonucu → Ortalama (fcm) → Karakteristik (fck) → Tasarım (fcd)
\`\`\`

Bu \xfc\xe7 değer birbirinden farklıdır ve her birinin kullanıldığı bağlam ayrıdır.

> [!WARNING]
> Hesap raporunda kullanılan değerin ortalama mı, karakteristik mi, yoksa tasarım dayanımı mı olduğu a\xe7ık\xe7a belirtilmelidir. "Beton C30, fck = 30 MPa" yazmak yeterli değildir — kullanılan değer t\xfcr\xfc ve ilgili form\xfcldeki katsayılar da g\xf6sterilmelidir.`,subsections:[]},{id:"guvensizlik-katsayilari",title:"Malzeme Güvenlik Katsayıları: Neden Var?",content:`Malzeme g\xfcvenlik katsayısı (γm) yalnızca "emniyet payı" olarak basitleştirilmemelidir. Şu belirsizlikleri kapsar:

- Malzeme dayanımındaki istatistiksel sa\xe7ılma
- Numunenin ger\xe7ek yapıyı tam temsil etmemesi
- Şantiye koşulları ile laboratuvar koşulları arasındaki fark
- Geometrik toleranslar
- Hesap modelinin idealizasyonu
- Uzun d\xf6nem etkileri
- \xdcretim ve uygulama belirsizlikleri

Taşıma g\xfcc\xfc yaklaşımında g\xfcvenlik iki tarafta oluşturulur:

1. **Y\xfck etkileri** g\xfcvenli tarafta b\xfcy\xfct\xfcl\xfcr (γf fakt\xf6rleri)
2. **Malzeme dayanımları** g\xfcvenli tarafta azaltılır (γm fakt\xf6rleri)

Temel koşul: **Ed ≤ Rd**

- Ed = tasarım y\xfck etkisi (b\xfcy\xfct\xfclm\xfcş)
- Rd = tasarım dayanımı (azaltılmış)`,subsections:[]},{id:"beton-formulleri",title:"Beton: fck → fcd Dönüşümü",content:`## Temel Form\xfcl

\`\`\`
fcd = fck / γmc

TS 500 yaygın değeri: γmc = 1.50 (yerinde d\xf6kme beton)
\`\`\`

## Hesap \xd6rnekleri

| Sınıf | fck (MPa) | γmc | fcd (MPa) | 0.85\xb7fcd (MPa) |
|-------|----------:|-----|----------:|---------------:|
| C20 | 20 | 1.50 | 13.33 | 11.33 |
| C25 | 25 | 1.50 | 16.67 | 14.17 |
| C30 | 30 | 1.50 | 20.00 | 17.00 |
| C35 | 35 | 1.50 | 23.33 | 19.83 |
| C40 | 40 | 1.50 | 26.67 | 22.67 |
| C45 | 45 | 1.50 | 30.00 | 25.50 |
| C50 | 50 | 1.50 | 33.33 | 28.33 |

> [!IMPORTANT]
> **fcd ≠ 0.85\xb7fcd** — fcd betonun tasarım basın\xe7 dayanımıdır. 0.85\xb7fcd ise eşdeğer basın\xe7 bloğu hesabında kullanılan etkin gerilme d\xfczeyiyle ilişkilidir. C30 \xf6rneği: fcd = 20 MPa, 0.85\xb7fcd = 17 MPa.

## Betonun Karakteristik \xc7ekme Dayanımı

Beton \xe7ekmede basınca g\xf6re \xe7ok daha zayıftır. TS 500'de normal dayanımlı beton i\xe7in:

\`\`\`
fctk ≈ 0.35 \xd7 √fck    (MPa cinsinden)

C30 i\xe7in: fctk ≈ 0.35 \xd7 √30 ≈ 1.92 MPa
fctd = fctk / γmc = 1.92 / 1.50 ≈ 1.28 MPa
\`\`\`

Bu değer; kesme dayanımı, \xe7atlama, minimum donatı ve aderansla ilişkili kontrollerde kullanılır.

## Elastisite Mod\xfcl\xfc

\`\`\`
Ec = 3 250 \xd7 √fck + 14 000    (MPa)

C25: Ec ≈ 30 250 MPa
C30: Ec ≈ 31 800 MPa
C35: Ec ≈ 33 230 MPa
\`\`\`

Beton sınıfının y\xfckselmesi elastisite mod\xfcl\xfcn\xfc artırır; ancak artış basın\xe7 dayanımı artışı kadar hızlı değildir. C25'ten C30'a ge\xe7mek dayanımı %20 artırırken rijitliği yalnızca ~%5 artırır.`,subsections:[]},{id:"donati-celigi-formulleri",title:"Donatı Çeliği: fyk → fyd Dönüşümü",content:`## Temel Form\xfcl

\`\`\`
fyd = fyk / γms

TS 500 yaygın değeri: γms = 1.15
\`\`\`

## Hesap \xd6rneği

\`\`\`
fyk = 420 MPa (B420C sınıfı donatı)

fyd = 420 / 1.15 ≈ 365.2 MPa
\`\`\`

## TBDY 2018 Donatı Gereksinimleri

Deprem etkisi altındaki betonarme binalarda yalnızca fyk değerine bakmak yeterli değildir. TBDY kapsamında kontrol edilmesi gerekenler:

- Donatı sınıfı ve nerv\xfcr geometrisi
- Akma dayanımı (fyk)
- \xc7ekme dayanımı (ftk) ve ft/fy oranı
- Kopma uzaması (εsuk)
- S\xfcneklik sınıfı (B ve C sınıfları)
- Kaynaklanabilirlik

> [!IMPORTANT]
> TBDY 2018 betonarme bina tasarımı i\xe7in donatı \xe7eliğinin s\xfcneklik sınıfı koşullarını karşılaması gerekebilir. Kesin şartlar i\xe7in y\xfcr\xfcrl\xfckteki TBDY metnini doğrulayın.`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`Hesap raporlarında ve yazılım girişlerinde karşılaşılan yaygın hatalar:

## Değer Karıştırma Hataları

| Hata | Doğru Kullanım |
|------|----------------|
| fck yerine fcd kullanmak | fck karakteristik, fcd tasarım değeridir |
| fcd yerine 0.85\xb7fcd yazmak | Bunlar farklı kavramlardır — 0.85 fakt\xf6r\xfc ayrıca uygulanır |
| K\xfcp dayanımını silindir dayanımı sanmak | C30/37'de fck = 30 MPa (silindir) |
| Karakteristik dayanımı ortalama dayanım olarak tanımlamak | Karakteristik değer istatistiksel alt sınırdır |
| Tek numune sonucuyla beton kabul\xfc yapmak | TS 13515'e g\xf6re istatistiksel değerlendirme gerekir |
| fyk'yı doğrudan tasarım hesabında kullanmak | fyd = fyk / γms uygulanmalı |

## Birim Karışıklığı

**1 MPa = 1 N/mm\xb2**

Bu eşitlik sayesinde betonarme kesit hesaplarında:

\`\`\`
Kuvvet (N) = Gerilme (N/mm\xb2) \xd7 Alan (mm\xb2)
\`\`\`

doğrudan kullanılabilir. MPa ve N/mm\xb2 aynı birimdir.

## Yazılım Kullanımındaki Hatalar

Hesap yazılımlarında malzeme kartları girişinde:
- Silindir mi k\xfcp dayanımı tanımlandığı kontrol edilmeli
- Yazılımın γmc'yi uygulayıp uygulamadığı bilinmeli
- Program \xe7ıktısında hangi dayanım değeriyle işlem yapıldığı izlenmeli`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makaledeki kavramlar aşağıdaki kaynaklara dayanmaktadır. Projede kullanılan kesin değerler **g\xfcncel resm\xee belgeden doğrulanmalıdır**.

- **TS 500** — Betonarme Yapıların Tasarım ve Yapım Kuralları
- **TBDY 2018** — T\xfcrkiye Bina Deprem Y\xf6netmeliği, B\xf6l\xfcm 7 (Betonarme Taşıyıcı Sistemler)
- **TS EN 206+A2** — Beton tanımlama ve uygunluk
- **TS 13515** — Beton kabul standartları`,subsections:[]}],relatedSlugs:["ts500-beton-sinifi-secimi","ts500-beton-ortusu-durabilite","ts500-egilme-donatisi-hesabi"],tags:["fck","fcd","malzeme katsayısı","γmc","tasarım dayanımı"]}),m({slug:"ts500-donati-orani-sinirlari",title:"Donatı Oranı Sınırları: Minimum ve Maksimum (TS 500 Md. 11.3)",description:"Kiriş, kolon, perde ve döşemelerde minimum ve maksimum donatı oranlarının fiziki anlamı, süneklik ilişkisi ve TBDY 2018 ek kuralları.",image:"/covers/ts500/donati-orani.png",readTime:"10 dk",keywords:["donatı oranı","minimum donatı","maksimum donatı","ρmin","ρmax","ρb","dengeli donatı oranı","kolon donatı oranı","kiriş donatısı","süneklik"],sections:[{id:"donati-orani-tanimi",title:"Donatı Oranı Nedir?",content:`Donatı oranı (ρ), betonarme bir kesitteki \xe7elik alanının beton kesit alanına oranıdır. Ancak **payda her elemanda aynı değildir**:

| Eleman T\xfcr\xfc | Tanım | Payda | Form\xfcl |
|-------------|-------|-------|--------|
| Kiriş (\xe7ekme) | ρ | G\xf6vde alanı (bw \xd7 d) | ρ = As / (bw \xd7 d) |
| Kolon (boyuna) | ρt | Br\xfct beton alanı (Ac) | ρt = Ast / Ac |
| D\xf6şeme (birim genişlik) | ρ | Birim şerit alanı (b \xd7 d) | ρ = As / (b \xd7 d) |
| Perde (g\xf6vde) | ρv / ρh | G\xf6vde beton alanı | D\xfcşey / yatay donatı oranları |

> [!WARNING]
> "ρ = As / Ac" form\xfcl\xfcn\xfc t\xfcm elemanlara uygulamak yanlıştır. Kirişte faydalı y\xfckseklik (d) ve g\xf6vde genişliği (bw) kullanılırken, kolonda br\xfct alan (Ac) esas alınır.`,subsections:[]},{id:"neden-minimum-donati",title:"Neden Minimum Donatı Sınırı Vardır?",content:`Minimum donatı (As,min veya ρmin) \xfc\xe7 temel nedenle gereklidir:

1. **\xc7atlama sonrası taşıma kapasitesi:** Beton \xe7ekmede zayıftır; \xe7ekme b\xf6lgesinde ilk \xe7atlak oluştuğunda \xe7ekme kuvveti aniden donatıya aktarılır. Donatı \xe7ok azsa kesit \xe7atladığı anda aniden kırılabilir.
2. **Gevrek kırılmanın \xf6nlenmesi:** \xc7atlama anındaki moment taşıma kapasitesinin (Mcr) altında kalmamak i\xe7in donatı belirli bir alt sınırın \xfczerinde olmalıdır.
3. **\xc7atlakların dağıtılması:** Yeterli donatı, y\xfck altında tek bir geniş \xe7atlak yerine \xe7ok sayıda kılcal ve zararsız \xe7atlak oluşmasını sağlar.

> [!NOTE]
> **Temel Mantık:** \xc7atlama momentinden (Mcr) sonra kesitin taşıma kapasitesinin aniden yok olmamasını sağlamak.

## "Hesaptan 250 mm\xb2 \xc7ıktı" Durumu

Statik hesap programı gerekli donatı alanını As,hesap = 250 mm\xb2 bulsa dahi, y\xf6netmelik As,min = 462 mm\xb2 gerektiriyorsa kesite **462 mm\xb2** konulmalıdır.

\`\`\`
As,uygulanan = max(As,hesap, As,min)
\`\`\``,subsections:[]},{id:"neden-maksimum-donati",title:"Neden Maksimum Donatı Sınırı Vardır?",content:`Betonarme tasarımında ama\xe7 yalnızca en y\xfcksek moment kapasitesini elde etmek değildir.

Aşırı donatı konulmuş (denge \xfcst\xfc) bir kirişte:
- \xc7ekme donatısı akmadan beton basın\xe7 b\xf6lgesinde ezilir.
- Aniden ve uyarısız **gevrek kırılma** meydana gelir.
- Plastik mafsal oluşumu ve enerji yutma kapasitesi (s\xfcneklik) kaybolur.

## Dengeli, Denge Altı ve Denge \xdcst\xfc Kesitler

| Kesit T\xfcr\xfc | Donatı Oranı | Kırılma T\xfcr\xfc | Deprem Tasarımı Uyum |
|------------|-------------|--------------|----------------------|
| **Denge Altı** | ρ < ρb | S\xfcnek (\xe7elik akar, sonra beton ezilir) | İdeal / Tercih Edilen |
| **Dengeli** | ρ = ρb | Eşzamanlı (\xe7elik akar + beton ezilir) | Sınır Durumu |
| **Denge \xdcst\xfc** | ρ > ρb | Gevrek (beton aniden ezilir) | **Yasak / Tehlikeli** |

> [!IMPORTANT]
> Deprem tasarımının temeli **s\xfcneklik**tir. Maksimum donatı sınırı "betona daha fazla demir sığmıyor" diye değil, yapının s\xfcnek davranmasını sağlamak i\xe7in konulmuştur.`,subsections:[]},{id:"kiris-donati-sinirlari",title:"Kirişlerde Minimum ve Maksimum Donatı",content:`## Kiriş Minimum \xc7ekme Donatısı

TS 500 pratik hesap form\xfcl\xfc:

\`\`\`
ρmin = 0.8 \xd7 fctd / fyd

As,min = ρmin \xd7 bw \xd7 d
\`\`\`

**\xd6rnek (C30 / B420C):**
- fctd ≈ 1.28 MPa
- fyd ≈ 365.2 MPa
- ρmin = 0.8 \xd7 1.28 / 365.2 ≈ 0.0028 (%0.28)

300 \xd7 600 mm (d ≈ 550 mm) bir kiriş i\xe7in:
As,min = 0.0028 \xd7 300 \xd7 550 ≈ **462 mm\xb2** (yaklaşık 3\xd814 veya 2\xd818)

> [!NOTE]
> **Beton Dayanımı Artınca ρmin Neden Artar?**
> C25'ten C35'e ge\xe7ildiğinde fctd artar, dolayısıyla ρmin de artar. \xc7\xfcnk\xfc daha g\xfc\xe7l\xfc beton \xe7atlamadan \xf6nce daha y\xfcksek \xe7ekme kuvveti taşır; \xe7atlama anında donatıya aktarılan kuvvet daha b\xfcy\xfckt\xfcr.

## Kiriş Maksimum \xc7ekme Donatısı

TS 500'de tek donatılı kirişte \xe7ekme donatısı oranı dengeli donatı oranının (ρb) belirli bir y\xfczdesiyle sınırlanır (genellikle ρ ≤ 0.85\xb7ρb veya deprem b\xf6lgesinde daha d\xfcş\xfck). Basın\xe7 donatısı (As') eklendiğinde net \xe7ekme oranı (ρ − ρ') kontrol edilir.`,subsections:[]},{id:"kolon-donati-sinirlari",title:"Kolonlarda Donatı Oranı ve TBDY 2018",content:`Kolon boyuna donatı oranı br\xfct beton alanına g\xf6re hesaplanır:

\`\`\`
ρt = Ast / Ac
\`\`\`

## Y\xf6netmelik Sınırları

- **TS 500 Minimum:** ρt ≥ %1.0 (0.01)
- **TS 500 Maksimum:** ρt ≤ %4.0 (0.04) — bindirme b\xf6lgesinde %6.0

## TBDY 2018 Deprem H\xfck\xfcmleri

Deprem etkisi altındaki kolonlarda TBDY B\xf6l\xfcm 7 ek sınırlamalar getirir:
- Minimum boyuna donatı oranı: **%1.0**
- Maksimum boyuna donatı oranı: **%4.0** (bindirme b\xf6lgesinde %6.0)
- Minimum boyuna donatı \xe7apı: **\xd814** (veya TBDY g\xfcncel sınırı)
- Sarılma b\xf6lgelerindekapalı etriye ve \xe7iroz zorunluluğu

## Sayısal Kolon \xd6rneği

400 \xd7 600 mm kolon (Ac = 240 000 mm\xb2):
- Minimum Ast = %1.0 \xd7 240 000 = **2 400 mm\xb2** (\xf6r. 8\xd820 = 2 512 mm\xb2)
- Maksimum Ast = %4.0 \xd7 240 000 = **9 600 mm\xb2**

> [!WARNING]
> **Kolonda Aşırı Donatının Tehlikeleri:** Kolon kesitini k\xfc\xe7\xfclt\xfcp donatıyı aşırı artırmak; betonun donatı aralarından ge\xe7ememesine, pas payı kaybına, peteklenmeye ve d\xfcğ\xfcm noktasında donatı \xe7akışmasına yol a\xe7ar. "Kesiti k\xfc\xe7\xfclt\xfcr\xfcm, demiri artırırım" yaklaşımı betonarmede sınırsız \xe7alışan bir y\xf6ntem değildir.`,subsections:[]},{id:"doseme-ve-perde-sinirlari",title:"Döşeme ve Perdelerde Donatı Sınırları",content:`## D\xf6şemeler

- **Tek Doğrultulu D\xf6şeme:** B420C \xe7eliğinde minimum donatı oranı genellikle ρmin ≥ %0.15–%0.20 mertebesindedir. Dağıtma donatısı da ana donatının belirli bir oranından az olamaz.
- **\xc7ift Doğrultulu D\xf6şeme:** İki doğrultudaki donatı oranlarının toplamı y\xf6netmelikte belirtilen minimum sınırı sağlamalıdır.

## Perdeler (TBDY B\xf6l\xfcm 7)

Perdelerde donatı oranları g\xf6vde ve u\xe7 b\xf6lgeleri i\xe7in ayrı tanımlanır:

- **G\xf6vde D\xfcşey Donatısı:** Minimum ρv ≥ 0.0025 (her iki y\xfczde toplam)
- **G\xf6vde Yatay Donatısı:** Minimum ρh ≥ 0.0025 (her iki y\xfczde toplam)
- **Perde U\xe7 B\xf6lgeleri:** Kritik perde y\xfcksekliği boyunca u\xe7 b\xf6lgelerinde boyuna donatı oranı en az %0.2 (t\xfcm perde alanına oranla) ve u\xe7 b\xf6lgesi i\xe7inde ρ ≥ %1.0 olmalıdır. Donatı kapalı etriye ve \xe7irozlarla sarılmalıdır.`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`## Uygulama ve Tasarım Hataları

1. **Donatı oranının paydasını yanlış almak:** Kirişte Ac kullanmak veya kolonda d kullanmak.
2. **Hesaplanan donatı minimumun altındayken hesaplanan değeri koymak:** As,uygulanan = max(As,hesap, As,min) kuralına uymamak.
3. **Maksimum donatı sınırını aşarak gevrek kesit oluşturmak:** "Daha \xe7ok demir = daha g\xfc\xe7l\xfc kiriş" yanılgısı.
4. **Beton sınıfı y\xfckseldiğinde ρmin'i sabit tutmak:** fctd arttığı i\xe7in ρmin'in de arttığını g\xf6zden ka\xe7ırmak.
5. **Kolon bindirme b\xf6lgesinde donatı sıkışıklığı:** Maksimum %6.0 sınırını aşarak beton d\xf6k\xfcm\xfcn\xfc imk\xe2nsız hale getirmek.
6. **Perde g\xf6vde donatısını tek sıra koymak:** Kalınlığı 15 cm \xfczerindeki perdelerde \xe7ift sıra donatı zorunludur.`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makaledeki hesap kuralları ve donatı oranları aşağıdaki standartlara dayanmaktadır. Kesin normatif sınırlar **g\xfcncel resmi belgeden doğrulanmalıdır**:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 7, 8, 11, 12, 13)
- **TBDY 2018** — T\xfcrkiye Bina Deprem Y\xf6netmeliği, B\xf6l\xfcm 7 (Betonarme Taşıyıcı Sistemler)
- **TS 708** — Betonarme İ\xe7in \xc7elik Donatı Standartları`,subsections:[]}],references:[{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500 Betonarme Standartı",href:"https://www.tse.org.tr"}],relatedSlugs:["ts500-kenetlenme-ek-yeri","ts500-egilme-donatisi-hesabi","ts500-kolon-pm-etkilesimi"],tags:["donatı oranı","minimum donatı","maksimum donatı","ρmin","ρmax","süneklik"]}),m({slug:"ts500-kenetlenme-ek-yeri",title:"Kenetlenme Boyu ve Donatı Ek Yeri Kuralları",description:"Aderans mekanizması, düz ve kancalı kenetlenme hesabı, bindirmeli ekler, mekanik manşonlar ve TBDY 2018 donatı ek yeri kuralları.",image:"/covers/ts500/kenetlenme.png",readTime:"11 dk",keywords:["kenetlenme boyu","bindirme eki","aderans","lb","lbd","manşonlu ek","kanca kenetlenmesi","üst donatı","TBDY bindirme","donatı eki"],sections:[{id:"kenetlenme-ve-aderans",title:"Kenetlenme ve Aderans Nedir?",content:`Betonarme elemanlarda donatının tasarım dayanımını g\xf6sterebilmesi i\xe7in \xe7uluktaki \xe7ekme veya basın\xe7 kuvvetinin betona tam olarak aktarılması gerekir.

- **Kenetlenme:** \xc7uluktaki kuvvetin donatıdan betona g\xfcvenle aktarılması s\xfcrecidir.
- **Aderans:** Donatı ile beton arasındaki yapışma ve kenetlenme gerilmesidir (τb).

## Aderans Mekanizması

Nerv\xfcrl\xfc donatı \xe7eliklerinde aderans \xfc\xe7 bileşenden oluşur:
1. **Kimyasal yapışma:** Beton ile \xe7elik y\xfczey arasındaki mikro yapışma
2. **S\xfcrt\xfcnme:** Donatı ile beton arasındaki temas s\xfcrt\xfcnmesi
3. **Mekanik kilitlenme:** Nerv\xfcrlerin betona dişli gibi dayanması (baskın bileşen)

Nerv\xfcrlerin betona uyguladığı radyal kuvvetler yetersiz pas payı veya sıkılaştırılmamış beton durumunda **boyuna yarılma \xe7atlaklarına** neden olur.

> [!IMPORTANT]
> **Fiziksel Denge Mantığı:**
> \xc7ubuğun taşıdığı kuvvet: T = As \xd7 fs = (π\xb7ϕ\xb2 / 4) \xd7 fs
> Aderansla aktarılan kuvvet: T = π \xb7 ϕ \xb7 lb \xb7 τb
> İki kuvvet eşitlendiğinde: **lb = (ϕ \xb7 fs) / (4 \xb7 τb)**
> 
> Bu denklem kenetlenmenin temel kuralını \xf6zetler: \xc7ap (ϕ) arttık\xe7a lb artar, beton kalitesi (τb) arttık\xe7a lb azalır.`,subsections:[]},{id:"ts500-kenetlenme-formulu",title:"TS 500 Kenetlenme Boyu Hesabı",content:`TS 500'de temel \xe7ekme kenetlenme boyu (lb) şu ifadeyle hesaplanır:

\`\`\`
lb = 0.12 \xd7 (fyd / fctd) \xd7 ϕ

lb ≥ 20 \xd7 ϕ (veya y\xf6netmelik minimumu)
\`\`\`

- **fyd:** Donatı \xe7eliği tasarım akma dayanımı (fyd = fyk / 1.15)
- **fctd:** Beton tasarım \xe7ekme dayanımı (fctd = fctk / 1.50)
- **ϕ:** Donatı \xe7ubuğu \xe7apı (mm)

## C25, C30, C35 i\xe7in Pratik Katsayılar (B420C)

fyk = 420 MPa (fyd = 365.2 MPa) kabul\xfcyle pratik kenetlenme katsayıları:

| Beton Sınıfı | fctd (MPa) | lb / ϕ (Temel Katsayı) | \xd816 i\xe7in lb (\xd6rnek) | \xd820 i\xe7in lb (\xd6rnek) |
|--------------|-----------:|-----------------------:|--------------------:|--------------------:|
| C25 | 1.17 | ~37.6 \xd7 ϕ | ~60 cm | ~75 cm |
| C30 | 1.28 | ~34.3 \xd7 ϕ | ~55 cm | ~69 cm |
| C35 | 1.38 | ~31.7 \xd7 ϕ | ~51 cm | ~63 cm |
| C40 | 1.48 | ~29.7 \xd7 ϕ | ~48 cm | ~59 cm |

> [!NOTE]
> Bu tablodaki değerler temel d\xfcz kenetlenme katsayısıdır. Ger\xe7ek projede \xfcst donatı durumu, beton \xf6rt\xfcs\xfc, kanca ve bindirme \xe7arpanları ayrıca uygulanmalıdır.

## Donatı \xc7apının Kenetlenmeye Etkisi

\xc7elik alanı kesit \xe7apının karesiyle (ϕ\xb2) b\xfcy\xfcrken, kenetlenme boyu \xe7apla (ϕ) doğrusal b\xfcy\xfcr:

- **\xd816 → \xd820 Değişimi:** Donatı alanı %56 artarken, kenetlenme boyu %25 uzar. B\xfcy\xfck \xe7aplı donatıların d\xfcğ\xfcm noktalarında kenetlenmesi daha zorlaşır.`,subsections:[]},{id:"ust-donati-ve-kanca",title:"Üst Donatı Etkisi ve Kanca Kenetlenmesi",content:`## \xdcst Donatı Durumu

Taze beton d\xf6k\xfcm\xfc sırasında katı taneler \xe7\xf6kerken su ve ince malzeme yukarı y\xfckselir. Bu durum d\xf6k\xfcm y\xfcksekliğinin \xfcst b\xf6lgelerinde bulunan horizontal donatıların alt y\xfczeyinde boşluk ve zayıf aderans oluşturur.

**TS 500 Kuralı:** Beton d\xf6k\xfcm y\xf6n\xfcne g\xf6re altı taze betonla kaplı donatılarda (\xf6rneğin d\xf6k\xfcm y\xfcksekliği > 30 cm olan elemanların \xfcst donatılarında) kenetlenme boyu **1.3 kat** (veya g\xfcncel standart katsayısı) artırılır.

## Kanca Kenetlenmesi

D\xfcz uzatmanın sığmadığı kiriş-kolon birleşimleri ve mesnetlerde kenetlenme kanca ile sağlanır:

- **90\xb0 Standart Kanca (G\xf6nye):** B\xfck\xfcm sonrası en az 12\xb7ϕ kadar d\xfcz uzantı bırakılır.
- **135\xb0 Deprem Kancası:** Etriyelerde ve \xe7irozla sargılanmış elemanlarda kullanılır.

> [!WARNING]
> **"90\xb0 b\xfckt\xfcm, bitti" Yanılgısı:** B\xfckme i\xe7 \xe7apının (mandrel \xe7apı) yetersiz olması \xe7elikte mikro \xe7atlaklara ve betonda ezilmeye yol a\xe7ar. TS 500 minimum b\xfckme \xe7apı kurallarına uyulmalıdır.`,subsections:[]},{id:"bindirme-ekleri",title:"Bindirmeli Ekler ve Kuvvet Aktarımı",content:`## Kenetlenme ile Bindirme Arasındaki Fark

- **Kenetlenme:** \xc7elik → Beton (tek \xe7ubuktan betona kuvvet aktarımı)
- **Bindirme Eki:** \xc7elik A → Beton → \xc7elik B (iki donatı arasında beton aracılığıyla kuvvet devri)

Bindirme ekinde iki \xe7ubuk yan yana durduğundan betonda y\xfcksek aderans gerilmeleri oluşur. Bu nedenle bindirme boyu (l0) genellikle kenetlenme boyundan (lb) daha uzundur:

\`\`\`
l0 = α \xd7 lb

α katsayısı aynı kesitte eklenen donatı oranına g\xf6re 1.0 ile 1.5 arasında değişir.
\`\`\`

## Neden Donatılar Şaşırtmalı Eklenmelidir?

T\xfcm donatılar aynı kesitte eklenirse:
- Aderans kuvvetleri aynı b\xf6lgede yığılır ve beton yarılması riski artar.
- Kesit \xe7ok sıkışık hale gelir, beton d\xf6k\xfcm\xfc zorlaşır.
- O kesitte beklenmeyen zayıflama t\xfcm donatıları etkiler.

> [!IMPORTANT]
> TS 500 ve TBDY uyarınca eklerin **şaşırtmalı** yapılması esastır. Aynı kesitte donatıların en fazla %50'sinin eklenmesi tavsiye edilir; aksi halde bindirme boyu artırım katsayısı (α = 1.5) uygulanır.`,subsections:[]},{id:"tbdy-2018-ek-kurallari",title:"TBDY 2018 Donatı Ek Yeri Kuralları",content:`Deprem b\xf6lgelerinde donatı ekleri kritik b\xf6lgelerden uzak tutulmalıdır:

## Kolon Boyuna Donatısı Ekleri

- Kolon sarılma b\xf6lgelerinde (kolon alt ve \xfcst u\xe7larında) tercihen bindirme eki yapılmamalıdır.
- Bindirmeli ekler kolon orta \xfc\xe7te birlik b\xf6lgesinde yapılmalıdır.
- Kolon filiz bindirme b\xf6lgesinde etriye aralığı sıklaştırılmalıdır (sarılma b\xf6lgesi etriye aralığı).

## Kiriş Boyuna Donatısı Ekleri

- Kiriş sarılma b\xf6lgelerinde (mesnetten itibaren 2h mesafede) \xe7ekme donatısı bindirme eki **yapılamaz**.
- \xc7ekme donatısı ekleri a\xe7ıklık ortasında, basın\xe7 donatısı ekleri mesnete yakın yapılmalıdır.

## Mekanik ve Kaynaklı Ekler (Manşonlar)

Yoğun donatılı kolon ve perde u\xe7larında bindirme eki donatı sıkışıklığına yol a\xe7ıyorsa mekanik manşonlu ekler kullanılır:

- **TBDY Koşulu:** Mekanik manşonlu ekler donatının karakteristik kopma dayanımının (ftk) en az 1.25 katını taşıyabilmelidir (Tip 2 / Type 2 manşon).`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`## Uygulama Hataları

1. **\xc7ap b\xfcy\xfcd\xfck\xe7e bindirme boyunu sabit tutmak:** \xd814 ile \xd822 \xe7ubukta aynı 50 cm bindirmeyi kullanmak (\xd822 i\xe7in kenetlenme %57 daha uzundur).
2. **Kiriş mesnet ucunda \xe7ekme donatısı bindirmesi yapmak:** TBDY 2018 B\xf6l\xfcm 7'ye g\xf6re sarılma b\xf6lgesinde \xe7ekme donatısı eki yasaktır.
3. **\xdcst donatı katsayısını g\xf6z ardı etmek:** D\xf6k\xfcm y\xfcksekliği fazla olan kiriş ve radye \xfcst donatılarında lb'yi 1.3 kat b\xfcy\xfctmemek.
4. **Kancaları d\xfcz uzantısız b\xfckmek:** 90\xb0 g\xf6nyeden sonra 12\xb7ϕ d\xfcz uzantı bırakmamak.
5. **Manşonlu eklerde kalitesiz \xfcr\xfcn kullanımı:** \xc7ekme deneyinde \xe7ubuk kopmadan manşondan sıyrılan kalitesiz ekler kullanmak.`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makaledeki kurallar ve form\xfcller aşağıdaki resmi belgelere dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 9, 10, 11)
- **TBDY 2018** — T\xfcrkiye Bina Deprem Y\xf6netmeliği, B\xf6l\xfcm 7 (Betonarme Taşıyıcı Sistemler)
- **TS 708** — Betonarme İ\xe7in \xc7elik Donatı Standartları`,subsections:[]}],references:[{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500 Betonarme Standartı",href:"https://www.tse.org.tr"}],relatedSlugs:["ts500-donati-orani-sinirlari","ts500-egilme-donatisi-hesabi","ts500-kolon-pm-etkilesimi"],tags:["kenetlenme boyu","bindirme eki","aderans","lb","manşon","TBDY bindirme"]}),m({slug:"ts500-egilme-donatisi-hesabi",title:"Eğilme Donatısı Hesabı: Tek ve Çift Donatılı Kesitler (TS 500)",description:"Dikdörtgen betonarme kesitlerde tarafsız eksen, eşdeğer basınç bloğu, tek ve çift donatılı eğilme hesabı adımları ve sayısal örnekler.",image:"/covers/ts500/egilme-hesabi.png",readTime:"12 dk",keywords:["eğilme donatısı","tek donatılı kesit","çift donatılı kesit","tarafsız eksen","eşdeğer basınç bloğu","faydalı yükseklik","moment kapasitesi","Mr","Md","süneklik"],sections:[{id:"egilme-davranisi",title:"Betonarme Kesitlerin Eğilme Davranışı",content:`Bir betonarme kiriş aşağı doğru d\xfcşey y\xfck altında pozitif eğilme momenti g\xf6rd\xfcğ\xfcnde:
- **\xdcst lifler kısalır** → Basın\xe7 gerilmesi oluşur
- **Alt lifler uzar** → \xc7ekme gerilmesi oluşur

Beton \xe7ekmede zayıf olduğu i\xe7in \xe7atlama sonrasında (M > Mcr) alt b\xf6lgedeki \xe7ekme kuvvetinin ana taşıyıcısı boyuna donatıdır.

> [!NOTE]
> Pozitif momentte beton \xfcstte basın\xe7, donatı altta \xe7ekme taşır. Negatif momentte (mesnetlerde) durum tersine d\xf6ner: beton altta basın\xe7, \xfcst boyuna donatı \xe7ekme taşır. Bu nedenle "\xfcst demir / alt demir" ifadesi yerine **"\xe7ekme donatısı / basın\xe7 donatısı"** ifadesini kullanmak daha doğrudur.`,subsections:[]},{id:"temel-kabuller",title:"Eğilme Hesabının Temel Kabulleri",content:`TS 500 taşıma g\xfcc\xfc y\xf6ntemine g\xf6re eğilme hesabındaki temel kabuller:

1. **D\xfczlem Kesit Hipotezi (Bernoulli):** Eğilmeden \xf6nce d\xfcz olan kesitler eğilmeden sonra da d\xfcz kalır (şekil değiştirme dağılımı doğrusaldır).
2. **Aderans Uyumu:** Beton ile donatı arasında tam yapışma vardır ($\varepsilon_s = \varepsilon_c$).
3. **Beton \xc7ekme Dayanımı İhmal Edilir:** Taşıma g\xfcc\xfc hesabında \xe7ekme b\xf6lgesindeki betonun katkısı dikkate alınmaz.
4. **Eşdeğer Basın\xe7 Bloğu:** Basın\xe7 b\xf6lgesindeki betonun gerilme dağılımı $0.85 cdot f_{cd}$ gerilmesine sahip $a = k_1 cdot x$ derinliğinde eşdeğer dikd\xf6rtgen blokla temsil edilir.
5. **Nihai Beton Şekil Değiştirmesi:** Basın\xe7 y\xfcz\xfcndeki betonun ezilme şekil değiştirmesi $\varepsilon_{cu} = 0.003$ alınır.`,subsections:[]},{id:"tek-donatili-hesap",title:"Tek Donatılı Dikdörtgen Kesit Hesabı",content:`"Tek donatılı kesit", eğilme hesabında basın\xe7 donatısına ihtiya\xe7 duyulmadan yalnızca \xe7ekme donatısı ile Md momentinin karşılandığı kesittir (kesitin \xfcst\xfcnde montaj donatısı bulunabilir, fakat hesap modelinde basınca katkısı alınmaz).

## İ\xe7 Kuvvet Dengesi

\`\`\`
\xc7ekme Kuvveti: T = As \xd7 fyd
Beton Basın\xe7 Kuvveti: C = 0.85 \xd7 fcd \xd7 b \xd7 a

ΣN = 0  →  T = C  →  As \xd7 fyd = 0.85 \xd7 fcd \xd7 b \xd7 a
\`\`\`

Buradan eşdeğer basın\xe7 bloğu derinliği (a):

\`\`\`
a = (As \xd7 fyd) / (0.85 \xd7 fcd \xd7 b)
\`\`\`

## Moment Kapasitesi (Mr)

İ\xe7 kuvvet kolu $z = d - a/2$ olmak \xfczere:

\`\`\`
Mr = As \xd7 fyd \xd7 (d - a/2)

Tasarım Şartı: Md ≤ Mr
\`\`\`

> [!IMPORTANT]
> **Faydalı Y\xfckselik ($d$):** Pozitif momentte $d = h - c - phi_{etriye} - phi_{boyuna}/2$ olarak hesaplanır. Moment kapasitesinde $d$'nin etkisi karesel olduğundan, kesit y\xfcksekliğini ($h$) artırmak beton sınıfını artırmaktan daha etkili eğilme kapasitesi sağlar.`,subsections:[]},{id:"sayisal-ornek",title:"Sayısal Örnek: Tek Donatılı Kiriş Hesabı",content:`## Veriler

- Kiriş genişliği: $b = 300	ext{ mm}$
- Kiriş y\xfcksekliği: $h = 600	ext{ mm}$ (Faydalı y\xfcksekliği $d approx 550	ext{ mm}$)
- Beton: C30 ($f_{ck} = 30	ext{ MPa} \rightarrow f_{cd} = 20	ext{ MPa}$)
- Donatı: B420C ($f_{yk} = 420	ext{ MPa} \rightarrow f_{yd} = 365.2	ext{ MPa}$)
- Tasarım Momenti: $M_d = 180	ext{ kNm}$ ($180 	imes 10^6	ext{ Nmm}$)

## 1. Gerekli Donatı Alanı ($A_s$) Hesabı

\`\`\`
Md = As \xd7 fyd \xd7 [d - (As \xd7 fyd) / (2 \xd7 0.85 \xd7 fcd \xd7 b)]

180 \xd7 10⁶ = As \xd7 365.2 \xd7 [550 - (As \xd7 365.2) / (2 \xd7 0.85 \xd7 20 \xd7 300)]
\`\`\`

İkinci derece denklem \xe7\xf6z\xfcld\xfcğ\xfcnde:
**$A_{s,	ext{hesap}} approx 956	ext{ mm}^2$**

## 2. Donatı Se\xe7imi

4\xd818 se\xe7ilsin ($A_s = 4 	imes 254 = 1016	ext{ mm}^2$):

\`\`\`
a = (1016 \xd7 365.2) / (0.85 \xd7 20 \xd7 300) ≈ 72.8 mm
z = 550 - 72.8 / 2 = 513.6 mm
Mr = 1016 \xd7 365.2 \xd7 513.6 = 190.5 \xd7 10⁶ Nmm = 190.5 kNm

Mr (190.5 kNm) ≥ Md (180 kNm)  ✓ G\xdcVENLİ
\`\`\`

## 3. Donatı Oranı Kontrol\xfc

\`\`\`
ρ = 1016 / (300 \xd7 550) = 0.00616 (%0.62)
ρmin = 0.8 \xd7 fctd / fyd = 0.8 \xd7 1.28 / 365.2 = 0.0028 (%0.28)

ρmin (%0.28) ≤ ρ (%0.62) ≤ ρmax (%1.5–2.0)  ✓ UYGUN
\`\`\``,subsections:[]},{id:"cift-donatili-kesit",title:"Çift Donatılı Kesit Hesabı",content:`Kiriş boyutları ($b 	imes h$) mimari kısıtlar nedeniyle b\xfcy\xfct\xfclemiyor ve tek donatılı kesitin maksimum donatı sınırı ($\rho_{max}$) aşılıyorsa kesite **basın\xe7 donatısı ($A_s'$)** eklenerek \xe7ift donatılı hesap yapılır.

## Ne Zaman \xc7ift Donatılı Hesap Yapılır?

- $M_d > M_{r,max}$ (Tek donatılı kesitin taşıyabileceği maksimum momenti aşıyorsa)
- Sehim kontrol\xfc gereği s\xfcnekliği ve zamana bağlı s\xfcnme sehimlerini azaltmak istendiğinde
- Deprem b\xf6lgelerinde \xe7ift y\xf6nl\xfc moment değişimleri (alt ve \xfcst y\xfczde tersinir momentler) nedeniyle

## İki Par\xe7alı Hesap Yaklaşımı

\`\`\`
1. Par\xe7a: Dikd\xf6rtgen beton basın\xe7 bloğu + As1 \xe7ekme donatısı (Mr1 = Mr,max)
2. Par\xe7a: As' basın\xe7 donatısı + As2 \xe7ekme donatısı (Mr2 = Md - Mr,max)

Toplam \xc7ekme Donatısı: As = As1 + As2
Toplam Basın\xe7 Donatısı: As' (Basın\xe7 donatısının aktığı kontrol edilir: εs' ≥ εyd)
\`\`\`

> [!WARNING]
> Basın\xe7 donatısının hesaba katılabilmesi i\xe7in donatının etriyelerle burkulmaya karşı iyice sarılması gereklidir. \xc7ift donatılı kirişlerde basın\xe7 donatısının bulunduğu b\xf6lgede etriye aralığı sıklaştırılmalıdır.`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`## Tasarım Hataları

1. **Montaj donatısını hesap dışı tutup basın\xe7 donatısı yok sanmak:** Fiziksel donatı ile hesap modelini karıştırmak.
2. **Kiriş y\xfcksekliği yerine genişliğini artırmaya \xe7alışmak:** Moment kapasitesinde $d$'nin etkisi karesel ($d^2$), $b$'nin etkisi doğrusaldır. Kesit y\xfcksekliğini artırmak \xe7ok daha etkilidir.
3. **Beton sınıfı artışının eğilme kapasitesini aynı oranda artıracağını sanmak:** Tek donatılı kirişte kapasiteyi belirleyen ana unsur donatı alanı ve $fyd$'dir. Beton sınıfını C25'ten C35'e \xe7ıkarmak kiriş eğilme kapasitesini sadece %3–5 civarında etkiler (i\xe7 kuvvet kolunu hafif\xe7e b\xfcy\xfct\xfcr).
4. **Donatı akma kontrol\xfcn\xfc yapmadan $T = A_s cdot f_{yd}$ yazmak:** Denge \xfcst\xfc kesitlerde donatı akmayabilir.`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makaledeki hesap y\xf6ntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 7.1, 7.2)
- **TBDY 2018** — T\xfcrkiye Bina Deprem Y\xf6netmeliği, B\xf6l\xfcm 7 (Kiriş Eğilme Tasarımı)
- **TS EN 1992-1-1 (Eurocode 2)** — Betonarme Kesit Kapasite Hesap Y\xf6ntemleri`,subsections:[]}],references:[{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500 Betonarme Standartı",href:"https://www.tse.org.tr"}],relatedSlugs:["ts500-tablali-kiris","ts500-donati-orani-sinirlari","ts500-surekli-kiris-moment-dagilimi"],tags:["eğilme donatısı","tek donatılı kesit","çift donatılı kesit","moment kapasitesi","Mr"]}),m({slug:"ts500-tablali-kiris",title:"Tablalı Kiriş (T-Kiriş) Hesabı ve Efektif Genişlik",description:"Döşeme ile birlikte dökülen betonarme T-kirişlerde efektif tabla genişliği (beff) hesabı, pozitif ve negatif moment durumlarında kesit davranışı.",image:"/covers/ts500/tablali-kiris.png",readTime:"11 dk",keywords:["T-kiriş","tablalı kiriş","efektif genişlik","beff","gövde genişliği","bw","tabla kalınlığı","hf","pozitif moment","negatif moment","kesme gecikmesi"],sections:[{id:"t-kiris-davranisi",title:"Tablalı Kiriş (T-Kiriş) Davranışı Nedir?",content:`Yerinde d\xf6kme betonarme binalarda kirişler ve d\xf6şemeler birlikte (monolitik) d\xf6k\xfcl\xfcr. A\xe7ıklık ortasında pozitif moment etkisi altında kirişin \xfcst lifleri basın\xe7, alt lifleri \xe7ekme gerilmesi taşır.

Bu durumda d\xf6şemenin belirli bir genişliği, kirişle birlikte \xe7alışarak **basın\xe7 başlığı (tabla)** g\xf6revi g\xf6r\xfcr:

- Kesit **T-şekilli** (i\xe7 kirişlerde) veya **L-şekilli** (kenar kirişlerde) olarak davranır.
- Basın\xe7 b\xf6lgesi alanı b\xfcy\xfcd\xfcğ\xfc i\xe7in tarafsız eksen yukarı kayar.
- İ\xe7 kuvvet kolu ($z = d - a/2$) b\xfcy\xfcr ve kirişin moment taşıma kapasitesi artar.

> [!NOTE]
> Pozitif moment altında d\xf6şemenin basınca katılması kirişe b\xfcy\xfck bir dayanım avantajı sağlar. Ancak bu avantaj yalnızca **pozitif moment** (a\xe7ıklık ortasında) ge\xe7erlidir.`,subsections:[]},{id:"efektif-genislik",title:"Efektif Tabla Genişliği (beff) ve Kesme Gecikmesi",content:`D\xf6şemenin tamamı kirişle eşit gerilmeyle basınca katılmaz. Kiriş g\xf6vdesinden uzaklaştık\xe7a d\xf6şemedeki gerilme azalır (**Kesme Gecikmesi / Shear Lag**).

Bu nedenle hesaplarda d\xf6şemenin tamamı değil, \xfcniform gerilme taşıdığı varsayılan **efektif tabla genişliği ($b_{eff}$)** kullanılır.

## TS 500 Efektif Tabla Genişliği Kuralları

İ\xe7 T-kirişlerde etkili tabla genişliği:

\`\`\`
beff = bw + 2 \xd7 b1

b1 = min(0.1 \xd7 lp, 6 \xd7 hf, b0 / 2)
\`\`\`

- **bw:** Kiriş g\xf6vde genişliği
- **hf:** Tabla (d\xf6şeme) kalınlığı
- **lp:** Kiriş momenti sıfır noktaları arasındaki uzaklık (a\xe7ıklık boyu ile ilişkili)
- **b0:** Komşu kiriş g\xf6vdeleri arasındaki net a\xe7ıklık

Kenar L-kirişlerde ise genişleme tek y\xf6nde alınır:

\`\`\`
beff = bw + b1

b1 = min(0.05 \xd7 lp, 6 \xd7 hf, b0 / 2)
\`\`\`

> [!WARNING]
> Efektif tabla genişliğini ($b_{eff}$) hesapsız aşırı b\xfcy\xfck almak g\xfcvensiz sonu\xe7lar doğurur. \xc7\xfcnk\xfc basın\xe7 bloğunu yapay bi\xe7imde sığ g\xf6sterip moment kapasitesini olduğundan fazla hesaplama riskini getirir.`,subsections:[]},{id:"t-kiris-hesap-adimlari",title:"T-Kiriş Eğilme Hesabı Adımları",content:`T-kiriş hesabında ilk sorulması gereken soru: **"Basın\xe7 bloğu tamamen tabla i\xe7inde mi kalıyor, yoksa g\xf6vdeye iniyor mu?"**

## Karar Algoritması

1. **Varsayım:** \xd6nce basın\xe7 bloğunun tabla i\xe7inde kaldığı varsayılır ($a le h_f$).
2. Kesit $b_{eff}$ genişliğinde dikd\xf6rtgen kesit gibi \xe7\xf6z\xfcl\xfcr:
   \`\`\`
   a = (As \xd7 fyd) / (0.85 \xd7 fcd \xd7 beff)
   \`\`\`
3. **Kontrol:**
   - **Eğer $a le h_f$ ise:** Varsayım DOĞRUDUR. Kesit $b_{eff}$ genişliğindeki dikd\xf6rtgen kesit form\xfclleriyle hesaplanır.
   - **Eğer $a > h_f$ ise:** Varsayım YANLIŞTIR. Basın\xe7 bloğu g\xf6vdeye taşmıştır; ger\xe7ek T-kiriş form\xfcllerine ge\xe7ilir.

## Basın\xe7 Bloğu G\xf6vdeye Taşarsa ($a > h_f$)

Beton basın\xe7 kuvveti iki par\xe7aya ayrılır:
- **Tabla \xc7ıkmalarının Basıncı ($C_f$):** $C_f = 0.85 cdot f_{cd} cdot (b_{eff} - b_w) cdot h_f$
- **G\xf6vde Basıncı ($C_w$):** $C_w = 0.85 cdot f_{cd} cdot b_w cdot a$

\`\`\`
Denge: As \xd7 fyd = Cf + Cw
Moment Kapasitesi: Mr = Cf \xd7 (d - hf/2) + Cw \xd7 (d - a/2)
\`\`\``,subsections:[]},{id:"sayisal-ornek",title:"Sayısal Örnek: T-Kiriş Hesabı",content:`## Veriler

- Efektif tabla genişliği: $b_{eff} = 1200	ext{ mm}$
- G\xf6vde genişliği: $b_w = 300	ext{ mm}$
- D\xf6şeme kalınlığı: $h_f = 120	ext{ mm}$
- Faydalı y\xfckseklik: $d = 550	ext{ mm}$
- Beton: C30 ($f_{cd} = 20	ext{ MPa}$)
- Donatı: B420C ($f_{yd} = 365.2	ext{ MPa}$)
- \xc7ekme donatısı: $A_s = 1800	ext{ mm}^2$ (\xf6r. 6\xd820)

## Hesap

\`\`\`
a = (1800 \xd7 365.2) / (0.85 \xd7 20 \xd7 1200) ≈ 32.2 mm
\`\`\`

## Kontrol

$a = 32.2	ext{ mm} le h_f = 120	ext{ mm}$  ✓ **Basın\xe7 bloğu tamamen tabla i\xe7indedir.**

## Moment Kapasitesi

\`\`\`
z = 550 - 32.2 / 2 = 533.9 mm
Mr = 1800 \xd7 365.2 \xd7 533.9 = 350.9 \xd7 10⁶ Nmm ≈ 350.9 kNm
\`\`\`

> [!NOTE]
> Aynı kesit $b_w = 300	ext{ mm}$ olarak (tablasız dikd\xf6rtgen) hesaplansaydı $a approx 128.9	ext{ mm}$ \xe7ıkardı ve moment kapasitesi \xe7ok daha d\xfcş\xfck olurdu. $b_{eff} = 1200	ext{ mm}$ basın\xe7 bloğunu $32.2	ext{ mm}$'ye d\xfcş\xfcrerek moment kolunu ($z$) b\xfcy\xfctm\xfcşt\xfcr.`,subsections:[]},{id:"negatif-momentte-t-kiris",title:"Negatif Moment Bölgesinde T-Kiriş Davranışı",content:`S\xfcrekli kirişlerin mesnet b\xf6lgelerinde negatif moment ($M_d < 0$) oluşur:

- \xdcst lifler uzar (\xe7ekme) → \xdcst donatı \xe7ekme taşır
- Alt lifler kısalır (basın\xe7) → Alt beton basın\xe7 taşır

D\xf6şeme (tabla) \xfcst tarafta kaldığı i\xe7in \xe7ekme b\xf6lgesindedir. Betonun \xe7ekme dayanımı ihmal edildiğinden **d\xf6şeme basın\xe7 taşımaz.**

> [!IMPORTANT]
> **Negatif moment b\xf6lgesinde (mesnetlerde) T-kirişler $b_w 	imes h$ boyutlarında sıradan DİKD\xd6RTGEN KESİT olarak hesaplanır.** Efektif tabla genişliği ($b_{eff}$) hesaba katılmaz!

Bu nedenle kiriş mesnet tasarımlarında g\xf6vde genişliği ($b_w$) ve alt beton basın\xe7 kapasitesi belirleyici olur.`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`## Uygulama ve Hesap Hataları

1. **Mesnet b\xf6lgesinde de $b_{eff}$ kullanmak:** Negatif momentte tabla \xe7ekme tarafındadır; mesnette $b_{eff}$ kullanmak g\xfcvensiz hesap yaratır.
2. **D\xf6şeme genişliğinin tamamını $b_{eff}$ almak:** Kesme gecikmesini g\xf6z ardı etmek.
3. **$a > h_f$ durumunda basit dikd\xf6rtgen form\xfcl\xfcn\xfc kullanmak:** Eşdeğer basın\xe7 alanını yanlış hesaplamak.
4. **Kenar kirişte (L-kiriş) i\xe7 kiriş katsayılarını kullanmak:** L-kirişte tabla \xe7ıkması tek taraflıdır ($b_1 = 0.05 cdot l_p$).
5. **G\xf6vde donatısını yerleştirecek genişliği kontrol etmemek:** $b_{eff}$ sayesinde \xfcst basın\xe7 bloğu sığlaşsa da, g\xf6vdede ($b_w$) alt \xe7ekme donatılarının sıtmama riski vardır.`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makaledeki hesap y\xf6ntemi ve katsayılar aşağıdaki standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 7.3)
- **TBDY 2018** — T\xfcrkiye Bina Deprem Y\xf6netmeliği, B\xf6l\xfcm 7
- **TS EN 1992-1-1 (EC2)** — Flanged Sections Design`,subsections:[]}],references:[{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500 Betonarme Standartı",href:"https://www.tse.org.tr"}],relatedSlugs:["ts500-egilme-donatisi-hesabi","ts500-surekli-kiris-moment-dagilimi","ts500-donati-orani-sinirlari"],tags:["T-kiriş","tablalı kiriş","efektif genişlik","beff","pozitif moment","negatif moment"]}),m({slug:"ts500-surekli-kiris-moment-dagilimi",title:"Sürekli Kiriş Moment Dağılımı ve Açıklık Momenti",description:"Sürekli betonarme kirişlerde elastik analiz, yük kombinasyonları, mesnet ve açıklık momentlerinin belirlenmesi, moment yeniden dağılımı (redistribution) ve Hardy Cross farkı.",image:"/covers/ts500/kesme-burulma.png",readTime:"12 dk",keywords:["sürekli kiriş","moment dağılımı","açıklık momenti","mesnet momenti","moment yeniden dağılımı","Hardy Cross","yük desenleri","zarf eğrisi","plastik mafsal"],sections:[{id:"Iki-kavram-ayrimi",title:"Hardy Cross ve Moment Yeniden Dağılımı Ayrımı",content:`M\xfchendislik pratiğinde "moment dağılımı" ifadesi iki farklı kavram i\xe7in kullanılır:

1. **Hardy Cross Y\xf6ntemi (Moment Distribution Method):** Hiperstatik sistemlerde d\xfcğ\xfcm noktası rijitliklerine g\xf6re mesnet momentlerini dengeleyen **matematiksel bir yapısal analiz y\xf6ntemidir.**
2. **Moment Yeniden Dağılımı (Moment Redistribution):** Doğrusal elastik analiz sonucunda elde edilen mesnet momentlerinin, betonarme kesitlerin s\xfcnekliğine (plastik d\xf6nme kapasitesine) dayanarak belirli sınırlar dahilinde azaltılıp a\xe7ıklık momentlerine aktarılması **y\xf6netmelik esaslı bir tasarım kararıdır.**

> [!IMPORTANT]
> **Hardy Cross ≠ Moment Yeniden Dağılımı.** Hardy Cross mesnet momentlerini elastik olarak hesaplar. Moment yeniden dağılımı ise hesaptan sonra donatı tasarımında moment zirvelerini tıraşlamak i\xe7in uygulanır.`,subsections:[]},{id:"surekli-kiris-davranisi",title:"Sürekli Kirişlerin Statik Davranışı",content:`Tek a\xe7ıklıklı basit mesnetli bir kirişte a\xe7ıklık ortası momenti $M = q cdot L^2 / 8$ iken, s\xfcrekli kirişlerde mesnetler d\xf6nmeye karşı d\xf6nme rijitliği sunduğundan:

- **Mesnetlerde negatif moment ($M_d < 0$)** oluşur (\xfcst lifler \xe7ekmede, alt lifler basında).
- **A\xe7ıklıkta pozitif moment ($M_d > 0$)** oluşur (alt lifler \xe7ekmede, \xfcst lifler basında).
- Mesnet momentleri a\xe7ıklık momentini k\xfc\xe7\xfclt\xfcr; b\xf6ylece s\xfcrekli kirişler basit kirişlere g\xf6re **daha k\xfc\xe7\xfck a\xe7ıklık momenti ve daha az sehim** yapar.

## D\xfcşey Y\xfck Y\xfckleme Desenleri (Zarf Hesabı)

S\xfcrekli kirişte en elverişsiz momentleri bulmak i\xe7in sabit y\xfckler ($g$) t\xfcm a\xe7ıklıklara uygulanırken, hareketli y\xfckler ($q$) farklı a\xe7ıklık kombinasyonlarında y\xfcklenir:

| Hedeflenen Maksimum Moment | Hareketli Y\xfck ($q$) D\xfczeyi |
|----------------------------|----------------------------|
| **En b\xfcy\xfck a\xe7ıklık momenti ($M_{max,a\xe7ıklık}$)** | İlgili a\xe7ıklık + birer a\xe7ıklık atlamalı y\xfcklenir |
| **En b\xfcy\xfck mesnet momenti ($M_{max,mesnet}$)** | Mesnedin sağındaki ve solundaki a\xe7ıklıklar birlikte y\xfcklenir |
| **En b\xfcy\xfck mesnet kesme kuvveti ($V_{max}$)** | Komşu a\xe7ıklıklar y\xfckl\xfc tutulur |

Bu y\xfckleme kombinasyonları sonucunda t\xfcm kesitler i\xe7in **Moment Zarf Eğrisi (Moment Envelope)** elde edilir.`,subsections:[]},{id:"ts500-yaklasik-katsayilar",title:"TS 500 Yaklaşık Moment Katsayıları Yöntemi",content:`Bilgisayar analizi yapılmayan basit yapı sistemlerinde TS 500 belirli şartlar altında elastik analiz yerine pratik moment katsayılarının kullanılmasına izin verir.

## Şartlar

1. En az 2 veya daha fazla a\xe7ıklık bulunmalıdır.
2. A\xe7ıklıklar arasındaki fark %20'yi ge\xe7memelidir ($L_{max} le 1.20 cdot L_{min}$).
3. Hareketli y\xfck, sabit y\xfck\xfcn iki katından fazla olmamalıdır ($q le 2g$).
4. Y\xfckler yayılı y\xfck olmalıdır.

## Katsayılar (Yaklaşık Tipik Değerler)

\`\`\`
M = α \xd7 P_toplam \xd7 L

- Kenar a\xe7ıklık ortası: ~ 1/11 (veya 1/14)
- İ\xe7 a\xe7ıklık ortası: ~ 1/16
- İlk i\xe7 mesnet: ~ -1/9 (veya -1/10)
- Diğer i\xe7 mesnetler: ~ -1/11
\`\`\`

> [!WARNING]
> Deprem binalarında d\xfcşey y\xfck katsayıları tek başına yeterli değildir. TBDY 2018 gereği depremli y\xfck birleşimlerinden ($1.4G + 1.6Q$, $G + Q pm E$) gelen tasarım moment zarfları esas alınmalıdır.`,subsections:[]},{id:"moment-yeniden-dagilimi",title:"Moment Yeniden Dağılımı (Moment Redistribution)",content:`Lineer elastik analizde mesnet \xfcst\xfcnde y\xfcksek negatif moment zirveleri ($M_{mesnet}$) oluşur. Bu mesnetlerde donatı \xe7ok sıkışabilir.

Betonarme kesit yeterince s\xfcnekse (denge altı kesit), mesnet donatısı akmaya başladığında orada bir **plastik mafsal** oluşur ve mesnet daha fazla moment alamaz. Y\xfck arttık\xe7a ek moment a\xe7ıklığa aktarılır.

## TS 500 Moment Yeniden Dağılım Sınırı

TS 500'de mesnet momentleri maksimum **%15** (veya s\xfcneklik koşuluna g\xf6re tanımlı oran) oranında azaltılabilir:

\`\`\`
M_mesnet,tasarım = (1 - δ) \xd7 M_mesnet,elastik     (δ ≤ 0.15)
\`\`\`

**Kural:** Mesnet momenti ne kadar azaltılırsa ($Delta M$), denge gereği a\xe7ıklık momenti de aynı miktarda artırılmalıdır:

\`\`\`
M_a\xe7ıklık,yeni = M_a\xe7ıklık,elastik + ΔM
\`\`\`

> [!IMPORTANT]
> **S\xfcneklik Şartı:** Moment yeniden dağılımı yapılabilmesi i\xe7in mesnet kesitinin **s\xfcnek** olması zorunludur ($\rho - \rho' le 0.5 cdot \rho_b$). Gevrek kesitlerde plastik d\xf6nme ger\xe7ekleşmeyeceği i\xe7in moment yeniden dağılımı YASAKTIR.`,subsections:[]},{id:"sayisal-ornek",title:"Sayısal Örnek: Mesnet Momenti Tıraşlama",content:`## Veriler

- Elastik analiz mesnet momenti: $M_{	ext{mesnet}} = -200	ext{ kNm}$
- Elastik analiz a\xe7ıklık momenti: $M_{	ext{a\xe7ıklık}} = +120	ext{ kNm}$
- S\xfcneklik kontrol\xfc yapıldı: Mesnet kesiti s\xfcnek ($delta = 0.15$ kullanılabilir).

## Moment Yeniden Dağılımı Hesabı

1. **Mesnet Momentinin Azaltılması (%15):**
   \`\`\`
   ΔM = 200 \xd7 0.15 = 30 kNm
   M_mesnet,yeni = 200 - 30 = -170 kNm
   \`\`\`

2. **A\xe7ıklık Momentinin Artırılması:**
   \`\`\`
   M_a\xe7ıklık,yeni = 120 + 30 = +150 kNm
   \`\`\`

## Sonu\xe7

Mesnet \xfcst\xfcndeki donatı sıkışıklığı azaltılmış, $200	ext{ kNm}$ yerine $170	ext{ kNm}$'ye g\xf6re mesnet donatısı konulmuş, a\xe7ıklık donatısı ise $150	ext{ kNm}$'ye g\xf6re boyutlandırılmıştır. Total denge korunmuştur.`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`## Tasarım Hataları

1. **Mesnet momentini azaltıp a\xe7ıklık momentini artırmayı unutmak:** Statik dengeyi bozarak yapıyı g\xfcvensiz hale getirmek.
2. **Gevrek veya aşırı donatılı kesitlerde moment redistrib\xfcsyonu yapmak:** Donatı akmadan beton ezileceği i\xe7in yapı gevrek kırılır.
3. **Hardy Cross y\xf6ntemi ile moment redistrib\xfcsyonunu aynı şey sanmak:** Hardy Cross bir analiz y\xf6ntemidir, redistrib\xfcsyon bir boyutlandırma kararıdır.
4. **Sadece sabit y\xfck analizine g\xf6re donatı yerleştirmek:** Hareketli y\xfcklerin en elverişsiz desenlerini (zarf eğrisini) hesaba katmamak.`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makaledeki hesap y\xf6ntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 6.2, 7.4)
- **TBDY 2018** — T\xfcrkiye Bina Deprem Y\xf6netmeliği, B\xf6l\xfcm 7
- **TS EN 1992-1-1 (EC2)** — Linear Analysis with Limited Redistribution`,subsections:[]}],references:[{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500 Betonarme Standartı",href:"https://www.tse.org.tr"}],relatedSlugs:["ts500-konsol-kiris-tasarimi","ts500-egilme-donatisi-hesabi","ts500-tablali-kiris"],tags:["sürekli kiriş","moment dağılımı","açıklık momenti","mesnet momenti","Hardy Cross","redistribution"]}),m({slug:"ts500-konsol-kiris-tasarimi",title:"Konsol (Konsollu Kiriş) Tasarımı",description:"Balkon, çıkma ve kanopi gibi konsol elemanlarda moment ve kesme diyagramları, üst donatı hesabı, ankraj kuralları, sehim hassasiyeti ve şantiyede sık yapılan hatalar.",image:"/covers/ts500/egilme-donatisi.png",readTime:"11 dk",keywords:["konsol kiriş","konsol tasarımı","balkon kirişi","üst donatı","ankastre mesnet","konsol sehmi","ankraj","parapet yükü","TBDY konsol"],sections:[{id:"konsol-davranisi",title:"Konsol Kirişlerin Ana Statik Davranışı",content:`Bir ucu mesnetlenmiş (ankastre), diğer ucu serbest olan taşıyıcı elemanlara **konsol** denir (balkon kirişleri, bina \xe7ıkmaları, sa\xe7aklar ve kanopiler).

D\xfcşey yer\xe7ekimi y\xfckleri altında konsollarda:
- **Maksimum moment ($M_{max}$) sabit ankastre mesnette** oluşur ($M_d < 0$).
- **Maksimum kesme kuvveti ($V_{max}$) sabit ankastre mesnette** oluşur.
- Serbest u\xe7ta moment ve kesme sıfırdır.

## En Kritik Donatı Kuralı: \xc7ekme \xdcsttedir!

Eğilme altında konsolun \xfcst lifleri uzar (\xe7ekme), alt lifleri kısalır (basın\xe7).

> [!IMPORTANT]
> **Konsol kiriş ve d\xf6şemelerde ana \xe7ekme donatısı \xdcSTTEDİR.**
> Şantiyelerde yapılan en \xf6l\xfcmc\xfcl hata, konsol \xfcst donatısının \xfczerine basılarak aşağı kayması veya alt y\xfczeye yakın yerleştirilmesidir. \xc7ekme donatısı aşağı kayarsa faydalı y\xfckseklik ($d$) ciddi şekilde k\xfc\xe7\xfcl\xfcr ve konsol aniden g\xf6\xe7ebilir.`,subsections:[]},{id:"statik-formuller",title:"Konsol Moment ve Kesme Formülleri",content:`Konsol boyu $L$ olmak \xfczere ankastre mesnetteki tasarım i\xe7 kuvvetleri:

## 1. D\xfczg\xfcn Yayılı Y\xfck ($w$)

\`\`\`
Mesnet Momenti: M_sabit = - (w \xd7 L\xb2) / 2
Mesnet Kesmesi: V_sabit = w \xd7 L
\`\`\`

## 2. Serbest U\xe7 Noktasal Y\xfck\xfc ($P$) — Parapet/Korkuluk

\`\`\`
Mesnet Momenti: M_sabit = - P \xd7 L
Mesnet Kesmesi: V_sabit = P
\`\`\`

## 3. Kombine Y\xfck (D\xfczg\xfcn Yayılı Y\xfck + U\xe7 Parapet Y\xfck\xfc)

\`\`\`
M_sabit = - [ (w \xd7 L\xb2) / 2 + P \xd7 L ]
V_sabit = w \xd7 L + P
\`\`\`

> [!WARNING]
> **Parapet Y\xfck\xfc Uyarısı:** Balkon ucundaki parapet veya duvar y\xfck\xfcn\xfc t\xfcm konsola eşit yayılı ($w$) olarak dağıtmak g\xfcvensiz hesap yaratabilir. U\xe7 y\xfck\xfcn\xfcn kolu ($L$) maksimum olduğundan moment bileşeni doğrudan $P cdot L$ olarak eklenmelidir.`,subsections:[]},{id:"egilme-ve-ankraj",title:"Konsol Eğilme Tasarımı ve Ankraj Zorunluluğu",content:`Konsol mesnet kesitinde ($b 	imes h$) \xfcst donatı hesabı yapılır:

\`\`\`
d = h - c_\xfcst - φ_etriye - φ_boyuna / 2
a = (As \xd7 fyd) / (0.85 \xd7 fcd \xd7 b)
Mr = As \xd7 fyd \xd7 (d - a/2)  ≥  Md
\`\`\`

## Ankraj ve Arka A\xe7ıklığa Uzatma Kuralları

Konsol \xfcst donatısı en b\xfcy\xfck \xe7ekme gerilmesini tam mesnet y\xfcz\xfcnde taşır. Donatının mesnet y\xfcz\xfcnde bitirilmesi durumunda kenetlenme sağlanamaz ve eleman g\xf6\xe7er.

- **Arka A\xe7ıklık Varsa:** Konsol \xfcst donatısı mesnetten sonra i\xe7 a\xe7ıklığın i\xe7ine en az **$1.5 cdot L_{	ext{konsol}}$** veya **kenetlenme boyu ($l_b$)** kadar kesintisiz uzatılmalıdır.
- **Perde/Kolon Bağlantısı Varsa:** \xdcst donatı kolon veya perde i\xe7ine girerek **90\xb0 standart kanca** ile kenetlenmelidir ($l_b$ boyu sağlanmalıdır).`,subsections:[]},{id:"konsol-sehmi-ve-uzunluk",title:"Konsol Sehmi ve Boyut Hassasiyeti ($L^4$ Etkisi)",content:`Konsollar sehim a\xe7ısından en hassas betonarme elemanlardır. Yayılı y\xfck altında elastik u\xe7 sehmi:

\`\`\`
δ_tip = (w \xd7 L⁴) / (8 \xd7 E \xd7 I)
\`\`\`

Sehim **konsol boyunun d\xf6rd\xfcnc\xfc kuvvetiyle ($L^4$)** orantılıdır!

## Boyut Artışının Sehime Etkisi

Konsol boyu $L = 1.50	ext{ m}$'den $L = 2.00	ext{ m}$'ye \xe7ıkarıldığında (%33 uzama):

- **Moment Artışı:** $(2.00 / 1.50)^2 = 1.78$ → Moment **%78 artar.**
- **Sehim Artışı:** $(2.00 / 1.50)^4 = 3.16$ → Sehim **3.16 katına \xe7ıkar (%216 artış)!**

> [!IMPORTANT]
> **Sehim \xc7\xf6z\xfcm\xfc Donatı Değil, Y\xfcksekliktir ($h$):**
> Konsol sehimini \xe7\xf6zmek i\xe7in donatıyı artırmak yetersiz kalır. Atalet momenti $I propto h^3$ olduğundan sehim problemleri ancak **kiriş/d\xf6şeme y\xfcksekliğini ($h$) artırarak** veya arka mesnet rijitliğini iyileştirerek \xe7\xf6z\xfcl\xfcr.`,subsections:[]},{id:"tbdy-2018-konsol-kurallari",title:"TBDY 2018 Deprem Yönetmeliği Konsol Kuralları",content:`TBDY 2018 B\xf6l\xfcm 7 uyarınca d\xfcşey deprem etkisi altındaki konsollar i\xe7in \xf6zel kurallar ge\xe7erlidir:

1. **D\xfcşey Deprem İvmesi Etkisi:** Konsol elemanlar d\xfcşey deprem ivmesinden ($E_z$) doğrudan etkilenir. D\xfcşey deprem y\xfck\xfc birleşimlerinde donatı hesabı yapılmalıdır.
2. **Tersinir Y\xfck Durumu:** R\xfczg\xe2r emmesi veya d\xfcşey ivme nedeniyle konsolda ters y\xf6nde moment oluşma riski varsa alt y\xfczeye de emniyet donatısı konulmalıdır.
3. **Sehpa Zorunlulukları:** Konsol \xfcst donatılarının d\xf6k\xfcm sırasında aşağı \xe7\xf6kmesini \xf6nlemek i\xe7in şantiyede rijit **donatı sehpaları** kullanılmalıdır.`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`## Şantiye ve Tasarım Hataları

1. **\xdcst donatının alta \xe7\xf6kmesi:** Donatı sehpası konulmaması veya usta/iş\xe7i basması sonucu pas payının 3 cm yerine 10 cm'ye \xe7ıkması ve $d$'nin k\xfc\xe7\xfclmesi.
2. **Konsol donatısını kolon y\xfcz\xfcnde kesmek:** Ankraj/kenetlenme boyunu ($l_b$) bırakmamak.
3. **Balkon ucundaki parapet y\xfck\xfcn\xfc unutup sadece d\xf6şeme y\xfck\xfcyle hesap yapmak.**
4. **Konsol boyunu mimari istekle uzatıp y\xfcksekliği ($h$) değiştirmemek:** Şiddetli sehim ve sarkma problemlerine yol a\xe7mak.
5. **Alt donatıyı sıfırlamak:** Tersinir y\xfckler ve yapım aşaması i\xe7in konsol altında da minimum donatı bulunmalıdır.`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makaledeki hesap y\xf6ntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 6.3, 7.2)
- **TBDY 2018** — T\xfcrkiye Bina Deprem Y\xf6netmeliği, B\xf6l\xfcm 7 (D\xfcşey Deprem Etkisi)
- **TS EN 1992-1-1 (EC2)** — Cantilever Design and Deflection`,subsections:[]}],references:[{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500 Betonarme Standartı",href:"https://www.tse.org.tr"}],relatedSlugs:["ts500-surekli-kiris-moment-dagilimi","ts500-egilme-donatisi-hesabi","ts500-kiris-sehim-kontrolu"],tags:["konsol kiriş","konsol tasarımı","balkon kirişi","üst donatı","ankraj","sehim","L4 etkisi"]}),m({slug:"ts500-kesme-donatisi-etriyer",title:"Kesme Donatısı ve Etriye Tasarımı: TS 500 Kapsamlı Rehberi",description:"Eğik çatlak mekanizması, beton ve etriye kesme katkıları (Vc, Vw, Vr), etriye aralığı hesabı, TBDY 2018 sarılma bölgesi ve kesme kapasitesi sınırları.",image:"/covers/ts500/kesme-burulma.png",readTime:"12 dk",keywords:["kesme donatısı","etriye","Vcr","Vc","Vw","Vr","Ve","sarılma bölgesi","etriye aralığı","çift kollu etriye","TBDY kesme"],sections:[{id:"kesme-gocmesi-neden-kritiktir",title:"Kesme Göçmesi Neden Eğilmeden Daha Kritiktir?",content:`Eğilme g\xf6\xe7mesi iyi detaylandırılmış bir betonarme kirişte \xe7oğunlukla donatı akması, b\xfcy\xfck \xe7atlaklar ve belirgin deformasyonla uyarılı olarak ger\xe7ekleşir (**s\xfcnek kırılma**).

Kesme g\xf6\xe7mesi ise:
- Daha **ani ve uyarısız** meydana gelir.
- Eğik \xe7ekme gerilmeleri nedeniyle **gevrek kırılma** ile sonu\xe7lanır.
- Donatı akmadan betonun ansızın ayrılmasına yol a\xe7abilir.

> [!IMPORTANT]
> **Deprem M\xfchendisliği İlkesi:** Kiriş ve kolonların eğilmede s\xfcnek davranarak enerji yutmasına izin verilmelidir; ancak yapının kesme g\xf6\xe7mesiyle aniden yıkılması \xf6nlenmelidir (**Kapasite Tasarımı**).`,subsections:[]},{id:"kesme-mekanizmasi",title:"Betonarmede Kesme Taşınma Mekanizmaları",content:`Kesme kuvveti ($V_d$) betonarme eleman i\xe7inde tek bir mekanizmayla taşınmaz. Başlıca katkılar:

1. **\xc7atlamamış Beton Basın\xe7 B\xf6lgesi:** Basın\xe7 bloku i\xe7indeki kesme gerilmeleri
2. **Agrega Kenetlenmesi (Aggregate Interlock):** \xc7atlak y\xfczeyindeki p\xfcr\xfczl\xfc agrega tanelerinin takılması
3. **Boyuna Donatının D\xfcbel Etkisi (Dowel Action):** Boyuna donatı \xe7ubuklarının kesme kuvvetine g\xf6sterdiği diren\xe7
4. **Enine Donatı (Etriye / \xc7iroz) Katkısı ($V_w$):** \xc7atlağı kesen etriye kollarının \xe7ekme kuvveti
5. **Eğik Basın\xe7 \xc7ubukları (Truss Analogy):** Beton ve donatının oluşturduğu sanal kafes mekanizması`,subsections:[]},{id:"ts500-kesme-formulleri",title:"TS 500 Kesme Dayanımı Formülleri ($V_{cr}, V_c, V_w, V_r$)",content:`TS 500 hesabında kullanılan temel kesme b\xfcy\xfckl\xfckleri:

## 1. Betonun \xc7atlama Kesme Dayanımı ($V_{cr}$)

\`\`\`
Vcr = 0.65 \xd7 fctd \xd7 bw \xd7 d

Eksenel basın\xe7 varsa (N d):
Vcr = 0.65 \xd7 fctd \xd7 bw \xd7 d \xd7 (1 + 0.07 \xd7 Nd / Ac)
\`\`\`

## 2. Betonun Kesme Katkısı ($V_c$)

Eğik \xe7atlak oluştuktan sonra betonun taşıdığı g\xfcvenli kesme katkısı:

\`\`\`
Vc = 0.80 \xd7 Vcr = 0.52 \xd7 fctd \xd7 bw \xd7 d
\`\`\`

## 3. Etriye / Enine Donatı Katkısı ($V_w$)

D\xfcşey etriyeli kesitlerde 45\xb0 kafes modeline g\xf6re etriye katkısı:

\`\`\`
Vw = (Asw / s) \xd7 fywd \xd7 d

Asw = Bir etriye aralığındaki etkili etriye kollarının toplam alanı (mm\xb2)
s   = Etriye aralığı (mm)
fywd = Etriye tasarım akma dayanımı (MPa)
\`\`\`

## 4. Toplam Kesme Dayanımı ($V_r$) ve Tasarım Koşulu

\`\`\`
Vr = Vc + Vw

Tasarım Şartı: Vd ≤ Vr  (veya TBDY'de Ve ≤ Vr)
\`\`\`

> [!WARNING]
> **Beton Ezilmesi \xdcst Sınırı ($V_{r,max}$):** Etriyeyi ne kadar \xe7ok koyarsanız koyun, beton eğik basın\xe7 \xe7ubuğu ezilebilir. TS 500 \xfcst sınırı: **$V_r le 0.22 cdot f_{cd} cdot b_w cdot d$**. Bu sınır aşılırsa kesit boyutları ($b_w 	imes h$) veya beton sınıfı b\xfcy\xfct\xfclmelidir.`,subsections:[]},{id:"sayisal-ornek",title:"Sayısal Örnek: Kiriş Etriye Hesabı",content:`## Veriler

- Kiriş g\xf6vde genişliği: $b_w = 300	ext{ mm}$
- Faydalı y\xfckseklik: $d = 550	ext{ mm}$
- Beton: C30 ($f_{ctd} = 1.28	ext{ MPa}$)
- Etriye \xe7eliği: B420C ($f_{ywd} = 365.2	ext{ MPa}$)
- Tasarım kesme kuvveti: $V_d = 220	ext{ kN}$ ($220 	imes 10^3	ext{ N}$)

## 1. Beton Katkısı ($V_c$)

\`\`\`
Vc = 0.52 \xd7 1.28 \xd7 300 \xd7 550 = 109 824 N ≈ 109.8 kN
\`\`\`

## 2. Gerekli Etriye Katkısı ($V_w$)

\`\`\`
Vw = Vd - Vc = 220 - 109.8 = 110.2 kN (110 200 N)
\`\`\`

## 3. Etriye Aralığı ($s$) Hesabı (\xc7ift Kollu \xd88 Etriye)

\xd88 tek kol $A_1 approx 50.3	ext{ mm}^2 \rightarrow A_{sw} = 2 	imes 50.3 = 100.6	ext{ mm}^2$

\`\`\`
Vw = (Asw / s) \xd7 fywd \xd7 d

110 200 = (100.6 / s) \xd7 365.2 \xd7 550
s = (100.6 \xd7 365.2 \xd7 550) / 110 200 ≈ 183.5 mm
\`\`\`

Hesaplanan maksimum etriye aralığı **$s = 150	ext{ mm}$** se\xe7ilir.

## 4. Sarılma B\xf6lgesi Kontrol\xfc (TBDY 2018)

Deprem sarılma b\xf6lgesinde etriye aralığı daha da sıklaştırılarak **\xd88/100 mm** uygulanır.`,subsections:[]},{id:"tbdy-2018-ve-kapasite",title:"TBDY 2018 Kapasite Tasarımı ($V_e$) ve Sarılma Bölgeleri",content:`Deprem b\xf6lgelerinde kesme hesabı doğrudan elastik analiz kesmesi $V_d$ ile yapılmaz. Kiriş u\xe7larında plastik mafsallar oluştuğu varsayılarak **Kapasite Tasarımı Kesme Kuvveti ($V_e$)** hesaplanır:

\`\`\`
Ve = Vdg \xb1 (Mra + Mrb) / ln
\`\`\`

- **Vdg:** D\xfcşey y\xfcklerden oluşan kesme kuvveti
- **Mra, Mrb:** Kiriş sol ve sağ u\xe7larındaki pekleşmeli taşıma g\xfcc\xfc momentleri
- **ln:** Kiriş serbest a\xe7ıklığı

## Kiriş U\xe7 Sarılma B\xf6lgeleri

Kiriş mesnet y\xfcz\xfcnden itibaren **$2 cdot h$** boyunca sarılma b\xf6lgesi tanımlanır:

- **İlk etriye** mesnet y\xfcz\xfcnden en fazla **50 mm** mesafeye konur.
- Sarılma b\xf6lgesinde etriye aralığı $s le min(h/4, 8cdotphi_{	ext{boyuna}}, 150	ext{ mm}, 100	ext{ mm})$ şartlarını sağlamalıdır.
- T\xfcm etriyeler **135\xb0 kancalı** olmalı ve kanca uzantıları beton \xe7ekirdeğe saplanmalıdır.`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`## Uygulama Hataları

1. **90\xb0 a\xe7ık etriye kancası kullanmak:** Depremde beton \xf6rt\xfcs\xfc d\xf6k\xfcld\xfcğ\xfcnde 90\xb0 kancalar a\xe7ılarak etriye işlevsiz kalır. 135\xb0 kanca şarttır.
2. **Kapasite kesmesini ($V_e$) atlayıp sadece elastik $V_d$ ile etriye koymak:** Eğilme donatısı fazla se\xe7ildiyse pekleşmeli moment artar ve $V_e$ y\xfcksek \xe7ıkar.
3. **Etriye aralığını sarılma b\xf6lgesinde sıklaştırmamak.**
4. **\xc7ift kollu yerine tek kollu etriye hesabı yapmak:** $A_{sw}$ hesabında kol sayısını yanlış almak.
5. **Maksimum kesme sınırını ($V_{r,max}$) kontrol etmeyip aşırı etriye sıklaştırmak:** Beton eğik basın\xe7 \xe7ubuğunun ezilmesini g\xf6zden ka\xe7ırmak.`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makaledeki kesme ve etriye kuralları aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 8.1, 8.2)
- **TBDY 2018** — T\xfcrkiye Bina Deprem Y\xf6netmeliği, B\xf6l\xfcm 7 (Kiriş Kesme G\xfcvenliği ve Sarılma B\xf6lgeleri)
- **TS 708** — Donatı \xc7eliği Standartları`,subsections:[]}],references:[{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500 Betonarme Standartı",href:"https://www.tse.org.tr"}],relatedSlugs:["ts500-kiris-burulma-donatisi","ts500-egilme-donatisi-hesabi","ts500-donati-orani-sinirlari"],tags:["kesme donatısı","etriye","Vc","Vw","Vr","Ve","sarılma bölgesi","135 kanca"]}),m({slug:"ts500-kiris-burulma-donatisi",title:"Kirişlerde Burulma Donatısı Tasarımı",description:"Denge ve uyum burulması (torsiyon) ayırımı, kapalı etriye ve boyuna torsiyon donatısı hesabı, kesme-burulma etkileşimi ve şantiye detayları.",image:"/covers/ts500/kesme-burulma.png",readTime:"11 dk",keywords:["burulma donatısı","torsiyon","denge burulması","uyum burulması","kapalı etriye","boyuna torsiyon donatısı","kesme burulma etkileşimi","uzaysal kafes modeli"],sections:[{id:"burulma-nedir",title:"Kirişlerde Burulma (Torsiyon) Nedir?",content:`Kiriş boy ekseni etrafında burulma momenti ($T_d$) oluşması durumudur. D\xfcşey y\xfcklerin kiriş kesit merkezinden ka\xe7ık (eksantrik) etki etmesi sonucu meydana gelir:

- **Konsol Balkon Kenar Kirişi:** Balkon d\xf6şemesinin y\xfck\xfc kirişe eksantrik aktarılır.
- **Dış Cephe ve Parapet Kirişleri:** Ağır cephe panelleri ve konsol sa\xe7ağın kirişi burmaya \xe7alışması.
- **İkincil Kiriş Bağlantıları:** Saplama kirişlerin ana kiriş g\xf6vdesine eksantrik y\xfck vermesi.

> [!NOTE]
> Burulma \xe7atlakları kirişin d\xf6rt y\xfcz\xfcnde **helezonik / spiral** olarak ilerler. Bu nedenle burulma donatısı da kesitin t\xfcm \xe7evresini kaplayacak şekilde tasarlanmalıdır.`,subsections:[]},{id:"denge-ve-uyum-burulmasi",title:"Denge Burulması vs Uyum Burulması",content:`Tasarımda burulma iki ana kategoriye ayrılır:

## 1. Denge Burulması (Equilibrium Torsion)

Statik denge gereği kirişin burulma momentini taşımaktan başka se\xe7eneğinin olmadığı durumdur.
- **\xd6rnek:** Konsol balkonun bağlandığı kenar kiriş.
- **Kural:** Burulma momenti ihmal edilemez! \xc7atlama sonrasında da kesit burulmayı g\xfcvenle taşımak ZORUNDADIR. Analizde rijitlik \xe7arpanını sıfırlamak yapıyı g\xfcvensiz hale getirir.

## 2. Uyum Burulması (Compatibility Torsion)

Hiperstatik sistemlerde mesnet d\xf6nmelerinden kaynaklanan, kiriş \xe7atladığında burulma rijitliği ($GJ$) d\xfcşerek y\xfck\xfcn komşu elemanlara aktarılabildiği durumdur.
- **\xd6rnek:** İki y\xf6nl\xfc monolitik i\xe7 d\xf6şeme kirişleri.
- **Kural:** TS 500 uyarınca uyum burulması durumunda burulma momenti \xe7atlama momenti seviyesine ($T_{cr}$) kadar d\xfcş\xfcr\xfclerek hesap yapılabilir.

| Burulma T\xfcr\xfc | Statik Denge | \xc7atlama Sonrası Durum | Hesap Zorunluluğu |
|--------------|--------------|-----------------------|-------------------|
| **Denge** | Şarttır | Momenti taşımak zorunda | **Tam Hesap Zorunlu** |
| **Uyum** | Hiperstatik | Moment komşuya aktarılır | Red\xfckte Edilebilir ($T_{cr}$) |`,subsections:[]},{id:"uzaysal-kafes-modeli",title:"Donatı Donatım İlkeleri: Kapalı Etriye + Boyuna Donatı",content:`Burulmayı taşımak i\xe7in **kapalı etriye** ve **boyuna donatı** BİRLİKTE kullanılmak zorundadır. Sadece birini artırmak torsiyonu \xe7\xf6zmez.

## Uzaysal Kafes Modeli (Thin-Walled Tube Analogy)

\xc7atlamış betonarme kesit, dış kabuğunda kayma akısı ($q$) taşıyan ince cidarlı kapalı bir t\xfcp gibi davranır:

- **Beton Eğik Basın\xe7 \xc7ubukları:** Helezonik \xe7atlaklar arasındaki beton diyagonalleri
- **Kapalı Etriye:** Enine \xe7ekme gerilmelerini karşılar (45\xb0 kancalı ve tamamen kapalı olmalıdır).
- **Boyuna Torsiyon Donatısı:** Kesit \xe7evresindeki 4 y\xfcze eşit dağıtılmış boyuna \xe7ubuklar.

> [!WARNING]
> **A\xe7ık U-Etriye İle Burulma Taşınamaz!** Burulma \xe7atlağı kesitin 4 y\xfczeyinde dolandığı i\xe7in a\xe7ık etriye kancası a\xe7ılarak aniden kırılmaya yol a\xe7ar. Burulma etriyeleri mutlaka **135\xb0 kapalı kancalı** ve kenetlenmiş olmalıdır.`,subsections:[]},{id:"burulma-formulleri",title:"TS 500 Burulma Donatısı Formülleri",content:`## 1. Burulma \xc7atlama Eşiği ($T_{cr}$)

Hesaplanan tasarım burulma momenti $T_d le T_{cr}$ ise \xf6zel burulma donatısı gerekmez (yalnızca konstr\xfcktif etriye konur).

\`\`\`
Tcr = 0.40 \xd7 fctd \xd7 S

S = Kesit torsiyon sabiti (\xf6rneğin dikd\xf6rtgen kesitte ~ b\xb2\xb7h / 3)
\`\`\`

## 2. Burulma Etriye Hesabı ($A_{tt} / s$)

\`\`\`
Att / s = Td / (2 \xd7 Ao \xd7 fywd)
\`\`\`

- **Att:** Tek bir etriye kolunun torsiyon alanı (mm\xb2)
- **Ao:** Etriye merkez hatlarının \xe7evrelediği net t\xfcp alanı (mm\xb2)
- **s:** Etriye aralığı (mm)

## 3. Boyuna Torsiyon Donatısı ($A_{sl}$)

\`\`\`
Asl = (Att / s) \xd7 ph \xd7 (fywd / fyd)
\`\`\`

- **ph:** Etriye merkez hattının \xe7evresi (mm)
- **Asl:** Kesitin 4 y\xfcz\xfcne eşit dağıtılacak (\xf6zellikle 4 k\xf6şeye yerleştirilecek) toplam boyuna donatı alanı.`,subsections:[]},{id:"kesme-burulma-etkilesimi",title:"Kesme ve Burulma Etkileşimi ($V_d + T_d$)",content:`Aynı etriye hem d\xfcşey kesme ($V_d$) hem de burulma ($T_d$) kuvvetini birlikte taşır:

\`\`\`
Toplam Etriye Oranı: (Asw / s)_toplam = (Asw / s)_kesme + 2 \xd7 (Att / s)_burulma
\`\`\`

## Beton Eğik Basın\xe7 \xc7ubuğu Kontrol\xfc

Hem kesme hem burulma aynı beton elemanını basınca zorladığından toplam gerilme beton ezilme sınırını aşmamalıdır:

\`\`\`
(Vd / Vr,max)\xb2 + (Td / Tr,max)\xb2 ≤ 1.0
\`\`\`

Bu oran 1.0'i aşarsa etriye artırmak \xe7\xf6zmez — kesit boyutları ($b_w 	imes h$) b\xfcy\xfct\xfclmelidir.`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`## Uygulama ve Tasarım Hataları

1. **Yazılımda Denge Burulmasını Yanlışlıkla Sıfırlamak:** Konsol balkon kenar kirişinde torsiyon rijitliğini 0.01 alarak yapıyı g\xfcvensiz bırakmak.
2. **A\xe7ık U-Etriye kullanmak:** Burulma altında etriye u\xe7larının a\xe7ılması.
3. **Boyuna torsiyon donatısını unutup sadece etriyeyi sıklaştırmak:** Uzaysal kafes modelinin bozulması.
4. **Boyuna donatıyı kesitin sadece alt y\xfcz\xfcne toplamak:** Torsiyon boyuna donatısı kesitin 4 y\xfcz\xfcne ve 4 k\xf6şesine dağıtılmalıdır.
5. **Kesme ve burulma etriye alanlarını toplamayı unutmak:** (Asw/s) toplamını tek değişkene g\xf6re boyutlandırmak.`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makaledeki hesap y\xf6ntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 8.3)
- **TBDY 2018** — T\xfcrkiye Bina Deprem Y\xf6netmeliği, B\xf6l\xfcm 7
- **TS EN 1992-1-1 (EC2)** — Torsion Design rules`,subsections:[]}],references:[{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500 Betonarme Standartı",href:"https://www.tse.org.tr"}],relatedSlugs:["ts500-kesme-donatisi-etriyer","ts500-egilme-donatisi-hesabi","ts500-donati-orani-sinirlari"],tags:["burulma donatısı","torsiyon","denge burulması","uyum burulması","kapalı etriye","boyuna torsiyon donatısı"]}),m({slug:"ts500-kiris-sehim-kontrolu",title:"Betonarme Kirislerde Sehim Kontrolu",description:"Anlik ve zamana bagli (sunme + rotre) sehim hesabi, catlamis kesit atalet momenti (Icr), Branson etkin atalet formulu (Ie) ve izin verilen sehim sinirlari.",image:"/covers/ts500/sehim-catlak.png",readTime:"11 dk",keywords:["sehim kontrolu","kiris sehmi","Branson formulu","Ie","Icr","Ig","sunme","rotre","kullanilabilirlik","L/360","L/480"],sections:[{id:"sehim-nedir",title:"Sehim ve Kullanilabilirlik (SLS) Nedir?",content:`Betonarme bir kesitin tasima gucu bakindan emniyetli olmasi (kirilmamasi), elemanin kullanim acisindan sorunsuz oldugu anlamina gelmez.

Servis yukleri altinda asiri sehim (deformasyon):
- Bolme duvarlarinin, kapi ve pencere kasalarinin sikisip catlamasina
- Zemin kaplamalarinin, seramik ve tavan sivalarinin dokulmesine
- Kullanicilarda guvensizlik ve rahatsizlik hissine
- Duzeltilmesi imkansiz estetik problemlere

yol acar. Sehim kontrolu **Kullanilabilirlik Sinir Durumu (SLS)** altinda yapilir.`,subsections:[]},{id:"anlik-ve-uzun-sureli-sehim",title:"Anlik Sehim vs Zamana Bagli Sehim (Sunme ve Rotre)",content:`Betonarme sehim hesabi sadece ilk yukleme aniyla sinirli degildir:

## 1. Anlik (Ani) Sehim

Yuk uygulundigi anda meydana gelen elastik/catlamis deformasyondur.

## 2. Zamana Bagli Sehim

Sabit yukler altinda betonun zamana bagli **sunme (creep)** ve **rotre (shrinkage)** yapmasi nedeniyle zamanla sehim 2 ila 3 katina cikabilir.

\`\`\`
Toplam Uzun Sureli Sehim = Anlik(hareketli) + lambda x Anlik(sabit)

lambda = xi / (1 + 50 x rho')
\`\`\`

- **xi:** Zamana bagli surunme katsayisi (5 yil ve uzeri icin xi ~ 2.0)
- **rho':** Basinc donati orani = As' / (b x d)

> [!IMPORTANT]
> **Basinc Donatisinin Sehim Katkisi:** Basinc donatisi As' kesitteki surunme deformasyonunu engelleyerek zamana bagli sehim carpanini (lambda) ciddi oranda dusurebilir. Sehim problemi olan kirislerde basinc bolgesine ilave donati koymak cok etkili bir yontemdir.`,subsections:[]},{id:"branson-formulu",title:"Catlamis Kesit ve Branson Etkin Atalet Momenti (Ie)",content:`Betonarme kiris servis momenti (Ma), betonun catlama momentini (Mcr) astiktan sonra kesit catlar. Catlamis bolgede rijitlik dusuyor.

Kirisin boyunca bazi kesitler catlamis, bazilari catlamamisstir. TS 500'de ortalama rijitligi temsil eden **Branson Etkin Atalet Momenti (Ie)** kullanilir:

\`\`\`
Ie = (Mcr/Ma)^3 x Ig + [1 - (Mcr/Ma)^3] x Icr  <=  Ig
\`\`\`

- **Ig:** Brut beton kesiti atalet momenti
- **Icr:** Donusturulmus catlamis kesit atalet momenti
- **Mcr:** Beton catlama momenti
- **Ma:** Servis yukleri altindaki en buyuk egilme momenti

> [!NOTE]
> Ma <= Mcr ise kesit catlamamisstir ve Ie = Ig alinir. Ma > Mcr oldugunda Ie degeri Ig ile Icr arasinda bir deger alir.`,subsections:[]},{id:"izin-verilen-sinirlar",title:"TS 500 Izin Verilen Sehim Sinirlari",content:`TS 500 uyarinca sehim hesabi gerektirmeyen pratik **aciklik/yukseklik (L/h)** sinirlari:

Basit mesnetli kirislerde L/h <= 15, surekli kirislerde L/h <= 18 ve konsollarda L/h <= 7 saglaniyor ise detayli sehim hesabi yapilmayabilir.

## Izin Verilen Maksimum Sehim Sinirlari

| Eleman ve Sart | Izin Verilen Sehim |
|----------------|-------------------|
| Bolme duvari tasimayan catılar | L / 180 |
| Bolme duvari tasimayan doseme ve kirisler | L / 360 |
| Hassas kaplama tasiyan elemanlar (uzun sureli) | L / 480 |
| Su birikme riski olan cati konsollar | L / 480 veya daha siki |

> [!WARNING]
> Konsollarda sehim L^4 ile orantili oldugu icin acikligi %20 uzatmak sehimi 3 katina cikarabilir!`,subsections:[]},{id:"sik-hatalar",title:"Sik Yapilan Hatalar",content:`## Tasarim Hatalari

1. **Brut atalet momentini (Ig) kullanmak:** Catlama sonrasinda Ig kullanmak sehimi 2-3 kat kucuk gosterir; mutlaka Branson formulu (Ie) kullanilmalidir.
2. **Surunme ve rotre sehimini ihmal etmek:** Sadece anlik sehimle kontrol yapip uzun donem sehim katlanmasini gozardi etmek.
3. **Basinc donatisinin sehim dusurme gucunu kullanmamak.**
4. **Konsol boyunu uzatip yuksekligi artirmamak.**`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanagi",content:`Bu makaledeki sehim yontemleri asagidaki resmi standartlara dayanmaktadir:

- **TS 500 (2000)** — Betonarme Yapilarin Tasarim ve Yapim Kurallari (Md. 13.1, 13.2)
- **TS EN 1992-1-1 (EC2)** — Deflection Control and Branson Formula`,subsections:[]}],references:[{label:"AFAD — Turkiye Bina Deprem Yonetmeligi 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500 Betonarme Standardi",href:"https://www.tse.org.tr"}],relatedSlugs:["ts500-catlak-genisligi-kontrolu","ts500-egilme-donatisi-hesabi","ts500-konsol-kiris-tasarimi"],tags:["sehim kontrolu","kiris sehmi","Branson formulu","Ie","Icr","sunme","L/360","L/480"]}),m({slug:"ts500-catlak-genisligi-kontrolu",title:"Çatlak Genişliği ve Kullanılabilirlik Kontrolleri",description:"Betonarme elemanlarda kılcal çatlak oluşum mekanizması, servis yükü altında donatı gerilmesi, w_max formülü, donatı çapı ve aralığı ilişkisi ve durabilite sınırları.",image:"/covers/ts500/sehim-catlak.png",readTime:"10 dk",keywords:["çatlak genişliği","wmax","kullanılabilirlik","donatı gerilmesi","donatı aralığı","durabilite","pas payı","servis yükü","çatlama momenti"],sections:[{id:"catlak-fizigi",title:"Betonarmede Çatlak Kaçınılmaz mıdır?",content:`Evet. Betonarme yapının temel \xe7alışma prensibi gereği, \xe7ekme b\xf6lgesindeki beton $f_{ctd}$ \xe7ekme dayanımını aştığında \xe7atlar ve \xe7ekme kuvveti donatıya aktarılır.

Dolayısıyla **\xe7atlak oluşumu bir imalat hatası değil, betonarmenin doğal \xe7alışma bi\xe7imidir.**

Asıl m\xfchendislik problemi: **"\xc7atlak var mı?"** değil, **"\xc7atlak genişliği ($w$) kontrol altında mı?"** sorusudur.

> [!IMPORTANT]
> **\xc7atlak Kontrol\xfcn\xfcn \xdc\xe7 Nedeni:**
> 1. **Durabilite (Korozyon Koruması):** Geniş \xe7atlaklar nem, CO₂ ve klor\xfcr iyonlarının donatıya hızla ulaşmasına yol a\xe7arak paslanmayı başlatır.
> 2. **Su ve Nem Ge\xe7irimsizliği:** Su depoları, bodrum perdeleri ve \xe7atılarda sızıntıyı \xf6nlemek.
> 3. **Estetik ve G\xf6r\xfcn\xfcm:** 0.4 mm \xfczerindeki \xe7atlaklar kullanıcılarda g\xfcvensizlik oluşturur.`,subsections:[]},{id:"catlak-genisligi-formulu",title:"Çatlak Genişliği Hesabı ve Değişkenler ($w_{\\max}$)",content:`\xc7atlak genişliği ($w_{\\max}$), donatının servis gerilmesi ($sigma_s$), donatı \xe7apı ($phi$), beton \xf6rt\xfcs\xfc ($c$) ve donatı aralığı ($s$) ile doğrudan ilişkilidir:

\`\`\`
w_max = w0 \xd7 (σs / Es) \xd7 (3c + 0.2 \xd7 s / ρ_eff)

Servis y\xfckleri altında donatı gerilmesi: σs ≈ M_servis / (As \xd7 z)
\`\`\`

## \xc7atlak Genişliğini D\xfcş\xfcren Ana Unsurlar

1. **Servis Y\xfck\xfc Altındaki Donatı Gerilmesi ($sigma_s$):** Gerilme ne kadar d\xfcş\xfckse \xe7atlak o kadar dar olur.
2. **Donatı \xc7apı ve Aralığı ($s$):** Aynı \xe7elik alanında b\xfcy\xfck \xe7aplı seyrek donatı yerine **k\xfc\xe7\xfck \xe7aplı sık donatı** kullanmak \xe7atlak genişliğini \xf6nemli \xf6l\xe7\xfcde k\xfc\xe7\xfclt\xfcr.
3. **Beton \xd6rt\xfcs\xfc ($c$):** Beton \xf6rt\xfcs\xfc arttık\xe7a y\xfczeydeki \xe7atlak genişliği bir miktar b\xfcy\xfcr; ancak korozyon koruması artar. Optimum \xf6rt\xfc se\xe7ilmelidir.`,subsections:[]},{id:"cevresel-etki-ve-limitler",title:"Çevresel Etki Sınıflarına Göre İzin Verilen $w_{\\max}$ Limitleri",content:`TS 500 ve Eurocode 2 standartları \xe7evresel etki sınıflarına g\xf6re maksimum izin verilen \xe7atlak genişliği limitleri belirler:

| \xc7evresel Etki Sınıfı | Ortam Tanımı | İzin Verilen $w_{\\max}$ (mm) |
|----------------------|--------------|------------------------------|
| **X0 / XC1** | Kuru i\xe7 ortam (korozyon riski yok) | **0.40 mm** |
| **XC2 / XC3 / XC4** | Nemli i\xe7/dış ortam, karbonatlaşma riski | **0.30 mm** |
| **XD1 / XD2 / XS1** | Klor\xfcr ve deniz suyu etkisi | **0.20 mm** |
| **\xd6zel Su Yapıları** | Su depoları, havuzlar, arıtma tesisleri | **0.10 – 0.15 mm** |

> [!NOTE]
> Deniz kıyısındaki bir binada veya otopark d\xf6şemesinde $0.40	ext{ mm}$ \xe7atlak kabul edilemez! Klor\xfcr iyonlarının donatıyı \xe7\xfcr\xfctmesini \xf6nlemek i\xe7in \xe7atlak genişliği $0.20	ext{ mm}$'nin altında tutulmalıdır.`,subsections:[]},{id:"donati-capi-ve-araligi-tablosu",title:"Çatlak Hesabı Yapmadan Kontrol: Donatı Çapı ve Aralık Tablosu",content:`TS 500 pratik tasarımda, detaylı $w_{\\max}$ hesabı yapmak yerine servis y\xfckleri altındaki donatı gerilmesine ($sigma_s$) bağlı olarak **maksimum \xe7ubuk \xe7apı** veya **maksimum \xe7ubuk aralığı** sınırlarına uyulmasını kabul eder:

| Donatı Servis Gerilmesi ($sigma_s$) | $w_{\\max} = 0.3	ext{ mm}$ İ\xe7in Maksimum \xc7ap | Maksimum \xc7ubuk Aralığı ($s$) |
|-------------------------------------|----------------------------------------------|-----------------------------|
| $160	ext{ MPa}$ | \xd832 | $300	ext{ mm}$ |
| $200	ext{ MPa}$ | \xd825 | $250	ext{ mm}$ |
| $240	ext{ MPa}$ | \xd816 | $200	ext{ mm}$ |
| $280	ext{ MPa}$ | \xd812 | $150	ext{ mm}$ |
| $320	ext{ MPa}$ | \xd810 | $100	ext{ mm}$ |

**Pratik Kural:** Donatı servis gerilmesi y\xfckseldik\xe7e daha k\xfc\xe7\xfck \xe7aplı ve daha sık donatı se\xe7ilmelidir.`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`## Tasarım ve Uygulama Hataları

1. **Aynı alan i\xe7in az sayıda b\xfcy\xfck \xe7ap se\xe7mek:** \xd6rneğin 2\xd825 yerine 5\xd816 kullanmak \xe7atlakları \xe7ok daha homojen ve kılcal (dar) tutar.
2. **Agresif deniz ortamında 0.4 mm \xe7atlak genişliğini yeterli sanmak:** Klor\xfcr korozyonunda kural $w_{\\max} le 0.20	ext{ mm}$'dir.
3. **Servis donatı gerilmesini ($sigma_s$) hesaba katmamak:** Sadece taşıma g\xfcc\xfcndeki $f_{yd}$'ye bakıp servis gerilmesini g\xf6z ardı etmek.
4. **Perde ve d\xf6şemelerde r\xf6tre donatısını yetersiz koymak:** Sıcaklık ve r\xf6tre \xe7atlaklarının kontrols\xfcz b\xfcy\xfcmesine yol a\xe7mak.`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makaledeki \xe7atlak kontrol y\xf6ntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 13.3)
- **TS EN 206+A2** — \xc7evresel Etki Sınıfları
- **TS EN 1992-1-1 (EC2)** — Crack Control and Maximum Bar Spacing`,subsections:[]}],references:[{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500 Betonarme Standartı",href:"https://www.tse.org.tr"}],relatedSlugs:["ts500-kiris-sehim-kontrolu","ts500-beton-ortusu-durabilite","ts500-egilme-donatisi-hesabi"],tags:["çatlak genişliği","wmax","kullanılabilirlik","donatı gerilmesi","donatı aralığı","durabilite","0.2mm"]}),m({slug:"ts500-kolon-pm-etkilesimi",title:"Kolon Tasarimi: Eksenel Yuk + Moment Etkilesimi (P-M Diyagrami)",description:"Betonarme kolonlarda bilesik egilme (N+M), P-M etkilesim diyagraminin turetilmesi, kirilma bolgeleri (basinc, dengeli, cekme) ve TBDY 2018 kolon kurallari.",image:"/covers/ts500/kolon-pm.png",readTime:"12 dk",keywords:["kolon tasarimi","P-M diyagrami","eksenel yuk","bilesik egilme","tarafsiz eksen","dengeli kirilma","guclu kolon","Nd max","TBDY kolon"],sections:[{id:"gercek-kolon-davranisi",title:"Gercek Kolonlar Saf Basinc Tasiyor mu?",content:`Hayir. Gercek binalarda saf eksenel basinc altinda calisan kolon yok denecek kadar azdir.

Kolonlarda eksenel yuk ile birlikte **egilme momenti (Md)** olusmasinin ana nedenleri:
- Cerceve davranisi nedeniyle kirislerden aktarilan mesnet momentleri
- Yatay deprem (E) ve ruzgar (W) yukleri
- Yuk eksantrisitesi ve imalat toleranslari
- Ikinci mertebe etkileri (P-Delta ve P-delta)

Bu nedenle kolon tasarimi saf basinc hesabi degil, **Eksenel Yuk + Moment Etkilesimi (Bilesik Egilme)** hesabidir.`,subsections:[]},{id:"pm-diyagrami-nedir",title:"P-M Etkilesim Diyagrami Nedir ve Nasil Okunur?",content:`P-M diyagrami, belirli bir kolon kesiti ve donati duzeni icin kolonun emniyetle tasiyabilecegi tum (N, M) ikililerinin sinir egrisidir:

- **Eğrinin İ\xe7i:** KESİT G\xdcVENLİ dir (Nd <= Nr ve Md <= Mr).
- **Eğrinin Dışı:** KESİT YETERSİZDİR (yikilma/gocme riski).

## P-M Egrisi 3 Ana Bolgesi

**1. Basinc Kirilmasi Bolgesi (N > Nb):**
Yuksek eksenel yuk altinda beton ezilerek gevrek kirilir. Eksenel yuk arttikca kesitin moment tasima kapasitesi **azalir**.

**2. Dengeli Kirilma Noktasi (Nb, Mb):**
Betonun ezilmesi ile cekme donatisinin akmasi ayni anda gerceklesiyor. Kesitin **maksimum moment tasidigi** noktadir.

**3. Cekme Kirilmasi Bolgesi (N < Nb):**
Dusuk eksenel yuk altinda cekme donatisi akar, kesit sunek davranir. Eksenel yuk arttikca moment kapasitesi **artar** (eksenel yuk cekme catagini kapatici etki yapar).`,subsections:[]},{id:"pm-noktalarinin-hesabi",title:"P-M Egrisindeki Kritik Noktalarin Hesabi",content:`## 1. Saf Basinc Noktasi (Nmax)

Hic moment olmadan (M = 0) kesitin tasiyabilecegi teorik maksimum eksenel yuk:

\`\`\`
No = 0.85 x fcd x (Ac - Ast) + Ast x fyd

TS 500 ust siniri: Nmax = 0.85 x No
\`\`\`

## 2. Saf Egilme Noktasi (M0)

Hic eksenel yuk olmadan (N = 0) kesitin kiris gibi tasiyabilecegi moment kapasitesidir.

## 3. Saf Cekme Noktasi (Nt)

Beton cekme tasimadigi icin yalnizca boyuna donati cekme kapasitesidir:

\`\`\`
Nt = - Ast x fyd
\`\`\``,subsections:[]},{id:"tbdy-2018-kolon-kurallari",title:"TBDY 2018 Kolon Tasarim Kurallari",content:`Deprem bolgelerinde kolonlar icin TS 500 minimumlarinin otesinde TBDY Bolum 7 kurallari uygulanir:

## 1. Maksimum Eksenel Yuk Siniri (Nd,max)

\`\`\`
Nd <= 0.40 x fck x Ac    (veya TBDY guncel katsayisi)
\`\`\`

## 2. Guclu Kolon - Zayif Kiris Ilkesi

Depremde plastik mafsallarin kolonlarda degil kirislerde olusmasini saglamak icin her birlesimdusumu noktasinda:

\`\`\`
sum(Mrc) >= 1.20 x sum(Mrb)

sum(Mrc): Birlesime baglanan kolonlarin moment kapasiteleri toplami
sum(Mrb): Birlesime baglanan kirislerin moment kapasiteleri toplami
\`\`\`

## 3. Kolon Sarilma Bolgesi

Kolon alt ve ust uclarinda en az lb = max(h_max, ln/6, 500 mm) uzunlugunda kapali etriyeler ve cirozlar ile sarilma bolgesi olusturulur (s <= 100 mm).`,subsections:[]},{id:"sik-hatalar",title:"Sik Yapilan Hatalar",content:`## Tasarim ve Yazilim Hatalari

1. **Kolonu sadece saf eksenel yukle boyutlandirmak:** Moment etkisini ihmal edip P-M diyagrami kontrolu yapmamak.
2. **Yuksek eksenel yukun moment kapasitesini dusturmesini unutmak:** N > Nb bolgesinde eksenel yuk arttikca moment tasima gucu azalir.
3. **Cift eksenli egilmede tek eksenli kontrol yapmak:** Iki yonlu moment etkilesimini ihmal etmek.
4. **TBDY Nd,max sinirini asmak:** Kolon kesitini asiri kucultup gevrek ezilme riskine yol acmak.`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanagi",content:`Bu makaledeki hesap yontemleri asagidaki resmi standartlara dayanmaktadir:

- **TS 500 (2000)** — Betonarme Yapilarin Tasarim ve Yapim Kurallari (Md. 7.4, 10.1)
- **TBDY 2018** — Turkiye Bina Deprem Yonetmeligi, Bolum 7
- **TS EN 1992-1-1 (EC2)** — Column Biaxial Bending and P-M Interaction`,subsections:[]}],references:[{label:"AFAD — Turkiye Bina Deprem Yonetmeligi 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500 Betonarme Standardi",href:"https://www.tse.org.tr"}],relatedSlugs:["ts500-narin-kolon-ikinci-mertebe","ts500-donati-orani-sinirlari","ts500-egilme-donatisi-hesabi"],tags:["kolon tasarimi","P-M diyagrami","eksenel yuk","bilesik egilme","guclu kolon","TBDY kolon"]}),m({slug:"ts500-narin-kolon-ikinci-mertebe",title:"Narin Kolonlar ve İkinci Mertebe Momentleri",description:"Kolon narinlik oranı (λ = lk/i), Euler burkulma yükü, narinlik sınırları, moment büyütme katsayısı (δ) ve P-Δ ile P-δ ikinci mertebe etkileri.",image:"/covers/ts500/kolon-pm.png",readTime:"11 dk",keywords:["narin kolon","ikinci mertebe","narinlik oranı","burkulma boyu","lk","moment büyütme katsayısı","P-delta","Euler burkulma","atalaet yarıçapı","TS 500 narinlik"],sections:[{id:"ikinci-mertebe-nedir",title:"Birinci Mertebe vs İkinci Mertebe Momenti",content:`Betonarme kolon analizinde iki t\xfcr moment vardır:

1. **Birinci Mertebe Momenti ($M_1$):** Yapı deforme olmadan \xf6nceki ilk geometrisi \xfczerinden hesaplanan momenttir (dış y\xfcklerden veya \xe7er\xe7eve analizinden elde edilen moment).
2. **İkinci Mertebe Momenti ($M_2$):** Eksenel basın\xe7 y\xfck\xfcn\xfcn ($P$), elemanın yanal \xf6telenmesi ve eğrilmesi sonucu oluşan yer değiştirmeler ($y$) ile \xe7arpılması sonucu doğan ek momenttir ($M_{	ext{ilave}} = P cdot y$).

\`\`\`
Toplam Tasarım Momenti: Md = M1 + P \xd7 y  (veya Md = δ \xd7 M1)
\`\`\`

> [!IMPORTANT]
> **Kısa Kolon vs Narin Kolon:**
> - **Kısa Kolon:** Yanal deformasyon ($y$) \xe7ok k\xfc\xe7\xfckt\xfcr; ek moment ihmal edilebilir ($M_d approx M_1$). Kolon doğrudan malzeme dayanımıyla g\xf6\xe7er.
> - **Narin Kolon:** Yanal deformasyon ($y$) b\xfcy\xfckt\xfcr; ilave moment ($P cdot y$) ihmal edilemez. Kolon birinci mertebe moment kapasitesine ulaşmadan **burkulma veya stabilite kaybı** nedeniyle g\xf6\xe7ebilir.`,subsections:[]},{id:"narinlik-orani-ve-hesabi",title:"Narinlik Oranı ($lambda$) ve Burkulma Boyu ($l_k$)",content:`Kolonun narinliği, burkulma boyunun ($l_k$) kesitin atalet yarı\xe7apına ($i$) oranıyla tanımlanır:

\`\`\`
λ = lk / i

i = √(I / Ac)    (Dikd\xf6rtgen kesitler i\xe7in i ≈ 0.289 \xd7 h)
\`\`\`

- **$l_k = k cdot l_n$:** Kolon serbest boyunun ($l_n$) etkin boy katsayısıyla ($k$) \xe7arpımı.
- **Etkin Boy Katsayısı ($k$):**
  - İki ucu mafsallı: $k = 1.0$
  - İki ucu ankastre: $k = 0.5$
  - Bir ucu ankastre, diğer ucu serbest (konsol): $k = 2.0$
  - \xc7er\xe7eve i\xe7i kolonlar (yanal \xf6telenmesi \xf6nlenmiş): $0.5 le k le 1.0$
  - \xc7er\xe7eve i\xe7i kolonlar (yanal \xf6telenmesi \xf6nlenmeyen): $k ge 1.0$

## TS 500 Narinlik İhmal Sınırı

Bir kolonun narinlik etkileri ihmal edilip kısa kolon sayılabilmesi i\xe7in narinlik oranının şu sınırı aşmaması gerekir:

\`\`\`
\xd6telenmesi \xf6nlenmiş \xe7er\xe7evelerde: λ ≤ 34 - 12 \xd7 (M1 / M2)  (veya λ ≤ 22)
\`\`\`

Bu sınır aşıldığında kolon **narin kolon** kabul edilir ve ikinci mertebe moment hesabı (moment b\xfcy\xfctme y\xf6ntemi) zorunlu hale gelir.`,subsections:[]},{id:"moment-buyutme-yontemi",title:"TS 500 Moment Büyütme Yöntemi ($delta$)",content:`TS 500'de narin kolonların ikinci mertebe etkileri, birinci mertebe tasarım momentinin bir **moment b\xfcy\xfctme katsayısı ($delta$)** ile \xe7arpılmasıyla pratik olarak hesaba katılır:

\`\`\`
Md = δ \xd7 M1

δ = Cm / [ 1 - (Nd / Ncr) ] ≥ 1.0
\`\`\`

- **$N_d$:** Tasarım eksenel y\xfck\xfc
- **$N_{cr}$:** Euler Kritik Burkulma Y\xfck\xfc ($N_{cr} = pi^2 cdot (EI)_{	ext{etkin}} / l_k^2$)
- **$C_m$:** U\xe7 momentlerinin oranına bağlı moment gradyanı katsayısı ($C_m = 0.6 + 0.4 cdot (M_1/M_2) ge 0.4$)

> [!NOTE]
> **Tek Eğrilik vs \xc7ift Eğrilik:** U\xe7 momentleri kolonu aynı y\xf6nde b\xfck\xfcyorsa (tek eğrilik) $C_m$ daha b\xfcy\xfckt\xfcr ve narinlik etkisi olumsuzdur. Zıt y\xf6nlerde b\xfck\xfcyorsa (S-\xe7iziyorsa - \xe7ift eğrilik) $C_m$ k\xfc\xe7\xfcl\xfcr ve narinlik etkisi azalır.`,subsections:[]},{id:"global-ve-lokal-p-delta",title:"Global $P-Delta$ vs Lokal $P-delta$ Etkisi",content:`Y\xfcksek binalarda ikinci mertebe etkileri iki seviyede ele alınır:

1. **Global $P-Delta$ Etkisi:** T\xfcm binanın yatay deprem veya r\xfczg\xe2r y\xfck\xfc altında kat bazında \xf6telenmesinden ($Delta$) kaynaklanır. TBDY 2018 uyarınca İkinci Mertebe G\xf6sterge Parametresi ($	heta$) ile kontrol edilir:
   \`\`\`
   θ = (ΣPd \xd7 Δi) / (Vfi \xd7 hi) ≤ 0.12 (veya 0.20)
   \`\`\`
2. **Lokal $P-delta$ Etkisi:** Kolonun kendi ekseni boyunca yanal eğrilmesinden ($delta$) doğan eleman bazındaki moment b\xfcy\xfctmesidir.

> [!WARNING]
> Global $P-Delta$ analizinin yapılmış olması, narin kolonların lokal $P-delta$ etkisinin otomatik olarak \xe7\xf6z\xfcld\xfcğ\xfc anlamına gelmez. Narin kolonlarda eleman i\xe7i elastik plastik burkulma b\xfcy\xfctmesi ($delta$) ayrıca kontrol edilmelidir.`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`## Tasarım Hataları

1. **Kat y\xfcksekliği fazla kolonlarda narinliği ihmal etmek:** Y\xfcksek tavanlı d\xfcğ\xfcn salonu, fabrika veya atrium kolonlarında narinliği kontrol etmeden kısa kolon gibi \xe7\xf6zmek.
2. **Etkin boy katsayısını ($k$) daima 1.0 almak:** Konsol veya yanal \xf6telenmeli kolonlarda $k > 1.0$ olduğunu g\xf6zden ka\xe7ırmak.
3. **S\xfcnmenin narinliğe etkisini yok saymak:** Sabit y\xfcklerin zamanla betonda s\xfcnme oluşturarak $EI$'yi d\xfcş\xfcrd\xfcğ\xfcn\xfc ve burkulma riskini artırdığını dikkate almamak.
4. **Zayıf eksen narinliğini kontrol etmemek:** Kolon kesiti bir doğrultuda geniş ($b = 800	ext{ mm}$), diğer doğrultuda dar ($h = 300	ext{ mm}$) ise zayıf eksende $i_y$ \xe7ok k\xfc\xe7\xfckt\xfcr ve kolon o eksende narinleşir.`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makaledeki narinlik hesapları aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 10.2)
- **TBDY 2018** — T\xfcrkiye Bina Deprem Y\xf6netmeliği, B\xf6l\xfcm 4 ve 7 (İkinci Mertebe G\xf6sterge Parametresi)
- **TS EN 1992-1-1 (EC2)** — Slender Columns and Second-Order Effects with Cm Factor`,subsections:[]}],references:[{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500 Betonarme Standartı",href:"https://www.tse.org.tr"}],relatedSlugs:["ts500-kolon-pm-etkilesimi","ts500-donati-orani-sinirlari","ts500-kiris-sehim-kontrolu"],tags:["narin kolon","ikinci mertebe","narinlik oranı","burkulma boyu","lk","moment büyütme katsayısı","P-delta"]}),m({slug:"ts500-dosleme-tek-cift-dogrultulu",title:"Döşeme Tasarımı: Tek ve Çift Doğrultulu Döşemeler (TS 500)",description:"Tek doğrultulu (hurdi) ve çift doğrultulu (dal) plak döşemelerin sınıflandırılması, ly/lx oranı, yük aktarımı, minimum kalınlık (hf) ve donatı yerleşim esasları.",image:"/covers/ts500/doseme-zimbalama.png",readTime:"11 dk",keywords:["döşeme tasarımı","tek doğrultulu döşeme","çift doğrultulu döşeme","ly/lx oranı","hurdi döşeme","dal döşeme","dağıtma donatısı","döşeme kalınlığı","hf","pilye"],sections:[{id:"doseme-turleri-ve-oran",title:"Tek Doğrultulu vs Çift Doğrultulu Döşeme Sınıflandırması",content:`Betonarme plak d\xf6şemeler (kirişli d\xf6şemeler), kenar uzunluklarının oranına ($l_y / l_x$) g\xf6re sınıflandırılır:

- **$l_x$:** Kısa a\xe7ıklık
- **$l_y$:** Uzun a\xe7ıklık

\`\`\`
ly / lx > 2.0  →  Tek Doğrultulu D\xf6şeme (Hurdi D\xf6şeme)
ly / lx ≤ 2.0  →  \xc7ift Doğrultulu D\xf6şeme (Dal D\xf6şeme)
\`\`\`

| D\xf6şeme T\xfcr\xfc | A\xe7ıklık Oranı | Y\xfck Taşıma Mekanizması | Donatı D\xfczeni |
|-------------|---------------|------------------------|---------------|
| **Tek Doğrultulu** | $l_y / l_x > 2.0$ | Y\xfck\xfcn neredeyse tamamı (%90+) **kısa a\xe7ıklık ($l_x$)** y\xf6n\xfcnde taşınır | Ana donatı kısa y\xf6nde, uzun y\xf6nde **dağıtma donatısı** |
| **\xc7ift Doğrultulu** | $l_y / l_x le 2.0$ | Y\xfck her iki doğrultuda da taşınır ($M_x$ ve $M_y$) | Her iki doğrultuda da ana taşıyıcı donatı konulur |

> [!NOTE]
> Uzun kenarı kısa kenarının 2 katından fazla olan bir d\xf6şemede uzun kenara y\xfck gitmez; y\xfck en kısa yoldan komşu kirişlere ulaşmak ister.`,subsections:[]},{id:"tek-dogrultulu-doseme",title:"Tek Doğrultulu Döşemeler (Hurdi Döşeme)",content:`Tek doğrultuda \xe7alışan d\xf6şemelerde ana moment $M_x$ kısa a\xe7ıklık boyunca oluşur.

## Donatı D\xfczeni

1. **Ana Donatı ($A_{sx}$):** Kısa a\xe7ıklık boyunca alt y\xfczeye yerleştirilir ($M_{x,	ext{a\xe7ıklık}}$ i\xe7in).
2. **Dağıtma Donatısı ($A_{sd}$):** Uzun a\xe7ıklık boyunca yerleştirilir. Ana donatının **en az %20'si** (veya TS 500 minimum oranı) kadar olmalıdır. G\xf6revi y\xfck\xfc dağıtmak ve r\xf6tre \xe7atlaklarını kontrol etmektir.
3. **Mesnet Donatısı (Mesnet Ek donatısı / Pilye):** Kiriş mesnetlerindeki negatif moment ($M_{x,	ext{mesnet}}$) i\xe7in \xfcst y\xfczeye konur.

## Minimum D\xf6şeme Kalınlığı ($h_f$)

TS 500 uyarınca tek doğrultulu d\xf6şemelerde sehim kontrol\xfc yapmadan kullanılabilecek minimum kalınlık:

\`\`\`
hf ≥ ln / 25  (basit mesnetli)
hf ≥ ln / 30  (s\xfcrekli d\xf6şeme)
hf ≥ ln / 10  (konsol d\xf6şeme)

Mutlak Alt Sınır: hf ≥ 80 mm (veya 100 mm konut d\xf6şemelerinde)
\`\`\``,subsections:[]},{id:"cift-dogrultulu-doseme",title:"Çift Doğrultulu Döşemeler (Dal Döşeme)",content:`Her iki kenarı da birbirine yakın ($l_y / l_x le 2.0$) olan 4 tarafı kirişlerle \xe7evrili d\xf6şemelerdir.

## Moment Dağılımı ve Marcus/TS 500 Katsayıları

Y\xfck her iki doğrultuda b\xf6l\xfcn\xfcr. Kısa a\xe7ıklık daha rijit olduğundan momentin b\xfcy\xfck kısmını $M_x$ alır, $M_y$ daha k\xfc\xe7\xfckt\xfcr.

TS 500 Tablo 11.1 katsayılarıyla ($M = alpha cdot w cdot l_x^2$):
- **Kısa A\xe7ıklık Momenti ($M_x$):** $alpha_x cdot w cdot l_x^2$
- **Uzun A\xe7ıklık Momenti ($M_y$):** $alpha_y cdot w cdot l_x^2$

## Minimum D\xf6şeme Kalınlığı ($h_f$)

TS 500 pratik form\xfcl\xfc:

\`\`\`
hf ≥ [ lns / 15-20 ] \xd7 (1 - αs / 4)

hf ≥ 80 mm (veya 100 mm)
\`\`\`

- **$l_{ns}$:** Serbest kısa a\xe7ıklık
- **$alpha_s$:** S\xfcrekli kenarların toplam \xe7evreye oranı`,subsections:[]},{id:"doseme-donati-kurallari",title:"TS 500 Döşeme Donatı Kuralları ve Minimumlar",content:`## Minimum Donatı Oranı ($\rho_{min}$)

B420C \xe7eliği kullanılan d\xf6şemelerde:
- Tek doğrultulu d\xf6şemelerde: $\rho_{min} ge 0.0015$ (%0.15)
- \xc7ift doğrultulu d\xf6şemelerde: İki doğrultudaki donatı oranları toplamı $\rho_x + \rho_y ge 0.0035$ (%0.35)

## Maksimum \xc7ubuk Aralığı ($s_{max}$)

- **Ana Donatı Aralığı:** $s le min(1.5 cdot h_f, 200	ext{ mm})$
- **Dağıtma Donatısı Aralığı:** $s le 300	ext{ mm}$

> [!IMPORTANT]
> **K\xf6şe Torsiyon Donatısı:** \xc7ift doğrultulu d\xf6şemelerin dış k\xf6şelerinde (iki komşu kenarı mesnetsiz veya tutulmamış k\xf6şelerde) d\xf6şeme u\xe7larının yukarı kalkmasını \xf6nlemek i\xe7in **\xfcstte ve altta k\xf6şe burulma donatısı (\xe7apraz file)** yerleştirilmelidir.`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`## Tasarım ve Şantiye Hataları

1. **$l_y / l_x > 2$ olduğu halde her iki y\xf6ne eşit donatı koymak:** Uzun y\xf6nde gereksiz fazla donatı harcamak.
2. **Dağıtma donatısını atlamak:** Tek doğrultulu d\xf6şemede dağıtma donatısı konulmazsa r\xf6tre ve sıcaklık \xe7atlakları kontrolden \xe7ıkar.
3. **D\xf6şeme pas payını ihlal etmek:** D\xf6şemelerde pas payı $15	ext{ mm}$ (i\xe7 mek\xe2n) - $20	ext{ mm}$ (dış mek\xe2n) olmalıdır. 8 cm kalınlıktaki plak d\xf6şemede donatının ortaya gelmesi $d$'yi yarıya d\xfcş\xfcr\xfcr.
4. **K\xf6şe torsiyon donatısını koymamak:** Dış k\xf6şelerde d\xf6şemenin yukarı kalkıp sıva ve duvar \xe7atlağı oluşturması.`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makaledeki hesap y\xf6ntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 11.1, 11.2)
- **TBDY 2018** — T\xfcrkiye Bina Deprem Y\xf6netmeliği, B\xf6l\xfcm 7 (D\xf6şeme Diyafram Tasarımı)
- **TS EN 1992-1-1 (EC2)** — Slab Design Rules`,subsections:[]}],references:[{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500 Betonarme Standartı",href:"https://www.tse.org.tr"}],relatedSlugs:["ts500-doseme-zimbalama-guvenligi","ts500-donati-orani-sinirlari","ts500-kiris-sehim-kontrolu"],tags:["döşeme tasarımı","tek doğrultulu","çift doğrultulu","hurdi döşeme","dal döşeme","dağıtma donatısı","hf"]}),m({slug:"ts500-doseme-zimbalama-guvenligi",title:"Döşemelerde Zımbalama Güvenliği (Punching Shear)",description:"Kirişsiz döşeme ve radye temellerde iki yönlü kesme (zımbalama) mekanizması, kritik çevre (up), zımbalama gerilmesi hesabı, kolon başlığı, drop panel ve zımbalama donatısı.",image:"/covers/ts500/doseme-zimbalama.png",readTime:"12 dk",keywords:["zımbalama","zımbalama güvenliği","punching shear","kritik çevre","up","Vpr","kolon başlığı","drop panel","zımbalama donatısı","kirişsiz döşeme"],sections:[{id:"zimbalama-nedir",title:"Zımbalama (İki Yönlü Kesme) Nedir?",content:`Kirişsiz d\xf6şemelerde (flat slab) veya mantar d\xf6şemelerde, kolonlar d\xf6şemeye doğrudan basar. Kolondan d\xf6şemeye aktarılan y\xfcksek d\xfcşey y\xfck, kolon etrafında **piramit / koni şeklinde** 45\xb0 eğik \xe7atlaklarla d\xf6şemenin zımbalanarak delinmesine yol a\xe7abilir.

- **İki Y\xf6nl\xfc Kesme:** Tek y\xf6nl\xfc kiriş kesmesinden farklı olarak kesme gerilmeleri kolonun t\xfcm \xe7evresi boyunca iki doğrultuda oluşur.
- **Tehlikesi:** Uyarısız, **son derece gevrek ve ani** ger\xe7ekleşir. Bir kolonda zımbalama g\xf6\xe7mesi olursa d\xf6şeme o kolonda d\xfcşer; y\xfck komşu kolonlara aktarılarak **ilerleyici g\xf6\xe7meye (progressive collapse)** yol a\xe7abilir.

> [!CAUTION]
> D\xf6şemede eğilme donatısının (alt/\xfcst donatı) yeterli olması, kolon \xe7evresinde zımbalama g\xf6\xe7mesi olmayacağı anlamına GELMEZ. Zımbalama bağımsız bir kesme g\xfcvenliği kontrol\xfcd\xfcr.`,subsections:[]},{id:"kritik-cevre-ve-formuller",title:"Kritik Zımbalama Çevresi ($u_p$) ve TS 500 Formülleri",content:`Zımbalama gerilmesi hesabı, kolon y\xfcz\xfcnden belirli bir mesafede tanımlanan **Kritik Zımbalama \xc7evresi ($u_p$)** \xfczerinde yapılır.

## Kritik \xc7evre Konumu

TS 500 standart yaklaşımında kritik \xe7evre, kolon y\xfcz\xfcnden **$d/2$** (faydalı y\xfcksekliğin yarısı) mesafede alınır:

\`\`\`
up = 2 \xd7 (b + d) + 2 \xd7 (h + d)    (Dikd\xf6rtgen b \xd7 h kolon i\xe7in)
\`\`\`

## Zımbalama Tasarım Gerilmesi ($v_{pd}$)

\`\`\`
vpd = Vpd / (up \xd7 d)

Vpd: Tasarım zımbalama kuvveti (kolon eksenel reaksiyonu - kritik \xe7evre i\xe7indeki y\xfck)
up: Kritik zımbalama \xe7evresi uzunluğu
d: D\xf6şeme faydalı y\xfcksekliği (iki y\xf6nl\xfc donatı ortalama d'si)
\`\`\`

## TS 500 Beton Zımbalama Dayanımı ($v_{pr}$)

Zımbalama donatısız betonun tasarım zımbalama gerilme dayanımı:

\`\`\`
vpr = γ \xd7 fctd

γ = 1.0 (veya TS 500 normatif katsayısı)
fctd = fctk / 1.50
\`\`\`

Tasarım Şartı: **$v_{pd} le v_{pr}$** (Eğer $v_{pd} > v_{pr}$ ise zımbalama g\xfcvenliği sağlanmaz; kesit değiştirilmeli veya zımbalama donatısı konulmalıdır).`,subsections:[]},{id:"eksantrik-zimbalama",title:"Eksantrik Zımbalama ve Moment Aktarımı",content:`Kolon-d\xf6şeme birleşiminde sadece d\xfcşey y\xfck ($V$) değil, **eğilme momenti ($M$)** de aktarılıyorsa (\xf6zellikle kenar ve k\xf6şe kolonlarda veya deprem etkisinde):

- Kritik \xe7evre \xfczerindeki kesme gerilmeleri \xfcniform olmaz; bir tarafta yığılma yapar.
- Maksimum zımbalama gerilmesi $v_{pd,max} > V / (u_p cdot d)$ olur.

> [!WARNING]
> **Kenar ve K\xf6şe Kolonlar:** Kenar kolonlarda kritik \xe7evrenin bir kısmı boşlukta kaldığı ve moment aktarımı y\xfcksek olduğu i\xe7in zımbalama riski i\xe7 kolonlara g\xf6re \xe7ok daha y\xfcksektir. Yalnızca eksenel y\xfck hesabı yapmak yetersizdir.`,subsections:[]},{id:"zimbalama-cozumleri",title:"Zımbalama Yetersizliğinde 5 Ana Çözüm",content:`Zımbalama gerilmesi emniyet sınırını aştığında ($v_{pd} > v_{pr}$) şu \xf6nlemler alınır:

1. **D\xf6şeme Kalınlığını ($h_f$) Artırmak:** $d$ b\xfcy\xfcd\xfcğ\xfc i\xe7in hem $u_p$ \xe7evre uzunluğu hem de paydadaki $d$ artar; gerilme $v_{pd}$ karesel oranda d\xfcşer. En etkili \xe7\xf6z\xfcmd\xfcr.
2. **Drop Panel (D\xf6şeme Kalınlaştırması) Ekleme:** Yalnızca kolon \xe7evresinde d\xf6şeme kalınlığını artırarak lokasyona \xf6zel $d$ ve $u_p$ sağlama.
3. **Kolon Başlığı Ekleme:** Kolon \xfcst kısmını genişleterek kritik \xe7evreyi ($u_p$) kolon y\xfcz\xfcnden dışarı itme.
4. **Kolon Boyutlarını B\xfcy\xfctmek:** Kolon kesitini b\xfcy\xfctmek $u_p$'yi doğrudan uzatır.
5. **Zımbalama Donatısı (Etriye / Stud Rail) Ekleme:** Kolon \xe7evresine radyal olarak yerleştirilen \xf6zel 135\xb0 kancalı etriyeler veya **başlıklı kayma donatıları (stud rails)** ile beton dayanımını destekleme.`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`## Tasarım ve Şantiye Hataları

1. **Kolon yanına b\xfcy\xfck tesisat delikleri a\xe7mak:** Kolon y\xfcz\xfcne yakın havalandırma veya tesisat şaftı delmek kritik \xe7evreyi ($u_p$) keserek zımbalama kapasitesini aniden d\xfcş\xfcr\xfcr. Delikler kolon y\xfcz\xfcnden en az $6 cdot d$ uzakta olmalıdır.
2. **Kolon etriyesini zımbalama donatısı sanmak:** Kolon etriyesi kolon \xe7ekirdeğindedir; d\xf6şemedeki zımbalama kırılma y\xfczeyini kesmez. Zımbalama donatısı d\xf6şeme i\xe7ine konmalıdır.
3. **D\xf6şeme pas payını ihlal etmek:** \xdcst eğilme donatısı aşağı \xe7\xf6kerse $d$ k\xfc\xe7\xfcl\xfcr ve $v_{pd}$ gerilmesi aniden fırlar.
4. **Yazılımdaki Punching Ratio < 1.0 sonucuna k\xf6rlemesine g\xfcvenmek:** Moment aktarımının, kenar kolon etkisinin ve deliklerin yazılım modeline doğru girildiğini doğrulamamak.`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makaledeki zımbalama hesap y\xf6ntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 8.4)
- **TBDY 2018** — T\xfcrkiye Bina Deprem Y\xf6netmeliği, B\xf6l\xfcm 7 (Kirişsiz D\xf6şeme Zımbalama G\xfcvenliği)
- **TS EN 1992-1-1 (EC2)** — Punching Shear Design Rules`,subsections:[]}],references:[{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500 Betonarme Standartı",href:"https://www.tse.org.tr"}],relatedSlugs:["ts500-dosleme-tek-cift-dogrultulu","ts500-radye-temel-egilme-kesme","ts500-kolon-pm-etkilesimi"],tags:["zımbalama","zımbalama güvenliği","punching shear","kritik çevre","up","vpr","kolon başlığı","drop panel"]}),m({slug:"ts500-zemin-kirisi-bodrum-perdesi",title:"Zemin Kirişi ve Bodrum Perdesi Tasarımı",description:"Temel/zemin kirişleri ile bodrum perdelerinin temel işlev farkları, toprak ve hidrostatik su basınçları, konsol/çift mesnetli perde davranışı ve yatay/düşey donatı kuralları.",image:"/covers/ts500/bodrum-perdesi.png",readTime:"11 dk",keywords:["zemin kirişi","bodrum perdesi","toprak basıncı","hidrostatik su basıncı","rijit bodrum","düşey donatı","yatay donatı","su yalıtımı","TBDY bodrum"],sections:[{id:"islevsel-fark",title:"Kritik Ayrım: Zemin Kirişi vs Bodrum Perdesi",content:`M\xfchendislik pratiğinde sık\xe7a karıştırılan iki farklı eleman:

1. **Temel / Zemin Kirişi (S\xfcrekli Temel Kirişi):** Temel seviyesinde yataya yakın konumlandırılan, kolon y\xfcklerini zemine dağıtan veya tekil temelleri bir arada tutan kiriş elemanıdır. Y\xfckler d\xfcşey doğrultuludur.
2. **Bodrum Perdesi:** Yapının toprak altında kalan katlarında dış \xe7evreyi kapatan, **toprak ve yeraltı su basın\xe7larını ($q_{toprak}, q_{su}$)** i\xe7eriye aktarmayan d\xfcşey betonarme perdedir. Y\xfckler yatay doğrultuludur.

> [!IMPORTANT]
> Bodrum perdesi tek y\xf6nl\xfc veya \xe7ift y\xf6nl\xfc **eğilme plağı** gibi \xe7alışır; zemin kirişi ise **eğilme ve kesme kirişi** gibi \xe7alışır. Y\xfck doğrultuları ve donatı y\xf6nleri tamamen farklıdır.`,subsections:[]},{id:"bodrum-perdesi-yukleri",title:"Bodrum Perdesine Etki Eden Yükler",content:`Bodrum perdesi dış ortamdan i\xe7eriye doğru dik (yatay) kuvvetler taşır:

## 1. Toprak İtkisi ($p_a$ veya $p_0$)

- **Aktif Toprak Basıncı ($p_a$):** Perdenin dışa doğru yatay esnemesine izin verilen durumlarda (\xfc\xe7gen gerilme dağılımı).
- **S\xfck\xfbnetle Toprak Basıncı ($p_0$):** Perde \xfcstte d\xf6şemelerle tutulu ve rijitse perdenin esnemesine izin verilmez. S\xfck\xfbnet basıncı ($K_0 approx 0.5$) kullanılır.

## 2. Hidrostatik Su Basıncı ($p_w$)

Yeraltı su seviyesi ($YSS$) varlığında su basıncı derinlikle doğrusal artar ($p_w = gamma_w cdot h_w$). **Su basıncı azaltılamaz ve ihmal edilemez.**

## 3. S\xfcrşarj Y\xfckleri ($q_{s\xfcrşarj}$)

Bina \xe7evresindeki ara\xe7 trafiği, itfaiye yolu veya komşu yapı y\xfckleri eşdeğer s\xfcrşarj y\xfck\xfc ($q$) olarak perdenin t\xfcm y\xfcksekliğine etki eder.

\`\`\`
Toplam Dış Basın\xe7: p(z) = K0 \xd7 (γ \xd7 z + q_s\xfcrşarj) + γw \xd7 zw
\`\`\``,subsections:[]},{id:"perde-mesnet-davranisi",title:"Bodrum Perdesi Statik Çalışma Modelleri",content:`Bodrum perdesi mesnet koşullarına g\xf6re 2 şekilde modellenir:

## 1. D\xfcşey Şerit Modeli (En Yaygın)

Perde alt tarafta **radye temele (ankastre)**, \xfcst tarafta **zemin kat d\xf6şemesine (pimli/mafsallı tutulu)** bağlıdır.
- **En B\xfcy\xfck Moment:** Perde alt kısımlarında veya y\xfcksekliğin $1/3$'\xfcnde oluşur.
- **Ana \xc7ekme Donatısı:** İ\xe7 y\xfczeyde d\xfcşey doğrultudadır ($M > 0$).

## 2. İki Doğrultulu Plak Modeli

Perde iki yanından dik betonarme perdelere (enine perdeler) bağlıysa plak gibi iki y\xf6nde \xe7alışır. Bu durumda enine yatay donatılar da ana moment taşır.`,subsections:[]},{id:"donati-yerlesimi-ve-tbdy",title:"Bodrum Perdesi Donatı Kuralları ve TBDY 2018",content:`## Donatı Yerleşim Esasları

- **Dış Y\xfcz Donatısı (Toprağa Bakan Y\xfcz):** Toprak tarafındaki y\xfczde oluşabilecek negatif momentler, sıcaklık ve r\xf6tre \xe7atlaklarını \xf6nlemek i\xe7in donatı konur.
- **İ\xe7 Y\xfcz Donatısı (Bina İ\xe7i Y\xfcz):** Ana a\xe7ıklık momentini karşılayan d\xfcşey donatılar bu y\xfczde bulunur.

## Minimum Donatı Oranları

TS 500 ve TBDY uyarınca bodrum perdelerinde:
- D\xfcşey donatı oranı: $\rho_v ge 0.0025$ (her iki y\xfczde toplam)
- Yatay donatı oranı: $\rho_h ge 0.0025$ (her iki y\xfczde toplam)
- \xc7ift sıra donatı zorunludur ($h_w ge 15	ext{ cm}$ ise).
- \xc7ift sıra donatılar birbirine **\xe7irozlar** ile tutturulmalıdır (m\xb2'de en az 4 adet).

> [!NOTE]
> **Rijit Bodrum Kat Kavramı (TBDY 2018):** Binanın \xe7evresi en az 4 taraftan kesintisiz bodrum perdeleriyle \xe7evriliyse ve rijit d\xf6şemelerle tutulmuşsa TBDY Bodrum Kat Periyodu hesabı i\xe7in perdenin rijitliği esas alınır.`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`## Tasarım ve Şantiye Hataları

1. **Yeraltı su seviyesini hesaba katmamak:** YSS hesaba katılmazsa su basıncı perdeyi \xe7atlatıp i\xe7eriye su sızdırır.
2. **Toprak s\xfcrşarj y\xfcklerini (otopark/itfaiye yolu) ihmal etmek.**
3. **Ana \xe7ekme donatısını dış y\xfcze koymak:** D\xfcşey şerit modelinde a\xe7ıklık momenti perde i\xe7 y\xfcz\xfcndedir; donatının i\xe7 y\xfcze konulması gerekir.
4. **\xc7irozları unutmak:** \xc7ift sıra donatı ağının beton d\xf6k\xfcm\xfcnde devrilmesini ve pas payı kaybını \xf6nlemek i\xe7in \xe7iroz şarttır.
5. **Soğuk derz su yalıtımını yapmamak:** Temel-perde birleşim derzine su tutucu bant (su stoperi / şişen bant) koymamak.`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makaledeki hesap y\xf6ntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 11.4)
- **TBDY 2018** — T\xfcrkiye Bina Deprem Y\xf6netmeliği, B\xf6l\xfcm 7 & B\xf6l\xfcm 16 (Rijit Bodrum Perdeleri)
- **TS EN 1997-1 (Eurocode 7)** — Retaining Structures and Earth Pressure`,subsections:[]}],references:[{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500 Betonarme Standartı",href:"https://www.tse.org.tr"}],relatedSlugs:["ts500-radye-temel-egilme-kesme","ts500-tekil-birlesik-temel-tasarimi","ts500-beton-ortusu-durabilite"],tags:["zemin kirişi","bodrum perdesi","toprak basıncı","su basıncı","rijit bodrum","düşey donatı","çiroz"]}),m({slug:"ts500-tekil-birlesik-temel-tasarimi",title:"Tekil ve Birleşik Temel Tasarımı",description:"Tekil (münferit) ve birleşik temel boyutlandırması, zemin Emniyet gerilmesi (qem), eksantrik zemin taban basıncı, tek yönlü kesme ve donatı detayları.",image:"/covers/ts500/temel-radye.png",readTime:"11 dk",keywords:["tekil temel","birleşik temel","zemin emniyet gerilmesi","qem","taban basıncı","eksantrik yük","tek yönlü kesme","temel donatısı","filiz donatısı"],sections:[{id:"geoteknik-vs-betonarme",title:"Temel Tasarımında 2 Temel Boyutlandırma Adımı",content:`Temel tasarımı iki farklı m\xfchendislik disiplininin kesişimindedir:

1. **Geoteknik Boyutlandırma (Plan Boyutu $B 	imes L$):** Temel taban alanının zeminin emniyetle taşıyabileceği seviyede tutulması ($q_{max} le q_{	ext{em}}$). Servis y\xfckleri ($G+Q$) kullanılır.
2. **Betonarme Boyutlandırma (Kalınlık $h$ ve Donatı $A_s$):** Temel beton k\xfctlesinin eğilme, tek y\xf6nl\xfc kesme ve zımbalama altında kırılmaması. Tasarım y\xfckleri ($1.4G + 1.6Q$ veya $1.0G + 1.0Q pm 1.0E$) kullanılır.

> [!IMPORTANT]
> **Plan Boyutunu Zemin Belirler, Kalınlık ve Donatıyı Betonarme Belirler.**
> Zemin zayıfsa temel taban alanı ($B 	imes L$) b\xfcy\xfct\xfcl\xfcr. Kolon y\xfck\xfc y\xfcksekse temel kalınlığı ($h$) ve donatı alanı ($A_s$) b\xfcy\xfct\xfcl\xfcr.`,subsections:[]},{id:"tekil-temel-tasarimi",title:"Tekil (Münferit) Temel Tasarımı",content:`Tek bir kolonun altındaki bağımsız taban plağıdır ($B 	imes L$).

## 1. Zemin Taban Basıncı ($q$)

- **Merkezi Y\xfckl\xfc Tekil Temel ($M = 0$):**
  \`\`\`
  q = (G + Q) / (B \xd7 L)  ≤  qem
  \`\`\`
- **Eksantrik Y\xfckl\xfc Tekil Temel ($M 
eq 0$):** Kolondan gelen moment nedeniyle taban gerilmesi trapez veya \xfc\xe7gen olur ($e = M / N$):
  \`\`\`
  qmax,min = (N / A) \xb1 (M / W)
  qmax ≤ 1.50 \xd7 qem  (depremli durumda TBDY B\xf6l\xfcm 16 esasları)
  \`\`\`

## 2. Eğilme Momenti ve Donatı

Kritik eğilme kesiti **kolon y\xfcz\xfcd\xfcr.** Kolon y\xfcz\xfcndeki konsol zemin basıncından oluşan moment hesabı:

\`\`\`
M_tasarım = q_tasarım \xd7 L_konsol\xb2 / 2
As = M_tasarım / (fyd \xd7 z)
\`\`\`

## 3. Tek Y\xf6nl\xfc Kesme (Kiriş Kesmesi)

Kritik kesme kesiti **kolon y\xfcz\xfcnden $d$ mesafededir.** Beton kesme kapasitesi $V_c = 0.52 cdot f_{ctd} cdot B cdot d$ etriyesiz olarak $V_d le V_c$ şartını sağlamalıdır.`,subsections:[]},{id:"birlesik-temel-tasarimi",title:"Birleşik (Müstereki) Temel Tasarımı",content:`İki veya daha fazla kolonun birbirine \xe7ok yakın olduğu veya arsa sınırında kolonun dışa taşamadığı durumlarda iki kolon tek bir temel altında birleştirilir.

## Neden Birleşik Temel Yapılır?

- **Arsa Sınırı Kolonu:** Kolon arsa sınırındadır; dışa doğru temel pabu\xe7 \xe7ıkıntısı yapılamaz.
- **Yakın Kolonlar:** İki tekil temel yapıldığında pabu\xe7lar birbiriyle \xe7akışır.

## Bileşke Y\xfck Merkezliği (Uniform Gerilme Şartı)

Zeminde d\xfczg\xfcn (\xfcniform) taban gerilmesi elde etmek i\xe7in **temel alanının ağırlık merkezi ile kolondan gelen bileşke kuvvetin ($R = N_1 + N_2$) etki \xe7izgisi \xe7akıştırılmalıdır.**

\`\`\`
x_bileşke = (N1 \xd7 x1 + N2 \xd7 x2) / (N1 + N2)
Temel Boyu L = 2 \xd7 x_bileşke
\`\`\`

> [!NOTE]
> Birleşik temeller iki kolon arasında \xfcst y\xfczde \xe7ekme (negatif moment) yaparlar. Bu nedenle birleşik temellerde kolonlar arasında **\xdcST DONATI** zorunludur.`,subsections:[]},{id:"bag-kirisleri",title:"Temel Bağ Kirişleri (TS 500 ve TBDY 2018)",content:`Tekil temeller deprem sırasında birbirinden bağımsız hareket edemez. TBDY 2018 uyarınca t\xfcm tekil temeller iki doğrultuda **Temel Bağ Kirişleri (Hatıllar)** ile birbirine bağlanmalıdır.

- **G\xf6rev:** Temeller arasındaki farklı oturma ve yanal deprem \xf6telenmelerini engellemek.
- **Donatı:** Bağ kirişleri hem \xe7ekme hem basın\xe7 taşıyacak şekilde kesintisiz boyuna donatılı ve kapalı etriyeli olmalıdır.`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`## Tasarım Hataları

1. **Eksantrik gerilmeyi ihmal edip sadece $N/A$ kontrol\xfc yapmak:** Kolon momentinden kaynaklanan $q_{max}$ gerilmesini zemin dayanımıyla karşılaştırmamak.
2. **Birleşik temelde \xfcst donatıyı unutmak:** Kolonlar arasında oluşan negatif momenti g\xf6z ardı edip yalnızca alt donatı koymak.
3. **Temelde pas payını az tutmak:** Toprakla temas eden temellerde pas payı **en az 50 mm** (grobetonsuz d\xf6k\xfcmde 75 mm) olmalıdır. 25 mm pas payı korozyona yol a\xe7ar.
4. **Zımbalama kontrol\xfcn\xfc yapmamak.**`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makaledeki hesap y\xf6ntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 12.1, 12.2)
- **TBDY 2018** — T\xfcrkiye Bina Deprem Y\xf6netmeliği, B\xf6l\xfcm 16 (Temel Tasarımı)
- **TS EN 1997-1 (EC7)** — Foundation Design`,subsections:[]}],references:[{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500 Betonarme Standartı",href:"https://www.tse.org.tr"}],relatedSlugs:["ts500-radye-temel-egilme-kesme","ts500-zemin-kirisi-bodrum-perdesi","ts500-doseme-zimbalama-guvenligi"],tags:["tekil temel","birleşik temel","zemin emniyet gerilmesi","qem","taban basıncı","eksantrik yük","bağ kirişi"]}),m({slug:"ts500-radye-temel-egilme-kesme",title:"Radye Temellerde Eğilme ve Kesme Kontrolleri",description:"Radye temel türleri (düz radye, kirişli radye), zemin yatak katsayısı (ks), kolon ve perde altı moment zarfları, alt ve üst donatı hesabı, radye zımbalama kontrolü.",image:"/covers/ts500/temel-radye.png",readTime:"12 dk",keywords:["radye temel","düz radye","kirişli radye","zemin yatak katsayısı","ks","radye zımbalama","alt donatı","üst donatı","kolon şeridi","TBDY radye"],sections:[{id:"radye-temel-nedir",title:"Radye Temel Nedir ve Ne Zaman Tercih Edilir?",content:`Radye temel (plak temel), binanın t\xfcm tabanını kaplayan devasa bir betonarme plaktır.

## Tercih Sebepleri

1. **Zemin Taşıma G\xfcc\xfc D\xfcş\xfckse:** Yapı y\xfcklerini geniş bir alana yayarak zemin taban gerilmesini ($q$) minimize etmek.
2. **Tekil Temel Alanları Toplamı %50'yi Aşıyorsa:** Tekil veya şerit temellerin alanı bina taban alanının %50'sini ge\xe7iyorsa radye temel yapmak daha ekonomik ve pratiktir.
3. **Farklı Oturmaları (Differential Settlement) \xd6nlemek:** Homojen olmayan zeminlerde binanın tek par\xe7a halinde \xfcniform oturmasını sağlamak.
4. **Su Yalıtımı ve Bodrum Katları:** Yeraltı su seviyesinin y\xfcksek olduğu durumlarda boh\xe7alama yalıtım yapmak i\xe7in d\xfcz radye y\xfczeyi idealdir.`,subsections:[]},{id:"radye-turleri",title:"Radye Temel Türleri: Düz Radye vs Kirişli Radye",content:`Radye temeller iki ana grupta tasarlanır:

## 1. D\xfcz Radye (Plak Radye)

T\xfcm taban sabitleştirilmiş uniform kalınlıkta ($h = 60 - 150	ext{ cm}$) d\xfcz plak olarak d\xf6k\xfcl\xfcr.
- **Avantajı:** Kalıp iş\xe7iliği ve donatı iş\xe7iliği son derece basittir. Yalıtım uygulaması kolaydır.
- **Dezavantajı:** Kolon altlarında zımbalama ve moment y\xfcksek olduğu i\xe7in plak kalınlığı fazla \xe7ıkabilir.

## 2. Kirişli Radye

Kolon ve perde aksları altında kalın zemin kirişleri, kirişlerin arasında ise daha ince radye plakları bulunur.
- **\xdcstten Kirişli Radye:** Kirişler radye plaktan yukarı doğru \xe7ıkar (bodrum kat kullanımını zorlaştırabilir).
- **Alttan Kirişli Radye:** Kirişler toprağa doğru kazılır (hafriyat iş\xe7iliği zordur).

> [!NOTE]
> G\xfcn\xfcm\xfcz modern konut ve y\xfcksek binalarında kalıp kolaylığı ve rijitlik nedeniyle **D\xfcz Radye Plak** \xe7\xf6z\xfcm\xfc ezici \xe7oğunlukla tercih edilmektedir.`,subsections:[]},{id:"radye-statik-davranisi",title:"Radye Temelde Ters Döşeme Mantığı ve Donatı Yerleşimi",content:`Radye temel, **aşağıdan yukarıya doğru zemin tepki basıncıyla y\xfcklenmiş ters d\xf6şeme** gibi \xe7alışır:

- **Kolon Altları (Mesnetler):** Kolonlar zemine basar. Zemin basıncı plak ortasını yukarı iterken kolon donatıyı tutar. Bu nedenle kolon altlarında **\xdcST DONATI (Mesnet Donatısı)** \xe7ekme taşır.
- **A\xe7ıklık Ortaları:** İki kolon veya perde arasındaki a\xe7ıklıkta zemin yukarı iter. Bu nedenle a\xe7ıklık ortasında **ALT DONATI (A\xe7ıklık Donatısı)** \xe7ekme taşır.

\`\`\`
Kolon Altları   → \xdcst Donatı \xc7ekmede (Negatif Moment)
A\xe7ıklık Ortası  → Alt Donatı \xc7ekmede (Pozitif Moment)
\`\`\`

> [!WARNING]
> Klasik d\xf6şemenin tam tersidir! Normal d\xf6şemede a\xe7ıklıkta alt donatı, mesnette \xfcst donatı bulunurken; radyede zemin basıncı aşağıdan yukarı ittiği i\xe7in kolon altında \xfcst donatı yoğunlaşır.`,subsections:[]},{id:"radye-zimbalama-ve-kesme",title:"Radye Temellerde Zımbalama ve Kesme Kontrolü",content:`Radye temellerde kalınlığı belirleyen ana unsur \xe7oğu zaman eğilme değil, **kolon ve perde etrafındaki zımbalama ve tek y\xf6nl\xfc kesme** kontrolleridir.

## Radye Zımbalama Kontrol\xfc

Kolondan radyeye aktarılan eksenel y\xfck ($N_d$), zımbalama kritik \xe7evresi ($u_p$) i\xe7indeki zemin tepki basıncı d\xfcş\xfcld\xfckten sonra net zımbalama kuvvetini ($V_{pd}$) verir:

\`\`\`
Vpd = Nd - (q_zemin \xd7 A_kritik)
vpd = Vpd / (up \xd7 d)  ≤  vpr
\`\`\`

Radye temellerde radye donatısını zımbalama donatısı olarak kullanmak yerine **radye plak kalınlığını ($h$) artırmak** \xe7ok daha g\xfcvenli ve pratik bir \xe7\xf6z\xfcmd\xfcr (\xf6r. $h = 80	ext{ cm} \rightarrow 100	ext{ cm}$).

## Perde U\xe7ları Zımbalaması

TBDY 2018 uyarınca radye temellerde sadece kolonlar değil, **perde u\xe7 b\xf6lgeleri ve perde k\xf6şeleri** de zımbalama ve kesme a\xe7ısından kritik \xe7evre hesabı yapılarak kontrol edilmelidir.`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`## Tasarım Hataları

1. **Zemin Yatak Katsayısını ($k_s$) sabit/sonsuz rijit almak:** Zeminin yay davranışını ihmal edip radye plağın elastik oturma ve moment dağılımını yanlış hesaplamak (Winkler zemin modeli kullanılmalıdır).
2. **Kolon altındaki \xfcst donatıyı eksik koymak:** Ters d\xf6şeme mantığını unutup kolon altında \xfcst donatı yoğunlaştırmasını yapmamak.
3. **Radye pas payını az tutmak:** Radye alt donatısında grobeton \xfczeri pas payı **en az 50 mm** olmalıdır.
4. **Perde altlarındaki zımbalama ve kayma gerilmesini kontrol etmemek.**
5. **Radye sehpa donatısını unutmak:** \xc7ift sıra ağır donatı ağının (\xf6r. \xd820/15cm) d\xf6k\xfcm sırasında \xe7\xf6kmesini \xf6nlemek i\xe7in rijit sehpalar konulmalıdır.`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makaledeki radye hesap y\xf6ntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 12.3)
- **TBDY 2018** — T\xfcrkiye Bina Deprem Y\xf6netmeliği, B\xf6l\xfcm 16 (Radye Temel Tasarımı ve Winkler Zemin Yatak Modeli)
- **TS EN 1997-1 (EC7)** — Geotechnical Design of Mat Foundations`,subsections:[]}],references:[{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500 Betonarme Standartı",href:"https://www.tse.org.tr"}],relatedSlugs:["ts500-tekil-birlesik-temel-tasarimi","ts500-zemin-kirisi-bodrum-perdesi","ts500-doseme-zimbalama-guvenligi"],tags:["radye temel","düz radye","kirişli radye","zemin yatak katsayısı","ks","radye zımbalama","alt donatı","üst donatı"]}),m({slug:"ts500-betonarme-merdiven",title:"Betonarme Merdiven Tasarımı ve Hesabı (TS 500)",description:"Eğik plak ve sahanlık analizleri, eğik yük dönüştürme, ana donatı ve dağıtma donatısı yerleşimi, kırık köşe ankrajı ve TBDY 2018 deprem etkileşimi.",image:"/covers/ts500/merdiven.png",readTime:"11 dk",keywords:["betonarme merdiven","merdiven hesabı","eğik plak","sahanlık","eğik boy","kırık köşe donatısı","dağıtma donatısı","TBDY merdiven","basamak yükü"],sections:[{id:"merdiven-sistemleri",title:"Betonarme Merdiven Taşıyıcı Tipleri",content:`Betonarme merdivenler mimari ve statik d\xfczenine g\xf6re 4 farklı sistemde tasarlanır:

1. **Boyuna \xc7alışan Plak Merdiven (En Yaygın):** Merdiven kolu ve sahanlıklar aynı plakta birleşir, alt ve \xfcst sahanlık kirişlerine/d\xf6şemelerine basar. A\xe7ıklık boyuna doğrultuda ge\xe7ilir.
2. **Enine \xc7alışan Plak Merdiven:** Merdiven plakları iki yanındaki merdiven perdelerine veya merdiven kirişlerine basar.
3. **Omurga Kirişli / Konsol Basamaklı Merdiven:** Ortadaki tek bir betonarme/\xe7elik omurga kirişine konsol bağlanan basamaklar.
4. **\xc7ift Kirişli Yanak Merdiven:** İki yandaki eğik kirişlerin basamakları taşıması.

> [!NOTE]
> Konut ve ticari binalarda en yaygın kullanılan tip **Boyuna \xc7alışan \xc7ift Sahanlıklı Eğik Plak Merdiven** sistemidir.`,subsections:[]},{id:"yuk-donusturme",title:"Eğik Kol Yükü ve Yatay İzdüşüme Dönüştürme",content:`Merdiven kolu $alpha$ a\xe7ısıyla eğimlidir. İki y\xfck bileşeni hesaplanır:

1. **Eğik Plak Kendi Ağırlığı ($g_{	ext{plak}}$):** Plak dik kalınlığı $h_f$ ise eğik plak ağırlığı yatay izd\xfcş\xfcmde $g_{	ext{plak}} = gamma_c cdot h_f / cosalpha$ olur.
2. **Basamak Kendi Ağırlığı ($g_{	ext{basamak}}$):** Rıht y\xfcksekliği $h_r$ olan basamakların eşdeğer yatay y\xfck katkısı $g_{	ext{basamak}} = gamma_c cdot h_r / 2$ olur.

\`\`\`
Toplam Yatay İzd\xfcş\xfcm Sabit Y\xfck\xfc: g_toplam = (γc \xd7 hf / cosα) + (γc \xd7 hr / 2) + g_kaplama
\`\`\`

- **Eğim A\xe7ısı ($alpha$):** $	analpha = h_r / b_r$ (Rıht y\xfcksekliği / Basamak genişliği)
- **Hareketli Y\xfck ($q$):** TS 498 uyarınca konut merdivenlerinde $q ge 3.5	ext{ kN/m}^2$, umumi binalarda $q ge 5.0	ext{ kN/m}^2$ alınmalıdır.`,subsections:[]},{id:"statik-analiz-ve-moment",title:"Eğik Kol + Sahanlık Bütünleşik Moment Hesabı",content:`Eğik kol ile yatay sahanlık birleştiğinde kırıklı bir \xe7izgi oluşur. Yatay izd\xfcş\xfcm a\xe7ıklığı $L = L_1 + L_{	ext{kol}} + L_2$ olmak \xfczere:

\`\`\`
Qu = 1.4 \xd7 g_toplam + 1.6 \xd7 q
M_a\xe7ıklık = Qu \xd7 L\xb2 / 8  (veya TS 500 katsayılı mesnet analizi)
\`\`\`

## Donatı Hesabı

Eğik kolun dik faydalı y\xfcksekliği $d = h_f - c - phi/2$ esas alınarak ana \xe7ekme donatısı hesabı yapılır:

\`\`\`
As = M_d / (fyd \xd7 z)
\`\`\`

> [!IMPORTANT]
> **Kırık K\xf6şe Donatı Detayı (Dışb\xfckey vs İ\xe7b\xfckey K\xf6şe):**
> Sahanlık ile eğik kol birleşiminde donatı **i\xe7b\xfckey (i\xe7 konkav) k\xf6şede doğrudan b\xfck\xfcl\xfcp devam ettirilemez!** Donatı b\xfck\xfcld\xfcğ\xfc noktada betonu pas payı y\xf6n\xfcnde dışarı fırlatmaya (yarılmaya) \xe7alışır.
> - Kırık i\xe7 k\xf6şelerde alt donatı b\xfck\xfclmeden karşı sahanlığın ve kolun i\xe7ine en az **kenetlenme boyu ($l_b$)** kadar uzatılarak **\xe7apraz (\xe7aprazlanan) donatı** şeklinde detaylandırılmalıdır!`,subsections:[]},{id:"tbdy-2018-deprem-etkilesimi",title:"TBDY 2018 Merdiven Deprem Etkileşimi",content:`TBDY 2018 B\xf6l\xfcm 7 uyarınca merdivenler yapının deprem analiz modelinde doğrudan dikkate alınmalıdır:

1. **Katlar Arası Diyagonal Payanda Etkisi:** Merdiven k\xfctlesi ve eğik plakları, iki kat arasında rijit bir \xe7apraz eleman (payanda) gibi \xe7alışarak kata ek rijitlik katar ve deprem kuvveti \xe7eker.
2. **Kat \xd6telenmesi Hasarı:** Depremde katlar g\xf6reli \xf6telenme yaptığında merdiven sahanlık birleşimlerinde y\xfcksek kesme ve eğilme gerilmeleri oluşur.
3. **Esnek / Kayıcı Mesnet \xc7\xf6z\xfcm\xfc:** Merdiven kolunun bir ucunun kayıcı (izolat\xf6rl\xfc veya elastomer mesnetli) yapılarak katlar arası \xe7apraz etkisi oluşturmasının \xf6nlenmesi \xf6nerilebilir.`,subsections:[]},{id:"sik-hatalar",title:"Sık Yapılan Hatalar",content:`## Tasarım ve Şantiye Hataları

1. **Sahanlık birleşiminde donatıyı b\xfck\xfcp ge\xe7irmek:** Kırık i\xe7 k\xf6şede donatıyı b\xfck\xfcp pas payını patlatmak (donatı \xe7apraz uzatılmalıdır).
2. **Eğik plak dik kalınlığını ($h_f$) basamak y\xfcksekliğiyle karıştırmak:** Dik kalınlık basamak dibinden \xf6l\xe7\xfclen net beton kalınlığıdır.
3. **Hareketli y\xfck\xfc d\xfcş\xfck almak:** Merdivenler yangın ve ka\xe7ış anında y\xfcksek insan yığılmasına maruz kalır ($q ge 3.5 - 5.0	ext{ kN/m}^2$).
4. **Dağıtma donatısını atlamak:** Eğik plakta ana donatıya dik y\xf6nde dağıtma donatısı konulmazsa boyuna \xe7atlaklar oluşur.`,subsections:[]},{id:"dayanak",title:"Mevzuat Dayanağı",content:`Bu makaledeki hesap y\xf6ntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 11.2)
- **TBDY 2018** — T\xfcrkiye Bina Deprem Y\xf6netmeliği, B\xf6l\xfcm 7 (Merdivenlerin Deprem Modelindeki Etkisi)
- **Planlı Alanlar İmar Y\xf6netmeliği (2026)** — Merdiven Basamak ve Sahanlık \xd6l\xe7\xfc Sınırları`,subsections:[]}],references:[{label:"AFAD — Türkiye Bina Deprem Yönetmeliği 2018",href:"https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi"},{label:"TSE — TS 500 Betonarme Standartı",href:"https://www.tse.org.tr"}],relatedSlugs:["ts500-dosleme-tek-cift-dogrultulu","ts500-surekli-kiris-moment-dagilimi","ts500-kenetlenme-ek-yeri"],tags:["betonarme merdiven","merdiven hesabı","eğik plak","sahanlık","eğik boy","kırık köşe donatısı","dağıtma donatısı"]})],o=new Set(n.map(a=>a.slug)),p=c.default.join(process.cwd(),"src/lib/data.json"),q=null;function r(){let a=function(){try{let a=b.default.statSync(p);return`${a.mtimeMs}:${a.size}`}catch(a){throw Error(`Makale veri dosyası bilgisi alınamadı: ${p} (${a instanceof Error?a.message:"bilinmeyen hata"})`)}}();if(q?.signature===a)return q;let c=function(a){try{let b=JSON.parse(a),c=Object.fromEntries(Object.entries(b).filter(([a])=>!o.has(a)).map(([a,b])=>[a,function(a){var b;if("deprem-yonetmelik"!==a.sectionId)return a;let c=(b=a.slug).startsWith("ts500-")?"ts500":["kisa-kolon-etkisi-tbdy-2018","tbdy-2018-guclu-kolon-kontrolu","betonarme-perde-tasarimi-depremde-tip-ve-boyutlandirma-kurallari"].includes(b)?"tbdy-betonarme":["mevcut-binalarin-deprem-guvenligi-nasil-degerlendirilir","kolon-guclendirme-yontemleri-cfrp-ve-beton-mantolu","hasarli-bina-tespiti-yesil-sari-kirmizi-etiket-sistemi"].includes(b)?"mevcut-guclendirme":/^(byy-|yangin-|tasiyici-sistemlerin-yangina-|sprinkler-|duman-|kacis-|yuksek-binalarda-|bodrum-otopark-mutfak-)/.test(b)?"yangin":b.startsWith("otopark-")?"otopark":b.startsWith("imar-")?"imar":b.startsWith("bep-")?"bep":/^(zemin-|su-yalitimi-|yagmur-suyu-|tbdy-bolum-16-)/.test(b)?"su-zemin":b.startsWith("engelsiz-")?"engelsiz":b.startsWith("eurocode-")?"eurocode":b.startsWith("akustik-")?"akustik":b.startsWith("asansor-")?"asansor":b.startsWith("isg-")?"isg":b.startsWith("cevre-")?"cevre":"tbdy",d=k[c],e=j[a.slug]??a.title,f={...a,title:e,seoTitle:a.seoTitle?`${e} | M\xfchendis Mimar Portalı`:a.seoTitle,seriesId:c,category:d.category,categoryColor:d.color,badgeLabel:d.badge};if(!(j[a.slug]&&!["kisa-kolon-etkisi-tbdy-2018","tbdy-tasarim-spektrumu-cizimi","tbdy-mod-birlesim-srss-cqc"].includes(a.slug)))return f;let g=`${e}, ilgili mevzuatın kapsamı ve uygulamadaki temel proje kontrolleri \xfczerinden ele alınır.`,h=[{label:d.source.label,href:d.source.href}];return"mevcut-guclendirme"===c&&h.push({label:"Riskli Yapıların Tespit Edilmesine İlişkin Esaslar",href:"https://webdosya.csb.gov.tr/db/altyapi/icerikler/r-skl--yapilarin-tesp-t-ed-lmes-ne-il-sk-n-esaslar-20190218134628.pdf"}),{...f,description:g,seoDescription:g,author:"Mühendis Mimar Portalı",authorTitle:"Teknik İçerik Ekibi",updatedAt:"11 Ağustos 2026",readTime:"3 dk",quote:void 0,keywords:Array.from(new Set([...(a.keywords??[]).filter(a=>!/[?ÃÄÅÂ�]/.test(a)),d.badge,d.category])),tags:[d.badge,d.category],sections:[{id:"kapsam",title:"Kapsam",content:`${g}

${d.description}`,subsections:[]},{id:"proje-kontrolleri",title:"Proje kontrolleri",content:d.checks.map(a=>`- ${a}`).join("\n"),subsections:[]},{id:"dayanak",title:"Mevzuat dayanağı",content:`Ana kaynak **${d.source.label}** metnidir. Projede kullanılan s\xfcr\xfcm, madde ve yerel idare kararları g\xfcncel resm\xee belge \xfczerinden doğrulanmalıdır.`,subsections:[]}],references:h}}(b)]));for(let a of n){if(c[a.slug])throw Error(`TS 500 i\xe7eriği mevcut bir slug ile \xe7akışıyor: ${a.slug}`);c[a.slug]=a}for(let a of h){if(c[a.slug])throw Error(`Yeni deprem i\xe7eriği mevcut bir slug ile \xe7akışıyor: ${a.slug}`);c[a.slug]=a}return c}catch(a){throw Error(`Makale veri dosyası ayrıştırılamadı: ${p} (${a instanceof Error?a.message:"bilinmeyen hata"})`)}}(function(){try{return b.default.readFileSync(p,"utf8")}catch(a){throw Error(`Makale veri dosyası okunamadı: ${p} (${a instanceof Error?a.message:"bilinmeyen hata"})`)}}());return q={signature:a,articles:c,slugs:Object.keys(c),list:Object.values(c)}}function s(){return r().articles}function t(){return[...r().list]}function u(a){return r().articles[a]}function v(){return[...r().slugs]}a.s(["getAllSlugs",()=>v,"getArticleBySlug",()=>u,"getArticleList",()=>t,"getArticles",()=>s],18744)}];

//# sourceMappingURL=src_lib_articles-data_ts_ad95df72._.js.map