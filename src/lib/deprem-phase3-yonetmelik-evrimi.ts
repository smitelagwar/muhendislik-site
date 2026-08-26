import { phase3Lines, tbdyPhase3References, PHASE3_UPDATED_AT, type DepremPhase3Override } from "./deprem-phase3-shared";

const AFAD_BROCHURE = "https://www.afad.gov.tr/kurumlar/afad.gov.tr/39505/xfiles/yonetmelik_brosur.pdf";
const DBYBHY_2006 = "https://resmigazete.gov.tr/eskiler/2006/03/20060306-3.htm";

export const DEPREM_PHASE3_YONETMELIK_EVRIMI: DepremPhase3Override = {
  slug: "turkiyede-tarihsel-depremler-ve-yonetmelik-evrimi",
  description: "Türkiye'deki bina deprem yönetmeliklerinin 1947'den TBDY 2018'e resmî kronolojisini; yayın, yürürlük ve proje tarihi ayrımını mühendislik açısından açıklar.",
  seoTitle: "Türkiye Deprem Yönetmeliklerinin Evrimi | 1947–TBDY 2018",
  seoDescription: "1947, 1953, 1961, 1968, 1975, 1998, 2007 ve TBDY 2018 kronolojisi; yayın-yürürlük farkı ve mevcut bina değerlendirmesinde doğru yönetmelik okuması.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "12 dk",
  sections: [
    {
      id: "yapim-yili-yonetmelik-degildir",
      title: "Bina yapım yılı, tek başına uygulanan deprem yönetmeliğini kanıtlamaz",
      content: phase3Lines(
        "Bir binaya '1975 yönetmeliği binası', '1998 sonrası bina' veya '2007 yönetmeliğine göre yapılmış' demek pratik bir sınıflandırmadır; ancak teknik dosyada bağlayıcı olan, projenin ruhsat/onay tarihi ile o tarihte yürürlükte bulunan mevzuat ve geçiş hükümleridir.",
        "",
        "Yönetmeliğin **yayın tarihi**, **yürürlük tarihi**, proje onay tarihi ve yapının fiilî tamamlanma tarihi aynı kavram değildir. Özellikle 2007 olarak anılan Deprem Bölgelerinde Yapılacak Binalar Hakkında Yönetmelik, 6 Mart 2006'da yayımlanmış ve Madde 5 gereği yayımından bir yıl sonra yürürlüğe girmiştir.",
        "",
        "> [!warning] Yaştan güvenlik sonucu üretmeyin",
        "> Eski yönetmelik döneminde yapılmış bir bina otomatik olarak güvensiz, yeni yönetmelik döneminde yapılmış bir bina da otomatik olarak güvenli sayılamaz. Gerçek güvenlik; proje, malzeme, uygulama, değişiklikler, zemin ve mevcut durum verileriyle mühendislik değerlendirmesi sonucunda belirlenir."
      ),
      subsections: [],
    },
    {
      id: "resmi-kronoloji",
      title: "AFAD'ın resmî kronolojisi: 1947'den 2018'e sekiz ana aşama",
      content: phase3Lines(
        "AFAD'ın Türkiye Bina Deprem Yönetmeliği broşürü, bina deprem yönetmelikleri zaman çizelgesini aşağıdaki şekilde verir:",
        "",
        "| Yıl | Resmî ad | Mühendislik açısından okuma |",
        "|---:|---|---|",
        "| 1947 | Türkiye Yer Sarsıntısı Bölgeleri Yapı Yönetmeliği | İlk bina deprem yönetmeliği dönemi |",
        "| 1953 | Yersarsıntısı Bölgelerinde Yapılacak Yapılar Hakkında Yönetmelik | Kuralların revizyonu |",
        "| 1961 | Afet Bölgelerinde Yapılacak Yapılar Hakkında Yönetmelik | Afet bölgeleri çerçevesi |",
        "| 1968 | Afet Bölgelerinde Yapılacak Yapılar Hakkında Yönetmelik | Yeni revizyon |",
        "| 1975 | Afet Bölgelerinde Yapılacak Yapılar Hakkında Yönetmelik | Uzun süre kullanılan temel dönem |",
        "| 1998 | Afet Bölgelerinde Yapılacak Yapılar Hakkında Yönetmelik | 1997'de yayımlanan metnin yaygın kullanılan yönetmelik yılı |",
        "| 2007 | Deprem Bölgelerinde Yapılacak Binalar Hakkında Yönetmelik | 6 Mart 2006 yayımı, bir yıl sonra yürürlük |",
        "| 2018 | Türkiye Bina Deprem Yönetmeliği | 18 Mart 2018 yayımı, 1 Ocak 2019 yürürlük |",
        "",
        "Bu tablo kronolojiyi verir; bir yapının hangi kurala tabi olduğunu tespit etmek için proje dosyasındaki tarih ve geçiş hükümleri ayrıca okunmalıdır.",
        "",
        "> [!engineering] SOURCE_VALUE",
        "> Ruhsat tarihi, statik proje onay tarihi, varsa tadilat/güçlendirme proje tarihleri ve kullanılan yönetmeliğin baskısı bu makaledeki tarih yorumunun SOURCE_VALUE girdileridir."
      ),
      subsections: [],
    },
    {
      id: "1998-2007-gecisi",
      title: "1998 ve 2007 adlandırmasında yayın–yürürlük ayrımını koruyun",
      content: phase3Lines(
        "Resmî Gazete'deki 6 Mart 2006 tarihli Deprem Bölgelerinde Yapılacak Binalar Hakkında Yönetmelik, Madde 4 ile yürürlüğe girdiği tarihte 2 Eylül 1997 tarihli ve 23098 mükerrer sayılı Resmî Gazete'de yayımlanan önceki Afet Bölgelerinde Yapılacak Yapılar Hakkında Yönetmeliği kaldırır.",
        "",
        "Aynı metnin Madde 5'i yeni yönetmeliğin yayımından **bir yıl sonra** yürürlüğe gireceğini söyler; bu nedenle uygulamada yönetmelik '2007' adıyla anılır ve 6 Mart 2007 yürürlük eşiği önem kazanır.",
        "",
        "Benzer biçimde AFAD kronolojisinde 1998 adıyla yer alan önceki dönem metninin Resmî Gazete yayın tarihi 2 Eylül 1997'dir. Teknik raporda yalnız başlıktaki yıla bakmak yerine yürürlük tarihini ve proje tarihini birlikte kaydetmek daha güvenlidir."
      ),
      subsections: [],
    },
    {
      id: "tbdy-2018-gecisi",
      title: "TBDY 2018: 18 Mart 2018'de yayımlandı, 1 Ocak 2019'da yürürlüğe girdi",
      content: phase3Lines(
        "AFAD'ın resmî sayfasına göre Türkiye Bina Deprem Yönetmeliği 18 Mart 2018 tarihli ve **30364 sayılı mükerrer Resmî Gazete**'de yayımlandı ve **1 Ocak 2019** tarihinde yürürlüğe girdi.",
        "",
        "AFAD, güncellemenin gerekçeleri arasında deprem mühendisliğindeki gelişmeleri, geçmiş depremlerden çıkarılan dersleri, uygulamadaki eksiklikleri, gelişen bilgi-teknolojiyi, malzeme çeşitliliğini ve yapı modellerindeki değişimi sayar.",
        "",
        "2018 metni yalnız sayısal katsayıların güncellenmesi değildir. Şekil değiştirmeye göre değerlendirme ve tasarım, yapısal olmayan elemanlar, önüretimli betonarme, hafif çelik, ahşap, yüksek binalar, deprem yalıtımı ve düzenli yerinde dökme betonarme binalar için basitleştirilmiş tasarım gibi kapsamlar genişletilmiş veya ayrı bölümler halinde düzenlenmiştir."
      ),
      subsections: [],
    },
    {
      id: "mevcut-bina-yorumu",
      title: "Tarihçe bilgisi mevcut bina performans değerlendirmesinin yerine geçmez",
      content: phase3Lines(
        "Yönetmelik dönemi, bir mevcut bina için önemli bir ön bilgi sağlar: tasarım felsefesi, beklenen detaylandırma alışkanlığı, kullanılan deprem haritası ve dönemin malzeme/uygulama pratiği hakkında araştırma yönünü belirler.",
        "",
        "Ancak güncel deprem performansı yalnız tarihçe tablosundan çıkarılamaz. Mevcut bina değerlendirmesinde geometri, taşıyıcı sistem rölövesi, beton ve donatı verileri, detaylandırma, zemin bilgisi, sonradan yapılan değişiklikler ve seçilen performans yöntemi birlikte incelenir.",
        "",
        "Bu yüzden '1999 öncesi' veya '2007 sonrası' gibi etiketler ön eleme ve arşiv araştırması için kullanılabilir; nihai yapısal güvenlik kararı olarak kullanılmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "dosya-inceleme-akisi",
      title: "Proje dosyasında hangi yönetmeliğin kullanıldığını belirleme akışı",
      content: phase3Lines(
        "1. Yapı ruhsatı, statik proje kapağı ve hesap raporundaki tarihleri kaydedin.",
        "2. Hesap raporunda yazılı yönetmelik adını ve baskısını tespit edin; yalnız bina bitiş yılına güvenmeyin.",
        "3. İlgili yönetmeliğin Resmî Gazete yayın ve yürürlük tarihlerini resmî kaynaktan doğrulayın.",
        "4. Proje tarihinin bir geçiş dönemine denk gelmesi halinde geçici maddeleri ve idare onay tarihini ayrıca inceleyin.",
        "5. Tadilat, kat ilavesi veya güçlendirme varsa her müdahalenin kendi proje tarihini ve dayanağını ayrı kaydedin.",
        "6. Mevcut bina güvenliği soruluyorsa tarihçe sonucunu doğrudan 'uygun/uygunsuz' kararına çevirmeyin; gerekli performans değerlendirmesine geçin."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- 1947, 1953, 1961, 1968, 1975, 1998, 2007 ve 2018 kronolojisi resmî AFAD kaynağıyla doğrulandı mı?",
        "- Yapı yaşı ile yönetmelik yürürlük tarihi birbirine karıştırılmadı mı?",
        "- 1998 olarak anılan dönemin 2 Eylül 1997 tarihli Resmî Gazete yayımı dosyada doğru yorumlandı mı?",
        "- 2007 yönetmeliğinin 6 Mart 2006 yayımı ve bir yıl sonraki 6 Mart 2007 yürürlük tarihi ayrıldı mı?",
        "- TBDY 2018 için 18 Mart 2018 / 30364 mükerrer yayın ve 1 Ocak 2019 yürürlük tarihleri doğru mu?",
        "- Statik proje ve ruhsat tarihleri aynı mı; farklıysa hangi tarihin mevzuat açısından belirleyici olduğu araştırıldı mı?",
        "- Tadilat ve güçlendirme projelerinin farklı mevzuat dönemlerine ait olabileceği dikkate alındı mı?",
        "- Yönetmelik dönemi tek başına mevcut bina güvenliği hükmüne dönüştürülmedi mi?"
      ),
      subsections: [],
    },
  ],
  references: [
    ...tbdyPhase3References("Türkiye deprem yönetmelikleri kronolojisi ve TBDY 2018 yürürlük bilgisi"),
    {
      label: "AFAD — Türkiye Bina Deprem Yönetmeliği broşürü ve resmî zaman çizelgesi",
      href: AFAD_BROCHURE,
      note: "1947–2018 yönetmelik kronolojisi ve TBDY 2018'in getirdiği ana yenilikler için kullanılmıştır.",
    },
    {
      label: "Resmî Gazete — Deprem Bölgelerinde Yapılacak Binalar Hakkında Yönetmelik, 6 Mart 2006",
      href: DBYBHY_2006,
      note: "Önceki yönetmeliğin kaldırılması ve yayımından bir yıl sonra yürürlük hükmü için kullanılmıştır.",
    },
  ],
  keywords: ["deprem yönetmeliği tarihi", "1947", "1975", "1998", "2007", "TBDY 2018"],
  tags: ["TBDY 2018", "Mevzuat Tarihi", "Deprem Yönetmelikleri", "Mevcut Bina"],
};
