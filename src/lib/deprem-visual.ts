import type { DepremRolloutSpec, DepremVisualLayout } from "./deprem-rollout";

export type DepremVisualAsset = "cover" | "diagram";

const LAYOUT_LABELS: Record<DepremVisualLayout, string> = {
  flow: "SÜREÇ AKIŞI",
  decision: "KARAR AKIŞI",
  comparison: "KARŞILAŞTIRMA",
  classification: "SINIFLANDIRMA",
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapWords(value: string, maxChars: number, maxLines: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars || !current) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }

  if (lines.length < maxLines && current) lines.push(current);
  if (words.join(" ").length > lines.join(" ").length && lines.length > 0) {
    const lastIndex = lines.length - 1;
    lines[lastIndex] = `${lines[lastIndex].replace(/[.,;:]?$/, "")}…`;
  }

  return lines.slice(0, maxLines);
}

function textLines(lines: string[], x: number, y: number, lineHeight: number, className: string, anchor = "start") {
  return lines
    .map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" text-anchor="${anchor}" class="${className}">${escapeXml(line)}</text>`)
    .join("");
}

function sharedStyles() {
  return `<style>
    .eyebrow{font:700 18px Arial,sans-serif;letter-spacing:2px;fill:#b91c1c}
    .title{font:800 34px Arial,sans-serif;fill:#0f172a}
    .num{font:800 18px Arial,sans-serif;fill:#ffffff}
    .step{font:700 21px Arial,sans-serif;fill:#1e293b}
    .note{font:500 17px Arial,sans-serif;fill:#64748b}
    .label{font:700 15px Arial,sans-serif;letter-spacing:1px;fill:#475569}
  </style>`;
}

