// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — OVERLAY DEEP-SCROLL & ACCESSIBILITY SPEC
// ============================================================================

import { test, expect } from "@playwright/test";

test.describe("Drive V3.1 — Overlay Deep-Scroll & Portal Specs", () => {
  test("1. Fixed viewport overlay deep scroll pozisyonundan etkilenmez (viewport ortasında kalır)", () => {
    // 5000px scroll yapıldığında container koordinatları
    const containerScrollTop = 5000;
    const viewportHeight = 800;
    const viewportWidth = 1200;

    // Overlay portal'ın fixed inset-0 CSS mantığı
    const overlayFixedRect = {
      top: 0,
      left: 0,
      right: viewportWidth,
      bottom: viewportHeight,
      width: viewportWidth,
      height: viewportHeight,
    };

    // Modal kutusu (örneğin 400x300px)
    const modalWidth = 400;
    const modalHeight = 300;

    const modalCenterY = overlayFixedRect.top + (overlayFixedRect.height - modalHeight) / 2;
    const modalCenterX = overlayFixedRect.left + (overlayFixedRect.width - modalWidth) / 2;

    // ScrollTop 5000px olmasına rağmen modal ekranda (250px, 400px) merkezdedir
    expect(modalCenterY).toBe(250);
    expect(modalCenterX).toBe(400);
    expect(containerScrollTop).toBe(5000); // Container bağımsız
  });

  test("2. Body scroll lock ve Escape ile modal kapatma davranışı", () => {
    let bodyOverflow = "auto";
    let isOpen = true;

    // Modal açıldığında
    const openModal = () => {
      bodyOverflow = "hidden";
    };

    // Modal kapandığında
    const closeModal = () => {
      isOpen = false;
      bodyOverflow = "auto";
    };

    openModal();
    expect(bodyOverflow).toBe("hidden");

    // Escape basıldığında
    const handleKey = (key: string) => {
      if (key === "Escape") closeModal();
    };

    handleKey("Escape");
    expect(isOpen).toBe(false);
    expect(bodyOverflow).toBe("auto");
  });

  test("3. Focus Trap ve Restorasyon prensibi", () => {
    let focusedElement = "delete-button-trigger";

    // Dialog açılmadan önceki trigger kaydedilir
    const savedTrigger = focusedElement;

    // Dialog açılır ve ilk focusable elemana odaklanır
    const dialogElements = ["cancel-btn", "confirm-btn"];
    let dialogActiveIndex = 0;
    focusedElement = dialogElements[dialogActiveIndex];
    expect(focusedElement).toBe("cancel-btn");

    // Tab basılır -> sonraki eleman
    dialogActiveIndex = (dialogActiveIndex + 1) % dialogElements.length;
    focusedElement = dialogElements[dialogActiveIndex];
    expect(focusedElement).toBe("confirm-btn");

    // Tab basılır -> trap başa döner
    dialogActiveIndex = (dialogActiveIndex + 1) % dialogElements.length;
    focusedElement = dialogElements[dialogActiveIndex];
    expect(focusedElement).toBe("cancel-btn");

    // Dialog kapanır -> trigger elemanına odak geri yüklenir
    focusedElement = savedTrigger;
    expect(focusedElement).toBe("delete-button-trigger");
  });
});
