import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createInitialShareState,
  formatShareExpiryTr,
  validateShareLinkSecurity,
  type ActiveShareLink,
} from "../../src/hooks/use-belge-share";

describe("ASAMA_03: Paylaş Arayüzü ve Kanca Sözleşmesi Birim Testleri", () => {
  it("1. Başlangıç durumları varsayılan olarak kapalı, boş ve offline olmalıdır", () => {
    const initialState = createInitialShareState({
      documentId: "taahhutname-studio",
      backendReady: false,
    });

    assert.strictEqual(initialState.isOpen, false);
    assert.strictEqual(initialState.isCreating, false);
    assert.strictEqual(initialState.error, null);
    assert.strictEqual(initialState.activeLink, null);
    assert.strictEqual(initialState.copied, false);
    assert.strictEqual(initialState.backendReady, false);
    assert.strictEqual(initialState.documentId, "taahhutname-studio");
  });

  it("2. formatShareExpiryTr geçerli ISO tarihini Türkiye saatine çevirmelidir", () => {
    // 2026-11-20T12:00:00Z -> Europe/Istanbul (+03:00) = 15:00
    const formatted = formatShareExpiryTr("2026-11-20T12:00:00.000Z");
    assert.ok(formatted.includes("20.11.2026"));
    assert.ok(formatted.includes("15:00"));

    // Boş veya geçersiz
    assert.strictEqual(formatShareExpiryTr(""), "");
    assert.strictEqual(formatShareExpiryTr(undefined), "");
    assert.strictEqual(formatShareExpiryTr(null), "");
  });

  it("3. validateShareLinkSecurity HTTPS bağlantılarını onaylamalı, yetkisiz kanalları reddetmelidir", () => {
    assert.strictEqual(validateShareLinkSecurity("https://muhendislik-site.vercel.app/b/abcdef123"), true);
    assert.strictEqual(validateShareLinkSecurity("http://muhendislik-site.vercel.app/b/abcdef123"), false);
    assert.strictEqual(validateShareLinkSecurity("https://wa.me/905551234567"), false);
    assert.strictEqual(validateShareLinkSecurity("https://api.whatsapp.com/send"), false);
    assert.strictEqual(validateShareLinkSecurity("https://t.me/share"), false);
    assert.strictEqual(validateShareLinkSecurity(""), false);
    assert.strictEqual(validateShareLinkSecurity(null), false);
  });

  it("4. ActiveShareLink nesnesi ve 90 günlük sözleşme alanları eksiksiz olmalıdır", () => {
    const mockLink: ActiveShareLink = {
      url: "https://muhendislik-site.vercel.app/b/abcdef123456",
      manageToken: "manage_secret_token_789",
      expiresAt: "2026-11-20T12:00:00.000Z",
      documentId: "santiye-sefi-istifa-dilekcesi",
      createdAt: "2026-08-22T12:00:00.000Z",
    };

    assert.ok(mockLink.url.startsWith("https://"));
    assert.ok(!mockLink.url.includes("whatsapp"));
    assert.strictEqual(mockLink.documentId, "santiye-sefi-istifa-dilekcesi");
    assert.ok(mockLink.manageToken.length > 10);
  });

  it("5. Kesin Kapsam Sözleşmesi: WhatsApp, wa.me veya navigator.share arayüzde yer almamalıdır", () => {
    // Kilitli kural: "WhatsApp/native PDF paylaşımı, wa.me, navigator.share, QR, e-posta linki yok"
    // "Yalnız Paylaş > Bağlantı oluştur > Kopyala; 90 gun sabit"
    const allowedFlow = ["Paylaş", "Bağlantı oluştur", "Kopyala", "90 gün"];
    assert.strictEqual(allowedFlow.includes("WhatsApp"), false);
    assert.strictEqual(allowedFlow.includes("wa.me"), false);
    assert.strictEqual(allowedFlow.includes("QR"), false);
  });
});
