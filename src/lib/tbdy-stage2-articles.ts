import type { ArticleData } from "./articles-data";
type Spec = readonly [number,string,string,string,string,readonly (readonly [string,string,string])[]];
const SPECS: Spec[] = [
  [
    1,
    "tbdy-kapsam-tasarim-gozetimi",
    "TBDY Kapsamı ve Özel Tasarım Gözetimi",
    "Kapsam, özel tasarım gözetimi ve deneye dayalı doğrulama",
    "1.1,1.3,1.4",
    [
      [
        "Kapsam ve ilgili hükümler",
        "Yeni bina tasarımı, mevcut bina değerlendirmesi ve güçlendirme farklı prosedürlerdir. Taşıyıcı malzeme, özel sistem, bina yüksekliği ve zemin koşullarına göre uygulanması gereken ana ve özel bölümleri belirleyin.",
        "Genel deprem hükümleri ile ilgili özel bölüm birlikte değerlendirilir."
      ],
      [
        "Özel tasarım gözetimi",
        "Özel gözetim gerektiren hesap, modelleme ve detaylandırma süreçleri tasarımın başında ayıklanmalıdır. Gerekli gözetimi yalnızca son raporun onaylanması olarak yorumlamayın.",
        "Gözetim kapsamı, sorumlular ve ara kontrol çıktıları belgelenmelidir."
      ],
      [
        "Deneye dayalı doğrulama",
        "Deneysel doğrulama gerektiren tasarım varsayımlarında deney programı, mekanik davranış modeli, ölçülecek performans ve kabul kriterleri projenin başında tanımlanır.",
        "Deney ile hesap modeli aynı yapısal mekanizmayı temsil etmelidir."
      ]
    ]
  ],
  [
    2,
    "tbdy-deprem-kaydi-secimi-olcekleme",
    "Deprem Kaydı Seçimi ve Ölçeklendirme",
    "Zaman tanım alanı hesabında kayıt seti ve spektral uyum kontrolü",
    "2.5.1,2.5.2,2.5.3,5.7.2",
    [
      [
        "Yer hareketi kayıtlarının seçimi",
        "Seçilen kayıtlarda deprem kaynağı, fay mekanizması, büyüklük, kaynak uzaklığı ve yerel zemin koşulları hedef tehlikeyle tutarlı olmalıdır. Kayıt setinin işleme geçmişini ve birimlerini ayrı ayrı saklayın.",
        "Bir kaydın eşzamanlı yatay bileşenlerini iki bağımsız kayıt olarak saymayın."
      ],
      [
        "Ölçekleme yöntemi",
        "Basit ölçekleme ile spektral uyuşum farklı prosedürlerdir. Hedef spektrum, geçerli periyot aralığı ve kayıt bileşenlerini analiz yöntemine göre kontrol edin; öncesi/sonrası spektrumları raporlayın.",
        "Yalnız ölçek katsayısının uygunluğu kayıt kümesinin yeterliliğini kanıtlamaz."
      ],
      [
        "Zaman tanım alanı çözümü",
        "Doğrusal olmayan çözümde düşey yüklerin başlangıç durumu, bileşenlerin eşzamanlı uygulanması, zaman adımı, sönüm ve yakınsama kriterleri teknik raporda yer almalıdır.",
        "Numerik yakınsama tek başına hedef performansın sağlandığını göstermez."
      ]
    ]
  ],
  [
    5,
    "tbdy-sgdt-performans-sonuc-kontrolu",
    "ŞGDT Performans Sonucunun Kontrolü",
    "Plastik dönme, birim şekildeğiştirme, iç kuvvet ve performans değerlendirmesi",
    "5.7,5.8,5.9",
    [
      [
        "Performans hedefi",
        "Deprem yer hareketi düzeyi, bina kullanım sınıfı ve hedef performans analize başlamadan belirlenir. Sınırlı Hasar, Kontrollü Hasar ve Göçmenin Önlenmesi koşulları birbirinin yerine kullanılamaz.",
        "Hedefi hesap sonucuna göre değiştirmek mühendislik doğrulaması değildir."
      ],
      [
        "Eleman talepleri ve kapasite",
        "İlgili malzeme ve kesit modeline göre plastik dönme, birim şekildeğiştirme, kesme ve diğer gevrek iç kuvvet talepleri ayrı denetlenir. Uygun talep istatistiği seçilen analize göre raporlanır.",
        "Plastik dönmesi uygun olan elemanın gevrek kesme güvenliği ayrıca gösterilmelidir."
      ],
      [
        "Sonucun raporlanması",
        "Kritik elemanlar, talep/kapasite oranları, kayıt zarfı ve performans hedefi birlikte gösterilmeli; yetersiz elemanlar için düzeltici tasarım kararı belirtilmelidir.",
        "Tek kat ötelenme grafiği tek başına bina performans raporu değildir."
      ]
    ]
  ],
  [
    6,
    "tbdy-yapisal-olmayan-elemanlar-bolum6",
    "Yapısal Olmayan Elemanların Deprem Tasarımı",
    "Parapet, cephe, tesisat, ekipman bağlantıları ve göreli hareket",
    "6.1,6.2,6.3",
    [
      [
        "Kapsam ve yük yolu",
        "Parapet, cephe kaplaması, bölme duvar, asma tavan ile mekanik/elektrik ekipmanlarının can güvenliği ve kullanım sürekliliği risklerini belirleyin. Elemandan taşıyıcıya aktarılan kuvvet yolu açık olmalıdır.",
        "Ekipmanın yalnızca kendi ağırlığını taşıması deprem güvenliği için yeterli değildir."
      ],
      [
        "Eşdeğer deprem yükü ve ankraj",
        "Eleman kütlesi, bina içindeki konumu ve ilgili katsayılara göre eşdeğer deprem talebi hesaplanır. Askı, bağlantı plakası, dübel ve taşıyıcı alt malzeme birlikte kontrol edilir.",
        "Tek bağlantı elemanının dayanımını tüm sistem kapasitesi gibi kullanmayın."
      ],
      [
        "Göreli yerdeğiştirme",
        "Katlar arasında geçen tesisat ile cephe elemanlarında katlar arası hareketin yaratacağı deformasyon talebi de dikkate alınır. Kayar, esnek veya serbest bağlantılar uygulama detayıyla uyumlu olmalıdır.",
        "Atalet kuvveti hesabı yerdeğiştirme uygunluğu kontrolünün yerine geçmez."
      ]
    ]
  ],
  [
    8,
    "tbdy-onuretimli-betonarme-baglantilar",
    "Önüretimli Betonarme Bağlantılar ve Diyafram",
    "Mafsallı ve moment aktaran bağlantılar, prefabrike döşeme ve stabilite",
    "8.2,8.3,8.4,8.6,8.7",
    [
      [
        "Bağlantı davranışı",
        "Mafsallı bağlantı ile moment aktaran bağlantı arasındaki fark yapısal modelin dönme aktarımında görünmelidir. Bağlantı detayının gerçek davranışını temsil etmeyen rijit kabul sonuçları yanıltır.",
        "Mafsallı bağlantılı sistemde devrilme ve stabilite ayrıca değerlendirilir."
      ],
      [
        "Döşeme ve diyafram aktarımı",
        "Önüretimli panel, derz, diyafram başlığı ve bağlantı elemanlarının yatay yük taşıma zinciri incelenir. Düşey yük taşımaya yeterli bir panel otomatik olarak rijit diyafram değildir.",
        "Çatı ve döşeme panellerinin birleşim koşullarını ayrı denetleyin."
      ],
      [
        "Montaj ve son durum",
        "Özel kolon sistemleri ve montaj sırasında kullanılan geçici destekler nihai analizden farklı yükleme ve stabilite koşullarına tabi olabilir.",
        "Montaj evresi güvenliği, son durum taşıma gücünün yerine geçmez."
      ]
    ]
  ],
  [
    9,
    "tbdy-celik-sistemler-kapasite-birlesimler",
    "Çelik Taşıyıcı Sistemler: Kapasite ve Birleşimler",
    "Moment çerçevesi, çaprazlar, kapasite tasarımı ve temel ankrajı",
    "9.2,9.3,9.6,9.8,9.10,9.12",
    [
      [
        "Taşıyıcı sistemin belirlenmesi",
        "Moment aktaran çerçeve, merkezi çapraz, dışmerkez çapraz ve burkulması önlenmiş çaprazlı sistemler farklı plastikleşme mekanizmalarına sahiptir. Süneklik düzeyi ve R/D seçimi kullanılan sistemle uyumlu olmalıdır.",
        "Bir çapraz eklenmesi tek başına yüksek süneklikli sistem oluşturmaz."
      ],
      [
        "Kapasite hiyerarşisi",
        "Plastikleşmesi amaçlanan eleman ile korunan birleşim ve komşu elemanlar farklı dayanım talepleri taşır. Kiriş-kolon, çapraz uç ve bağ kirişi detaylarını ilgili sistem türüyle birlikte değerlendirin.",
        "Kaynak/bulon dayanımı tek başına çevrimsel bağlantı davranışını kanıtlamaz."
      ],
      [
        "Diyafram ve temel bağlantısı",
        "Yatay yükler diyafram başlıklarından çelik taşıyıcıya, taban levhasına, ankraja ve temele kesintisiz iletilmelidir. Tasarım kuvvetlerinin doğru yerde ve doğru kapasite yaklaşımıyla kullanıldığını doğrulayın.",
        "Üstyapının çelik eleman hesabı temeldeki ankraj güvenliğini otomatik sağlamaz."
      ]
    ]
  ],
  [
    10,
    "tbdy-hafif-celik-panel-tasarimi",
    "Hafif Çelik Binalarda Panel ve Bağlantı Kontrolü",
    "Soğukta şekillendirilmiş elemanlar, kaplamalı paneller ve döşeme yük aktarımı",
    "10.2,10.3,10.4,10.5",
    [
      [
        "Sistem sınıfı ve yükseklik",
        "Kaplamalı veya çaprazlı hafif çelik panelin taşıyıcı davranışı kullanılan kaplama ve bağlantı türüyle belirlenir. İzin verilen bina yüksekliği ve düzenlilik koşulları sistem seçimiyle birlikte kontrol edilmelidir.",
        "Bina yüksekliğinin uygunluğu diğer bağlantı kurallarını kaldırmaz."
      ],
      [
        "Panel rijitliği ve dayanımı",
        "Panel kesme kapasitesi kaplama, dikme, kenar bağlantıları ve vida aralıklarının birlikte çalışmasından oluşur. Ankraj ve devrilme aktarımını panel hesabına ekleyin.",
        "Tek vidanın dayanımı panel dayanımı yerine geçmez."
      ],
      [
        "Döşeme ve profil delikleri",
        "Döşeme diyaframının panellere yük aktarması, döşeme-duvar bağlantısı ve profil tesisat deliklerinin konum/geometri koşulları bağımsız denetlenir.",
        "Kesit üzerindeki deliklerin yerini taşıyıcı profil hesabından bağımsız görmeyin."
      ]
    ]
  ],
  [
    11,
    "tbdy-yigma-bina-deprem-kontrolu",
    "Yığma Binalarda Deprem ve Duvar Kontrolü",
    "Yığma malzeme, kesme dayanımı, duvar düzeni ve detaylandırma",
    "11.1,11.2,11.3,11.4,11.5",
    [
      [
        "Malzeme ve taşıyıcı duvar",
        "Kâgir birim, harç ve taşıyıcı duvarın uygun mekanik parametreleri belirlenir. Taşıyıcı olmayan dolgu duvarlarla yığma taşıyıcı sistemi karıştırmayın.",
        "Bilinmeyen malzeme dayanımına gelişigüzel tek sabit atamak kabul edilemez."
      ],
      [
        "Yatay yük taşıma",
        "Her deprem doğrultusunda duvar sürekliliği, açıklıklar, diyafram desteği, kayma ve eğilme talepleri birlikte incelenmelidir.",
        "Düşey yük için yeterli duvar deprem kesmesine karşı otomatik yeterli değildir."
      ],
      [
        "Bağ ve detay",
        "Hatıl, duvar-döşeme bağlantısı, köşe birleşimleri ve açıklık çevresi detayları tasarım modelindeki kuvvet aktarımını sağlayacak biçimde gösterilir.",
        "İyi detay, yönetmeliğe aykırı temel geometrinin yerine geçmez."
      ]
    ]
  ],
  [
    12,
    "tbdy-ahsap-panel-birlesimler",
    "Ahşap Bina: Panel, Diyafram ve Birleşimler",
    "Ahşap panellerin çevrimsel davranışı, mekanik bağlayıcı ve ankraj kontrolleri",
    "12.2,12.3,12.4,12.5,12.6",
    [
      [
        "Taşıyıcı panel mekanizması",
        "Ahşap kaplama, dikme ve mekanik bağlayıcı birlikte yatay rijitlik sağlar. Panel türü, malzeme ve seçilen deprem sistemi için uygun model kurulur.",
        "Tek ahşap elemanın dayanımını tüm panel kapasitesi saymayın."
      ],
      [
        "Bağlantılar ve süneklik",
        "Çivi, vida ve bulon bağlantılarının kesme/çekme ve şekil değiştirme davranışı panelin çevrimsel dayanımını etkiler; panel ucu, bağlantı plakası ve ankraj birlikte düşünülür.",
        "Gevrek bağlantı kopması hedeflenen sünek davranışı engelleyebilir."
      ],
      [
        "Diyafram ve devrilme",
        "Döşemeden yatay panellere yük aktarımı, başlık/kollektör elemanları, panel uç çekmeleri ve temele devrilme aktarımı birlikte gösterilmelidir.",
        "Diyafram hesabı ve ankraj hesabı birbirini tamamlar."
      ]
    ]
  ],
  [
    13,
    "tbdy-yuksek-bina-uc-asamali-tasarim",
    "Yüksek Binalarda Üç Aşamalı Deprem Tasarımı",
    "DD-2 ön tasarım, DD-3/DD-4 kullanım performansı, DD-1 nihai değerlendirme",
    "13.1,13.2,13.4,13.5,13.6",
    [
      [
        "Aşama I — ön tasarım",
        "Yüksek bina kapsamı belirlendikten sonra DD-2 altında DGT ilk tasarım ve boyutlandırma aşaması yürütülür. Bu aşama üç aşamalı tasarımın tamamı değildir.",
        "İlk aşamadaki kesit ve sistem seçimi sonraki performans kontrolüne temel olur."
      ],
      [
        "Aşama II — kullanım performansı",
        "İlgili DD-3 veya DD-4 düzeyindeki hedef performans kontrol edilir; gereken durumlarda model ve detaylar iyileştirilir.",
        "Ön tasarımdaki deplasmanın küçük olması tek başına hedef performansı kanıtlamaz."
      ],
      [
        "Aşama III — nihai performans",
        "DD-1 için nihai performans hedefi doğrulanır; eleman hasarı, temel davranışı ve yapı sağlığı izleme gibi özel gerekler projeye dahil edilir.",
        "Farklı deprem düzeyleri için tanımlanan hedefler birbirine karıştırılmamalıdır."
      ]
    ]
  ],
  [
    16,
    "tbdy-sahaya-ozel-zemin-temel-karar",
    "Sahaya Özel Zemin ve Temel Tasarım Kararları",
    "Zemin sınıfı, sahaya özel spektrum, sıvılaşma ve kazık-zemin etkileşimi",
    "16.2,16.4,16.5,16.6,16.8,16.10",
    [
      [
        "Zemin verisi ve spektrum",
        "Zemin araştırması ve yerel sınıf belirlendikten sonra sahaya özel zemin davranış analizi gerekip gerekmediği değerlendirilir. Standart spektrum bütün sahalar için otomatik geçerli değildir.",
        "ZF gibi sahaya özel koşullar sıradan zemin katsayısıyla geçiştirilemez."
      ],
      [
        "Sıvılaşma ve temel dayanımı",
        "Sıvılaşma riski, temel taşıma gücü, kayma ve devrilme kontrolü birbirinden ayrı yapılır. Yatak katsayısı geometri ve yüklemeye duyarlı model parametresidir.",
        "Yatak katsayısını zeminin değişmez malzeme sabiti kabul etmeyin."
      ],
      [
        "Kazık ve çevre zemin",
        "Kazıklı temellerde yatay yük aktarımı, yapı-kazık-zemin etkileşimi ve bodrum perdesi basınçları farklı analiz konularıdır. Yapı modeli kuvvetleri geoteknik modele tutarlı aktarılmalıdır.",
        "Temel taşıma gücü güvenliği, kinematik etkileşim denetiminin yerini tutmaz."
      ]
    ]
  ]
];
const BASE="/tbdy-stage2/";
const PDF="https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf";
function related(ch:number): string[] {
  if (ch===1) return ["tbdy-bks-dts-bys-belirleme","tbdy-tasarim-spektrumu-cizimi"];
  if (ch===2) return ["tbdy-tasarim-spektrumu-cizimi","tbdy-2018-dogrusal-olmayan-tasarim"];
  if (ch===5) return ["tbdy-2018-dogrusal-olmayan-tasarim","tbdy-performans-hedefleri-dd-sh-kh-go"];
  if (ch===6) return ["tbdy-goreli-kat-otelenmesi","tbdy-rijit-yari-rijit-diyafram"];
  if (ch===8) return ["tbdy-betonarme-diyafram-toplayici-baslik","tbdy-2018-betonarme-analiz"];
  if (ch===9||ch===10) return ["tbdy-r-d-dayanim-fazlaligi","tbdy-suneklik-duzeyi-sistem-farki"];
  if (ch===11||ch===12) return ["tbdy-2018-duzensizlikler-rehberi","tbdy-rijit-yari-rijit-diyafram"];
  if (ch===13) return ["tbdy-2018-dogrusal-olmayan-tasarim","tbdy-performans-hedefleri-dd-sh-kh-go"];
  return ["tbdy-yerel-zemin-sinifi-spektrum","tbdy-bolum-16-zemin-yapi-etkilesimi"];
}
function makeArticle([ch,slug,title,description,clauses,steps]:Spec): ArticleData {
  return {
    slug,title,description,seoTitle:title+" | TBDY 2018 Bölüm "+ch,seoDescription:description,
    sectionId:"deprem-yonetmelik",seriesId:"tbdy",regulationStatus:"in-force",
    category:"TBDY 2018 Rehberi",categoryColor:"bg-red-600 text-white",badgeLabel:"TBDY Bölüm "+ch,
    author:"İnşaat Mühendisi Hüseyin GÜNAYDIN",authorTitle:"",
    date:"27 Ekim 2026",updatedAt:"27 Ekim 2026",readTime:"7 dk",image:BASE+slug+"/cover.svg",
    sections:[
      {id:"kapsam",title:"Bölüm "+ch+": kısa sonuç ve kapsam",
        content:"**Kısa sonuç:** "+description+".\n\n!["+title+" için özgün teknik kontrol şeması]("+BASE+slug+"/diagram.svg)\n*Bölüm "+ch+" teknik kararlarının özgün ve ölçeksiz gösterimi.*\n{figure: 1 | note: Şematik gösterim, tasarım hesabı yerine geçmez. | source: AFAD TBDY 2018 Bölüm "+ch+" | lightbox: true}",subsections:[]},
      ...steps.map(([heading,body,warning],i)=>({id:"karar-"+(i+1),title:heading,content:body+"\n\n> [!KONTROL] Proje kontrolü\n> "+warning,subsections:[]})),
      {id:"kontrol-ozeti",title:"Kritik proje kontrol listesi",content:steps.map(([h,,w])=>"- **"+h+"** — "+w).join("\n"),subsections:[]}
    ],
    relatedSlugs:related(ch),keywords:[title,...clauses.split(","),"Bölüm "+ch],tags:[title],
    references:[
      {label:"AFAD — TBDY 2018 Bölüm "+ch,href:PDF,note:"Bağlayıcı teknik metin; proje tarihindeki hüküm ve istisnalar doğrulanmalıdır."},
      {label:"Resmî Gazete, 18 Mart 2018 / 30364 (Mükerrer)",href:"https://resmigazete.gov.tr/eskiler/2018/03/20180318M1-2.htm"}
    ]
  };
}
export const TBDY_STAGE2_ARTICLES: ArticleData[] = SPECS.map(makeArticle);
