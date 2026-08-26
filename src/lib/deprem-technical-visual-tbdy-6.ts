import type { DepremRolloutSpec } from "./deprem-rollout";
import { DEPREM_TECHNICAL_VISUAL_STYLE } from "./deprem-visual-rollout";

export type TbdyTechnicalVisual6Asset = "cover" | "diagram";

const { navy: NAVY, cyan: CYAN, paper: PAPER, white: WHITE, neutral: NEUTRAL } = DEPREM_TECHNICAL_VISUAL_STYLE;

export const TBDY_TECHNICAL_VISUAL_6_SLUGS = new Set([
  "tbdy-bks-dts-bys-belirleme",
  "tbdy-performans-hedefleri-dd-sh-kh-go",
  "tbdy-etkin-kesit-rijitlikleri",
  "tbdy-kutle-kaynagi-hareketli-yuk-katilimi",
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
    <style>.label{font:700 21px Arial,sans-serif;fill:${NAVY}}.accent{font:700 21px Arial,sans-serif;fill:${CYAN}}.small{font:600 17px Arial,sans-serif;fill:${NAVY}}.symbol{font:700 20px Arial,sans-serif;fill:${CYAN}}</style>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="${CYAN}"/></marker>
  </defs>
  <rect width="1200" height="675" fill="url(#paper)"/>${body}</svg>`;
}

function classificationCover(spec: DepremRolloutSpec) {
  const floors = [175, 255, 335, 415].map((y) => `<line x1="420" y1="${y}" x2="760" y2="${y}" stroke="${NAVY}" stroke-width="5"/>`).join("");
  const columns = [455, 590, 725].map((x) => `<line x1="${x}" y1="135" x2="${x}" y2="505" stroke="${NAVY}" stroke-width="5"/>`).join("");
  const body = `<rect x="420" y="135" width="340" height="370" rx="8" fill="${WHITE}" stroke="${NAVY}" stroke-width="5"/>${floors}${columns}<rect x="470" y="200" width="240" height="42" rx="12" fill="${CYAN}" fill-opacity="0.08" stroke="${CYAN}" stroke-width="3"/><text x="555" y="229" class="accent">BKS</text><line x1="330" y1="352" x2="410" y2="352" stroke="${CYAN}" stroke-width="6" marker-end="url(#arrow)"/><text x="195" y="359" class="accent">DTS</text><line x1="805" y1="145" x2="805" y2="500" stroke="${CYAN}" stroke-width="4"/><line x1="790" y1="145" x2="820" y2="145" stroke="${CYAN}" stroke-width="4"/><line x1="790" y1="500" x2="820" y2="500" stroke="${CYAN}" stroke-width="4"/><text x="838" y="330" class="accent">BYS</text><text x="476" y="548" class="small">Kullanım</text><text x="695" y="548" class="symbol">H</text>`;
  return shell(spec.headline, "Tek bina üzerinde kullanım sınıfı, deprem tasarım sınıfı ve bina yükseklik sınıfının farklı girdiler olduğunu gösteren teknik kapak.", body);
}

function classificationDiagram(spec: DepremRolloutSpec) {
  const body = `<rect x="80" y="120" width="210" height="92" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><text x="123" y="177" class="label">Kullanım</text><line x1="290" y1="166" x2="360" y2="166" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><rect x="382" y="120" width="120" height="92" rx="18" fill="${WHITE}" stroke="${CYAN}" stroke-width="5"/><text x="420" y="177" class="accent">BKS</text><rect x="80" y="292" width="210" height="92" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><text x="160" y="349" class="symbol">SDS</text><line x1="290" y1="338" x2="360" y2="338" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><rect x="382" y="292" width="120" height="92" rx="18" fill="${WHITE}" stroke="${CYAN}" stroke-width="5"/><text x="420" y="349" class="accent">DTS</text><rect x="80" y="464" width="210" height="92" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><text x="126" y="521" class="label">Yükseklik</text><line x1="290" y1="510" x2="360" y2="510" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><rect x="382" y="464" width="120" height="92" rx="18" fill="${WHITE}" stroke="${CYAN}" stroke-width="5"/><text x="420" y="521" class="accent">BYS</text><path d="M525 166H680V338H805M525 338H805M525 510H680V338" fill="none" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><rect x="830" y="270" width="285" height="136" rx="24" fill="${CYAN}" fill-opacity="0.07" stroke="${NAVY}" stroke-width="5"/><text x="878" y="344" class="label">Taşıyıcı Sistem</text>`;
  return shell(spec.headline, "Kullanım, SDS ve bina yüksekliği girdilerinin BKS, DTS ve BYS üzerinden taşıyıcı sistem seçimine bağlandığını gösteren teknik detay.", body);
}

function performanceCover(spec: DepremRolloutSpec) {
  const body = `<line x1="135" y1="510" x2="1060" y2="510" stroke="${NAVY}" stroke-width="4"/><line x1="135" y1="510" x2="135" y2="125" stroke="${NAVY}" stroke-width="4"/><path d="M135 500C260 480 335 430 410 350S560 205 700 205S895 300 1030 460" fill="none" stroke="${NAVY}" stroke-width="7"/><line x1="405" y1="160" x2="405" y2="510" stroke="${CYAN}" stroke-width="3" stroke-dasharray="12 10"/><line x1="675" y1="160" x2="675" y2="510" stroke="${CYAN}" stroke-width="3" stroke-dasharray="12 10"/><line x1="900" y1="160" x2="900" y2="510" stroke="${CYAN}" stroke-width="3" stroke-dasharray="12 10"/><text x="350" y="135" class="accent">SH</text><text x="625" y="135" class="accent">KH</text><text x="850" y="135" class="accent">GÖ</text><line x1="735" y1="555" x2="735" y2="330" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><text x="765" y="365" class="label">İstem</text><text x="76" y="110" class="symbol">F</text><text x="1070" y="540" class="symbol">Δ</text>`;
  return shell(spec.headline, "Tek kapasite eğrisi üzerinde SH, KH ve GÖ performans bölgeleri ile deprem isteminin ilişkisini gösteren teknik kapak.", body);
}

function performanceDiagram(spec: DepremRolloutSpec) {
  const body = `<rect x="85" y="270" width="165" height="110" rx="20" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><text x="135" y="336" class="accent">DD</text><rect x="85" y="430" width="165" height="110" rx="20" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><text x="130" y="496" class="accent">BKS</text><line x1="250" y1="325" x2="410" y2="325" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><line x1="250" y1="485" x2="335" y2="485" stroke="${CYAN}" stroke-width="4"/><line x1="335" y1="485" x2="335" y2="325" stroke="${CYAN}" stroke-width="4"/><rect x="435" y="255" width="260" height="140" rx="24" fill="${CYAN}" fill-opacity="0.07" stroke="${CYAN}" stroke-width="5"/><text x="470" y="322" class="label">Performans Hedefi</text><text x="493" y="360" class="accent">SH · KH · GÖ</text><line x1="695" y1="325" x2="795" y2="325" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><rect x="820" y="255" width="285" height="140" rx="24" fill="${WHITE}" stroke="${NAVY}" stroke-width="5"/><text x="866" y="322" class="label">Kabul Sınırı</text><path d="M930 355l22 22 46-56" fill="none" stroke="${CYAN}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
  return shell(spec.headline, "Yer hareketi düzeyi ve bina kullanım sınıfının performans hedefini baştan belirleyip kabul sınırlarına taşıdığını gösteren teknik detay.", body);
}

function stiffnessCover(spec: DepremRolloutSpec) {
  const cracks = [430, 500, 570, 640, 710].map((x, index) => `<path d="M${x} 342l${index % 2 ? 12 : -12} 18 10 15 -12 17" fill="none" stroke="${CYAN}" stroke-width="4" stroke-linecap="round"/>`).join("");
  const body = `<rect x="250" y="300" width="700" height="105" rx="8" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/>${cracks}<path d="M250 435Q600 525 950 435" fill="none" stroke="${CYAN}" stroke-width="5" stroke-dasharray="14 10"/><line x1="600" y1="145" x2="600" y2="275" stroke="${CYAN}" stroke-width="6" marker-end="url(#arrow)"/><text x="625" y="210" class="accent">Yük</text><path d="M205 405l45-75 45 75zM905 405l45-75 45 75z" fill="${NEUTRAL}" stroke="${NAVY}" stroke-width="4"/><text x="350" y="560" class="label">Çatlama</text><text x="650" y="560" class="accent">Etkin EI</text>`;
  return shell(spec.headline, "Tek betonarme elemanda çatlama ile eğilme deformasyonunun etkin kesit rijitliğine etkisini gösteren teknik kapak.", body);
}

function stiffnessDiagram(spec: DepremRolloutSpec) {
  const rebars = [[420,235],[780,235],[420,440],[780,440]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="13" fill="${NAVY}"/>`).join("");
  const body = `<rect x="350" y="155" width="500" height="370" rx="14" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/>${rebars}<line x1="350" y1="335" x2="850" y2="335" stroke="${CYAN}" stroke-width="5" stroke-dasharray="14 10"/><text x="875" y="343" class="accent">N.A.</text><path d="M365 360h470v150H365z" fill="url(#hatch)"/><path d="M410 440l28-32 24 25 28-42 26 38 30-46 25 40 30-28 26 35" fill="none" stroke="${CYAN}" stroke-width="4"/><text x="455" y="115" class="label">Çatlamış Kesit</text><text x="515" y="590" class="accent">EIetkin</text>`;
  return shell(spec.headline, "Tek betonarme kesitte çatlaklı bölge, nötr eksen ve etkin eğilme rijitliği kavramını gösteren teknik kesit detayı.", body);
}

function massCover(spec: DepremRolloutSpec) {
  const permanent = [[330,240],[480,240],[630,240],[780,240],[405,365],[555,365],[705,365]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="11" fill="${NAVY}"/>`).join("");
  const live = [[385,300],[585,300],[735,430]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="14" fill="${CYAN}"/>`).join("");
  const body = `<path d="M250 155H875L975 265V520H350L250 410Z" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/>${permanent}${live}<circle cx="615" cy="350" r="38" fill="${CYAN}" fill-opacity="0.08" stroke="${CYAN}" stroke-width="5"/><text x="601" y="358" class="accent">M</text><text x="270" y="580" class="label">Sabit Yük</text><circle cx="400" cy="573" r="9" fill="${NAVY}"/><text x="505" y="580" class="label">Hareketli Yük</text><circle cx="690" cy="573" r="10" fill="${CYAN}"/><text x="805" y="580" class="accent">Kütle</text>`;
  return shell(spec.headline, "Tek kat diyaframında sabit yükler ile kullanım türüne bağlı hareketli yük katkısının deprem kütlesinde toplandığını gösteren teknik kapak.", body);
}

function massDiagram(spec: DepremRolloutSpec) {
  const floors = [170, 270, 370, 470].map((y, index) => `<line x1="340" y1="${y}" x2="820" y2="${y}" stroke="${NAVY}" stroke-width="6"/><circle cx="580" cy="${y - 18}" r="${20 + index * 2}" fill="${CYAN}" fill-opacity="0.12" stroke="${CYAN}" stroke-width="4"/>`).join("");
  const body = `<line x1="390" y1="135" x2="390" y2="505" stroke="${NAVY}" stroke-width="6"/><line x1="770" y1="135" x2="770" y2="505" stroke="${NAVY}" stroke-width="6"/>${floors}<path d="M300 530H860" stroke="${NAVY}" stroke-width="7"/><text x="855" y="185" class="accent">Kat Kütlesi</text><line x1="820" y1="170" x2="935" y2="170" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><line x1="820" y1="270" x2="935" y2="270" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><line x1="820" y1="370" x2="935" y2="370" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><line x1="820" y1="470" x2="935" y2="470" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><text x="270" y="115" class="label">Diyaframlar</text><text x="805" y="585" class="label">Modal Kütle</text>`;
  return shell(spec.headline, "Kat diyaframlarına dağıtılan kütlelerin modal deprem hesabına taşındığını gösteren tek bina elevasyonu teknik detayı.", body);
}

export function renderTbdyTechnicalVisual6Svg(spec: DepremRolloutSpec, asset: TbdyTechnicalVisual6Asset) {
  switch (spec.slug) {
    case "tbdy-bks-dts-bys-belirleme":
      return asset === "cover" ? classificationCover(spec) : classificationDiagram(spec);
    case "tbdy-performans-hedefleri-dd-sh-kh-go":
      return asset === "cover" ? performanceCover(spec) : performanceDiagram(spec);
    case "tbdy-etkin-kesit-rijitlikleri":
      return asset === "cover" ? stiffnessCover(spec) : stiffnessDiagram(spec);
    case "tbdy-kutle-kaynagi-hareketli-yuk-katilimi":
      return asset === "cover" ? massCover(spec) : massDiagram(spec);
    default:
      throw new Error(`TBDY teknik görsel paket 6 eşleşmesi yok: ${spec.slug}`);
  }
}
