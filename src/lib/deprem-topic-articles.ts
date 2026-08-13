import type { ArticleData } from "./articles-data";
import type { DepremSeriesId } from "./deprem-content-types";

interface TopicSpec {
  slug: string;
  title: string;
  description: string;
  seriesId: DepremSeriesId;
  decision: string;
  checks: [string, string, string];
  keywords: string[];
}

const TBDY_PDF = "https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf";
const TBDY_PAGE = "https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi";
const SOIL_NOTICE = "https://bartin.csb.gov.tr/zemin-ve-temel-etudu-uygulama-esaslari-ve-rapor-formatina-dair-teblig-yayimlandi-haber-238675";
const BUILDING_CONTROL = "https://yapiisleri.csb.gov.tr/yapi-denetimi-daire-baskanligi-mevzuati-90235";
const CONCRETE_CIRCULAR = "https://isparta.csb.gov.tr/haberler/bakanligimizca-taze-beton-okumune-ve-numune-alimina-iliskin-2022-02-nolu-genelge-revize-edilerek-2022-07-nolu-genelge-yayinlanmistir.-267988";
const RISKY_BUILDING = "https://webdosya.csb.gov.tr/db/altyapi/icerikler/r-skl--yapilarin-tesp-t-ed-lmes-ne-il-sk-n-esaslar-20190218134628.pdf";
const IMO_DRAFT = "https://obs.imo.org.tr/bulten/news/3812/sosyal-mecralarda-yer-alan-yeni-tbdy-tebligi-hakkinda-duyuru/144309";
const GENERAL_SPEC = "https://webdosya.csb.gov.tr/db/yfk/icerikler/c18---betonarme-isler--20190412161656.pdf";

const SERIES_META: Record<DepremSeriesId, { category: string; color: string; badge: string; sourceLabel: string; sourceHref: string }> = {
  tbdy: { category: "TBDY 2018 Rehberi", color: "bg-red-600 text-white", badge: "TBDY 2018", sourceLabel: "AFAD — Türkiye Bina Deprem Yönetmeliği 2018", sourceHref: TBDY_PDF },
  "tbdy-betonarme": { category: "TBDY Betonarme Detayları", color: "bg-orange-600 text-white", badge: "TBDY Bölüm 7", sourceLabel: "AFAD — TBDY 2018, Bölüm 7", sourceHref: TBDY_PDF },
  ts500: { category: "TS 500 Betonarme", color: "bg-blue-600 text-white", badge: "TS 500", sourceLabel: "ÇŞİDB — Betonarme İşleri Genel Teknik Şartnamesi", sourceHref: GENERAL_SPEC },
  "mevcut-guclendirme": { category: "Mevcut Binalar ve Güçlendirme", color: "bg-fuchsia-700 text-white", badge: "TBDY Bölüm 15", sourceLabel: "AFAD — TBDY 2018, Bölüm 15", sourceHref: TBDY_PDF },
  "yapi-denetimi": { category: "Yapı Denetimi ve Malzeme", color: "bg-amber-600 text-zinc-950", badge: "Saha Kontrolü", sourceLabel: "ÇŞİDB — Yapı Denetimi Mevzuatı", sourceHref: BUILDING_CONTROL },
  yangin: { category: "Yangın Yönetmeliği", color: "bg-orange-700 text-white", badge: "Yangın", sourceLabel: "ÇŞİDB — Yangın mevzuatı", sourceHref: "https://meslekihizmetler.csb.gov.tr/" },
  otopark: { category: "Otopark Yönetmeliği", color: "bg-slate-700 text-white", badge: "Otopark", sourceLabel: "ÇŞİDB — Otopark mevzuatı", sourceHref: "https://meslekihizmetler.csb.gov.tr/" },
  imar: { category: "İmar Mevzuatı", color: "bg-emerald-700 text-white", badge: "İmar", sourceLabel: "ÇŞİDB — İmar mevzuatı", sourceHref: "https://meslekihizmetler.csb.gov.tr/" },
  bep: { category: "BEP-TR / TS 825", color: "bg-lime-600 text-zinc-950", badge: "Enerji", sourceLabel: "ÇŞİDB — Enerji verimliliği mevzuatı", sourceHref: "https://meslekihizmetler.csb.gov.tr/" },
  "su-zemin": { category: "Zemin, Temel ve Su", color: "bg-cyan-700 text-white", badge: "Zemin ve Temel", sourceLabel: "ÇŞİDB — Zemin ve Temel Etüdü Tebliği", sourceHref: SOIL_NOTICE },
  engelsiz: { category: "Engelsiz Tasarım", color: "bg-violet-700 text-white", badge: "Erişilebilirlik", sourceLabel: "ÇŞİDB — Erişilebilirlik mevzuatı", sourceHref: "https://meslekihizmetler.csb.gov.tr/" },
  eurocode: { category: "Eurocode Standartları", color: "bg-indigo-700 text-white", badge: "Eurocode", sourceLabel: "Türk Standardları Enstitüsü", sourceHref: "https://www.tse.org.tr/" },
  akustik: { category: "Akustik ve Gürültü", color: "bg-zinc-700 text-white", badge: "Akustik", sourceLabel: "ÇŞİDB — Binaların Gürültüye Karşı Korunması", sourceHref: "https://meslekihizmetler.csb.gov.tr/" },
  asansor: { category: "Asansör Yönetmeliği", color: "bg-teal-700 text-white", badge: "Asansör", sourceLabel: "Sanayi ve Teknoloji Bakanlığı", sourceHref: "https://www.sanayi.gov.tr/" },
  isg: { category: "İSG ve Şantiye Güvenliği", color: "bg-amber-700 text-white", badge: "İSG", sourceLabel: "Çalışma ve Sosyal Güvenlik Bakanlığı", sourceHref: "https://www.csgb.gov.tr/" },
  cevre: { category: "Çevre Mevzuatı", color: "bg-green-700 text-white", badge: "Çevre", sourceLabel: "ÇŞİDB — Çevre mevzuatı", sourceHref: "https://cygm.csb.gov.tr/" },
};

