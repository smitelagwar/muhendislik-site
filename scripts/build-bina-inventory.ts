import fs from "fs";
import path from "path";
import { getAllIndexedBinaNodes, type IndexedBinaNode } from "../src/lib/bina-asamalari";

interface CanonicalBrief {
  id: string;
  mode: "site-process" | "installed-component" | "technical-cutaway" | "project-visual";
  focus: string;
  mustShow: string[];
  mustNotShow: string[];
}

const CANONICAL_BRIEFS: Record<string, CanonicalBrief> = {
  // 1. Proje & İzinler (6)
  "proje-hazirlik": {
    id: "proje-hazirlik",
    mode: "project-visual",
    focus: "Tasarım koordinasyonu, mimari maket ve çizim paftaları genel görünümü",
    mustShow: ["mimari fiziksel maket", "çizim paftaları üzerinde plan ve kesit geometrileri", "koordinasyon masası"],
    mustNotShow: ["okunur metin", "sahte resmi mühür", "ölçü rakamları", "logo"],
  },
  "mimari-proje": {
    id: "mimari-proje",
    mode: "project-visual",
    focus: "Mimari plan ve kesit geometrileri ile temiz bina kütlesi ilişkisi",
    mustShow: ["mimari kat planı geometrisi", "kesit çizgileri", "mekan hacimleri", "temiz bina kütlesi"],
    mustNotShow: ["okunur oda isimleri", "ölçü rakamları", "lejant yazıları", "logo"],
  },
  "statik-proje": {
    id: "statik-proje",
    mode: "project-visual",
    focus: "Taşıyıcı sistem şeması, kolon-kiriş aksları ve 3D yapısal çerçeve modeli",
    mustShow: ["3D yapısal çerçeve modeli", "kolon ve kiriş aks çizgileri", "taşıyıcı sistem şeması"],
    mustNotShow: ["yazılım arayüzü (UI)", "okunur metin", "boyutlandırma etiketleri"],
  },
  "tesisat-projesi": {
    id: "tesisat-projesi",
    mode: "project-visual",
    focus: "Bina kesitinde mekanik tesisat boru güzergahları ve şaft koordinasyonu",
    mustShow: ["mekanik tesisat şaftları", "boru güzergahı geometrisi", "mimari kesit içinde tesisat akışı"],
    mustNotShow: ["okunur boru çapı yazıları", "etiketler", "sahte şema açıklamaları"],
  },
  "elektrik-projesi": {
    id: "elektrik-projesi",
    mode: "project-visual",
    focus: "Elektrik tava hatları, ana dağıtım ve aydınlatma linyesi proje koordinasyonu",
    mustShow: ["kablo tavası güzergah geometrisi", "elektrik şaftı yerleşimi", "dağıtım hatları akışı"],
    mustNotShow: ["pseudo-text", "okunur devre numaraları", "sahte sembol lejantı"],
  },
  "yapi-ruhsati": {
    id: "yapi-ruhsati",
    mode: "project-visual",
    focus: "Onaylı proje setleri ve inşaata başlama hazırlığı bağlamı",
    mustShow: ["rulo proje paftaları", "şantiye baret ve koordinasyon bağlamı", "inşaat başlangıç hazırlığı"],
    mustNotShow: ["sahte belediye evrakı", "sahte mühür", "okunur imza/yazı"],
  },

  // 2. Kazı & Temel (13)
  "kazi-temel": {
    id: "kazi-temel",
    mode: "site-process",
    focus: "Kazı platformu, iksa sistemleri ve temel hazırlığının genel saha bağlamı",
    mustShow: ["açılmış temel çukuru", "paletli ekskavatör", "iksa perdesi", "şantiye güvenlik sınırı"],
    mustNotShow: ["kolaj", "yazı", "ölçü etiketleri", "sahte tabela"],
  },
  "zemin-etudu": {
    id: "zemin-etudu",
    mode: "site-process",
    focus: "Sondaj makinesi, karot numune sandıkları ve zemin araştırma operasyonu",
    mustShow: ["arazi sondaj makinesi", "sondaj tijleri", "karot numune sandığı ve zemin karotları"],
    mustNotShow: ["cihaz üzerinde okunur marka", "sahte rapor kağıtları", "yazı"],
  },
  "hafriyat": {
    id: "hafriyat",
    mode: "site-process",
    focus: "Ekskavatörün temel çukurunda kademeli kazı yapması ve kamyon yüklemesi",
    mustShow: ["ağır iş makinesi ekskavatör", "kademe şevli kazı yüzeyi", "hafriyat kamyonu", "doğal toprak katmanı"],
    mustNotShow: ["oyuncak/plastik render", "yazı", "logo"],
  },
  "iksa-sistemi": {
    id: "iksa-sistemi",
    mode: "technical-cutaway",
    focus: "Derin kazı çukurunu tutan betonarme iksa perdesi ve zemin katmanı ilişkisi",
    mustShow: ["düşey iksa perdesi", "arka zemin kütlesi", "temel kazı tabanı", "güvenli destekleme sistemi"],
    mustNotShow: ["ölçü çizgileri", "yazı", "anlamsız renkli neon hatlar"],
  },
  "fore-kazik": {
    id: "fore-kazik",
    mode: "site-process",
    focus: "Döner delgi makinesi (fore kazık makinesi) ve donatı kafesi yerleşimi",
    mustShow: ["büyük fore kazık delgi makinesi (rotary drilling rig)", "silindirik donatı kafesi", "şantiye zemini"],
    mustNotShow: ["okunur marka", "yazı", "sahte tabela"],
  },
  "ankrajli-iksa": {
    id: "ankrajli-iksa",
    mode: "technical-cutaway",
    focus: "İksa perdesi yüzeyindeki çelik ankraj başlıkları ve zemine eğik uzanan kök ankrajlar",
    mustShow: ["betonarme iksa yüzeyi", "çelik ankraj plakaları ve başlıkları", "zemine eğik giren ankraj halatları"],
    mustNotShow: ["etiket yazıları", "oklar", "şematik metinler"],
  },
  "palplans": {
    id: "palplans",
    mode: "site-process",
    focus: "Kilitli çelik palplanş perdelerinin vibro-çekiç ile zemine çakılması",
    mustShow: ["oluklu çelik palplanş profilleri", "birbirine kenetlenen çelik kilitler", "vibro çakıcı ekipman"],
    mustNotShow: ["yazı", "ölçü", "sahte marka"],
  },
  "temel-turleri": {
    id: "temel-turleri",
    mode: "technical-cutaway",
    focus: "Tekil sömel, sürekli temel ve radye plağın zemin üzerindeki izometrik yapısal kesiti",
    mustShow: ["temel plağı geometrisi", "zemin temas yüzeyi", "kolon filizleri bağlantısı"],
    mustNotShow: ["metin etiketleri", "oda isimleri", "ölçü rakamları"],
  },
  "radye-temel": {
    id: "radye-temel",
    mode: "site-process",
    focus: "Geniş alanlı radye temel donatı ağı, sehpa demirleri ve kolon filizleri",
    mustShow: ["çift kat yoğun nervürlü donatı ağı", "donatı sehpaları", "yükselen kolon filiz demirleri"],
    mustNotShow: ["çizgi ikon", "yazı", "filigran"],
  },
  "grobeton": {
    id: "grobeton",
    mode: "site-process",
    focus: "Kazılmış temel tabanına temiz grobeton tabakasının serilmesi ve mastarlanması",
    mustShow: ["düzeltilmiş zemin üzerine dökülen açık gri grobeton", "mastar ile yüzey düzleme", "temiz düz taban"],
    mustNotShow: ["yazı", "ölçü", "kolaj"],
  },
  "temel-donati": {
    id: "temel-donati",
    mode: "site-process",
    focus: "Radye temel alt ve üst donatı örgüsü, pas payı takozları ve bağ telleri",
    mustShow: ["nervürlü çelik donatı ızgarası", "beton pas payı takozları", "bağ teli düğümleri"],
    mustNotShow: ["ölçü oku", "yazı", "anlamsız semboller"],
  },
  "temel-betonlama": {
    id: "temel-betonlama",
    mode: "site-process",
    focus: "Mobil beton pompası bomu ile temele sürekli taze beton dökümü ve yayılması",
    mustShow: ["beton pompası esnek kauçuk hortumu", "taze beton akışı", "donatı arasına dolan beton"],
    mustNotShow: ["logo", "okunur yazı", "sahte tabela"],
  },
  "temel-su-yalitimi": {
    id: "temel-su-yalitimi",
    mode: "technical-cutaway",
    focus: "Temel altı ve perde duvar dışındaki bitümlü membran yalıtım katmanının sürekliliği",
    mustShow: ["temel altı yalıtım membranı", "pah detayında bükülen membran", "perde duvara tırmanan yalıtım", "koruma katmanı"],
    mustNotShow: ["ürün katalog etiketi", "yazı", "ölçü"],
  },

  // 3. Kaba İnşaat (25)
  "kaba-insaat": {
    id: "kaba-insaat",
    mode: "site-process",
    focus: "Betonarme iskeletin yükseldiği şantiye: kolonlar, döşeme kalıpları ve kule vinç",
    mustShow: ["betonarme kolon ve perdeler", "döşeme kalıp iskeleleri", "gökyüzüne yükselen katlar", "kule vinç bomu"],
    mustNotShow: ["kolaj", "yazı", "logo", "aşırı sinematik neon"],
  },
  "kalip-isleri": {
    id: "kalip-isleri",
    mode: "site-process",
    focus: "Endüstriyel çelik çerçeveli plywood kalıp panelleri ve teleskopik dikmeler",
    mustShow: ["plywood kalıp yüzeyleri", "çelik kalıp kilitleri", "teleskopik dikme direkleri"],
    mustNotShow: ["yazı", "marka", "ölçü"],
  },
  "kolon-kalibi": {
    id: "kolon-kalibi",
    mode: "site-process",
    focus: "Düşey kolon kalıp paneli, çelik kuşaklar ve şakül ayar payandaları",
    mustShow: ["düşey kalıp panelleri", "kolon kelepçe ve kuşakları", "çapraz ayar payandaları"],
    mustNotShow: ["yazı", "ölçü", "logo"],
  },
  "kiris-kalibi": {
    id: "kiris-kalibi",
    mode: "site-process",
    focus: "Kiriş taban ve kanat kalıpları, döşeme bağlantısı ve alt taşıyıcı iskele",
    mustShow: ["U şekilli kiriş kalıp kanatları", "kalıp altı H-iskele veya dikmeler", "kolon birleşim boğazı"],
    mustNotShow: ["ölçü çizgisi", "yazı", "kolaj"],
  },
  "doseme-kalibi": {
    id: "doseme-kalibi",
    mode: "site-process",
    focus: "Geniş döşeme kalıp platformu, ana ve tali ahşap H20 kirişler ve teleskopik dikmeler",
    mustShow: ["sarı H20 ahşap kirişler", "düzgün döşenmiş plywood plakalar", "aşağıdaki teleskopik dikme ormanı"],
    mustNotShow: ["yazı", "logo", "ölçü"],
  },
  "kalip-sokumu": {
    id: "kalip-sokumu",
    mode: "site-process",
    focus: "Betonu prizini almış kolon veya kiriş kanat kalıbının levyeyle dikkatle sökülmesi",
    mustShow: ["sertleşmiş pürüzsüz beton yüzey", "açılan kalıp paneli", "emniyetli çalışma pozisyonu"],
    mustNotShow: ["yazı", "parçalanmış beton", "deforme el"],
  },
  "donati-isleri": {
    id: "donati-isleri",
    mode: "site-process",
    focus: "Nervürlü inşaat demirlerinin sahada bağlanması ve donatı hazırlığı",
    mustShow: ["inşaat demirleri demeti", "demirci kerpeteni ile bağ teli bağlama", "döşeme veya kolon donatı kurgusu"],
    mustNotShow: ["yazı", "ölçü oku", "çizgi sembol"],
  },
  "kolon-donati": {
    id: "kolon-donati",
    mode: "site-process",
    focus: "Düşey kolon donatı kafesi, sıklaştırılmış etriyeler ve çirozlar",
    mustShow: ["düşey boyuna donatı çubukları", "sık aralıklı kapalı etriyeler", "çiroz kancaları"],
    mustNotShow: ["ölçü yazısı", "pseudo-text", "çizgi lejant"],
  },
  "kiris-donati": {
    id: "kiris-donati",
    mode: "site-process",
    focus: "Kiriş donatı kafesi, alt-üst boyuna demirler, etriyeler ve kolon düğüm noktası",
    mustShow: ["kiriş sepet donatısı", "çift kollu etriyeler", "kolon-kiriş birleşim düğüm noktası"],
    mustNotShow: ["yazı", "çizim oku", "logo"],
  },
  "doseme-donati": {
    id: "doseme-donati",
    mode: "site-process",
    focus: "Kalıp üzerine serilmiş çift doğrultulu döşeme donatı ağı ve mesnet pilyeleri/donatıları",
    mustShow: ["kare gözlü alt ve üst donatı ağı", "mesnet donatıları", "plastik pas payı takozları"],
    mustNotShow: ["yazı", "ölçü etiketleri", "kolaj"],
  },
  "pas-payi": {
    id: "pas-payi",
    mode: "technical-cutaway",
    focus: "Donatı demirinin kalıptan mesafesini sağlayan beton veya plastik pas payı takozunun net kesiti",
    mustShow: ["nervürlü donatı çubuğu", "kalıp yüzeyi", "donatı altında oturan pas payı takozu", "net koruma mesafesi"],
    mustNotShow: ["yazı", "rakam", "ölçü oku"],
  },
  "beton-isleri": {
    id: "beton-isleri",
    mode: "site-process",
    focus: "Hazır beton transmikseri, beton pompası besleme teknesi ve şantiye döküm hattı",
    mustShow: ["hazır beton transmikseri", "pompanın besleme haznesine beton döküşü", "basınç borusu"],
    mustNotShow: ["okunur şirket yazısı", "plaka", "reklam"],
  },
  "beton-sinifi": {
    id: "beton-sinifi",
    mode: "technical-cutaway",
    focus: "Standart beton silindir ve küp basınç dayanım numuneleri ve agrega tane dağılım kesiti",
    mustShow: ["15x15 cm standart beton küp numunesi", "silindir beton numunesi", "iç beton agrega/çimento matrisi"],
    mustNotShow: ["sahte C30/37 yazısı", "etiket", "yazı"],
  },
  "beton-dokumu": {
    id: "beton-dokumu",
    mode: "site-process",
    focus: "Beton pompa hortumundan döşeme ve perde kalıbına taze betonun kontrollü serilmesi",
    mustShow: ["esnek döküm hortumu", "akışkan taze beton dalgası", "kalıp içine dolan homojen beton"],
    mustNotShow: ["sahte marka", "yazı", "filigran"],
  },
  "vibrasyon": {
    id: "vibrasyon",
    mode: "site-process",
    focus: "Dökülen taze betona daldırılan mekanik iğne vibratör ve hava kabarcıklarının yüzeye çıkışı",
    mustShow: ["düşey daldırılmış çelik vibratör şişesi", "taze beton yüzeyinde titreşim dalgaları", "hava çıkışı"],
    mustNotShow: ["yazı", "logo", "ölçü"],
  },
  "kur-islemi": {
    id: "kur-islemi",
    mode: "site-process",
    focus: "Yeni dökülmüş döşeme betonunun çatlamayı önlemek için su jetiyle ıslatılması ve nem kürü",
    mustShow: ["yeni priz almış gri beton yüzeyi", "su hortumundan püskürtülen ince su sisi/tabakası", "ıslak parlak kür yüzeyi"],
    mustNotShow: ["yazı", "ölçü", "kolaj"],
  },
  "beton-testi": {
    id: "beton-testi",
    mode: "installed-component",
    focus: "Yapı laboratuvarında hidrolik pres cihazı arasına yerleştirilmiş beton küp basınç testi",
    mustShow: ["ağır çelik hidrolik pres plakaları", "arada duran beton test küpü", "laboratuvar test masası"],
    mustNotShow: ["cihaz ekranında okunur değer", "sahte rapor", "yazı"],
  },
  "duvar-orme": {
    id: "duvar-orme",
    mode: "site-process",
    focus: "İskelet arasında duvarda harç yatağı üzerine blok yerleştirme ve şakül/ip kontrolü",
    mustShow: ["tuğla veya gazbeton duvar sırası", "mala ile harç yayma", "duvar örüm ipi (çırpı ipi)"],
    mustNotShow: ["yazı", "marka", "kolaj"],
  },
  "tugla-duvar": {
    id: "tugla-duvar",
    mode: "site-process",
    focus: "Düzgün derzli kırmızı delikli pişmiş kil tuğla duvar örgüsü ve harç birleşimi",
    mustShow: ["kırmızı delikli tuğlalar", "yatay ve düşey çimento harcı derzleri", "şaşırtmalı örme düzeni"],
    mustNotShow: ["yazı", "ölçü", "bozuk perspektif"],
  },
  "ytong-gazbeton": {
    id: "ytong-gazbeton",
    mode: "site-process",
    focus: "Beyaz hafif gazbeton blokların ince derz yapıştırıcısı ve dişli mala ile hassas örülmesi",
    mustShow: ["beyaz pürüzsüz gazbeton bloklar", "ince yapıştırıcı harç tabakası", "lastik tokmak ile teraziye alma"],
    mustNotShow: ["okunur ticari marka adı", "yazı", "logo"],
  },
  "briket": {
    id: "briket",
    mode: "site-process",
    focus: "Gri bims/briket bloklarla dış cephe veya bölme duvar örülmesi ve kilit derzler",
    mustShow: ["dokulu gri bims bloklar", "harçlı duvar birleşimi", "düzenli sıra örgüsü"],
    mustNotShow: ["yazı", "ölçü", "kolaj"],
  },
  "cati-iskeleti": {
    id: "cati-iskeleti",
    mode: "site-process",
    focus: "Binanın üst katında kalkan duvarlar üzerine oturan üçgen çatı taşıyıcı makas ve aşık karkası",
    mustShow: ["üçgen çatı makasları", "boyuna uzanan aşıklar ve mertekler", "açık gökyüzü altında taşıyıcı iskelet"],
    mustNotShow: ["kaplama malzemesi kolajı", "yazı", "ölçü"],
  },
  "ahsap-cati": {
    id: "ahsap-cati",
    mode: "installed-component",
    focus: "Geleneksel emprenye ahşap çatı makası, mertek, aşık bağlantı detayı ve çelik bulonlar",
    mustShow: ["doğal masif ahşap kirişler", "çentikli birleşim ve metal bağlantı plakası", "çatı eğimi"],
    mustNotShow: ["yazı", "ölçü oku", "sahte lejant"],
  },
  "celik-cati": {
    id: "celik-cati",
    mode: "site-process",
    focus: "Geniş açıklıklı çelik kafes makas sistemi, IPE/HEA profilleri ve cıvatalı montaj",
    mustShow: ["çelik kafes kirişler", "flanşlı ve cıvatalı birleşimler", "rüzgar çaprazları"],
    mustNotShow: ["yazı", "marka", "kolaj"],
  },
  "teras-cati": {
    id: "teras-cati",
    mode: "technical-cutaway",
    focus: "Düz teras çatıda betonarme döşeme, eğim betonu, su yalıtımı ve ısı yalıtım katman kesiti",
    mustShow: ["betonarme döşeme", "eğim şapı", "su yalıtım membranı", "XPS ısı yalıtımı", "koruma harcı/kaplama"],
    mustNotShow: ["metin etiketleri", "ölçü rakamları", "oklar"],
  },

  // 4. İnce İşler (25)
  "ince-isler": {
    id: "ince-isler",
    mode: "site-process",
    focus: "Kaba inşaatı bitmiş gerçek iç mekanda sıva, asma tavan ve zemin kaplama aşamalarının ilerlemesi",
    mustShow: ["gerçek modern iç mekan", "duvar sıva yüzeyi", "tavanda asma tavan karkası", "zeminde tesviye ve kaplama"],
    mustNotShow: ["malzeme kolajı", "havada numuneler", "yazı", "neon efektler"],
  },
  "siva": {
    id: "siva",
    mode: "site-process",
    focus: "İç mekan tuğla duvar yüzeyine çelik mala ile taze harç sıva uygulaması ve mastarlama",
    mustShow: ["tuğla duvar yüzeyi", "mala ile uygulanan taze gri sıva harcı", "mastarla düzeltilmiş pürüzsüz alan"],
    mustNotShow: ["havada mala", "çizgi ikon", "yazı", "filigran"],
  },
  "ic-siva": {
    id: "ic-siva",
    mode: "site-process",
    focus: "Oda içinde ano çıtaları arasında iç sıvanın alüminyum mastarla düzeltilmesi",
    mustShow: ["iç oda duvarı ve köşe ano çıtası", "mastarlama işlemi", "düzgün harç yüzeyi"],
    mustNotShow: ["yazı", "ölçü", "kolaj"],
  },
  "dis-siva": {
    id: "dis-siva",
    mode: "site-process",
    focus: "Bina dış cephesinde şantiye iskelesi üzerinde dış cephe kaba ve ince sıva uygulaması",
    mustShow: ["dış cephe yüzeyi", "güvenli cephe iskelesi", "dış hava koşullarına dayanıklı sıva katmanı"],
    mustNotShow: ["yazı", "ölçü", "sahte tabela"],
  },
  "alci-siva": {
    id: "alci-siva",
    mode: "site-process",
    focus: "Duvara son kat perdah alçısı uygulaması ve saten pürüzsüzlüğünde beyaz yüzey",
    mustShow: ["çelik mala üzerinde beyaz alçı harcı", "pürüzsüz bembeyaz duvar yüzeyi", "iç mekan ortamı"],
    mustNotShow: ["yazı", "ölçü", "kolaj"],
  },
  "alcipan": {
    id: "alcipan",
    mode: "technical-cutaway",
    focus: "Galvaniz çelik C-U profilleri, taşyünü yalıtım dolgusu ve alçıpan levha montaj ilişkisi",
    mustShow: ["galvaniz metal karkas dikmeleri", "yalıtım levhası dolgusu", "vidalanan alçıpan panel"],
    mustNotShow: ["yazı", "ölçü rakamı", "havada yüzen plaka"],
  },
  "bolme-duvar": {
    id: "bolme-duvar",
    mode: "technical-cutaway",
    focus: "Oda bölmesinde çift tarafı alçı levha kaplı ses yalıtımlı hafif karkas duvar kesiti",
    mustShow: ["metal karkas iskeleti", "iç taşyünü dolgu", "her iki yüzde alçıpan plakalar", "zemin-tavan profili"],
    mustNotShow: ["metin etiketi", "ölçü", "anlamsız sembol"],
  },
  "asma-tavan": {
    id: "asma-tavan",
    mode: "technical-cutaway",
    focus: "Tavana çelik askı telleriyle bağlanan ana/tali taşıyıcı tavan karkası ve levha montajı",
    mustShow: ["tavan askı çubukları ve klipsler", "TC profil taşıyıcı ızgarası", "alçı levha birleşimi"],
    mustNotShow: ["yazı", "ölçü oku", "sahte lamba yazısı"],
  },
  "zemin-kaplamalari": {
    id: "zemin-kaplamalari",
    mode: "site-process",
    focus: "Tesviye edilmiş düzgün şap zemin üzerinde ilerleyen gerçek zemin kaplaması montajı",
    mustShow: ["alt düz şap tabakası", "birleşim derzleriyle döşenen zemin kaplaması", "gerçek oda zemin perspektifi"],
    mustNotShow: ["dört malzeme numunesinin havada kolajı", "ürün kataloğu görüntüsü", "yazı"],
  },
  "seramik-kaplama": {
    id: "seramik-kaplama",
    mode: "site-process",
    focus: "Zemine dişli mala ile çekilen yapıştırıcı harç üzerine seramik karo yerleşimi ve seviye takozları",
    mustShow: ["dişli mala harç izleri", "porselen seramik karolar", "derz artı/seviye ayar takozları"],
    mustNotShow: ["yazı", "marka", "kolaj"],
  },
  "parke-kaplama": {
    id: "parke-kaplama",
    mode: "site-process",
    focus: "Şilte altlık üzerine kilitli lamine/laminat parke panellerinin klik sistemiyle birbirine geçmesi",
    mustShow: ["beyaz köpük şilte alt tabaka", "ahşap dokulu parke panelleri", "kenar genleşme takozu ve montaj yönü"],
    mustNotShow: ["yazı", "ölçü", "kolaj"],
  },
  "mermer-kaplama": {
    id: "mermer-kaplama",
    mode: "site-process",
    focus: "Geniş formatlı doğal damarlı mermer plakanın harç yatağına teraziyle yerleştirilmesi",
    mustShow: ["büyük doğal taş mermer plaka", "harç yatağı", "lastik tokmak ve su terazisi"],
    mustNotShow: ["yazı", "sahte numune etiketi", "kolaj"],
  },
  "epoksi-kaplama": {
    id: "epoksi-kaplama",
    mode: "site-process",
    focus: "Beton zemin üzerine çekçek ve rulo ile uygulanan kendiliğinden yayılan parlak epoksi kaplama",
    mustShow: ["parlak monolitik epoksi yüzey", "kirpi rulo ile hava kabarcığı alma", "kusursuz düz zemin"],
    mustNotShow: ["yazı", "logo", "ölçü"],
  },
  "duvar-kaplamalari": {
    id: "duvar-kaplamalari",
    mode: "site-process",
    focus: "İç mekan duvar yüzeyinde dekoratif bitiş kaplamasının hazırlanmış alt yüzeyle ilişkisi",
    mustShow: ["düzgün sıvalı alt duvar", "montajı yapılan kaliteli duvar kaplama paneli/seramiği", "derz ve kenar bitişi"],
    mustNotShow: ["havada 3 numune panel", "ürün kataloğu", "yazı"],
  },
  "fayans": {
    id: "fayans",
    mode: "site-process",
    focus: "Banyo/ıslak hacim duvarında su yalıtımlı yüzeye dişli harçla döşenen duvar fayansı",
    mustShow: ["ıslak hacim duvarı", "dişli yapıştırıcı yatağı", "düzenli derz boşluklu parlak fayans karoları"],
    mustNotShow: ["yazı", "marka", "kolaj"],
  },
  "boya": {
    id: "boya",
    mode: "site-process",
    focus: "Pürüzsüz astarlı duvara boya rulosu ile son kat mat iç cephe boyası uygulaması",
    mustShow: ["duvar yüzeyinde rulo geçiş izi", "boya rulosu ve uzatma sapı", "tavan köşesinde düzgün kestirme bandı"],
    mustNotShow: ["yazı", "sahte boya markası", "kolaj"],
  },
  "duvar-kagidi": {
    id: "duvar-kagidi",
    mode: "site-process",
    focus: "Tutkallanmış duvara rulo duvar kağıdının hava kabarcığı bırakılmadan spatulayla yapıştırılması",
    mustShow: ["düşey duvar kağıdı şeridi", "plastik uygulama spatulası", "tam oturan ek yeri (desen birleşimi)"],
    mustNotShow: ["yazı", "ölçü", "kolaj"],
  },
  "kapi-pencere": {
    id: "kapi-pencere",
    mode: "technical-cutaway",
    focus: "Duvar açıklığı, kör kasa, pencere/kapı ana kasası, montaj vidası ve poliüretan köpük yalıtımı",
    mustShow: ["duvar boşluğu kesiti", "kasa profili ve cam/kanat", "montaj köpüğü ve sızdırmazlık bandı"],
    mustNotShow: ["ürün kataloğu", "marka", "ölçü yazısı"],
  },
  "dis-kapi": {
    id: "dis-kapi",
    mode: "installed-component",
    focus: "Daire girişinde kör kasaya emniyetli montajı yapılmış sağlam çelik kapı ve pervaz birleşimi",
    mustShow: ["sağlam çelik kapı kanadı", "çelik kasa ve ayarlanabilir pervaz", "duvar eşik birleşimi"],
    mustNotShow: ["yazı", "marka", "sahte numara"],
  },
  "ic-kapi": {
    id: "ic-kapi",
    mode: "installed-component",
    focus: "Oda duvar boşluğuna monte edilen ahşap iç kapı kasası, pervazı ve menteşe detayı",
    mustShow: ["ahşap kapı kanadı ve kasası", "duvara oturan teleskopik pervaz", "hassas menteşe birleşimi"],
    mustNotShow: ["yazı", "ölçü", "kolaj"],
  },
  "pencere": {
    id: "pencere",
    mode: "installed-component",
    focus: "Duvar açıklığında çok odacıklı yalıtımlı PVC/alüminyum pencere doğraması, çift cam ve denizlik",
    mustShow: ["doğrama profili", "çift cam ünitesi", "duvar altı mermer denizlik ve silikon fitil"],
    mustNotShow: ["cam üstü reklam etiketi", "marka", "yazı"],
  },
  "cati-kaplamasi": {
    id: "cati-kaplamasi",
    mode: "technical-cutaway",
    focus: "Eğimli çatıda ahşap lata, su yalıtım örtüsü, OSB kaplama ve son kat kiremit/metal katman ilişkisi",
    mustShow: ["taşıyıcı karkas üzeri OSB levha", "su yalıtım membranı (nefes alan örtü)", "havalandırma latası", "son kat çatı kaplaması"],
    mustNotShow: ["havada 4 malzeme numunesi", "ürün kataloğu", "ölçü yazısı"],
  },
  "kiremit": {
    id: "kiremit",
    mode: "site-process",
    focus: "Eğimli çatı latası üzerine kilitli kiremitlerin alttan üste doğru düzenli sıralarla dizilmesi",
    mustShow: ["kırmızı kil kiremit sıraları", "birbirine binen kilit olukları", "mahya hattı ve çatı eğimi"],
    mustNotShow: ["yazı", "ölçü", "kolaj"],
  },
  "membran-cati": {
    id: "membran-cati",
    mode: "site-process",
    focus: "Teras çatıda şalümo aleviyle ısıtılarak zemine yapıştırılan arduvazlı bitümlü membran ruloları",
    mustShow: ["şalümo alev başlığı", "eriyerek yapışan siyah bitüm tabakası", "binme payıyla serilen rulo membran"],
    mustNotShow: ["yazı", "marka", "kolaj"],
  },
  "metal-cati": {
    id: "metal-cati",
    mode: "installed-component",
    focus: "Çatı konstrüksiyonu üzerine kenet robotu ile birleştirilen modern çinko/titanyum kenet metal panel",
    mustShow: ["boyuna dik dikiş kenet metal paneller", "gizli klips bağlantıları", "modern çatı çizgisi"],
    mustNotShow: ["yazı", "marka", "kolaj"],
  },

  // 5. Tesisat İşleri (11)
  "tesisat-isleri": {
    id: "tesisat-isleri",
    mode: "installed-component",
    focus: "Binanın teknik şaftında ve tavanında düzenli ilerleyen mekanik boru ve elektrik tava hatları",
    mustShow: ["yalıtımlı mekanik borular", "kablo kanalları/tavaları", "temiz şaft geçişleri"],
    mustNotShow: ["kablo karmaşası", "yazı", "ölçü oku", "logo"],
  },
  "sihhi-tesisat": {
    id: "sihhi-tesisat",
    mode: "site-process",
    focus: "Temiz su PPRC borularının kaynak makinesiyle füzyon kaynağı yapılarak döşenmesi",
    mustShow: ["yeşil PPRC boru ve fittings parçaları", "boru kaynak paftası aleti", "duvar içi tesisat kanalı"],
    mustNotShow: ["yazı", "marka", "kolaj"],
  },
  "temiz-su": {
    id: "temiz-su",
    mode: "installed-component",
    focus: "Teknik odada temiz su dağıtım kollektörü (manifoldu), vanalar ve hat ayrımı",
    mustShow: ["pirinç dağıtım kollektörü", "kırmızı/mavi hat vanaları", "duvara kelepçeli düzenli boru hatları"],
    mustNotShow: ["okunur etiket", "yazı", "ölçü"],
  },
  "pis-su": {
    id: "pis-su",
    mode: "installed-component",
    focus: "Düşey atık su kolon borusu, çatal ve dirsek bağlantıları ve %2 akış eğimi",
    mustShow: ["kalın PVC atık su kolon borusu", "45 derece çatal ve temizleme kapağı", "akış yönünde eğimli yatay hat"],
    mustNotShow: ["yazı", "marka", "ölçü"],
  },
  "elektrik-tesisati": {
    id: "elektrik-tesisati",
    mode: "installed-component",
    focus: "Tuğla duvar kanalı içine yerleştirilmiş spiral borular, kasa ve buat bağlantıları",
    mustShow: ["duvar içi oluk kanalı", "turuncu spiral elektrik boruları", "anahtar/priz kasaları"],
    mustNotShow: ["yazı", "ölçü", "kolaj"],
  },
  "kablolama": {
    id: "kablolama",
    mode: "site-process",
    focus: "Tavandaki delikli saç kablo tavası içinde düzenli sıralanmış yangına dayanıklı kablo demetleri",
    mustShow: ["galvaniz delikli kablo tavası", "klipslerle sabitlenmiş paralel kablo demetleri", "tavan askı tijleri"],
    mustNotShow: ["etiket yazıları", "okunur kablo kodu", "dağınıklık"],
  },
  "pano-montaj": {
    id: "pano-montaj",
    mode: "installed-component",
    focus: "Teknik hacimde ana elektrik dağıtım panosu, modüler sigortalar, baralar ve düzenli kablo girişi",
    mustShow: ["çelik pano gövdesi", "DIN rayı üzerinde dizili otomatik sigortalar ve kaçak akım röleleri", "kablo kanalları"],
    mustNotShow: ["okunur marka yazısı", "sahte şema", "etiketler"],
  },
  "isitma-sogutma": {
    id: "isitma-sogutma",
    mode: "installed-component",
    focus: "Mekanik merkezde kazan/ısı pompası bağlantısı, sirkülasyon pompaları ve izolasyonlu borular",
    mustShow: ["kauçuk izoleli ısıtma boruları", "flanşlı sirkülasyon pompaları", "küresel vanalar ve manometreler"],
    mustNotShow: ["manometre üstü okunur yazı", "marka", "kolaj"],
  },
  "yerden-isitma": {
    id: "yerden-isitma",
    mode: "technical-cutaway",
    focus: "Döşeme üzerinde modülasyon paneli arasına döşenmiş kırmızı PEX serpantin boru ve şap katmanı",
    mustShow: ["kabarcıklı strafor izolasyon paneli", "düzenli salyangoz veya meander kıvrımlı PEX boru", "üzerine dökülen şap katmanı"],
    mustNotShow: ["yazı", "ölçü oku", "havada boru"],
  },
  "klima-tesisat": {
    id: "klima-tesisat",
    mode: "installed-component",
    focus: "VRF/klima iç ünite tavan montajı, izoleli bakır boru hattı ve şeffaf drenaj hattı",
    mustShow: ["tavan içi kaset tipi klima gövdesi", "beyaz izoleli çift bakır boru hattı", "eğimli yoğuşma drenaj borusu"],
    mustNotShow: ["marka logosu", "yazı", "kolaj"],
  },
  "yangin-tesisati": {
    id: "yangin-tesisati",
    mode: "installed-component",
    focus: "Tavanda kırmızı çelik yangın boru hattı ve aşağı sarkan pirinç sprinkler başlıkları",
    mustShow: ["kırmızı boyalı dikişsiz çelik borular", "dişli kaplin ve askı kelepçeleri", "cam tüplü yangın sprinkler başlığı"],
    mustNotShow: ["okunur etiket", "yazı", "sahte uyarı levhası"],
  },

  // 6. Peyzaj & Teslim (5)
  "peyzaj-teslim": {
    id: "peyzaj-teslim",
    mode: "site-process",
    focus: "Yapımı tamamlanmış modern bina, temiz çevre düzeni, yürüyüş yolları ve yeşil alanlar",
    mustShow: ["tamamlanmış çağdaş bina cephesi", "sert zemin yürüyüş yolları", "dikilmiş ağaçlar ve çim alanlar", "temiz çevre"],
    mustNotShow: ["inşaat molozu", "yazı", "tabela", "kolaj"],
  },
  "peyzaj-ve-cevre-duzenleme": {
    id: "peyzaj-ve-cevre-duzenleme",
    mode: "site-process",
    focus: "Bina çevresinde sert zemin bordür taşları ile bitkisel toprak alanının uyumlu düzenlenmesi",
    mustShow: ["kilitli parke taşı / doğal taş yol", "beton bordür hattı", "toprak tesviyesi ve hazır rulo çim serimi"],
    mustNotShow: ["yazı", "kolaj", "ölçü"],
  },
  "sert-zemin": {
    id: "sert-zemin",
    mode: "site-process",
    focus: "Yaya yolunda kum yatağı üzerine beton kilit parke taşlarının tokmakla döşenmesi",
    mustShow: ["düzeltilmiş kum yatağı", "birbirine kilitlenen parke taşları", "kenar bordür dayaması"],
    mustNotShow: ["yazı", "ölçü", "kolaj"],
  },
  "bitkisel-peyzaj": {
    id: "bitkisel-peyzaj",
    mode: "site-process",
    focus: "Bahçe alanında fidan dikimi, kök boğazı toprağı, damlama sulama borusu ve malç serimi",
    mustShow: ["açılmış çukura dikilen fidan/ağaç", "organik malç/kabuk serimi", "damlama sulama boru hattı"],
    mustNotShow: ["yazı", "ölçü", "kolaj"],
  },
  "iskan-ruhsati": {
    id: "iskan-ruhsati",
    mode: "project-visual",
    focus: "Tüm imalatları bitmiş, oturuma ve kabule hazır tamamlanmış kusursuz bina girişi",
    mustShow: ["bitmiş bina giriş holü ve cephesi", "aydınlatılmış peyzaj", "kabul aşamasında kusursuz mimari"],
    mustNotShow: ["sahte belediye belgesi", "sahte resmi mühür", "okunur yazı/imza"],
  },
};

