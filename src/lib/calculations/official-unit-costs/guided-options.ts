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
    description: "Villa, apartman ve yuksek konutlar icin hizli secim.",
    options: [
      {
        id: "villa-bungalov",
        label: "Villa, dag evi, bungalov",
        description: "Mustakil konut, yayla evi, kucuk olcekli konut yapilari.",
        selection: selection("II", "C"),
      },
      {
        id: "apartman-3-kat",
        label: "Apartman / 3 kat ve alti",
        description: "Apartman tipi konutlar, uc kata kadar.",
        selection: selection("III", "A"),
      },
      {
        id: "apartman-4-7-kat",
        label: "Apartman / 4-7 kat",
        description: "Yapi yuksekligi yaklasik 21.50 m ve alti olan konutlar.",
        selection: selection("III", "B"),
      },
      {
        id: "apartman-8-10-kat",
        label: "Apartman / 8-10 kat",
        description: "Yapi yuksekligi 21.50 m ustu, 30.50 m ve alti konutlar.",
        selection: selection("III", "C"),
      },
      {
        id: "apartman-11-17-kat",
        label: "Apartman / 11-17 kat",
        description: "Yapi yuksekligi 30.50 m ustu, 51.50 m ve alti konutlar.",
        selection: selection("IV", "A"),
      },
      {
        id: "apartman-18-kat-uzeri",
        label: "Apartman / 18 kat ve uzeri",
        description: "Yapi yuksekligi 51.50 m ustu konutlar.",
        selection: selection("IV", "B"),
      },
    ],
  },
  {
    id: "ticari-ofis",
    label: "Ticari ve ofis",
    description: "Ofis, AVM, otopark ve karma kullanimli yapilar.",
    options: [
      {
        id: "otopark-akaryakit",
        label: "Otopark, akaryakit, kucuk ticari",
        description: "Katli/kapali otopark, akaryakit veya otogaz istasyonu.",
        selection: selection("III", "A"),
      },
      {
        id: "avm-25000",
        label: "AVM / 25.000 m2 alti",
        description: "Orta olcekli alisveris merkezi ve benzeri ticari yapilar.",
        selection: selection("IV", "A"),
      },
      {
        id: "ofis-banka-idari",
        label: "Ofis, banka, borsa, idari bina",
        description: "Banka, borsa ve buyuk idari/ofis yapilari.",
        selection: selection("IV", "B"),
      },
      {
        id: "karma-kullanim",
        label: "Karma kullanim, kampus, stadyum",
        description: "Stadyum, buyuk kompleks veya karma kullanimli yapilar.",
        selection: selection("V", "A"),
      },
    ],
  },
  {
    id: "egitim-kamu",
    label: "Egitim ve kamu",
    description: "Okul, universite ve buyuk kamu yapilari.",
    options: [
      {
        id: "ilkokul-ortaokul",
        label: "Ilkokul, ortaokul",
        description: "Temel egitim yapilari ve benzeri okul binalari.",
        selection: selection("III", "B"),
      },
      {
        id: "fakulte-yuksekokul",
        label: "Fakulte, yuksekokul",
        description: "Universite egitim binalari ve buyuk kampus yapilari.",
        selection: selection("IV", "A"),
      },
      {
        id: "adalet-bakanlik",
        label: "Adalet sarayi, bakanlik",
        description: "Bakanlik binasi, adalet sarayi ve agir kamu yapilari.",
        selection: selection("IV", "C"),
      },
      {
        id: "elcilik-konsolosluk",
        label: "Buyukelcilik, konsolosluk",
        description: "Yuksek nitelikli temsilcilik ve diplomatik yapilar.",
        selection: selection("V", "A"),
      },
    ],
  },
  {
    id: "saglik",
    label: "Saglik",
    description: "Saglik merkezi, huzurevi ve hastane yapilari.",
    options: [
      {
        id: "agiz-dis-huzurevi",
        label: "Agiz-dis merkezi, huzurevi",
        description: "Huzurevi, yasli bakim merkezi veya agiz-dis sagligi merkezi.",
        selection: selection("III", "C"),
      },
      {
        id: "hastane-200-alti",
        label: "Hastane / 200 yatak alti",
        description: "Orta olcekli hastaneler ve kapali cezaevi gibi agir yapilar.",
        selection: selection("IV", "C"),
      },
      {
        id: "hastane-200-400",
        label: "Hastane / 200-400 yatak",
        description: "Buyuk hastane ve ileri saglik kampusu yapilari.",
        selection: selection("V", "B"),
      },
      {
        id: "hastane-400-ustu",
        label: "Hastane / 400 yatak ve uzeri",
        description: "Cok buyuk hastaneler, kongre-kultur merkezi olceginde yapilar.",
        selection: selection("V", "C"),
      },
      {
        id: "sehir-hastanesi",
        label: "Sehir hastanesi",
        description: "Sehir hastanesi ve benzeri ust olcek saglik kampusleri.",
        selection: selection("V", "D"),
      },
    ],
  },
  {
    id: "sanayi-depo",
    label: "Sanayi, depo ve enerji",
    description: "Depo, hangar, sanayi tesisi ve enerji yapilari.",
    options: [
      {
        id: "depo-tarimsal",
        label: "Genel depo, tarimsal endustri",
        description: "Genel amacli depo, tarimsal endustri veya iskele benzeri yapilar.",
        selection: selection("II", "A"),
      },
      {
        id: "hangar-kapali-pazar",
        label: "Hangar, kapali pazar, konteyner",
        description: "Hangar, konteyner kent veya kapali pazar yerleri.",
        selection: selection("II", "B"),
      },
      {
        id: "sanayi-tesisi",
        label: "Sanayi tesisi",
        description: "Standart sanayi tesisi, atelye ve fabrika tipindeki yapilar.",
        selection: selection("II", "C"),
      },
      {
        id: "ges",
        label: "GES",
        description: "Gunes enerji santrali.",
        selection: selection("I", "D"),
      },
      {
        id: "res",
        label: "RES",
        description: "Ruzgar enerji santrali.",
        selection: selection("V", "E"),
      },
    ],
  },
  {
    id: "turizm-ozel",
    label: "Turizm ve ozel yapilar",
    description: "Otel, kultur merkezi ve benzeri ust segment yapilar.",
    options: [
      {
        id: "otel-4-yildiz",
        label: "Otel / 4 yildiz",
        description: "4 yildizli otel ve benzeri turizm yapilari.",
        selection: selection("V", "B"),
      },
      {
        id: "kongre-kultur",
        label: "Kongre, kultur, tiyatro",
        description: "Kongre merkezi, bale-opera-tiyatro veya kultur merkezi.",
        selection: selection("V", "C"),
      },
      {
        id: "otel-5-yildiz",
        label: "Otel / 5 yildiz",
        description: "5 yildizli otel, havalimani terminali veya metro istasyonu olcegi.",
        selection: selection("V", "D"),
      },
    ],
  },
];

function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
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
