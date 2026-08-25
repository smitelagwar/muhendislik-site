import type { DepremRolloutSpec } from "./deprem-rollout";

export type DepremVisualAsset = "cover" | "diagram";

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

function textLines(lines: string[], x: number, y: number, lineHeight: number, className: string) {
  return lines
    .map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" class="${className}">${escapeXml(line)}</text>`)
    .join("");
}

function renderCover(spec: DepremRolloutSpec) {
  const titleLines = wrapWords(spec.headline, 30, 3);
  const stepLabels = spec.steps.map((step) => escapeXml(step));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(spec.headline)}</title>
  <desc id="desc">${escapeXml(spec.steps.join(", "))} kontrol adımlarını gösteren teknik kapak görseli.</desc>
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
    .step{font:700 19px Arial,sans-serif;fill:#334155}
    .small{font:600 17px Arial,sans-serif;fill:#64748b}
  </style>
  <text x="116" y="105" class="eyebrow">${escapeXml(spec.eyebrow)}</text>
  ${textLines(titleLines, 116, 190, 58, "title")}
  <g transform="translate(116 395)">
    <rect x="0" y="0" width="280" height="100" rx="18" fill="#fef2f2" stroke="#fecaca"/>
    <rect x="342" y="0" width="280" height="100" rx="18" fill="#fff7ed" stroke="#fed7aa"/>
    <rect x="684" y="0" width="280" height="100" rx="18" fill="#f8fafc" stroke="#cbd5e1"/>
    <path d="M280 50h62M622 50h62" stroke="#94a3b8" stroke-width="4"/>
    <path d="M330 42l12 8-12 8M672 42l12 8-12 8" fill="none" stroke="#94a3b8" stroke-width="4"/>
    <text x="140" y="58" text-anchor="middle" class="step">${stepLabels[0]}</text>
    <text x="482" y="58" text-anchor="middle" class="step">${stepLabels[1]}</text>
    <text x="824" y="58" text-anchor="middle" class="step">${stepLabels[2]}</text>
  </g>
  <text x="116" y="560" class="small">TBDY 2018 · mühendislik kontrol akışı</text>
  <text x="1085" y="560" text-anchor="end" class="small">muhendislik-site</text>
</svg>`;
}

function renderDiagram(spec: DepremRolloutSpec) {
  const titleLines = wrapWords(spec.headline, 38, 2);
  const steps = spec.steps.map((step) => wrapWords(step, 23, 2));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(spec.headline)} kontrol akışı</title>
  <desc id="desc">${escapeXml(spec.steps.join(" ardından "))} adımlarından oluşan üç aşamalı teknik kontrol şeması.</desc>
  <rect width="1200" height="675" fill="#ffffff"/>
  <style>
    .eyebrow{font:700 18px Arial,sans-serif;letter-spacing:2px;fill:#b91c1c}
    .title{font:800 34px Arial,sans-serif;fill:#0f172a}
    .num{font:800 18px Arial,sans-serif;fill:#ffffff}
    .step{font:700 22px Arial,sans-serif;fill:#1e293b}
    .note{font:500 17px Arial,sans-serif;fill:#64748b}
  </style>
  <text x="70" y="72" class="eyebrow">TEKNİK KONTROL AKIŞI</text>
  ${textLines(titleLines, 70, 125, 43, "title")}
  <g transform="translate(70 235)">
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
  </g>
  <rect x="70" y="485" width="1060" height="105" rx="18" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="100" y="528" class="note">Okuma ilkesi</text>
  <text x="100" y="563" class="step">Girdi ve kabulleri doğrula → yönetmelik kontrolünü yap → sonucu proje modeli ve pafta ile eşleştir.</text>
</svg>`;
}

export function renderDepremVisualSvg(spec: DepremRolloutSpec, asset: DepremVisualAsset) {
  return asset === "cover" ? renderCover(spec) : renderDiagram(spec);
}
