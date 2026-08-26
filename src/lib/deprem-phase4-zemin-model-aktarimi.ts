import { PHASE4_UPDATED_AT, TBDY_PAGE, TBDY_PDF, phase4Lines, type DepremPhase4Override } from "./deprem-phase4-shared";

const ZEMIN_TEBLIG_PAGE = "https://yapiisleri.csb.gov.tr/zemin-ve-temel-etudu-uygulama-esaslari-ve-rapor-formati-haber-238674";

export const DEPREM_PHASE4_ZEMIN_MODEL_AKTARIMI: DepremPhase4Override = {
  slug: "zemin-raporu-verilerinin-yapi-modeline-aktarimi",
  description: "Zemin ve temel etüt raporundaki yerel zemin sınıfı, spektrum, dayanım, oturma, yeraltı suyu ve temel parametrelerinin taşıyıcı sistem modeline hangi kaynaktan ve hangi tasarım durumu için aktarılacağını açıklar.",
  seoTitle: "Zemin Raporu Verileri Statik Modele Nasıl Aktarılır? | TBDY Bölüm 16",
  seoDescription: "Veri Raporu-Geoteknik Rapor ayrımı, ZA-ZF yerel zemin sınıfı, SDS-SD1, temel tasarım etkileri ve zemin parametrelerinin statik modele aktarım kontrolü.",
  updatedAt: PHASE4_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "iki-rapor-iki-gorev",
      title: "İlk filtre: Veri Raporundaki ham ölçü ile Geoteknik Rapordaki tasarım girdisini ayırın",
      content: phase4Lines(
        "TBDY **16.2.2.1**, **Veri Raporu**nu arazi ve laboratuvar araştırmalarında elde edilen verilerin sunulduğu rapor olarak tanımlar. **16.2.2.2** kapsamındaki **Geoteknik Rapor** ise bu bulgulardan arazi zemin modelini, geoteknik tasarım parametrelerini, temel seçeneklerini, mühendislik analizlerini ve tasarım önerilerini üretir.",
        "",
        "Statik modele aktarımın temel kuralı şudur: analiz programına girilecek geoteknik parametre, yalnız bir laboratuvar föyünde görüldüğü için kullanılmaz; hangi tasarım durumu için seçildiği ve Geoteknik Raporda nasıl yorumlandığı izlenir.",
        "",
        "| Kaynak | Tipik veri | Statik proje açısından işlem |",
        "|---|---|---|",
        "| Veri Raporu | Sondaj/SPT, laboratuvar, jeofizik, yeraltı suyu | Ham bulguyu ve saha temsilini doğrula |",
        "| Geoteknik Rapor | Tasarım parametreleri, temel önerisi, taşıma gücü, oturma | Tasarım girdisinin esas kaynağını oluştur |",
        "| Statik model | N, M, V, temel temas/rijitlik kabulleri | Geoteknik varsayımlarla aynı yük ve model durumunu kullan |"
      ),
      subsections: [],
    },
    {
      id: "zemin-sinifi-spektrum",
      title: "Yerel zemin sınıfı ile deprem spektrumunu aynı veri zincirinde tutun",
      content: phase4Lines(
        "TBDY **16.4**, yerel zemin sınıflarını **ZA–ZF** olarak tanımlar. Sınıf; yalnız proje yazılımında seçilecek bir etiket değil, arazi araştırmalarından türetilen zemin profilinin deprem hesabına bağlandığı girdidir.",
        "",
        "TBDY **2.3.2.2** uyarınca harita spektral ivme katsayıları yerel zemin etki katsayılarıyla dönüştürülür: **SDS = SS × FS** ve **SD1 = S1 × F1**. FS ve F1 değerleri 2.3.3'te yerel zemin sınıfına göre belirlenir.",
        "",
        "**ZF** sınıfında Tablo 2.1 ve 2.2'den doğrudan katsayı seçilmez; **16.5** kapsamında sahaya özel zemin davranış analizi gerekir. Bu nedenle raporda ZF yazarken analiz programında ZE seçip ilerlemek bir yuvarlama değil, deprem girdisini değiştiren kapsam hatasıdır."
      ),
      subsections: [],
    },
    {
      id: "parametre-matrisi",
      title: "Her geoteknik parametreyi kullanıldığı sınır duruma bağlayın",
      content: phase4Lines(
        "Aynı zemin tabakası için raporda çok sayıda parametre bulunabilir. Bunların her biri aynı hesapta kullanılmaz. TBDY **16.3**, drenajlı/drenajsız koşul ve depremde meydana gelebilecek dayanım veya boşluk suyu basıncı değişimlerinin hesaba katılmasını ister.",
        "",
        "| Parametre/veri grubu | Başlıca kullanım | Kontrol sorusu |",
        "|---|---|---|",
        "| Yerel zemin sınıfı, VS30 | Deprem spektrumu / saha davranışı | Sınıf hangi araştırmayla belirlendi? |",
        "| Kayma dayanımı parametreleri | Taşıma gücü, kayma, stabilite | Drenajlı mı drenajsız mı? |",
        "| Sıkışabilirlik/rijitlik verileri | Oturma ve yerdeğiştirme | Servis ve deprem durumu ayrıldı mı? |",
        "| Yeraltı su seviyesi | Efektif gerilme, taşıma gücü, kayma ve kaldırma etkileri | Mevsimsel/kritik seviye hangisi? |",
        "| Yatak katsayısı / yay önerisi | Temel-yapı modellemesi | Raporun temel boyutu ve model kabulüyle uyumlu mu? |",
        "",
        "Özellikle yatak katsayısı boyutsal bir zemin-model parametresidir; tek bir sayıyı her ağ düğümüne aynen vermek toplam yay rijitliğini ağ sıklığına bağlı hale getirebilir. Modelleme biçimi Geoteknik Rapor önerisi ve sonlu eleman/yay tanımıyla birlikte belgelenmelidir."
      ),
      subsections: [],
    },
    {
      id: "temele-aktarilan-kuvvet",
      title: "Üstyapıdan temele giden N-M-V sonuçlarını Geoteknik Raporun kabul ettiği yük durumuyla eşleştirin",
      content: phase4Lines(
        "TBDY **16.7.3.1**, temel zeminindeki tasarım etkilerinin düşey yüklerle birlikte **4.10.3** uyarınca depremde taşıyıcı sistemden temele aktarılan kuvvetler esas alınarak hesaplanmasını ister.",
        "",
        "Bu nedenle temel hesabında kullanılan kolon/perde reaksiyonlarının hangi yük birleşiminden geldiği, rapordaki taşıma gücü veya kayma kontrolünün hangi tasarım durumuna ait olduğu ile uyumlu olmalıdır. Karakteristik/servis yükü için verilen bir sınırı katsayılı tasarım etkisiyle veya tersini karşılaştırmak tutarlı bir kontrol değildir.",
        "",
        "Pratik aktarım tablosunda en az **N (eksenel), Mx-My (moment) ve Vx-Vy (yatay kesme)** sonuçlarını; yük birleşimi, temel bölgesi ve Geoteknik Rapordaki karşılık gelen dayanım/servis kontrolüyle eşleştirin."
      ),
      subsections: [],
    },
    {
      id: "su-ve-temel-modeli",
      title: "Yeraltı suyu ve temel modelini tek bir sabit senaryoya kilitlemeyin",
      content: phase4Lines(
        "TBDY 16.2 ve 16.3 kapsamında yeraltı suyu araştırma ve tasarımın temel girdilerindendir. Su seviyesi; efektif gerilme, taşıma gücü, drenajsız davranış, yatay kayma, bodrum perde basıncı ve gerektiğinde kaldırma etkisini değiştirebilir.",
        "",
        "Modelde kullanılan su seviyesi Geoteknik Rapordaki tasarım seviyesiyle aynı olmalı; kalıcı drenaj sistemi kabul ediliyorsa bakım veya drenaj arızası senaryosunun hangi projede ele alındığı açıkça gösterilmelidir.",
        "",
        "Aynı şekilde radye altında yay modeli seçilmiş olması, zemin-yapı etkileşiminin otomatik olarak doğru temsil edildiği anlamına gelmez. Yayların birim, tributary alan, çekme alıp almama ve temel plak rijitliği kabulleri raporlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık yapılan veri aktarım hataları",
      content: phase4Lines(
        "- Veri Raporundaki tek bir deney sonucunu Geoteknik Rapordaki tasarım parametresi yerine kullanmak.",
        "- Yerel zemin sınıfını değiştirip SDS, SD1 ve spektrumu yeniden üretmemek.",
        "- ZF zemin için 16.5 sahaya özel analiz gereğini atlayarak tablo katsayısı seçmek.",
        "- Servis yükü/oturma parametresi ile taşıma gücü tasarım dayanımını aynı kabul sanmak.",
        "- Yatak katsayısını ağ alanından bağımsız düğüm yayı olarak kopyalamak.",
        "- Yeraltı su seviyesini modelde rapordan farklı almak ve bunun etkisini açıklamamak.",
        "- Temel reaksiyonlarının hangi yük birleşiminden geldiğini geoteknik kontrol tablosunda göstermemek."
      ),
      subsections: [],
    },
    {
      id: "muhendislik-kontrol-listesi",
      title: "Mühendislik kontrol listesi",
      content: phase4Lines(
        "1. Veri Raporu ile Geoteknik Raporu ayrı okuyun; tasarım parametresinin hangi yorumdan üretildiğini izleyin.",
        "2. ZA–ZF sınıfını arazi verisiyle ve statik modeldeki zemin sınıfıyla karşılaştırın.",
        "3. SS-S1, FS-F1, SDS-SD1 zincirini proje koordinatı ve deprem düzeyi için yeniden doğrulayın.",
        "4. ZF varsa 16.5 kapsamındaki sahaya özel analiz çıktısının model girdisine dönüştüğünü kontrol edin.",
        "5. Dayanım ve oturma parametrelerini aynı yük seviyesinde kullanmadığınızdan emin olun.",
        "6. 16.7.3.1 ve 4.10.3'e göre temele aktarılan N-M-V sonuçlarının geoteknik kontrollerdeki yük birleşimleriyle eşleştiğini doğrulayın.",
        "7. Yeraltı suyu ve temel yay/temas modelinin Geoteknik Rapordaki kabullerle aynı olduğunu belgeleyin."
      ),
      subsections: [],
    },
  ],
  references: [
    { label: "AFAD — Türkiye Bina Deprem Yönetmeliği 2018, Bölüm 2 ve Bölüm 16", href: TBDY_PDF, note: "Yerel zemin sınıfları, spektrum parametreleri, geoteknik rapor ve temel tasarım etkileri resmî metinden doğrulanmıştır." },
    { label: "AFAD — Türkiye Bina Deprem Yönetmeliği resmî sayfası", href: TBDY_PAGE },
    { label: "ÇŞİDB Yapı İşleri — Zemin ve Temel Etüdü Uygulama Esasları ve Rapor Formatı", href: ZEMIN_TEBLIG_PAGE },
  ],
  keywords: ["zemin raporu", "Geoteknik Rapor", "Veri Raporu", "ZA-ZF", "SDS", "SD1", "yatak katsayısı", "temel reaksiyonu"],
  tags: ["Zemin ve Temel", "Statik Model", "TBDY Bölüm 16"],
};
