import type { ArticleData } from "./articles-data";
import type { DepremSeriesId } from "./deprem-content-types";

const TBDY_PDF = "https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf";
const BUILDING_CONTROL = "https://yapiisleri.csb.gov.tr/yapi-denetimi-daire-baskanligi-mevzuati-90235";
const SOIL_NOTICE = "https://bartin.csb.gov.tr/zemin-ve-temel-etudu-uygulama-esaslari-ve-rapor-formatina-dair-teblig-yayimlandi-haber-238675";
const RISKY_BUILDING = "https://webdosya.csb.gov.tr/db/altyapi/icerikler/r-skl--yapilarin-tesp-t-ed-lmes-ne-il-sk-n-esaslar-20190218134628.pdf";

const RECOVERED_TITLES: Record<string, string> = {
  "kisa-kolon-etkisi-tbdy-2018": "Kısa Kolon Etkisi: Neden Tehlikelidir ve Nasıl Önlenir?",
  "tbdy-tasarim-spektrumu-cizimi": "Tasarım Spektrumu Nasıl Çizilir?",
  "tbdy-mod-birlesim-srss-cqc": "Mod Birleşim Yöntemleri: SRSS ve CQC Karşılaştırması",
  "turkiyede-tarihsel-depremler-ve-yonetmelik-evrimi": "Türkiye'de Tarihsel Depremler ve Yönetmelik Evrimi",
  "1999-marmara-depreminden-cikarilan-muhendislik-dersleri": "1999 Marmara Depremi'nden Çıkarılan Mühendislik Dersleri",
  "betonarme-perde-tasarimi-depremde-tip-ve-boyutlandirma-kurallari": "Betonarme Perde Tasarımı: Tip ve Boyutlandırma Kuralları",
  "duzensiz-binalarda-dinamik-analiz-zorunlulugu": "Düzensiz Binalarda Dinamik Analiz Zorunluluğu",
  "deprem-yuku-ile-ruzgar-yuku-kombinasyonu": "Deprem Yükü ile Rüzgâr Yükünün Birlikte Değerlendirilmesi",
  "mevcut-binalarin-deprem-guvenligi-nasil-degerlendirilir": "Mevcut Binaların Deprem Güvenliği Nasıl Değerlendirilir?",
  "kolon-guclendirme-yontemleri-cfrp-ve-beton-mantolu": "Kolon Güçlendirme Yöntemleri: CFRP ve Beton Mantolama",
  "hasarli-bina-tespiti-yesil-sari-kirmizi-etiket-sistemi": "Deprem Sonrası Hızlı Hasar Tespiti ve Etiket Sistemi",
  "deprem-sigortasi-dask-ve-muhendislik-baglantisi": "Deprem Sigortası ile Yapısal Güvenlik Arasındaki Fark",
  "yatay-yuk-tasima-sistemleri-cerceve-perde-cekirdek": "Yatay Yük Taşıma Sistemleri: Çerçeve, Perde ve Çekirdek",
  "byy-bina-kullanim-siniflari-tehlike-kategorileri": "Bina Kullanım Sınıfları ve Yangın Tehlike Kategorileri",
  "yangin-bolmesi-koridoru-kacis-yolu-boyutlandirma": "Yangın Bölmesi, Koridor ve Kaçış Yolu Boyutlandırması",
  "tasiyici-sistemlerin-yangina-dayanim-suresi-r30-r60-r90-r120": "Taşıyıcı Sistemlerin Yangına Dayanım Süresi: R30–R120",
  "sprinkler-sistemi-zorunluluk-sinirlari": "Sprinkler Sistemi Zorunluluk Sınırları",
  "duman-tahliyesi-mekanik-ve-dogal-sistemler": "Duman Tahliyesi: Mekanik ve Doğal Sistemler",
  "kacis-merdiveni-tasarim-kriterleri": "Kaçış Merdiveni Tasarım Kriterleri",
  "yangin-kapisi-dosleme-duvar-gecis-detaylari": "Yangın Kapısı ile Döşeme ve Duvar Geçiş Detayları",
  "yangin-algilama-ve-ihbar-sistemi-gereksinimleri": "Yangın Algılama ve İhbar Sistemi Gereksinimleri",
  "yuksek-binalarda-ozel-yangin-onlemleri-bolum-9": "Yüksek Binalarda Özel Yangın Önlemleri",
  "bodrum-otopark-mutfak-yangin-uygulamalari": "Bodrum, Otopark ve Mutfaklarda Yangın Uygulamaları",
  "otopark-kullanim-turune-gore-minimum-alan-hesabi": "Kullanım Türüne Göre Minimum Otopark Alanı",
  "otopark-rampa-egimi-genislik-donus-yaricapi": "Otopark Rampası: Eğim, Genişlik ve Dönüş Yarıçapı",
  "otopark-kapali-havalandirma-co-konsantrasyonu": "Kapalı Otoparklarda Havalandırma ve CO Kontrolü",
  "otopark-yapisal-yuk-kombinasyonlari-arac-deprem": "Otoparklarda Araç ve Deprem Yükü Birleşimleri",
  "otopark-elektrikli-arac-sarj-mevzuati": "Otoparklarda Elektrikli Araç Şarj Mevzuatı",
  "imar-taks-kaks-emsal-hesabi": "TAKS, KAKS ve Emsal Hesabı",
  "imar-kat-yuksekligi-bina-yuksekligi-farki": "Kat Yüksekliği ile Bina Yüksekliği Arasındaki Fark",
  "imar-bahce-mesafeleri-on-arka-yan-bahce-kurallari": "Ön, Arka ve Yan Bahçe Mesafeleri",
  "imar-bodrum-kat-mevzuati-teknik-hacim-iskan-taban-alani": "Bodrum Katlarda Teknik Hacim, İskân ve Taban Alanı",
  "imar-cekme-kat-asma-kat-kosullari": "Çekme Kat ve Asma Kat Koşulları",
  "imar-balkon-cikma-sacak-emsal-disi-sartlari": "Balkon, Çıkma ve Saçakların Emsal Dışı Kalma Koşulları",
  "imar-ruhsat-sureci-basvurudan-iskan-kadar": "Başvurudan İskâna Yapı Ruhsatı Süreci",
  "imar-parsel-tevhid-ifraz-prosedurleri": "Parsel Tevhit ve İfraz Prosedürleri",
  "imar-plan-notu-celiskisi-uygulama-onceligi": "Plan Notu Çelişkilerinde Uygulama Önceliği",
  "bep-isi-yalitim-u-degeri-yogusma-kontrolu": "Isı Yalıtımında U Değeri ve Yoğuşma Kontrolü",
  "bep-ts-825-yontemi-isi-kaybi-hesabi": "TS 825 Yöntemiyle Isı Kaybı Hesabı",
  "bep-enerji-kimlik-belgesi-a-g-siniflandirma": "Enerji Kimlik Belgesi: A–G Sınıflandırması",
  "bep-yenilenebilir-enerji-zorunlulugu-1000m2": "Binalarda Yenilenebilir Enerji Zorunluluğu",
  "bep-yazilimi-hesaplama-akisi": "BEP-TR Yazılımında Hesaplama Akışı",
  "bep-isil-kopru-detaylari-ve-cozum-yontemleri": "Isıl Köprü Detayları ve Çözüm Yöntemleri",
  "zemin-etudu-minimum-sondaj-sayisi-ve-derinligi": "Zemin Etüdünde Sondaj Sayısı ve Derinliği",
  "tbdy-bolum-16-zemin-yapi-etkilesimi": "TBDY Bölüm 16: Zemin-Yapı Etkileşimi",
  "zemin-sivlasma-riski-degerlendirmesi": "Zemin Sıvılaşma Riskinin Değerlendirilmesi",
  "su-yalitimi-ts-4749-uygulama-detaylari": "Su Yalıtımı ve Uygulama Detayları",
  "yagmur-suyu-drenaji-ve-sizma-tesisi-hesabi": "Yağmur Suyu Drenajı ve Sızdırma Tesisi Hesabı",
  "engelsiz-tekerlekli-sandalye-manevra-alani-koridor-genislikleri": "Tekerlekli Sandalye Manevra Alanı ve Koridor Genişlikleri",
  "engelsiz-rampa-egimi-korkuluk-yuzey-standartlari": "Engelsiz Rampalarda Eğim, Korkuluk ve Yüzey Standartları",
  "engelsiz-wc-asansor-kapi-boyutlari": "Engelsiz WC, Asansör ve Kapı Boyutları",
  "engelsiz-yapi-ruhsatinda-uyum-kontrolu": "Yapı Ruhsatında Erişilebilirlik Uyum Kontrolü",
  "eurocode-ts-en-1990-yuk-kombinasyonlari-ve-guvenlik-katsayilari": "TS EN 1990: Yük Birleşimleri ve Güvenlik Katsayıları",
  "eurocode-ts-en-1991-1-1-hareketli-yukler-bolume-gore-degerler": "TS EN 1991-1-1: Kullanım Alanlarına Göre Hareketli Yükler",
  "eurocode-ts-en-1991-1-3-kar-yuku-hesabi-bolge-haritasi-ile": "TS EN 1991-1-3: Kar Yükü Hesabı",
  "eurocode-ts-en-1991-1-4-ruzgar-yuku-hesabi-turkiye-bolgeleri": "TS EN 1991-1-4: Rüzgâr Yükü Hesabı",
  "eurocode-ts-en-1992-1-1-ec2-ts-500-ile-karsilastirmali-analiz": "TS EN 1992-1-1 ile TS 500'ün Karşılaştırılması",
  "akustik-ts-en-iso-12354-ile-yalitim-hesabi": "TS EN ISO 12354 ile Ses Yalıtımı Hesabı",
  "asansor-boslugu-boyutlandirma-kapasite-alan-tablosu": "Asansör Kuyusu Boyutlandırması ve Kapasite",
  "asansor-makine-daireli-ve-dairesiz-sistemler": "Makine Daireli ve Makine Dairesiz Asansörler",
  "asansor-guvenlik-aksesuarlari-ve-periyodik-bakim-zorunlulugu": "Asansör Güvenlik Aksesuarları ve Periyodik Bakım",
  "asansor-deprem-sirasinda-otomatik-park-ozelligi": "Deprem Sırasında Asansör Otomatik Park Özelliği",
  "isg-santiye-guvenlik-plani-zorunlu-icerik": "Şantiye Güvenlik Planının Zorunlu İçeriği",
  "isg-uzmani-gorevlendirme-tehlike-sinifi-isci-sayisi": "İSG Uzmanı Görevlendirme Koşulları",
  "isg-yuksekte-calisma-ve-iskele-guvenligi": "Yüksekte Çalışma ve İskele Güvenliği",
  "isg-kazi-guvenligi-iksa-tasarimi-ve-kontrol": "Kazı Güvenliği, İksa Tasarımı ve Kontrolü",
  "isg-beton-dokumunde-topraklama-ve-elektrik-guvenligi": "Beton Dökümünde Topraklama ve Elektrik Güvenliği",
  "cevre-ced-zorunlulugu-proje-buyuklugu-esikleri": "ÇED Zorunluluğu ve Proje Eşikleri",
  "cevre-insaat-atigi-yonetimi-yonetmeligi": "İnşaat ve Yıkıntı Atıklarının Yönetimi",
  "cevre-gurultu-ve-toz-santiye-yukumlulukleri": "Şantiyede Gürültü ve Toz Yükümlülükleri",
  "cevre-yagmur-suyu-kirliligi-ve-santiye-filtrasyonu": "Şantiye Yağmur Suyu Kirliliği ve Filtrasyon",
};

