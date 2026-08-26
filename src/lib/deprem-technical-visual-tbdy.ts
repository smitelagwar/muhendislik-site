import type { DepremRolloutSpec } from "./deprem-rollout";
import { DEPREM_TECHNICAL_VISUAL_STYLE } from "./deprem-visual-rollout";

export type TbdyTechnicalVisualAsset = "cover" | "diagram";

const { navy: NAVY, cyan: CYAN, paper: PAPER, white: WHITE, neutral: NEUTRAL } = DEPREM_TECHNICAL_VISUAL_STYLE;

export const TBDY_TECHNICAL_VISUAL_SLUGS = new Set([
  "tbdy-goreli-kat-otelenmesi",
  "tbdy-dismerkezlik-kurali",
  "tbdy-p-delta-ikinci-mertebe",
  "tbdy-2018-sismik-izolasyon",
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
    <pattern id="concrete" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="5" cy="7" r="1" fill="${NAVY}" fill-opacity="0.13"/><circle cx="16" cy="15" r="0.9" fill="${NAVY}" fill-opacity="0.1"/></pattern>
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

function driftCover(spec: DepremRolloutSpec) {
  const levels = [540, 465, 390, 315, 240, 165, 90];
  const left = [370, 375, 384, 398, 417, 441, 470];
  const right = left.map((x) => x + 250);
  const frame = levels.map((y, i) => i === 0 ? "" : `<line x1="${left[i]}" y1="${y}" x2="${right[i]}" y2="${y}" stroke="${NAVY}" stroke-width="5" stroke-linecap="round"/>`).join("");
  const leftColumn = left.map((x, i) => `${x},${levels[i]}`).join(" ");
  const rightColumn = right.map((x, i) => `${x},${levels[i]}`).join(" ");
  const arrows = levels.slice(1).map((y, i) => `<line x1="300" y1="${y}" x2="${left[i + 1] - 12}" y2="${y}" stroke="${CYAN}" stroke-width="2.5"/><path d="M${left[i + 1] - 12} ${y}l-11 -7v14z" fill="${CYAN}"/>`).join("");
  const body = `
  <!-- one deformed frame; dashed line is only a reference axis, never a second building -->
  <line x1="300" y1="72" x2="300" y2="542" stroke="${NEUTRAL}" stroke-width="2" stroke-dasharray="8 9"/>
  <polyline points="${leftColumn}" fill="none" stroke="${NAVY}" stroke-width="6" stroke-linejoin="round"/>
  <polyline points="${rightColumn}" fill="none" stroke="${NAVY}" stroke-width="6" stroke-linejoin="round"/>
  ${frame}
  <rect x="330" y="540" width="360" height="38" rx="3" fill="url(#concrete)" stroke="${NAVY}" stroke-width="4"/>
  ${arrows}
  <text x="96" y="122" class="accent">Kat Deplasmanı</text>
  <text x="725" y="195" class="label">Göreli Kat Ötelenmesi</text>
  <line x1="730" y1="215" x2="660" y2="240" stroke="${NAVY}" stroke-width="2"/><circle cx="660" cy="240" r="4" fill="${NAVY}"/>
  <line x1="720" y1="315" x2="782" y2="315" stroke="${CYAN}" stroke-width="2.5"/>
  <line x1="720" y1="390" x2="760" y2="390" stroke="${CYAN}" stroke-width="2.5"/>
  <line x1="770" y1="315" x2="770" y2="390" stroke="${CYAN}" stroke-width="2"/>
  <path d="M770 315l-7 12h14zM770 390l-7 -12h14z" fill="${CYAN}"/>
  <text x="790" y="360" class="symbol">Δi</text>
  `;
  return shell(spec.headline, "Tek bir ötelenmiş taşıyıcı çerçevede kat deplasmanlarını ve iki komşu kat arasındaki göreli ötelenmeyi gösteren teknik çizim.", body);
}

function driftDiagram(spec: DepremRolloutSpec) {
  const ys = [550, 475, 400, 325, 250, 175, 100];
  const xs = [300, 320, 352, 398, 456, 525, 605];
  const curve = xs.map((x, i) => `${x},${ys[i]}`).join(" ");
  const guides = ys.map((y) => `<line x1="270" y1="${y}" x2="720" y2="${y}" stroke="${NEUTRAL}" stroke-width="1.6" stroke-dasharray="7 8"/>`).join("");
  const points = xs.map((x, i) => `<circle cx="${x}" cy="${ys[i]}" r="6" fill="${i === 0 ? NAVY : CYAN}"/>`).join("");
  const body = `
  ${guides}
  <line x1="270" y1="75" x2="270" y2="565" stroke="${NAVY}" stroke-width="3"/>
  <polyline points="${curve}" fill="none" stroke="${CYAN}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  ${points}
  <text x="92" y="95" class="label">Kat Seviyesi</text>
  <text x="590" y="600" class="accent">Deplasman Profili</text>
  <line x1="790" y1="250" x2="790" y2="325" stroke="${CYAN}" stroke-width="2.5"/>
  <path d="M790 250l-7 12h14zM790 325l-7 -12h14z" fill="${CYAN}"/>
  <text x="815" y="295" class="symbol">Δi</text>
  <text x="860" y="292" class="small">Katlar Arası Fark</text>
  `;
  return shell(spec.headline, "Kat seviyelerine karşı deplasman profilini ve komşu katlar arasındaki göreli deplasman farkını gösteren tamamlayıcı şema.", body);
}

function eccentricityCover(spec: DepremRolloutSpec) {
  const body = `
  <!-- one floor plan only -->
  <rect x="270" y="155" width="610" height="360" rx="5" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/>
  <rect x="315" y="195" width="42" height="280" fill="${NAVY}" fill-opacity="0.08" stroke="${NAVY}" stroke-width="3"/>
  <rect x="790" y="195" width="42" height="280" fill="${NAVY}" fill-opacity="0.08" stroke="${NAVY}" stroke-width="3"/>
  <line x1="575" y1="155" x2="575" y2="515" stroke="${NEUTRAL}" stroke-width="2" stroke-dasharray="8 8"/>
  <line x1="270" y1="335" x2="880" y2="335" stroke="${NEUTRAL}" stroke-width="2" stroke-dasharray="8 8"/>
  <circle cx="535" cy="335" r="9" fill="${NAVY}"/>
  <circle cx="615" cy="335" r="9" fill="${CYAN}"/>
  <line x1="535" y1="385" x2="615" y2="385" stroke="${CYAN}" stroke-width="2.5"/>
  <path d="M535 385l12 -7v14zM615 385l-12 -7v14z" fill="${CYAN}"/>
  <text x="568" y="373" class="symbol">e</text>
  <text x="400" y="300" class="label">Kütle Merkezi</text>
  <line x1="505" y1="305" x2="535" y2="328" stroke="${NAVY}" stroke-width="2"/>
  <text x="640" y="300" class="accent">Rijitlik Merkezi</text>
  <line x1="650" y1="307" x2="615" y2="328" stroke="${CYAN}" stroke-width="2"/>
  <line x1="105" y1="335" x2="250" y2="335" stroke="${CYAN}" stroke-width="5"/><path d="M250 335l-19 -11v22z" fill="${CYAN}"/>
  <text x="105" y="305" class="accent">Deprem Etkisi</text>
  <path d="M760 112A115 115 0 0 1 870 220" fill="none" stroke="${CYAN}" stroke-width="4"/><path d="M871 220l-18 -7 13 -14z" fill="${CYAN}"/>
  <text x="760" y="90" class="accent">Burulma</text>
  `;
  return shell(spec.headline, "Tek döşeme planında kütle merkezi ile rijitlik merkezi arasındaki dışmerkezliği ve bunun burulma etkisini gösteren teknik plan.", body);
}

function eccentricityDiagram(spec: DepremRolloutSpec) {
  const body = `
  <!-- one plan, two load application lines on the same plan -->
  <rect x="270" y="150" width="620" height="370" rx="5" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/>
  <line x1="580" y1="150" x2="580" y2="520" stroke="${NAVY}" stroke-opacity="0.4" stroke-width="2" stroke-dasharray="8 8"/>
  <circle cx="580" cy="335" r="9" fill="${NAVY}"/>
  <line x1="520" y1="190" x2="520" y2="480" stroke="${CYAN}" stroke-width="3" stroke-dasharray="9 7"/>
  <line x1="640" y1="190" x2="640" y2="480" stroke="${CYAN}" stroke-width="3" stroke-dasharray="9 7"/>
  <line x1="580" y1="250" x2="520" y2="250" stroke="${CYAN}" stroke-width="2.5"/>
  <line x1="580" y1="420" x2="640" y2="420" stroke="${CYAN}" stroke-width="2.5"/>
  <path d="M520 250l12 -7v14zM640 420l-12 -7v14z" fill="${CYAN}"/>
  <text x="478" y="235" class="symbol">−e</text>
  <text x="650" y="405" class="symbol">+e</text>
  <text x="700" y="220" class="accent">Ek Dışmerkezlik</text>
  <text x="440" y="565" class="label">Tek Plan · İki Yükleme Konumu</text>
  `;
  return shell(spec.headline, "Tek plan üzerinde nominal yükleme ekseninin iki yanında artı ve eksi ek dışmerkezlik konumlarını gösteren tamamlayıcı teknik plan.", body);
}

function pDeltaCover(spec: DepremRolloutSpec) {
  const levels = [540, 435, 330, 225, 120];
  const left = [390, 397, 410, 430, 458];
  const right = left.map((x) => x + 280);
  const body = `
  <polyline points="${left.map((x, i) => `${x},${levels[i]}`).join(" ")}" fill="none" stroke="${NAVY}" stroke-width="6"/>
  <polyline points="${right.map((x, i) => `${x},${levels[i]}`).join(" ")}" fill="none" stroke="${NAVY}" stroke-width="6"/>
  ${levels.slice(1).map((y, i) => `<line x1="${left[i + 1]}" y1="${y}" x2="${right[i + 1]}" y2="${y}" stroke="${NAVY}" stroke-width="5"/>`).join("")}
  <rect x="350" y="540" width="390" height="38" fill="url(#concrete)" stroke="${NAVY}" stroke-width="4"/>
  <line x1="598" y1="52" x2="598" y2="104" stroke="${NAVY}" stroke-width="5"/><path d="M598 104l-12 -20h24z" fill="${NAVY}"/>
  <text x="620" y="75" class="label">P</text>
  <line x1="300" y1="120" x2="445" y2="120" stroke="${CYAN}" stroke-width="4"/><path d="M445 120l-18 -10v20z" fill="${CYAN}"/>
  <text x="235" y="108" class="symbol">Δ</text>
  <path d="M710 390A120 120 0 0 1 760 510" fill="none" stroke="${CYAN}" stroke-width="4"/><path d="M762 510l-18 -7 13 -14z" fill="${CYAN}"/>
  <text x="745" y="365" class="accent">İkinci Mertebe</text>
  <text x="165" y="230" class="accent">Yatay Ötelenme</text>
  `;
  return shell(spec.headline, "Tek ötelenmiş çerçevede düşey eksenel yük ile yatay ötelenmenin oluşturduğu ikinci mertebe P–Delta etkisini gösteren teknik çizim.", body);
}

function pDeltaDiagram(spec: DepremRolloutSpec) {
  const body = `
  <!-- one deformed member and one reference axis -->
  <line x1="420" y1="105" x2="420" y2="550" stroke="${NEUTRAL}" stroke-width="2" stroke-dasharray="8 9"/>
  <path d="M420 550C430 430 455 285 525 120" fill="none" stroke="${NAVY}" stroke-width="7" stroke-linecap="round"/>
  <rect x="355" y="550" width="180" height="34" fill="url(#concrete)" stroke="${NAVY}" stroke-width="4"/>
  <line x1="525" y1="55" x2="525" y2="108" stroke="${NAVY}" stroke-width="5"/><path d="M525 108l-12 -20h24z" fill="${NAVY}"/>
  <text x="548" y="78" class="label">P</text>
  <line x1="420" y1="165" x2="505" y2="165" stroke="${CYAN}" stroke-width="2.5"/>
  <path d="M420 165l12 -7v14zM505 165l-12 -7v14z" fill="${CYAN}"/>
  <text x="455" y="150" class="symbol">Δ</text>
  <path d="M555 410A110 110 0 0 1 615 505" fill="none" stroke="${CYAN}" stroke-width="4"/><path d="M617 505l-18 -7 13 -14z" fill="${CYAN}"/>
  <text x="650" y="390" class="accent">P·Δ Etkisi</text>
  <text x="210" y="285" class="label">Referans Ekseni</text>
  `;
  return shell(spec.headline, "Tek deforme eleman, referans ekseni, eksenel P yükü ve Δ ötelenmesi üzerinden P–Delta etkisini açıklayan tamamlayıcı çizim.", body);
}

function isolationCover(spec: DepremRolloutSpec) {
  const floorYs = [470, 395, 320, 245, 170, 95];
  const body = `
  <!-- one isolated building only -->
  <rect x="330" y="470" width="520" height="26" fill="${NAVY}" fill-opacity="0.1" stroke="${NAVY}" stroke-width="4"/>
  <line x1="380" y1="95" x2="380" y2="470" stroke="${NAVY}" stroke-width="6"/>
  <line x1="800" y1="95" x2="800" y2="470" stroke="${NAVY}" stroke-width="6"/>
  ${floorYs.slice(0, 5).map((y) => `<line x1="380" y1="${y}" x2="800" y2="${y}" stroke="${NAVY}" stroke-width="5"/>`).join("")}
  ${[405,510,615,720].map((x) => `<g><rect x="${x}" y="500" width="54" height="48" rx="10" fill="${WHITE}" stroke="${NAVY}" stroke-width="3"/><line x1="${x + 8}" y1="512" x2="${x + 46}" y2="512" stroke="${CYAN}" stroke-width="3"/><line x1="${x + 8}" y1="524" x2="${x + 46}" y2="524" stroke="${CYAN}" stroke-width="3"/><line x1="${x + 8}" y1="536" x2="${x + 46}" y2="536" stroke="${CYAN}" stroke-width="3"/></g>`).join("")}
  <rect x="300" y="552" width="580" height="34" fill="url(#concrete)" stroke="${NAVY}" stroke-width="4"/>
  <line x1="220" y1="522" x2="350" y2="522" stroke="${CYAN}" stroke-width="5"/><path d="M350 522l-19 -11v22z" fill="${CYAN}"/>
  <text x="95" y="512" class="accent">Yatay Hareket</text>
  <text x="885" y="525" class="accent">İzolatörler</text>
  <line x1="875" y1="530" x2="758" y2="524" stroke="${CYAN}" stroke-width="2"/>
  <text x="870" y="250" class="label">Üstyapı</text>
  `;
  return shell(spec.headline, "Tek bina kesitinde üstyapı ile temel arasına yerleştirilen sismik izolatörleri ve yatay hareketi gösteren teknik çizim.", body);
}

function isolationDiagram(spec: DepremRolloutSpec) {
  const body = `
  <!-- close-up of one isolator, no duplicate building -->
  <rect x="350" y="115" width="500" height="45" rx="4" fill="url(#concrete)" stroke="${NAVY}" stroke-width="4"/>
  <rect x="420" y="160" width="360" height="330" rx="38" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/>
  ${[195,235,275,315,355,395,435,475].map((y) => `<line x1="445" y1="${y}" x2="755" y2="${y}" stroke="${CYAN}" stroke-width="5"/>`).join("")}
  <rect x="350" y="490" width="500" height="45" rx="4" fill="url(#concrete)" stroke="${NAVY}" stroke-width="4"/>
  <line x1="420" y1="585" x2="690" y2="585" stroke="${CYAN}" stroke-width="3"/>
  <path d="M420 585l14 -8v16zM690 585l-14 -8v16z" fill="${CYAN}"/>
  <text x="485" y="620" class="accent">Tasarım Deplasmanı</text>
  <text x="875" y="140" class="label">Üst Plaka</text>
  <line x1="865" y1="145" x2="820" y2="145" stroke="${NAVY}" stroke-width="2"/>
  <text x="875" y="510" class="label">Alt Plaka</text>
  <line x1="865" y1="515" x2="820" y2="515" stroke="${NAVY}" stroke-width="2"/>
  <text x="875" y="325" class="accent">Elastomer Katmanları</text>
  <line x1="865" y1="330" x2="760" y2="330" stroke="${CYAN}" stroke-width="2"/>
  `;
  return shell(spec.headline, "Tek bir sismik izolatörün katmanlarını, üst-alt plakalarını ve yatay tasarım deplasmanını gösteren yakın teknik detay.", body);
}

export function renderTbdyTechnicalVisualSvg(spec: DepremRolloutSpec, asset: TbdyTechnicalVisualAsset) {
  switch (spec.slug) {
    case "tbdy-goreli-kat-otelenmesi": return asset === "cover" ? driftCover(spec) : driftDiagram(spec);
    case "tbdy-dismerkezlik-kurali": return asset === "cover" ? eccentricityCover(spec) : eccentricityDiagram(spec);
    case "tbdy-p-delta-ikinci-mertebe": return asset === "cover" ? pDeltaCover(spec) : pDeltaDiagram(spec);
    case "tbdy-2018-sismik-izolasyon": return asset === "cover" ? isolationCover(spec) : isolationDiagram(spec);
    default: throw new Error(`TBDY teknik renderer bulunamadı: ${spec.slug}`);
  }
}
