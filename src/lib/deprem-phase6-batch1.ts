import {
  IMAR_2023_HEIGHT,
  PHASE6_UPDATED_AT,
  imarPhase6References,
  phase6Lines,
  type DepremPhase6Override,
} from "./deprem-phase6-shared";

export const DEPREM_PHASE6_IMAR_HEIGHT: DepremPhase6Override = {
  slug: "imar-kat-yuksekligi-bina-yuksekligi-farki",
  title: "Kat Yüksekliği ve Bina Yüksekliği: Kot, Kat Adedi ve Proje Kontrolü",
  description: "Planlı Alanlar İmar Yönetmeliğinde kat yüksekliği ile bina/yapı yüksekliğini birbirinden ayırır; Madde 28 sınırlarını, kot ve kat adedi ilişkisini ve mimari-aplikasyon proje kontrolünü mühendislik akışıyla açıklar.",
  seoTitle: "Kat Yüksekliği ve Bina Yüksekliği | Madde 28 İmar Kontrolü",
  seoDescription: "Madde 28 kat yükseklikleri, konut/ticaret sınırları, iç yükseklik, kot ve bina yüksekliği farkı için 2026 güncel imar kontrol rehberi.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "13 dk",
  relatedSlugs: ["imar-taks-kaks-emsal-hesabi", "imar-bahce-mesafeleri-on-arka-yan-bahce-kurallari", "imar-cekme-kat-asma-kat-kosullari"],
  sections: [
    {
      id: "uc-farkli-yukseklik",
      title: "Kat yüksekliği, iç yükseklik ve bina yüksekliği aynı ölçü değildir",
      content: phase6Lines(
        "İmar ön kontrolünde en sık yapılan hatalardan biri üç farklı geometrik büyüklüğü tek 'kat yüksekliği' ifadesiyle kullanmaktır. **Kat yüksekliği**, döşeme üst kotundan bir üst döşeme üst kotuna kadar olan ölçüdür. **İç yükseklik**, bitmiş döşeme/tavan düzeni içindeki kullanılabilir hacmin düşey ölçüsüdür. **Bina yüksekliği** ise yönetmelikteki kot alma ve saçak/seviye tarifleriyle birlikte okunur.",
        "",
        "Bu ayrım statik ve mimari koordinasyonu doğrudan etkiler. Döşeme-kiriş kalınlığı, tesisat boşluğu ve asma tavan gereksinimi iç yüksekliği azaltırken kat yüksekliği aynı kalabilir; buna karşılık planın izin verdiği toplam bina yüksekliği katların toplam geometrisini sınırlar.",
        "",
        "Teknik sorumluluk, paftadaki `H=...` notunu tek başına kabul etmek değil; plan notu, kot alınan nokta, kat adedi ve kesitteki döşeme üst kotlarını aynı hesap zincirinde doğrulamaktır."
      ),
      subsections: [],
    },
    {
      id: "madde28",
      title: "Madde 28: plan daha fazla belirlememişse kat yüksekliği için azami değerler",
      content: phase6Lines(
        "Planlı Alanlar İmar Yönetmeliği **Madde 28**, uygulama imar planında daha fazla bir değer belirlenmemişse kat yüksekliğini döşeme üst kotundan döşeme üst kotuna sınırlar. Güncel konsolide hükümde temel kontroller şöyledir:",
        "",
        "| Kullanım / kat | Azami kat yüksekliği |",
        "|---|---:|",
        "| Ticaret — zemin kat | 4,50 m |",
        "| Ticaret — asma katlı zemin kat | 5,50 m |",
        "| Ticaret — diğer kat | 4,00 m |",
        "| Karma alan — zemin kat | 4,50 m |",
        "| Karma alan — diğer konut katları | 3,60 m |",
        "| Karma alan — diğer konut dışı katlar | 4,00 m |",
        "| Konut — zemin ve normal kat | 3,60 m |",
        "| Konut — bodrum hariç 3 katı geçmeyen bina | 4,00 m |",
        "| Zemin katında ticaret yapılabilen konut bölgesi — zemin | 4,50 m |",
        "| Zemin katında ticaret yapılabilen konut bölgesi — diğer kat | 3,60 m |",
        "",
        "Konut bölgesindeki üç katı geçmeyen binalara ilişkin **4,00 m** hükmü 12 Ağustos 2023 / 32277 değişikliğiyle Madde 28'e eklenmiştir. Bu nedenle eski tablo veya eğitim notundan sayı taşımak yerine proje tarihindeki konsolide metin kontrol edilmelidir."
      ),
      subsections: [],
    },
    {
      id: "ic-yukseklik",
      title: "İç yüksekliği ayrıca kontrol edin: kat yüksekliğinin tamamı kullanılabilir hacim değildir",
      content: phase6Lines(
        "Madde 28'e göre iskân edilen katlarda, asma katlar hariç, iç yükseklik genel olarak **2,60 m**'den az olamaz; hava maniası bulunup planla kat adedi belirlenen özel durumda **2,40 m**'ye düşürülebilir. Islak hacim, kiler, merdiven altı, geçit, iskân edilmeyen bodrum ve müştemilat gibi belirtilen hacimlerde ise **2,20 m** seviyesine kadar farklı hükümler vardır.",
        "",
        "Bu değerler kaba kat yüksekliği değildir. Kiriş altı, tesisat, döşeme kaplaması ve asma tavan nedeniyle yerel net yükseklikler ayrıca kesitte ölçülmelidir.",
        "",
        "Yanlış uygulama, 3,60 m kat yüksekliği görüldüğü için her noktada 3,60 m net hacim bulunduğunu varsaymaktır. Mimari kesit ve mekanik koordinasyon yapılmadan iç yükseklik kabulü kapatılmamalıdır."
      ),
      subsections: [],
    },
    {
      id: "bina-yuksekligi-kat-adedi",
      title: "Kat yüksekliğini küçülterek plandaki kat adedini artıramazsınız",
      content: phase6Lines(
        "Yönetmeliğin genel yapılaşma hükümleri, planda veya Yönetmelikte belirlenen kat adedi/bina yüksekliğinin kat yükseklikleri azaltılarak aşılmasına ve bu yolla yapı yoğunluğunun artırılmasına izin vermez. Bu nedenle toplam yükseklik hesabı yalnız `toplam yükseklik / küçük kat yüksekliği` işlemi değildir.",
        "",
        "Madde 28'in ikinci fıkrası, kat yükseklikleri dikkate alınmadan yalnız bina yüksekliği verilmiş planlarda uygulanacak geçiş mantığını da tanımlar. Plan kararının nasıl verildiği, ada teşekkülü ve güncel yönetmelik birlikte okunur.",
        "",
        "Tasarım kararı verirken kat adedi, kot alma, bina yüksekliği ve hava mania koşullarını ayrı sütunlarda izlemek sonradan 'bir kat daha çıkar mı?' yorumlarının önüne geçer."
      ),
      subsections: [],
    },
    {
      id: "pafta-koordinasyonu",
      title: "Madde 57: bina ve yapı yükseklikleri mimari proje ile aplikasyon projesinde aynı kot zincirini göstermelidir",
      content: phase6Lines(
        "Planlı Alanlar İmar Yönetmeliği **Madde 57**, bina/yapı yükseklik ve kotlarının mimari proje ile aplikasyon projesinde tanımlara, imar planına ve tapu kayıtlarına uygun gösterilmesini ister. 14 Ocak 2026 değişikliğiyle yapı aplikasyon projesinin ortometrik zemin kotlarını da içeren koordinat/kot altyapısı güncellenmiştir.",
        "",
        "| Belge | Kontrol |",
        "|---|---|",
        "| İmar durumu + plan notu | Kat adedi / bina yüksekliği / yapı nizamı |",
        "| Vaziyet planı | Bina oturumu ve kot alınan cephe/nokta |",
        "| Mimari kesit | Döşeme üst kotları, iç yükseklikler, saçak/çatı ilişkisi |",
        "| Aplikasyon projesi | Köşe koordinatları, röper ve ortometrik zemin kotları |",
        "",
        "Bu belgelerdeki tek bir kot farkı statik temel kotunu, bodrum açığa çıkma durumunu ve bahçe mesafesi hesabındaki kat adedini etkileyebilir."
      ),
      subsections: [],
    },
    {
      id: "yanlislar",
      title: "Sık yanlışlar ve proje sonucu",
      content: phase6Lines(
        "**Yanlış:** Mimari kat yüksekliğini bağımsız bölüm iç yüksekliği sanmak. **Sonuç:** tesisat/kiriş sonrası net hacim yetersizliği.",
        "",
        "**Yanlış:** Plandaki toplam yüksekliği küçük kat yüksekliğine bölüp fazladan kat üretmek. **Sonuç:** plan yoğunluğu ve ruhsat kat adediyle çelişki.",
        "",
        "**Yanlış:** Bodrum veya eğimli parselde kot alınan noktayı paftalar arasında değiştirmek. **Sonuç:** bina yüksekliği, kat sayısı ve bahçe mesafesi kontrollerinin birbirinden kopması.",
        "",
        "Mühendislik kararı, plan notu ve ilgili idarenin onaylı kot/aplikasyon verisiyle izlenebilir olmalıdır."
      ),
      subsections: [],
    },
    {
      id: "height-checklist",
      title: "Mühendislik kontrol listesi",
      content: phase6Lines(
        "- [ ] Plan/plan notunda kat adedi ve bina yüksekliği kararını ayrı ayrı okudum.",
        "- [ ] **Madde 28** azami kat yüksekliğini kullanım türüne göre doğruladım.",
        "- [ ] Konut için **3,60 m**, uygun üç katlı konut senaryosunda **4,00 m**, ticaret zeminde **4,50 m** gibi değerleri proje bağlamıyla kullandım.",
        "- [ ] İç yükseklik kontrolünde genel **2,60 m** ve özel hacim hükümlerini ayrıca değerlendirdim.",
        "- [ ] Kat yüksekliğini azaltarak kat adedini artırmadım.",
        "- [ ] Kot alınan nokta ve döşeme üst kotlarını mimari kesitte işaretledim.",
        "- [ ] **Madde 57** kapsamında mimari ve aplikasyon projesindeki bina/yapı yükseklik-kot bilgilerini eşleştirdim.",
        "- [ ] Proje tarihindeki **1 Temmuz 2026 / 33297** dâhil güncel değişiklik zincirini kontrol ettim."
      ),
      subsections: [],
    },
  ],
  references: [
    ...imarPhase6References("Madde 28 ve Madde 57"),
    { label: "Resmî Gazete — 12 Ağustos 2023 / 32277, Madde 28 kat yüksekliği değişikliği", href: IMAR_2023_HEIGHT },
  ],
  keywords: ["kat yüksekliği", "bina yüksekliği", "Madde 28", "Madde 57", "3,60 m", "4,50 m", "kot"],
  tags: ["İmar", "Kat Yüksekliği", "Bina Yüksekliği", "Proje Kontrolü"],
};

