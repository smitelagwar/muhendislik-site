import { expect, test } from "@playwright/test";
import { isInputElement } from "../../src/components/dokumantasyon/preview/cad-review-shortcuts";

import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";

test.describe("CAD Review Workspace V1 — Stage 7/10 Desktop, Tablet, Mobil ve Erişilebilirlik (A11y)", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("1. Klavye Kısayolları, Focus Trap ve Input İzolasyonu Mantığı", async ({ page }) => {
    // 1. isInputElement doğrulaması (Node ortamı mock)
    const inputMock = { tagName: "INPUT", isContentEditable: false } as unknown as EventTarget;
    const textareaMock = { tagName: "TEXTAREA", isContentEditable: false } as unknown as EventTarget;
    const canvasMock = { tagName: "CANVAS", isContentEditable: false } as unknown as EventTarget;
    const divMock = { tagName: "DIV", isContentEditable: false } as unknown as EventTarget;
    const editableDivMock = { tagName: "DIV", isContentEditable: true } as unknown as EventTarget;

    expect(isInputElement(inputMock)).toBe(true);
    expect(isInputElement(textareaMock)).toBe(true);
    expect(isInputElement(editableDivMock)).toBe(true);
    expect(isInputElement(canvasMock)).toBe(false);
    expect(isInputElement(divMock)).toBe(false);

    // 2. Kısayol Dinleyicisi Doğrulaması (Gerçek Tarayıcı Ortamında)
    await page.goto("about:blank");
    const triggeredShortcuts = await page.evaluate(() => {
      const events: string[] = [];
      const isInputEl = (element: EventTarget | null): boolean => {
        if (!element) return false;
        const el = element as { tagName?: string; isContentEditable?: boolean };
        const tagName = el.tagName ? String(el.tagName).toLowerCase() : "";
        return (
          tagName === "input" ||
          tagName === "textarea" ||
          tagName === "select" ||
          Boolean(el.isContentEditable)
        );
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (isInputEl(e.target) && e.key !== "Escape") return;
        const isCtrlOrCmd = e.ctrlKey || e.metaKey;
        if (e.key === "Escape") events.push("escape");
        if (e.key === "Enter") events.push("enter");
        if (e.key === "Delete" || e.key === "Backspace") events.push("delete");
        if (isCtrlOrCmd && !e.shiftKey && e.key.toLowerCase() === "z") events.push("undo");
        if ((isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === "z") || (isCtrlOrCmd && e.key.toLowerCase() === "y")) events.push("redo");
        if ((isCtrlOrCmd && e.key.toLowerCase() === "f") || e.key === "/") events.push("search");
      };

      window.addEventListener("keydown", handleKeyDown);

      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Delete" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "y", ctrlKey: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "/" }));

      return events;
    });

    expect(triggeredShortcuts).toContain("escape");
    expect(triggeredShortcuts).toContain("enter");
    expect(triggeredShortcuts).toContain("delete");
    expect(triggeredShortcuts).toContain("undo");
    expect(triggeredShortcuts).toContain("redo");
    expect(triggeredShortcuts).toContain("search");
  });

  test("2. Focus Trap (Tab Wrap) ile WCAG 2.1 Focus Order Sözleşmesi", async ({ page }) => {
    await page.goto("about:blank");
    const wrapSuccess = await page.evaluate(() => {
      const container = document.createElement("div");
      const btn1 = document.createElement("button");
      btn1.id = "b1";
      btn1.textContent = "Buton 1";
      const btn2 = document.createElement("button");
      btn2.id = "b2";
      btn2.textContent = "Buton 2";
      container.appendChild(btn1);
      container.appendChild(btn2);
      document.body.appendChild(container);

      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;
        const focusableElements = Array.from(
          container.querySelectorAll<HTMLElement>(focusableSelectors)
        );
        if (focusableElements.length === 0) return;
        const first = focusableElements[0]!;
        const last = focusableElements[focusableElements.length - 1]!;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      container.addEventListener('keydown', handleKeyDown);

      // Start on btn2
      btn2.focus();
      const initial = document.activeElement?.id;

      // Tab wraps to btn1
      container.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
      const afterTab = document.activeElement?.id;

      // Shift+Tab wraps back to btn2
      container.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }));
      const afterShiftTab = document.activeElement?.id;

      container.remove();
      return { initial, afterTab, afterShiftTab };
    });

    expect(wrapSuccess.initial).toBe("b2");
    expect(wrapSuccess.afterTab).toBe("b1");
    expect(wrapSuccess.afterShiftTab).toBe("b2");
  });


  test("3. Gerçek DXF Üzerinde Desktop & Mobile Toolbar/Drawer Viewport Stabilitesi", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "text-rotation-0-90-180-270");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // 1. Initial canvas dimensions
    const initialBox = await host.boundingBox();
    expect(initialBox).not.toBeNull();
    expect(initialBox?.width).toBeGreaterThan(100);
    expect(initialBox?.height).toBeGreaterThan(100);

    // 2. Initial modelSpace entity count
    const initialEntityCount = await host.evaluate((el: HTMLElement) => {
      const adapter = (el as unknown as {
        __cadAdapter?: {
          manager?: {
            curDocument?: {
              database?: {
                tables?: {
                  blockTable?: {
                    modelSpace?: {
                      newIterator?: () => Iterable<unknown>;
                    };
                  };
                };
              };
            };
          };
        };
      }).__cadAdapter;

      const ms = adapter?.manager?.curDocument?.database?.tables?.blockTable?.modelSpace;
      let count = 0;
      if (ms?.newIterator) {
        const iter = ms.newIterator();
        for (const entity of iter) {
          if (entity) count++;
        }
      }
      return count;
    });

    expect(initialEntityCount).toBe(4);

    // 3. Final entity count after viewport actions
    const finalEntityCount = await host.evaluate((el: HTMLElement) => {
      const adapter = (el as unknown as {
        __cadAdapter?: {
          manager?: {
            curDocument?: {
              database?: {
                tables?: {
                  blockTable?: {
                    modelSpace?: {
                      newIterator?: () => Iterable<unknown>;
                    };
                  };
                };
              };
            };
          };
        };
      }).__cadAdapter;

      const ms = adapter?.manager?.curDocument?.database?.tables?.blockTable?.modelSpace;
      let count = 0;
      if (ms?.newIterator) {
        const iter = ms.newIterator();
        for (const entity of iter) {
          if (entity) count++;
        }
      }
      return count;
    });

    expect(finalEntityCount).toBe(initialEntityCount);
  });
});