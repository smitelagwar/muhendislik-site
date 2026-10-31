import assert from "node:assert/strict";
import test from "node:test";
import { belgeProfileSchema, isValidTcKimlikNo } from "../../src/lib/belge-hesap/profile-schema";
import { formattedPhone, nameForDocument, uppercaseName, cityDistrict } from "../../src/lib/belge-hesap/formatters";
import { encryptProfile, decryptProfile } from "../../src/lib/belge-hesap/server/crypto";
import type { AccountConfig } from "../../src/lib/belge-hesap/server/config";

const demoConfig: AccountConfig = {
  databaseUrl: "postgresql://unused-for-unit-tests.invalid/db",
  environment: "test",
  profileKey: Buffer.alloc(32, 39),
  rateSalt: "test-rate-salt-must-not-be-used-in-production",
};

test("blank, partial and full profiles are accepted; other data is rejected", () => {
  assert.deepEqual(belgeProfileSchema.parse({}), {});
  assert.deepEqual(belgeProfileSchema.parse({
    ad: "  Ayşe  ", soyad: " ÖZTÜRK ",
  }), { ad: "Ayşe", soyad: "ÖZTÜRK" });
  const full = {
    ad: "İlhan", soyad: "Işık", tcKimlikNo: "11111111110",
    meslekUnvani: "İnşaat Mühendisi", odaSicilNo: "12345",
    telefon: "05551234567", adres: "Örnek Mahallesi No:42",
    il: "İstanbul", ilce: "Şişli",
  };
  assert.deepEqual(belgeProfileSchema.parse(full), full);
  assert.equal(belgeProfileSchema.safeParse({ ...full, tcKimlikNo: "12345678901" }).success, false);
  assert.equal(belgeProfileSchema.safeParse({ ...full, extra: "no" }).success, false);
  assert.equal(belgeProfileSchema.safeParse({ ...full, adres: "X".repeat(501) }).success, false);
  assert.equal(isValidTcKimlikNo("11111111110"), true);
});

test("Turkish characters and phone formatting survive profile mapping", () => {
  const profile = { ad: "ilhan", soyad: "işçi", il: "İstanbul", ilce: "ışık" };
  assert.equal(nameForDocument(profile), "ilhan İŞÇİ");
  assert.equal(uppercaseName(profile), "İLHAN İŞÇİ");
  assert.equal(cityDistrict(profile), "İSTANBUL / IŞIK");
  assert.equal(formattedPhone("5551234567"), "0555 123 45 67");
});

test("server profile encryption stays isolated per user and environment", () => {
  const firstId = "187a76fb-d5e0-46a1-86ca-c46e571259da";
  const secondId = "55d12c36-b6ba-4e79-9b6a-09392913687f";
  const plain = JSON.stringify({ ad: "Deneme", tcKimlikNo: "11111111110" });
  const encrypted = encryptProfile(demoConfig, firstId, plain);
  assert.equal(encrypted.includes("11111111110"), false);
  assert.equal(decryptProfile(demoConfig, firstId, encrypted), plain);
  assert.throws(() => decryptProfile(demoConfig, secondId, encrypted));
  assert.throws(() => decryptProfile({ ...demoConfig, environment: "production" }, firstId, encrypted));
  assert.throws(() => decryptProfile({ ...demoConfig, profileKey: Buffer.alloc(32, 40) }, firstId, encrypted));
  const tampered = encrypted.slice(0, -2) + "zz";
  assert.throws(() => decryptProfile(demoConfig, firstId, tampered));
});

test("encryption uses randomized IV for identical profile saves", () => {
  const id = "719aa32b-4288-4ab7-af82-8848f97eb6ec";
  const plain = JSON.stringify({ ad: "Merve" });
  const a = encryptProfile(demoConfig, id, plain);
  const b = encryptProfile(demoConfig, id, plain);
  assert.notEqual(a, b);
  assert.equal(decryptProfile(demoConfig, id, b), plain);
});
