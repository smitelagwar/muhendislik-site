export type ToolPageSeoEntry = {
  title: string;
  description: string;
  keywords: string[];
};

export const TOOL_PAGE_SEO: Record<string, ToolPageSeoEntry> = {
  "donati-hesabi": {
    title: "Donatı Hesabı",
    description: "Donatı çapı ve adet girerek toplam donatı alanını ve eşdeğer donatı alternatiflerini hesaplayın.",
    keywords: ["donatı hesabı", "donatı alanı", "inşaat donatısı", "betonarme donatı", "çelik alanı"],
  },
  "kolon-on-boyutlandirma": {
    title: "Kolon Ön Boyutlandırma",
    description: "Dikdörtgen kolonlar için ön tasarım kesitini ve başlangıç alanını hızlıca kontrol edin.",
    keywords: ["kolon ön boyutlandırma", "kolon kesiti", "betonarme kolon", "ts 500 kolon", "kolon hesabı"],
  },
  "kiris-kesiti": {
    title: "Kiriş Kesiti",
    description: "Eğilme donatısı ve kesme kontrolünü aynı ekranda değerlendirerek kiriş kesitini hızlıca inceleyin.",
    keywords: ["kiriş kesiti", "kiriş hesabı", "betonarme kiriş", "kesme kontrolü", "eğilme donatısı"],
  },
  "doseme-kalinligi": {
    title: "Döşeme Kalınlığı",
    description: "Açıklık, kullanım ve sistem tipine göre döşeme kalınlığını ön kontrol mantığıyla değerlendirin.",
    keywords: ["döşeme kalınlığı", "döşeme hesabı", "betonarme döşeme", "döşeme ön kontrol", "slab thickness"],
  },
  "pas-payi": {
    title: "Pas Payı",
    description: "Çevre sınıfı ve eleman tipine göre nominal beton örtüsünü ve pratik pas payını hızlıca hesaplayın.",
    keywords: ["pas payı", "beton örtüsü", "nominal beton örtüsü", "ts en 1992", "betonarme detay"],
  },
  "kalip-sokum-suresi": {
    title: "Kalıp Söküm Süresi",
    description: "Çimento tipi, sıcaklık ve eleman türüne göre tahmini kalıp söküm süresini görün.",
    keywords: ["kalıp söküm süresi", "şantiye planlama", "beton dayanımı", "kalıp alma süresi", "betonarme saha"],
  },
  "dis-cephe-yalitim-kalinligi": {
    title: "Dış Duvar U Değeri ve Yalıtım Kalınlığı",
    description: "TS 825:2024'e göre il, duvar tipi, yalıtım malzemesi ve kalınlıkla U değerini kontrol edin; gereken kalınlığı ve PDF hesap föyünü alın.",
    keywords: ["dış duvar u değeri", "dış cephe yalıtım kalınlığı", "ts 825 2024", "mantolama hesabı", "yalıtım kalınlığı"],
  },
  "imar-hesaplayici": {
    title: "İmar Hesaplayıcı",
    description: "TAKS, KAKS, çekme mesafeleri ve emsal verileriyle yapılaşma hakkını ön değerlendirme mantığıyla inceleyin.",
    keywords: ["imar hesaplayıcı", "taks kaks", "emsal hesabı", "arsa imar", "yapılaşma hakkı"],
  },
  "taban-kesme-kuvveti": {
    title: "Eşdeğer Deprem Yükü (Taban Kesme Kuvveti) Hesaplama Aracı",
    description: "TBDY 2018'e göre Eşdeğer Deprem Yükü ve Minimum Taban Kesme Kuvveti hesabı.",
    keywords: ["taban kesme kuvveti", "eşdeğer deprem yükü", "tbdy 2018", "deprem hesabı", "base shear"],
  },
};
