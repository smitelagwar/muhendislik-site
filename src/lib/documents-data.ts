export type DocumentCategory = "all" | "santiye-tutanak" | "taahhutname" | "dilekce";

export interface DocumentFormField {
  key: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  type?: "text" | "textarea" | "date";
  required?: boolean;
}

export interface DocumentItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: DocumentCategory;
  categoryLabel: string;
  badge: string;
  fileSize: string;
  downloadUrl: string;
  studioUrl: string;
  updatedAt: string;
  tags: string[];
  targetAudience: string;
  usageGuide: string;
  legalReference?: string;
  fields: DocumentFormField[];
  defaultValues: Record<string, string>;
  generatePreviewText?: (values: Record<string, string>) => string;
}

export const DOCUMENT_CATEGORIES: Array<{ id: DocumentCategory; label: string; count?: number }> = [
  { id: "all", label: "Tüm Belgeler" },
  { id: "santiye-tutanak", label: "Şantiye & Tutanaklar" },
  { id: "taahhutname", label: "Taahhütnameler" },
  { id: "dilekce", label: "Dilekçeler & Başvurular" },
];

export const DOCUMENTS: DocumentItem[] = [
  {
    id: "beton-dokum-tutanagi",
    title: "Beton Döküm Tutanağı",
    subtitle: "Şantiye Beton Döküm & Kalite Kontrol Formu",
    description:
      "Şantiyede hazır beton dökümü öncesi ve döküm esnasında kalıp, donatı, mikser irsaliyesi, slump deneyi ve numune alma işlemlerini resmi olarak kayıt altına alan düzenlenebilir tutanak formu.",
    category: "santiye-tutanak",
    categoryLabel: "Şantiye & Tutanak",
    badge: "Düzenlenebilir PDF Form",
    fileSize: "1.75 MB",
    downloadUrl: "/belgeler/beton-dokum-tutanagi.pdf",
    studioUrl: "/belgeler/beton-dokum-tutanagi",
    updatedAt: "2026",
    tags: ["beton", "döküm", "tutanak", "şantiye", "yapı denetim", "slump", "numune", "irsaliye", "kalıp", "donatı", "c30", "c35"],
    targetAudience: "Şantiye Şefleri, Yapı Denetim Mühendisleri, Saha Mühendisleri",
    usageGuide:
      "Beton dökümünden önce kalıp ve donatı teslimi tamamlandığında; döküm esnasında mikser geliş saati, slump değeri, hava sıcaklığı ve alınan numune adedi şantiye şefi, yapı denetim temsilcisi ve laboratuvar teknikeri tarafından imzalanarak dosyalanır.",
    legalReference: "TS 500 & TS EN 206 / Yapı Denetimi Uygulama Yönetmeliği",
    fields: [
      { key: "tutanak_alt_baslik", label: "Tutanak Alt Başlığı", placeholder: "Beton Dökümü Sistem Onay Sorunu" },
      { key: "tarih", label: "Tarih", placeholder: "10.08.2026", type: "text" },
      { key: "yer", label: "Şantiye Yeri", placeholder: "YOZGAT İli AKDAĞMADENİ İlçesi İSTANBULLUOĞLU Mahallesi 666 ada 6 parsel" },
      { key: "yibf", label: "YİBF No", placeholder: "1234567" },
      { key: "olay_aciklamasi", label: "Olay Açıklaması", placeholder: "Yukarıda belirtilen şantiye adresinde gerçekleştirilen beton dökümü sırasında...", type: "textarea" },
      { key: "gozlem_notlar", label: "Gözlem ve Notlar", placeholder: "Beton dökümü gerçekleştirilmiştir. E-Devlet giriş sorunu nedeniyle sistem üzerinden onay işlemi yapılamamıştır.", type: "textarea" },
      { key: "laboratuvar", label: "1. Laboratuvar", placeholder: "MEREN BETON LABORATUVAR HİZMETLERİ SAN. VE TİC. LTD. ŞTİ" },
      { key: "muteahhit", label: "2. Müteahhit", placeholder: "ABC İNŞAAT" },
      { key: "santiye_sefi", label: "3. Şantiye Şefi", placeholder: "İnş. Müh. Hüseyin GÜNAYDIN" },
      { key: "yapi_denetim", label: "4. Yapı Denetim", placeholder: "XYZ YAPI DENETİM LTD. ŞTİ." },
    ],
    defaultValues: {
      tutanak_alt_baslik: "Beton Dökümü Sistem Onay Sorunu",
      tarih: "10.08.2026",
      yer: "YOZGAT İli AKDAĞMADENİ İlçesi İSTANBULLUOĞLU Mahallesi 666 ada 6 parsel",
      yibf: "1234567",
      olay_aciklamasi:
        "Yukarıda belirtilen şantiye adresinde gerçekleştirilen beton dökümü sırasında, E-Devlet sisteminden kaynaklanan hata nedeniyle; şantiye şefi olarak beton dökümü mahallinde hazır bulunmama rağmen sistem üzerinden gerekli onay işlemi gerçekleştirilememiştir.",
      gozlem_notlar:
        "Beton dökümü gerçekleştirilmiştir. E-Devlet giriş sorunu nedeniyle sistem üzerinden onay işlemi yapılamamıştır.",
      laboratuvar: "MEREN BETON LABORATUVAR HİZMETLERİ SAN. VE TİC. LTD. ŞTİ",
      muteahhit: "ABC İNŞAAT",
      santiye_sefi: "İnş. Müh. Hüseyin GÜNAYDIN",
      yapi_denetim: "XYZ YAPI DENETİM LTD. ŞTİ.",
    },
    generatePreviewText: (values) => `
T.C. ÇEVRE, ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ BAKANLIĞI
YAPI DENETİMİ VE ŞANTİYE BETON DÖKÜM TUTANAĞI

Tutanak Konusu : ${values.tutanak_alt_baslik || "Beton Döküm Tutanağı"}
Döküm Tarihi   : ${values.tarih || "-"}
Şantiye Yeri   : ${values.yer || "-"}
YİBF No        : ${values.yibf || "-"}

YAPILAN İŞLEM VE ELEMAN BİLGİSİ:
${values.olay_aciklamasi || "Belirtilmedi"}

GÖZLEM, SLUMP VE NUMUNE KONTROLLERİ:
${values.gozlem_notlar || "Kalıp, donatı ve vibrasyon kontrolleri mevzuata uygun şekilde tamamlanmıştır."}

TARAFLAR VE İMZALAR:
Laboratuvar Görevlisi : ${values.laboratuvar || "........................"}
Müteahhit / Temsilci  : ${values.muteahhit || "........................"}
Şantiye Şefi         : ${values.santiye_sefi || "........................"}
Yapı Denetim Görevlisi: ${values.yapi_denetim || "........................"}
    `.trim(),
  },
  {
    id: "santiye-sefi-taahhutnamesi",
    title: "Şantiye Şefi Taahhütnamesi",
    subtitle: "Görev Üstlenme & Yasal Sorumluluk Formu",
    description:
      "Yapı ruhsatı düzenlenmesi aşamasında ilgili idareye (Belediye veya İl Özel İdaresi) ve Yapı Denetim Kuruluşu'na sunulması zorunlu olan resmî şantiye şefliği taahhütname belgesi.",
    category: "taahhutname",
    categoryLabel: "Taahhütname",
    badge: "Düzenlenebilir PDF Form",
    fileSize: "1.14 MB",
    downloadUrl: "/belgeler/santiye-sefi-taahhutnamesi.pdf",
    studioUrl: "/belgeler/santiye-sefi-taahhutnamesi",
    updatedAt: "2026",
    tags: ["şantiye şefi", "taahhütname", "ruhsat", "belediye", "yapı denetim", "mimarlar odası", "imo", "yibf", "imar"],
    targetAudience: "Şantiye Şefleri, Mimarlar, İnşaat Mühendisleri, Yapı Müteahhitleri",
    usageGuide:
      "Şantiye şefliği üstlenilen yapının ruhsat alma sürecinde eksiksiz doldurulup ıslak/elektronik imza ile belediye imar müdürlüğüne ve yapı denetim firmasına teslim edilir.",
    legalReference: "3194 Sayılı İmar Kanunu & Şantiye Şefleri Hakkında Yönetmelik",
    fields: [
      { key: "santiye_sefi_ad_soyad", label: "Şantiye Şefi Adı Soyadı", placeholder: "Örn: Ahmet Yılmaz" },
      { key: "unvan", label: "Meslek / Unvan", placeholder: "Örn: İnşaat Mühendisi / Mimar" },
      { key: "oda_sicil_no", label: "Oda Sicil Numarası", placeholder: "Örn: 98765" },
      { key: "tc_kimlik_no", label: "T.C. Kimlik Numarası", placeholder: "Örn: 12345678901" },
      { key: "telefon", label: "İletişim Telefonu", placeholder: "Örn: 0532 000 00 00" },
      { key: "adres", label: "Tebligat Adresi", placeholder: "Örn: Atatürk Mah. İnönü Cad. No:10 Çankaya/Ankara" },
      { key: "il_ilce", label: "Yapının Bulunduğu İl / İlçe", placeholder: "Örn: Ankara / Çankaya" },
      { key: "ilgili_idare", label: "İlgili İdare (Belediye / Özel İdare)", placeholder: "Örn: Çankaya Belediye Başkanlığı İmar ve Şehircilik Müdürlüğü" },
      { key: "pafta_ada_parsel", label: "Pafta / Ada / Parsel Bilgisi", placeholder: "Örn: Pafta: 14, Ada: 1024, Parsel: 6" },
      { key: "yapi_adresi", label: "Yapı Adresi", placeholder: "Örn: Meşrutiyet Mah. Karanfil Sok. No:45" },
      { key: "yapi_sahibi", label: "Yapı Sahibi (Gerçek/Tüzel Kişi)", placeholder: "Örn: Özkan Yapı İnşaat A.Ş." },
      { key: "yapi_sahibi_adresi", label: "Yapı Sahibi Adresi", placeholder: "Örn: Kızılay Mah. Gazi Mustafa Kemal Bulv. No:12" },
      { key: "tarih", label: "Taahhüt Tarihi", placeholder: "Örn: 16.08.2026" },
    ],
    defaultValues: {
      santiye_sefi_ad_soyad: "",
      unvan: "İnşaat Mühendisi",
      oda_sicil_no: "",
      tc_kimlik_no: "",
      telefon: "",
      adres: "",
      il_ilce: "İstanbul / Kadıköy",
      ilgili_idare: "Kadıköy Belediye Başkanlığı İmar ve Şehircilik Müdürlüğü",
      pafta_ada_parsel: "Ada: 1045, Parsel: 12",
      yapi_adresi: "Fenerbahçe Mah. Bağdat Cad. No: 120",
      yapi_sahibi: "",
      yapi_sahibi_adresi: "",
      tarih: new Date().toLocaleDateString("tr-TR"),
    },
    generatePreviewText: (values) => `
${(values.ilgili_idare || "İLGİLİ BELEDİYE BAŞKANLIĞI").toLocaleUpperCase("tr-TR")}
İMAR VE ŞEHİRCİLİK MÜDÜRLÜĞÜ'NE

ŞANTİYE ŞEFLİĞİ TAAHHÜTNAMESİ

Yapı Sahibi      : ${values.yapi_sahibi || "-"}
Yapı Adresi      : ${values.yapi_adresi || "-"}
Tapu Kaydı       : ${values.pafta_ada_parsel || "-"} (${values.il_ilce || "-"})

Yukarıda tapu kaydı ve adresi belirtilen inşaatın şantiye şefliği görevini 3194 sayılı İmar Kanunu, Şantiye Şefleri Hakkında Yönetmelik ve ilgili mevzuat hükümleri uyarınca üstlendiğimi; yapının ruhsat ve eklerine, fen ve sanat kurallarına, iş sağlığı ve güvenliği şartlarına uygun olarak yürütülmesinden sorumlu olacağımı beyan ve taahhüt ederim.

ŞANTİYE ŞEFİ BİLGİLERİ:
Adı Soyadı       : ${values.santiye_sefi_ad_soyad || "........................"}
Unvanı / Mesleği : ${values.unvan || "-"}
Oda Sicil No     : ${values.oda_sicil_no || "-"}
T.C. Kimlik No   : ${values.tc_kimlik_no || "-"}
Telefon          : ${values.telefon || "-"}
Adres            : ${values.adres || "-"}
Tarih            : ${values.tarih || "-"}

İmza:
    `.trim(),
  },
  {
    id: "santiye-sefi-istifa-dilekcesi",
    title: "Şantiye Şefi İstifa Dilekçesi",
    subtitle: "Resmî Görevden Ayrılma & İdareye Bildirim Dilekçesi",
    description:
      "Şantiye şefliği görevinden çekilme / istifa halinde; 3194 sayılı İmar Kanunu ve Şantiye Şefleri Hakkında Yönetmelik gereği ilgili belediyeye veya il müdürlüğüne sunulan yasal dilekçe şablonu.",
    category: "dilekce",
    categoryLabel: "Dilekçe & Başvuru",
    badge: "Düzenlenebilir PDF Form",
    fileSize: "1.76 MB",
    downloadUrl: "/belgeler/santiye-sefi-istifa-dilekcesi.pdf",
    studioUrl: "/belgeler/santiye-sefi-istifa-dilekcesi",
    updatedAt: "2026",
    tags: ["şantiye şefi", "istifa", "dilekçe", "belediye", "yapı kontrol", "imar kanunu", "görevden ayrılma", "ayrılış"],
    targetAudience: "Şantiye Şefleri, Mühendisler, Mimarlar",
    usageGuide:
      "Görevden ayrılma tarihi itibarıyla noter ihtarnamesi veya doğrudan idare evrak kayıt biriminden tarih-sayı alınarak ilgili idareye teslim edilmeli; bir kopyası da Yapı Denetim Kuruluşu'na iletilmelidir.",
    legalReference: "Şantiye Şefleri Hakkında Yönetmelik Madde 7/4",
    fields: [
      { key: "hitap_1", label: "İlgili Belediye / İdare", placeholder: "Örn: KADIKÖY BELEDİYE BAŞKANLIĞI" },
      { key: "hitap_2", label: "İlgili Birim / Müdürlük", placeholder: "Örn: İmar ve Şehircilik Müdürlüğü / Yapı Kontrol Müdürlüğü'ne" },
      { key: "ana_paragraf", label: "İstifa & Proje Açıklama Metni", placeholder: "Örn: İlçeniz sınırları dahilinde bulunan ... ada ... parsel sayılı taşınmaz üzerindeki inşaatın şantiye şefliği görevinden gördüğüm lüzum üzerine ... tarihi itibarıyla istifa etmiş bulunmaktayım.", type: "textarea" },
      { key: "sonuc_cumlesi", label: "Sonuç & Talep Cümlesi", placeholder: "Örn: Şantiye şefliği kaydımın sistemden düşürülerek gereğinin yapılmasını saygılarımla arz ederim." },
      { key: "tarih", label: "Dilekçe Tarihi", placeholder: "Örn: 16.08.2026" },
      { key: "ad_soyad", label: "Şantiye Şefi Adı Soyadı", placeholder: "Örn: İnş. Müh. Ahmet Yılmaz" },
      { key: "tc_deger", label: "T.C. Kimlik Numarası", placeholder: "Örn: 12345678901" },
      { key: "iletisim_deger", label: "İletişim Telefonu & E-Posta", placeholder: "Örn: 0532 123 45 67 - ahmet@ornek.com" },
      { key: "adres_deger", label: "Tebligat Adresi", placeholder: "Örn: Caferağa Mah. Moda Cad. No:24 D:5 Kadıköy/İstanbul", type: "textarea" },
    ],
    defaultValues: {
      hitap_1: "KADIKÖY BELEDİYE BAŞKANLIĞI",
      hitap_2: "İmar ve Şehircilik Müdürlüğü'ne",
      ana_paragraf: "İlçeniz sınırları dahilinde bulunan 1024 Ada, 12 Parsel sayılı taşınmaz üzerinde yürütülen inşaatın şantiye şefliği görevinden gördüğüm lüzum üzerine istifa etmiş bulunmaktayım.",
      sonuc_cumlesi: "Şantiye şefliği kaydımın sistemden düşürülerek ilgili yapı denetim ve müteahhitlik kayıtlarına işlenmesini saygılarımla arz ederim.",
      tarih: new Date().toLocaleDateString("tr-TR"),
      ad_soyad: "",
      tc_deger: "",
      iletisim_deger: "",
      adres_deger: "",
    },
    generatePreviewText: (values) => `
${(values.hitap_1 || "BELEDİYE BAŞKANLIĞI").toLocaleUpperCase("tr-TR")}
${values.hitap_2 || "İmar ve Şehircilik Müdürlüğü'ne"}

KONU: Şantiye Şefliği Görevinden İstifa Bildirimi

${values.ana_paragraf || "İlgili parseldeki inşaatın şantiye şefliği görevinden gördüğüm lüzum üzerine istifa etmiş bulunmaktayım."}

${values.sonuc_cumlesi || "Gereğinin yapılmasını saygılarımla arz ve talep ederim."}

Tarih: ${values.tarih || "-"}

ŞANTİYE ŞEFİ:
Adı Soyadı   : ${values.ad_soyad || "........................"}
T.C. No      : ${values.tc_deger || "-"}
İletişim     : ${values.iletisim_deger || "-"}
Adres        : ${values.adres_deger || "-"}

İmza:
    `.trim(),
  },
  {
    id: "insaat-ruhsati-dilekcesi",
    title: "İnşaat Ruhsatı Dilekçesi",
    subtitle: "Yapı Ruhsatı Başvuru & İdareye Talep Dilekçesi",
    description:
      "Arsa veya yapı sahiplerinin, belediye veya il özel idaresine yeni inşaat yapmak amacıyla yapı ruhsatı düzenlenmesi talebiyle sundukları resmi başvuru dilekçesi.",
    category: "dilekce",
    categoryLabel: "Dilekçe & Başvuru",
    badge: "Düzenlenebilir PDF Form",
    fileSize: "1.11 MB",
    downloadUrl: "/belgeler/insaat-ruhsati-dilekcesi.pdf",
    studioUrl: "/belgeler/insaat-ruhsati-dilekcesi",
    updatedAt: "2026",
    tags: ["inşaat ruhsatı", "yapı ruhsatı", "dilekçe", "belediye", "imar", "ada", "parsel", "yapı sahibi", "ruhsat başvurusu"],
    targetAudience: "Yapı Sahipleri, Arsa Sahipleri, Müteahhitler, Mimarlar, İnşaat Mühendisleri",
    usageGuide:
      "Tapu kaydı, imar çapı ve onaylı projeler hazırlandıktan sonra ilgili belediyenin İmar ve Şehircilik Müdürlüğüne ıslak imzalı veya e-devlet üzerinden evrak kayda verilmek üzere düzenlenir.",
    legalReference: "3194 Sayılı İmar Kanunu Madde 21 & 22 / Planlı Alanlar İmar Yönetmeliği",
    fields: [
      { key: "tarih", label: "Dilekçe Tarihi", placeholder: "Örn: 08.12.2023" },
      { key: "belediye_adi", label: "İlgili Belediye / İdare", placeholder: "Örn: AKDAĞMADENİ BELEDİYESİ" },
      { key: "mudurluk_adi", label: "İlgili Birim / Müdürlük", placeholder: "Örn: İmar ve Şehircilik Müdürlüğüne" },
      { key: "ana_metin", label: "Talep ve Parsel Bilgileri Metni", placeholder: "Örn: İlçenin Gültepe Mahallesi 351 ada, 162 numaralı parselime...", type: "textarea" },
      { key: "ad_soyad", label: "Dilekçe Sahibi Adı Soyadı", placeholder: "Örn: Hüseyin GÜNAYDIN" },
      { key: "adres", label: "Adres Bilgisi", placeholder: "Örn: Adres: Tunahan Mah. Üç Şehitler Cad. 12/C blok no:29\nEtimesgut/Ankara", type: "textarea" },
      { key: "tel", label: "Telefon Numarası", placeholder: "Örn: Tel: 0546 414 57 13" },
    ],
    defaultValues: {
      tarih: "08.12.2023",
      belediye_adi: "AKDAĞMADENİ BELEDİYESİ",
      mudurluk_adi: "İmar ve Şehircilik Müdürlüğüne",
      ana_metin:
        "           İlçenin Gültepe Mahallesi 351 ada, 162 numaralı parselime yeni inşaat yapmak istiyorum, Yapı ruhsatının düzenlenerek tarafıma verilmesini arz ederim.",
      ad_soyad: "Hüseyin GÜNAYDIN",
      adres: "Adres: Tunahan Mah. Üç Şehitler Cad. 12/C blok no:29\nEtimesgut/Ankara",
      tel: "Tel: 0546 414 57 13",
    },
    generatePreviewText: (values) => `
                                                                                                          ${values.tarih || "-"}

${(values.belediye_adi || "BELEDİYE BAŞKANLIĞI").toLocaleUpperCase("tr-TR")}
${values.mudurluk_adi || "İmar ve Şehircilik Müdürlüğüne"}

${values.ana_metin || "Yeni inşaat yapmak istiyorum, yapı ruhsatının düzenlenerek tarafıma verilmesini arz ederim."}

                                                ${values.ad_soyad || "........................"}

${values.adres || "-"}

${values.tel || "-"}
    `.trim(),
  },
];

export function getDocuments(): DocumentItem[] {
  return DOCUMENTS;
}

export function getDocumentById(id: string): DocumentItem | undefined {
  return DOCUMENTS.find((doc) => doc.id === id);
}

export function getDocumentsByCategory(category: DocumentCategory): DocumentItem[] {
  if (category === "all") {
    return DOCUMENTS;
  }
  return DOCUMENTS.filter((doc) => doc.category === category);
}
