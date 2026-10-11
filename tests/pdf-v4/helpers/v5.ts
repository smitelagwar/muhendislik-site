import type { Page } from "@playwright/test";
import { SCROLL } from "./viewer";

interface V5EngineView {
  getCurrentPage(): number;
  getScale(): number;
  getRotation(): number;
  governor: { sharp: { budget: number } };
  viewRectInPage(page1: number): { x: number; y: number; w: number; h: number } | null;
}

export interface V5State {
  cur: number; scale: number; rot: number; scrollTop: number; scrollLeft: number;
  sharpInView: number; blankInView: number; // blankInView: görünürde width===0 olan keskin tuval
  sharpBudget: number; viewRectP1: { x: number; y: number; w: number; h: number } | null;
}
/** Motor + DOM anlık görüntüsü. `window.__pdfEngine` (pdfjs-studio.tsx) kullanılır. */
export async function v5State(page: Page): Promise<V5State> {
  return page.evaluate((SEL) => {
    const sc = document.querySelector(SEL) as HTMLElement;
    const vr = sc.getBoundingClientRect();
    const eng = (window as unknown as { __pdfEngine: V5EngineView }).__pdfEngine;
    const inView = [...sc.querySelectorAll<HTMLCanvasElement>('canvas[data-layer="sharp"]')].filter((c) => {
      const r = c.getBoundingClientRect();
      return r.bottom > vr.top && r.top < vr.bottom && r.right > vr.left && r.left < vr.right;
    });
    return {
      cur: eng.getCurrentPage(), scale: eng.getScale(), rot: eng.getRotation(),
      scrollTop: Math.round(sc.scrollTop), scrollLeft: Math.round(sc.scrollLeft),
      sharpInView: inView.length, blankInView: inView.filter((c) => c.width === 0).length,
      sharpBudget: eng.governor.sharp.budget, viewRectP1: eng.viewRectInPage(1),
    };
  }, SCROLL);
}
/** Konsol hatalarını toplar; testin sonunda `errs` içinde "Maximum update depth" OLMAMALI. */
export function collectErrors(page: Page): string[] {
  const errs: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  return errs;
}