const MASTER_NEGATIVE_PROMPT =
  "okunur yazı, bozuk yazı, anlamsız harf dizisi, ters yazı, aynalı yazı, rakam, ölçü etiketi, logo, marka, filigran, tabela, sahte mühür, pseudo-text, UI, HUD, teknik açıklama kutusu, gereksiz ok, stok görsel damgası, ürün katalog kompozisyonu, kolaj, havada yüzen parça, rastgele geometrik dekor, konuyla ilgisiz el aleti, konuyla ilgisiz kablo veya boru, oyuncak görünümü, plastik doku, aşırı neon, bozuk perspektif, deforme geometri, eksik yapı elemanı, fiziksel olarak imkansız bağlantı, tekrar eden obje, bozuk el, fazla parmak, deforme insan, gereksiz kalabalık, aşırı lens efekti, aşırı alan derinliği, aşırı glow, aşırı doygunluk.";

function buildPrompt(node: IndexedBinaNode, brief: CanonicalBrief): string {
  return [
    `KONU: ${node.plainLabel}`,
    `İÇERİK ÖZETİ: ${node.summary}`,
    `GÖRSEL AMACI: Kullanıcı bu görsele baktığında ${brief.focus.toLowerCase()} durumunu net şekilde anlamalıdır.`,
    `MOD: ${brief.mode}`,
    `SAHNE: Gerçekçi şantiye veya mimari bağlam. 16:9 yatay kompozisyon.`,
    `MUTLAKA GÖRÜNSÜN: ${brief.mustShow.join(", ")}.`,
    `FİZİKSEL DOĞRULUK: Yapı elemanlarının ölçeği, birleşimleri ve montajı gerçek dünya inşaat kurallarına tam uygun olsun.`,
    `KESİNLİKLE OLMASIN: ${brief.mustNotShow.join(", ")}, hiçbir yazı, harf, rakam, logo, filigran, pseudo-text, havada yüzen obje veya ürün kataloğu kolajı.`,
    `FOTOĞRAFİK KALİTE: Yüksek kaliteli profesyonel mimari/inşaat görselleştirmesi, doğal ışık, gerçekçi dokular, doğru perspektif.`,
  ].join("\n");
}

