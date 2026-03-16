export interface BinaMindMapNode {
  id: string;
  label: string;
  url: string;
  summary: string;
  children?: readonly BinaMindMapNode[];
}

export interface IndexedBinaNode {
  id: string;
  label: string;
  plainLabel: string;
  url: string;
  slugPath: string;
  summary: string;
  depth: number;
  branchId: string;
  parentSlugPath?: string;
  childSlugPaths: string[];
  childIds: string[];
}

export const BINA_ASAMALARI_ROOT_URL = "/kategori/bina-asamalari" as const;

export const BINA_BRANCH_COLORS = {
  "proje-hazirlik": "#6366f1",
  "kazi-temel": "#f59e0b",
  "kaba-insaat": "#ef4444",
  "ince-isler": "#10b981",
  "tesisat-isleri": "#3b82f6",
  "peyzaj-teslim": "#84cc16",
} as const;

const RAW_BINA_MINDMAP_DATA: BinaMindMapNode = {
  id: "root",
  label: "Bina Aşamaları",
  url: BINA_ASAMALARI_ROOT_URL,
  summary:
    "Bir yapının proje kararından iskan ve çevre düzenine kadar ilerleyen tüm uygulama paketleri için kapsamlı rehber ağacı.",
  children: [
    {
      id: "proje-hazirlik",
      label: "Proje & İzinler",
      url: `${BINA_ASAMALARI_ROOT_URL}/proje-hazirlik`,
      summary:
        "Tasarım kararları, disiplinler arası koordinasyon, ruhsat süreçleri ve uygulama setinin sahaya doğru aktarımı.",
      children: [
        {
          id: "mimari-proje",
          label: "Mimari Proje",
          url: `${BINA_ASAMALARI_ROOT_URL}/mimari-proje`,
          summary:
            "Plan, kesit, görünüş, mahal listesi ve detay paftaları üzerinden mekan kurgu kararlarının netleştirildiği proje seti.",
        },
        {
          id: "statik-proje",
          label: "Statik Proje",
          url: `${BINA_ASAMALARI_ROOT_URL}/statik-proje`,
          summary:
            "Taşıyıcı sistem şeması, betonarme kesitler, yük aktarımı ve uygulama donatılarının tariflendiği hesap ve çizim paketi.",
        },
        {
          id: "tesisat-projesi",
          label: "Tesisat Projesi",
          url: `${BINA_ASAMALARI_ROOT_URL}/tesisat-projesi`,
          summary:
            "Mekanik sistemlerin, tesisat şaftlarının ve cihaz yerleşimlerinin mimari ile çakışmadan kurgulandığı uygulama paketi.",
        },
        {
          id: "elektrik-projesi",
          label: "Elektrik Projesi",
          url: `${BINA_ASAMALARI_ROOT_URL}/elektrik-projesi`,
          summary:
            "Güç, zayıf akım, aydınlatma ve pano organizasyonunun uygulama, yükleme ve koruma kararlarıyla hazırlandığı set.",
        },
        {
          id: "yapi-ruhsati",
          label: "Yapı Ruhsatı",
          url: `${BINA_ASAMALARI_ROOT_URL}/yapi-ruhsati`,
          summary:
            "Projelerin belediye ve idare kontrollerinden geçirilerek sahadaki resmi imalat başlangıcına dönüştüğü süreç.",
        },
      ],
    },
    {
      id: "kazi-temel",
      label: "Kazı & Temel",
      url: `${BINA_ASAMALARI_ROOT_URL}/kazi-temel`,
      summary:
        "Zemin verisinin okunması, hafriyat, iksa ve temel sistemi kararlarının güvenli ve kontrollü biçimde uygulanması.",
      children: [
        {
          id: "zemin-etudu",
          label: "Zemin Etüdü",
          url: `${BINA_ASAMALARI_ROOT_URL}/zemin-etudu`,
          summary:
            "Sondaj, laboratuvar ve raporlama verileriyle temel sistemi ve saha emniyeti kararlarını belirleyen geoteknik çalışma.",
        },
        {
          id: "hafriyat",
          label: "Hafriyat",
          url: `${BINA_ASAMALARI_ROOT_URL}/hafriyat`,
          summary:
            "Kot alma, kazı şevleri, geçici drenaj ve malzeme nakliyesi ile temel platformunun hazırlanması.",
        },
        {
          id: "iksa-sistemi",
          label: "İksa Sistemi",
          url: `${BINA_ASAMALARI_ROOT_URL}/iksa-sistemi`,
          summary:
            "Komşu yapı ve yol güvenliğini koruyarak derin kazıların kontrollü yapılmasını sağlayan geçici destekleme çözümleri.",
          children: [
            {
              id: "fore-kazik",
              label: "Fore Kazık",
              url: `${BINA_ASAMALARI_ROOT_URL}/fore-kazik`,
              summary:
                "Delgi, donatı ve betonlama adımlarıyla çalışan, rijitliği yüksek düşey kazı destek elemanı.",
            },
            {
              id: "ankrajli-iksa",
              label: "Ankrajlı İksa",
              url: `${BINA_ASAMALARI_ROOT_URL}/ankrajli-iksa`,
              summary:
                "Kazı perdesini geriye bağlayarak deplasmanları sınırlayan, çok kademeli uygulamaya uygun ankrajlı sistem.",
            },
            {
              id: "palplans",
              label: "Palplanş",
              url: `${BINA_ASAMALARI_ROOT_URL}/palplans`,
              summary:
                "Özellikle yeraltı suyu ve gevşek zeminlerde hızlı çevreleme sağlayan çelik perde iksa çözümü.",
            },
          ],
        },
        {
          id: "temel-turleri",
          label: "Temel Türleri",
          url: `${BINA_ASAMALARI_ROOT_URL}/temel-turleri`,
          summary:
            "Yapı yükü, zemin taşıma gücü ve oturma kriterlerine göre seçilen temel sistemleri ve uygulama bileşenleri.",
          children: [
            {
              id: "radye-temel",
              label: "Radye Temel",
              url: `${BINA_ASAMALARI_ROOT_URL}/radye-temel`,
              summary:
                "Tüm yapı oturumunu tek plak altında toplayarak yükleri geniş alana yayan bütüncül temel sistemi.",
            },
            {
              id: "grobeton",
              label: "Grobeton",
              url: `${BINA_ASAMALARI_ROOT_URL}/grobeton`,
              summary:
                "Asıl taşıyıcı betondan önce düzgün platform, temizlik ve kot sürekliliği sağlayan zayıf dayanımlı alt tabaka.",
            },
            {
              id: "temel-donati",
              label: "Temel Donatısı",
              url: `${BINA_ASAMALARI_ROOT_URL}/temel-donati`,
              summary:
                "Temel elemanlarında çatlak kontrolü, kesme ve moment dayanımı için kullanılan donatı yerleşim sistemi.",
            },
            {
              id: "temel-betonlama",
              label: "Temel Betonlama",
              url: `${BINA_ASAMALARI_ROOT_URL}/temel-betonlama`,
              summary:
                "Yerinde döküm, vibrasyon, derz kontrolü ve kür yönetimi ile temel betonunun güvenli şekilde tamamlanması.",
            },
            {
              id: "temel-su-yalitimi",
              label: "Temel Su Yalıtımı",
              url: `${BINA_ASAMALARI_ROOT_URL}/temel-su-yalitimi`,
              summary:
                "Temel ve perde yüzeylerinde basınçlı suya, nem geçişine ve kimyasal etkilere karşı oluşturulan koruma katmanı.",
            },
          ],
        },
      ],
    },
    {
      id: "kaba-insaat",
      label: "Kaba İnşaat",
      url: `${BINA_ASAMALARI_ROOT_URL}/kaba-insaat`,
      summary:
        "Taşıyıcı sistemin şekillendiği kalıp, donatı, beton ve duvar imalatlarının birbirine senkron yürütüldüğü ana saha fazı.",
      children: [
        {
          id: "kalip-isleri",
          label: "Kalıp İşleri",
          url: `${BINA_ASAMALARI_ROOT_URL}/kalip-isleri`,
          summary:
            "Betonarme elemanların boyut, aks ve yüzey kalitesini belirleyen geçici taşıyıcı sistemler ve söküm planı.",
          children: [
            {
              id: "kolon-kalibi",
              label: "Kolon Kalıbı",
              url: `${BINA_ASAMALARI_ROOT_URL}/kolon-kalibi`,
              summary:
                "Kolon kesitinin şaşıksız, planda doğru ve düşey eksende kontrollü çıkmasını sağlayan kalıp çözümü.",
            },
            {
              id: "kiris-kalibi",
              label: "Kiriş Kalıbı",
              url: `${BINA_ASAMALARI_ROOT_URL}/kiris-kalibi`,
              summary:
                "Kiriş açıklığı, sehim ve alt kot sürekliliği için iskele sistemiyle birlikte çalışan taşıyıcı kalıp düzeni.",
            },
            {
              id: "doseme-kalibi",
              label: "Döşeme Kalıbı",
              url: `${BINA_ASAMALARI_ROOT_URL}/doseme-kalibi`,
              summary:
                "Geniş alanlı beton dökümlerinde kot, sehim ve çalışma platformu gereksinimini birlikte yöneten sistem.",
            },
            {
              id: "kalip-sokumu",
              label: "Kalıp Sökümü",
              url: `${BINA_ASAMALARI_ROOT_URL}/kalip-sokumu`,
              summary:
                "Beton dayanımı, sıcaklık ve açıklık koşullarına göre kalıbın güvenli sıra ile geri alınması.",
            },
          ],
        },
        {
          id: "donati-isleri",
          label: "Donatı İşleri",
          url: `${BINA_ASAMALARI_ROOT_URL}/donati-isleri`,
          summary:
            "Betonarmenin taşıma ve süneklik performansını doğrudan etkileyen kesme, moment ve detay donatı uygulamaları.",
          children: [
            {
              id: "kolon-donati",
              label: "Kolon Donatısı",
              url: `${BINA_ASAMALARI_ROOT_URL}/kolon-donati`,
              summary:
                "Düşey taşıyıcı elemanlarda etriye sıklaştırması, bindirme boyu ve pas payı kontrolünün en kritik olduğu imalat.",
            },
            {
              id: "kiris-donati",
              label: "Kiriş Donatısı",
              url: `${BINA_ASAMALARI_ROOT_URL}/kiris-donati`,
              summary:
                "Negatif ve pozitif moment bölgeleri ile kesme donatısının sahada düzenli yerleştirildiği kiriş uygulaması.",
            },
            {
              id: "doseme-donati",
              label: "Döşeme Donatısı",
              url: `${BINA_ASAMALARI_ROOT_URL}/doseme-donati`,
              summary:
                "Dağıtma ve asal donatıların örtü betonu, bindirme ve sehim performansına göre serildiği döşeme imalatı.",
            },
            {
              id: "pas-payi",
              label: "Pas Payı",
              url: `${BINA_ASAMALARI_ROOT_URL}/pas-payi`,
              summary:
                "Donatının yangın, korozyon ve aderans performansı için beton örtü kalınlığının doğru tutulması.",
            },
          ],
        },
        {
          id: "beton-isleri",
          label: "Beton İşleri",
          url: `${BINA_ASAMALARI_ROOT_URL}/beton-isleri`,
          summary:
            "Taze betonun sahaya kabulünden döküm, vibrasyon ve kür süreçlerine kadar tüm kalite zinciri.",
          children: [
            {
              id: "beton-sinifi",
              label: "Beton Sınıfı",
              url: `${BINA_ASAMALARI_ROOT_URL}/beton-sinifi`,
              summary:
                "Dayanım, çevresel etki sınıfı ve tasarım ihtiyaçlarına göre seçilen hazır beton performans düzeyi.",
            },
            {
              id: "beton-dokumu",
              label: "Beton Dökümü",
              url: `${BINA_ASAMALARI_ROOT_URL}/beton-dokumu`,
              summary:
                "Pompa organizasyonu, yerleştirme yüksekliği ve döküm sırası ile yürütülen saha uygulaması.",
            },
            {
              id: "vibrasyon",
              label: "Vibrasyon",
              url: `${BINA_ASAMALARI_ROOT_URL}/vibrasyon`,
              summary:
                "Boşluksuz ve homojen beton elde etmek için iğne vibratör ile yapılan sıkıştırma işlemi.",
            },
            {
              id: "kur-islemi",
              label: "Kür İşlemi",
              url: `${BINA_ASAMALARI_ROOT_URL}/kur-islemi`,
              summary:
                "Betonun hidratasyonunu sürdürebilmesi için nem ve sıcaklık koşullarının kontrollü yönetimi.",
            },
            {
              id: "beton-testi",
              label: "Beton Testleri",
              url: `${BINA_ASAMALARI_ROOT_URL}/beton-testi`,
              summary:
                "Çökme deneyi, küp/silindir numuneleri ve kabul kriterleriyle beton kalitesinin doğrulanması.",
            },
          ],
        },
        {
          id: "duvar-orme",
          label: "Duvar Örme",
          url: `${BINA_ASAMALARI_ROOT_URL}/duvar-orme`,
          summary:
            "Taşıyıcı olmayan dolgu duvarların şakül, derz ve tesisat koordinasyonu gözetilerek imal edilmesi.",
          children: [
            {
              id: "tugla-duvar",
              label: "Tuğla Duvar",
              url: `${BINA_ASAMALARI_ROOT_URL}/tugla-duvar`,
              summary:
                "Geleneksel dolgu duvar imalatında tuğla birimi, yatay derz ve ankraj detaylarının yönetimi.",
            },
            {
              id: "ytong-gazbeton",
              label: "Ytong / Gazbeton",
              url: `${BINA_ASAMALARI_ROOT_URL}/ytong-gazbeton`,
              summary:
                "Hafif bloklar ile hızlı imalat, iyi ısı performansı ve kontrollü yapıştırıcı uygulaması sunan çözüm.",
            },
            {
              id: "briket",
              label: "Briket / Bims",
              url: `${BINA_ASAMALARI_ROOT_URL}/briket`,
              summary:
                "Görece ekonomik duvar imalatlarında kullanılan, yerel malzeme bulunabilirliğine bağlı blok sistemi.",
            },
          ],
        },
        {
          id: "cati-iskeleti",
          label: "Çatı İskeleti",
          url: `${BINA_ASAMALARI_ROOT_URL}/cati-iskeleti`,
          summary:
            "Çatı eğimi, taşıyıcı karkas ve su tahliye geometrisinin kurulup kaplama öncesi hazırlandığı üst yapı fazı.",
          children: [
            {
              id: "ahsap-cati",
              label: "Ahşap Çatı",
              url: `${BINA_ASAMALARI_ROOT_URL}/ahsap-cati`,
              summary:
                "Kuru ahşap kesitler, bağlantı levhaları ve koruyucu emprenye ile kurulan hafif çatı taşıyıcı sistemi.",
            },
            {
              id: "celik-cati",
              label: "Çelik Çatı",
              url: `${BINA_ASAMALARI_ROOT_URL}/celik-cati`,
              summary:
                "Açıklık geçme kapasitesi yüksek, hızlı montaj avantajlı çelik makas ve aşık düzeni.",
            },
            {
              id: "teras-cati",
              label: "Teras Çatı",
              url: `${BINA_ASAMALARI_ROOT_URL}/teras-cati`,
              summary:
                "Düşük eğimli veya düz çatılarda yalıtım, eğim betonu ve kaplama katmanlarının birlikte kurgulandığı sistem.",
            },
          ],
        },
      ],
    },
    {
      id: "ince-isler",
      label: "İnce İşler",
      url: `${BINA_ASAMALARI_ROOT_URL}/ince-isler`,
      summary:
        "Kullanım kalitesini, görünürlüğü ve bakım performansını belirleyen kaplama, doğrama ve bitirme imalatları.",
      children: [
        {
          id: "siva",
          label: "Sıva",
          url: `${BINA_ASAMALARI_ROOT_URL}/siva`,
          summary:
            "Yüzey düzeltme, aderans, nem dengesi ve nihai kaplama hazırlığı için yapılan temel yüzey işlemi.",
          children: [
            {
              id: "ic-siva",
              label: "İç Sıva",
              url: `${BINA_ASAMALARI_ROOT_URL}/ic-siva`,
              summary:
                "İç mekan duvar ve tavanlarda düzgün yüzey, köşe doğruluğu ve boya altı hazırlık sağlayan sıva uygulaması.",
            },
            {
              id: "dis-siva",
              label: "Dış Sıva",
              url: `${BINA_ASAMALARI_ROOT_URL}/dis-siva`,
              summary:
                "Cephede suya, ısı farklılıklarına ve rötre çatlaklarına karşı kontrollü katman kurgusu gerektiren sıva sistemi.",
            },
            {
              id: "alci-siva",
              label: "Alçı Sıva",
              url: `${BINA_ASAMALARI_ROOT_URL}/alci-siva`,
              summary:
                "İç mekanlarda ince yüzey kalitesi sağlayan, hızlı priz alan ve boya altı performansı yüksek uygulama.",
            },
          ],
        },
        {
          id: "alcipan",
          label: "Alçıpan &\nAsma Tavan",
          url: `${BINA_ASAMALARI_ROOT_URL}/alcipan`,
          summary:
            "Kuru yapı sistemleri ile bölme duvar ve tavan çözümlerinin hızlı, hafif ve servis geçişine uygun uygulanması.",
          children: [
            {
              id: "bolme-duvar",
              label: "Bölme Duvar",
              url: `${BINA_ASAMALARI_ROOT_URL}/bolme-duvar`,
              summary:
                "Metal karkas ve levha kombinasyonuyla mekansal bölünmeyi hızlı şekilde sağlayan hafif duvar çözümü.",
            },
            {
              id: "asma-tavan",
              label: "Asma Tavan",
              url: `${BINA_ASAMALARI_ROOT_URL}/asma-tavan`,
              summary:
                "Tesisat gizleme, akustik iyileştirme ve aydınlatma koordinasyonu için kullanılan tavan sistemi.",
            },
          ],
        },
        {
          id: "zemin-kaplamalari",
          label: "Zemin\nKaplamaları",
          url: `${BINA_ASAMALARI_ROOT_URL}/zemin-kaplamalari`,
          summary:
            "Mekan kullanım senaryosuna, aşınma sınıfına ve bakım beklentisine göre seçilen nihai döşeme kaplamaları.",
          children: [
            {
              id: "seramik-kaplama",
              label: "Seramik",
              url: `${BINA_ASAMALARI_ROOT_URL}/seramik-kaplama`,
              summary:
                "Islak hacim ve yoğun kullanımlı alanlarda dayanım ve hijyen avantajı sunan karolu kaplama sistemi.",
            },
            {
              id: "parke-kaplama",
              label: "Parke",
              url: `${BINA_ASAMALARI_ROOT_URL}/parke-kaplama`,
              summary:
                "İç mekan konforunu yükselten, altlık ve derz detayına duyarlı sıcak yüzey kaplaması.",
            },
            {
              id: "mermer-kaplama",
              label: "Mermer / Granit",
              url: `${BINA_ASAMALARI_ROOT_URL}/mermer-kaplama`,
              summary:
                "Doğal taşın görsel etkisini taşırken taşıyıcılık, yüzey işleme ve derz toleranslarını dikkatle yöneten imalat.",
            },
            {
              id: "epoksi-kaplama",
              label: "Epoksi",
              url: `${BINA_ASAMALARI_ROOT_URL}/epoksi-kaplama`,
              summary:
                "Endüstriyel ve yüksek hijyenli alanlarda derzsiz, kimyasala dayanıklı zemin çözümü.",
            },
          ],
        },
        {
          id: "duvar-kaplamalari",
          label: "Duvar\nKaplamaları",
          url: `${BINA_ASAMALARI_ROOT_URL}/duvar-kaplamalari`,
          summary:
            "Mekanların temizlenebilirlik, görsellik ve dayanıklılık hedeflerine göre uygulanan son kat duvar çözümleri.",
          children: [
            {
              id: "fayans",
              label: "Fayans",
              url: `${BINA_ASAMALARI_ROOT_URL}/fayans`,
              summary:
                "Islak hacim duvarlarında suya dayanım ve temizlenebilirlik sağlayan seramik kaplama uygulaması.",
            },
            {
              id: "boya",
              label: "Boya",
              url: `${BINA_ASAMALARI_ROOT_URL}/boya`,
              summary:
                "Astar, macun ve son kat dengesine bağlı olarak mekansal algıyı ve yüzey korumasını belirleyen işlem.",
            },
            {
              id: "duvar-kagidi",
              label: "Duvar Kağıdı",
              url: `${BINA_ASAMALARI_ROOT_URL}/duvar-kagidi`,
              summary:
                "İç mekan dekorasyonunda alt yüzey düzgünlüğüne ve detay çözümüne çok duyarlı kaplama sistemi.",
            },
          ],
        },
        {
          id: "kapi-pencere",
          label: "Kapı &\nPencere",
          url: `${BINA_ASAMALARI_ROOT_URL}/kapi-pencere`,
          summary:
            "Doğramaların ısı, hava, su ve güvenlik performansını belirleyen montaj ve boşluk çözüm paketleri.",
          children: [
            {
              id: "dis-kapi",
              label: "Dış Kapı",
              url: `${BINA_ASAMALARI_ROOT_URL}/dis-kapi`,
              summary:
                "Giriş güvenliği, ısı kontrolü ve dış etkilere dayanım için seçilen ana doğrama bileşeni.",
            },
            {
              id: "ic-kapi",
              label: "İç Kapı",
              url: `${BINA_ASAMALARI_ROOT_URL}/ic-kapi`,
              summary:
                "Kullanım yoğunluğu, ses kontrolü ve mimari dil doğrultusunda seçilen iç mekan kapı sistemi.",
            },
            {
              id: "pencere",
              label: "Pencere",
              url: `${BINA_ASAMALARI_ROOT_URL}/pencere`,
              summary:
                "Gün ışığı, havalandırma ve ısı geçirgenliği performansını birlikte etkileyen cephe doğraması.",
            },
          ],
        },
        {
          id: "cati-kaplamasi",
          label: "Çatı\nKaplaması",
          url: `${BINA_ASAMALARI_ROOT_URL}/cati-kaplamasi`,
          summary:
            "Çatı taşıyıcısı üzerinde su geçirimsizlik, rüzgar güvenliği ve bakım sürekliliği sağlayan kaplama katmanları.",
          children: [
            {
              id: "kiremit",
              label: "Kiremit",
              url: `${BINA_ASAMALARI_ROOT_URL}/kiremit`,
              summary:
                "Eğimli çatılarda su tahliyesi ve geleneksel görünüm sağlayan kaplama sistemi.",
            },
            {
              id: "membran-cati",
              label: "Membran",
              url: `${BINA_ASAMALARI_ROOT_URL}/membran-cati`,
              summary:
                "Teras ve düşük eğimli çatılarda su geçirimsizliği ana performans kriteri olan sentetik/bitümlü kaplama.",
            },
            {
              id: "metal-cati",
              label: "Metal Çatı",
              url: `${BINA_ASAMALARI_ROOT_URL}/metal-cati`,
              summary:
                "Büyük açıklık ve hızlı montaj gerektiren yapılarda panel veya kenet sistem olarak uygulanan hafif kaplama.",
            },
          ],
        },
      ],
    },
    {
      id: "tesisat-isleri",
      label: "Tesisat İşleri",
      url: `${BINA_ASAMALARI_ROOT_URL}/tesisat-isleri`,
      summary:
        "Mekanik, elektrik ve yangın sistemlerinin yapıyla çakışmadan, testlenebilir ve işletilebilir biçimde kurulması.",
      children: [
        {
          id: "sihhi-tesisat",
          label: "Sıhhi Tesisat",
          url: `${BINA_ASAMALARI_ROOT_URL}/sihhi-tesisat`,
          summary:
            "Temiz su, pis su ve armatür bağlantılarının eğim, basınç ve bakım erişimi gözetilerek kurulması.",
          children: [
            {
              id: "temiz-su",
              label: "Temiz Su",
              url: `${BINA_ASAMALARI_ROOT_URL}/temiz-su`,
              summary:
                "Şebeke veya depo kaynağından kullanıcı noktasına kadar hijyenik ve yeterli basınçla su dağıtımı.",
            },
            {
              id: "pis-su",
              label: "Pis Su",
              url: `${BINA_ASAMALARI_ROOT_URL}/pis-su`,
              summary:
                "Atık suların koku ve geri basma oluşturmadan, doğru eğim ve havalık düzeni ile uzaklaştırılması.",
            },
          ],
        },
        {
          id: "elektrik-tesisati",
          label: "Elektrik Tesisatı",
          url: `${BINA_ASAMALARI_ROOT_URL}/elektrik-tesisati`,
          summary:
            "Enerji dağıtımı, kablo güzergahları ve pano seçiminin güvenlik ve sürdürülebilir bakım açısından kurgulanması.",
          children: [
            {
              id: "kablolama",
              label: "Kablolama",
              url: `${BINA_ASAMALARI_ROOT_URL}/kablolama`,
              summary:
                "Kablo kesiti, tavalar, borulama ve çekim kurallarıyla elektrik dağıtımının fiziksel kurulumu.",
            },
            {
              id: "pano-montaj",
              label: "Pano Montajı",
              url: `${BINA_ASAMALARI_ROOT_URL}/pano-montaj`,
              summary:
                "Koruma, kumanda ve ölçüm elemanlarının güvenli ve etiketlenmiş düzenle yerleştirildiği ana dağıtım noktası.",
            },
          ],
        },
        {
          id: "isitma-sogutma",
          label: "Isıtma & Soğutma",
          url: `${BINA_ASAMALARI_ROOT_URL}/isitma-sogutma`,
          summary:
            "Mekanik konforu sağlayan borulama, cihaz ve dağıtım elemanlarının verimli ve bakım erişimli kurulması.",
          children: [
            {
              id: "yerden-isitma",
              label: "Yerden Isıtma",
              url: `${BINA_ASAMALARI_ROOT_URL}/yerden-isitma`,
              summary:
                "Düşük sıcaklıkta çalışan, eşit ısı dağılımı sağlayan boru serpantin esaslı konfor ısıtma sistemi.",
            },
            {
              id: "klima-tesisat",
              label: "Klima Tesisatı",
              url: `${BINA_ASAMALARI_ROOT_URL}/klima-tesisat`,
              summary:
                "Bakır boru, drenaj ve hava dağıtım koordinasyonu ile çalışan bireysel veya merkezi soğutma kurulumu.",
            },
          ],
        },
        {
          id: "yangin-tesisati",
          label: "Yangın Tesisatı",
          url: `${BINA_ASAMALARI_ROOT_URL}/yangin-tesisati`,
          summary:
            "Yangın anında söndürme ve güvenli tahliye altyapısını destekleyen borulama, ekipman ve kontrol düzeni.",
        },
      ],
    },
    {
      id: "peyzaj-teslim",
      label: "Peyzaj & Teslim",
      url: `${BINA_ASAMALARI_ROOT_URL}/peyzaj-teslim`,
      summary:
        "Çevre düzenleme, son kontroller, işletmeye alma ve iskan kapanışına uzanan proje tamamlama fazı.",
      children: [
        {
          id: "peyzaj-ve-cevre-duzenleme",
          label: "Peyzaj & Çevre Düzenleme",
          url: `${BINA_ASAMALARI_ROOT_URL}/peyzaj-ve-cevre-duzenleme`,
          summary:
            "Sert ve yumuşak peyzaj kararlarının drenaj, erişim ve uzun dönem bakım hedefleriyle uygulanması.",
          children: [
            {
              id: "sert-zemin",
              label: "Sert Zemin",
              url: `${BINA_ASAMALARI_ROOT_URL}/sert-zemin`,
              summary:
                "Yaya ve araç sirkülasyonunu taşıyan kaplama, bordür ve altyapı hazırlığı imalatları.",
            },
            {
              id: "bitkisel-peyzaj",
              label: "Bitkisel Peyzaj",
              url: `${BINA_ASAMALARI_ROOT_URL}/bitkisel-peyzaj`,
              summary:
                "Toprak hazırlığı, sulama, bitki seçimi ve mevsimsel bakım kurgusuyla yaşayan peyzaj uygulaması.",
            },
          ],
        },
        {
          id: "iskan-ruhsati",
          label: "İskan Ruhsatı",
          url: `${BINA_ASAMALARI_ROOT_URL}/iskan-ruhsati`,
          summary:
            "Projenin mevzuata uygun tamamlanıp kullanıma açılabilmesi için yapılan son resmi ve teknik kontrol süreci.",
        },
      ],
    },
  ],
} as const;

