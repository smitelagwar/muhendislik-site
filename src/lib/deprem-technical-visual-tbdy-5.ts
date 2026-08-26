import type { DepremRolloutSpec } from "./deprem-rollout";
import { DEPREM_TECHNICAL_VISUAL_STYLE } from "./deprem-visual-rollout";

export type TbdyTechnicalVisual5Asset = "cover" | "diagram";

const { navy: NAVY, cyan: CYAN, paper: PAPER, white: WHITE, neutral: NEUTRAL } = DEPREM_TECHNICAL_VISUAL_STYLE;

export const TBDY_TECHNICAL_VISUAL_5_SLUGS = new Set([
  "tbdy-deprem-yer-hareketi-duzeyleri",
  "tbdy-afad-ss-s1-okuma",
  "tbdy-yerel-zemin-sinifi-spektrum",
  "tbdy-bina-onem-katsayisi",
]);

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function shell(title: string, desc: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title><desc id="desc">${escapeXml(desc)}</desc>
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${WHITE}"/><stop offset="1" stop-color="${PAPER}"/></linearGradient>
    <style>.label{font:700 21px Arial,sans-serif;fill:${NAVY}}.accent{font:700 21px Arial,sans-serif;fill:${CYAN}}.small{font:600 17px Arial,sans-serif;fill:${NAVY}}.symbol{font:700 20px Arial,sans-serif;fill:${CYAN}}</style>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="${CYAN}"/></marker>
  </defs>
  <rect width="1200" height="675" fill="url(#paper)"/>${body}</svg>`;
}

function ddLevelsCover(spec: DepremRolloutSpec) {
  const curves = [
    { y: 145, label: "DD-1", width: 6 },
    { y: 220, label: "DD-2", width: 6 },
    { y: 300, label: "DD-3", width: 5 },
    { y: 380, label: "DD-4", width: 5 },
  ].map(({ y, label, width }, index) => `<path d="M185 500 C255 ${y + 130} 330 ${y} 450 ${y} S650 ${y + 20} 735 ${y + 115}" fill="none" stroke="${index === 1 ? CYAN : NAVY}" stroke-width="${width}" stroke-opacity="${index === 1 ? 1 : 0.72}"/><text x="755" y="${y + 120}" class="${index === 1 ? "accent" : "small"}">${label}</text>`).join("");
  const body = `<line x1="160" y1="500" x2="820" y2="500" stroke="${NAVY}" stroke-width="4"/><line x1="160" y1="500" x2="160" y2="105" stroke="${NAVY}" stroke-width="4"/>${curves}<line x1="850" y1="340" x2="965" y2="340" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><rect x="985" y="270" width="150" height="140" rx="20" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><text x="1018" y="325" class="label">Performans</text><text x="1027" y="360" class="label">Hedefi</text><text x="115" y="88" class="symbol">Sa(T)</text><text x="810" y="535" class="symbol">T</text>`;
  return shell(spec.headline, "DD-1, DD-2, DD-3 ve DD-4 yer hareketi düzeylerini tasarım spektrumu ailesi ve performans hedefi bağlantısı içinde gösteren teknik kapak şeması.", body);
}

function ddLevelsDiagram(spec: DepremRolloutSpec) {
  const ddNodes = ["DD-1", "DD-2", "DD-3", "DD-4"].map((label, index) => `<rect x="95" y="${120 + index * 110}" width="145" height="70" rx="16" fill="${WHITE}" stroke="${index === 1 ? CYAN : NAVY}" stroke-width="${index === 1 ? 5 : 3}"/><text x="140" y="${164 + index * 110}" class="${index === 1 ? "accent" : "label"}">${label}</text><line x1="240" y1="${155 + index * 110}" x2="390" y2="310" stroke="${CYAN}" stroke-width="3" marker-end="url(#arrow)"/>`).join("");
  const body = `${ddNodes}<rect x="410" y="255" width="190" height="110" rx="20" fill="${WHITE}" stroke="${NAVY}" stroke-width="5"/><text x="439" y="320" class="label">Seçilen DD</text><line x1="600" y1="310" x2="710" y2="310" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><rect x="730" y="255" width="190" height="110" rx="20" fill="${WHITE}" stroke="${NAVY}" stroke-width="5"/><text x="750" y="320" class="label">Spektral Girdi</text><line x1="920" y1="310" x2="1005" y2="310" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><rect x="1025" y="245" width="130" height="130" rx="20" fill="${CYAN}" fill-opacity="0.08" stroke="${CYAN}" stroke-width="5"/><text x="1048" y="298" class="label">Hedef</text><path d="M1070 330l18 18 38-45" fill="none" stroke="${CYAN}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
  return shell(spec.headline, "Dört yer hareketi düzeyinden proje için seçilen düzeyin spektral girdiye ve performans hedefine bağlandığını gösteren teknik seçim zinciri.", body);
}