export const DEPREM_PHASE6_IMAR_GARDEN: DepremPhase6Override = {
  slug: "imar-bahce-mesafeleri-on-arka-yan-bahce-kurallari",
  title: "Ön, Yan ve Arka Bahçe Mesafeleri: Parsel Yerleşimi ve Kat Adedi Kontrolü",
  description: "Planlı Alanlar İmar Yönetmeliği Madde 23'e göre ön, yan ve arka bahçe mesafelerini; kat adediyle artış, yüksek yapı koşulları, yeraltı kullanımları ve aplikasyon projesi üzerinden açıklar.",
  seoTitle: "Bahçe Mesafeleri | Ön Yan Arka Bahçe Madde 23 Kontrolü",
  seoDescription: "Madde 23 ön bahçe 5 m, yan/arka 3 m temel hükümleri, kat adedi artışı, 60,50 m yüksek yapı çekmeleri ve 2026 aplikasyon kontrolü.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "14 dk",
  relatedSlugs: ["imar-taks-kaks-emsal-hesabi", "imar-kat-yuksekligi-bina-yuksekligi-farki", "imar-parsel-tevhid-ifraz-prosedurleri"],
  sections: [
    {
      id: "plan-onceligi",
      title: "İlk kaynak uygulama imar planı ve plan notudur; Madde 23 genel altlık olarak okunur",
      content: phase6Lines(
        "Bahçe mesafesi hesabı yönetmelik tablosundan doğrudan başlamaz. Önce yürürlükteki uygulama imar planında ve plan notunda parsel için özel yapı yaklaşma mesafesi bulunup bulunmadığı kontrol edilir. **Madde 23**, planda aksine hüküm olmayan durumlarda genel çerçeveyi verir.",
        "",
        "Bu nedenle aynı ada içinde bile köşe parseli, park cephesi, özel plan notu veya blok nizam kararı nedeniyle farklı yerleşim geometrisi oluşabilir.",
        "",
        "Teknik sorumluluk, 'ön 5 / yan 3 / arka 3' ezberini paftaya yazmak değil; bu değerlerin gerçekten parsel için uygulanabilir genel hüküm olduğunu plan notuyla kanıtlamaktır."
      ),
      subsections: [],
    },
    {
      id: "madde23-temel",
      title: "Madde 23 temel değerleri ve dört kat üzerindeki artış",
      content: phase6Lines(
        "Plan aksini söylemiyorsa Madde 23'ün temel değerleri şöyledir:",
        "",
        "| Bahçe / durum | Genel değer |",
        "|---|---:|",
        "| Ön bahçe, yol kenarı ve kamusal alana komşu bahçe | en az **5,00 m** |",
        "| Yan bahçe | en az **3,00 m** |",
        "| Arka bahçe | en az **3,00 m** |",
        "| Dörtten fazla katlı binalarda yan/arka bahçe | 4 kat üzerindeki her kat için **+0,50 m** |",
        "",
        "Yan ve arka bahçe artışında kat adedinin nasıl hesaplandığı ayrıca Madde 23 içinde tarif edilir; eğimli arazi ve kısmen toprak altında kalan katlar nedeniyle yalnız paftadaki kat ismine bakmak yeterli değildir.",
        "",
        "Park alanına komşu cephe gibi özel istisnalar bulunduğundan tabloyu bütün cephelere mekanik olarak uygulamayın."
      ),
      subsections: [],
    },
    {
      id: "yuksek-yapi",
      title: "60,50 m ve üzerindeki görünen yüksekliklerde çekme geometrisi farklılaşır",
      content: phase6Lines(
        "Uygulama imar planında aksine açıklama yoksa, binanın tabii veya tesviye edilmiş zemindeki en düşük kottaki görünen yüksekliği **60,50 m** veya daha fazla olduğunda ön, yan ve arka parsel sınırından en az **15,00 m** çekilme hükmü devreye girer. 60,50 m'den sonra artan her kat için bu mesafeye **0,50 m** eklenir.",
        "",
        "Az katlı ana kitle üzerinde yükselen çok yüksek bloklarda ve aynı parselde birden fazla yüksek blokta ayrıca bina-blok arası mesafe kuralları bulunur. Bu tür projelerde tek bir 'bahçe mesafesi' ölçüsü yerine baza ve yükselen kitle geometrileri ayrı ayrı çizilmelidir.",
        "",
        "Yanlış uygulama, yüksek yapı koşulunu yalnız ruhsat kat adedinden okumaktır; görünen yükseklik, kot ve kitle geometrisi birlikte kontrol edilir."
      ),
      subsections: [],
    },
    {
      id: "yer-alti-kullanim",
      title: "Toprak altındaki kullanımlar bahçe mesafesinde ayrı bir karar katmanı oluşturur",
      content: phase6Lines(
        "Madde 23, tabii veya tesviye edilmiş zeminin altında kalmak ve parsel dışına taşmamak koşuluyla bazı kullanımlar için farklı yerleşim olanakları tanımlar. Ön bahçe statüsünde olmayan yan/arka bahçelerde su deposu, otopark ve zorunlu sığınak; ön bahçede ise belirli parsel sınırı koşullarıyla toprak altı otopark değerlendirilebilir.",
        "",
        "Bu hüküm, bodrumun üstünün sonradan açığa çıkarılabileceği anlamına gelmez. Kazı/tesviye, bodrumun açığa çıkması ve taban alanı hükümleri ayrıca kontrol edilir.",
        "",
        "Mühendislik çiziminde yeraltı yapı sınırı, parsel sınırı, üstteki peyzaj kotu ve drenaj/istinat çözümü aynı kesitte gösterilmelidir."
      ),
      subsections: [],
    },
    {
      id: "2026-aplikasyon",
      title: "14 Ocak 2026 değişikliğiyle aplikasyon projesi, yaklaşma mesafesi ve ortometrik kot zincirini daha görünür hale getirir",
      content: phase6Lines(
        "14 Ocak 2026 / 33137 değişikliği yapı aplikasyon projesini; imar planı veya Yönetmelikte belirlenen yapı yaklaşma mesafeleri, köşe koordinatları, röper noktaları ve **ortometrik** yapı/parsel zemin kotlarıyla tanımlar. Bu, bahçe mesafesinin yalnız mimari planda cetvelle ölçülen bir boşluk olmadığını açıkça gösterir.",
        "",
        "| Kontrol | Paftada gösterilecek veri |",
        "|---|---|",
        "| Parsel | tapu/kadastro sınırı ve koordinatlar |",
        "| Yapı yaklaşma | ön/yan/arka sınır çizgileri |",
        "| Bina | köşe koordinatları |",
        "| Kot | tabii/tesviye zemin ve ortometrik kotlar |",
        "| Özel durum | yüksek blok, yeraltı otoparkı, istinat/kademe |",
        "",
        "Saha aplikasyonundan önce bu zincirin harita mühendisi, mimar ve statik proje ekibi arasında aynı koordinat sisteminde doğrulanması gerekir."
      ),
      subsections: [],
    },
    {
      id: "2026-yangin-merdiveni",
      title: "Mevcut yapılardaki yangın merdiveni için 2026 istisnasını yeni bina bahçe hesabına genellemeyin",
      content: phase6Lines(
        "14 Ocak 2026 değişikliği Madde 23'e, belirli **mevcut yapılarda** mevzuat değişikliği veya kullanım/yükseklik/alan artışı nedeniyle zorunlu hale gelen yangın merdiveninin bina içinde çözülememesi durumuna ilişkin özel bir hüküm eklemiştir. Bu kapsamda yan/arka bahçede parsel sınırına **1,50 m**, ön bahçede **3,00 m** mesafe koşullarıyla BYKHY'ye uygun çözüm değerlendirilebilir.",
        "",
        "Bu hüküm yeni bina tasarımında normal bahçe mesafesini azaltan genel bir hak değildir. Kapsam şartları, mevcut yapı ve tadilat/ilave ruhsatı bağlamında okunmalıdır.",
        "",
        "Yanlış uygulama, istisna maddesini yeni projede genel çekme hakkı gibi kullanmaktır."
      ),
      subsections: [],
    },
    {
      id: "garden-checklist",
      title: "Mühendislik kontrol listesi",
      content: phase6Lines(
        "- [ ] Uygulama imar planı ve plan notundaki özel yapı yaklaşma mesafelerini önce kontrol ettim.",
        "- [ ] Genel durumda ön bahçe için **5,00 m**, yan/arka için **3,00 m** hükümlerini doğruladım.",
        "- [ ] Dörtten fazla katta yan/arka bahçe için kat başına **0,50 m** artışı doğru kat hesabıyla kontrol ettim.",
        "- [ ] **60,50 m / 15,00 m** yüksek yapı koşulunu gerekiyorsa ayrı çizimle değerlendirdim.",
        "- [ ] Yeraltı otoparkı/sığınak/depo gibi kullanımları toprak üstü bina çekmesinden ayrı inceledim.",
        "- [ ] Aplikasyon projesinde yapı köşe koordinatları ve ortometrik zemin kotlarını doğruladım.",
        "- [ ] 2026 yangın merdiveni istisnasını yeni yapı genel hükmü olarak kullanmadım.",
        "- [ ] Bahçe mesafesi kararını vaziyet planı + kesit + aplikasyon projesinde aynı geometriyle gösterdim."
      ),
      subsections: [],
    },
  ],
  references: imarPhase6References("Madde 23 ve Madde 57"),
  keywords: ["bahçe mesafesi", "ön bahçe", "yan bahçe", "arka bahçe", "Madde 23", "5,00 m", "3,00 m", "60,50 m"],
  tags: ["İmar", "Bahçe Mesafesi", "Aplikasyon", "Parsel"],
};

