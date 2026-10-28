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
  why: string;
  focusLabel: string;
}
export const SCENARIOS: Record<ScenarioId, ScenarioInfo> = {
  A1: {
    id: "A1", title: "Burulma", definition: "Katın karşılıklı kenarları farklı miktarda ötelenir.",
    observe: "3B işaretli iki köşeyi aynı deprem anında karşılaştır.",
    important: "Rijitlik dağılımındaki asimetri katın dönmesine neden olabilir.",
    emphasis: "Turuncu perde · köşe ötelenmesi", reference: "TBDY 2018 · 3.6.2.1",
    why: "Rijitlik merkezi ile kütle merkezi farklılaştığında kat dönerek karşılıklı kenarlarda farklı göreli ötelenmeler oluşturabilir. Şemadaki iki işareti karşılaştır.",
    focusLabel: "Üst kattaki karşılıklı iki kenar",
  },
  A2: {
    id: "A2", title: "Döşeme süreksizliği", definition: "Döşeme boşluğu diyafram içindeki aktarım yolunu değiştirir.",
    observe: "Üçüncü katta boşluğun etrafındaki dört kenarı üstten incele. Alan örneği şematiktir.",
    important: "Boşluk boyutu ve çevresindeki süreklilik ayrıca değerlendirilir.",
    emphasis: "Boşluk çevresi · aktarım yolu", reference: "TBDY 2018 · 3.6.2.2",
    why: "Büyük döşeme boşluğu, deprem kuvvetlerinin düşey taşıyıcılara aktarılmasını güçleştirebilir. Üçüncü kattaki boşluk çevresini incele.",
    focusLabel: "3. kat döşeme boşluğu",
  },
  A3: {
    id: "A3", title: "Planda çıkıntılar", definition: "Girintili bir plan iç köşelerde düzensiz aktarım oluşturabilir.",
    observe: "Üst görünüşte L planının yeniden giren iç köşesine bak.",
    important: "A3 için iki doğrultudaki çıkıntı boyutları birlikte önemlidir.",
    emphasis: "L plan · iç köşe", reference: "TBDY 2018 · Tablo 3.6",
    why: "Plandaki büyük çıkıntı, döşemenin iç köşesinde zorlayıcı yük aktarımına yol açabilir. Kırmızı iç köşe işaretine bak.",
    focusLabel: "L planın iç köşesi",
  },
  B1: {
    id: "B1", title: "Zayıf kat", definition: "Bir katın yatay yük dayanımı komşu kata göre düşüktür.",
    observe: "Alt kattaki vurgulu kolon kesitini karşılaştır; bu bir dayanım hesabı değildir.",
    important: "Dayanım azalması doğrudan rijitlik azalması demek değildir.",
    emphasis: "Dayanım karşılaştırması", reference: "TBDY 2018 · 3.6.2.3",
    why: "Bir katın yatay yük dayanımı üst kata göre zayıf kalabilir. Dayanım düzensizliği, yumuşak kattaki gibi yalnız büyük öteleme ile tarif edilmez.",
    focusLabel: "1. kat zayıf kolon bölgesi",
  },
  B2: {
    id: "B2", title: "Yumuşak kat", definition: "Katlar arası göreli ötelenme bir katta yoğunlaşır.",
    observe: "Alt katta hareketi başlat; üst kattaki benzer hareketle karşılaştır.",
    important: "Üst katların yatay yer değiştirmesi benzerken alt katta göreli ötelenme büyür.",
    emphasis: "Zemin kat · göreli öteleme", reference: "TBDY 2018 · 3.6.2.1",
    why: "İlk katta göreli yatay ötelenme yoğunlaşırsa bu katın rijitlik dağılımı üst katlardan farklı davranabilir. Hareketi zemine yakın bölgede izle.",
    focusLabel: "1. katta yoğunlaşan ötelenme",
  },
  B3: {
    id: "B3", title: "Düşey süreksizlik", definition: "Üstteki kolonun yükü doğrudan temele iletilmiyor.",
    observe: "Alt orta kolonun olmadığı bölgeyi ve onu taşıyan iki uçlu aktarma kirişini incele.",
    important: "Bu örnek yalnız yük yolunu gösterir; yönetmelik koşullarının sağlandığını göstermez.",
    emphasis: "Kesilen kolon · aktarma kirişi", reference: "TBDY 2018 · 3.6.2.4",
    why: "Üstteki kolonun düşey yük yolu alttaki katta kesilir ve yük iki uçtan mesnetli aktarma kirişine yönlenir. Bu bir yönetmelik uygunluk onayı değildir.",
    focusLabel: "Kesilen kolon ve aktarma kirişi",
  },
};
export const AFAD_TBDY_URL = "https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf";