const SERIES_META: Record<DepremSeriesId, { category: string; color: string; badge: string; description: string; checks: [string, string, string]; source: { label: string; href: string } }> = {
  tbdy: { category: "TBDY 2018 Rehberi", color: "bg-red-600 text-white", badge: "TBDY 2018", description: "TBDY 2018 kapsamındaki analiz, sistem ve deprem tasarımı kararlarını açıklar.", checks: ["Kullanılan yönetmelik maddesini ve proje kabulünü belirleyin.", "Hesap modeli ile uygulama projesinin aynı kararı yansıttığını doğrulayın.", "Sonucu ilgili sınır ve yük birleşimleriyle kontrol edin."], source: { label: "AFAD — Türkiye Bina Deprem Yönetmeliği 2018", href: TBDY_PDF } },
  "tbdy-betonarme": { category: "TBDY Betonarme Detayları", color: "bg-orange-600 text-white", badge: "TBDY Bölüm 7", description: "Betonarme elemanın deprem davranışı ve detaylandırma gereklerini ele alır.", checks: ["Eleman geometrisini ve iç kuvvetlerini doğrulayın.", "Süneklik ve kapasite tasarımı koşullarını kontrol edin.", "Donatı detayını hesapla ve birleşen elemanlarla eşleştirin."], source: { label: "AFAD — TBDY 2018, Bölüm 7", href: TBDY_PDF } },
  ts500: { category: "TS 500 Betonarme", color: "bg-blue-600 text-white", badge: "TS 500", description: "Betonarme taşıma gücü, kullanılabilirlik ve donatı hesabındaki temel kontrolleri açıklar.", checks: ["Tasarım kuvvetini doğru yük birleşiminden alın.", "Kesit kapasitesi ve minimum-maksimum donatı sınırlarını kontrol edin.", "Hesap donatısını uygulanabilir pafta detayına dönüştürün."], source: { label: "ÇŞİDB — Betonarme İşleri Genel Teknik Şartnamesi", href: "https://webdosya.csb.gov.tr/db/yfk/icerikler/c18---betonarme-isler--20190412161656.pdf" } },
  "mevcut-guclendirme": { category: "Mevcut Binalar ve Güçlendirme", color: "bg-fuchsia-700 text-white", badge: "TBDY Bölüm 15", description: "Mevcut binanın veri toplama, performans ve güçlendirme sürecini açıklar.", checks: ["Geometri ve malzeme verisini sahada doğrulayın.", "Değerlendirme yöntemini amaç ve bilgi düzeyine göre seçin.", "Güçlendirme kararını temel dahil bütün yük yoluyla kontrol edin."], source: { label: "AFAD — TBDY 2018, Bölüm 15", href: TBDY_PDF } },
  "yapi-denetimi": { category: "Yapı Denetimi ve Malzeme", color: "bg-amber-600 text-zinc-950", badge: "Saha Kontrolü", description: "Proje, malzeme ve uygulama kontrollerini yapı denetimi süreci içinde ele alır.", checks: ["Belge ile sahadaki imalatı eşleştirin.", "Uygunsuzluğu döküm veya kapatma öncesi kayıt altına alın.", "Kabul sonucunu parti, eleman ve deney kaydıyla izlenebilir tutun."], source: { label: "ÇŞİDB — Yapı Denetimi Mevzuatı", href: BUILDING_CONTROL } },
  yangin: { category: "Yangın Yönetmeliği", color: "bg-orange-700 text-white", badge: "Yangın", description: "Yangın güvenliği kararını kullanım, kaçış ve koruma sistemi açısından özetler.", checks: ["Bina kullanım ve tehlike sınıfını belirleyin.", "Kaçış ve kompartıman sürekliliğini kontrol edin.", "Mimari, mekanik ve taşıyıcı sistem kararlarını birlikte doğrulayın."], source: { label: "ÇŞİDB — Mesleki Hizmetler Genel Müdürlüğü", href: "https://meslekihizmetler.csb.gov.tr/" } },
  otopark: { category: "Otopark Yönetmeliği", color: "bg-slate-700 text-white", badge: "Otopark", description: "Otopark planlama, dolaşım ve teknik sistem koşullarını özetler.", checks: ["Kullanım türü ve araç kapasitesini belirleyin.", "Rampa, dönüş ve dolaşım geometrisini kontrol edin.", "Havalandırma, yangın ve taşıyıcı yükleri projeler arasında eşleştirin."], source: { label: "ÇŞİDB — Mesleki Hizmetler Genel Müdürlüğü", href: "https://meslekihizmetler.csb.gov.tr/" } },
  imar: { category: "İmar Mevzuatı", color: "bg-emerald-700 text-white", badge: "İmar", description: "Planlı alanlardaki yapılaşma ve ruhsat kararlarını uygulanabilir biçimde özetler.", checks: ["Plan, plan notu ve yönetmelik sırasını doğrulayın.", "Parsel ve yapı ölçülerini güncel belge üzerinden hesaplayın.", "Kararı ruhsat eki projelerin tamamında tutarlı gösterin."], source: { label: "ÇŞİDB — Mesleki Hizmetler Genel Müdürlüğü", href: "https://meslekihizmetler.csb.gov.tr/" } },
  bep: { category: "BEP-TR / TS 825", color: "bg-lime-600 text-zinc-950", badge: "Enerji", description: "Bina kabuğu ve enerji performansı hesabındaki temel kararları açıklar.", checks: ["İklim ve kullanım verisini doğrulayın.", "Kabuk katmanları ile hesap girdilerini eşleştirin.", "Isı köprüsü, yoğuşma ve belge sonucunu birlikte kontrol edin."], source: { label: "ÇŞİDB — Mesleki Hizmetler Genel Müdürlüğü", href: "https://meslekihizmetler.csb.gov.tr/" } },
  "su-zemin": { category: "Zemin, Temel ve Su", color: "bg-cyan-700 text-white", badge: "Zemin ve Temel", description: "Zemin, temel, drenaj ve su etkilerine ilişkin proje kararlarını açıklar.", checks: ["Arazi ve rapor verisini proje yeriyle doğrulayın.", "Geoteknik parametreyi doğru sınır durumda kullanın.", "Üstyapı, temel ve su kontrolü arasındaki veri aktarımını denetleyin."], source: { label: "ÇŞİDB — Zemin ve Temel Etüdü Tebliği", href: SOIL_NOTICE } },
  engelsiz: { category: "Engelsiz Tasarım", color: "bg-violet-700 text-white", badge: "Erişilebilirlik", description: "Erişilebilir dolaşım ve mekân ölçülerini proje kontrolü açısından özetler.", checks: ["Kesintisiz erişilebilir güzergâhı plan üzerinde izleyin.", "Net ölçüleri kapı kanadı ve donatılarla birlikte kontrol edin.", "Rampa, asansör ve ıslak hacim detaylarını kesitlerle doğrulayın."], source: { label: "ÇŞİDB — Mesleki Hizmetler Genel Müdürlüğü", href: "https://meslekihizmetler.csb.gov.tr/" } },
  eurocode: { category: "Eurocode Standartları", color: "bg-indigo-700 text-white", badge: "Eurocode", description: "İlgili Eurocode standardının kapsamını ve Türkiye'deki proje kullanımını açıklar.", checks: ["Standardın güncel baskı ve ulusal ek durumunu doğrulayın.", "Yük ve güvenlik katsayılarını seçilen standarda göre tutarlı uygulayın.", "TS 500 ve TBDY ile birlikte kullanım sınırını proje raporunda belirtin."], source: { label: "Türk Standardları Enstitüsü", href: "https://www.tse.org.tr/" } },
  akustik: { category: "Akustik ve Gürültü", color: "bg-zinc-700 text-white", badge: "Akustik", description: "Bina elemanlarında hava ve darbe sesi performansını özetler.", checks: ["Hedef performansı kullanım türüne göre belirleyin.", "Duvar ve döşeme birleşimlerinden yan geçişleri kontrol edin.", "Laboratuvar değeri ile yerindeki beklenen performansı ayırın."], source: { label: "ÇŞİDB — Mesleki Hizmetler Genel Müdürlüğü", href: "https://meslekihizmetler.csb.gov.tr/" } },
  asansor: { category: "Asansör Yönetmeliği", color: "bg-teal-700 text-white", badge: "Asansör", description: "Asansör kuyusu, güvenlik ve işletme koşullarını özetler.", checks: ["Kapasite ve kullanım senaryosunu belirleyin.", "Kuyu, kapı ve güvenlik boşluklarını proje üzerinden kontrol edin.", "Bakım, enerji kesintisi ve acil durum işlevlerini doğrulayın."], source: { label: "Sanayi ve Teknoloji Bakanlığı", href: "https://www.sanayi.gov.tr/" } },
  isg: { category: "İSG ve Şantiye Güvenliği", color: "bg-amber-700 text-white", badge: "İSG", description: "Şantiye riskini iş programı, ekipman ve saha kontrolüyle birlikte ele alır.", checks: ["Tehlikeyi işe başlamadan önce saha özelinde tanımlayın.", "Toplu koruma, erişim ve ekipman kontrollerini belgeleyin.", "Değişen iş programına göre risk değerlendirmesini güncelleyin."], source: { label: "Çalışma ve Sosyal Güvenlik Bakanlığı", href: "https://www.csgb.gov.tr/" } },
  cevre: { category: "Çevre Mevzuatı", color: "bg-green-700 text-white", badge: "Çevre", description: "Şantiye ve proje kaynaklı çevresel yükümlülükleri özetler.", checks: ["Faaliyet ve proje eşiğini güncel mevzuattan doğrulayın.", "Atık, su, toz ve gürültü akışlarını saha planında gösterin.", "Taşıma, ölçüm ve bertaraf kayıtlarını izlenebilir tutun."], source: { label: "ÇŞİDB — Çevre Yönetimi Genel Müdürlüğü", href: "https://cygm.csb.gov.tr/" } },
};

