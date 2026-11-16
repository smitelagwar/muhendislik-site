import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateKirisliBetonDemir,
  tryCalculateKirisliBetonDemir,
  validateKirisliInput,
} from "../../src/lib/calculations/modules/kirisli-beton-demir";

test("1.200 m2 5 kat + 1 bodrumlu kolon+perde radye bina tutarlı metraj ve laboratuvar ücreti üretir", () => {
  const res = calculateKirisliBetonDemir({
    mode: "alan",
    areaM2: 1200,
    normalFloors: 5,
    basementFloors: 1,
    structuralSystem: "kolonPerde",
    foundationType: "radye",
  });

  assert.equal(res.totalAreaM2, 1200);
  assert.equal(res.totalFloors, 6);
  assert.equal(res.footprintAreaM2, 200);
  assert.equal(res.breakdown.length, 3);
  assert.ok(res.totalConcreteM3 > 400 && res.totalConcreteM3 < 650);
  assert.ok(res.totalRebarTons > 35 && res.totalRebarTons < 70);
  assert.ok(res.labEstimate.totalGross > 40_000);
  assert.equal(res.labEstimate.estimatedConcreteM3, res.totalConcreteM3);
  assert.equal(res.labEstimate.estimatedRebarTons, res.totalRebarTons);
});

test("Sadece perdeli sistem kolona göre daha fazla beton üretir ancak birim m3 demiri daha düşüktür", () => {
  const base = {
    mode: "alan" as const,
    areaM2: 1200,
    normalFloors: 5,
    basementFloors: 0 as const,
    foundationType: "radye" as const,
  };

  const kolon = calculateKirisliBetonDemir({ ...base, structuralSystem: "kolon" });
  const kolonPerde = calculateKirisliBetonDemir({ ...base, structuralSystem: "kolonPerde" });
  const sadecePerde = calculateKirisliBetonDemir({ ...base, structuralSystem: "sadecePerde" });

  assert.ok(sadecePerde.totalConcreteM3 > kolonPerde.totalConcreteM3);
  assert.ok(kolonPerde.totalConcreteM3 > kolon.totalConcreteM3);
  assert.ok(sadecePerde.rebarKgPerM3 < kolon.rebarKgPerM3);
});

test("Radye temel mütemadi temelden daha fazla beton ve demir üretir", () => {
  const base = {
    mode: "alan" as const,
    areaM2: 1000,
    normalFloors: 4,
    basementFloors: 0 as const,
    structuralSystem: "kolonPerde" as const,
  };

  const radye = calculateKirisliBetonDemir({ ...base, foundationType: "radye" });
  const mutemadi = calculateKirisliBetonDemir({ ...base, foundationType: "mutemadi" });

  assert.ok(radye.totalConcreteM3 > mutemadi.totalConcreteM3);
  assert.ok(radye.totalRebarTons > mutemadi.totalRebarTons);
});

test("Rijit bodrum eklendiğinde çevre perdesi betonu, demiri ve laboratuvar ücreti artar", () => {
  const base = {
    mode: "alan" as const,
    areaM2: 1200,
    normalFloors: 5,
    structuralSystem: "kolonPerde" as const,
    foundationType: "radye" as const,
  };

  const yok = calculateKirisliBetonDemir({ ...base, basementFloors: 0 });
  const bir = calculateKirisliBetonDemir({ ...base, basementFloors: 1 });
  const iki = calculateKirisliBetonDemir({ ...base, basementFloors: 2 });

  assert.equal(yok.breakdown.length, 2);
  assert.equal(bir.breakdown.length, 3);
  assert.equal(iki.breakdown.length, 3);
  assert.ok(bir.totalConcreteM3 > yok.totalConcreteM3);
  assert.ok(bir.totalRebarTons > yok.totalRebarTons);
  assert.ok(iki.totalConcreteM3 > bir.totalConcreteM3);
  assert.ok(bir.labEstimate.totalGross > yok.labEstimate.totalGross);
});

test("Parsel (TAKS / KAKS) modu taban alanı, kat sayısı ve toplam alanı doğru türetir", () => {
  const res = calculateKirisliBetonDemir({
    mode: "parsel",
    parcelAreaM2: 500,
    taks: 0.3,
    kaks: 1.5,
    basementFloors: 1,
    structuralSystem: "kolonPerde",
    foundationType: "radye",
  });

  assert.equal(res.footprintAreaM2, 150);
  assert.equal(res.normalFloors, 5);
  assert.equal(res.totalFloors, 6);
  // 500 * 1.50 = 750 m² emsal + 1 * 150 m² bodrum = 900 m²
  assert.equal(res.totalAreaM2, 900);
  assert.ok(res.totalConcreteM3 > 300);
  assert.ok(res.totalRebarTons > 28);
});

test("Geçersiz girdiler reddedilir ve tryCalculateKirisliBetonDemir null döner", () => {
  const v1 = validateKirisliInput({
    mode: "alan",
    areaM2: 0,
    normalFloors: 4,
    basementFloors: 0,
    structuralSystem: "kolon",
    foundationType: "radye",
  });
  assert.equal(v1.isValid, false);

  const v2 = validateKirisliInput({
    mode: "parsel",
    parcelAreaM2: 500,
    taks: 1.4,
    kaks: 1.5,
    basementFloors: 0,
    structuralSystem: "kolon",
    foundationType: "radye",
  });
  assert.equal(v2.isValid, false);

  assert.equal(
    tryCalculateKirisliBetonDemir({
      mode: "alan",
      areaM2: -100,
      normalFloors: 4,
      basementFloors: 0,
      structuralSystem: "kolon",
      foundationType: "radye",
    }),
    null
  );
});
