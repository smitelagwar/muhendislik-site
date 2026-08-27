import type { DepremRolloutSpec } from "./deprem-rollout";
import { DEPREM_TECHNICAL_VISUAL_STYLE } from "./deprem-visual-rollout";

export type TbdyTechnicalVisual8Asset = "cover" | "diagram";

const { navy: NAVY, cyan: CYAN, paper: PAPER, white: WHITE, neutral: NEUTRAL } = DEPREM_TECHNICAL_VISUAL_STYLE;

export const TBDY_TECHNICAL_VISUAL_8_SLUGS = new Set([
  "tbdy-betonarme-ozel-deprem-etriyesi-ciroz",
  "tbdy-betonarme-kolon-sarilma-bolgeleri",
  "tbdy-betonarme-kiris-sarilma-bolgeleri",
  "tbdy-betonarme-perde-kritik-yukseklik-uc-bolge",
]);

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function shell(title: string, desc: string, body: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(title)}</title><desc id="desc">${escapeXml(desc)}</desc>
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${WHITE}"/><stop offset="1" stop-color="${PAPER}"/></linearGradient>
    <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(12)"><line x1="0" y1="0" x2="0" y2="14" stroke="${NEUTRAL}" stroke-width="3"/></pattern>
    <style>.label{font:700 21px Arial,sans-serif;fill:${NAVY}}.accent{font:700 21px Arial,sans-serif;fill:${CYAN}}.small{font:600 17px Arial,sans-serif;fill:${NAVY}}</style>
  </defs>
  <rect width="1200" height="675" fill="url(#paper)"/>${body}</svg>`;
}

function stirrupCover(spec: DepremRolloutSpec) {
  const bars = [[425,215],[600,215],[775,215],[425,455],[600,455],[775,455],[425,335],[775,335]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="15" fill="${NAVY}"/>`).join("");
  const body = `<rect x="350" y="145" width="500" height="380" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/><rect x="395" y="190" width="410" height="290" rx="26" fill="none" stroke="${CYAN}" stroke-width="7"/>${bars}<path d="M425 335H600V215M600 455V335H775" fill="none" stroke="${CYAN}" stroke-width="6" stroke-linecap="round"/><text x="875" y="245" class="accent">Etriye</text><text x="875" y="335" class="accent">Çiroz</text><text x="875" y="425" class="label">Boyuna Donatı</text>`;
  return shell(spec.headline, "Tek kolon kesitinde kapalı özel deprem etriyesi, çirozlar ve yanal tutulan boyuna donatıları gösteren teknik kapak.", body);
}

function stirrupDiagram(spec: DepremRolloutSpec) {
  const ties = [205,255,305,355,405,455].map((y,i) => `<rect x="430" y="${y}" width="340" height="24" rx="8" fill="none" stroke="${i%2===0?CYAN:NAVY}" stroke-width="5"/>`).join("");
  const body = `<line x1="470" y1="155" x2="470" y2="520" stroke="${NAVY}" stroke-width="10"/><line x1="730" y1="155" x2="730" y2="520" stroke="${NAVY}" stroke-width="10"/>${ties}<path d="M500 217H600V257M600 317V357H700M500 417H600V457" fill="none" stroke="${CYAN}" stroke-width="6" stroke-linecap="round"/><text x="805" y="235" class="accent">Kapalı Çevrim</text><text x="805" y="345" class="label">Şaşırtılmış Çiroz</text><text x="805" y="455" class="accent">Yanal Tutma</text>`;
  return shell(spec.headline, "Tek kolon boy görünüşünde kapalı çevrimli enine donatı ve ardışık sıralarda şaşırtılmış çiroz düzenini gösteren teknik detay.", body);
}