function inferExistingSeriesId(slug: string): DepremSeriesId {
  if (slug.startsWith("ts500-")) return "ts500";
  if (["kisa-kolon-etkisi-tbdy-2018", "tbdy-2018-guclu-kolon-kontrolu", "betonarme-perde-tasarimi-depremde-tip-ve-boyutlandirma-kurallari"].includes(slug)) return "tbdy-betonarme";
  if (["mevcut-binalarin-deprem-guvenligi-nasil-degerlendirilir", "kolon-guclendirme-yontemleri-cfrp-ve-beton-mantolu", "hasarli-bina-tespiti-yesil-sari-kirmizi-etiket-sistemi"].includes(slug)) return "mevcut-guclendirme";
  if (/^(byy-|yangin-|tasiyici-sistemlerin-yangina-|sprinkler-|duman-|kacis-|yuksek-binalarda-|bodrum-otopark-mutfak-)/.test(slug)) return "yangin";
  if (slug.startsWith("otopark-")) return "otopark";
  if (slug.startsWith("imar-")) return "imar";
  if (slug.startsWith("bep-")) return "bep";
  if (/^(zemin-|su-yalitimi-|yagmur-suyu-|tbdy-bolum-16-)/.test(slug)) return "su-zemin";
  if (slug.startsWith("engelsiz-")) return "engelsiz";
  if (slug.startsWith("eurocode-")) return "eurocode";
  if (slug.startsWith("akustik-")) return "akustik";
  if (slug.startsWith("asansor-")) return "asansor";
  if (slug.startsWith("isg-")) return "isg";
  if (slug.startsWith("cevre-")) return "cevre";
  return "tbdy";
}

