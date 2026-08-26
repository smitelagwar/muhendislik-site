import type { DepremRolloutSpec } from "./deprem-rollout";
import { DEPREM_TECHNICAL_VISUAL_SLUGS, DEPREM_TECHNICAL_VISUAL_STYLE } from "./deprem-visual-rollout";

export type DepremTechnicalVisualAsset = "cover" | "diagram";

const { navy: NAVY, cyan: CYAN, paper: PAPER, white: WHITE, neutral: NEUTRAL } = DEPREM_TECHNICAL_VISUAL_STYLE;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function svgShell(title: string, desc: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title>
  <desc id="desc">${escapeXml(desc)}</desc>
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${WHITE}"/>
      <stop offset="1" stop-color="${PAPER}"/>
    </linearGradient>
    <pattern id="soilHatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(24)">
      <line x1="0" y1="0" x2="0" y2="16" stroke="${NAVY}" stroke-opacity="0.12" stroke-width="1.4"/>
    </pattern>
    <pattern id="concreteStipple" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="5" cy="7" r="1.1" fill="${NAVY}" fill-opacity="0.14"/>
      <circle cx="15" cy="15" r="0.9" fill="${NAVY}" fill-opacity="0.11"/>
    </pattern>
    <style>
      .label{font:700 21px Arial,sans-serif;fill:${NAVY}}
      .accent{font:700 21px Arial,sans-serif;fill:${CYAN}}
      .small{font:600 17px Arial,sans-serif;fill:${NAVY}}
      .symbol{font:700 19px Arial,sans-serif;fill:${NAVY}}
    </style>
  </defs>
  <rect width="1200" height="675" fill="url(#paper)"/>
  ${body}
</svg>`;
}

function basementCover(spec: DepremRolloutSpec) {
  const body = `
  <!-- retained soil: single section -->
  <path d="M70 142C175 139 265 148 360 166L472 187V548H70Z" fill="url(#soilHatch)"/>
  <path d="M70 142C175 139 265 148 360 166L472 187" fill="none" stroke="${NAVY}" stroke-width="3" stroke-linecap="round"/>
  <path d="M88 532H470" stroke="${NAVY}" stroke-opacity="0.18" stroke-width="2"/>

  <!-- one reinforced-concrete basement wall and slab -->
  <rect x="472" y="118" width="62" height="430" rx="3" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/>
  <rect x="472" y="118" width="62" height="430" fill="url(#concreteStipple)"/>
  <rect x="472" y="520" width="405" height="58" rx="3" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/>
  <rect x="472" y="520" width="405" height="58" fill="url(#concreteStipple)"/>
  <line x1="491" y1="137" x2="491" y2="540" stroke="${NAVY}" stroke-width="3"/>
  <line x1="515" y1="137" x2="515" y2="540" stroke="${NAVY}" stroke-width="3"/>
  ${[165,215,265,315,365,415,465,515].map((y) => `<line x1="489" y1="${y}" x2="517" y2="${y}" stroke="${NAVY}" stroke-width="2"/>`).join("")}
  <line x1="500" y1="543" x2="850" y2="543" stroke="${NAVY}" stroke-width="3"/>
  <line x1="500" y1="560" x2="850" y2="560" stroke="${NAVY}" stroke-width="3"/>

  <!-- static pressure field inside retained soil; arrows act toward wall -->
  <path d="M463 205L463 505L285 505Z" fill="${NAVY}" fill-opacity="0.045" stroke="${NAVY}" stroke-width="2.4"/>
  ${[
    [246,438],[286,414],[326,390],[366,366],[406,342],[446,318],[486,294]
  ].map(([y,x]) => `<line x1="${x}" y1="${y}" x2="463" y2="${y}" stroke="${NAVY}" stroke-width="2.5"/><path d="M463 ${y}l-12 -7v14z" fill="${NAVY}"/>`).join("")}

  <!-- dynamic increment: cyan dashed envelope, same single physical scene -->
  <path d="M463 205L463 505L230 505" fill="none" stroke="${CYAN}" stroke-width="3" stroke-dasharray="9 8"/>
  ${[
    [266,424],[326,374],[386,324],[446,274],[496,240]
  ].map(([y,x]) => `<line x1="${x}" y1="${y}" x2="463" y2="${y}" stroke="${CYAN}" stroke-width="2.4"/><path d="M463 ${y}l-11 -7v14z" fill="${CYAN}"/>`).join("")}

  <text x="610" y="182" class="label">Bodrum Perdesi</text>
  <line x1="600" y1="190" x2="532" y2="230" stroke="${NAVY}" stroke-width="2"/><circle cx="532" cy="230" r="4" fill="${NAVY}"/>
  <text x="104" y="235" class="label">Statik Basınç</text>
  <line x1="255" y1="229" x2="344" y2="286" stroke="${NAVY}" stroke-width="2"/>
  <text x="104" y="285" class="accent">Dinamik Ek Etki</text>
  <line x1="276" y1="279" x2="304" y2="350" stroke="${CYAN}" stroke-width="2"/>
  `;
  return svgShell(spec.headline, "Tek bodrum perdesi üzerinde statik zemin basıncı ile deprem kaynaklı dinamik ek etkiyi gösteren teknik kesit.", body);
}

function basementDiagram(spec: DepremRolloutSpec) {
  const body = `
  <!-- single wall; second asset focuses on pressure resultants rather than repeating cover composition -->
  <path d="M95 145H438V552H95Z" fill="url(#soilHatch)"/>
  <rect x="438" y="120" width="68" height="432" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/>
  <rect x="438" y="120" width="68" height="432" fill="url(#concreteStipple)"/>
  <rect x="438" y="524" width="360" height="56" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/>
  <rect x="438" y="524" width="360" height="56" fill="url(#concreteStipple)"/>

  <!-- pressure envelopes -->
  <path d="M430 204V506L267 506Z" fill="${NAVY}" fill-opacity="0.05" stroke="${NAVY}" stroke-width="2.5"/>
  <path d="M430 204V506L215 506" fill="none" stroke="${CYAN}" stroke-width="3" stroke-dasharray="9 8"/>
  ${[250,300,350,400,450,500].map((y, i) => {
    const sx = 402 - i * 23;
    return `<line x1="${sx}" y1="${y}" x2="430" y2="${y}" stroke="${NAVY}" stroke-width="2"/><path d="M430 ${y}l-10 -6v12z" fill="${NAVY}"/>`;
  }).join("")}

  <!-- resultant interpretation, no second structure -->
  <line x1="710" y1="190" x2="710" y2="500" stroke="${NEUTRAL}" stroke-width="2" stroke-dasharray="7 8"/>
  <line x1="710" y1="372" x2="865" y2="372" stroke="${NAVY}" stroke-width="5" stroke-linecap="round"/>
  <path d="M865 372l-18 -11v22z" fill="${NAVY}"/>
  <circle cx="710" cy="372" r="6" fill="${NAVY}"/>
  <text x="740" y="345" class="label">Statik Bileşke</text>

  <line x1="710" y1="312" x2="930" y2="312" stroke="${CYAN}" stroke-width="5" stroke-linecap="round"/>
  <path d="M930 312l-18 -11v22z" fill="${CYAN}"/>
  <circle cx="710" cy="312" r="6" fill="${CYAN}"/>
  <text x="740" y="285" class="accent">Dinamik Ek Bileşke</text>

  <text x="680" y="545" class="small">Uygulama noktaları şematiktir</text>
  <text x="110" y="105" class="label">Basınç Dağılımı</text>
  `;
  return svgShell(spec.headline, "Bodrum perdesindeki statik ve dinamik basınç dağılımlarını ve bunların şematik bileşke etkilerini gösteren tamamlayıcı teknik çizim.", body);
}

function foundationCover(spec: DepremRolloutSpec) {
  const body = `
  <!-- one foundation/column system only -->
  <path d="M90 505H1025V610H90Z" fill="url(#soilHatch)"/>
  <line x1="90" y1="505" x2="1025" y2="505" stroke="${NAVY}" stroke-width="3"/>
  <rect x="265" y="405" width="545" height="108" rx="3" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/>
  <rect x="265" y="405" width="545" height="108" fill="url(#concreteStipple)"/>
  <rect x="491" y="172" width="92" height="237" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/>
  <rect x="491" y="172" width="92" height="237" fill="url(#concreteStipple)"/>

  <!-- loads and resistance -->
  <line x1="537" y1="72" x2="537" y2="158" stroke="${NAVY}" stroke-width="5" stroke-linecap="round"/>
  <path d="M537 158l-12 -20h24z" fill="${NAVY}"/>
  <text x="472" y="55" class="label">Düşey Yük</text>

  <line x1="300" y1="228" x2="475" y2="228" stroke="${CYAN}" stroke-width="5" stroke-linecap="round"/>
  <path d="M475 228l-20 -12v24z" fill="${CYAN}"/>
  <text x="160" y="220" class="accent">Yatay Yük</text>

  <line x1="690" y1="535" x2="478" y2="535" stroke="${NAVY}" stroke-width="5" stroke-linecap="round"/>
  <path d="M478 535l20 -12v24z" fill="${NAVY}"/>
  <text x="705" y="542" class="label">Sürtünme Direnci</text>

  ${[330,410,490,570,650,730].map((x) => `<line x1="${x}" y1="590" x2="${x}" y2="526" stroke="${NAVY}" stroke-width="2.5"/><path d="M${x} 526l-7 12h14z" fill="${NAVY}"/>`).join("")}
  <text x="445" y="635" class="label">Zemin Tepkisi</text>

  <!-- overturning tendency around toe, same physical foundation -->
  <path d="M780 344A92 92 0 0 1 836 430" fill="none" stroke="${CYAN}" stroke-width="4"/>
  <path d="M838 430l-18 -7 13 -14z" fill="${CYAN}"/>
  <text x="812" y="318" class="accent">Devrilme</text>
  <text x="334" y="360" class="accent">Kayma</text>
  <text x="292" y="447" class="label">Temel</text>
  `;
  return svgShell(spec.headline, "Tek temel-kolon sistemi üzerinde yatay ve düşey yükleri, sürtünme direncini, zemin tepkisini, kayma ve devrilme eğilimini gösteren teknik kesit.", body);
}

function foundationDiagram(spec: DepremRolloutSpec) {
  const body = `
  <!-- complementary stability view: single footing + resultant and bearing pressure -->
  <path d="M110 475H1050V605H110Z" fill="url(#soilHatch)"/>
  <line x1="110" y1="475" x2="1050" y2="475" stroke="${NAVY}" stroke-width="3"/>
  <rect x="260" y="350" width="560" height="125" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/>
  <rect x="260" y="350" width="560" height="125" fill="url(#concreteStipple)"/>

  <!-- trapezoidal bearing pressure under footing -->
  <path d="M275 505L275 580L800 535L800 505Z" fill="${CYAN}" fill-opacity="0.08" stroke="${CYAN}" stroke-width="3"/>
  ${[310,380,450,520,590,660,730,785].map((x, i) => {
    const len = 62 - i * 5;
    return `<line x1="${x}" y1="${570 - i * 5}" x2="${x}" y2="510" stroke="${CYAN}" stroke-width="2"/><path d="M${x} 510l-7 12h14z" fill="${CYAN}"/>`;
  }).join("")}
  <text x="330" y="630" class="accent">Taban Basıncı</text>

  <!-- centerline + eccentric resultant -->
  <line x1="540" y1="165" x2="540" y2="475" stroke="${NAVY}" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="8 8"/>
  <line x1="618" y1="135" x2="592" y2="342" stroke="${NAVY}" stroke-width="5" stroke-linecap="round"/>
  <path d="M592 342l-9 -21 22 3z" fill="${NAVY}"/>
  <text x="635" y="150" class="label">Bileşke (R)</text>

  <line x1="540" y1="300" x2="604" y2="300" stroke="${CYAN}" stroke-width="2.5"/>
  <path d="M540 300l11 -7v14z" fill="${CYAN}"/><path d="M604 300l-11 -7v14z" fill="${CYAN}"/>
  <text x="565" y="285" class="accent">e</text>
  <text x="620" y="304" class="small">Eksantrisite</text>

  <path d="M735 232A105 105 0 0 1 804 325" fill="none" stroke="${CYAN}" stroke-width="4"/>
  <path d="M806 325l-18 -7 13 -14z" fill="${CYAN}"/>
  <text x="740" y="205" class="accent">Devrilme Eğilimi</text>
  `;
  return svgShell(spec.headline, "Temel taban basıncı, bileşke kuvvet ve eksantrisite ilişkisini gösteren tamamlayıcı stabilite şeması.", body);
}

export function hasDepremTechnicalVisual(slug: string) {
  return DEPREM_TECHNICAL_VISUAL_SLUGS.has(slug);
}

export function renderDepremTechnicalVisualSvg(spec: DepremRolloutSpec, asset: DepremTechnicalVisualAsset) {
  if (spec.slug === "bodrum-perdesi-statik-dinamik-zemin-basinci") {
    return asset === "cover" ? basementCover(spec) : basementDiagram(spec);
  }
  if (spec.slug === "temel-kayma-devrilme-guvenligi") {
    return asset === "cover" ? foundationCover(spec) : foundationDiagram(spec);
  }
  throw new Error(`Teknik görsel renderer bulunamadı: ${spec.slug}`);
}