const topics: TopicSpec[] = [
  {
    slug: "tbdy-bks-dts-bys-belirleme",
    title: "BKS, DTS ve BYS'nin Birlikte Belirlenmesi",
    description: "Bina kullanım sınıfı, deprem tasarım sınıfı ve bina yükseklik sınıfını tek karar akışında ele alır.",
    seriesId: "tbdy",
    decision: "Önce kullanım ve önem katsayısı, ardından harita-parametre-zemin ilişkisi, son olarak bina yüksekliği okunur. Bu sıra bozulursa taşıyıcı sistem tablosu yanlış seçilebilir.",
    checks: ["BKS ve bina önem katsayısını kullanım amacıyla eşleştirin.", "SDS üzerinden DTS'yi, özel durumlarda ilgili alt sınıfı belirleyin.", "Toplam bina yüksekliğini doğru referans kotundan ölçerek BYS'yi seçin."],
    keywords: ["BKS", "DTS", "BYS", "bina yüksekliği"],
  },
  {
    slug: "tbdy-performans-hedefleri-dd-sh-kh-go",
    title: "DD Düzeylerine Göre SH, KH ve GÖ Performans Hedefleri",
    description: "Deprem yer hareketi düzeyleri ile sınırlı hasar, kontrollü hasar ve göçmenin önlenmesi hedeflerini eşleştirir.",
    seriesId: "tbdy",
    decision: "Performans hedefi analiz sonunda verilen bir etiket değil, kullanılacak değerlendirme yöntemini ve kabul sınırlarını baştan belirleyen tasarım girdisidir.",
    checks: ["Bina kullanım sınıfına göre hedef performans tablosunu seçin.", "DD-1, DD-2, DD-3 ve DD-4 düzeylerini birbirine karıştırmayın.", "Yeni bina ve mevcut bina hedeflerini aynı kabul tablosuyla değerlendirmeyin."],
    keywords: ["performans hedefi", "SH", "KH", "GÖ", "DD-2"],
  },
  {
    slug: "tbdy-etkin-kesit-rijitlikleri",
    title: "Kiriş, Kolon, Perde ve Döşemelerde Etkin Kesit Rijitlikleri",
    description: "Çatlama etkisini temsil eden etkin rijitliklerin analiz modeline nasıl aktarılacağını açıklar.",
    seriesId: "tbdy",
    decision: "Brüt kesit rijitliğinin kontrolsüz kullanılması periyot, ötelenme ve iç kuvvet dağılımını değiştirir; eleman türüne uygun etkin değerler model notlarında kayıt altına alınmalıdır.",
    checks: ["Eleman bazında eğilme ve kesme rijitliği kabullerini listeleyin.", "Perde, bağ kirişi ve döşeme kabullerini ayrı tanımlayın.", "Model raporundaki değerleri proje hesap özetiyle karşılaştırın."],
    keywords: ["etkin rijitlik", "çatlamış kesit", "modelleme"],
  },
  {
    slug: "tbdy-kutle-kaynagi-hareketli-yuk-katilimi",
    title: "Deprem Hesabında Kütle Kaynağı ve Hareketli Yük Katılımı",
    description: "Sabit yükler ile hareketli yüklerin deprem kütlesine hangi mantıkla katıldığını gösterir.",
    seriesId: "tbdy",
    decision: "Kütle kaynağı yalnız program menüsündeki bir seçim değildir; kat ağırlığını, taban kesmesini ve modal katılımı doğrudan belirler.",
    checks: ["Sabit yük, kaplama ve duvar yüklerinin kütleye dahil edildiğini doğrulayın.", "Hareketli yük katılım katsayısını kullanım türüne göre seçin.", "Kütlenin katlara ve diyaframa doğru dağıldığını kontrol edin."],
    keywords: ["kütle kaynağı", "hareketli yük", "katılım katsayısı"],
  },
  {
    slug: "tbdy-rijit-yari-rijit-diyafram",
    title: "Rijit ve Yarı Rijit Diyafram Seçimi",
    description: "Döşeme düzlem içi davranışının hangi durumda rijit, hangi durumda kabuk elemanlarla modellenmesi gerektiğini açıklar.",
    seriesId: "tbdy",
    decision: "Büyük boşluklar, düzensiz planlar ve kuvvet aktarımında kesintiler varsa tek rijit diyafram kabulü gerçek iç kuvvet yolunu gizleyebilir.",
    checks: ["Döşeme boşluklarını, konsolları ve dar bağlantı bölgelerini inceleyin.", "Aynı katta bağımsız diyafram gerektiren blokları ayırın.", "Yarı rijit modelde ağ sıklığını ve toplayıcı kuvvetlerini kontrol edin."],
    keywords: ["rijit diyafram", "yarı rijit diyafram", "döşeme"],
  },
  {
    slug: "tbdy-esdeger-deprem-yuku-uygulanma-sinirlari",
    title: "Eşdeğer Deprem Yükü Yönteminin Uygulanma Sınırları",
    description: "Yöntemin bina yüksekliği, düzensizlik ve taşıyıcı sistem koşullarına göre kullanılabilirliğini özetler.",
    seriesId: "tbdy",
    decision: "Yöntem kolay olduğu için değil, yönetmelikteki uygulanabilirlik şartları sağlandığı için seçilmelidir.",
    checks: ["DTS ve BYS koşullarını birlikte değerlendirin.", "Plan ve düşey düzensizliklerin yöntem seçimine etkisini kontrol edin.", "Bulunan taban kesmesini modal analiz gereklilikleriyle karşılaştırın."],
    keywords: ["eşdeğer deprem yükü", "analiz yöntemi", "taban kesme"],
  },
  {
    slug: "tbdy-yeterli-mod-modal-kutle-katilimi",
    title: "Yeterli Titreşim Modu ve Modal Kütle Katılımı",
    description: "Modal analizde hesaba katılacak mod sayısını ve kütle katılımının nasıl izleneceğini açıklar.",
    seriesId: "tbdy",
    decision: "Sabit sayıda mod kullanmak yerine her iki yatay doğrultuda yeterli toplam katılım sağlanana kadar analiz genişletilmelidir.",
    checks: ["X ve Y doğrultularındaki birikimli modal kütleyi ayrı okuyun.", "Burulma modlarının sonuçlara etkisini inceleyin.", "Yetersiz katılımda mod sayısını ve model serbestliklerini gözden geçirin."],
    keywords: ["mod sayısı", "modal kütle", "titreşim"],
  },
  {
    slug: "tbdy-modal-taban-kesme-olceklendirme",
    title: "Modal Taban Kesme Kuvvetinin Ölçeklendirilmesi",
    description: "Mod birleştirme sonucunun yönetmelikteki alt sınırla karşılaştırılması ve ölçeklenmesini ele alır.",
    seriesId: "tbdy",
    decision: "Ölçek katsayısı yalnız toplam taban kesmesine uygulanıp eleman sonuçları unutulmamalı; ilgili tepki büyüklükleri tutarlı biçimde ölçeklenmelidir.",
    checks: ["Modal taban kesmesini referans değere göre her doğrultuda karşılaştırın.", "Ölçek katsayısının hangi sonuç gruplarına uygulandığını belgeleyin.", "Birleşim ve tasarım zarflarının ölçekli sonuçlardan üretildiğini doğrulayın."],
    keywords: ["modal ölçekleme", "taban kesme", "spektrum analizi"],
  },
  {
    slug: "tbdy-yuzde-100-yuzde-30-birlesimi",
    title: "Birbirine Dik Deprem Doğrultularının %100–%30 Birleşimi",
    description: "İki yatay deprem doğrultusunun eleman tasarım etkilerinde birlikte ele alınmasını açıklar.",
    seriesId: "tbdy",
    decision: "Kolon, perde ve birleşim tasarımında yalnız baskın doğrultuya bakmak iki eksenli talepleri eksik bırakır.",
    checks: ["Her iki işaret ve doğrultu birleşimini üretin.", "Kolon P-M-M ve perde kuvvet zarflarını birleşik etkilerle oluşturun.", "Yazılım kombinasyonlarını hesap raporunda açıkça gösterin."],
    keywords: ["100 30 kuralı", "iki doğrultu", "yük birleşimi"],
  },
  {
    slug: "tbdy-dusey-deprem-etkisi",
    title: "Düşey Deprem Etkisinin Hesaba Katılması",
    description: "Düşey deprem bileşeninin zorunlu olduğu eleman ve açıklıklarda yük birleşimlerine nasıl girdiğini ele alır.",
    seriesId: "tbdy",
    decision: "Uzun açıklık, konsol, transfer ve öngerme benzeri düşey dinamik talebe duyarlı bölgeler proje özelinde ayıklanmalıdır.",
    checks: ["Düşey etkinin zorunlu olduğu elemanları modelden önce listeleyin.", "Düşey spektrum veya eşdeğer etkinin yük birleşimlerine girişini doğrulayın.", "Mesnet tepkileri ve açıklık momentlerindeki işaret değişimlerini inceleyin."],
    keywords: ["düşey deprem", "konsol", "yük birleşimi"],
  },
  {
    slug: "tbdy-deprem-derzi-hesabi",
    title: "Deprem Derzinin Hesabı ve Taşıyıcı Sistem Detayları",
    description: "Komşu blokların çarpışmasını önleyecek derz genişliğini ve mimari-taşıyıcı süreklilik detaylarını açıklar.",
    seriesId: "tbdy",
    decision: "Derz genişliği tek blok ötelenmesinden değil, komşu yapıların göreli hareket olasılığından türetilir.",
    checks: ["Komşu blokların kat kotlarını ve ötelenmelerini birlikte inceleyin.", "Derzi kaplama, cephe ve tesisat detaylarında kapatmayın.", "Temelden çatıya kesintisiz derz sürekliliğini projede gösterin."],
    keywords: ["deprem derzi", "çarpışma", "ötelenme"],
  },
  {
    slug: "tbdy-bolum-17-basitlestirilmis-tasarim",
    title: "TBDY Bölüm 17 Basitleştirilmiş Tasarım Yönteminin Kapsamı",
    description: "Düzenli yerinde dökme betonarme binalar için basitleştirilmiş yöntemin ön koşullarını açıklar.",
    seriesId: "tbdy",
    decision: "Bölüm 17 genel bir kısa yol değildir; bina türü, kat sayısı, geometri ve düzensizlik sınırları birlikte sağlanmalıdır.",
    checks: ["Binanın kapsam ve yükseklik sınırlarını doğrulayın.", "Plan/düşey düzenlilik koşullarını ayrı kontrol edin.", "Yöntem dışına çıkan tek bir koşulda genel analiz bölümlerine dönün."],
    keywords: ["TBDY Bölüm 17", "basitleştirilmiş tasarım", "düzenli bina"],
  },
  {
    slug: "tbdy-uygulama-esaslari-taslak-statusu",
    title: "TBDY Uygulama Esasları Tebliğ Taslağının Resmî Statüsü",
    description: "2026 yılında paylaşılan taslak metin ile yürürlükteki TBDY hükümlerinin nasıl ayrılacağını açıklar.",
    seriesId: "tbdy",
    decision: "Resmî Gazete'de yayımlanmayan taslak değerler yürürlükteki proje kuralı gibi kullanılmamalıdır; sürüm ve kaynak bilgisi hesap raporunda yazılmalıdır.",
    checks: ["Metnin Resmî Gazete yayımlanma bilgisini doğrulayın.", "Taslak hükümleri TBDY 2018 maddeleriyle karıştırmayın.", "Proje raporuna kullanılan mevzuatın tarih ve sürümünü ekleyin."],
    keywords: ["TBDY 2026", "tebliğ taslağı", "yürürlük"],
  },

  {
    slug: "tbdy-betonarme-ozel-deprem-etriyesi-ciroz",
    title: "Özel Deprem Etriyesi ve Çiroz Düzenleme Kuralları",
    description: "Etriye kancası, çiroz, sarılma ve boyuna donatı mesnetleme koşullarını birlikte açıklar.",
    seriesId: "tbdy-betonarme",
    decision: "Sadece etriye aralığına bakmak yeterli değildir; kanca geometrisi, kapalı çevrim ve her boyuna çubuğun yanal tutulması birlikte sağlanır.",
    checks: ["Kanca açılarını ve uzantılarını donatı detayında gösterin.", "Çirozların ardışık sıralarda şaşırtılmasını kontrol edin.", "Köşe ve ara boyuna donatıların yanal tutulduğunu doğrulayın."],
    keywords: ["deprem etriyesi", "çiroz", "sarılma"],
  },
  {
    slug: "tbdy-betonarme-kenetlenme-bindirme-manson-bolgeleri",
    title: "Kenetlenme, Bindirme ve Mekanik Manşonların Yasaklı Bölgeleri",
    description: "Deprem talebinin yüksek olduğu bölgelerde donatı eki ve kenetlenme kararlarını ele alır.",
    seriesId: "tbdy-betonarme",
    decision: "Plastikleşme beklenen uç bölgelerde bindirme ekinden kaçınılmalı; ek yöntemi, konumu ve kalite belgesi projede tanımlanmalıdır.",
    checks: ["Kolon ve kiriş uç bölgelerinde ek konumlarını işaretleyin.", "Bindirmelerin aynı kesitte yığılmasını önleyin.", "Mekanik manşon sınıfı ve deney belgesini proje şartıyla eşleştirin."],
    keywords: ["bindirme", "kenetlenme", "mekanik manşon"],
  },
  {
    slug: "tbdy-betonarme-kolon-kesit-eksenel-yuk-siniri",
    title: "Yüksek Süneklikli Kolonlarda Kesit ve Eksenel Yük Sınırları",
    description: "Kolon boyutları ile normalize eksenel basınç düzeyinin sünek davranış üzerindeki etkisini açıklar.",
    seriesId: "tbdy-betonarme",
    decision: "Eksenel yük büyüdükçe dönme kapasitesi azalır; kesit seçimi yalnız düşey yük kapasitesine göre yapılamaz.",
    checks: ["Kolonun en küçük kesit boyutunu doğrulayın.", "Eksenel yük oranını depremli birleşimlerden hesaplayın.", "Sınırı aşan kolonlarda kesit veya sistem düzenini revize edin."],
    keywords: ["kolon boyutu", "eksenel yük", "yüksek süneklik"],
  },
  {
    slug: "tbdy-betonarme-kolon-boyuna-donati-duzeni",
    title: "Kolon Boyuna Donatısının Dağılım ve Süreklilik Kuralları",
    description: "Kolon donatı oranı, çevre boyunca dağılım ve katlar arası süreklilik kararlarını açıklar.",
    seriesId: "tbdy-betonarme",
    decision: "Toplam donatı alanı yeterli olsa bile çubukların kesitte ve birleşim boyunca yanlış dağılımı detayın çalışmasını engeller.",
    checks: ["Minimum ve maksimum toplam donatı oranını kontrol edin.", "Çubukları kesit çevresine dengeli dağıtın.", "Kat geçişindeki çap ve adet değişimlerini kenetlenmeyle birlikte çözün."],
    keywords: ["kolon donatısı", "donatı oranı", "süreklilik"],
  },
  {
    slug: "tbdy-betonarme-kolon-sarilma-bolgeleri",
    title: "Kolon Sarılma Bölgelerinin Belirlenmesi",
    description: "Kolon uçlarında ve birleşim çevresinde sıklaştırılmış enine donatı bölgelerini tanımlar.",
    seriesId: "tbdy-betonarme",
    decision: "Sarılma boyu; kat yüksekliği, kesit boyutu ve olası plastik mafsal bölgesi birlikte değerlendirilerek çizime aktarılır.",
    checks: ["Alt ve üst uç sarılma boylarını ayrı gösterin.", "Etriye aralığı ile ilk etriye konumunu kontrol edin.", "Temel üstü ve bindirme bölgelerindeki özel koşulları uygulayın."],
    keywords: ["kolon sarılma", "etriye sıklaştırma", "plastik mafsal"],
  },
  {
    slug: "tbdy-betonarme-kolon-kapasite-kesme",
    title: "Kolonlarda Kapasite Tasarımına Göre Kesme Güvenliği",
    description: "Kolon kesme kuvvetinin analiz sonucuyla sınırlı kalmadan moment kapasitesinden türetilmesini açıklar.",
    seriesId: "tbdy-betonarme",
    decision: "Amaç, eğilme mekanizması oluşmadan gevrek kesme kırılmasının meydana gelmesini önlemektir.",
    checks: ["Kolon uç moment kapasitelerinden kapasite kesmesini hesaplayın.", "Analiz kesmesi ve kapasite kesmesinin belirleyici değerini alın.", "Beton katkısı ve enine donatı sınırlarını ilgili deprem durumuyla kontrol edin."],
    keywords: ["kolon kesme", "kapasite tasarımı", "gevrek kırılma"],
  },
  {
    slug: "tbdy-betonarme-kiris-boyut-eksen-kacikligi",
    title: "Kiriş Kesit Boyutları ve Kolon-Kiriş Eksen Kaçıklıkları",
    description: "Deprem kirişlerinde genişlik, yükseklik ve kolonla birleşim geometrisi koşullarını açıklar.",
    seriesId: "tbdy-betonarme",
    decision: "Kirişin kolona dışmerkezli bağlanması birleşim bölgesindeki kuvvet aktarımını ve burulma talebini değiştirir.",
    checks: ["Kiriş genişlik ve yükseklik sınırlarını kontrol edin.", "Kiriş ekseninin kolon çekirdeğine göre konumunu ölçün.", "Kaçıklık varsa birleşim ve burulma etkilerini ayrıca çözün."],
    keywords: ["kiriş boyutu", "eksen kaçıklığı", "birleşim"],
  },
  {
    slug: "tbdy-betonarme-kiris-mesnet-donati-surekliligi",
    title: "Kiriş Mesnet Donatılarının Sürekliliği",
    description: "Üst ve alt kiriş donatılarının kolon yüzü, birleşim ve açıklık boyunca devam koşullarını ele alır.",
    seriesId: "tbdy-betonarme",
    decision: "Moment işaretinin deprem sırasında değişebilmesi nedeniyle alt ve üst donatı sürekliliği birlikte değerlendirilir.",
    checks: ["Kolon yüzündeki pozitif ve negatif moment donatısını kontrol edin.", "Birleşim çekirdeği içinde yeterli kenetlenme sağlayın.", "Kesilen çubukların teorik kesim noktasından sonraki devam boyunu gösterin."],
    keywords: ["kiriş donatısı", "mesnet", "süreklilik"],
  },
  {
    slug: "tbdy-betonarme-kiris-sarilma-bolgeleri",
    title: "Kiriş Sarılma Bölgeleri ve Etriye Sıklaştırması",
    description: "Kiriş uçlarında plastikleşme beklenen bölgelerin uzunluğu ve etriye düzenini açıklar.",
    seriesId: "tbdy-betonarme",
    decision: "İlk etriyenin kolon yüzüne uzaklığı ve sıklaştırma bölgesinin devamı, uygulama çiziminde ölçülendirilmeyen bir not olarak bırakılmamalıdır.",
    checks: ["Her iki kiriş ucunda sarılma bölgesini ölçülendirin.", "İlk etriye konumu ve aralık sınırlarını doğrulayın.", "Bindirme eklerini sarılma ve plastikleşme bölgelerinden uzaklaştırın."],
    keywords: ["kiriş sarılma", "etriye", "plastikleşme"],
  },
  {
    slug: "tbdy-betonarme-kiris-kapasite-kesme",
    title: "Kirişlerde Kapasite Tasarımına Göre Kesme Kuvveti",
    description: "Kiriş uç moment kapasitelerinden tasarım kesmesinin elde edilmesini açıklar.",
    seriesId: "tbdy-betonarme",
    decision: "Depremde sünek eğilme davranışı hedefleniyorsa kirişin kesme dayanımı olası uç momentlerden doğan talebi karşılamalıdır.",
    checks: ["Her iki deprem yönü için uç moment kapasitelerini belirleyin.", "Düşey yük kesmesini kapasite kesmesiyle doğru işaretle birleştirin.", "Etriye hesabını belirleyici tasarım kesmesine göre yenileyin."],
    keywords: ["kiriş kesme", "kapasite tasarımı", "etriye"],
  },
  {
    slug: "tbdy-betonarme-kusatilmamis-birlesim",
    title: "Kuşatılmış ve Kuşatılmamış Kolon-Kiriş Birleşimleri",
    description: "Birleşim bölgesinin çevre kirişlerle kuşatılma durumunu ve tasarıma etkisini açıklar.",
    seriesId: "tbdy-betonarme",
    decision: "Birleşimin kuşatılmış sayılması yalnız dört yönde kiriş bulunmasına değil, kiriş boyutları ve birleşim geometrisine de bağlıdır.",
    checks: ["Birleşime bağlanan kirişleri iki doğrultuda değerlendirin.", "Kiriş genişliği ve derinliğinin kuşatma şartlarını sağladığını doğrulayın.", "Kuşatılmamış birleşim için daha elverişsiz kesme koşulunu kullanın."],
    keywords: ["kolon kiriş birleşimi", "kuşatılmış birleşim"],
  },
  {
    slug: "tbdy-betonarme-birlesim-kesme-guvenligi",
    title: "Kolon-Kiriş Birleşim Bölgesi Kesme Güvenliği",
    description: "Birleşim çekirdeğindeki yatay kesme talebi ile dayanım kontrolünü özetler.",
    seriesId: "tbdy-betonarme",
    decision: "Kolon ve kirişler ayrı ayrı yeterli görünse bile birleşim çekirdeğinde oluşan kesme gerilmesi sistemin gevrek zayıf halkası olabilir.",
    checks: ["Kiriş donatısı kuvvetlerinden birleşim kesmesini çıkarın.", "Birleşim alanını ve kuşatılma sınıfını doğru seçin.", "Kolon enine donatısının birleşim içinde devamını gösterin."],
    keywords: ["birleşim kesmesi", "kolon kiriş", "çekirdek"],
  },
  {
    slug: "tbdy-betonarme-perde-kolon-geometri-ayrimi",
    title: "Perde ve Kolon Ayrımı İçin Geometrik Koşullar",
    description: "Betonarme düşey elemanın perde veya kolon olarak ele alınmasını belirleyen boyut oranlarını açıklar.",
    seriesId: "tbdy-betonarme",
    decision: "Elemanın yazılımda perde adıyla tanımlanması yeterli değildir; geometrik koşul ve taşıyıcı sistem sınıfı birlikte sağlanmalıdır.",
    checks: ["Kesit boyut oranını her katta kontrol edin.", "Perde sürekliliğini ve doğrultusunu modelde izleyin.", "Sistem sınıfındaki perde katkısını gerçek perde elemanlarla hesaplayın."],
    keywords: ["perde", "kolon", "kesit oranı"],
  },
  {
    slug: "tbdy-betonarme-perde-kritik-yukseklik-uc-bolge",
    title: "Perde Kritik Yüksekliği ve Uç Bölgeleri",
    description: "Perde tabanındaki kritik bölgeyi ve özel sınır elemanı gereken uç bölgelerini açıklar.",
    seriesId: "tbdy-betonarme",
    decision: "Perde moment ve eğrilik talebinin yoğunlaştığı kritik yükseklik boyunca uç bölge detayları kat bazında kesintisiz sürdürülmelidir.",
    checks: ["Kritik perde yüksekliğini temel üstünden belirleyin.", "Uç bölge gereksinimini basınç talebiyle kontrol edin.", "Uç bölge boyut ve donatısını kat geçişlerinde izleyin."],
    keywords: ["perde kritik yüksekliği", "uç bölge", "sınır elemanı"],
  },
  {
    slug: "tbdy-betonarme-perde-govde-uc-donati",
    title: "Perde Gövde ve Uç Bölgesi Donatı Düzeni",
    description: "Yatay-düşey gövde donatısı ile yoğunlaştırılmış uç bölge donatısını birlikte ele alır.",
    seriesId: "tbdy-betonarme",
    decision: "Perde toplam donatı oranı tek başına yeterli değildir; çift sıra düzeni, bağlantı donatıları ve uç bölge sarılması çizimde okunabilmelidir.",
    checks: ["Yatay ve düşey minimum gövde donatısını ayrı kontrol edin.", "Çift sıra donatı ve bağlantı elemanlarını gösterin.", "Uç bölge boyuna donatısını kapalı etriye ve çirozlarla sarın."],
    keywords: ["perde donatısı", "gövde donatısı", "uç bölge"],
  },
  {
    slug: "tbdy-betonarme-perde-moment-kesme-zarfi",
    title: "Perdelerde Tasarım Momenti ve Kesme Kuvveti Zarfları",
    description: "Analiz sonuçlarının perde boyunca yönetmelik tasarım zarfına dönüştürülmesini açıklar.",
    seriesId: "tbdy-betonarme",
    decision: "Perdeyi yalnız analiz programındaki ham kat kuvvetleriyle donatmak kapasite tasarımı ve moment büyütme koşullarını atlayabilir.",
    checks: ["Perde moment zarfını kritik yükseklik boyunca düzenleyin.", "Kesme kuvvetini kapasite ve büyütme kurallarıyla kontrol edin.", "Kabuk sonuçlarını kesit tasarım kuvvetlerine tutarlı biçimde dönüştürün."],
    keywords: ["perde momenti", "perde kesmesi", "tasarım zarfı"],
  },
  {
    slug: "tbdy-betonarme-bag-kirisli-perde",
    title: "Bağ Kirişli Perdeler ve Çapraz Donatılı Bağ Kirişleri",
    description: "Boşluklu perdelerde bağ kirişi davranışı ve çapraz donatı gereksinimini açıklar.",
    seriesId: "tbdy-betonarme",
    decision: "Kısa ve derin bağ kirişlerinde geleneksel kiriş donatısı yüksek kesme talebini sünek biçimde taşıyamayabilir.",
    checks: ["Bağ kirişi açıklık/yükseklik oranını belirleyin.", "Çapraz donatı gerektiren durumu kontrol edin.", "Çapraz demetlerin kenetlenme ve sargı detaylarını perde içine taşıyın."],
    keywords: ["bağ kirişi", "boşluklu perde", "çapraz donatı"],
  },
  {
    slug: "tbdy-betonarme-perde-bosluklari-modelleme",
    title: "Perdelerde Kapı ve Pencere Boşluklarının Modellenmesi",
    description: "Perde boşluklarının rijitlik, gerilme yığılması ve bağ kirişi davranışına etkisini ele alır.",
    seriesId: "tbdy-betonarme",
    decision: "Mimari boşluğu kabuk modelde yok saymak perde rijitliğini ve kuvvet yolunu olduğundan farklı gösterir.",
    checks: ["Tüm sürekli boşlukları analiz geometrisine aktarın.", "Boşluk köşelerinde ağ kalitesini ve gerilme yığılmasını inceleyin.", "Boşluklar arasındaki elemanı bağ kirişi veya perde parçası olarak doğru tanımlayın."],
    keywords: ["perde boşluğu", "kapı boşluğu", "kabuk model"],
  },
  {
    slug: "tbdy-betonarme-diyafram-toplayici-baslik",
    title: "Döşeme Diyaframları, Toplayıcı Elemanlar ve Başlık Donatıları",
    description: "Kat deprem kuvvetlerinin döşemeden perde ve çerçevelere aktarılma yolunu açıklar.",
    seriesId: "tbdy-betonarme",
    decision: "Diyafram kuvveti kendiliğinden perdeye ulaşmaz; boşluk çevresi, toplayıcı şerit ve başlık donatısı açık bir yük yolu oluşturmalıdır.",
    checks: ["Diyafram kesme ve eksenel kuvvetlerini çıkarın.", "Perdelere uzanan toplayıcı bölgeleri tanımlayın.", "Büyük boşlukların çevresinde başlık ve kenar donatısını detaylandırın."],
    keywords: ["diyafram", "toplayıcı", "başlık donatısı"],
  },














  {
    slug: "mevcut-bina-riskli-yapi-ve-bolum-15-farki",
    title: "Riskli Yapı Tespiti ile TBDY Bölüm 15 Performans Analizi Arasındaki Fark",
    description: "6306 kapsamındaki risk tespiti ile deprem performansı ve güçlendirme değerlendirmesinin farklı amaçlarını açıklar.",
    seriesId: "mevcut-guclendirme",
    decision: "Riskli yapı tespiti sonucu, Bölüm 15 kapsamında seçilen performans hedefi ve güçlendirme projesinin yerine geçmez.",
    checks: ["İşin hukuki ve teknik amacını başlangıçta tanımlayın.", "Kullanılacak veri toplama ve hesap yöntemini doğru dokümandan seçin.", "Rapor başlığında yöntemi ve kapsamı açıkça belirtin."],
    keywords: ["riskli yapı", "Bölüm 15", "performans analizi"],
  },
  {
    slug: "mevcut-bina-bilgi-duzeyleri",
    title: "Mevcut Binalarda Bilgi Düzeylerinin Belirlenmesi",
    description: "Proje belgesi, saha ölçümü ve malzeme verisinin bilgi düzeyine etkisini açıklar.",
    seriesId: "mevcut-guclendirme",
    decision: "Bilgi düzeyi, yalnız elde proje olup olmamasına göre değil, taşıyıcı sistem ve malzeme bilgilerinin sahada doğrulanma kapsamına göre seçilir.",
    checks: ["Mevcut proje ve ruhsat belgelerinin güvenilirliğini inceleyin.", "Geometri ve donatı tespit kapsamını yönetmelikle eşleştirin.", "Bilgi düzeyi katsayısını hesap modelinde belgeleyin."],
    keywords: ["bilgi düzeyi", "mevcut bina", "rölöve"],
  },
  {
    slug: "mevcut-bina-tasiyici-rolove-hasar-belgeleme",
    title: "Taşıyıcı Sistem Rölövesi ve Hasar Belgeleme",
    description: "Kolon, kiriş, perde ve döşemelerin mevcut durumunun ölçülerek modele aktarılmasını açıklar.",
    seriesId: "mevcut-guclendirme",
    decision: "Mimari rölöve taşıyıcı sistem rölövesinin yerine geçmez; kesitler, aks kaçıklıkları, boşluklar ve hasarlar ayrı kaydedilir.",
    checks: ["Tüm katlarda eleman boyutlarını ve aks konumlarını ölçün.", "Sonradan açılan boşluk ve kaldırılan elemanları işaretleyin.", "Hasarı fotoğraf, kat-aks kodu ve ölçüyle ilişkilendirin."],
    keywords: ["taşıyıcı rölöve", "hasar", "saha ölçümü"],
  },
  {
    slug: "mevcut-bina-karot-beton-dayanimi",
    title: "Karot Sayısı ve Mevcut Beton Dayanımının Belirlenmesi",
    description: "Karot yerleşimi, deney sonucu ve mevcut beton dayanımına geçiş sürecini açıklar.",
    seriesId: "mevcut-guclendirme",
    decision: "Tek bir yüksek veya düşük sonuç bina betonunu temsil etmez; numune dağılımı kat ve eleman çeşitliliğini kapsamalıdır.",
    checks: ["Karot sayısını bina büyüklüğü ve bilgi düzeyine göre belirleyin.", "Donatıya ve kritik hasarlı bölgeye zarar vermeyen numune yeri seçin.", "Deney sonuçlarını boyut ve narinlik düzeltmeleriyle değerlendirin."],
    keywords: ["karot", "beton dayanımı", "mevcut bina"],
  },
  {
    slug: "mevcut-bina-donati-tespiti-korozyon",
    title: "Donatı Tespiti, Sıyırma, Numune ve Korozyon İncelemesi",
    description: "Mevcut elemanlarda donatı adedi, çapı, yerleşimi ve malzeme durumunun belirlenmesini açıklar.",
    seriesId: "mevcut-guclendirme",
    decision: "Tarama cihazı sonucu seçili sıyırmalarla doğrulanmalı; korozyon ve aderans kaybı yalnız çap bilgisiyle temsil edilmemelidir.",
    checks: ["Tarama ve sıyırma noktalarını kat/eleman bazında dağıtın.", "Boyuna donatı ile enine donatıyı ayrı kaydedin.", "Korozyon, kesit kaybı ve pas payı durumunu fotoğraflayın."],
    keywords: ["donatı tespiti", "sıyırma", "korozyon"],
  },
  {
    slug: "mevcut-bina-beklenen-dayanim-bilgi-katsayisi",
    title: "Beklenen Malzeme Dayanımları ve Bilgi Katsayıları",
    description: "Mevcut yapı analizinde deney sonuçlarının beklenen dayanımlara ve kapasite hesabına nasıl girdiğini açıklar.",
    seriesId: "mevcut-guclendirme",
    decision: "Yeni bina tasarımındaki karakteristik-tasarım dayanımı yaklaşımı mevcut bina değerlendirmesine doğrudan taşınmamalıdır.",
    checks: ["Beton ve çelik için kullanılacak beklenen dayanımı ayrı belirleyin.", "Bilgi düzeyi katsayısını eleman kapasitesine doğru uygulayın.", "Malzeme kabullerini deney raporlarıyla izlenebilir kılın."],
    keywords: ["beklenen dayanım", "bilgi katsayısı", "malzeme"],
  },
  {
    slug: "mevcut-bina-sunek-gevrek-hasar-siniflamasi",
    title: "Sünek ve Gevrek Eleman Davranışlarının Ayrılması",
    description: "Mevcut elemanların şekil değiştirme veya kuvvet kontrollü davranış olarak sınıflandırılmasını açıklar.",
    seriesId: "mevcut-guclendirme",
    decision: "Kesme gibi gevrek davranışlar, eğilme plastikleşmesi için kullanılan hasar sınırlarıyla kabul edilemez.",
    checks: ["Elemanın baskın davranış türünü kapasite sonuçlarıyla belirleyin.", "Kesme güvenliği yetersiz elemanları ayrı işaretleyin.", "Şekil değiştirme taleplerini doğru performans sınırıyla karşılaştırın."],
    keywords: ["sünek davranış", "gevrek davranış", "hasar sınırı"],
  },
  {
    slug: "mevcut-bina-dogrusal-degerlendirme-sinirlari",
    title: "Doğrusal Değerlendirme Yönteminin Uygulanma Sınırları",
    description: "Mevcut binada doğrusal yöntemin seçilme şartlarını ve talep-kapasite değerlendirmesini açıklar.",
    seriesId: "mevcut-guclendirme",
    decision: "Yapının düzensizliği ve doğrusal olmayan davranış yaygınlığı arttıkça doğrusal kabul sonuçları temsil etmeyebilir.",
    checks: ["Yöntemin bina ve sistem için uygulanabilirliğini doğrulayın.", "Eleman talep-kapasite oranlarını doğru iç kuvvetlerle üretin.", "Yöntem sınırı aşılıyorsa doğrusal olmayan değerlendirmeye geçin."],
    keywords: ["doğrusal değerlendirme", "talep kapasite", "mevcut bina"],
  },
  {
    slug: "guclendirme-betonarme-perde-eklenmesi",
    title: "Mevcut Binaya Betonarme Perde Eklenmesi",
    description: "Yeni perdelerin plandaki yeri, mevcut döşemeyle bağlantısı ve temel aktarımını açıklar.",
    seriesId: "mevcut-guclendirme",
    decision: "Perde eklemek yalnız yatay kapasiteyi artırmaz; rijitlik merkezini, kat kuvvet dağılımını ve temel taleplerini değiştirir.",
    checks: ["Perdeleri burulmayı artırmayacak dengeli konumlara yerleştirin.", "Döşeme toplayıcıları ve eski-yeni beton bağlantısını tasarlayın.", "Yeni perde yüklerini karşılayacak temel çözümünü birlikte geliştirin."],
    keywords: ["perde ekleme", "güçlendirme", "toplayıcı"],
  },
  {
    slug: "guclendirme-temel-sistemi-yuk-aktarimi",
    title: "Güçlendirmede Temel Sistemi ve Yük Aktarımının Yeniden Düzenlenmesi",
    description: "Üstyapı güçlendirmesinin mevcut temel, zemin basıncı ve bağlantı detaylarına etkisini açıklar.",
    seriesId: "mevcut-guclendirme",
    decision: "Kolon mantolaması veya perde eklenmesiyle büyüyen kuvvetler mevcut temele güvenli biçimde aktarılmadan sistem güçlendirilmiş sayılmaz.",
    checks: ["Güçlendirme öncesi ve sonrası temel tepkilerini karşılaştırın.", "Mevcut temel geometrisi ve donatısını sahada doğrulayın.", "Yeni temel parçalarının ankraj, kesme sürtünmesi ve oturma uyumunu çözün."],
    keywords: ["temel güçlendirme", "yük aktarımı", "ankraj"],
  },

  {
    slug: "zemin-temel-etudu-rapor-kategorileri",
    title: "Zemin ve Temel Etüdü Tebliği Rapor Kategorileri",
    description: "Yapı ve zemin koşullarına göre etüt kategorisinin ve rapor kapsamının nasıl belirlendiğini açıklar.",
    seriesId: "su-zemin",
    decision: "Sondaj sayısı gibi tek bir girdiden önce yapı özellikleri, komşu yapılar ve geoteknik risklere göre rapor kategorisi seçilmelidir.",
    checks: ["Yapı yüksekliği, bodrum ve komşu yapı koşullarını tanımlayın.", "Şev, sıvılaşma ve özel zemin risklerini tarayın.", "Kategoriye uygun arazi ve laboratuvar programını raporda doğrulayın."],
    keywords: ["zemin etüdü", "rapor kategorisi", "tebliğ"],
  },
  {
    slug: "zemin-raporu-verilerinin-yapi-modeline-aktarimi",
    title: "Zemin Raporundaki Verilerin Taşıyıcı Sistem Modeline Aktarılması",
    description: "Yerel zemin sınıfı, yatak katsayısı ve temel parametrelerinin statik modele aktarılmasını açıklar.",
    seriesId: "su-zemin",
    decision: "Rapor verisi kopyalanmadan önce parametrenin servis, taşıma gücü veya deprem hesabına ait olup olmadığı ayrılmalıdır.",
    checks: ["ZA–ZF sınıfı ile spektrum parametrelerini eşleştirin.", "Karakteristik ve tasarım zemin parametrelerini ayırın.", "Yatak katsayısını temel boyutu ve model yaklaşımıyla uyumlu kullanın."],
    keywords: ["zemin raporu", "yatak katsayısı", "yerel zemin sınıfı"],
  },
  {
    slug: "temel-tasima-gucu-oturma-kontrolu",
    title: "Yüzeysel Temellerde Taşıma Gücü ve Oturma Kontrolü",
    description: "Zemin göçmesi ile toplam/farklı oturma kontrollerinin ayrı tasarım durumları olduğunu açıklar.",
    seriesId: "su-zemin",
    decision: "Taşıma gücü yeterli bir temel, servis yüklerinde kabul edilemez farklı oturma yapabilir; iki kontrol birbirinin yerine geçmez.",
    checks: ["Tasarım yükleriyle taşıma gücü sınır durumunu kontrol edin.", "Servis yükleriyle toplam ve farklı oturmayı hesaplayın.", "Temel rijitliği ile üstyapı hassasiyetini birlikte değerlendirin."],
    keywords: ["taşıma gücü", "oturma", "yüzeysel temel"],
  },
  {
    slug: "temel-kayma-devrilme-guvenligi",
    title: "Temellerde Kayma ve Devrilme Güvenliği",
    description: "Yatay deprem yükleri altında temel tabanındaki kayma ve bileşke konumu kontrollerini açıklar.",
    seriesId: "su-zemin",
    decision: "Yatay reaksiyonları yalnız düşey taşıma gücü kontrolü içinde bırakmak taban sürtünmesi ve devrilme riskini görünmez kılar.",
    checks: ["Temel tabanındaki yatay ve düşey bileşkeyi çıkarın.", "Sürtünme ve izin verilen pasif direnç kabullerini raporla eşleştirin.", "Temas alanı ve taban basıncı dağılımını devrilmeyle birlikte kontrol edin."],
    keywords: ["temel kayması", "devrilme", "taban sürtünmesi"],
  },
  {
    slug: "radye-temel-zemin-yayi-yatak-katsayisi",
    title: "Radye Temellerde Zemin Yayı ve Yatak Katsayısı Seçimi",
    description: "Radye modelinde yayların alan, ağ ve zemin davranışıyla uyumlu tanımlanmasını açıklar.",
    seriesId: "su-zemin",
    decision: "Tek bir yatak katsayısını düğüm yayına doğrudan girmek ağ sıklaştıkça toplam zemin rijitliğini değiştirebilir.",
    checks: ["Alan katsayısını düğüm veya eleman alanıyla tutarlı dönüştürün.", "Çekme taşımayan zemin kabulünü gerekiyorsa tanımlayın.", "Temas basıncı ve oturma sonuçlarını geoteknik raporla karşılaştırın."],
    keywords: ["radye", "zemin yayı", "yatak katsayısı"],
  },
  {
    slug: "bodrum-perdesi-statik-dinamik-zemin-basinci",
    title: "Bodrum Perdelerinde Statik ve Dinamik Zemin Basınçları",
    description: "Bodrum çevre perdelerinde toprak, su ve deprem etkilerinin birlikte ele alınmasını açıklar.",
    seriesId: "su-zemin",
    decision: "Sükûnet, aktif veya dinamik basınç seçimi perdenin hareket imkânına bağlıdır; bina bodrum perdesi serbest istinat duvarı gibi kabul edilmemelidir.",
    checks: ["Perdenin mesnet ve hareket koşuluna uygun basınç modelini seçin.", "Yeraltı suyu ve drenaj arızası durumunu ayrı yükleyin.", "Dinamik zemin basıncını deprem birleşimleriyle eşleştirin."],
    keywords: ["bodrum perdesi", "zemin basıncı", "yeraltı suyu"],
  },

  {
    slug: "yapi-denetimi-statik-proje-kontrolu",
    title: "4708 Kapsamında Betonarme Statik Proje Kontrolü",
    description: "Statik projenin mimari, zemin raporu, hesap modeli ve uygulama paftalarıyla tutarlılık kontrolünü açıklar.",
    seriesId: "yapi-denetimi",
    decision: "Kontrol yalnız hesap raporunun onaylanması değil, bütün proje belgelerinde aynı taşıyıcı sistem kararının izlenmesidir.",
    checks: ["Aks, kot ve taşıyıcı elemanları mimari projeyle karşılaştırın.", "Zemin parametrelerinin hesap modeline doğru geçtiğini doğrulayın.", "Hesap donatısı ile uygulama paftalarını eleman bazında eşleştirin."],
    keywords: ["4708", "statik proje kontrolü", "yapı denetimi"],
  },
  {
    slug: "yapi-denetimi-betonarme-uygulama-cizimleri",
    title: "Betonarme Uygulama Çizimlerinde Bulunması Gereken Detaylar",
    description: "Kalıp, donatı, kesit ve birleşim paftalarında uygulamacının ihtiyaç duyduğu temel bilgileri listeler.",
    seriesId: "yapi-denetimi",
    decision: "Hesapta doğru olan donatı, paftada çap, adet, aralık, boy ve konumuyla açık gösterilmezse sahada doğrulanamaz.",
    checks: ["Kalıp planlarında aks, kot ve kesitleri eksiksiz gösterin.", "Kolon, kiriş ve perde açılımlarında bindirme/sarılma bölgelerini ölçülendirin.", "Temel filizleri ile üstyapı donatı devamını detaylarda bağlayın."],
    keywords: ["uygulama çizimi", "donatı paftası", "kalıp planı"],
  },
  {
    slug: "yapi-denetimi-dokum-oncesi-kalip-donati",
    title: "Beton Dökümü Öncesi Kalıp ve Donatı Kontrolü",
    description: "Döküm izni verilmeden önce geometri, pas payı, donatı ve gömülü eleman kontrollerini açıklar.",
    seriesId: "yapi-denetimi",
    decision: "Betondan sonra erişilemeyecek her unsur döküm öncesi kayıt altına alınmalı; uygunsuzluk kapatılmadan döküm başlatılmamalıdır.",
    checks: ["Kesit, aks, kot ve kalıp stabilitesini ölçün.", "Donatı çap/adet/aralık, bindirme ve pas payını kontrol edin.", "Tesisat geçişleri, ankrajlar ve filizleri fotoğraflı tutanağa bağlayın."],
    keywords: ["beton dökümü", "donatı kontrolü", "kalıp"],
  },
  {
    slug: "yapi-denetimi-beton-tanimlama-en206-ts13515",
    title: "TS EN 206+A2 ve TS 13515'e Göre Beton Tanımlama",
    description: "Beton sınıfının yanında çevresel etki, kıvam, agrega ve klorür gibi sipariş bilgilerinin önemini açıklar.",
    seriesId: "yapi-denetimi",
    decision: "Yalnız C sınıfı yazmak betonun durabilite ve uygulama gereksinimlerini tanımlamaz; proje ve irsaliye tam tarifle eşleşmelidir.",
    checks: ["Dayanım ve çevresel etki sınıflarını proje koşullarına göre seçin.", "Kıvam, en büyük agrega ve klorür sınıfını belirtin.", "Santral irsaliyesini sipariş ve döküm elemanıyla eşleştirin."],
    keywords: ["TS EN 206+A2", "TS 13515", "beton sınıfı"],
  },
  {
    slug: "yapi-denetimi-ebis-beton-numunesi-kabul",
    title: "Taze Beton Numunesi, EBİS ve 7/28 Günlük Kabul Süreci",
    description: "Numune alma, kimliklendirme, kür ve basınç sonuçlarının izlenebilir kabul akışını açıklar.",
    seriesId: "yapi-denetimi",
    decision: "Numune sonucu ancak doğru döküm, doğru takım ve kesintisiz kimlik zinciriyle ilişkilendirildiğinde yapı denetimi açısından anlamlıdır.",
    checks: ["Numuneyi ilgili döküm ve beton irsaliyesiyle eşleştirin.", "EBİS kimliği, kalıp alma ve laboratuvar teslim kayıtlarını kontrol edin.", "7 günlük erken izleme ile 28 günlük kabul sonucunu ayırın."],
    keywords: ["EBİS", "beton numunesi", "28 gün"],
  },
  {
    slug: "yapi-denetimi-dusuk-beton-dayanimi-karot",
    title: "Düşük Beton Dayanımında Uygunsuzluk ve Karot Süreci",
    description: "Standart numune sonucu yetersiz olduğunda kayıt incelemesinden karot değerlendirmesine uzanan süreci açıklar.",
    seriesId: "yapi-denetimi",
    decision: "Tek bir düşük küp sonucu doğrudan yıkım veya kabul kararı değildir; takım sonuçları, üretim kayıtları ve yerindeki inceleme birlikte yürütülür.",
    checks: ["Numune takımını ve istatistiksel kabul ölçütlerini doğrulayın.", "Aynı betonla dökülen elemanları ve üretim kayıtlarını belirleyin.", "Karot planını taşıyıcı eleman güvenliğini koruyacak şekilde hazırlayın."],
    keywords: ["düşük beton dayanımı", "karot", "uygunsuzluk"],
  },
  {
    slug: "yapi-denetimi-ts708-donati-celigi-kabul",
    title: "TS 708 Donatı Çeliği Belgesi ve Şantiye Kabul Kontrolü",
    description: "Donatı çeliğinin sınıf, nervür, etiket, belge ve gerektiğinde deney üzerinden kabulünü açıklar.",
    seriesId: "yapi-denetimi",
    decision: "Çap ölçüsünün uygun olması malzeme sınıfının ve süneklik özelliklerinin doğrulandığı anlamına gelmez.",
    checks: ["Etiket, üretici, döküm/parti ve uygunluk belgesini kaydedin.", "Çelik sınıfını statik proje notlarıyla eşleştirin.", "Şüpheli partileri ayırarak çekme-bükme deney sürecini başlatın."],
    keywords: ["TS 708", "donatı çeliği", "malzeme kabulü"],
  },
  {
    slug: "yapi-denetimi-en13670-yerlestirme-kur-tolerans",
    title: "TS EN 13670'e Göre Yerleştirme, Tolerans ve Kür Kontrolleri",
    description: "Betonun yerleştirilmesi, sıkıştırılması, sıcak-soğuk hava önlemleri ve geometrik toleransları ele alır.",
    seriesId: "yapi-denetimi",
    decision: "Uygun beton sınıfı tek başına yeterli değildir; yerleştirme ve erken yaş bakımı nihai dayanım ile durabiliteyi belirler.",
    checks: ["Döküm hızı, tabaka kalınlığı ve vibrasyon planını uygulayın.", "Hava koşullarına göre yüzey koruma ve kür süresini belirleyin.", "Kalıp sökümü sonrası kesit, düşeylik ve kot toleranslarını ölçün."],
    keywords: ["TS EN 13670", "kür", "beton yerleştirme"],
  },
];