function columnConfinementCover(spec: DepremRolloutSpec) {
  const denseTop = [145,175,205,235].map((y)=>`<line x1="485" y1="${y}" x2="715" y2="${y}" stroke="${CYAN}" stroke-width="6"/>`).join("");
  const denseBottom = [435,465,495,525].map((y)=>`<line x1="485" y1="${y}" x2="715" y2="${y}" stroke="${CYAN}" stroke-width="6"/>`).join("");
  const middle = [295,360].map((y)=>`<line x1="485" y1="${y}" x2="715" y2="${y}" stroke="${NAVY}" stroke-width="4"/>`).join("");
  const body = `<rect x="465" y="115" width="270" height="440" rx="12" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/><line x1="500" y1="115" x2="500" y2="555" stroke="${NAVY}" stroke-width="7"/><line x1="700" y1="115" x2="700" y2="555" stroke="${NAVY}" stroke-width="7"/>${denseTop}${denseBottom}${middle}<rect x="445" y="130" width="310" height="125" rx="18" fill="${CYAN}" fill-opacity="0.07" stroke="${CYAN}" stroke-width="4"/><rect x="445" y="415" width="310" height="125" rx="18" fill="${CYAN}" fill-opacity="0.07" stroke="${CYAN}" stroke-width="4"/><text x="790" y="200" class="accent">Üst Sarılma</text><text x="790" y="480" class="accent">Alt Sarılma</text><text x="790" y="345" class="label">Orta Bölge</text>`;
  return shell(spec.headline, "Tek kolon elevasyonunda üst ve alt uçlardaki sıklaştırılmış sarılma bölgeleri ile orta bölgeyi gösteren teknik kapak.", body);
}