function afadSsS1Cover(spec: DepremRolloutSpec) {
  const grid = Array.from({ length: 7 }, (_, i) => `<line x1="${130 + i * 70}" y1="130" x2="${130 + i * 70}" y2="520" stroke="${NEUTRAL}" stroke-width="2"/><line x1="130" y1="${130 + i * 55}" x2="550" y2="${130 + i * 55}" stroke="${NEUTRAL}" stroke-width="2"/>`).join("");
  const body = `<rect x="130" y="130" width="420" height="390" rx="24" fill="${WHITE}" stroke="${NAVY}" stroke-width="5"/>${grid}<circle cx="360" cy="315" r="19" fill="${CYAN}"/><circle cx="360" cy="315" r="43" fill="none" stroke="${CYAN}" stroke-width="4"/><line x1="360" y1="245" x2="360" y2="385" stroke="${CYAN}" stroke-width="3"/><line x1="290" y1="315" x2="430" y2="315" stroke="${CYAN}" stroke-width="3"/><text x="190" y="575" class="label">Proje Koordinatı</text><line x1="575" y1="315" x2="700" y2="315" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><rect x="725" y="175" width="180" height="130" rx="22" fill="${WHITE}" stroke="${NAVY}" stroke-width="5"/><text x="790" y="253" class="accent">Ss</text><rect x="725" y="355" width="180" height="130" rx="22" fill="${WHITE}" stroke="${NAVY}" stroke-width="5"/><text x="790" y="433" class="accent">S1</text><line x1="905" y1="240" x2="1015" y2="315" stroke="${CYAN}" stroke-width="4"/><line x1="905" y1="420" x2="1015" y2="315" stroke="${CYAN}" stroke-width="4"/><path d="M1015 315l-16 -3 8 -14z" fill="${CYAN}"/><text x="980" y="360" class="label">Spektrum</text><text x="995" y="392" class="label">Girdisi</text>`;
  return shell(spec.headline, "Doğrulanmış proje koordinatından Ss ve S1 spektral ivme parametrelerinin alınarak spektrum girdisine dönüştürüldüğünü gösteren teknik veri akışı.", body);
}

function afadSsS1Diagram(spec: DepremRolloutSpec) {
  const body = `<rect x="90" y="120" width="180" height="95" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><text x="125" y="175" class="label">Koordinat</text><line x1="270" y1="168" x2="350" y2="168" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><rect x="370" y="120" width="125" height="95" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><text x="411" y="175" class="accent">DD</text><line x1="495" y1="168" x2="575" y2="168" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><rect x="595" y="120" width="180" height="95" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><text x="650" y="175" class="accent">Ss / S1</text><line x1="775" y1="168" x2="865" y2="168" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><rect x="885" y="120" width="225" height="95" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><text x="920" y="175" class="label">Spektrum Girdisi</text><line x1="220" y1="545" x2="1030" y2="545" stroke="${NAVY}" stroke-width="4"/><line x1="220" y1="545" x2="220" y2="300" stroke="${NAVY}" stroke-width="4"/><path d="M220 520C300 470 330 360 420 350S650 360 720 405S880 500 1030 520" fill="none" stroke="${CYAN}" stroke-width="7"/><circle cx="355" cy="375" r="10" fill="${NAVY}"/><text x="325" y="340" class="label">Ss</text><circle cx="720" cy="405" r="10" fill="${NAVY}"/><text x="690" y="375" class="label">S1</text><text x="168" y="290" class="symbol">Sa</text><text x="1035" y="575" class="symbol">T</text>`;
  return shell(spec.headline, "Koordinat ve yer hareketi düzeyi seçiminden Ss ile S1 parametrelerine, oradan spektrum girdisine uzanan akışı ve parametrelerin periyot eksenindeki farklı rollerini gösteren detay şeması.", body);
}

