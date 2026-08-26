import { phase3Lines, tbdyPhase3References, PHASE3_UPDATED_AT, type DepremPhase3Override } from "./deprem-phase3-shared";

export const DEPREM_PHASE3_DISMERKEZLIK: DepremPhase3Override = {
  slug: "tbdy-dismerkezlik-kurali",
  description: "TBDY 2018 Madde 4.5.10'daki ek dışmerkezliğin gerçek kütle-rijitlik dışmerkezliğinden farkını; rijit ve yarı rijit diyaframlarda ±%5 uygulamasını ve A1 burulma düzensizliği büyütmesini açıklar.",
  seoTitle: "TBDY 2018 Ek Dışmerkezlik | ±%5 Kuralı ve Burulma",
  seoDescription: "TBDY 4.5.10, ±%5 ek dışmerkezlik, Denklem 4.17 ve 4.18, yarı rijit diyafram ve A1 burulma düzensizliği kontrolü.",
  updatedAt: PHASE3_UPDATED_AT,
  readTime: "13 dk",
  sections: [
    {
      id: "ek-dismerkezligin-anlami",
      title: "Ek dışmerkezlik gerçek dışmerkezliğin yerine geçen yapay bir burulma değildir",
      content: phase3Lines(
        "TBDY 4.5.10.1 ek dışmerkezliği, deprem etkisinin uygulanmasındaki ve kütle/rijitlik dağılımındaki belirsizlikleri hesaba katmak için tanımlar. Bu nedenle `±%5` kuralı, modelde zaten bulunan gerçek kütle merkezi–rijitlik merkezi farkını silmek veya A1 burulma düzensizliği kontrolünü atlamak için kullanılamaz.",
        "",
        "Doğru yaklaşım; gerçek geometrik ve rijitlik dağılımını modelde korumak, ardından yönetmeliğin istediği ek dışmerkezlik etkisini ayrıca üretmektir.",
        "",
        "> [!warning] İki farklı kavram",
        "> Gerçek dışmerkezlik yapının mevcut plan davranışından doğar. Ek dışmerkezlik ise belirsizliği temsil eden yönetmelik yüklemesidir. İkisini aynı değer gibi raporlamak burulma kontrolünü anlamsızlaştırır."
      ),
      subsections: [],
    },
    {
      id: "rijit-diyafram-arti-eksi-yuzde-bes",
      title: "4.5.10.2: rijit diyaframda yükleme +%5 ve -%5 kaydırılır",
      content: phase3Lines(
        "Rijit diyafram kabulünde kat kütlesi kat kütle merkezinde tanımlanır. 4.5.10.2'ye göre deprem doğrultusuna dik kat boyutunun `%5`i kadar `+%5` ve `-%5` ek dışmerkezlik oluşturacak iki ayrı durum hesaba katılır.",
        "",
        "Örneğin X doğrultusunda deprem etkisi için dışmerkezlik Y doğrultusundaki kat boyutu üzerinden tanımlanır. Pozitif ve negatif kaydırmalar ayrı analiz durumlarıdır; tek işaretli bir yükleme yeterli değildir.",
        "",
        "| Analiz yaklaşımı | Ek dışmerkezliğin temsil biçimi |",
        "|---|---|",
        "| Eşdeğer deprem yükü yöntemi | Yüklerin kaydırılması veya Denklem (4.17) ile ek burulma momenti |",
        "| Modal hesap, rijit diyafram | Kütle merkezi kaydırması veya Denklem (4.18) ile kütle atalet momentine ek |",
        "| Yarı rijit / membran döşeme | 4.5.10.4'teki iki çözüm ve zarf yaklaşımı |",
        "",
        "> [!check] Yön kontrolü",
        "> X depremi için dışmerkezlik X boyutundan değil, X'e dik plan boyutundan türetilir; Y depremi için de aynı mantık ters yönde uygulanır."
      ),
      subsections: [],
    },
    {
      id: "denklem-4-17-4-18",
      title: "Denklem 4.17 ve 4.18: aynı belirsizlik iki farklı analiz büyüklüğüyle temsil edilebilir",
      content: phase3Lines(
        "Eşdeğer deprem yükü yönteminde yükleri fiziksel olarak kaydırmak yerine 4.5.10.2 kapsamında ek kat burulma momenti kullanılabilir:",
        "",
        "```formula",
        "@label: TBDY Denklem (4.17) — ek kat burulma momenti",
        "M_ib^(X) = F_iE^(X) e",
        "@symbol: M_ib^(X) | X doğrultusu depremi için i'inci kattaki ek burulma momenti | kN·m",
        "@symbol: F_iE^(X) | i'inci kata etkiyen eşdeğer deprem yükü | kN",
        "@symbol: e | Deprem doğrultusuna dik kat boyutunun %5'i olan ek dışmerkezlik | m",
        "```",
        "",
        "Modal hesapta ise aynı belirsizlik, kat kütle atalet momentine `Δm_iθ = m_i e²` eklenerek temsil edilebilir; bu TBDY Denklem (4.18)'dir. Yazılımın hangi yöntemi kullandığı proje raporunda açık olmalıdır.",
        "",
        "> [!engineering] SOURCE_VALUE",
        "> Kat plan boyutu, kütle merkezi, seçilen deprem doğrultusu ve `e = %5` dışmerkezliği SOURCE_VALUE girdileridir; programın otomatik eccentricity seçeneği bu girdilerin doğruluğunu garanti etmez."
      ),
      subsections: [],
    },
    {
      id: "yari-rijit-diyafram",
      title: "4.5.10.4: yarı rijit diyaframda ±%5 yalnız kütleyi kaydırıp tek çözüm yapmak değildir",
      content: phase3Lines(
        "Döşemelerin iki boyutlu sonlu elemanlarla modellenip düzlem içi şekil değiştirmelerinin hesaba katıldığı durumda 4.5.10.4 özel bir işlem tanımlar. İlk çözüm ek dışmerkezlik uygulanmadan gerçek yarı rijit sistemle yapılır ve döşeme dahil iç kuvvet/deplasmanlar elde edilir.",
        "",
        "İkinci çözümde kat döşemeleri yalnız düzlem içi serbestlikler bakımından rijit diyafram kabul edilir ve kütle merkezleri 4.5.10.2'deki ±%5 kadar kaydırılır. Döşeme ve kirişler dışındaki taşıyıcı elemanlarda tasarıma esas sonuçlar bu iki çözümün **zarfı** olarak alınır.",
        "",
        "Bu yöntem, gerçek yarı rijit diyafram kuvvetlerini kaybetmeden ek dışmerkezlik belirsizliğini taşıyıcı elemanlara yansıtmayı amaçlar.",
        "",
        "> [!warning] Tek model kısa yolu",
        "> Yarı rijit döşemeyi koruyup yalnız kütleleri rastgele kaydırmak veya tüm sonuçları yalnız rijit diyafram modelinden almak 4.5.10.4'te tarif edilen iki çözüm + zarf süreci değildir."
      ),
      subsections: [],
    },
    {
      id: "a1-burulma-buyutmesi",
      title: "A1 burulma düzensizliği varsa ek dışmerkezlik ayrıca büyütülebilir",
      content: phase3Lines(
        "Ek dışmerkezlik kontrolü A1 burulma düzensizliği hesabından bağımsız değildir. TBDY 4.7.4'e göre A1 düzensizliği bulunan ve `1.2 < ηbi ≤ 2.0` aralığında kalan katlarda ±%5 ek dışmerkezlik, Denklem (4.29)'daki `Dbi = (ηbi / 1.2)²` katsayısı ile büyütülür.",
        "",
        "Bu nedenle iş akışı 'önce ±%5 ver, sonra A1'e bakma' şeklinde değildir. Ek dışmerkezlikli analiz sonuçlarından burulma düzensizliği katsayısı izlenir ve gerekiyorsa yönetmeliğin öngördüğü büyütme tekrar hesaba katılır.",
        "",
        "> [!check] ηbi > 2.0",
        "> ηbi değerini yalnız dışmerkezlik büyütme katsayısına çevirmek yeterli değildir; yönetmeliğin analiz yöntemi ve düzensizlik hükümleri ayrıca kontrol edilmelidir."
      ),
      subsections: [],
    },
    {
      id: "ofis-kontrol-akisi",
      title: "Ofis kontrol akışı: kütle merkezinden burulma zarfına",
      content: phase3Lines(
        "1. Gerçek kat geometrisi, kütle merkezi ve taşıyıcı sistem rijitlik dağılımını doğru modelleyin.",
        "2. Her deprem doğrultusunda ona dik plan boyutunun `%5`ini hesaplayın.",
        "3. Rijit diyaframda +e ve -e yükleme durumlarını; yarı rijitte 4.5.10.4'ün iki çözümünü kurun.",
        "4. Eşdeğer yük yönteminde Denklem (4.17), modal yöntemde gerekiyorsa Denklem (4.18) temsilinin program davranışıyla uyumunu kontrol edin.",
        "5. A1 burulma düzensizliği için ηbi değerlerini izleyin; `1.2 < ηbi ≤ 2.0` ise Denklem (4.29) büyütmesini uygulayın.",
        "6. Eleman tasarım zarflarının tüm işaret ve dışmerkezlik durumlarını içerdiğini doğrulayın."
      ),
      subsections: [],
    },
    {
      id: "kontrol-listesi",
      title: "Proje kontrol listesi",
      content: phase3Lines(
        "- 4.5.10.1'deki ek dışmerkezlik gerçek kütle-rijitlik dışmerkezliğinden ayrı mı ele alındı?",
        "- Her deprem doğrultusunda dik kat boyutundan `+%5` ve `-%5` durumları üretildi mi?",
        "- Eşdeğer deprem yükünde Denklem (4.17) kullanılıyorsa `Mib = FiE e` doğru mu?",
        "- Modal yöntemde Denklem (4.18) kullanılıyorsa `Δm_iθ = m_i e²` tanımı doğru mu?",
        "- Yarı rijit diyafram varsa 4.5.10.4'teki gerçek model + rijit diyafram dışmerkezlik çözümü ve zarf uygulandı mı?",
        "- A1 için `1.2 < ηbi ≤ 2.0` aralığında Denklem (4.29) büyütmesi kontrol edildi mi?",
        "- Pozitif/negatif dışmerkezlik ve iki yatay doğrultu sonuçları tasarım zarfına girdi mi?",
        "- Programın otomatik eccentricity ayarı rapor üzerinden doğrulandı mı?"
      ),
      subsections: [],
    },
  ],
  references: tbdyPhase3References("Madde 4.5.10 ve 4.7.4; Denklem (4.17), (4.18) ve (4.29)"),
  keywords: ["ek dışmerkezlik", "±%5", "burulma", "A1 düzensizliği", "Denklem 4.17", "TBDY 2018"],
  tags: ["TBDY 2018", "Ek Dışmerkezlik", "Burulma", "Diyafram"],
};