function columnConfinementDiagram(spec: DepremRolloutSpec) {
  const bars = [[420,215],[600,215],[780,215],[420,455],[600,455],[780,455],[420,335],[780,335]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="14" fill="${NAVY}"/>`).join("");
  const body = `<rect x="350" y="145" width="500" height="380" rx="18" fill="url(#hatch)" stroke="${NAVY}" stroke-width="6"/><rect x="395" y="190" width="410" height="290" rx="26" fill="${WHITE}" fill-opacity="0.65" stroke="${CYAN}" stroke-width="7"/>${bars}<path d="M420 335H600V215M600 455V335H780" fill="none" stroke="${CYAN}" stroke-width="6"/><text x="880" y="265" class="accent">Sarılmış Çekirdek</text><text x="880" y="375" class="label">Enine Donatı</text>`;
  return shell(spec.headline, "Kolon sarılma bölgesindeki beton çekirdeğinin kapalı etriye ve çirozlarla yanal olarak tutulmasını gösteren tek kesit detayı.", body);
}

function beamConfinementCover(spec: DepremRolloutSpec) {
  const leftTies = [360,400,440,480].map((x)=>`<line x1="${x}" y1="270" x2="${x}" y2="410" stroke="${CYAN}" stroke-width="6"/>`).join("");
  const rightTies = [720,760,800,840].map((x)=>`<line x1="${x}" y1="270" x2="${x}" y2="410" stroke="${CYAN}" stroke-width="6"/>`).join("");
  const body = `<rect x="250" y="165" width="110" height="350" rx="8" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/><rect x="840" y="165" width="110" height="350" rx="8" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/><rect x="350" y="255" width="500" height="170" rx="8" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/>${leftTies}${rightTies}<line x1="370" y1="300" x2="830" y2="300" stroke="${NAVY}" stroke-width="7"/><line x1="370" y1="380" x2="830" y2="380" stroke="${NAVY}" stroke-width="7"/><text x="335" y="485" class="accent">Sarılma Bölgesi</text><text x="720" y="485" class="accent">Sarılma Bölgesi</text>`;
  return shell(spec.headline, "Tek kirişte iki kolon yüzüne komşu uç bölgelerde etriye sıklaştırmasını gösteren teknik kapak.", body);
}

function beamConfinementDiagram(spec: DepremRolloutSpec) {
  const ties = [430,470,510,550,590,630].map((x)=>`<rect x="${x}" y="235" width="20" height="210" rx="5" fill="none" stroke="${CYAN}" stroke-width="5"/>`).join("");
  const body = `<rect x="250" y="145" width="170" height="390" rx="8" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/><rect x="420" y="220" width="520" height="240" rx="8" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/>${ties}<line x1="430" y1="275" x2="920" y2="275" stroke="${NAVY}" stroke-width="7"/><line x1="430" y1="405" x2="920" y2="405" stroke="${NAVY}" stroke-width="7"/><line x1="420" y1="190" x2="660" y2="190" stroke="${CYAN}" stroke-width="4"/><line x1="420" y1="177" x2="420" y2="203" stroke="${CYAN}" stroke-width="4"/><line x1="660" y1="177" x2="660" y2="203" stroke="${CYAN}" stroke-width="4"/><text x="465" y="165" class="accent">Sıklaştırılmış Bölge</text><text x="690" y="515" class="label">Kiriş Gövdesi</text>`;
  return shell(spec.headline, "Tek kiriş ucunda kolon yüzünden başlayan sıklaştırılmış etriye bölgesini ve devam eden kiriş gövdesini gösteren teknik detay.", body);
}

function wallCriticalCover(spec: DepremRolloutSpec) {
  const floors = [180,260,340,420,500].map((y)=>`<line x1="410" y1="${y}" x2="790" y2="${y}" stroke="${NAVY}" stroke-width="4"/>`).join("");
  const body = `<rect x="490" y="110" width="220" height="430" rx="6" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/>${floors}<rect x="470" y="360" width="260" height="180" rx="12" fill="${CYAN}" fill-opacity="0.09" stroke="${CYAN}" stroke-width="5"/><line x1="760" y1="360" x2="760" y2="540" stroke="${CYAN}" stroke-width="4"/><line x1="745" y1="360" x2="775" y2="360" stroke="${CYAN}" stroke-width="4"/><line x1="745" y1="540" x2="775" y2="540" stroke="${CYAN}" stroke-width="4"/><text x="800" y="455" class="accent">Kritik Yükseklik</text><rect x="490" y="360" width="45" height="180" fill="${CYAN}" fill-opacity="0.18"/><rect x="665" y="360" width="45" height="180" fill="${CYAN}" fill-opacity="0.18"/><text x="295" y="465" class="accent">Uç Bölgeler</text>`;
  return shell(spec.headline, "Tek perde elevasyonunda tabandan başlayan kritik yüksekliği ve bu bölge boyunca sürdürülen uç bölgeleri gösteren teknik kapak.", body);
}

function wallCriticalDiagram(spec: DepremRolloutSpec) {
  const edgeBars = [310,345,380,820,855,890].map((x)=>`<circle cx="${x}" cy="335" r="13" fill="${NAVY}"/>`).join("");
  const webBars = [450,525,600,675,750].map((x)=>`<circle cx="${x}" cy="335" r="9" fill="${NAVY}"/>`).join("");
  const body = `<rect x="270" y="255" width="660" height="160" rx="8" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/><rect x="285" y="270" width="125" height="130" rx="10" fill="${CYAN}" fill-opacity="0.10" stroke="${CYAN}" stroke-width="5"/><rect x="790" y="270" width="125" height="130" rx="10" fill="${CYAN}" fill-opacity="0.10" stroke="${CYAN}" stroke-width="5"/>${edgeBars}${webBars}<text x="280" y="210" class="accent">Uç Bölge</text><text x="790" y="210" class="accent">Uç Bölge</text><text x="550" y="475" class="label">Gövde</text>`;
  return shell(spec.headline, "Perde taban kesitinde iki uç bölge ile gövde donatısının birbirinden ayrıldığı tek teknik kesit detayı.", body);
}

export function renderTbdyTechnicalVisual8Svg(spec: DepremRolloutSpec, asset: TbdyTechnicalVisual8Asset) {
  switch (spec.slug) {
    case "tbdy-betonarme-ozel-deprem-etriyesi-ciroz":
      return asset === "cover" ? stirrupCover(spec) : stirrupDiagram(spec);
    case "tbdy-betonarme-kolon-sarilma-bolgeleri":
      return asset === "cover" ? columnConfinementCover(spec) : columnConfinementDiagram(spec);
    case "tbdy-betonarme-kiris-sarilma-bolgeleri":
      return asset === "cover" ? beamConfinementCover(spec) : beamConfinementDiagram(spec);
    case "tbdy-betonarme-perde-kritik-yukseklik-uc-bolge":
      return asset === "cover" ? wallCriticalCover(spec) : wallCriticalDiagram(spec);
    default:
      throw new Error(`TBDY teknik görsel paket 8 eşleşmesi yok: ${spec.slug}`);
  }
}