function soilSpectrumCover(spec: DepremRolloutSpec) {
  const body = `<rect x="120" y="110" width="310" height="455" rx="20" fill="${WHITE}" stroke="${NAVY}" stroke-width="5"/><path d="M120 240H430M120 360H430M120 465H430" stroke="${NEUTRAL}" stroke-width="4"/><path d="M255 145V520" stroke="${NAVY}" stroke-width="7" stroke-linecap="round"/><circle cx="255" cy="205" r="10" fill="${CYAN}"/><circle cx="255" cy="315" r="10" fill="${CYAN}"/><circle cx="255" cy="420" r="10" fill="${CYAN}"/><text x="165" y="600" class="label">Saha Verisi</text><line x1="450" y1="335" x2="565" y2="335" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><rect x="585" y="270" width="170" height="130" rx="22" fill="${WHITE}" stroke="${CYAN}" stroke-width="5"/><text x="620" y="325" class="label">Zemin</text><text x="621" y="365" class="accent">ZA … ZF</text><line x1="755" y1="335" x2="835" y2="335" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><line x1="855" y1="500" x2="1110" y2="500" stroke="${NAVY}" stroke-width="4"/><line x1="855" y1="500" x2="855" y2="195" stroke="${NAVY}" stroke-width="4"/><path d="M855 475C900 430 925 310 980 285S1055 330 1110 455" fill="none" stroke="${CYAN}" stroke-width="7"/><text x="885" y="175" class="label">Tasarım Spektrumu</text><text x="810" y="180" class="symbol">Sa(T)</text><text x="1105" y="530" class="symbol">T</text>`;
  return shell(spec.headline, "Zemin sınıfının doğrudan bir tabaka adı olmadığını; saha verisinden sınıflandırılıp tasarım spektrumunun şekline etki eden bir girdi olduğunu gösteren teknik kapak.", body);
}

function soilSpectrumDiagram(spec: DepremRolloutSpec) {
  const body = `<rect x="100" y="145" width="190" height="100" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><text x="153" y="205" class="accent">Ss / S1</text><rect x="100" y="365" width="190" height="100" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><text x="127" y="425" class="label">Zemin Sınıfı</text><line x1="290" y1="195" x2="455" y2="300" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><line x1="290" y1="415" x2="455" y2="320" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><rect x="475" y="250" width="190" height="125" rx="20" fill="${CYAN}" fill-opacity="0.07" stroke="${CYAN}" stroke-width="5"/><text x="505" y="305" class="label">Zemin</text><text x="508" y="343" class="label">Etkisi</text><line x1="665" y1="313" x2="760" y2="313" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><rect x="780" y="250" width="190" height="125" rx="20" fill="${WHITE}" stroke="${NAVY}" stroke-width="5"/><text x="817" y="328" class="accent">SDS / SD1</text><line x1="970" y1="313" x2="1040" y2="313" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><line x1="1045" y1="450" x2="1140" y2="450" stroke="${NAVY}" stroke-width="3"/><line x1="1045" y1="450" x2="1045" y2="230" stroke="${NAVY}" stroke-width="3"/><path d="M1045 430C1070 365 1082 285 1110 285S1130 355 1140 410" fill="none" stroke="${CYAN}" stroke-width="5"/><text x="1062" y="205" class="symbol">Sa(T)</text>`;
  return shell(spec.headline, "Ss ve S1 tehlike parametreleri ile yerel zemin sınıfının birlikte tasarım spektrumu parametrelerine ve Sa(T) eğrisine taşındığını gösteren teknik işlem akışı.", body);
}

function buildingUseIcon(x: number, y: number, type: "regular" | "public" | "critical") {
  if (type === "regular") return `<g transform="translate(${x} ${y})"><path d="M0 95L70 35L140 95V215H0Z" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/><rect x="55" y="145" width="30" height="70" fill="${NEUTRAL}"/><rect x="22" y="112" width="28" height="28" fill="${CYAN}" fill-opacity="0.22"/><rect x="92" y="112" width="28" height="28" fill="${CYAN}" fill-opacity="0.22"/></g>`;
  if (type === "public") return `<g transform="translate(${x} ${y})"><rect x="0" y="75" width="150" height="140" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/><path d="M-10 75L75 25L160 75Z" fill="${NEUTRAL}" stroke="${NAVY}" stroke-width="5"/>${[25,75,125].map((cx) => `<line x1="${cx}" y1="105" x2="${cx}" y2="195" stroke="${CYAN}" stroke-width="8"/>`).join("")}</g>`;
  return `<g transform="translate(${x} ${y})"><rect x="0" y="70" width="150" height="145" rx="8" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/><rect x="60" y="95" width="30" height="95" fill="${CYAN}"/><rect x="28" y="127" width="94" height="30" fill="${CYAN}"/></g>`;
}