function withResolvedUrls(
  node: BinaMindMapNode,
  parentSegments: readonly string[] = [],
): BinaMindMapNode {
  const nextSegments = node.id === "root" ? [] : [...parentSegments, node.id];

  return {
    ...node,
    url: nextSegments.length > 0 ? `${BINA_ASAMALARI_ROOT_URL}/${nextSegments.join("/")}` : BINA_ASAMALARI_ROOT_URL,
    children: node.children?.map((child) => withResolvedUrls(child, nextSegments)),
  };
}

export const BINA_MINDMAP_DATA: BinaMindMapNode = withResolvedUrls(RAW_BINA_MINDMAP_DATA);

function normalizeLabel(label: string): string {
  return label.replace(/\n/g, " ");
}

export function slugPathFromUrl(url: string): string {
  return url.replace(`${BINA_ASAMALARI_ROOT_URL}/`, "").replace(BINA_ASAMALARI_ROOT_URL, "");
}

export function flattenBinaMindMapUrls(node: BinaMindMapNode = BINA_MINDMAP_DATA): string[] {
  const urls = [node.url];

  for (const child of node.children ?? []) {
    urls.push(...flattenBinaMindMapUrls(child));
  }

  return urls;
}

export function formatBinaAsamalariSlugTitle(slug: readonly string[]): string {
  return slug
    .join(" ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1))
    .join(" ");
}

function buildIndex() {
  const bySlugPath = new Map<string, IndexedBinaNode>();
  const byId = new Map<string, IndexedBinaNode>();
  const allNodes: IndexedBinaNode[] = [];

  const visit = (
    node: BinaMindMapNode,
    depth: number,
    branchId: string,
    parentSlugPath?: string,
  ) => {
    const slugPath = slugPathFromUrl(node.url);
    const nextBranchId = depth === 1 ? node.id : branchId;
    const indexedNode: IndexedBinaNode = {
      id: node.id,
      label: node.label,
      plainLabel: normalizeLabel(node.label),
      url: node.url,
      slugPath,
      summary: node.summary,
      depth,
      branchId: nextBranchId,
      parentSlugPath,
      childSlugPaths: (node.children ?? []).map((child) => slugPathFromUrl(child.url)),
      childIds: (node.children ?? []).map((child) => child.id),
    };

    allNodes.push(indexedNode);
    bySlugPath.set(slugPath, indexedNode);
    byId.set(node.id, indexedNode);

    for (const child of node.children ?? []) {
      visit(child, depth + 1, nextBranchId, slugPath || undefined);
    }
  };

  visit(BINA_MINDMAP_DATA, 0, "root");

  return { allNodes, bySlugPath, byId };
}

const BINA_INDEX = buildIndex();

export function getAllIndexedBinaNodes(): IndexedBinaNode[] {
  return BINA_INDEX.allNodes;
}

export function getIndexedBinaNodeBySlugPath(slugPath: string): IndexedBinaNode | undefined {
  return BINA_INDEX.bySlugPath.get(slugPath);
}

export function getIndexedBinaNodeBySlugParts(slugParts: readonly string[]): IndexedBinaNode | undefined {
  return getIndexedBinaNodeBySlugPath(slugParts.join("/"));
}

export function getIndexedBinaNodeById(id: string): IndexedBinaNode | undefined {
  return BINA_INDEX.byId.get(id);
}

export function getBinaAncestors(slugPath: string): IndexedBinaNode[] {
  const ancestors: IndexedBinaNode[] = [];
  let current = getIndexedBinaNodeBySlugPath(slugPath);

  while (current?.parentSlugPath) {
    const parent = getIndexedBinaNodeBySlugPath(current.parentSlugPath);
    if (!parent) {
      break;
    }

    ancestors.unshift(parent);
    current = parent;
  }

  return ancestors;
}

export function getBinaChildren(slugPath: string): IndexedBinaNode[] {
  const node = getIndexedBinaNodeBySlugPath(slugPath);

  if (!node) {
    return [];
  }

  return node.childSlugPaths
    .map((childSlugPath) => getIndexedBinaNodeBySlugPath(childSlugPath))
    .filter((child): child is IndexedBinaNode => Boolean(child));
}

export function getSiblingBinaNodes(slugPath: string): IndexedBinaNode[] {
  const node = getIndexedBinaNodeBySlugPath(slugPath);

  if (!node?.parentSlugPath) {
    return [];
  }

  return getBinaChildren(node.parentSlugPath).filter((sibling) => sibling.slugPath !== slugPath);
}

export function getBinaBranchColor(branchId: string): string {
  if (branchId in BINA_BRANCH_COLORS) {
    return BINA_BRANCH_COLORS[branchId as keyof typeof BINA_BRANCH_COLORS];
  }

  return "#94a3b8";
}