function shouldRecoverBody(article: ArticleData): boolean {
  return Boolean(RECOVERED_TITLES[article.slug]) && ![
    "kisa-kolon-etkisi-tbdy-2018",
    "tbdy-tasarim-spektrumu-cizimi",
    "tbdy-mod-birlesim-srss-cqc",
  ].includes(article.slug);
}

export function normalizeExistingDepremArticle(article: ArticleData): ArticleData {
  if (article.sectionId !== "deprem-yonetmelik") return article;

  const seriesId = inferExistingSeriesId(article.slug);
  const meta = SERIES_META[seriesId];
  const title = RECOVERED_TITLES[article.slug] ?? article.title;
  const base: ArticleData = {
    ...article,
    title,
    seoTitle: article.seoTitle ? `${title} | Mühendis Mimar Portalı` : article.seoTitle,
    seriesId,
    category: meta.category,
    categoryColor: meta.color,
    badgeLabel: meta.badge,
  };

  if (!shouldRecoverBody(article)) return base;

  const description = `${title}, ilgili mevzuatın kapsamı ve uygulamadaki temel proje kontrolleri üzerinden ele alınır.`;
  const references: NonNullable<ArticleData["references"]> = [{ label: meta.source.label, href: meta.source.href }];
  if (seriesId === "mevcut-guclendirme") references.push({ label: "Riskli Yapıların Tespit Edilmesine İlişkin Esaslar", href: RISKY_BUILDING });

  return {
    ...base,
    description,
    seoDescription: description,
    author: "Mühendis Mimar Portalı",
    authorTitle: "Teknik İçerik Ekibi",
    updatedAt: "11 Ağustos 2026",
    readTime: "3 dk",
    quote: undefined,
    keywords: Array.from(new Set([...(article.keywords ?? []).filter((keyword) => !/[?ÃÄÅÂ�]/.test(keyword)), meta.badge, meta.category])),
    tags: [meta.badge, meta.category],
    sections: [
      { id: "kapsam", title: "Kapsam", content: `${description}\n\n${meta.description}`, subsections: [] },
      { id: "proje-kontrolleri", title: "Proje kontrolleri", content: meta.checks.map((check) => `- ${check}`).join("\n"), subsections: [] },
      { id: "dayanak", title: "Mevzuat dayanağı", content: `Ana kaynak **${meta.source.label}** metnidir. Projede kullanılan sürüm, madde ve yerel idare kararları güncel resmî belge üzerinden doğrulanmalıdır.`, subsections: [] },
    ],
    references,
  };
}
