import type { DepremRolloutSpec } from "./deprem-rollout";
import { DEPREM_TECHNICAL_VISUAL_STYLE } from "./deprem-visual-rollout";

export type TbdyTechnicalVisual3Asset = "cover" | "diagram";

const { navy: NAVY, cyan: CYAN, paper: PAPER, white: WHITE, neutral: NEUTRAL } = DEPREM_TECHNICAL_VISUAL_STYLE;

export const TBDY_TECHNICAL_VISUAL_3_SLUGS = new Set([
  "tbdy-bodrum-katli-binalar",
  "tbdy-cati-agirligi-yuk-azaltma",
  "tbdy-dusey-deprem-etkisi",
  "tbdy-r-d-dayanim-fazlaligi",
]);

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function shell(title: string, desc: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">${escapeXml(desc)}</desc>
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${WHITE}"/><stop offset="1" stop-color="${PAPER}"/></linearGradient>
    <pattern id="soil" width="24" height="18" patternUnits="userSpaceOnUse"><path d="M0 17L24 1" stroke="${CYAN}" stroke-width="1" stroke-opacity="0.18"/></pattern>
    <style>
      .label{font:700 21px Arial,sans-serif;fill:${NAVY}}
      .accent{font:700 21px Arial,sans-serif;fill:${CYAN}}
      .small{font:600 17px Arial,sans-serif;fill:${NAVY}}
      .symbol{font:700 20px Arial,sans-serif;fill:${CYAN}}
    </style>
  </defs>
  <rect width="1200" height="675" fill="url(#paper)"/>
  ${body}
</svg>`;
}

function basementCover(spec: DepremRolloutSpec) {
  const floors = [155, 235, 315, 395];
  const body = `
  <!-- one continuous structural section: upper structure + rigid basement -->
  <rect x="80" y="420" width="1040" height="175" fill="url(#soil)"/>
  <line x1="390" y1="120" x2="390" y2="570" stroke="${NAVY}" stroke-width="6"/>
  <line x1="810" y1="120" x2="810" y2="570" stroke="${NAVY}" stroke-width="6"/>
  ${floors.map((y) => `<line x1="390" y1="${y}" x2="810" y2="${y}" stroke="${NAVY}" stroke-width="5"/>`).join("")}
  <rect x="315" y="395" width="570" height="175" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/>
  <line x1="315" y1="430" x2="885" y2="430" stroke="${CYAN}" stroke-width="7"/>
  <line x1="350" y1="365" x2="350" y2="425" stroke="${CYAN}" stroke-width="5"/><path d="M350 425l-10 -18h20z" fill="${CYAN}"/>
  <line x1="850" y1="365" x2="850" y2="425" stroke="${CYAN}" stroke-width="5"/><path d="M850 425l-10 -18h20z" fill="${CYAN}"/>
  <text x="470" y="95" class="label">Üst Yapı</text>
  <text x="470" y="465" class="accent">Rijit Bodrum</text>
  <text x="900" y="435" class="small">Geçiş Döşemesi</text>
  <text x="905" y="565" class="small">Çevre Perdesi</text>
  `;
  return shell(spec.headline, "Tek yapı kesitinde üst yapı, çevre perdeli rijit bodrum ve yatay kuvvet aktarımını sağlayan geçiş döşemesini gösteren teknik şema.", body);
}

function basementDiagram(spec: DepremRolloutSpec) {
  const body = `
  <!-- transition slab plan: force path to perimeter basement walls, no second building -->
  <rect x="210" y="145" width="780" height="385" fill="${WHITE}" stroke="${NAVY}" stroke-width="9"/>
  <rect x="275" y="205" width="650" height="265" fill="${PAPER}" stroke="${NEUTRAL}" stroke-width="2"/>
  <line x1="600" y1="245" x2="600" y2="435" stroke="${CYAN}" stroke-width="5"/>
  <line x1="600" y1="340" x2="300" y2="340" stroke="${CYAN}" stroke-width="5"/><path d="M300 340l18 -10v20z" fill="${CYAN}"/>
  <line x1="600" y1="340" x2="900" y2="340" stroke="${CYAN}" stroke-width="5"/><path d="M900 340l-18 -10v20z" fill="${CYAN}"/>
  <line x1="600" y1="340" x2="600" y2="175" stroke="${CYAN}" stroke-width="5"/><path d="M600 175l-10 18h20z" fill="${CYAN}"/>
  <line x1="600" y1="340" x2="600" y2="500" stroke="${CYAN}" stroke-width="5"/><path d="M600 500l-10 -18h20z" fill="${CYAN}"/>
  <circle cx="600" cy="340" r="18" fill="${NAVY}"/>
  <text x="455" y="110" class="label">Geçiş Döşemesi</text>
  <text x="455" y="580" class="accent">Kuvvet → Çevre Perdeleri</text>
  <text x="225" y="135" class="small">Perde Hattı</text>
  `;
  return shell(spec.headline, "Geçiş döşemesindeki yatay etkinin tek plan üzerinde çevre bodrum perdelerine aktarım yolunu gösteren tamamlayıcı teknik plan.", body);
}

function roofMassCover(spec: DepremRolloutSpec) {
  const body = `
  <!-- one building; roof mass source components are shown directly at roof -->
  <line x1="410" y1="175" x2="410" y2="535" stroke="${NAVY}" stroke-width="6"/>
  <line x1="790" y1="175" x2="790" y2="535" stroke="${NAVY}" stroke-width="6"/>
  ${[235,315,395,475,535].map((y) => `<line x1="410" y1="${y}" x2="790" y2="${y}" stroke="${NAVY}" stroke-width="5"/>`).join("")}
  <path d="M390 175L600 95L810 175" fill="none" stroke="${NAVY}" stroke-width="6" stroke-linejoin="round"/>
  <line x1="495" y1="75" x2="495" y2="150" stroke="${CYAN}" stroke-width="5"/><path d="M495 150l-10 -18h20z" fill="${CYAN}"/>
  <line x1="600" y1="60" x2="600" y2="135" stroke="${CYAN}" stroke-width="5"/><path d="M600 135l-10 -18h20z" fill="${CYAN}"/>
  <line x1="705" y1="75" x2="705" y2="150" stroke="${CYAN}" stroke-width="5"/><path d="M705 150l-10 -18h20z" fill="${CYAN}"/>
  <text x="465" y="50" class="symbol">G</text>
  <text x="575" y="38" class="symbol">nQ</text>
  <text x="670" y="50" class="symbol">0.30 S</text>
  <text x="835" y="170" class="accent">Çatı Kütlesi</text>
  <text x="825" y="215" class="small">m = W / g</text>
  `;
  return shell(spec.headline, "Tek bina üzerinde çatı deprem kütlesine sabit yük, kullanım türüne bağlı nQ ve kar yükünün yüzde 30 katkısını ayrı gösteren teknik kesit.", body);
}

function roofMassDiagram(spec: DepremRolloutSpec) {
  const body = `
  <!-- load-source decomposition, not a second building -->
  <line x1="180" y1="500" x2="1020" y2="500" stroke="${NAVY}" stroke-width="3"/>
  <rect x="240" y="255" width="120" height="245" fill="${NAVY}" fill-opacity="0.12" stroke="${NAVY}" stroke-width="3"/>
  <rect x="490" y="335" width="120" height="165" fill="${CYAN}" fill-opacity="0.18" stroke="${CYAN}" stroke-width="3"/>
  <rect x="740" y="405" width="120" height="95" fill="${CYAN}" fill-opacity="0.10" stroke="${NAVY}" stroke-width="3"/>
  <path d="M360 375H465M610 415H715" stroke="${CYAN}" stroke-width="4" stroke-dasharray="8 7"/>
  <text x="282" y="535" class="label">G</text>
  <text x="525" y="535" class="accent">nQ</text>
  <text x="755" y="535" class="accent">0.30 S</text>
  <text x="365" y="165" class="label">Deprem Ağırlığı = G + nQ + 0.30 S</text>
  <text x="385" y="205" class="small">%30 yalnız çatı kar yükü hükmüdür</text>
  `;
  return shell(spec.headline, "Çatı deprem ağırlığına katılan yük bileşenlerini ayrı sütunlarla gösteren; yüzde 30 kar hükmünü genel hareketli yük indirimiyle karıştırmayan teknik şema.", body);
}

function verticalCover(spec: DepremRolloutSpec) {
  const body = `
  <!-- one vertically sensitive long-span element with local vertical mode -->
  <path d="M185 470L230 420L275 470Z" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/>
  <circle cx="930" cy="450" r="20" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><line x1="895" y1="475" x2="965" y2="475" stroke="${NAVY}" stroke-width="4"/>
  <line x1="230" y1="420" x2="930" y2="420" stroke="${NAVY}" stroke-width="7"/>
  <path d="M230 345C360 260 465 500 590 345C705 215 815 480 930 345" fill="none" stroke="${CYAN}" stroke-width="5" stroke-dasharray="9 7"/>
  ${[330,470,610,750,890].map((x) => `<line x1="${x}" y1="180" x2="${x}" y2="385" stroke="${CYAN}" stroke-width="4"/><path d="M${x} 385l-9 -17h18z" fill="${CYAN}"/>`).join("")}
  <line x1="230" y1="535" x2="930" y2="535" stroke="${NAVY}" stroke-width="2"/>
  <path d="M230 535l14 -8v16zM930 535l-14 -8v16z" fill="${NAVY}"/>
  <text x="505" y="570" class="label">Uzun Açıklık</text>
  <text x="720" y="155" class="accent">Düşey Mod</text>
  <text x="150" y="390" class="symbol">Ed(Z)</text>
  `;
  return shell(spec.headline, "Tek uzun açıklıklı elemanda düşey deprem etkisini ve yerel düşey titreşim modunu birlikte gösteren teknik eleman şeması.", body);
}

function verticalDiagram(spec: DepremRolloutSpec) {
  const body = `
  <!-- one member free-body and response envelope -->
  <path d="M250 235L295 185L340 235Z" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/>
  <line x1="295" y1="185" x2="900" y2="185" stroke="${NAVY}" stroke-width="7"/>
  ${[390,510,630,750,870].map((x) => `<line x1="${x}" y1="85" x2="${x}" y2="155" stroke="${NAVY}" stroke-width="3"/><path d="M${x} 155l-8 -15h16z" fill="${NAVY}"/>`).join("")}
  ${[450,600,750].map((x) => `<line x1="${x}" y1="300" x2="${x}" y2="215" stroke="${CYAN}" stroke-width="4"/><path d="M${x} 215l-9 17h18z" fill="${CYAN}"/>`).join("")}
  <path d="M295 430C430 520 620 520 900 430" fill="none" stroke="${CYAN}" stroke-width="6"/>
  <line x1="295" y1="430" x2="900" y2="430" stroke="${NEUTRAL}" stroke-width="2" stroke-dasharray="8 8"/>
  <text x="170" y="125" class="label">G</text>
  <text x="785" y="285" class="accent">± Ed(Z)</text>
  <text x="470" y="565" class="label">Moment / Reaksiyon Zarfı</text>
  `;
  return shell(spec.headline, "Tek eleman serbest cisim şemasında sabit yük ile artı-eksi düşey deprem etkisinin mesnet ve moment zarfına etkisini gösteren tamamlayıcı çizim.", body);
}

function rdCover(spec: DepremRolloutSpec) {
  const body = `
  <!-- Ra(T) engineering graph: D and R/I have different roles -->
  <line x1="180" y1="525" x2="1020" y2="525" stroke="${NAVY}" stroke-width="3"/>
  <line x1="180" y1="525" x2="180" y2="110" stroke="${NAVY}" stroke-width="3"/>
  <path d="M180 420L560 210H980" fill="none" stroke="${CYAN}" stroke-width="7" stroke-linejoin="round"/>
  <line x1="560" y1="210" x2="560" y2="525" stroke="${NEUTRAL}" stroke-width="2" stroke-dasharray="8 8"/>
  <line x1="180" y1="420" x2="560" y2="420" stroke="${NEUTRAL}" stroke-width="2" stroke-dasharray="8 8"/>
  <text x="105" y="425" class="symbol">D</text>
  <text x="925" y="185" class="symbol">R / I</text>
  <text x="535" y="560" class="symbol">TB</text>
  <text x="85" y="115" class="label">Ra(T)</text>
  <text x="930" y="560" class="label">Periyot (T)</text>
  `;
  return shell(spec.headline, "TBDY deprem yükü azaltma katsayısında kısa periyotta D'den başlayan ve TB sonrasında R bölü I düzeyine ulaşan ilişkiyi gösteren teknik grafik.", body);
}

function rdDiagram(spec: DepremRolloutSpec) {
  const body = `
  <!-- force-displacement interpretation: reduction and overstrength are not identical -->
  <line x1="185" y1="525" x2="1020" y2="525" stroke="${NAVY}" stroke-width="3"/>
  <line x1="185" y1="525" x2="185" y2="105" stroke="${NAVY}" stroke-width="3"/>
  <line x1="185" y1="525" x2="545" y2="155" stroke="${NAVY}" stroke-width="5" stroke-dasharray="10 8"/>
  <path d="M185 525L360 345C420 285 520 275 620 300C735 330 840 360 960 385" fill="none" stroke="${CYAN}" stroke-width="7" stroke-linecap="round"/>
  <line x1="185" y1="345" x2="360" y2="345" stroke="${NEUTRAL}" stroke-width="2" stroke-dasharray="7 7"/>
  <line x1="185" y1="285" x2="430" y2="285" stroke="${NEUTRAL}" stroke-width="2" stroke-dasharray="7 7"/>
  <text x="395" y="135" class="label">Elastik Talep</text>
  <text x="650" y="285" class="accent">Sünek Davranış</text>
  <text x="85" y="290" class="symbol">R etkisi</text>
  <text x="85" y="350" class="symbol">D kontrolü</text>
  <text x="875" y="560" class="label">Deplasman</text>
  `;
  return shell(spec.headline, "Tek kuvvet-deplasman grafiğinde R ile elastik talep azaltımı ve D ile sünek olmayan kuvvet güvenliği rollerini birbirinden ayıran tamamlayıcı teknik grafik.", body);
}

export function renderTbdyTechnicalVisual3Svg(spec: DepremRolloutSpec, asset: TbdyTechnicalVisual3Asset) {
  if (spec.slug === "tbdy-bodrum-katli-binalar") return asset === "cover" ? basementCover(spec) : basementDiagram(spec);
  if (spec.slug === "tbdy-cati-agirligi-yuk-azaltma") return asset === "cover" ? roofMassCover(spec) : roofMassDiagram(spec);
  if (spec.slug === "tbdy-dusey-deprem-etkisi") return asset === "cover" ? verticalCover(spec) : verticalDiagram(spec);
  if (spec.slug === "tbdy-r-d-dayanim-fazlaligi") return asset === "cover" ? rdCover(spec) : rdDiagram(spec);
  throw new Error(`TBDY teknik görsel set 3 eşleşmesi yok: ${spec.slug}`);
}
