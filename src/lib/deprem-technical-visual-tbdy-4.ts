import type { DepremRolloutSpec } from "./deprem-rollout";
import { DEPREM_TECHNICAL_VISUAL_STYLE } from "./deprem-visual-rollout";

export type TbdyTechnicalVisual4Asset = "cover" | "diagram";

const { navy: NAVY, cyan: CYAN, paper: PAPER, white: WHITE, neutral: NEUTRAL } = DEPREM_TECHNICAL_VISUAL_STYLE;

export const TBDY_TECHNICAL_VISUAL_4_SLUGS = new Set([
  "kisa-kolon-etkisi-tbdy-2018",
  "tbdy-2018-guclu-kolon-kontrolu",
  "betonarme-perde-tasarimi-depremde-tip-ve-boyutlandirma-kurallari",
  "yatay-yuk-tasima-sistemleri-cerceve-perde-cekirdek",
]);

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function shell(title: string, desc: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title><desc id="desc">${escapeXml(desc)}</desc>
  <defs><linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${WHITE}"/><stop offset="1" stop-color="${PAPER}"/></linearGradient><style>.label{font:700 21px Arial,sans-serif;fill:${NAVY}}.accent{font:700 21px Arial,sans-serif;fill:${CYAN}}.small{font:600 17px Arial,sans-serif;fill:${NAVY}}.symbol{font:700 20px Arial,sans-serif;fill:${CYAN}}</style></defs>
  <rect width="1200" height="675" fill="url(#paper)"/>${body}</svg>`;
}

function shortColumnCover(spec: DepremRolloutSpec) {
  const body = `<line x1="380" y1="135" x2="380" y2="555" stroke="${NAVY}" stroke-width="9"/><line x1="850" y1="135" x2="850" y2="555" stroke="${NAVY}" stroke-width="9"/><line x1="360" y1="155" x2="870" y2="155" stroke="${NAVY}" stroke-width="9"/><line x1="360" y1="535" x2="870" y2="535" stroke="${NAVY}" stroke-width="9"/><rect x="389" y="305" width="452" height="221" fill="${NEUTRAL}" fill-opacity="0.55" stroke="${NAVY}" stroke-width="3"/><line x1="315" y1="165" x2="315" y2="300" stroke="${CYAN}" stroke-width="4"/><path d="M315 165l-9 16h18zM315 300l-9 -16h18z" fill="${CYAN}"/><line x1="245" y1="225" x2="365" y2="225" stroke="${CYAN}" stroke-width="5"/><path d="M365 225l-18 -10v20z" fill="${CYAN}"/><line x1="365" y1="265" x2="245" y2="265" stroke="${CYAN}" stroke-width="5"/><path d="M245 265l18 -10v20z" fill="${CYAN}"/><text x="160" y="125" class="accent">Kısa Serbest Boy</text><text x="150" y="350" class="label">Kesme Talebi</text><text x="560" y="440" class="small">Kısmi Dolgu</text>`;
  return shell(spec.headline, "Kısmi dolgu nedeniyle tek çerçeve kolonunda serbest boyun kısaldığını ve kısa bölgede kesme talebinin yoğunlaştığını gösteren teknik kesit.", body);
}

function shortColumnDiagram(spec: DepremRolloutSpec) {
  const body = `<rect x="500" y="155" width="200" height="360" fill="${WHITE}" stroke="${NAVY}" stroke-width="8"/><rect x="440" y="125" width="320" height="45" fill="${NEUTRAL}" stroke="${NAVY}" stroke-width="3"/><rect x="440" y="500" width="320" height="45" fill="${NEUTRAL}" stroke="${NAVY}" stroke-width="3"/><line x1="430" y1="175" x2="430" y2="495" stroke="${CYAN}" stroke-width="4"/><path d="M430 175l-9 16h18zM430 495l-9 -16h18z" fill="${CYAN}"/><line x1="320" y1="235" x2="490" y2="235" stroke="${CYAN}" stroke-width="5"/><path d="M490 235l-18 -10v20z" fill="${CYAN}"/><line x1="710" y1="435" x2="880" y2="435" stroke="${CYAN}" stroke-width="5"/><path d="M880 435l-18 -10v20z" fill="${CYAN}"/><path d="M520 230L675 345M525 320L675 430" fill="none" stroke="${CYAN}" stroke-width="5"/><text x="335" y="350" class="symbol">h kısa</text><text x="535" y="605" class="accent">Kesme Çatlakları</text><text x="875" y="425" class="symbol">V</text>`;
  return shell(spec.headline, "Tek kısa kolon serbest cisim şemasında kısa net boyu, karşılıklı kesme etkilerini ve tipik diyagonal kesme çatlağı yönünü gösteren tamamlayıcı çizim.", body);
}

function strongColumnCover(spec: DepremRolloutSpec) {
  const body = `<line x1="600" y1="80" x2="600" y2="595" stroke="${NAVY}" stroke-width="12"/><line x1="230" y1="335" x2="970" y2="335" stroke="${NAVY}" stroke-width="12"/><rect x="565" y="300" width="70" height="70" fill="${WHITE}" stroke="${CYAN}" stroke-width="6"/><path d="M525 215C455 205 435 265 470 305" fill="none" stroke="${CYAN}" stroke-width="5"/><path d="M470 305l-3 -20 19 7z" fill="${CYAN}"/><path d="M675 455C745 465 765 405 730 365" fill="none" stroke="${CYAN}" stroke-width="5"/><path d="M730 365l3 20-19 -7z" fill="${CYAN}"/><path d="M400 275C390 220 325 210 285 245" fill="none" stroke="${NAVY}" stroke-width="4"/><path d="M285 245l20 -2-8 18z" fill="${NAVY}"/><path d="M800 395C810 450 875 460 915 425" fill="none" stroke="${NAVY}" stroke-width="4"/><path d="M915 425l-20 2 8 -18z" fill="${NAVY}"/><text x="390" y="165" class="accent">ΣM kolon</text><text x="760" y="265" class="label">ΣM kiriş</text><text x="650" y="390" class="small">Düğüm</text>`;
  return shell(spec.headline, "Tek kiriş-kolon birleşiminde kolon ve kiriş uç moment kapasitelerinin düğüm çevresindeki kapasite hiyerarşisini gösteren teknik birleşim şeması.", body);
}

function strongColumnDiagram(spec: DepremRolloutSpec) {
  const body = `<line x1="360" y1="115" x2="360" y2="555" stroke="${NAVY}" stroke-width="9"/><line x1="840" y1="115" x2="840" y2="555" stroke="${NAVY}" stroke-width="9"/>${[190,345,500].map((y) => `<line x1="350" y1="${y}" x2="850" y2="${y}" stroke="${NAVY}" stroke-width="8"/>`).join("")}${[190,345,500].flatMap((y) => [390,810].map((x) => `<circle cx="${x}" cy="${y}" r="17" fill="${CYAN}" stroke="${WHITE}" stroke-width="4"/>`)).join("")}<line x1="270" y1="270" x2="340" y2="270" stroke="${CYAN}" stroke-width="5"/><path d="M340 270l-17 -9v18z" fill="${CYAN}"/><text x="430" y="90" class="accent">Kiriş Mafsalları</text><text x="870" y="335" class="label">Kolon Sürekliliği</text><text x="220" y="245" class="symbol">E</text>`;
  return shell(spec.headline, "Tek çok katlı çerçevede plastikleşmenin kiriş uçlarında yayılmasını ve kolonların katlar boyunca sürekliliğini gösteren istenen sünek mekanizma şeması.", body);
}

function wallCover(spec: DepremRolloutSpec) {
  const body = `<rect x="400" y="110" width="400" height="460" fill="${WHITE}" stroke="${NAVY}" stroke-width="7"/><rect x="400" y="110" width="72" height="460" fill="${CYAN}" fill-opacity="0.18" stroke="${CYAN}" stroke-width="4"/><rect x="728" y="110" width="72" height="460" fill="${CYAN}" fill-opacity="0.18" stroke="${CYAN}" stroke-width="4"/>${[190,275,360,445,530].map((y) => `<line x1="472" y1="${y}" x2="728" y2="${y}" stroke="${NEUTRAL}" stroke-width="2"/>`).join("")}<line x1="260" y1="145" x2="390" y2="145" stroke="${CYAN}" stroke-width="6"/><path d="M390 145l-20 -11v22z" fill="${CYAN}"/><path d="M835 520C930 470 930 285 835 225" fill="none" stroke="${CYAN}" stroke-width="5"/><path d="M835 225l19 7-15 14z" fill="${CYAN}"/><text x="505" y="340" class="label">Perde Gövdesi</text><text x="815" y="125" class="accent">Uç Bölgesi</text><text x="860" y="385" class="accent">Eğilme + Kesme</text>`;
  return shell(spec.headline, "Tek betonarme perde elevasyonunda perde gövdesini, uç bölgelerini ve yatay yük altında birlikte çalışan eğilme-kesme davranışını gösteren teknik şema.", body);
}

function wallDiagram(spec: DepremRolloutSpec) {
  const verticalBars = [300,335,370,830,865,900].map((x) => `<circle cx="${x}" cy="335" r="12" fill="${NAVY}"/>`).join("");
  const webBars = [470,550,630,710].map((x) => `<circle cx="${x}" cy="335" r="9" fill="${CYAN}"/>`).join("");
  const body = `<rect x="250" y="260" width="700" height="150" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/><rect x="270" y="280" width="125" height="110" fill="none" stroke="${CYAN}" stroke-width="5"/><rect x="805" y="280" width="125" height="110" fill="none" stroke="${CYAN}" stroke-width="5"/>${verticalBars}${webBars}<line x1="420" y1="300" x2="780" y2="300" stroke="${CYAN}" stroke-width="3"/><line x1="420" y1="370" x2="780" y2="370" stroke="${CYAN}" stroke-width="3"/><text x="275" y="225" class="accent">Sargılı Uç Bölgesi</text><text x="505" y="455" class="label">Gövde Donatısı</text><text x="805" y="455" class="small">Boyuna Donatı</text>`;
  return shell(spec.headline, "Tek perde enkesitinde uç bölgelerindeki boyuna-sargı donatısı ile gövde donatısının yerleşim rollerini gösteren tamamlayıcı detay.", body);
}

function systemComparisonCover(spec: DepremRolloutSpec) {
  const frame = `<g transform="translate(145 170)"><line x1="0" y1="0" x2="0" y2="300" stroke="${NAVY}" stroke-width="7"/><line x1="210" y1="0" x2="210" y2="300" stroke="${NAVY}" stroke-width="7"/>${[55,135,215,295].map((y) => `<line x1="0" y1="${y}" x2="210" y2="${y}" stroke="${NAVY}" stroke-width="6"/>`).join("")}<line x1="-65" y1="45" x2="-10" y2="45" stroke="${CYAN}" stroke-width="5"/><path d="M-10 45l-17 -9v18z" fill="${CYAN}"/></g>`;
  const wall = `<g transform="translate(495 170)"><rect x="25" y="0" width="150" height="300" fill="${WHITE}" stroke="${NAVY}" stroke-width="7"/><line x1="-40" y1="45" x2="15" y2="45" stroke="${CYAN}" stroke-width="5"/><path d="M15 45l-17 -9v18z" fill="${CYAN}"/></g>`;
  const core = `<g transform="translate(800 170)"><path d="M25 300V0H185V300M65 0V300M145 0V300" fill="none" stroke="${NAVY}" stroke-width="7"/><line x1="-40" y1="45" x2="15" y2="45" stroke="${CYAN}" stroke-width="5"/><path d="M15 45l-17 -9v18z" fill="${CYAN}"/></g>`;
  const body = `${frame}${wall}${core}<text x="190" y="525" class="label">Çerçeve</text><text x="535" y="525" class="label">Perde</text><text x="840" y="525" class="label">Çekirdek</text><text x="415" y="605" class="accent">Yatay Yük Taşıma Sistemleri</text>`;
  return shell(spec.headline, "Çerçeve, perde ve çekirdek sistemlerini aynı ölçekte fakat farklı taşıyıcı mekanizmalar olarak yan yana gösteren teknik sistem özeti.", body);
}

function combinedSystemDiagram(spec: DepremRolloutSpec) {
  const body = `<rect x="230" y="140" width="740" height="390" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/>${[300,480,720,900].map((x) => `<rect x="${x - 12}" y="128" width="24" height="24" fill="${NAVY}"/><rect x="${x - 12}" y="518" width="24" height="24" fill="${NAVY}"/>`).join("")}${[215,340,455].map((y) => `<rect x="218" y="${y - 12}" width="24" height="24" fill="${NAVY}"/><rect x="958" y="${y - 12}" width="24" height="24" fill="${NAVY}"/>`).join("")}<rect x="500" y="235" width="200" height="200" fill="${PAPER}" stroke="${CYAN}" stroke-width="8"/><rect x="555" y="290" width="90" height="90" fill="${WHITE}" stroke="${CYAN}" stroke-width="4"/><line x1="95" y1="335" x2="215" y2="335" stroke="${CYAN}" stroke-width="6"/><path d="M215 335l-20 -11v22z" fill="${CYAN}"/><line x1="240" y1="335" x2="485" y2="335" stroke="${CYAN}" stroke-width="4" stroke-dasharray="10 8"/><line x1="715" y1="335" x2="950" y2="335" stroke="${CYAN}" stroke-width="4" stroke-dasharray="10 8"/><text x="520" y="215" class="accent">Merkezi Çekirdek</text><text x="745" y="495" class="label">Çevre Çerçevesi</text><text x="65" y="305" class="symbol">E</text><text x="400" y="585" class="small">Rijitlik ve yatay yük paylaşımı</text>`;
  return shell(spec.headline, "Tek birleşik sistem planında merkezi çekirdek ile çevre çerçevesinin aynı yatay deprem etkisini rijitlikleri üzerinden paylaşmasını gösteren tamamlayıcı teknik plan.", body);
}

export function renderTbdyTechnicalVisual4Svg(spec: DepremRolloutSpec, asset: TbdyTechnicalVisual4Asset) {
  if (spec.slug === "kisa-kolon-etkisi-tbdy-2018") return asset === "cover" ? shortColumnCover(spec) : shortColumnDiagram(spec);
  if (spec.slug === "tbdy-2018-guclu-kolon-kontrolu") return asset === "cover" ? strongColumnCover(spec) : strongColumnDiagram(spec);
  if (spec.slug === "betonarme-perde-tasarimi-depremde-tip-ve-boyutlandirma-kurallari") return asset === "cover" ? wallCover(spec) : wallDiagram(spec);
  if (spec.slug === "yatay-yuk-tasima-sistemleri-cerceve-perde-cekirdek") return asset === "cover" ? systemComparisonCover(spec) : combinedSystemDiagram(spec);
  throw new Error(`TBDY teknik görsel set 4 eşleşmesi yok: ${spec.slug}`);
}