function importanceCover(spec: DepremRolloutSpec) {
  const body = `${buildingUseIcon(110, 190, "regular")}${buildingUseIcon(375, 190, "public")}${buildingUseIcon(650, 190, "critical")}<text x="135" y="465" class="small">Kullanım</text><text x="405" y="465" class="small">Kullanım</text><text x="680" y="465" class="small">Kritik İşlev</text><line x1="835" y1="330" x2="920" y2="330" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><rect x="940" y="215" width="165" height="95" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="5"/><text x="997" y="274" class="accent">BKS</text><line x1="1023" y1="310" x2="1023" y2="380" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><rect x="940" y="400" width="165" height="95" rx="18" fill="${CYAN}" fill-opacity="0.08" stroke="${CYAN}" stroke-width="5"/><text x="1015" y="458" class="accent">I</text>`;
  return shell(spec.headline, "Bina kullanım amacı ve kritik işlev bilgisinin bina kullanım sınıfı üzerinden önem katsayısı seçimine bağlandığını gösteren teknik kapak şeması.", body);
}

function importanceDiagram(spec: DepremRolloutSpec) {
  const body = `<rect x="90" y="260" width="190" height="115" rx="20" fill="${WHITE}" stroke="${NAVY}" stroke-width="5"/><text x="128" y="327" class="label">Kullanım</text><line x1="280" y1="318" x2="375" y2="318" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><rect x="395" y="260" width="145" height="115" rx="20" fill="${WHITE}" stroke="${NAVY}" stroke-width="5"/><text x="445" y="327" class="accent">BKS</text><line x1="540" y1="318" x2="635" y2="318" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><rect x="655" y="260" width="130" height="115" rx="20" fill="${CYAN}" fill-opacity="0.08" stroke="${CYAN}" stroke-width="5"/><text x="713" y="327" class="accent">I</text><line x1="785" y1="318" x2="865" y2="318" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><g transform="translate(900 145)"><line x1="30" y1="35" x2="30" y2="350" stroke="${NAVY}" stroke-width="8"/><line x1="210" y1="35" x2="210" y2="350" stroke="${NAVY}" stroke-width="8"/>${[90,170,250,330].map((y) => `<line x1="25" y1="${y}" x2="215" y2="${y}" stroke="${NAVY}" stroke-width="7"/>`).join("")}<line x1="-35" y1="95" x2="15" y2="95" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><line x1="-35" y1="175" x2="15" y2="175" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><line x1="-35" y1="255" x2="15" y2="255" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/></g><text x="900" y="555" class="label">Deprem Etkisi</text>`;
  return shell(spec.headline, "Kullanım amacından BKS ve önem katsayısı seçimine, oradan yapının deprem etkisine uzanan yönetmelik karar zincirini gösteren teknik detay.", body);
}

export function renderTbdyTechnicalVisual5Svg(spec: DepremRolloutSpec, asset: TbdyTechnicalVisual5Asset) {
  switch (spec.slug) {
    case "tbdy-deprem-yer-hareketi-duzeyleri":
      return asset === "cover" ? ddLevelsCover(spec) : ddLevelsDiagram(spec);
    case "tbdy-afad-ss-s1-okuma":
      return asset === "cover" ? afadSsS1Cover(spec) : afadSsS1Diagram(spec);
    case "tbdy-yerel-zemin-sinifi-spektrum":
      return asset === "cover" ? soilSpectrumCover(spec) : soilSpectrumDiagram(spec);
    case "tbdy-bina-onem-katsayisi":
      return asset === "cover" ? importanceCover(spec) : importanceDiagram(spec);
    default:
      throw new Error(`TBDY fifth-wave teknik görseli tanımlı değil: ${spec.slug}`);
  }
}
