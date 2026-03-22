import type { OfficialCostClassCode, OfficialCostGroupCode, OfficialCostRow, OfficialCostSelection } from "./types";

export interface OfficialCostGuidedOption {
  id: string;
  label: string;
  description: string;
  selection: OfficialCostSelection;
}

export interface OfficialCostGuidedCategory {
  id: string;
  label: string;
  description: string;
  options: OfficialCostGuidedOption[];
}

function selection(grup: OfficialCostGroupCode, sinif: OfficialCostClassCode): OfficialCostSelection {
  return {
    yil: 2026,
    grup,
    sinif,
  };
}

export const OFFICIAL_COST_GUIDED_CATEGORIES: OfficialCostGuidedCategory[] = [
  {
    id: "konut",
    label: "Konut",
    description: "Villa, apartman ve yüksek konutlar için hızlı seçim.",
    options: [
      {
        id: "villa-bungalov",
        label: "Villa, dağ evi, bungalov",
        description: "Müstakil konut, yayla evi ve küçük ölçekli konut yapıları.",
        selection: selection("II", "C"),
      },
      {
        id: "apartman-3-kat",
        label: "Apartman / 3 kat ve altı",
        description: "Apartman tipi konutlar, üç kata kadar.",
        selection: selection("III", "A"),
      },
      {
        id: "apartman-4-7-kat",
        label: "Apartman / 4-7 kat",
        description: "Yapı yüksekliği yaklaşık 21,50 m ve altı olan konutlar.",
        selection: selection("III", "B"),
      },
      {
        id: "apartman-8-10-kat",
        label: "Apartman / 8-10 kat",
        description: "Yapı yüksekliği 21,50 m üstü, 30,50 m ve altı konutlar.",
        selection: selection("III", "C"),
      },
      {
        id: "apartman-11-17-kat",
        label: "Apartman / 11-17 kat",
        description: "Yapı yüksekliği 30,50 m üstü, 51,50 m ve altı konutlar.",
        selection: selection("IV", "A"),
      },
      {
        id: "apartman-18-kat-uzeri",
        label: "Apartman / 18 kat ve üzeri",
        description: "Yapı yüksekliği 51,50 m üstü konutlar.",
        selection: selection("IV", "B"),
      },
    ],
  },
  {
    id: "ticari-ofis",
    label: "Ticari ve ofis",
    description: "Ofis, AVM, otopark ve karma kullanımlı yapılar.",
    options: [
      {
        id: "otopark-akaryakit",
        label: "Otopark, akaryakıt, küçük ticari",
        description: "Katlı/kapalı otopark, akaryakıt veya otogaz istasyonu.",
        selection: selection("III", "A"),
      },
      {
        id: "avm-25000",
        label: "AVM / 25.000 m² altı",
        description: "Orta ölçekli alışveriş merkezi ve benzeri ticari yapılar.",
        selection: selection("IV", "A"),
      },
      {
        id: "ofis-banka-idari",
        label: "Ofis, banka, borsa, idari bina",
        description: "Banka, borsa ve büyük idari/ofis yapıları.",
        selection: selection("IV", "B"),
      },
      {
        id: "karma-kullanim",
        label: "Karma kullanım, kampüs, stadyum",
        description: "Stadyum, büyük kompleks veya karma kullanımlı yapılar.",
        selection: selection("V", "A"),
      },
    ],
  },
  {
    id: "egitim-kamu",
    label: "Eğitim ve kamu",
    description: "Okul, üniversite ve büyük kamu yapıları.",
    options: [
      {
        id: "ilkokul-ortaokul",
        label: "İlkokul, ortaokul",
        description: "Temel eğitim yapıları ve benzeri okul binaları.",
        selection: selection("III", "B"),
      },
      {
        id: "fakulte-yuksekokul",
        label: "Fakülte, yüksekokul",
        description: "Üniversite eğitim binaları ve büyük kampüs yapıları.",
        selection: selection("IV", "A"),
      },
      {
        id: "adalet-bakanlik",
        label: "Adalet sarayı, bakanlık",
        description: "Bakanlık binası, adalet sarayı ve ağır kamu yapıları.",
        selection: selection("IV", "C"),
      },
      {
        id: "elcilik-konsolosluk",
        label: "Büyükelçilik, konsolosluk",
        description: "Yüksek nitelikli temsilcilik ve diplomatik yapılar.",
        selection: selection("V", "A"),
      },
    ],
  },
  {
    id: "saglik",
    label: "Sağlık",
    description: "Sağlık merkezi, huzurevi ve hastane yapıları.",
    options: [
      {
        id: "agiz-dis-huzurevi",
        label: "Ağız-diş merkezi, huzurevi",
        description: "Huzurevi, yaşlı bakım merkezi veya ağız-diş sağlığı merkezi.",
        selection: selection("III", "C"),
      },
      {
        id: "hastane-200-alti",
        label: "Hastane / 200 yatak altı",
        description: "Orta ölçekli hastaneler ve kapalı cezaevi gibi ağır yapılar.",
        selection: selection("IV", "C"),
      },
      {
        id: "hastane-200-400",
        label: "Hastane / 200-400 yatak",
        description: "Büyük hastane ve ileri sağlık kampüsü yapıları.",
        selection: selection("V", "B"),
      },
      {
        id: "hastane-400-ustu",
        label: "Hastane / 400 yatak ve üzeri",
        description: "Çok büyük hastaneler, kongre-kültür merkezi ölçeğinde yapılar.",
        selection: selection("V", "C"),
      },
      {
        id: "sehir-hastanesi",
        label: "Şehir hastanesi",
        description: "Şehir hastanesi ve benzeri üst ölçek sağlık kampüsleri.",
        selection: selection("V", "D"),
      },
    ],
  },
  {
    id: "sanayi-depo",
    label: "Sanayi, depo ve enerji",
    description: "Depo, hangar, sanayi tesisi ve enerji yapıları.",
    options: [
      {
        id: "depo-tarimsal",
        label: "Genel depo, tarımsal endüstri",
        description: "Genel amaçlı depo, tarımsal endüstri veya iskele benzeri yapılar.",
        selection: selection("II", "A"),
      },
      {
        id: "hangar-kapali-pazar",
        label: "Hangar, kapalı pazar, konteyner",
        description: "Hangar, konteyner kent veya kapalı pazar yerleri.",
        selection: selection("II", "B"),
      },
      {
        id: "sanayi-tesisi",
        label: "Sanayi tesisi",
        description: "Standart sanayi tesisi, atölye ve fabrika tipindeki yapılar.",
        selection: selection("II", "C"),
      },
      {
        id: "ges",
        label: "GES",
        description: "Güneş enerji santrali.",
        selection: selection("I", "D"),
      },
      {
        id: "res",
        label: "RES",
        description: "Rüzgâr enerji santrali.",
        selection: selection("V", "E"),
      },
    ],
  },
  {
    id: "turizm-ozel",
    label: "Turizm ve özel yapılar",
    description: "Otel, kültür merkezi ve benzeri üst segment yapılar.",
    options: [
      {
        id: "otel-4-yildiz",
        label: "Otel / 4 yıldız",
        description: "4 yıldızlı otel ve benzeri turizm yapıları.",
        selection: selection("V", "B"),
      },
      {
        id: "kongre-kultur",
        label: "Kongre, kültür, tiyatro",
        description: "Kongre merkezi, bale-opera-tiyatro veya kültür merkezi.",
        selection: selection("V", "C"),
      },
      {
        id: "otel-5-yildiz",
        label: "Otel / 5 yıldız",
        description: "5 yıldızlı otel, havalimanı terminali veya metro istasyonu ölçeği.",
        selection: selection("V", "D"),
      },
    ],
  },
];

