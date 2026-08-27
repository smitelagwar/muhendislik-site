import type { DepremRolloutSpec } from "./deprem-rollout";
import { DEPREM_TECHNICAL_VISUAL_STYLE } from "./deprem-visual-rollout";

export type TbdyTechnicalVisual7Asset = "cover" | "diagram";

const { navy: NAVY, cyan: CYAN, paper: PAPER, white: WHITE, neutral: NEUTRAL } = DEPREM_TECHNICAL_VISUAL_STYLE;

export const TBDY_TECHNICAL_VISUAL_7_SLUGS = new Set([
  "tbdy-esdeger-deprem-yuku-uygulanma-sinirlari",
  "tbdy-yeterli-mod-modal-kutle-katilimi",
  "tbdy-modal-taban-kesme-olceklendirme",
  "tbdy-yuzde-100-yuzde-30-birlesimi",
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

function equivalentLoadCover(spec: DepremRolloutSpec) {
  const floors = [185, 270, 355, 440].map((y) => `<line x1="390" y1="${y}" x2="760" y2="${y}" stroke="${NAVY}" stroke-width="5"/>`).join("");
  const loads = [[185,110],[270,140],[355,170],[440,200]].map(([y,len]) => `<line x1="${350-len}" y1="${y}" x2="370" y2="${y}" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/>`).join("");
  const body = `<rect x="390" y="120" width="370" height="405" rx="10" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/>${floors}<line x1="455" y1="120" x2="455" y2="525" stroke="${NAVY}" stroke-width="5"/><line x1="695" y1="120" x2="695" y2="525" stroke="${NAVY}" stroke-width="5"/>${loads}<line x1="810" y1="130" x2="810" y2="520" stroke="${CYAN}" stroke-width="4"/><line x1="795" y1="130" x2="825" y2="130" stroke="${CYAN}" stroke-width="4"/><line x1="795" y1="520" x2="825" y2="520" stroke="${CYAN}" stroke-width="4"/><text x="842" y="330" class="accent">BYS</text><text x="170" y="125" class="accent">DTS</text><text x="435" y="585" class="label">Eşdeğer Yük</text>`;
  return shell(spec.headline, "Tek bina üzerinde yatay eşdeğer deprem yükleri ile DTS ve BYS uygunluk girdilerini gösteren teknik kapak.", body);
}

function equivalentLoadDiagram(spec: DepremRolloutSpec) {
  const body = `<rect x="95" y="145" width="180" height="95" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><text x="155" y="203" class="accent">DTS</text><rect x="95" y="290" width="180" height="95" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><text x="155" y="348" class="accent">BYS</text><rect x="95" y="435" width="180" height="95" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><text x="119" y="493" class="label">Düzensizlik</text><path d="M275 192H420V337M275 337H420M275 482H420V337" fill="none" stroke="${CYAN}" stroke-width="4"/><line x1="420" y1="337" x2="535" y2="337" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><rect x="560" y="270" width="245" height="135" rx="22" fill="${CYAN}" fill-opacity="0.07" stroke="${CYAN}" stroke-width="5"/><text x="603" y="344" class="label">Yöntem Seçimi</text><line x1="805" y1="337" x2="920" y2="337" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><circle cx="1005" cy="337" r="64" fill="${WHITE}" stroke="${NAVY}" stroke-width="5"/><path d="M972 337l22 22 48-58" fill="none" stroke="${CYAN}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><text x="950" y="435" class="label">Uygunluk</text>`;
  return shell(spec.headline, "DTS, BYS ve düzensizlik koşullarının analiz yöntemi uygunluğuna birlikte girdiğini gösteren teknik detay.", body);
}

function modalParticipationCover(spec: DepremRolloutSpec) {
  const levels = [150,230,310,390,470].map((y) => `<line x1="330" y1="${y}" x2="690" y2="${y}" stroke="${NAVY}" stroke-width="4"/>`).join("");
  const body = `<line x1="360" y1="120" x2="360" y2="505" stroke="${NAVY}" stroke-width="5"/><line x1="660" y1="120" x2="660" y2="505" stroke="${NAVY}" stroke-width="5"/>${levels}<path d="M510 480C500 410 480 330 445 255S390 145 380 130" fill="none" stroke="${CYAN}" stroke-width="6"/><path d="M510 480C570 420 600 350 560 290S460 190 500 130" fill="none" stroke="${CYAN}" stroke-width="4" stroke-opacity="0.75"/><path d="M510 480C460 430 430 385 485 335S610 240 545 130" fill="none" stroke="${CYAN}" stroke-width="3" stroke-opacity="0.55"/><text x="735" y="200" class="accent">Mod 1</text><text x="735" y="260" class="accent">Mod 2</text><text x="735" y="320" class="accent">Mod 3</text><text x="395" y="570" class="label">Modal Katılım</text>`;
  return shell(spec.headline, "Tek taşıyıcı sistem üzerinde birden fazla titreşim modunun kütle katılımına katkısını gösteren teknik kapak.", body);
}

function modalParticipationDiagram(spec: DepremRolloutSpec) {
  const barsX = [120,205,275,330,370,395].map((h,i) => `<rect x="${180+i*105}" y="${525-h}" width="38" height="${h}" rx="6" fill="${NAVY}" fill-opacity="${0.35+i*0.09}"/>`).join("");
  const barsY = [85,165,245,310,355,390].map((h,i) => `<rect x="${225+i*105}" y="${525-h}" width="38" height="${h}" rx="6" fill="${CYAN}" fill-opacity="${0.35+i*0.09}"/>`).join("");
  const body = `<line x1="130" y1="525" x2="900" y2="525" stroke="${NAVY}" stroke-width="4"/><line x1="130" y1="525" x2="130" y2="100" stroke="${NAVY}" stroke-width="4"/>${barsX}${barsY}<text x="175" y="585" class="label">Artan Mod Sayısı</text><text x="80" y="85" class="symbol">ΣM</text><rect x="930" y="190" width="170" height="85" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><rect x="955" y="217" width="24" height="24" fill="${NAVY}"/><text x="995" y="239" class="label">X</text><rect x="930" y="320" width="170" height="85" rx="18" fill="${WHITE}" stroke="${CYAN}" stroke-width="4"/><rect x="955" y="347" width="24" height="24" fill="${CYAN}"/><text x="995" y="369" class="accent">Y</text>`;
  return shell(spec.headline, "X ve Y doğrultularında birikimli modal kütle katılımının mod sayısı arttıkça izlenmesini gösteren teknik grafik.", body);
}

function modalScaleCover(spec: DepremRolloutSpec) {
  const body = `<line x1="150" y1="520" x2="1040" y2="520" stroke="${NAVY}" stroke-width="4"/><rect x="285" y="285" width="150" height="235" rx="10" fill="${NAVY}" fill-opacity="0.14" stroke="${NAVY}" stroke-width="5"/><text x="302" y="565" class="label">Vmodal</text><line x1="180" y1="210" x2="980" y2="210" stroke="${CYAN}" stroke-width="5" stroke-dasharray="14 10"/><text x="820" y="185" class="accent">Referans</text><line x1="520" y1="390" x2="705" y2="235" stroke="${CYAN}" stroke-width="6" marker-end="url(#arrow)"/><rect x="735" y="210" width="180" height="310" rx="12" fill="${CYAN}" fill-opacity="0.10" stroke="${CYAN}" stroke-width="5"/><text x="758" y="565" class="accent">Ölçekli V</text><text x="570" y="355" class="accent">Ölçek</text>`;
  return shell(spec.headline, "Modal taban kesmesinin referans düzeyle kontrol edilip gerektiğinde tutarlı biçimde ölçeklendiğini gösteren teknik kapak.", body);
}

function modalScaleDiagram(spec: DepremRolloutSpec) {
  const body = `<rect x="105" y="265" width="210" height="130" rx="22" fill="${WHITE}" stroke="${NAVY}" stroke-width="5"/><text x="132" y="338" class="label">Modal Sonuç</text><line x1="315" y1="330" x2="450" y2="330" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><circle cx="535" cy="330" r="72" fill="${CYAN}" fill-opacity="0.07" stroke="${CYAN}" stroke-width="5"/><text x="503" y="338" class="accent">Ölçek</text><line x1="607" y1="330" x2="720" y2="330" stroke="${CYAN}" stroke-width="5"/><line x1="720" y1="210" x2="720" y2="450" stroke="${CYAN}" stroke-width="4"/><line x1="720" y1="210" x2="755" y2="210" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><line x1="720" y1="330" x2="755" y2="330" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><line x1="720" y1="450" x2="755" y2="450" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><rect x="770" y="165" width="260" height="90" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><text x="850" y="221" class="label">Kuvvet</text><rect x="770" y="285" width="260" height="90" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><text x="850" y="341" class="label">Moment</text><rect x="770" y="405" width="260" height="90" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="4"/><text x="835" y="461" class="label">Deplasman</text>`;
  return shell(spec.headline, "Tek ölçek katsayısının yalnız taban kesmesine değil ilgili kuvvet, moment ve deplasman sonuçlarına tutarlı uygulanmasını gösteren teknik detay.", body);
}

function orthogonalCover(spec: DepremRolloutSpec) {
  const body = `<rect x="390" y="175" width="420" height="320" rx="18" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/><rect x="555" y="290" width="90" height="90" rx="8" fill="${NEUTRAL}" stroke="${NAVY}" stroke-width="5"/><line x1="600" y1="335" x2="930" y2="335" stroke="${CYAN}" stroke-width="7" marker-end="url(#arrow)"/><text x="825" y="305" class="accent">100% X</text><line x1="600" y1="335" x2="600" y2="105" stroke="${CYAN}" stroke-width="5" marker-end="url(#arrow)"/><text x="625" y="135" class="accent">30% Y</text><circle cx="600" cy="335" r="16" fill="${NAVY}"/><text x="445" y="565" class="label">İki Eksenli Etki</text>`;
  return shell(spec.headline, "Tek kolon planında birbirine dik iki deprem doğrultusunun yüzde 100 ve yüzde 30 katkılarıyla birlikte etkidiğini gösteren teknik kapak.", body);
}

function orthogonalDiagram(spec: DepremRolloutSpec) {
  const body = `<circle cx="600" cy="330" r="82" fill="${WHITE}" stroke="${NAVY}" stroke-width="6"/><line x1="600" y1="330" x2="980" y2="330" stroke="${CYAN}" stroke-width="6" marker-end="url(#arrow)"/><line x1="600" y1="330" x2="220" y2="330" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><line x1="600" y1="330" x2="600" y2="85" stroke="${CYAN}" stroke-width="6" marker-end="url(#arrow)"/><line x1="600" y1="330" x2="600" y2="575" stroke="${CYAN}" stroke-width="4" marker-end="url(#arrow)"/><text x="915" y="300" class="accent">±X</text><text x="625" y="115" class="accent">±Y</text><path d="M600 330L820 185" stroke="${NAVY}" stroke-width="6" marker-end="url(#arrow)"/><text x="785" y="160" class="label">Birleşik Etki</text><text x="470" y="635" class="accent">100 / 30</text>`;
  return shell(spec.headline, "Tek eleman üzerinde her iki işaret ve iki yatay doğrultunun yüzde 100-yüzde 30 birleşim mantığıyla ele alındığını gösteren teknik detay.", body);
}

export function renderTbdyTechnicalVisual7Svg(spec: DepremRolloutSpec, asset: TbdyTechnicalVisual7Asset) {
  switch (spec.slug) {
    case "tbdy-esdeger-deprem-yuku-uygulanma-sinirlari":
      return asset === "cover" ? equivalentLoadCover(spec) : equivalentLoadDiagram(spec);
    case "tbdy-yeterli-mod-modal-kutle-katilimi":
      return asset === "cover" ? modalParticipationCover(spec) : modalParticipationDiagram(spec);
    case "tbdy-modal-taban-kesme-olceklendirme":
      return asset === "cover" ? modalScaleCover(spec) : modalScaleDiagram(spec);
    case "tbdy-yuzde-100-yuzde-30-birlesimi":
      return asset === "cover" ? orthogonalCover(spec) : orthogonalDiagram(spec);
    default:
      throw new Error(`TBDY teknik görsel paket 7 eşleşmesi yok: ${spec.slug}`);
  }
}
