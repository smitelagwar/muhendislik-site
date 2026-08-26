import type { DepremRolloutSpec } from "./deprem-rollout";
import { DEPREM_TECHNICAL_VISUAL_STYLE } from "./deprem-visual-rollout";

export type TbdyTechnicalVisualAsset = "cover" | "diagram";

const { navy: NAVY, cyan: CYAN, paper: PAPER, white: WHITE, neutral: NEUTRAL } = DEPREM_TECHNICAL_VISUAL_STYLE;

export const TBDY_TECHNICAL_VISUAL_2_SLUGS = new Set([
  "tbdy-tasarim-spektrumu-cizimi",
  "tbdy-mod-birlesim-srss-cqc",
  "tbdy-rijit-yari-rijit-diyafram",
  "tbdy-deprem-derzi-hesabi",
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
    <pattern id="concrete" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="5" cy="7" r="1" fill="${NAVY}" fill-opacity="0.13"/><circle cx="16" cy="15" r="0.9" fill="${NAVY}" fill-opacity="0.10"/></pattern>
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

function spectrumCover(spec: DepremRolloutSpec) {
  const body = `
  <line x1="180" y1="520" x2="1020" y2="520" stroke="${NAVY}" stroke-width="3"/>
  <line x1="180" y1="520" x2="180" y2="100" stroke="${NAVY}" stroke-width="3"/>
  <path d="M180 505 C230 430 270 320 330 235 L560 235 C675 235 735 310 800 385 C870 440 940 475 1010 492" fill="none" stroke="${CYAN}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="330" y1="235" x2="330" y2="520" stroke="${NEUTRAL}" stroke-width="2" stroke-dasharray="8 8"/>
  <line x1="560" y1="235" x2="560" y2="520" stroke="${NEUTRAL}" stroke-width="2" stroke-dasharray="8 8"/>
  <line x1="180" y1="235" x2="560" y2="235" stroke="${NEUTRAL}" stroke-width="2" stroke-dasharray="8 8"/>
  <text x="300" y="555" class="symbol">TA</text>
  <text x="545" y="555" class="symbol">TB</text>
  <text x="115" y="242" class="symbol">SDS</text>
  <text x="940" y="555" class="label">Periyot (T)</text>
  <text x="82" y="110" class="label">Sa(T)</text>
  <text x="650" y="170" class="accent">Tasarım Spektrumu</text>
  `;
  return shell(spec.headline, "Tasarım spektrumunun yükselen, sabit ve azalan bölgelerini TA, TB ve SDS ile sade biçimde gösteren teknik grafik.", body);
}

function spectrumDiagram(spec: DepremRolloutSpec) {
  const body = `
  <line x1="165" y1="525" x2="1020" y2="525" stroke="${NAVY}" stroke-width="3"/>
  <line x1="165" y1="525" x2="165" y2="105" stroke="${NAVY}" stroke-width="3"/>
  <path d="M165 500 L315 235 L555 235 C665 235 735 325 800 395 C875 455 940 482 1010 495" fill="none" stroke="${CYAN}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  ${[315,555,800].map((x) => `<line x1="${x}" y1="210" x2="${x}" y2="525" stroke="${NEUTRAL}" stroke-width="2" stroke-dasharray="7 8"/>`).join("")}
  <text x="225" y="180" class="small">Kısa Periyot</text>
  <text x="385" y="205" class="accent">Sabit Bölge</text>
  <text x="670" y="315" class="small">Azalan Bölge</text>
  <text x="300" y="560" class="symbol">TA</text>
  <text x="540" y="560" class="symbol">TB</text>
  <text x="785" y="560" class="symbol">TL</text>
  `;
  return shell(spec.headline, "Aynı tasarım spektrumunu bölgelere ayırarak TA, TB ve TL geçişlerinin çizim mantığını açıklayan tamamlayıcı grafik.", body);
}

function modalCover(spec: DepremRolloutSpec) {
  const body = `
  <!-- modal response curves, not duplicated buildings -->
  <line x1="180" y1="545" x2="180" y2="115" stroke="${NAVY}" stroke-width="3"/>
  <path d="M180 535 C235 485 225 420 285 365 C345 310 315 245 390 165" fill="none" stroke="${NAVY}" stroke-width="4" stroke-linecap="round"/>
  <path d="M180 535 C255 500 335 455 300 390 C260 320 390 260 430 165" fill="none" stroke="${CYAN}" stroke-width="4" stroke-linecap="round"/>
  <path d="M180 535 C245 505 235 430 340 405 C445 380 360 255 470 165" fill="none" stroke="${NAVY}" stroke-opacity="0.55" stroke-width="4" stroke-linecap="round"/>
  <text x="285" y="125" class="label">Modal Tepkiler</text>
  <line x1="600" y1="335" x2="735" y2="335" stroke="${CYAN}" stroke-width="5"/><path d="M735 335l-18 -10v20z" fill="${CYAN}"/>
  <path d="M800 500 C830 440 820 360 855 305 C885 255 900 205 930 155" fill="none" stroke="${CYAN}" stroke-width="7" stroke-linecap="round"/>
  <line x1="800" y1="525" x2="800" y2="135" stroke="${NEUTRAL}" stroke-width="2" stroke-dasharray="8 8"/>
  <text x="805" y="555" class="accent">Birleşik Tepki</text>
  <text x="625" y="305" class="small">SRSS / CQC</text>
  `;
  return shell(spec.headline, "Birden fazla modal tepkinin SRSS veya CQC yaklaşımıyla tek birleşik tepkiye dönüştürülmesini gösteren teknik şema.", body);
}

function modalDiagram(spec: DepremRolloutSpec) {
  const body = `
  <line x1="165" y1="520" x2="1010" y2="520" stroke="${NAVY}" stroke-width="3"/>
  <line x1="165" y1="520" x2="165" y2="135" stroke="${NAVY}" stroke-width="3"/>
  <path d="M210 520 C250 515 275 465 300 365 C325 265 345 195 375 520" fill="none" stroke="${NAVY}" stroke-width="5"/>
  <path d="M435 520 C470 510 505 430 535 320 C565 215 595 210 625 520" fill="none" stroke="${CYAN}" stroke-width="5"/>
  <path d="M690 520 C715 515 755 455 790 350 C825 245 860 225 900 520" fill="none" stroke="${NAVY}" stroke-opacity="0.55" stroke-width="5"/>
  <text x="245" y="330" class="label">Mod i</text>
  <text x="500" y="285" class="accent">Mod j</text>
  <line x1="300" y1="570" x2="535" y2="570" stroke="${CYAN}" stroke-width="2.5"/>
  <path d="M300 570l12 -7v14zM535 570l-12 -7v14z" fill="${CYAN}"/>
  <text x="365" y="600" class="small">Frekans Yakınlığı</text>
  <text x="875" y="555" class="label">Frekans</text>
  `;
  return shell(spec.headline, "Modal frekansların birbirine yakınlığı arttığında korelasyon etkisinin önemini gösteren tamamlayıcı frekans şeması.", body);
}

function diaphragmCover(spec: DepremRolloutSpec) {
  const rigidGrid = `<rect x="170" y="185" width="350" height="280" rx="4" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><line x1="345" y1="185" x2="345" y2="465" stroke="${NEUTRAL}" stroke-width="2"/><line x1="170" y1="325" x2="520" y2="325" stroke="${NEUTRAL}" stroke-width="2"/>`;
  const semiGrid = `<path d="M680 185L1030 185L1030 465L680 465Z" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><path d="M680 185L855 325L1030 185M680 465L855 325L1030 465M680 185L680 465M1030 185L1030 465" fill="none" stroke="${CYAN}" stroke-width="2" stroke-opacity="0.75"/>`;
  const body = `
  <!-- comparison requires two different modelling representations -->
  ${rigidGrid}
  ${semiGrid}
  <line x1="110" y1="325" x2="160" y2="325" stroke="${CYAN}" stroke-width="5"/><path d="M160 325l-18 -10v20z" fill="${CYAN}"/>
  <line x1="620" y1="325" x2="670" y2="325" stroke="${CYAN}" stroke-width="5"/><path d="M670 325l-18 -10v20z" fill="${CYAN}"/>
  <text x="265" y="145" class="label">Rijit Diyafram</text>
  <text x="780" y="145" class="accent">Yarı Rijit Diyafram</text>
  <text x="210" y="520" class="small">Tek parça hareket kabulü</text>
  <text x="725" y="520" class="small">Döşeme deformasyonu modellenir</text>
  `;
  return shell(spec.headline, "Rijit ve yarı rijit diyafram kabullerinin iki farklı modelleme temsiliyle karşılaştırıldığı teknik plan şeması.", body);
}

function diaphragmDiagram(spec: DepremRolloutSpec) {
  const body = `
  <!-- one irregular floor plan with opening; illustrates why semi-rigid modelling may matter -->
  <path d="M210 155H990V515H210Z" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/>
  <rect x="535" y="270" width="210" height="150" fill="${PAPER}" stroke="${NAVY}" stroke-width="3"/>
  ${[260,360,460,560,660,760,860,960].map((x) => `<line x1="${x}" y1="170" x2="${x}" y2="500" stroke="${CYAN}" stroke-opacity="0.25" stroke-width="1.5"/>`).join("")}
  ${[205,265,325,385,445,495].map((y) => `<line x1="225" y1="${y}" x2="975" y2="${y}" stroke="${CYAN}" stroke-opacity="0.25" stroke-width="1.5"/>`).join("")}
  <line x1="105" y1="335" x2="195" y2="335" stroke="${CYAN}" stroke-width="5"/><path d="M195 335l-18 -10v20z" fill="${CYAN}"/>
  <path d="M390 205C455 245 480 315 505 390" fill="none" stroke="${CYAN}" stroke-width="4" stroke-dasharray="9 7"/>
  <text x="560" y="250" class="label">Döşeme Boşluğu</text>
  <text x="755" y="555" class="accent">Yerel Deformasyon</text>
  <text x="95" y="300" class="accent">Yatay Etki</text>
  `;
  return shell(spec.headline, "Tek düzensiz döşeme planında büyük boşluk ve yerel deformasyon nedeniyle yarı rijit diyafram modellemesinin önemini açıklayan teknik plan.", body);
}

function jointCover(spec: DepremRolloutSpec) {
  const leftLevels = [525,430,335,240,145];
  const rightLevels = [525,445,365,285,205,125];
  const leftFrame = leftLevels.map((y) => `<line x1="250" y1="${y}" x2="520" y2="${y}" stroke="${NAVY}" stroke-width="5"/>`).join("");
  const rightFrame = rightLevels.map((y) => `<line x1="680" y1="${y}" x2="950" y2="${y}" stroke="${NAVY}" stroke-width="5"/>`).join("");
  const body = `
  <!-- two adjacent DIFFERENT buildings; duplication is technically required by joint topic -->
  <line x1="250" y1="145" x2="250" y2="525" stroke="${NAVY}" stroke-width="6"/><line x1="520" y1="145" x2="520" y2="525" stroke="${NAVY}" stroke-width="6"/>${leftFrame}
  <line x1="680" y1="125" x2="680" y2="525" stroke="${NAVY}" stroke-width="6"/><line x1="950" y1="125" x2="950" y2="525" stroke="${NAVY}" stroke-width="6"/>${rightFrame}
  <rect x="220" y="525" width="330" height="36" fill="url(#concrete)" stroke="${NAVY}" stroke-width="3"/>
  <rect x="650" y="525" width="330" height="36" fill="url(#concrete)" stroke="${NAVY}" stroke-width="3"/>
  <line x1="545" y1="300" x2="655" y2="300" stroke="${CYAN}" stroke-width="3"/>
  <path d="M545 300l14 -8v16zM655 300l-14 -8v16z" fill="${CYAN}"/>
  <text x="565" y="278" class="accent">Deprem Derzi</text>
  <line x1="310" y1="105" x2="360" y2="105" stroke="${CYAN}" stroke-width="4"/><path d="M360 105l-16 -9v18z" fill="${CYAN}"/>
  <line x1="890" y1="85" x2="840" y2="85" stroke="${CYAN}" stroke-width="4"/><path d="M840 85l16 -9v18z" fill="${CYAN}"/>
  <text x="500" y="610" class="label">Çarpışmayı Önleyen Net Boşluk</text>
  `;
  return shell(spec.headline, "Farklı kat düzenine sahip iki komşu bina arasında deprem sırasında çarpışmayı önleyen net derz boşluğunu gösteren teknik görünüş.", body);
}

function jointDiagram(spec: DepremRolloutSpec) {
  const body = `
  <!-- plan view: two separate building footprints and displacement envelopes -->
  <rect x="155" y="180" width="380" height="300" rx="4" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/>
  <rect x="665" y="180" width="380" height="300" rx="4" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/>
  <rect x="535" y="180" width="130" height="300" fill="${CYAN}" fill-opacity="0.06"/>
  <line x1="535" y1="165" x2="535" y2="495" stroke="${CYAN}" stroke-width="2.5" stroke-dasharray="8 8"/>
  <line x1="665" y1="165" x2="665" y2="495" stroke="${CYAN}" stroke-width="2.5" stroke-dasharray="8 8"/>
  <line x1="555" y1="330" x2="645" y2="330" stroke="${CYAN}" stroke-width="3"/>
  <path d="M555 330l14 -8v16zM645 330l-14 -8v16z" fill="${CYAN}"/>
  <text x="558" y="305" class="accent">Net Derz</text>
  <line x1="470" y1="530" x2="545" y2="530" stroke="${NAVY}" stroke-width="3"/><path d="M545 530l-14 -8v16z" fill="${NAVY}"/>
  <line x1="730" y1="565" x2="655" y2="565" stroke="${NAVY}" stroke-width="3"/><path d="M655 565l14 -8v16z" fill="${NAVY}"/>
  <text x="210" y="145" class="label">Bina A</text>
  <text x="875" y="145" class="label">Bina B</text>
  `;
  return shell(spec.headline, "Plan görünüşünde iki komşu yapının depremde yaklaşma yönleri ve aralarında korunması gereken net derz bölgesini gösteren tamamlayıcı şema.", body);
}

export function renderTbdyTechnicalVisual2Svg(spec: DepremRolloutSpec, asset: TbdyTechnicalVisualAsset) {
  switch (spec.slug) {
    case "tbdy-tasarim-spektrumu-cizimi": return asset === "cover" ? spectrumCover(spec) : spectrumDiagram(spec);
    case "tbdy-mod-birlesim-srss-cqc": return asset === "cover" ? modalCover(spec) : modalDiagram(spec);
    case "tbdy-rijit-yari-rijit-diyafram": return asset === "cover" ? diaphragmCover(spec) : diaphragmDiagram(spec);
    case "tbdy-deprem-derzi-hesabi": return asset === "cover" ? jointCover(spec) : jointDiagram(spec);
    default: throw new Error(`TBDY teknik renderer 2 bulunamadı: ${spec.slug}`);
  }
}
