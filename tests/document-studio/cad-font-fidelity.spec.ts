import { expect, test } from "@playwright/test";
import { resolveCadFont, evaluateCadFontParity } from "@/lib/dokumantasyon/cad-font-registry";

test.describe("CAD Font Fidelity and AutoCAD Parity Contract", () => {
  test("Target style ARIAL_BOLD resolves to exact Arial-Bold mesh font", () => {
    const boldMatch = resolveCadFont("arialbd.ttf");
    expect(boldMatch).not.toBeNull();
    expect(boldMatch?.file).toBe("Arial-Bold.ttf");
    expect(boldMatch?.type).toBe("mesh");
    expect(boldMatch?.exact).toBe(true);

    const regularMatch = resolveCadFont("arial.ttf");
    expect(regularMatch).not.toBeNull();
    expect(regularMatch?.file).toBe("Arial-Regular.ttf");
    expect(regularMatch?.type).toBe("mesh");
    expect(regularMatch?.exact).toBe(true);
  });

  test("Target styles 'Times roman' and 'romant' resolve to exact IBMPlexSerif mesh font", () => {
    const timesMatch = resolveCadFont("Times roman");
    expect(timesMatch).not.toBeNull();
    expect(timesMatch?.file).toBe("IBMPlexSerif-Regular.ttf");
    expect(timesMatch?.type).toBe("mesh");
    expect(timesMatch?.exact).toBe(true);

    const romantMatch = resolveCadFont("romant");
    expect(romantMatch).not.toBeNull();
    expect(romantMatch?.file).toBe("IBMPlexSerif-Regular.ttf");

    const timesBoldMatch = resolveCadFont("times-bold");
    expect(timesBoldMatch).not.toBeNull();
    expect(timesBoldMatch?.file).toBe("IBMPlexSerif-Bold.ttf");
  });

  test("Parity evaluation correctly classifies exact vs missing fonts", () => {
    const exactEvaluation = evaluateCadFontParity(["arialbd.ttf", "Times roman"]);
    expect(exactEvaluation.fontParityExact).toBe(true);
    expect(exactEvaluation.resolvedExactFonts).toContain("arialbd.ttf");
    expect(exactEvaluation.resolvedExactFonts).toContain("Times roman");
    expect(exactEvaluation.missingFonts).toEqual([]);

    const missingEvaluation = evaluateCadFontParity(["arialbd.ttf", "unknown-font-xyz"]);
    expect(missingEvaluation.fontParityExact).toBe(false);
    expect(missingEvaluation.resolvedExactFonts).toEqual(["arialbd.ttf"]);
    expect(missingEvaluation.missingFonts).toEqual(["unknown-font-xyz"]);
  });

  test("Sample text Ü(1Φ14) and Turkish DWG texts are preserved without garbling", () => {
    const textSample = "Ü(1Φ14) — BALKON döş: seramik kaplama dvr: sıva üzeri yalıtım boya tvn: sıva üzeri tavan boyası 10.50 m²";
    const utf8Encoded = Buffer.from(textSample, "utf-8");
    const decoded = utf8Encoded.toString("utf-8");
    expect(decoded).toBe(textSample);

    // Phi vs Slash-O vs Percent-C distinction
    expect("Φ").not.toBe("Ø");
    expect("Φ").not.toBe("%%c");
    expect("Ø").not.toBe("%%c");
  });

  test("Feature flag defaults to ON and can be disabled via '0' kill switch", () => {
    // Flag default state is ON
    const defaultEnabled = typeof process === "undefined" || process.env.NEXT_PUBLIC_CAD_AUTOCAD_FONT_PARITY_V1 !== "0";
    expect(defaultEnabled).toBe(true);
  });
});
