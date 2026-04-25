// Tekil Temel Hesabı — Tip Tanımları
// Standart: TS 500:2000, TS EN 1992-1-1

/** Zemin türü */
export type ZeminTuru = "kum_cakil" | "siltli_kum" | "kil_orta" | "kil_sert" | "kaya";

/** Temel beton sınıfı */
export type BetonSinifi = "C20" | "C25" | "C30" | "C35" | "C40";

/** Donatı çelik sınıfı */
export type CelikSinifi = "B420C" | "B500C";

/** Kolon tipi */
export type KolonTipi = "dikdortgen" | "kare" | "daire";

/** Tekil temel hesabı için giriş verileri */
export interface TekilTemelInput {
  /** Kolon altı eksenel yük — Nd (kN) */
  eksenelYukNd: number;
  /** Kolon altı moment Mx (kNm) — opsiyonel */
  momentMx: number;
  /** Kolon altı moment My (kNm) — opsiyonel */
  momentMy: number;
  /** Zemin emniyet gerilmesi — σ_em (kN/m²) */
  zeminEmniyetGerilmesi: number;
  /** Zemin türü */
  zeminTuru: ZeminTuru;
  /** Temel derinliği — Df (m) */
  temelDerinligi: number;
  /** Zemin birim hacim ağırlığı — γ (kN/m³) */
  zeminBirimHacimAgirligi: number;
  /** Kolon tipi */
  kolonTipi: KolonTipi;
  /** Kolon boyutu a — x yönü (m) */
  kolonBoyutuA: number;
  /** Kolon boyutu b — y yönü (m), daire için çap */
  kolonBoyutuB: number;
  /** Beton sınıfı */
  betonSinifi: BetonSinifi;
  /** Çelik sınıfı */
  celikSinifi: CelikSinifi;
  /** Pas payı (mm) */
  pasPayi: number;
}

/** Temel boyutlandırma sonuçları */
export interface TemelBoyutu {
  /** Temel a boyutu — x yönü (m) */
  a: number;
  /** Temel b boyutu — y yönü (m) */
  b: number;
  /** Temel alanı (m²) */
  alan: number;
  /** Temel kalınlığı (m) */
  kalinlik: number;
}

/** Zemin gerilmesi kontrol sonuçları */
export interface ZeminGerilmesiSonuc {
  /** Ortalama zemin gerilmesi (kN/m²) */
  ortGerilme: number;
  /** Maksimum zemin gerilmesi (kN/m²) */
  maxGerilme: number;
  /** Minimum zemin gerilmesi (kN/m²) */
  minGerilme: number;
  /** Gerilme kontrolü geçti mi? */
  kontrolGecti: boolean;
  /** Kullanım oranı (%) */
  kullanimOrani: number;
}

/** Delme kesme kontrolü */
export interface DelmeKesmeKontrol {
  /** Kesme çevresi (m) */
  kesmecevresi: number;
  /** Kesme derinliği d (m) */
  d: number;
  /** Tasarım delme kuvveti Vd (kN) */
  tasarimDelmeKuvveti: number;
  /** İzin verilen delme kapasitesi Vrd (kN) */
  izinVerilenKapasite: number;
  /** Kontrol geçti mi? */
  gecti: boolean;
  /** Kullanım oranı (0–1) */
  kullanimOrani: number;
}

/** Eğilme donatı hesabı (tek yön) */
export interface EgilmeDonatiSonuc {
  /** Tasarım momenti Md (kNm) */
  tasarimMomenti: number;
  /** Gerekli donatı alanı As (cm²) */
  gerekliDonatíAlani: number;
  /** Minimum donatı alanı As,min (cm²) */
  minDonatíAlani: number;
  /** Tasarım donatı alanı (cm²) */
  tasarimDonatíAlani: number;
  /** Öneri: adet × çap */
  oneri: string;
}

/** Tam tekil temel hesap sonucu */
export interface TekilTemelSonuc {
  /** Giriş verileri (referans) */
  input: TekilTemelInput;
  /** Temel boyutları */
  boyut: TemelBoyutu;
  /** Zemin gerilmesi kontrolü */
  zeminGerilmesi: ZeminGerilmesiSonuc;
  /** Delme kesme kontrolü */
  delmeKesme: DelmeKesmeKontrol;
  /** X yönü donatı hesabı */
  donatiX: EgilmeDonatiSonuc;
  /** Y yönü donatı hesabı */
  donatiY: EgilmeDonatiSonuc;
  /** Uyarı listesi */
  uyarilar: string[];
  /** Genel kontrol durumu */
  tumKontrollerGecti: boolean;
  /** Hesap özeti metin */
  ozetMetin: string;
}

/** Doğrulama hatası */
export interface TekilTemelValidasyon {
  alan: string;
  mesaj: string;
}
