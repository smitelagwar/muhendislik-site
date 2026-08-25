import { PHASE3_UPDATED_AT, phase3Lines, tbdyPhase3References, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_KIRIS_SARILMA: DepremPhase3Override = {
  slug: "tbdy-betonarme-kiris-sarilma-bolgeleri",
  description: "TBDY 2018 Madde 7.4.4'e göre kiriş uçlarındaki sarılma bölgelerinin uzunluğunu, ilk etriye konumunu ve özel deprem etriyesi aralık sınırlarını açıklar.",
  seoTitle: "TBDY Kiriş Sarılma Bölgesi ve Etriye Sıklaştırması | 7.4.4",
  seoDescription: "Kiriş sarılma bölgesi 2h, ilk etriye 50 mm, minimum ϕ8 ve s≤min(d/4, 8ϕmin, 150 mm) koşullarının proje kontrolü.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "9 dk",
  sections: [
    {
      id: "sarilma-bolgesi-tanimi",
      title: "7.4.4: Kiriş sarılma bölgesi kolon yüzünden itibaren 2h uzunluğundadır",
      content: phase3Lines(
        "TBDY 7.4.4, kiriş mesnetlerinde kolon yüzünden itibaren **kiriş yüksekliğinin iki katı** kadar uzunluktaki bölgeyi sarılma bölgesi olarak tanımlar. Bu tanım kirişin iki ucunda ayrı ayrı uygulanır.",
        "",
        "| Geometrik kontrol | SOURCE_VALUE |",
        "|---|---:|",
        "| Sarılma bölgesi uzunluğu | 2h |",
        "| İlk etriyenin kolon yüzüne en büyük uzaklığı | 50 mm |",
        "| Sarılma bölgesinde en küçük enine donatı çapı | ϕ8 |",
        "",
        "> [!engineering] Referans yüzeyi",
        "> 2h uzunluğu kolon ekseninden değil, **kolon yüzünden** ölçülür. Uygulama çiziminde sıklaştırma bölgesinin başlangıç ve bitiş ölçüsü açıkça gösterilmelidir."
      ),
      subsections: [],
    },
    {
      id: "etriye-aralik-siniri",
      title: "Etriye aralığı tek bir 150 mm sınırı değildir",
      content: phase3Lines(
        "7.4.5.3'e göre daha elverişsiz bir değer elde edilmedikçe sarılma bölgesindeki etriye aralığı üç üst sınırın en küçüğünü aşamaz:",
        "",
        "`s ≤ min(d/4, 8ϕl,min, 150 mm)`",
        "",
        "Burada `d` kiriş etkili yüksekliği, `ϕl,min` ise kirişteki **en küçük boyuna donatı çapıdır**. Ayrıca kullanılan enine donatı ϕ8'den küçük olamaz.",
        "",
        "> [!warning] 8ϕ hangi donatıya aittir?",
        "> `8ϕ` sınırındaki çap, etriye çapı değil kirişin en küçük boyuna donatı çapıdır. Bu ayrım yazılım girdisi ve pafta kontrolünde özellikle doğrulanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "ozel-deprem-etriyesi",
      title: "Sarılma bölgesinin tamamında özel deprem etriyesi gerekir",
      content: phase3Lines(
        "Sarılma bölgesi boyunca kullanılan enine donatı, TBDY 7.2.8'de tanımlanan **özel deprem etriyesi** koşullarını sağlamalıdır. Dolayısıyla yalnız aralığın küçültülmesi yeterli değildir; kanca, kapanma ve boyuna donatıyı kavrama detayları da 7.2.8 ile birlikte okunur.",
        "",
        "Kiriş eksenine dik doğrultudaki etriye kolları arasındaki mesafe de **350 mm'yi aşamaz**. Geniş kirişlerde bu sınır ek etriye kolu veya uygun çiroz düzenini belirleyebilir.",
        "",
        "> [!check] Çizim kontrolü",
        "> Paftada yalnız `ϕ8/100` gibi bir not yerine, 2h bölgesi, ilk etriye mesafesi ve orta bölgeye geçiş birlikte okunabilmelidir."
      ),
      subsections: [],
    },
    {
      id: "orta-bolge",
      title: "2h dışındaki kiriş orta bölgesi aynı sıklaştırma kuralına tabi değildir",
      content: phase3Lines(
        "TBDY 7.4.4, sarılma bölgesi dışında enine donatı için TS 500 koşullarına uyulacağını belirtir. Bu nedenle tüm açıklık boyunca otomatik olarak `d/4–8ϕ–150 mm` sıklaştırması yapılması yönetmelik metninin gereği değildir.",
        "",
        "Ancak kapasite kesmesi hesabı veya diğer tasarım koşulları orta bölgede daha sık enine donatı gerektiriyorsa belirleyici olan daha elverişsiz tasarım sonucudur.",
        "",
        "> [!engineering] Detay ile dayanım birlikte okunur",
        "> 7.4.4 geometrik ve detaylandırma sınırlarını verir; kesme dayanımı için 7.4.5 kontrolü ayrıca tamamlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "bindirme-ekleri",
      title: "Sarılma bölgesi aynı zamanda bindirmeli ek için kritik/yasaklı bölgedir",
      content: phase3Lines(
        "7.4.3.2, kiriş sarılma bölgeleri, kolon-kiriş birleşimleri ve açıklık ortasında alt donatının akma olasılığı bulunan bölgeler gibi kritik bölgelerde **bindirmeli ek yapılmamasını** ister.",
        "",
        "Kritik bölge dışında bindirmeli ek yapılacaksa ek boyunca 7.2.8'e uygun özel deprem etriyesi düzenlenir ve bu etriyelerin aralığı kiriş yüksekliğinin `1/4`'ünü ve `100 mm`'yi aşamaz.",
        "",
        "> [!warning] Sık etriye, yanlış ek yerini meşrulaştırmaz",
        "> Sarılma bölgesinde sık etriye bulunması burada bindirmeli ek yapılabileceği anlamına gelmez; önce ekin konumu uygun seçilmelidir."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- Her iki kiriş ucunda sarılma bölgesi kolon yüzünden itibaren 2h olarak gösterilmiş mi?",
        "- İlk etriye kolon yüzünden en çok 50 mm uzakta mı?",
        "- Sarılma bölgesindeki enine donatı çapı en az ϕ8 mi?",
        "- Etriye aralığı `min(d/4, 8ϕl,min, 150 mm)` sınırını sağlıyor mu?",
        "- `8ϕ` kontrolünde en küçük boyuna donatı çapı kullanılmış mı?",
        "- Etriye kollarının kiriş eksenine dik yatay aralığı 350 mm'yi aşmıyor mu?",
        "- Sarılma bölgesinde 7.2.8 özel deprem etriyesi detayları sağlanıyor mu?",
        "- Bindirmeli ekler sarılma ve diğer kritik bölgelerin dışında bırakılmış mı?",
        "- Orta bölge enine donatısı TS 500 ve 7.4.5 kesme hesabı ile ayrıca doğrulanmış mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Bölüm 7; Madde 7.4.3.2, 7.4.4 ve 7.4.5"),
  keywords: ["TBDY 2018", "kiriş sarılma bölgesi", "etriye", "2h", "50 mm", "ϕ8", "8ϕ", "150 mm", "7.4.4"],
  tags: ["TBDY 2018", "Betonarme", "Kiriş", "Etriye", "Detaylandırma"],
};