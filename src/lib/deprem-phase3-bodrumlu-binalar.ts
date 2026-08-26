import { phase3Lines, tbdyPhase3References, PHASE3_UPDATED_AT, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_BODRUMLU_BINALAR: DepremPhase3Override = {
  slug: "tbdy-bodrum-katli-binalar",
  description: "TBDY 2018'de bodrumlu binalarda bina tabanının nereden tanımlanacağını, rijit çevre perdeli alt bölümün özel R/D değerlerini, geçiş döşemesi aktarımını ve üst-alt bölümün ortak model içinde analizini açıklar.",
  seoTitle: "TBDY 2018 Bodrumlu Binalar | Bina Tabanı ve Ortak Model",
  seoDescription: "TBDY 3.3.1, 4.3.2.3, 4.5.5, 4.5.7, 4.7.5 ve 4.8.5 ile bodrumlu binalarda bina tabanı, rijit bodrum ve analiz yaklaşımı.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "14 dk",
  sections: [
    {
      id: "bina-tabani-karari",
      title: "Bodrum varsa ilk karar analiz tabanının nerede olduğudur",
      content: phase3Lines(
        "TBDY 3.3.1, bodrumlu bir binada bina tabanının otomatik olarak zemin kat döşemesi veya temel üstü kabul edilmesine izin vermez. Rijit bodrum varsayımının geçerli sayılması için geometrik çevreleme ile dinamik rijitlik koşulu birlikte sağlanmalıdır.",
        "",
        "3.3.1.1'e göre bina tabanı bodrum çevre perdelerinin üstündeki döşeme seviyesinde alınabilmesi için: **(a)** rijit bodrum perdeleri binayı tüm çevresinden veya en az üç taraftan kuşatmalı; **(b)** her ana doğrultuda tüm sistemin hâkim periyodu ile yalnız üst bölümün hâkim periyodu oranı `T_p,tüm / T_p,üst ≤ 1.1` olmalıdır.",
        "",
        "Bu periyot kontrolünde üst bölüm modelinden tüm bodrum kütleleri ve zemin kat döşemesi kütlesi çıkarılır. Koşullardan biri sağlanmıyorsa 3.3.1.2 uyarınca bina tabanı temel üst kotunda kabul edilir.",
        "",
        "> [!warning] Bodrum sayısı karar verdirmez",
        "> 'İki bodrum var, o halde bina tabanı zemin kattır' şeklinde bir kural yoktur. Çevre perde koşulu ve `1.1` periyot oranı birlikte doğrulanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "rijit-bodrum-r-d",
      title: "Rijit bodrum alt bölümünde özel R/I ve D değerleri vardır",
      content: phase3Lines(
        "Bina tabanının rijit bodrum perdelerinin üstünde tanımlanabildiği sistemlerde TBDY 4.3.2.3 alt bölüm için özel bir deprem davranışı tanımlar: `(R/I) = 2.5` ve `D = 1.5` alınır. Üst bölüm ise kendi taşıyıcı sistemine ait Tablo 4.1 R ve D değerleriyle değerlendirilir.",
        "",
        "Aynı zamanda 4.3.4.10, bodrum çevresindeki rijit betonarme perdelerin üst yapının Tablo 4.1 taşıyıcı sistem sınıflandırmasında kullanılan perdeler olmadığını belirtir. Yani bodrum çevre perdesi var diye üst yapı otomatik olarak 'perdeli sistem' kabul edilemez.",
        "",
        "| Bölüm | Deprem parametresi yaklaşımı |",
        "|---|---|",
        "| Üst bölüm | Seçilen üst taşıyıcı sistemin R ve D değerleri |",
        "| Rijit bodrum alt bölümü | `(R/I) = 2.5`, `D = 1.5` |",
        "",
        "> [!engineering] SOURCE_VALUE",
        "> Üst ve alt bölüm R/D tanımları, bina tabanı kararı ve çevre perde koşulu SOURCE_VALUE proje girdileridir; yazılımın bodrum etiketi bunları otomatik olarak doğru kurmuş sayılmaz."
      ),
      subsections: [],
    },
    {
      id: "bodrum-perdesi-modeli",
      title: "4.5.5: bodrum çevre perdeleri yalnız toprak tutan eleman değildir",
      content: phase3Lines(
        "TBDY 4.5.5.1, bodrum çevre perdelerinin üst bölümden gelen atalet kuvvetlerinin tamamını veya önemli bölümünü geçiş döşemeleri üzerinden temele aktardığını; ayrıca deprem etkisindeki zemin itkilerini taşıdığını belirtir.",
        "",
        "4.5.5.2'ye göre bu perdeler 4.5.3.7 esaslarıyla **kabuk sonlu eleman** olarak modellenir. Dolayısıyla yalnız düşey yük alan çizgisel eleman veya modele hiç katılmayan 'mimari bodrum duvarı' yaklaşımı deprem yük yolunu doğru temsil etmez.",
        "",
        "Bodrum perdelerinin temel ve döşeme ile bağlantısı, kabuk ağının sürekliliği ve perde açıklıkları gerçek geometriye uygun kurulmalıdır.",
        "",
        "> [!check] Toprak ve yapı etkisini ayırın",
        "> Deprem hesabındaki bina atalet kuvveti aktarımı ile geoteknik yanal zemin/su basıncı yüklemeleri farklı kaynaklardır; ikisi aynı 'bodrum perdesi' üzerinde buluşsa da yük durumları ve kombinasyonları ayrı tanımlanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "gecis-dosemesi",
      title: "4.5.7: geçiş döşemesi kuvvet aktarımının ana elemanıdır",
      content: phase3Lines(
        "Rijit bodrum ile üst yapı arasındaki geçiş döşemesi yalnız düşey yük taşıyan kat plağı olarak görülemez. 4.5.7.1, bu döşemenin üst yapıdan gelen deprem kuvvetlerini bodrum çevre perdelerine aktaracak yeterli düzlem içi rijitlik ve dayanıma sahip olmasını ister.",
        "",
        "4.5.7.2'ye göre geçiş katı döşemeleri A2 veya A3 düzensizliği olup olmamasından bağımsız olarak **iki boyutlu sonlu eleman** ile modellenir. Çevre bodrum perdelerine aktarılan kuvvetler hesaplanmalı ve güvenli aktarım gösterilmelidir.",
        "",
        "4.5.7.3 gerekli olduğunda aktarma elemanları ve ek bağlantı donatıları düzenlenmesini ister. Bu nedenle yalnız 'rijit diyafram' etiketi verip döşeme iç kuvvetlerini görmezden gelmek uygun değildir.",
        "",
        "> [!warning] Geçiş katını atlamayın",
        "> Üst yapı taban kesmesinin bodrum çevresine nasıl dağıldığı gösterilemiyorsa ortak modelin en kritik yük yolu belgelenmemiş demektir."
      ),
      subsections: [],
    },
    {
      id: "ortak-model-iki-yukleme",
      title: "4.7.5 ve 4.8.5: üst ve alt bölüm ortak tek taşıyıcı sistem olarak modellenir",
      content: phase3Lines(
        "TBDY 4.7.5 ve 4.8.5'in temel ilkesi, rijit bodrumlu binanın üst ve alt bölümlerinin birbirinden kopuk iki ayrı yapısal model olarak çözülmemesidir. Üst bölüm ve bodrumlu alt bölüm **ortak tek taşıyıcı sistem** modeli içinde birlikte yer alır.",
        "",
        "Yönetmelik, 4.3.6'daki doğrudan yaklaşımın yanında yaklaşık iki yükleme durumlu çözüm de tanımlar. Bu yaklaşımda ilk yükleme yalnız üst bölüm kütlelerinden ve üst bölümün R/D değerlerinden; ikinci yükleme yalnız bodrum alt bölüm kütlelerinden ve alt bölümün özel `(R/I)=2.5`, `D=1.5` değerlerinden üretilir.",
        "",
        "Modal yöntem için 4.8.5 de aynı fiziksel sistemi korur. İki yükleme, iki farklı kopuk model anlamına gelmez; aynı model üzerinde farklı kütle/deprem yükü tanımlarıdır.",
        "",
        "> [!engineering] Model sürekliliği",
        "> Kolon, perde, döşeme ve temel bağlantıları ortak modelde süreklidir. Üst modelin taban reaksiyonlarını ayrı bir bodrum modeline sonradan elle uygulamak yönetmelikteki ortak sistem çözümünün eşdeğeri değildir."
      ),
      subsections: [],
    },
    {
      id: "ic-kuvvet-birlestirme",
      title: "4.10.1: tasarım iç kuvvetleri üst ve alt bölümde aynı şekilde birleştirilmez",
      content: phase3Lines(
        "İki yükleme durumlu yaklaşım kullanıldığında 4.10.1 üst ve alt bölüm tasarım iç kuvvetlerinin nasıl oluşturulacağını ayrıca düzenler. Üst bölümde sünek ve sünek olmayan davranışa ait kuvvetler üst sistemin D kurallarıyla; alt bölümde ise ikinci yükleme ile üst bölüm yüklemesinin bodrumdaki etkileri birlikte değerlendirilir.",
        "",
        "Alt bölümde sünek olmayan davranışa ait iç kuvvetlerin oluşturulmasında alt bölümün `Dalt` etkisi yanında, üst bölüm yüklemesinin alt bölüme aktardığı katkı için yönetmeliğin ayrıca tanımladığı katsayılar vardır. Bu nedenle yalnız iki analiz sonucu toplayıp tüm elemanlarda aynı D çarpanını kullanmak doğru değildir.",
        "",
        "Proje raporunda hangi yükleme durumunun hangi bölüm/eleman tasarım kuvvetine nasıl katkı verdiği açıkça izlenmelidir.",
        "",
        "> [!check] Tasarım zarfı",
        "> Yazılımın bodrumlu bina özel kombinasyonlarını otomatik üretmesi halinde bile 4.10.1'e göre üst/alt bölüm ve sünek/sünek olmayan kuvvet ayrımı rapordan doğrulanmalıdır."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- 3.3.1.1 için bodrum çevre perdeleri tüm çevrede veya en az üç taraftan mevcut mu?",
        "- Her ana doğrultuda `T_p,tüm / T_p,üst ≤ 1.1` koşulu doğru kütle tanımlarıyla kontrol edildi mi?",
        "- Koşullardan biri sağlanmıyorsa 3.3.1.2 gereği bina tabanı temel üstüne alındı mı?",
        "- Rijit bodrum alt bölümünde `(R/I) = 2.5` ve `D = 1.5` uygulandı mı?",
        "- Bodrum çevre perdeleri 4.5.5.2'ye göre kabuk sonlu elemanlarla modellendi mi?",
        "- Geçiş döşemesi 4.5.7.2'ye göre iki boyutlu sonlu elemanlarla modellendi mi?",
        "- Döşemeden çevre perdelere yatay kuvvet aktarımı ve gerekli bağlantı donatısı gösterildi mi?",
        "- 4.7.5 / 4.8.5 kapsamında üst ve alt bölüm ortak tek taşıyıcı sistem içinde mi çözüldü?",
        "- İki yükleme yöntemi kullanılıyorsa kütle ve R/D tanımları yükleme durumlarına doğru ayrıldı mı?",
        "- 4.10.1 üst/alt bölüm tasarım iç kuvveti birleştirme kuralları doğrulandı mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Madde 3.3.1, 4.3.2.3, 4.5.5, 4.5.7, 4.7.5, 4.8.5 ve 4.10.1"),
  keywords: ["bodrumlu bina", "rijit bodrum", "bina tabanı", "geçiş döşemesi", "ortak model", "TBDY 2018"],
  tags: ["TBDY 2018", "Bodrumlu Bina", "Rijit Bodrum", "Analiz Modeli"],
};
