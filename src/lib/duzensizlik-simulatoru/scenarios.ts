export type ScenarioId = "A1" | "A2" | "A3" | "B1" | "B2" | "B3";
export const SCENARIO_IDS: readonly ScenarioId[] = ["A1", "A2", "A3", "B1", "B2", "B3"] as const;

export interface ScenarioInfo {
  id: ScenarioId;
  title: string;
  definition: string;
  observe: string;
  important: string;
  emphasis: string;
  reference: string;
}
export const SCENARIOS: Record<ScenarioId, ScenarioInfo> = {
  A1: {
    id: "A1", title: "Burulma", definition: "Katın karşılıklı kenarları farklı miktarda ötelenir.",
    observe: "İki köşenin yatay hareketini karşılaştır.",
    important: "Rijitlik dağılımındaki asimetri katın dönmesine neden olabilir.",
    emphasis: "Turuncu perde · köşe ötelenmesi", reference: "TBDY 2018 · 3.6.2.1",
  },
  A2: {
    id: "A2", title: "Döşeme süreksizliği", definition: "Döşeme boşluğu diyafram içindeki aktarım yolunu değiştirir.",
    observe: "Üçüncü kattaki boşluğu üstten incele.",
    important: "Boşluk boyutu ve çevresindeki süreklilik ayrıca değerlendirilir.",
    emphasis: "Boşluk çevresi · aktarım yolu", reference: "TBDY 2018 · 3.6.2.2",
  },
  A3: {
    id: "A3", title: "Planda çıkıntılar", definition: "Girintili bir plan iç köşelerde düzensiz aktarım oluşturabilir.",
    observe: "Üst görünüşte L planının iç köşesine bak.",
    important: "A3 için iki doğrultudaki çıkıntı boyutları birlikte önemlidir.",
    emphasis: "L plan · iç köşe", reference: "TBDY 2018 · Tablo 3.6",
  },
  B1: {
    id: "B1", title: "Zayıf kat", definition: "Bir katın yatay yük dayanımı komşu kata göre düşüktür.",
    observe: "Kırmızı işaretlenen kolon kesitlerini karşılaştır.",
    important: "Dayanım azalması doğrudan rijitlik azalması demek değildir.",
    emphasis: "Dayanım karşılaştırması", reference: "TBDY 2018 · 3.6.2.3",
  },
  B2: {
    id: "B2", title: "Yumuşak kat", definition: "Katlar arası göreli ötelenme bir katta yoğunlaşır.",
    observe: "Zemin kattaki kolon eğilmesini izle.",
    important: "Üst katların yatay yer değiştirmesi benzerken alt katta göreli ötelenme büyür.",
    emphasis: "Zemin kat · göreli öteleme", reference: "TBDY 2018 · 3.6.2.1",
  },
  B3: {
    id: "B3", title: "Düşey süreksizlik", definition: "Üstteki kolonun yükü doğrudan temele iletilmiyor.",
    observe: "Turuncu aktarma kirişinin üzerindeki kolona bak.",
    important: "Bu örnek yalnız yük yolunu gösterir; yönetmelik koşullarının sağlandığını göstermez.",
    emphasis: "Kesilen kolon · aktarma kirişi", reference: "TBDY 2018 · 3.6.2.4",
  },
};
export const AFAD_TBDY_URL = "https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf";
