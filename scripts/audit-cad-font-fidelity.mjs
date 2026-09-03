#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * DXF dosyasındaki grup kodu ve değer çiftlerini akıcı bir şekilde ayrıştırır.
 * Hem CRLF hem LF satır sonlarını ve büyük DXF dosyalarını destekler.
 */
function parseDxfPairs(content) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const pairs = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = Number.parseInt(lines[i].trim(), 10);
    if (!Number.isFinite(code)) continue;
    pairs.push({ code, value: lines[i + 1] });
  }
  return pairs;
}

export function auditDxfFontFidelity(dxfContent) {
  const pairs = parseDxfPairs(dxfContent);

  let acadVersion = "UNKNOWN";
  let dwgCodePage = "UNKNOWN";

  const styles = new Map();
  // Varsayılan STANDARD stilini her zaman hazır tut
  styles.set("STANDARD", {
    styleName: "STANDARD",
    primaryFont: "txt",
    bigFont: null,
    widthFactor: 1.0,
    obliqueAngle: 0.0,
    entityCount: 0,
    entityTypes: new Set(),
    samples: [],
  });

  let currentSection = null;
  let currentTable = null;
  let inStyleRecord = false;
  let tempStyle = null;

  const specialTokenPatterns = [
    { token: "%%c", regex: /%%c/i },
    { token: "%%d", regex: /%%d/i },
    { token: "%%p", regex: /%%p/i },
    { token: "Φ", regex: /[\u03A6\u03C6]/ },
    { token: "Ø", regex: /[\u00D8\u00F8]/ },
    { token: "Turkish", regex: /[ğüşıöçĞÜŞİÖÇ]/ },
  ];

  const foundTokens = new Set();
  const missingOrUnknownStyles = new Set();
  const targetEntitySamples = [];

  let i = 0;
  while (i < pairs.length) {
    const { code, value } = pairs[i];

    if (code === 0 && value === "SECTION") {
      i++;
      if (i < pairs.length && pairs[i].code === 2) {
        currentSection = pairs[i].value.trim().toUpperCase();
      }
      i++;
      continue;
    }

    if (code === 0 && value === "ENDSEC") {
      currentSection = null;
      i++;
      continue;
    }

    // HEADER değişkenleri
    if (currentSection === "HEADER") {
      if (code === 9 && value === "$ACADVER") {
        if (i + 1 < pairs.length && pairs[i + 1].code === 1) {
          acadVersion = pairs[i + 1].value.trim();
        }
      } else if (code === 9 && value === "$DWGCODEPAGE") {
        if (i + 1 < pairs.length && pairs[i + 1].code === 3) {
          dwgCodePage = pairs[i + 1].value.trim();
        }
      }
      i++;
      continue;
    }

    // TABLES -> STYLE tablosu
    if (currentSection === "TABLES") {
      if (code === 0 && value === "TABLE") {
        i++;
        if (i < pairs.length && pairs[i].code === 2) {
          currentTable = pairs[i].value.trim().toUpperCase();
        }
        i++;
        continue;
      }
      const commitStyle = () => {
        if (tempStyle && tempStyle.name) {
          const key = tempStyle.name.toUpperCase();
          styles.set(key, {
            styleName: tempStyle.name,
            primaryFont: tempStyle.primaryFont || "txt",
            bigFont: tempStyle.bigFont || null,
            widthFactor: tempStyle.widthFactor ?? 1.0,
            obliqueAngle: tempStyle.obliqueAngle ?? 0.0,
            entityCount: 0,
            entityTypes: new Set(),
            samples: [],
          });
          tempStyle = null;
          inStyleRecord = false;
        }
      };

      if (code === 0 && value === "ENDTAB") {
        commitStyle();
        currentTable = null;
        i++;
        continue;
      }

      if (currentTable === "STYLE") {
        if (code === 0 && value === "STYLE") {
          commitStyle();
          tempStyle = {
            name: "",
            primaryFont: "",
            bigFont: "",
            widthFactor: 1.0,
            obliqueAngle: 0.0,
          };
          inStyleRecord = true;
          i++;
          continue;
        }

        if (inStyleRecord && tempStyle) {
          if (code === 2) tempStyle.name = value.trim();
          else if (code === 3) tempStyle.primaryFont = value.trim();
          else if (code === 4) tempStyle.bigFont = value.trim();
          else if (code === 41) tempStyle.widthFactor = Number.parseFloat(value) || 1.0;
          else if (code === 50) tempStyle.obliqueAngle = Number.parseFloat(value) || 0.0;
        }
        i++;
        continue;
      }
    }

    // ENTITIES veya BLOCKS içindeki metinler
    if (currentSection === "ENTITIES" || currentSection === "BLOCKS") {
      if (code === 0 && ["TEXT", "MTEXT", "ATTRIB", "ATTDEF", "DIMENSION"].includes(value.toUpperCase())) {
        const entityType = value.toUpperCase();
        let rawText = "";
        let styleName = "STANDARD";
        let height = null;
        let rotation = 0;
        let oblique = 0;
        let widthFactor = 1.0;
        let horizAlign = 0;
        let vertAlign = 0;
        let insertX = null, insertY = null, insertZ = null;
        let alignX = null, alignY = null, alignZ = null;
        let extrusion = null;
        let layer = "";

        i++;
        while (i < pairs.length && pairs[i].code !== 0) {
          const eCode = pairs[i].code;
          const eVal = pairs[i].value;

          if (eCode === 1) rawText += eVal;
          else if (eCode === 3 && entityType === "MTEXT") rawText += eVal; // MText ek metin parçaları
          else if (eCode === 7) styleName = eVal.trim();
          else if (eCode === 8) layer = eVal.trim();
          else if (eCode === 40) height = Number.parseFloat(eVal);
          else if (eCode === 41) widthFactor = Number.parseFloat(eVal);
          else if (eCode === 50) rotation = Number.parseFloat(eVal);
          else if (eCode === 51) oblique = Number.parseFloat(eVal);
          else if (eCode === 71 && (entityType === "TEXT" || entityType === "ATTRIB")) horizAlign = Number.parseInt(eVal, 10);
          else if (eCode === 72) horizAlign = Number.parseInt(eVal, 10);
          else if (eCode === 73) vertAlign = Number.parseInt(eVal, 10);
          else if (eCode === 10) insertX = Number.parseFloat(eVal);
          else if (eCode === 20) insertY = Number.parseFloat(eVal);
          else if (eCode === 30) insertZ = Number.parseFloat(eVal);
          else if (eCode === 11) alignX = Number.parseFloat(eVal);
          else if (eCode === 21) alignY = Number.parseFloat(eVal);
          else if (eCode === 31) alignZ = Number.parseFloat(eVal);
          else if (eCode === 210 || eCode === 220 || eCode === 230) {
            extrusion = extrusion || [0, 0, 1];
            if (eCode === 210) extrusion[0] = Number.parseFloat(eVal);
            if (eCode === 220) extrusion[1] = Number.parseFloat(eVal);
            if (eCode === 230) extrusion[2] = Number.parseFloat(eVal);
          }

          i++;
        }

        // Stil kaydı güncellemesi
        const styleKey = styleName.toUpperCase();
        let styleObj = styles.get(styleKey);
        if (!styleObj) {
          missingOrUnknownStyles.add(styleName);
          styleObj = {
            styleName,
            primaryFont: "UNKNOWN_UNREGISTERED",
            bigFont: null,
            widthFactor: 1.0,
            obliqueAngle: 0.0,
            entityCount: 0,
            entityTypes: new Set(),
            samples: [],
          };
          styles.set(styleKey, styleObj);
        }

        styleObj.entityCount++;
        styleObj.entityTypes.add(entityType);
        if (rawText && styleObj.samples.length < 10 && !styleObj.samples.includes(rawText)) {
          styleObj.samples.push(rawText);
        }

        // Özel karakter kontrolü
        for (const { token, regex } of specialTokenPatterns) {
          if (regex.test(rawText)) {
            foundTokens.add(token);
          }
        }

        // Hedef 'Ü(1Φ14)' veya benzer donatı anotasyonlarını yakala
        if (
          rawText.includes("14") &&
          (rawText.includes("Φ") || rawText.includes("Ø") || rawText.includes("%%c") || rawText.includes("Ü") || rawText.includes("ü"))
        ) {
          targetEntitySamples.push({
            entityType,
            rawText,
            styleName,
            primaryFont: styleObj.primaryFont,
            layer,
            height,
            rotation,
            oblique,
            widthFactor,
            horizAlign,
            vertAlign,
            insertPoint: [insertX, insertY, insertZ],
            alignPoint: [alignX, alignY, alignZ],
            hasExtrusion: extrusion !== null && (extrusion[0] !== 0 || extrusion[1] !== 0 || extrusion[2] !== 1),
            unicodeEscape: Array.from(rawText).map((ch) => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0")).join(""),
          });
        }

        continue;
      }
    }

    i++;
  }

  // Son stili de ekle
  if (tempStyle && tempStyle.name) {
    const key = tempStyle.name.toUpperCase();
    if (!styles.has(key)) {
      styles.set(key, {
        styleName: tempStyle.name,
        primaryFont: tempStyle.primaryFont || "txt",
        bigFont: tempStyle.bigFont || null,
        widthFactor: tempStyle.widthFactor ?? 1.0,
        obliqueAngle: tempStyle.obliqueAngle ?? 0.0,
        entityCount: 0,
        entityTypes: new Set(),
        samples: [],
      });
    }
  }

  const stylesArray = Array.from(styles.values()).map((s) => ({
    styleName: s.styleName,
    primaryFont: s.primaryFont,
    bigFont: s.bigFont,
    widthFactor: s.widthFactor,
    obliqueAngle: s.obliqueAngle,
    entityCount: s.entityCount,
    entityTypes: Array.from(s.entityTypes),
    samples: s.samples,
  }));

  return {
    acadVersion,
    dwgCodePage,
    styles: stylesArray,
    specialTokens: Array.from(foundTokens),
    missingOrUnknownStyles: Array.from(missingOrUnknownStyles),
    targetEntitySamples: targetEntitySamples.slice(0, 20),
  };
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Kullanım: node scripts/audit-cad-font-fidelity.mjs <dxf-dosya-yolu>");
    process.exit(1);
  }

  const absolutePath = resolve(filePath);
  const content = await readFile(absolutePath, "utf8");
  const report = auditDxfFontFidelity(content);
  console.log(JSON.stringify(report, null, 2));
}

import { pathToFileURL } from "node:url";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error("Audit hatası:", err);
    process.exit(1);
  });
}