function renderCover(spec: DepremRolloutSpec) {
  const titleLines = wrapWords(spec.headline, 30, 3);
  const stepLabels = spec.steps.map((step) => wrapWords(step, 23, 2));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(spec.headline)}</title>
  <desc id="desc">${escapeXml(spec.steps.join(", "))} başlıklarını gösteren ${escapeXml(LAYOUT_LABELS[spec.visualLayout].toLocaleLowerCase("tr-TR"))} tipinde teknik kapak görseli.</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff7ed"/>
      <stop offset="1" stop-color="#f8fafc"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#bg)"/>
  <rect x="52" y="48" width="1096" height="579" rx="28" fill="#ffffff" fill-opacity="0.82" stroke="#e2e8f0"/>
  <rect x="78" y="78" width="12" height="84" rx="6" fill="#b91c1c"/>
  <style>
    .eyebrow{font:700 20px Arial,sans-serif;letter-spacing:2px;fill:#b91c1c}
    .title{font:800 46px Arial,sans-serif;fill:#0f172a}
    .step{font:700 18px Arial,sans-serif;fill:#334155}
    .small{font:600 16px Arial,sans-serif;fill:#64748b}
    .badge{font:700 14px Arial,sans-serif;letter-spacing:1px;fill:#7c2d12}
  </style>
  <text x="116" y="105" class="eyebrow">${escapeXml(spec.eyebrow)}</text>
  <rect x="890" y="80" width="210" height="42" rx="21" fill="#fff7ed" stroke="#fed7aa"/>
  <text x="995" y="107" text-anchor="middle" class="badge">${escapeXml(LAYOUT_LABELS[spec.visualLayout])}</text>
  ${textLines(titleLines, 116, 190, 58, "title")}
  <g transform="translate(116 390)">
    <rect x="0" y="0" width="280" height="112" rx="18" fill="#fef2f2" stroke="#fecaca"/>
    <rect x="342" y="0" width="280" height="112" rx="18" fill="#fff7ed" stroke="#fed7aa"/>
    <rect x="684" y="0" width="280" height="112" rx="18" fill="#f8fafc" stroke="#cbd5e1"/>
    ${textLines(stepLabels[0], 140, 50, 25, "step", "middle")}
    ${textLines(stepLabels[1], 482, 50, 25, "step", "middle")}
    ${textLines(stepLabels[2], 824, 50, 25, "step", "middle")}
  </g>
  <text x="116" y="560" class="small">Makale içeriğinden türetilmiş teknik özet</text>
  <text x="1085" y="560" text-anchor="end" class="small">muhendislik-site</text>
</svg>`;
}

function diagramFrame(spec: DepremRolloutSpec, body: string, desc: string, footer: string) {
  const titleLines = wrapWords(spec.headline, 38, 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(spec.headline)} teknik şeması</title>
  <desc id="desc">${escapeXml(desc)}</desc>
  <rect width="1200" height="675" fill="#ffffff"/>
  ${sharedStyles()}
  <text x="70" y="72" class="eyebrow">${escapeXml(LAYOUT_LABELS[spec.visualLayout])}</text>
  ${textLines(titleLines, 70, 125, 43, "title")}
  ${body}
  <rect x="70" y="525" width="1060" height="82" rx="18" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="100" y="558" class="label">OKUMA İLKESİ</text>
  <text x="100" y="586" class="note">${escapeXml(footer)}</text>
</svg>`;
}

function renderFlow(spec: DepremRolloutSpec) {
  const steps = spec.steps.map((step) => wrapWords(step, 23, 2));
  const body = `<g transform="translate(70 245)">
    <rect x="0" y="0" width="300" height="190" rx="22" fill="#fef2f2" stroke="#fecaca" stroke-width="2"/>
    <circle cx="42" cy="42" r="22" fill="#b91c1c"/><text x="42" y="49" text-anchor="middle" class="num">1</text>
    ${textLines(steps[0], 34, 103, 31, "step")}
    <path d="M300 95h95" stroke="#94a3b8" stroke-width="5"/><path d="M383 83l18 12-18 12" fill="none" stroke="#94a3b8" stroke-width="5"/>
    <rect x="400" y="0" width="300" height="190" rx="22" fill="#fff7ed" stroke="#fed7aa" stroke-width="2"/>
    <circle cx="442" cy="42" r="22" fill="#c2410c"/><text x="442" y="49" text-anchor="middle" class="num">2</text>
    ${textLines(steps[1], 434, 103, 31, "step")}
    <path d="M700 95h95" stroke="#94a3b8" stroke-width="5"/><path d="M783 83l18 12-18 12" fill="none" stroke="#94a3b8" stroke-width="5"/>
    <rect x="800" y="0" width="300" height="190" rx="22" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
    <circle cx="842" cy="42" r="22" fill="#334155"/><text x="842" y="49" text-anchor="middle" class="num">3</text>
    ${textLines(steps[2], 834, 103, 31, "step")}
  </g>`;
  return diagramFrame(spec, body, `${spec.steps.join(" ardından ")} adımlarından oluşan teknik süreç akışı.`, "Adımları soldan sağa izleyin; her aşamada proje verisini ve ilgili kaynağı ayrıca doğrulayın.");
}

function renderDecision(spec: DepremRolloutSpec) {
  const steps = spec.steps.map((step) => wrapWords(step, 21, 2));
  const body = `<g transform="translate(80 245)">
    <rect x="0" y="35" width="270" height="155" rx="20" fill="#fef2f2" stroke="#fecaca" stroke-width="2"/>
    <text x="28" y="70" class="label">GİRDİ / İNCELEME</text>
    ${textLines(steps[0], 28, 116, 30, "step")}
    <path d="M270 112h110" stroke="#94a3b8" stroke-width="5"/><path d="M368 100l18 12-18 12" fill="none" stroke="#94a3b8" stroke-width="5"/>
    <path d="M510 20l130 92-130 92-130-92z" fill="#fff7ed" stroke="#fdba74" stroke-width="2"/>
    <text x="510" y="75" text-anchor="middle" class="label">KARAR NOKTASI</text>
    ${textLines(steps[1], 510, 115, 27, "step", "middle")}
    <path d="M640 112h110" stroke="#94a3b8" stroke-width="5"/><path d="M738 100l18 12-18 12" fill="none" stroke="#94a3b8" stroke-width="5"/>
    <rect x="750" y="35" width="270" height="155" rx="20" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
    <text x="778" y="70" class="label">SONUÇ / EYLEM</text>
    ${textLines(steps[2], 778, 116, 30, "step")}
    <path d="M510 205v52H135v-52" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="9 9"/>
    <text x="315" y="282" text-anchor="middle" class="note">Gerekirse veri ve kabulü yeniden doğrula</text>
  </g>`;
  return diagramFrame(spec, body, `${spec.steps.join(", ")} başlıklarını karar noktası çevresinde düzenleyen teknik karar şeması.`, "Karar düğümü otomatik sonuç üretmez; proje verisi, uzman değerlendirmesi ve ilgili mevzuat birlikte okunmalıdır.");
}

function renderComparison(spec: DepremRolloutSpec) {
  const steps = spec.steps.map((step) => wrapWords(step, 25, 3));
  const fills = ["#fef2f2", "#fff7ed", "#f8fafc"];
  const strokes = ["#fecaca", "#fed7aa", "#cbd5e1"];
  const body = `<g transform="translate(70 235)">${steps.map((lines, index) => {
    const x = index * 365;
    return `<rect x="${x}" y="0" width="330" height="225" rx="22" fill="${fills[index]}" stroke="${strokes[index]}" stroke-width="2"/>
      <text x="${x + 28}" y="43" class="label">0${index + 1} · KARŞILAŞTIR</text>
      ${textLines(lines, x + 28, 92, 31, "step")}
      <line x1="${x + 28}" y1="175" x2="${x + 302}" y2="175" stroke="#cbd5e1"/>
      <text x="${x + 28}" y="204" class="note">Aynı proje bağlamında değerlendir</text>`;
  }).join("")}</g>`;
  return diagramFrame(spec, body, `${spec.steps.join(", ")} başlıklarını yan yana karşılaştıran teknik şema.`, "Sütunlar alternatif veya karşılaştırılabilir başlıkları gösterir; seçim ve üstünlük sonucu doğrudan şemadan çıkarılmamalıdır.");
}

function renderClassification(spec: DepremRolloutSpec) {
  const steps = spec.steps.map((step) => wrapWords(step, 33, 2));
  const body = `<g transform="translate(95 225)">
    <line x1="78" y1="20" x2="78" y2="265" stroke="#cbd5e1" stroke-width="8" stroke-linecap="round"/>
    ${steps.map((lines, index) => {
      const y = index * 95;
      const fills = ["#fef2f2", "#fff7ed", "#f8fafc"];
      const strokes = ["#fecaca", "#fed7aa", "#cbd5e1"];
      const nums = ["01", "02", "03"];
      return `<circle cx="78" cy="${45 + y}" r="27" fill="#ffffff" stroke="${strokes[index]}" stroke-width="5"/>
        <text x="78" y="${51 + y}" text-anchor="middle" class="label">${nums[index]}</text>
        <rect x="135" y="${5 + y}" width="850" height="80" rx="18" fill="${fills[index]}" stroke="${strokes[index]}"/>
        ${textLines(lines, 170, 43 + y, 28, "step")}`;
    }).join("")}
  </g>`;
  return diagramFrame(spec, body, `${spec.steps.join(", ")} başlıklarını üç seviyeli sınıflandırma düzeninde gösteren teknik şema.`, "Sıralama yalnız makaledeki okuma düzenini temsil eder; hukuki veya teknik sınıf sınırlarını tek başına tanımlamaz.");
}

function renderDiagram(spec: DepremRolloutSpec) {
  if (spec.visualLayout === "decision") return renderDecision(spec);
  if (spec.visualLayout === "comparison") return renderComparison(spec);
  if (spec.visualLayout === "classification") return renderClassification(spec);
  return renderFlow(spec);
}

export function renderDepremVisualSvg(spec: DepremRolloutSpec, asset: DepremVisualAsset) {
  return asset === "cover" ? renderCover(spec) : renderDiagram(spec);
}
