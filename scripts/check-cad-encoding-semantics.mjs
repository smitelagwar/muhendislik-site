#!/usr/bin/env node
import assert from "node:assert/strict";
import { detectDxfEncoding, decodeDxfBytes } from "../src/lib/dokumantasyon/dxf-encoding.ts";

console.log("[check-cad-encoding-semantics] Testing DXF encoding policy contracts...");

// 1. ANSI_1254 -> windows-1254 dönüşümü ($ACADVER eski sürüm AC1015 olduğunda)
{
  const headerText = "0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n9\n$DWGCODEPAGE\n3\nANSI_1254\n0\nENDSEC\n0\nEOF\n";
  const bytes = Buffer.from(headerText, "ascii");
  const res = detectDxfEncoding(bytes);

  assert.equal(res.encoding, "windows-1254", "ANSI_1254 için encoding windows-1254 olmalıdır");
  assert.equal(res.source, "dwg-codepage", "Kaynak dwg-codepage olmalıdır");
  assert.equal(res.isBinary, false);
}

// 2. Windows-1254 ile Türkçe byte çözme doğrulaması
{
  // "Şiir Ğ ö ç İ ı ü" karakterlerinin windows-1254 byte dizilimi:
  // Ş: 0xDE, i: 0x69, i: 0x69, r: 0x72, ' ': 0x20, Ğ: 0xD0, ' ': 0x20, ö: 0xF6, ' ': 0x20, ç: 0xE7, ' ': 0x20, İ: 0xDD, ' ': 0x20, ı: 0xFD, ' ': 0x20, ü: 0xFC
  const tr1254Bytes = new Uint8Array([0xDE, 0x69, 0x69, 0x72, 0x20, 0xD0, 0x20, 0xF6, 0x20, 0xE7, 0x20, 0xDD, 0x20, 0xFD, 0x20, 0xFC]);
  const decoded = decodeDxfBytes(tr1254Bytes, "windows-1254");
  assert.equal(decoded, "Şiir Ğ ö ç İ ı ü", "windows-1254 Türkçe baytları doğru çözümlenmelidir");
}

// 3. Modern AutoCAD (AC1021 ve üstü, örneğin AC1032) -> Her zaman UTF-8 ($DWGCODEPAGE ne olursa olsun)
{
  const headerText = "0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1032\n9\n$DWGCODEPAGE\n3\nANSI_1252\n0\nENDSEC\n0\nEOF\n";
  const bytes = Buffer.from(headerText, "utf-8");
  const res = detectDxfEncoding(bytes);

  assert.equal(res.encoding, "utf-8", "AC1032 AutoCAD 2018+ DXF dosyaları UTF-8 olarak algılanmalıdır");
  assert.equal(res.source, "acad-version", "Kaynak acad-version olmalıdır");
  assert.equal(res.acadVersion, "AC1032");
}

// 4. UTF-8 DXF ile gerçek Türkçe ve Yunanca karakter çözme doğrulaması (Hedef çizimimiz AC1032)
{
  const targetSample = "Ü(1Φ14) — DZ01 d=15 KZ01/22";
  const utf8Bytes = Buffer.from(targetSample, "utf-8");
  const decoded = decodeDxfBytes(utf8Bytes, "utf-8");
  assert.equal(decoded, targetSample, "UTF-8 Türkçe ve Yunanca Phi karakterleri tam ve kayıpsız çözülmelidir");
}

// 5. Başlıksız, geçerli UTF-8 içerik -> utf8-probe
{
  const content = "0\nSECTION\n2\nENTITIES\n0\nTEXT\n1\nTürkçe Başlık\n0\nENDSEC\n0\nEOF\n";
  const bytes = Buffer.from(content, "utf-8");
  const res = detectDxfEncoding(bytes);

  assert.equal(res.encoding, "utf-8", "Başlıksız geçerli UTF-8 dosyalar utf-8 olarak algılanmalıdır");
  assert.equal(res.source, "utf8-probe");
}

// 6. Başlıksız, GEÇERSİZ UTF-8 legacy dosya -> windows-1252 Western fallback korunmalı (keyfi değiştirilmemeli)
{
  // 0xFF ve 0xC0 geçersiz UTF-8 byte dizilimleridir
  const invalidUtf8Bytes = new Uint8Array([0x30, 0x0A, 0x54, 0x45, 0x58, 0x54, 0x0A, 0xFF, 0xFE, 0xC0, 0x00]);
  const res = detectDxfEncoding(invalidUtf8Bytes);

  assert.equal(res.encoding, "windows-1252", "Geçersiz UTF-8 legacy dosyalarda korunan fallback windows-1252 olmalıdır");
  assert.equal(res.source, "legacy-fallback");
  assert.ok(res.warnings.some((w) => w.includes("windows-1252")), "Uyarı windows-1252 fallback'ini belirtmelidir");
}

console.log("[check-cad-encoding-semantics] OK: Tüm DXF encoding testleri başarıyla geçti.");