export const DEPREM_PHASE6_IMAR_MEZZANINE: DepremPhase6Override = {
  slug: "imar-cekme-kat-asma-kat-kosullari",
  title: "Çekme Kat ve Asma Kat: Güncel Mevzuatta Kavramı Doğru Kurma",
  description: "Planlı Alanlar İmar Yönetmeliğinin 14 Ocak 2026 güncel asma kat tanımını, 1/3 alan, 2,40 m iç yükseklik ve 3,00 m cephe yaklaşma koşullarını açıklar; 'çekme kat' ifadesinin plan notu/yerel karar olmadan genel hak gibi kullanılmaması gerektiğini gösterir.",
  seoTitle: "Asma Kat Koşulları 2026 | 1/3, 2,40 m ve Çekme Kat Ayrımı",
  seoDescription: "14 Ocak 2026 asma kat tanımı, 1/3 alan, 2,40 m iç yükseklik, 3,00 m cephe şartı ve çekme katın plan notu üzerinden kontrolü.",
  updatedAt: PHASE6_UPDATED_AT,
  readTime: "13 dk",
  relatedSlugs: ["imar-kat-yuksekligi-bina-yuksekligi-farki", "imar-taks-kaks-emsal-hesabi", "imar-balkon-cikma-sacak-emsal-disi-sartlari"],
  sections: [
    {
      id: "kavram-ayrimi",
      title: "Asma kat Yönetmelikte tanımlıdır; 'çekme kat' ise parselde otomatik genel hak olarak kabul edilmemelidir",
      content: phase6Lines(
        "Güncel Planlı Alanlar İmar Yönetmeliği **asma katı** açık bir teknik tanımla düzenler. Buna karşılık uygulamada kullanılan **çekme kat** ifadesi, her parsel için Yönetmelikten doğan bağımsız bir ilave kat hakkı gibi ele alınmamalıdır. İmar planı, plan notu, yerel düzenleme veya mevcut teşekkül özelinde açık bir dayanak yoksa bu terim üzerinden kat üretmek güvenli bir mühendislik yaklaşımı değildir.",
        "",
        "Bu nedenle proje kontrolü iki ayrı soruyla başlar: `Bu mekân Yönetmelikteki asma kat tanımını gerçekten sağlıyor mu?` ve `çekme kat adıyla önerilen çözümün bağlayıcı plan/plan notu dayanağı var mı?`",
        "",
        "Yanlış uygulama, eski belediye notundaki veya başka şehirdeki çekme kat örneğini ulusal Yönetmeliğin genel hakkı gibi kopyalamaktır."
      ),
      subsections: [],
    },
    {
      id: "asma-kat-2026",
      title: "14 Ocak 2026 / 33137: güncel asma kat tanımındaki ana geometrik koşullar",
      content: phase6Lines(
        "14 Ocak 2026 değişikliğiyle güncel tanımda asma kat; zemin katta ait olduğu bağımsız bölümü tamamlayan ve bu bölümden bağlantı sağlanan bir kat olarak düzenlenir. Zemin katı ticari kullanılmayan konut alanları kapsam dışındadır. Sanayi siteleri hariç diğer yapılarda ait olduğu bağımsız bölümün **1/3'ünden az yapılamaz**.",
        "",
        "| Koşul | Güncel kontrol |",
        "|---|---|",
        "| Bağlantı | Zemin kattaki ait olduğu bağımsız bölümden sağlanır |",
        "| Alan | Sanayi siteleri hariç diğer yapılarda bağımsız bölümün **1/3'ünden az olamaz** |",
        "| İç yükseklik | en az **2,40 m** |",
        "| Yola bakan cephe | merdiven dâhil **3,00 m**'den fazla yaklaşamaz |",
        "| Konut alanı | aynı yol güzergâhındaki mevcut yapılaşmaya göre ilgili idare karar verebilir |",
        "",
        "Bu koşullar birlikte değerlendirilir; yalnız 1/3 hesabını sağlamak asma katı otomatik olarak uygun hale getirmez."
      ),
      subsections: [],
    },
    {
      id: "kat-yuksekligi",
      title: "Asma kat geometrisi Madde 28 kat yüksekliğiyle birlikte çözülmelidir",
      content: phase6Lines(
        "Asma katın kendi **2,40 m** asgari iç yüksekliği bulunurken, asma katlı zemin katın toplam kat yüksekliği de kullanım bölgesine göre Madde 28 ile kontrol edilir. Ticaret ve karma alanlardaki asma katlı zemin kat için **5,50 m** azami kat yüksekliği hükmü önemlidir.",
        "",
        "Kiriş yüksekliği, döşeme kalınlığı, mekanik tesisat ve yangın/kaçış gerekleri bu toplam geometri içinde gerçek kesitte çözülmelidir. 5,50 m kat yüksekliğini iki eşit hacme bölmek yönetmeliğe uygun asma kat tasarımı anlamına gelmez.",
        "",
        "Mühendislik sorumluluğu, mimari kesitte asma kat döşeme kotunu, alt/üst net yükseklikleri ve taşıyıcı sistem derinliğini aynı anda kontrol etmektir."
      ),
      subsections: [],
    },
    {
      id: "emsal-2026",
      title: "1 Temmuz 2026 değişikliği emsal hesabında asma kat boşluğunu ayrıca görünür hale getirdi",
      content: phase6Lines(
        "1 Temmuz 2026 / 33297 değişikliği, emsal harici alanlara ilişkin düzenlemelerde **asma katlı zemin katın içinde yer alan asma kat döşemesi hizasındaki boşluk** ifadesini eklemiştir. Bu hüküm, asma katın bütün alanını otomatik emsal dışı yapan genel bir kural değildir; metindeki kapsam ve diğer emsal hükümleri birlikte okunmalıdır.",
        "",
        "Emsal hesabında döşeme alanı, boşluk, atrium ve bağımsız bölüm alanlarını aynı isimle toplamak hatalıdır. Mimari alan hesabı paftasında her alanın hangi maddeye göre dahil/hariç sayıldığı açıklanmalıdır.",
        "",
        "Yanlış uygulama, 'asma kat emsal dışıdır' gibi tek cümlelik bir varsayımla alan hesabı yapmaktır."
      ),
      subsections: [],
    },
    {
      id: "cekme-kat-karari",
      title: "Çekme kat talebinde karar akışı: plan → plan notu → tanım → yükseklik → emsal → taşıyıcı sistem",
      content: phase6Lines(
        "Projede 'çekme kat' talebi gelirse önce uygulama imar planı ve plan notunda bu kat türünün açıkça düzenlenip düzenlenmediğine bakılır. Düzenleme varsa verilen geri çekilme, yükseklik, alan ve kullanım koşulları aynen projeye taşınır; yoksa sırf terim kullanıldığı için ilave kat hakkı varsayılmaz.",
        "",
        "| Adım | Kontrol |",
        "|---|---|",
        "| 1 | Plan/plan notunda çekme kat veya özel çatı-kat hükmü var mı? |",
        "| 2 | Planın toplam kat adedi / bina yüksekliği aşılır mı? |",
        "| 3 | Emsal ve taban alanı hesabı değişiyor mu? |",
        "| 4 | Kaçış, asansör, erişilebilirlik ve yangın koşulları etkileniyor mu? |",
        "| 5 | Taşıyıcı sistem ve düşey süreklilik proje revizyonu gerektiriyor mu? |",
        "",
        "Bu akış, mimari terimi mühendislik ve ruhsat sonucuna bağlar."
      ),
      subsections: [],
    },
    {
      id: "koordinasyon",
      title: "Asma kat ve özel üst kat çözümleri mimari–statik–yangın–erişilebilirlik koordinasyonudur",
      content: phase6Lines(
        "Asma kat yeni bir döşeme, merdiven, açıklık ve kullanım yükü üretir. Taşıyıcı sistemin düşey elemanları, döşeme diyaframı, merdiven boşluğu, yangın kaçışı ve erişilebilir dolaşım birlikte değerlendirilmeden mimari kat kararı tamamlanmış sayılmaz.",
        "",
        "Özellikle mevcut yapıda sonradan asma kat oluşturulması, yalnız iç mimari tadilat değildir; ruhsat, taşıyıcı sistem ve yangın güvenliği etkileri ayrıca kontrol edilir.",
        "",
        "Sorumluluk matrisi mimar, statik proje müellifi, mekanik/elektrik proje ekibi ve ilgili idare onayını aynı revizyon numarası üzerinde buluşturmalıdır."
      ),
      subsections: [],
    },
    {
      id: "mezzanine-checklist",
      title: "Mühendislik kontrol listesi",
      content: phase6Lines(
        "- [ ] Asma katı **14 Ocak 2026 / 33137** güncel tanımıyla kontrol ettim.",
        "- [ ] Zemin kattaki bağımsız bölümle iç bağlantıyı doğruladım.",
        "- [ ] Gerekli durumda **1/3** alan alt sınırını kontrol ettim.",
        "- [ ] Asma katta en az **2,40 m** iç yüksekliği sağladım.",
        "- [ ] Yola bakan cephede merdiven dâhil **3,00 m** yaklaşma koşulunu kontrol ettim.",
        "- [ ] Madde 28 kapsamında asma katlı zemin katın **5,50 m** toplam kat yüksekliği sınırını proje bağlamında doğruladım.",
        "- [ ] 1 Temmuz 2026 emsal değişikliğinde asma kat döşemesi hizasındaki boşluk hükmünü doğru kapsamda kullandım.",
        "- [ ] 'Çekme kat' için açık plan/plan notu dayanağı olmadan ilave kat hakkı varsaymadım."
      ),
      subsections: [],
    },
  ],
  references: imarPhase6References("Madde 4, Madde 5 ve Madde 28"),
  keywords: ["asma kat", "çekme kat", "1/3", "2,40 m", "3,00 m", "5,50 m", "33137"],
  tags: ["İmar", "Asma Kat", "Çekme Kat", "Mimari Koordinasyon"],
};

export const DEPREM_PHASE6_BATCH_1_ARTICLES = [
  DEPREM_PHASE6_IMAR_HEIGHT,
  DEPREM_PHASE6_IMAR_GARDEN,
  DEPREM_PHASE6_IMAR_MEZZANINE,
] as const;
