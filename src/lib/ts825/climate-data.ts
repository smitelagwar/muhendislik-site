import type { ClimateBucket, ProvinceClimateOption } from "@/lib/ts825/types";

export const TARGET_U_VALUES: Record<ClimateBucket, number> = {
  "1": 0.45,
  "2-3": 0.4,
  "4": 0.35,
  "5-6": 0.25,
};

export const STANDARD_THICKNESSES_MM = [20, 30, 40, 50, 60, 80, 100, 120, 140, 160] as const;

export const PROVINCE_CLIMATE_OPTIONS: ProvinceClimateOption[] = [
  {
    id: "01",
    name: "Adana",
    defaultBucket: "1",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "1" },
      { id: "ceyhan", label: "Ceyhan", bucket: "2-3" },
      { id: "pozanti", label: "Pozantı", bucket: "4" },
    ],
  },
  { id: "02", name: "Adıyaman", defaultBucket: "2-3" },
  { id: "03", name: "Afyonkarahisar", defaultBucket: "4" },
  { id: "04", name: "Ağrı", defaultBucket: "5-6" },
  { id: "68", name: "Aksaray", defaultBucket: "4" },
  { id: "05", name: "Amasya", defaultBucket: "4" },
  {
    id: "06",
    name: "Ankara",
    defaultBucket: "4",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "4" },
      { id: "kizilcahamam", label: "Kızılcahamam", bucket: "5-6" },
    ],
  },
  {
    id: "07",
    name: "Antalya",
    defaultBucket: "1",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "1" },
      { id: "elmali-korkuteli", label: "Elmalı, Korkuteli", bucket: "4" },
    ],
  },
  { id: "75", name: "Ardahan", defaultBucket: "5-6" },
  {
    id: "08",
    name: "Artvin",
    defaultBucket: "4",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "4" },
      { id: "hopa", label: "Hopa", bucket: "2-3" },
    ],
  },
  { id: "09", name: "Aydın", defaultBucket: "2-3" },
  {
    id: "10",
    name: "Balıkesir",
    defaultBucket: "2-3",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "2-3" },
      { id: "dursunbey", label: "Dursunbey", bucket: "4" },
    ],
  },
  {
    id: "74",
    name: "Bartın",
    defaultBucket: "4",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "4" },
      { id: "amasra", label: "Amasra", bucket: "2-3" },
    ],
  },
  { id: "72", name: "Batman", defaultBucket: "2-3" },
  { id: "69", name: "Bayburt", defaultBucket: "5-6" },
  { id: "11", name: "Bilecik", defaultBucket: "4" },
  {
    id: "12",
    name: "Bingöl",
    defaultBucket: "4",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "4" },
      { id: "solhan", label: "Solhan", bucket: "5-6" },
    ],
  },
  { id: "13", name: "Bitlis", defaultBucket: "5-6" },
  { id: "14", name: "Bolu", defaultBucket: "4" },
  { id: "15", name: "Burdur", defaultBucket: "4" },
  {
    id: "16",
    name: "Bursa",
    defaultBucket: "2-3",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "2-3" },
      { id: "keles-uludag", label: "Keles, Uludağ", bucket: "5-6" },
    ],
  },
  { id: "17", name: "Çanakkale", defaultBucket: "2-3" },
  {
    id: "18",
    name: "Çankırı",
    defaultBucket: "4",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "4" },
      { id: "cerkes", label: "Çerkeş", bucket: "5-6" },
    ],
  },
  { id: "19", name: "Çorum", defaultBucket: "4" },
  {
    id: "20",
    name: "Denizli",
    defaultBucket: "2-3",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "2-3" },
      { id: "acipayam-guney", label: "Acıpayam, Güney", bucket: "4" },
    ],
  },
  {
    id: "21",
    name: "Diyarbakır",
    defaultBucket: "4",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "4" },
      { id: "cermik-ergani", label: "Çermik, Ergani", bucket: "2-3" },
    ],
  },
  {
    id: "81",
    name: "Düzce",
    defaultBucket: "4",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "4" },
      { id: "akcakoca", label: "Akçakoca", bucket: "2-3" },
    ],
  },
  {
    id: "22",
    name: "Edirne",
    defaultBucket: "4",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "4" },
      { id: "ipsala", label: "İpsala", bucket: "2-3" },
    ],
  },
  {
    id: "23",
    name: "Elazığ",
    defaultBucket: "4",
    districtOptions: [
      { id: "varsayilan", label: "Merkez ve çoğu ilçe", bucket: "4" },
      { id: "karakocan", label: "Karakoçan", bucket: "5-6" },
    ],
  },
  {
    id: "24",
    name: "Erzincan",
    defaultBucket: "4",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "4" },
      { id: "tercan", label: "Tercan", bucket: "5-6" },
    ],
  },
  { id: "25", name: "Erzurum", defaultBucket: "5-6" },
  { id: "26", name: "Eskişehir", defaultBucket: "4" },
  { id: "27", name: "Gaziantep", defaultBucket: "2-3" },
  {
    id: "28",
    name: "Giresun",
    defaultBucket: "2-3",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "2-3" },
      { id: "sebinkarahisar", label: "Şebinkarahisar", bucket: "5-6" },
    ],
  },
  { id: "29", name: "Gümüşhane", defaultBucket: "5-6" },
  { id: "30", name: "Hakkari", defaultBucket: "5-6" },
  {
    id: "31",
    name: "Hatay",
    defaultBucket: "2-3",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "2-3" },
      { id: "dortyol-samandag-iskenderun", label: "Dörtyol, Samandağ, İskenderun", bucket: "1" },
    ],
  },
  { id: "76", name: "Iğdır", defaultBucket: "4" },
  { id: "32", name: "Isparta", defaultBucket: "4" },
  { id: "34", name: "İstanbul", defaultBucket: "2-3" },
  { id: "35", name: "İzmir", defaultBucket: "2-3" },
  {
    id: "46",
    name: "Kahramanmaraş",
    defaultBucket: "2-3",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "2-3" },
      { id: "afsin-elbistan", label: "Afşin, Elbistan", bucket: "4" },
      { id: "goksun", label: "Göksun", bucket: "5-6" },
    ],
  },
  { id: "78", name: "Karabük", defaultBucket: "4" },
  { id: "70", name: "Karaman", defaultBucket: "4" },
  { id: "36", name: "Kars", defaultBucket: "5-6" },
  {
    id: "37",
    name: "Kastamonu",
    defaultBucket: "5-6",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "5-6" },
      { id: "kiyi-bandi", label: "Bozkurt, Cide, İnebolu", bucket: "2-3" },
      { id: "tosya", label: "Tosya", bucket: "4" },
    ],
  },
  {
    id: "38",
    name: "Kayseri",
    defaultBucket: "4",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "4" },
      { id: "pinarbasi-sariz-tomarza", label: "Pınarbaşı, Sarız, Tomarza", bucket: "5-6" },
    ],
  },
  { id: "71", name: "Kırıkkale", defaultBucket: "4" },
  { id: "39", name: "Kırklareli", defaultBucket: "4" },
  { id: "40", name: "Kırşehir", defaultBucket: "4" },
  { id: "79", name: "Kilis", defaultBucket: "2-3" },
  { id: "41", name: "Kocaeli", defaultBucket: "2-3" },
  { id: "42", name: "Konya", defaultBucket: "4" },
  { id: "43", name: "Kütahya", defaultBucket: "4" },
  { id: "44", name: "Malatya", defaultBucket: "4" },
  { id: "45", name: "Manisa", defaultBucket: "2-3" },
  { id: "47", name: "Mardin", defaultBucket: "2-3" },
  {
    id: "33",
    name: "Mersin",
    defaultBucket: "1",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "1" },
      { id: "mut", label: "Mut", bucket: "2-3" },
    ],
  },
  {
    id: "48",
    name: "Muğla",
    defaultBucket: "2-3",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "2-3" },
      { id: "kiyi-bandi", label: "Datça, Bodrum, Dalaman, Marmaris, Milas", bucket: "1" },
    ],
  },
  { id: "49", name: "Muş", defaultBucket: "5-6" },
  { id: "50", name: "Nevşehir", defaultBucket: "4" },
  {
    id: "51",
    name: "Niğde",
    defaultBucket: "4",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "4" },
      { id: "ulukisla", label: "Ulukışla", bucket: "5-6" },
    ],
  },
  { id: "52", name: "Ordu", defaultBucket: "2-3" },
  { id: "80", name: "Osmaniye", defaultBucket: "2-3" },
  { id: "53", name: "Rize", defaultBucket: "2-3" },
  { id: "54", name: "Sakarya", defaultBucket: "2-3" },
  { id: "55", name: "Samsun", defaultBucket: "2-3" },
  { id: "56", name: "Siirt", defaultBucket: "2-3" },
  {
    id: "57",
    name: "Sinop",
    defaultBucket: "2-3",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "2-3" },
      { id: "boyabat", label: "Boyabat", bucket: "4" },
    ],
  },
  {
    id: "58",
    name: "Sivas",
    defaultBucket: "5-6",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "5-6" },
      { id: "divrigi-susehri", label: "Divriği, Suşehri", bucket: "4" },
    ],
  },
  { id: "63", name: "Şanlıurfa", defaultBucket: "2-3" },
  {
    id: "73",
    name: "Şırnak",
    defaultBucket: "4",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "4" },
      { id: "cizre", label: "Cizre", bucket: "2-3" },
    ],
  },
  {
    id: "59",
    name: "Tekirdağ",
    defaultBucket: "2-3",
    districtOptions: [
      { id: "varsayilan", label: "Merkez / varsayılan seçim", bucket: "2-3" },
      { id: "corlu-malkara", label: "Çorlu, Malkara", bucket: "4" },
    ],
  },
  { id: "60", name: "Tokat", defaultBucket: "4" },
  { id: "61", name: "Trabzon", defaultBucket: "2-3" },
  { id: "62", name: "Tunceli", defaultBucket: "4" },
  { id: "64", name: "Uşak", defaultBucket: "4" },
  { id: "65", name: "Van", defaultBucket: "5-6" },
  { id: "77", name: "Yalova", defaultBucket: "2-3" },
  { id: "66", name: "Yozgat", defaultBucket: "5-6" },
  { id: "67", name: "Zonguldak", defaultBucket: "2-3" },
];

export function getProvinceById(provinceId: string) {
  return PROVINCE_CLIMATE_OPTIONS.find((province) => province.id === provinceId) ?? null;
}
