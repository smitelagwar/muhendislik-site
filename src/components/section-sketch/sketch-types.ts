// Enkesit krokie bileşenleri — paylaşılan TypeScript arayüzleri

/** Kiriş enkesit krokisi için girdi parametreleri */
export interface BeamSketchProps {
  /** Kiriş genişliği b [cm] */
  widthCm: number;
  /** Toplam kiriş yüksekliği h [cm] */
  totalHeightCm: number;
  /** Net beton örtüsü / pas payı c [mm] */
  coverMm: number;
  /** Etriye çapı [mm] */
  stirrupDiameterMm: number;
  /** Faydalı yükseklik d [mm] — hesaptan gelir */
  effectiveDepthMm?: number | null;
  /** Tasarım donatı alanı As [mm²] — null ise "hesaplanıyor" göster */
  designSteelAreaMm2?: number | null;
  /** Ek CSS sınıfı */
  className?: string;
}

/** Kolon enkesit krokisi için girdi parametreleri */
export interface ColumnSketchProps {
  /** Kısa kenar [cm] */
  shortEdgeCm: number;
  /** Uzun kenar [cm] */
  longEdgeCm: number;
  /** Net beton örtüsü [mm] — varsayılan 30 mm */
  coverMm?: number;
  /** Tahmini boyuna donatı adedi — belirtilmezse Ac'dan hesaplanır */
  barCount?: number;
  /** Ek CSS sınıfı */
  className?: string;
}

/** Donatı düzeni krokisi için girdi parametreleri */
export interface RebarSketchProps {
  /** Donatı çapı [mm] */
  diameterMm: number;
  /** Çubuk adedi */
  quantity: number;
  /** Ek CSS sınıfı */
  className?: string;
}

/** SVG koordinat noktası */
export interface SvgPoint {
  x: number;
  y: number;
}

/** Ölçü çizgisi tanımı */
export interface DimensionLine {
  start: SvgPoint;
  end: SvgPoint;
  label: string;
  side: "left" | "right" | "top" | "bottom";
}
