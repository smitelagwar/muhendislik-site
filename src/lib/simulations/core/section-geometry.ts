import type {
  DetailModel,
  DetailZoneSummary,
  LayerVisibilityMask,
  RebarPathPart,
} from "./types";
import { DEFAULT_LAYER_VISIBILITY } from "../state/view-reducer";

export interface CutSectionAnalysisResult {
  elevationZMm: number;
  clampedElevationZMm: number;
  inConcreteBody: boolean;
  inDowelZone: boolean;
  activeZone: DetailZoneSummary | null;
  nearestStirrupPart: RebarPathPart | null;
  nearestStirrupDistanceMm: number | null;
  intersectedStirrupParts: RebarPathPart[];
  intersectedCrosstieParts: RebarPathPart[];
  intersectedLongitudinalParts: RebarPathPart[];
  intersectedDowelParts: RebarPathPart[];
  statusTitle: string;
  statusDescription: string;
}

/**
 * Verilen Z (mm) yatay kesit düzleminde hangi sonlu kalınlıktaki donatıların
 * gerçekte kesit düzlemiyle kesiştiğini hesaplar.
 * "Temsilî enkesit" sürekli yerleşimi gösterirken, "Bu kottaki kesit" donatı yarıçapını (d/2) dikkate alır.
 */
export function evaluateBeamVerticalSectionAtPositionX(
  model: DetailModel,
  rawPositionXMm: number,
  layers: LayerVisibilityMask = DEFAULT_LAYER_VISIBILITY,
): CutSectionAnalysisResult {
  const minX = model.boundsMm.min.x;
  const maxX = model.boundsMm.max.x;
  const xMm = Math.max(minX, Math.min(maxX, Math.round(rawPositionXMm * 100) / 100));

  const spanLength = model.dimensionsMm.concreteHeightZ;
  const inConcreteBody = xMm >= 0 && xMm <= spanLength;
  const inDowelZone = xMm < 0 || xMm > spanLength;

  const activeZone =
    model.zones.find((z) =>
      z.id === "sag-mesnet-sarilma"
        ? xMm >= z.zStartMm && xMm <= z.zEndMm
        : xMm >= z.zStartMm && xMm < z.zEndMm,
    ) ?? null;

  const stirrupParts = model.parts.filter(
    (p): p is RebarPathPart => p.kind === "rebar" && p.category === "stirrup",
  );
  const longitudinalParts = model.parts.filter(
    (p): p is RebarPathPart => p.kind === "rebar" && p.category === "longitudinal",
  );
  const dowelParts = model.parts.filter(
    (p): p is RebarPathPart => p.kind === "rebar" && p.category === "dowel",
  );

  let nearestStirrupPart: RebarPathPart | null = null;
  let nearestStirrupDistanceMm: number | null = null;
  const intersectedStirrupParts: RebarPathPart[] = [];

  for (const st of stirrupParts) {
    const centerX = st.elevationZMm ?? 0;
    const dist = Math.abs(xMm - centerX);
    if (nearestStirrupDistanceMm === null || dist < nearestStirrupDistanceMm) {
      nearestStirrupDistanceMm = Number(dist.toFixed(2));
      nearestStirrupPart = st;
    }
    const halfDia = st.diameterMm / 2;
    if (layers.stirrup && dist <= halfDia + 1e-6) {
      intersectedStirrupParts.push(st);
    }
  }

  const intersectedLongitudinalParts =
    layers.longitudinal && xMm >= -260 && xMm <= spanLength + 260
      ? longitudinalParts
      : [];

  const intersectedDowelParts = layers.dowel
    ? dowelParts.filter((part) => {
        if (part.id.includes("left")) {
          return xMm >= -290 && xMm <= 1100;
        }
        return xMm >= spanLength - 1100 && xMm <= spanLength + 290;
      })
    : [];

  let statusTitle: string;
  let statusDescription: string;

  if (inDowelZone) {
    statusTitle = "Uç Mesnet ve 90° Ankraj Bölgesi";
    statusDescription = `X = ${xMm} mm konumu kiriş net açıklığının dışındaki uç mesnet bölgesi içindedir. Burada boyuna donatıların ve üst mesnet ilavelerinin 90° ankraj kancaları mesnet çekirdeğine kenetlenir.`;
  } else if (intersectedStirrupParts.length > 0) {
    const st = intersectedStirrupParts[0];
    statusTitle = `Kiriş Etriyesini Kesen Konum (${st.label})`;
    statusDescription = `X = ${xMm} mm kesiti, merkezi X = ${st.elevationZMm} mm olan Ø${st.diameterMm} etriyenin sonlu kalınlığı (±${st.diameterMm / 2} mm) içinden geçmektedir. Kesitte etriye halkası, alt/üst donatılar${intersectedDowelParts.length > 0 ? " ve üst mesnet ilavesi" : ""} görünür.`;
  } else {
    const nearX = nearestStirrupPart?.elevationZMm ?? 0;
    statusTitle = "İki Etriye Arası Boşluk Kesiti (Boyuna Donatılar Kesilir)";
    statusDescription = `X = ${xMm} mm kesiti iki etriye arasındaki beton boşluğundan geçmektedir (en yakın etriye X = ${nearX} mm, fark ${nearestStirrupDistanceMm} mm). Bu kotta yalnız sürekli alt/üst çubuklar${intersectedDowelParts.length > 0 ? " ve mesnet üst ilave donatısı" : ""} kesilir.`;
  }

  return {
    elevationZMm: rawPositionXMm,
    clampedElevationZMm: xMm,
    inConcreteBody,
    inDowelZone,
    activeZone,
    nearestStirrupPart,
    nearestStirrupDistanceMm,
    intersectedStirrupParts,
    intersectedCrosstieParts: [],
    intersectedLongitudinalParts,
    intersectedDowelParts,
    statusTitle,
    statusDescription,
  };
}

