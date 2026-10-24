import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BelgeStudioPreviewToolbar } from "../../src/components/belge-studio-preview-toolbar";
import { BelgeStudioActions } from "../../src/components/belge-studio-actions";
import { BELGE_STUDIO_PREVIEW_TOOLBAR_CLASS } from "../../src/lib/belge-studio-layout";

describe("ASAMA_05: Belge Stüdyosu V3 — Zoom Geometrik Merkez ve Footer Form Görünümü Sözleşmesi", () => {
  const dummyFormView: any = {
    mode: "manual",
    manualScale: 1.0,
    density: "normal",
    appliedScale: 1.0,
    fitStatus: "idle",
    onChooseScale: () => {},
    onToggleCompact: () => {},
    onFit: () => {},
    onReset: () => {},
  };

  it("1. BelgeStudioPreviewToolbar: .belge-preview-controls sınıfını ve 3 kolonlu yerleşimi (left, center, right) içerir", () => {
    const html = renderToStaticMarkup(
      React.createElement(BelgeStudioPreviewToolbar, {
        zoomLevel: 100,
        onZoomChange: () => {},
        onFit: () => {},
        pdfUrl: "https://example.com/test.pdf",
        page: { current: 1, total: 3, onChange: () => {} },
        disabled: false,
        formView: dummyFormView,
      })
    );

    assert.ok(html.includes("belge-preview-controls"), "Toolbar .belge-preview-controls sınıfına sahip olmalı");
    assert.ok(html.includes("belge-preview-left"), "Sol gezinme kolonu bulunmalı");
    assert.ok(html.includes("belge-preview-center"), "Orta kolon bulunmalı");
    assert.ok(html.includes("belge-preview-right"), "Sağ araç kolonu bulunmalı");
    assert.ok(html.includes('data-testid="belge-studio-preview-toolbar"'), "data-testid bulunmalı");
  });

  it("2. BelgeStudioPreviewToolbar: Orta grupta (.belge-preview-zoom) SADECE [− % +] yer alır; Sığdır ve Yeni sekme hariçtir", () => {
    const html = renderToStaticMarkup(
      React.createElement(BelgeStudioPreviewToolbar, {
        zoomLevel: 125,
        onZoomChange: () => {},
        onFit: () => {},
        pdfUrl: "https://example.com/test.pdf",
        disabled: false,
      })
    );

    // Zoom grubu içeriğini izole et
    const zoomGroupMatch = html.match(/class="[^"]*belge-preview-zoom[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    assert.ok(zoomGroupMatch, "belge-preview-zoom elementi bulunmalı");
    const zoomHtml = zoomGroupMatch[1];

    assert.ok(zoomHtml.includes('aria-label="Uzaklaştır"'), "Uzaklaştır düğmesi zoom grubu içinde olmalı");
    assert.ok(zoomHtml.includes('aria-label="Yakınlaştır"'), "Yakınlaştır düğmesi zoom grubu içinde olmalı");
    assert.ok(zoomHtml.includes('data-testid="belge-studio-zoom-level"'), "Zoom seviye göstergesi zoom grubunda olmalı");
    assert.ok(zoomHtml.includes("%125"), "Zoom yüzdesi doğru yazılmalı");

    // Sığdır ve Yeni Sekme ZOOM GRUBU İÇİNDE OLMAMALIDIR
    assert.ok(!zoomHtml.includes("Sığdır"), "Sığdır zoom grubu içinde olamaz; sağ kolonda olmalı");
    assert.ok(!zoomHtml.includes("Yeni sekmede aç"), "Yeni sekme zoom grubu içinde olamaz; sağ kolonda olmalı");

    // Ancak sağ kolonda mevcut olmalıdır
    assert.ok(html.includes("Sığdır"), "Sığdır araç çubuğunun sağ kolonunda yer almalı");
    assert.ok(html.includes("belge-studio-more-view-options"), "Mobilde more menüsü tetikleyicisi mevcut olmalı");
  });

  it("3. BelgeStudioPreviewToolbar: Tema kontrolü veya Form Görünümü menüsü preview toolbar'da ASLA yer almaz", () => {
    const html = renderToStaticMarkup(
      React.createElement(BelgeStudioPreviewToolbar, {
        zoomLevel: 100,
        onZoomChange: () => {},
        onFit: () => {},
        pdfUrl: "https://example.com/test.pdf",
        disabled: false,
        formView: dummyFormView,
      })
    );

    assert.ok(!html.includes('data-testid="belge-theme-toggle"'), "Tema anahtarı preview toolbar'da olamaz (Header'a taşındı)");
    assert.ok(!html.includes('data-testid="belge-studio-form-view-trigger"'), "Form Görünümü trigger preview toolbar'da olamaz (Footer'a taşındı)");
    assert.ok(!html.includes("belge-theme-switch"), "Eski preview-theme-switch sınıfı toolbar'da yer alamaz");
  });

  it("4. BelgeStudioActions (Masaüstü): Form Görünümü ve Boş form indir hemen yan yana ve aralıksızdır", () => {
    const html = renderToStaticMarkup(
      React.createElement(BelgeStudioActions, {
        activeTab: "form",
        onToggleTab: () => {},
        onReset: () => {},
        onClear: () => {},
        onUndo: () => {},
        canUndo: true,
        onPrint: () => {},
        onShare: () => {},
        onDownload: () => {},
        ready: true,
        downloading: false,
        documentId: "santiye-sefi-taahhutnamesi",
        templateFilename: "test.pdf",
        formView: dummyFormView,
      })
    );

    const desktopMatch = html.match(/data-testid="belge-studio-desktop-actions"[\s\S]*?<\/footer>/);
    assert.ok(desktopMatch, "belge-studio-desktop-actions elementi bulunmalı");
    const desktopHtml = desktopMatch[0];

    // Form Görünümü ve Boş form indir'in index'lerini kontrol et
    const formViewIdx = desktopHtml.indexOf('data-testid="belge-studio-form-view-trigger"');
    const blankDownloadIdx = desktopHtml.indexOf('data-testid="belge-desktop-blank-download-btn"');
    const printIdx = desktopHtml.indexOf("Yazdır");
    const downloadIdx = desktopHtml.indexOf("PDF İndir");

    assert.ok(formViewIdx !== -1, "Masaüstü aksiyonlarında Form Görünümü menüsü bulunmalı");
    assert.ok(blankDownloadIdx !== -1, "Masaüstü aksiyonlarında Boş form indir butonu bulunmalı");
    assert.ok(formViewIdx < blankDownloadIdx, "Form Görünümü, Boş form indir'in HEMEN SOLUNDA yer almalı");
    assert.ok(blankDownloadIdx < printIdx, "Boş form indir, Yazdır'ın solunda yer almalı");
    assert.ok(printIdx < downloadIdx, "Yazdır, PDF İndir'in solunda yer almalı");

    // Form Görünümü ile Boş form indir arasında başka buton olmadığını doğrula
    const betweenFormAndBlank = desktopHtml.slice(formViewIdx, blankDownloadIdx);
    assert.ok(!betweenFormAndBlank.includes("Yazdır"), "Form Görünümü ile Boş form arasına Yazdır giremez");
    assert.ok(!betweenFormAndBlank.includes("Paylaş"), "Form Görünümü ile Boş form arasına Paylaş giremez");
    assert.ok(!betweenFormAndBlank.includes("PDF İndir"), "Form Görünümü ile Boş form arasına PDF İndir giremez");
  });

  it("5. BelgeStudioActions (Mobil): Tek satırda [⋯] [Form Görünümü 44px] [Boş form 44px] [Düzenle/Önizle] [PDF İndir] yer alır", () => {
    const html = renderToStaticMarkup(
      React.createElement(BelgeStudioActions, {
        activeTab: "preview",
        onToggleTab: () => {},
        onReset: () => {},
        onClear: () => {},
        onUndo: () => {},
        canUndo: false,
        onPrint: () => {},
        onShare: () => {},
        onDownload: () => {},
        ready: true,
        downloading: false,
        documentId: "santiye-sefi-taahhutnamesi",
        templateFilename: "test.pdf",
        formView: dummyFormView,
      })
    );

    const mobileMatch = html.match(/data-testid="belge-studio-mobile-actions"[\s\S]*?data-testid="belge-studio-desktop-actions"/);
    assert.ok(mobileMatch, "belge-studio-mobile-actions elementi bulunmalı");
    const mobileHtml = mobileMatch[0];

    // Mobil barda 44x44px iki ikonun varlığı
    assert.ok(mobileHtml.includes('aria-label="Diğer belge işlemleri"'), "Mobil ⋯ butonu mevcut olmalı");
    assert.ok(mobileHtml.includes('aria-label="Form görünüm seçenekleri"'), "Mobil Form Görünümü ikonu mevcut olmalı");
    assert.ok(mobileHtml.includes('data-testid="belge-mobile-blank-download-btn"'), "Mobil Boş form indir ikonu mevcut olmalı");
    assert.ok(mobileHtml.includes('aria-label="Boş form indir"'), "Mobil Boş form indir ikonu aria-label taşımalı");
    assert.ok(mobileHtml.includes("Formu Düzenle"), "Mobilde önizlemede iken 'Formu Düzenle' butonu olmalı");
    assert.ok(mobileHtml.includes("PDF İndir"), "Mobilde 'PDF İndir' butonu olmalı");

    // Sıralama doğrulaması
    const moreIdx = mobileHtml.indexOf('aria-label="Diğer belge işlemleri"');
    const formViewIdx = mobileHtml.indexOf('aria-label="Form görünüm seçenekleri"');
    const blankIdx = mobileHtml.indexOf('data-testid="belge-mobile-blank-download-btn"');
    const toggleIdx = mobileHtml.indexOf("Formu Düzenle");
    const downloadIdx = mobileHtml.indexOf("PDF İndir");

    assert.ok(moreIdx < formViewIdx, "⋯, Form Görünümü'nden önce gelmeli");
    assert.ok(formViewIdx < blankIdx, "Form Görünümü, Boş form indir'den önce gelmeli");
    assert.ok(blankIdx < toggleIdx, "Boş form indir, Tab geçişinden önce gelmeli");
    assert.ok(toggleIdx < downloadIdx, "Tab geçişi, PDF İndir'den önce gelmeli");
  });

  it("6. Layout Kontratı: BELGE_STUDIO_PREVIEW_TOOLBAR_CLASS 'grid' ve 'w-full' sınıflarını barındırır", () => {
    assert.ok(BELGE_STUDIO_PREVIEW_TOOLBAR_CLASS.includes("grid"), "Toolbar sınıfı CSS Grid kullanmalı");
    assert.ok(BELGE_STUDIO_PREVIEW_TOOLBAR_CLASS.includes("w-full"), "Toolbar tam genişlikte (w-full) olmalı");
    assert.ok(BELGE_STUDIO_PREVIEW_TOOLBAR_CLASS.includes("belge-preview-controls"), "Toolbar .belge-preview-controls sınıfını içermeli");
  });
});
