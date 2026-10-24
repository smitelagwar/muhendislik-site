/**
 * ASAMA_04: Minimal Üst Bar, 'Canlı Önizleme Hazır' Kaldırılması ve Tek Tema Anahtarı Testleri
 *
 * Kapsam:
 * 1. 'Canlı Önizleme Hazır' yazısı ve yeşil nabız rozeti DOM'da kesinlikle bulunmaz.
 * 2. syncStatus === 'updating' sırasında yalnız kısa süreç ('Derleniyor...') gösterilir.
 * 3. syncStatus === 'error' durumunda hata bilgisi ('Önizleme Hatası') gösterilir.
 * 4. Taslak durumu: Açılır menü/popover yoktur; başarılı yazımda yalnız sade 'Kaydedildi' gösterilir.
 * 5. Tema Anahtarı: Üst barın en sağındaki son kontroldür; modal kapatma 'X' butonu temanın solunda yer alır.
 * 6. Minimum 44px dokunma hedefi ve erişilebilirlik (role='switch', aria-label) tamdır.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BelgeStudioUnifiedHeader } from "../../src/components/belge-studio-unified-header";
import { BelgeStudioDraftStatusBadge } from "../../src/components/belge-studio-draft-controls";
import { BelgeStudioThemeToggle } from "../../src/components/belge-studio-theme-toggle";
import type { UseBelgeAutoDraftReturn } from "../../src/hooks/use-belge-auto-draft";

function createMockDraftApi(overrides: Partial<UseBelgeAutoDraftReturn> = {}): UseBelgeAutoDraftReturn {
  return {
    lifecycleState: "saved",
    storageMode: "device",
    savedAt: Date.now(),
    ageStatus: null,
    errorMessage: null,
    isSaving: false,
    isPaused: false,
    pendingDraft: null,
    setConsent: () => {},
    restoreDraft: () => {},
    ignoreDraft: () => {},
    deleteDraftAction: () => {},
    dismissRestore: () => {},
    retrySave: () => {},
    togglePause: () => {},
    markFormMutated: () => {},
    resolveConflictWithRemote: () => {},
    resolveConflictWithLocal: () => {},
    replaceAndPersist: () => {},
    ...overrides,
  };
}

describe("ASAMA_04: Minimal Header, Rozet Temizliği ve Tema Anahtarı Testleri", () => {
  it("1. 'Canlı Önizleme Hazır' yazısı ve yeşil pulse rozeti header DOM'unda kesinlikle bulunmaz", () => {
    const draftApi = createMockDraftApi();
    const html = renderToStaticMarkup(
      React.createElement(BelgeStudioUnifiedHeader, {
        title: "Şantiye Şefi Taahhütnamesi",
        draftApi,
        syncStatus: "synced",
      })
    );

    assert.equal(html.includes("Canlı Önizleme Hazır"), false);
    assert.equal(html.includes("animate-pulse bg-emerald-500"), false);
  });

  it("2. syncStatus === 'updating' iken Derleniyor... görünür, error iken Önizleme Hatası görünür", () => {
    const draftApi = createMockDraftApi();

    const updatingHtml = renderToStaticMarkup(
      React.createElement(BelgeStudioUnifiedHeader, {
        title: "Test Belgesi",
        draftApi,
        syncStatus: "updating",
      })
    );
    assert.equal(updatingHtml.includes("Derleniyor..."), true);

    const errorHtml = renderToStaticMarkup(
      React.createElement(BelgeStudioUnifiedHeader, {
        title: "Test Belgesi",
        draftApi,
        syncStatus: "error",
      })
    );
    assert.equal(errorHtml.includes("Önizleme Hatası"), true);
  });

  it("3. Taslak durumu: Kaydedildi sade metin olarak görünür, açılır menü (Taslak Cihaz/Sekme) ve diyalog bulunmaz", () => {
    const draftApi = createMockDraftApi({ lifecycleState: "saved" });
    const html = renderToStaticMarkup(
      React.createElement(BelgeStudioDraftStatusBadge, { draftApi })
    );

    assert.equal(html.includes("Kaydedildi"), true);
    assert.equal(html.includes("Taslak (Cihaz)"), false);
    assert.equal(html.includes("Taslak (Sekme)"), false);
    assert.equal(html.includes("Kayıt Duraklatıldı"), false);
    assert.equal(html.includes("Taslağı Sil"), false);
  });

  it("4. Taslak durumu: Hata durumunda 'Kaydedilemedi' ve 'Tekrar dene' sunulur", () => {
    const draftApi = createMockDraftApi({
      lifecycleState: "save-error",
      errorMessage: "Depolama kotası doldu.",
    });
    const html = renderToStaticMarkup(
      React.createElement(BelgeStudioDraftStatusBadge, { draftApi })
    );

    assert.equal(html.includes("Kaydedilemedi"), true);
    assert.equal(html.includes("Tekrar dene"), true);
  });

  it("5. Modal durumunda 'Pencereyi Kapat' (X) butonu tema anahtarının SOLUNDA yer alır", () => {
    const draftApi = createMockDraftApi();
    const html = renderToStaticMarkup(
      React.createElement(BelgeStudioUnifiedHeader, {
        title: "Modal Belge",
        isModal: true,
        onClose: () => {},
        draftApi,
        syncStatus: "synced",
      })
    );

    const closeIdx = html.indexOf('aria-label="Pencereyi Kapat"');
    const themeIdx = html.indexOf('data-testid="belge-theme-toggle"');

    assert.notEqual(closeIdx, -1, "Modal X butonu bulunmalıdır");
    assert.notEqual(themeIdx, -1, "Tema anahtarı bulunmalıdır");
    assert.equal(closeIdx < themeIdx, true, "X butonu tema anahtarının solunda olmalıdır");
  });

  it("6. Tema Anahtarı: Üst barda data-testid='belge-theme-toggle', role='switch' ve min 44px dokunma alanına sahiptir", () => {
    const html = renderToStaticMarkup(React.createElement(BelgeStudioThemeToggle));

    assert.equal(html.includes('data-testid="belge-theme-toggle"'), true);
    assert.equal(html.includes('role="switch"'), true);
    assert.equal(html.includes("min-h-[44px]"), true);
    assert.equal(html.includes("min-w-[44px]"), true);
  });
});