function articleReferences(topic: TopicSpec): NonNullable<ArticleData["references"]> {
  const meta = SERIES_META[topic.seriesId];
  const references: NonNullable<ArticleData["references"]> = [
    { label: meta.sourceLabel, href: meta.sourceHref, note: "Madde, tablo ve yürürlük bilgisi proje tarihinde resmî kaynaktan doğrulanmalıdır." },
  ];

  if (topic.seriesId === "tbdy") references.push({ label: "AFAD — Türkiye Bina Deprem Yönetmeliği sayfası", href: TBDY_PAGE });
  if (topic.seriesId === "mevcut-guclendirme" && topic.slug.includes("riskli-yapi")) references.push({ label: "Riskli Yapıların Tespit Edilmesine İlişkin Esaslar", href: RISKY_BUILDING });
  if (topic.slug === "tbdy-uygulama-esaslari-taslak-statusu") references.push({ label: "İMO — Yeni TBDY tebliği hakkındaki duyuru", href: IMO_DRAFT });
  if (topic.slug === "yapi-denetimi-ebis-beton-numunesi-kabul") references.push({ label: "ÇŞİDB — Taze beton numunesine ilişkin 2022/7 Genelge", href: CONCRETE_CIRCULAR });
  return references;
}

function buildArticle(topic: TopicSpec, relatedSlugs: string[]): ArticleData {
  const meta = SERIES_META[topic.seriesId];
  return {
    slug: topic.slug,
    title: topic.title,
    description: topic.description,
    seoTitle: `${topic.title} | Mühendis Mimar Portalı`,
    seoDescription: topic.description,
    sectionId: "deprem-yonetmelik",
    seriesId: topic.seriesId,
    regulationStatus: topic.slug === "tbdy-uygulama-esaslari-taslak-statusu" ? "draft" : topic.seriesId === "ts500" ? "standard" : "in-force",
    category: meta.category,
    categoryColor: meta.color,
    badgeLabel: topic.slug === "tbdy-uygulama-esaslari-taslak-statusu" ? "Taslak — yürürlükte değil" : meta.badge,
    author: "Mühendis Mimar Portalı",
    authorTitle: "Teknik İçerik Ekibi",
    date: "11 Ağustos 2026",
    updatedAt: "11 Ağustos 2026",
    readTime: "3 dk",
    image: "/covers/yonetmelik.svg",
    sections: [
      {
        id: "kapsam-ve-karar",
        title: "Kapsam ve karar",
        content: `${topic.description}\n\n${topic.decision}`,
        subsections: [],
      },
      {
        id: "proje-kontrol-sirasi",
        title: "Proje kontrol sırası",
        content: topic.checks.map((check) => `- ${check}`).join("\n"),
        subsections: [],
      },
      {
        id: "dayanak",
        title: "Mevzuat dayanağı",
        content: `Bu başlık için ana dayanak **${meta.sourceLabel}** kaynağıdır. Hesap raporunda kullanılan madde, sürüm ve proje kabulü açık biçimde belirtilmelidir. Sayfanın altındaki kaynak bağlantısı resmî metne erişim sağlar.`,
        subsections: [],
      },
    ],
    relatedSlugs,
    keywords: Array.from(new Set([...topic.keywords, meta.badge, "betonarme"])),
    tags: topic.keywords,
    references: articleReferences(topic),
  };
}

const TOPICS_BY_SERIES = new Map<DepremSeriesId, TopicSpec[]>();
for (const topic of topics) {
  const seriesTopics = TOPICS_BY_SERIES.get(topic.seriesId) ?? [];
  seriesTopics.push(topic);
  TOPICS_BY_SERIES.set(topic.seriesId, seriesTopics);
}

export const DEPREM_TOPIC_ARTICLES: ArticleData[] = topics.map((topic) => {
  const seriesTopics = TOPICS_BY_SERIES.get(topic.seriesId) ?? [];
  const currentIndex = seriesTopics.findIndex((item) => item.slug === topic.slug);
  const relatedSlugs = [1, 2, 3]
    .map((offset) => seriesTopics[(currentIndex + offset) % seriesTopics.length]?.slug)
    .filter((slug): slug is string => Boolean(slug && slug !== topic.slug));
  return buildArticle(topic, relatedSlugs);
});

if (DEPREM_TOPIC_ARTICLES.length !== 56) {
  throw new Error(`Deprem konu kataloğunda 56 yerine ${DEPREM_TOPIC_ARTICLES.length} içerik bulundu.`);
}
