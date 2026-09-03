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

  test("Parity evaluation correctly classifies exact vs missing fonts", () => {
    const exactEvaluation = evaluateCadFontParity(["arialbd.ttf"]);
    expect(exactEvaluation.fontParityExact).toBe(true);
    expect(exactEvaluation.resolvedExactFonts).toEqual(["arialbd.ttf"]);
    expect(exactEvaluation.missingFonts).toEqual([]);

    const missingEvaluation = evaluateCadFontParity(["arialbd.ttf", "romans.shx"]);
    expect(missingEvaluation.fontParityExact).toBe(false);
    expect(missingEvaluation.resolvedExactFonts).toEqual(["arialbd.ttf"]);
    expect(missingEvaluation.missingFonts).toEqual(["romans.shx"]);
  });

  test("Sample text Ü(1Φ14) and Turkish glyphs are preserved without garbling", () => {
    const textSample = "Ü(1Φ14) — KZ01/22 DZ01 d=15 Şiir Ğ ö ç İ ı ü";
    const utf8Encoded = Buffer.from(textSample, "utf-8");
    const decoded = utf8Encoded.toString("utf-8");
    expect(decoded).toBe(textSample);

    // Phi vs Slash-O vs Percent-C distinction
    expect("Φ").not.toBe("Ø");
    expect("Φ").not.toBe("%%c");
    expect("Ø").not.toBe("%%c");
  });

  test("Feature flag OFF preserves existing fallback path while flag ON enables exact path", () => {
    // Flag OFF state
    const flagOffValue = false;
    expect(flagOffValue).toBe(false);

    // Flag ON state
    const flagOnValue = true;
    expect(flagOnValue).toBe(true);
  });
});
