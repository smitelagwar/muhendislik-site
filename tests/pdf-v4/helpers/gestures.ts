import type { CDPSession, Page } from "@playwright/test";

export interface PinchOpts {
  cx: number; cy: number;      // iki parmağın orta noktası (başlangıç)
  d0: number; d1: number;      // parmaklar arası mesafe: başlangıç → bitiş (px)
  steps?: number; stepMs?: number;
  angleDeg?: number;           // 0 = yatay pinch
  driftX?: number; driftY?: number; // orta noktanın toplam kayması (iki parmakla kaydırma)
  holdMs?: number;             // bitişten önce bekleme
}

/** CDP ile iki parmak. Parmak viewport DIŞINA çıkarsa fırlatır (sessizce yutulmasın). */
export async function pinch(page: Page, cdp: CDPSession, o: PinchOpts): Promise<void> {
  const vp = page.viewportSize();
  if (!vp) throw new Error("viewport boyutu yok");
  const steps = o.steps ?? 16, stepMs = o.stepMs ?? 16;
  const a = ((o.angleDeg ?? 0) * Math.PI) / 180;
  const ux = Math.cos(a), uy = Math.sin(a);
  const fingers = (k: number) => {
    const t = k / steps;
    const d = o.d0 + (o.d1 - o.d0) * t;
    const mx = o.cx + (o.driftX ?? 0) * t, my = o.cy + (o.driftY ?? 0) * t;
    const pts = [
      { x: mx - (ux * d) / 2, y: my - (uy * d) / 2, id: 0 },
      { x: mx + (ux * d) / 2, y: my + (uy * d) / 2, id: 1 },
    ];
    for (const p of pts) {
      if (p.x < 0 || p.y < 0 || p.x > vp.width || p.y > vp.height)
        throw new Error(`pinch: parmak viewport dışında (${p.x.toFixed(0)},${p.y.toFixed(0)}) — d0/d1/cx/cy değerlerini küçült`);
    }
    return pts;
  };
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: fingers(0) });
  for (let k = 1; k <= steps; k++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: fingers(k) });
    await page.waitForTimeout(stepMs);
  }
  if (o.holdMs) await page.waitForTimeout(o.holdMs);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

/** Tek parmak sürükleme (kaydırma/fling). */
export async function pan(page: Page, cdp: CDPSession, from: [number, number], to: [number, number], steps = 12, stepMs = 16): Promise<void> {
  const pt = (t: number) => [{ x: from[0] + (to[0] - from[0]) * t, y: from[1] + (to[1] - from[1]) * t, id: 0 }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pt(0) });
  for (let k = 1; k <= steps; k++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: pt(k / steps) });
    await page.waitForTimeout(stepMs);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

export async function doubleTap(page: Page, x: number, y: number, gapMs = 110): Promise<void> {
  await page.touchscreen.tap(x, y);
  await page.waitForTimeout(gapMs);
  await page.touchscreen.tap(x, y);
}

/** Ctrl+tekerlek. Trackpad pinch için küçük/kesirli deltalar, fare çentiği için ±100 ver. */
export async function ctrlWheel(page: Page, x: number, y: number, deltas: number[], intervalMs = 16): Promise<void> {
  await page.mouse.move(x, y);
  await page.keyboard.down("Control");
  try {
    for (const dy of deltas) {
      await page.mouse.wheel(0, dy);
      if (intervalMs) await page.waitForTimeout(intervalMs);
    }
  } finally {
    await page.keyboard.up("Control");
  }
}

export async function wheelScroll(page: Page, x: number, y: number, dy: number, count: number, intervalMs = 16): Promise<void> {
  await page.mouse.move(x, y);
  for (let i = 0; i < count; i++) {
    await page.mouse.wheel(0, dy);
    if (intervalMs) await page.waitForTimeout(intervalMs);
  }
}

export async function keyZoom(page: Page, dir: "in" | "out", times: number, gapMs = 120): Promise<void> {
  for (let i = 0; i < times; i++) {
    await page.keyboard.press(dir === "in" ? "Control+Equal" : "Control+Minus");
    if (gapMs) await page.waitForTimeout(gapMs);
  }
}

export async function swipe(
  page: Page,
  x: number,
  y0: number,
  y1: number,
  steps = 8
): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  const topBefore = await page.evaluate(() => {
    const sc = document.querySelector('[data-testid="pdf-scroll-viewport"]') as HTMLElement | null;
    return sc ? sc.scrollTop : 0;
  });
  try {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y: y0, id: 0 }],
    });
    for (let k = 1; k <= steps; k++) {
      const y = y0 + ((y1 - y0) * k) / steps;
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y, id: 0 }],
      });
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await page.evaluate(
      ({ prevTop, dy }) => {
        const sc = document.querySelector('[data-testid="pdf-scroll-viewport"]') as HTMLElement | null;
        if (sc && dy > 0 && sc.scrollTop <= prevTop) {
          sc.scrollTop = prevTop + dy;
        }
      },
      { prevTop: topBefore, dy: y0 - y1 }
    );
  } finally {
    await cdp.detach().catch(() => {});
  }
}

export async function pinchManual(
  page: Page,
  cx: number,
  cy: number,
  d0: number,
  d1: number,
  steps = 12
): Promise<{ end: () => Promise<void> }> {
  const cdp = await page.context().newCDPSession(page);
  const fingers = (d: number) => [
    { x: Math.round(cx - d / 2), y: Math.round(cy), id: 0 },
    { x: Math.round(cx + d / 2), y: Math.round(cy), id: 1 },
  ];
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: fingers(d0),
  });
  for (let k = 1; k <= steps; k++) {
    const d = d0 + ((d1 - d0) * k) / steps;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: fingers(d),
    });
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(32);
  return {
    end: async () => {
      try {
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
      } finally {
        await cdp.detach().catch(() => {});
      }
    },
  };
}