export function evaluateColumnHorizontalSectionAtElevation(
  model: DetailModel,
  rawElevationZMm: number,
  layers: LayerVisibilityMask = DEFAULT_LAYER_VISIBILITY,
): CutSectionAnalysisResult {
  if (model.slug === "kiris-detayi" || model.primaryAxis === "x") {
    return evaluateBeamVerticalSectionAtPositionX(model, rawElevationZMm, layers);
  }
  const minZ = model.boundsMm.min.z;
  const maxZ = model.boundsMm.max.z;
  const zMm = Math.max(minZ, Math.min(maxZ, Math.round(rawElevationZMm * 100) / 100));

  const concreteHeight = model.dimensionsMm.concreteHeightZ;
  const inConcreteBody = zMm >= 0 && zMm <= concreteHeight;
  const inDowelZone = zMm > concreteHeight && zMm <= maxZ;

  const activeZone =
    model.zones.find((z) =>
      z.id === "dugum-bolgesi"
        ? zMm >= z.zStartMm && zMm <= z.zEndMm
        : zMm >= z.zStartMm && zMm < z.zEndMm,
    ) ?? null;

  const stirrupParts = model.parts.filter(
    (p): p is RebarPathPart => p.kind === "rebar" && p.category === "stirrup",
  );
  const crosstieParts = model.parts.filter(
    (p): p is RebarPathPart => p.kind === "rebar" && p.category === "crosstie",
  );
  const longitudinalParts = model.parts.filter(
    (p): p is RebarPathPart => p.kind === "rebar" && p.category === "longitudinal",
  );
  const dowelParts = model.parts.filter(
    (p): p is RebarPathPart => p.kind === "rebar" && p.category === "dowel",
  );

  let nearestStirrupPart: RebarPathPart | null = null;
  let nearestStirrupDistanceMm: number | null = null;

  const intersectedStirrupParts: RebarPathPart[] = [];

  for (const st of stirrupParts) {
    const centerZ = st.elevationZMm ?? 0;
    const dist = Math.abs(zMm - centerZ);
    if (nearestStirrupDistanceMm === null || dist < nearestStirrupDistanceMm) {
      nearestStirrupDistanceMm = Number(dist.toFixed(2));
      nearestStirrupPart = st;
    }

    const halfDia = st.diameterMm / 2;
    if (layers.stirrup && dist <= halfDia + 1e-6) {
      intersectedStirrupParts.push(st);
    }
  }

  const intersectedCrosstieParts: RebarPathPart[] = [];
  for (const ct of crosstieParts) {
    const centerZ = ct.elevationZMm ?? 0;
    const halfDia = ct.diameterMm / 2;
    if (layers.crosstie && Math.abs(zMm - centerZ) <= halfDia + 1e-6) {
      intersectedCrosstieParts.push(ct);
    }
  }

  const isExteriorJoint = model.slug === "kolon-kiris-birlesimi";
  const isPadFooting = model.slug === "tekil-temel";
  const isShearWall = model.slug === "perde-detayi";
  const isMatFoundation = model.slug === "radye-temel";

  const intersectedLongitudinalParts = layers.longitudinal
    ? isPadFooting || isMatFoundation
      ? longitudinalParts.filter(
          (bar) => Math.abs(zMm - (bar.elevationZMm ?? 58)) <= bar.diameterMm / 2 + 1e-6,
        )
      : isShearWall
        ? longitudinalParts.filter((bar) => {
            if (bar.id.startsWith("wall-web-vert-")) {
              return zMm >= 0 && zMm <= maxZ;
            }
            return Math.abs(zMm - (bar.elevationZMm ?? -999)) <= bar.diameterMm / 2 + 1e-6;
          })
        : inConcreteBody
          ? longitudinalParts
          : []
    : [];

  const intersectedDowelParts = layers.dowel
    ? isPadFooting || isMatFoundation
      ? zMm >= 82 && zMm <= maxZ
        ? dowelParts
        : []
      : isShearWall
        ? zMm >= 0 && zMm <= maxZ
          ? dowelParts
          : []
        : isExteriorJoint
          ? zMm >= 1300 && zMm <= 1700
            ? dowelParts
            : []
          : inDowelZone
            ? dowelParts
            : []
    : [];

  let statusTitle: string;
  let statusDescription: string;

  if (inDowelZone) {
    statusTitle = "Üst Filiz Uzantısı Bölgesi (Beton Gövde Üstü)";
    statusDescription = `Z = ${zMm} mm kotu kolon beton üst yüzünün (${concreteHeight} mm) üzerindedir. Bu kotta beton gövde ve etriye bulunmaz; yalnız üst kata uzanan boyuna donatı/filiz çubukları kesilir.`;
  } else if (intersectedStirrupParts.length > 0) {
    const st = intersectedStirrupParts[0];
    statusTitle = `Etriye Gövdesini Kesen Kot (${st.label})`;
    statusDescription = `Z = ${zMm} mm kotu, merkezi Z = ${st.elevationZMm} mm olan Ø${st.diameterMm} etriyenin sonlu kalınlığı (±${st.diameterMm / 2} mm) içinden geçmektedir. Kesitte etriye halkası ve 135° kancası doğrudan görünür.`;
  } else {
    const nearZ = nearestStirrupPart?.elevationZMm ?? 0;
    statusTitle = "İki Etriye Arası Boşluk Kotu (Sadece Boyuna Donatı Kesilir)";
    statusDescription = `Z = ${zMm} mm kotu etriyeler arasındaki beton boşluğundan geçmektedir (en yakın etriye merkezi Z = ${nearZ} mm, mesafe ${nearestStirrupDistanceMm} mm > 5 mm yarıçap). Bu nedenle gerçek kot kesitinde yalnız düşey boyuna donatılar ve beton yüzeyi görünür.`;
  }

  return {
    elevationZMm: rawElevationZMm,
    clampedElevationZMm: zMm,
    inConcreteBody,
    inDowelZone,
    activeZone,
    nearestStirrupPart,
    nearestStirrupDistanceMm,
    intersectedStirrupParts,
    intersectedCrosstieParts,
    intersectedLongitudinalParts,
    intersectedDowelParts,
    statusTitle,
    statusDescription,
  };
}