function normalizeSearch(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ç]/g, "c")
    .replace(/[ğ]/g, "g")
    .replace(/[ı]/g, "i")
    .replace(/[ö]/g, "o")
    .replace(/[ş]/g, "s")
    .replace(/[ü]/g, "u")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchOfficialCostRows(rows: OfficialCostRow[], query: string): OfficialCostRow[] {
  const normalized = normalizeSearch(query);
  if (!normalized) {
    return [];
  }

  return rows.filter((row) => {
    const haystack = normalizeSearch(
      `${row.sinifKodu} ${row.anaGrupAdi} ${row.sinifAdi} ${row.ornekYapilar.join(" ")}`
    );

    return haystack.includes(normalized);
  });
}

export function findGuidedOptionBySelection(
  grup: OfficialCostGroupCode,
  sinif: OfficialCostClassCode
): { categoryId: string; optionId: string } | null {
  for (const category of OFFICIAL_COST_GUIDED_CATEGORIES) {
    const option = category.options.find(
      (item) => item.selection.grup === grup && item.selection.sinif === sinif
    );
    if (option) {
      return {
        categoryId: category.id,
        optionId: option.id,
      };
    }
  }

  return null;
}

export function findGuidedOptionById(
  optionId: string
): { category: OfficialCostGuidedCategory; option: OfficialCostGuidedOption } | null {
  for (const category of OFFICIAL_COST_GUIDED_CATEGORIES) {
    const option = category.options.find((item) => item.id === optionId);
    if (option) {
      return { category, option };
    }
  }

  return null;
}

export function findGuidedCategoryById(
  categoryId: string
): OfficialCostGuidedCategory | null {
  return (
    OFFICIAL_COST_GUIDED_CATEGORIES.find((category) => category.id === categoryId) ?? null
  );
}