function run() {
  const allNodes = getAllIndexedBinaNodes();
  const canonicalNodes = allNodes.filter((n) => n.id !== "root");

  console.log(`Canonical düğüm sayısı: ${canonicalNodes.length}`);

  const inventory: any[] = [];

  for (const node of canonicalNodes) {
    const brief = CANONICAL_BRIEFS[node.id];
    if (!brief) {
      console.warn(`Brief bulunamadı: ${node.id}`);
      continue;
    }

    const promptTr = buildPrompt(node, brief);
    const altTr = `${node.plainLabel} — ${brief.focus}`;

    inventory.push({
      id: node.id,
      slugPath: node.slugPath,
      label: node.plainLabel,
      summary: node.summary,
      phaseId: node.branchId,
      depth: node.depth,
      parentSlugPath: node.parentSlugPath,
      childIds: node.childIds,
      existingSvgCard: `/bina-asamalari/topics/${node.id}.svg`,
      targetWebpCard: `/bina-asamalari/topics/${node.id}.webp`,
      visualPurpose: `Kullanıcı bu görsele baktığında ${brief.focus.toLowerCase()} durumunu net olarak anlamalı.`,
      mode: brief.mode,
      mustShow: brief.mustShow,
      mustNotShow: brief.mustNotShow,
      promptTr,
      negativePromptTr: MASTER_NEGATIVE_PROMPT,
      altTr,
      status: "planned",
    });
  }

  const outPath = path.resolve(process.cwd(), "bina-gorsel-envanteri.json");
  fs.writeFileSync(outPath, JSON.stringify(inventory, null, 2), "utf-8");
  console.log(`Envanter başarıyla yazıldı: ${outPath} (${inventory.length} canonical kayıt)`);
}

run();
