// ============================================================================
// PDF v4 — AÇILIŞ KANARYASI
// ----------------------------------------------------------------------------
// Neden: legacy pdf.js'te `ArrayBuffer.prototype.transferToFixedLength` gibi bir API yoksa PDF HATA VERMEDEN
// "çizilir" ama glifler yoktur (beyaz metin). "Sayfa rendered" kontrolü bunu yakalamaz. Kanarya, gömülü
// TrueType fontlu küçük bir PDF'i (120x48 pt, "Agy 123") ekran dışı canvas'a çizer ve koyu piksel sayar.
// Ölçüm (Chromium'dan API silerek): sağlam ortamda ~2038 koyu piksel, bozuk ortamda 0.
// Bir oturumda bir kez çalışır; sonuç belleğe alınır. Başarısızsa kullanıcıya uyarı + indir seçeneği gösterilir.
// ============================================================================
import { loadBrowserPdfJs } from "@/lib/pdfjs-client";
import { PDFJS_CMAPS, PDFJS_FONTS, PDFJS_ICCS, PDFJS_WASM } from "@/lib/pdfjs-paths";
import { getSharedPdfWorker } from "./pdfjs-loader";

export interface CanaryResult {
  ok: boolean;
  ink: number;
  error?: string;
}

const MIN_INK = 200;

// Arial subset (pdf-lib + fontkit ile üretildi, 10.4 KB).
const CANARY_B64 =
  "JVBERi0xLjcKJYGBgYEKCjEgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFsgNSAwIFIgXQovQ291bnQgMQo+PgplbmRvYmoK" +
  "CjIgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDEgMCBSCj4+CmVuZG9iagoKMyAwIG9iago8PAovUHJvZHVjZXIgPEZF" +
  "RkYwMDcwMDA2NDAwNjYwMDJEMDA2QzAwNjkwMDYyMDAyMDAwMjgwMDY4MDA3NDAwNzQwMDcwMDA3MzAwM0EwMDJGMDAyRjAwNjcw" +
  "MDY5MDA3NDAwNjgwMDc1MDA2MjAwMkUwMDYzMDA2RjAwNkQwMDJGMDA0ODAwNkYwMDcwMDA2NDAwNjkwMDZFMDA2NzAwMkYwMDcw" +
  "MDA2NDAwNjYwMDJEMDA2QzAwNjkwMDYyMDAyOT4KL01vZERhdGUgKEQ6MjAyNjEwMDUwODM0MzRaKQovQ3JlYXRvciA8RkVGRjAw" +
  "NzAwMDY0MDA2NjAwMkQwMDZDMDA2OTAwNjIwMDIwMDAyODAwNjgwMDc0MDA3NDAwNzAwMDczMDAzQTAwMkYwMDJGMDA2NzAwNjkw" +
  "MDc0MDA2ODAwNzUwMDYyMDAyRTAwNjMwMDZGMDA2RDAwMkYwMDQ4MDA2RjAwNzAwMDY0MDA2OTAwNkUwMDY3MDAyRjAwNzAwMDY0" +
  "MDA2NjAwMkQwMDZDMDA2OTAwNjIwMDI5PgovQ3JlYXRpb25EYXRlIChEOjIwMjYxMDA1MDgzNDM0WikKPj4KZW5kb2JqCgo0IDAg" +
  "b2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMAovQmFzZUZvbnQgL0FyaWFsTVQtOTc0MgovRW5jb2RpbmcgL0lkZW50" +
  "aXR5LUgKL0Rlc2NlbmRhbnRGb250cyBbIDkgMCBSIF0KL1RvVW5pY29kZSAxMCAwIFIKPj4KZW5kb2JqCgo1IDAgb2JqCjw8Ci9U" +
  "eXBlIC9QYWdlCi9QYXJlbnQgMSAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovQXJpYWxNVC03MDk4NDgwNzg5IDQgMCBSCj4+" +
  "Ci9YT2JqZWN0IDw8Cj4+Ci9FeHRHU3RhdGUgPDwKPj4KPj4KL01lZGlhQm94IFsgMCAwIDEyMCA0OCBdCi9Bbm5vdHMgWyBdCi9D" +
  "b250ZW50cyBbIDYgMCBSIF0KPj4KZW5kb2JqCgo2IDAgb2JqCjw8Ci9GaWx0ZXIgL0ZsYXRlRGVjb2RlCi9MZW5ndGggOTYKPj4K" +
  "c3RyZWFtCnicK+RyCuEyUADBonQufceizMQc3xBdcwNLCxMLA3MLSwUjM4WQNC4jE4UQHy5DsEJDBQsFQyA/l8vGwMDAEIiNgNgY" +
  "iE2A2BSIzYDY3E4hJIsrRIvLNYQrkAsApO8VuwplbmRzdHJlYW0KZW5kb2JqCgo3IDAgb2JqCjw8Ci9GaWx0ZXIgL0ZsYXRlRGVj" +
  "b2RlCi9MZW5ndGggODA3Ngo+PgpzdHJlYW0KeJyNeg18E1W2+Ll3ZjJpMmkmadqkTWgmDQ2UFAotUArdZvqJWJUCpSZIpaUUyocC" +
  "FhAVJH4gGFF47i4rrs+vdVdWnzL9AENhpSvo7rLL4q4+9627Crrsyvqzgi5+S/M/d5IUeH/f+72ZnHvPPefce88999xzzxTW3bK+" +
  "EzIgChzIXZ3tSyD5PIYwtQsJqfYfEUavWt2Rbn+OYL+pfeOaZJMYsVA6NqxTUu2xAIab19zSmeKLuwGkkmWrbluabGe9CmCt67pp" +
  "3cZk25/B+i9ds+ymVLsIwKwBYV1x4vee/+kia+VnRrdR5z79tzHjWP3WvWc++nrfxWUyGOdgM0OXB1aKVcPXQa0MX+/7+nYZUvRL" +
  "DxtmKnmMfsLfy98r+AxLxad1GSPdD5VwHOekIIMK9wEITuEjEIAKA5CLkCc8C7l8AFwAiQ8QzrJ6eHniLOOzmn6I48RTALAXXiDL" +
  "4QU4Aq+Q89hrHxyEfvg1OKEObbwJfgDbwAALkHI/zMVXQPoPSG6iH0rgKdyTp+AEyl4Pd8IA5BBX4p+wBbZyb2CvrWCBAqiGJlgN" +
  "D5JrEuthIZzi74FyuAZuhjUkmggnHko8nHgGfgoHuV8nLoIZ8qAD3xOJj4X/SvwVxmOPH8IeOEUeztiPq70eveAg9+9wCzzKtfIk" +
  "sSzxNWrgg1tRBx6uhRNkkAZx9E74gLjIJq4WR/lJQkscQykPtEIXPAoDZAqZSX3CwsS1iROQg3NsxFH3QC8cwDcOv4C3iSScTzyT" +
  "OA+5UAyzcD398HsyyA1fvGs4hBYT0EpFUIGc1fAy/ApeJ37yS7pakIRSQRVuT7wJDpgE81HbZ7HnP8gX9E58t3Cv8Q2JGshEu/wb" +
  "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" +
  "8dtjzvo+9p8bY3PmGLLjtKd/rCdLJHH6nCorMBHaYA1EYRBexyMVp5tVWfB4rKb6Ao9kyskuKywzVcuJT5PerR+vTy87al+CBSxE" +
  "VUe3mApdrtedRHaqzjZn1MkXq2b0k2LVYqHznXYZHdfJ/NVmtSJmyMzEMkfnxRMfqmaz2aBLGVj7437myIh8q/u5s9qE5zA9pxPx" +
  "5JxSi3OdFZPXAm9m6nx5jRZLEpH0s6M6W7yjj1hPWk9ZE1beaw1ZZ1s5q5Q6YFZZl1YntFgVs5nOt+Yxz7YWMK2sHqaRVWLzMzqW" +
  "ucHidb7JTeht111I+0Xr2muHsLowJF+83F1a11bqhDOfY1gbOhMauth6htUY2kjrWmhd61ZNmD/mcABZHiHOlexfhRaXChB7aRVa" +
  "3ZCdNRbx3lVZIjpZsDQUClaEguhoi25sRVdzOnOcOWWlU8unjjH4C+iUyfapZaXOKWU2hwHbgSwHY06ZHPAXGJbuM5fWrtu83ZVJ" +
  "Nmh/OX/zHx48fPvPOv/y5Msf7vnZ5k17X7h9495w3pzC0iULyrUHSOU7jxCy45Hotyu+PLnxeW7cHwaP/O7oa0dZqutDT/2YD0Ae" +
  "fZX5aZ/VlTK1Q0oh2WkkJ41YeYslGR7tGB71TetvyUxzLWlEGpFP70xmGrGkEayl9FCfpiOthPt+kBF7KK1tDqujTA4rZ+Y8uVa7" +
  "wWzIUu24r6qkWF3M56y5JcG8d/JcJzCWsApCodCQ3VkxaaK7z4rfU/HEu2q3p2Kso8W6z8SpFtVKrcrYiZNlVmBctOdYXPYx5jHS" +
  "GMtUaaplSuYem3msfWzWVTkReyQrkr3cvjxrefZthg2W22y3O27P3mqJ2XbYd2Td73jEtNd8WD5kG3B8aPrA8ZnlovyVI+HJt2e5" +
  "MjNr5vcYdN1zssweN2+ts96LHpo7sghdSwwxrXp4c6vlVqsk2+x2E3C5jqysQrvJgQ2rZLVJhWaTw2w2ZdntkmQ2sAHAI3toieeI" +
  "h+KXWWi/FS2iOuK0WTWH7KqdLrIfsVN7nNQcsJICqHebGEu3mapIE6XZEtckJSSKG1DTV2JFC9FQv1vZtNQVRBNeZKE5z6VHZpd8" +
  "4UyufKZ17VCeSx7SMXTboVCljC+L00YWpwUM1JmIAK5kW6ZcWWk81qhlYmR2XYrMh0BKnAVz4izBoBwJ4nHREyhH4t0D5RWmgvKK" +
  "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" +
  "Tj8Lrhrz96T1mY48agfzwhq4YzE/+hCqWNiAwjh8QDMEZrEKf2uC/vZOltktZYldZzLlQHV167DR3PV+XwRFaKFuSzQcHrTFrOiI" +
  "sbyxtS2IlrDF7DGlIoYHvhVjFR/oaGnDuKbISoOib3W7G1tohFmsFcGBkoIZhUwQ++u/gHZTsKdVLLxE0X+rg0lhoz6qnkRoTWkR" +
  "Uf8hsjaoUec0ZLLFk7kL9HsBN4oZTyicheZV0avcrDeeoubUtZHsP4t1dac3LNkNKZH0BYD+3lNItjddHgkXavbGuTe40bDj/x+a" +
  "HVeWCmVuZHN0cmVhbQplbmRvYmoKCjggMCBvYmoKPDwKL1R5cGUgL0ZvbnREZXNjcmlwdG9yCi9Gb250TmFtZSAvQXJpYWxNVC05" +
  "NzQyCi9GbGFncyA0Ci9Gb250QkJveCBbIC02NjQuNTUwNzgxMjUgLTMyNC43MDcwMzEyNSAyMDAwIDEwMzkuNTUwNzgxMjUgXQov" +
  "SXRhbGljQW5nbGUgMAovQXNjZW50IDkwNS4yNzM0Mzc1Ci9EZXNjZW50IC0yMTEuOTE0MDYyNQovQ2FwSGVpZ2h0IDcxNi4zMDg1" +
  "OTM3NQovWEhlaWdodCA1MTguNTU0Njg3NQovU3RlbVYgMAovRm9udEZpbGUyIDcgMCBSCj4+CmVuZG9iagoKOSAwIG9iago8PAov" +
  "VHlwZSAvRm9udAovU3VidHlwZSAvQ0lERm9udFR5cGUyCi9DSURUb0dJRE1hcCAvSWRlbnRpdHkKL0Jhc2VGb250IC9BcmlhbE1U" +
  "LTk3NDIKL0NJRFN5c3RlbUluZm8gPDwKL1JlZ2lzdHJ5IChBZG9iZSkKL09yZGVyaW5nIChJZGVudGl0eSkKL1N1cHBsZW1lbnQg" +
  "MAo+PgovRm9udERlc2NyaXB0b3IgOCAwIFIKL1cgWyAxIFsgNjY2Ljk5MjE4NzUgNTU2LjE1MjM0Mzc1IDUwMCAyNzcuODMyMDMx" +
  "MjUgNTU2LjE1MjM0Mzc1IDU1Ni4xNTIzNDM3NSA1NTYuMTUyMzQzNzUgXSBdCj4+CmVuZG9iagoKMTAgMCBvYmoKPDwKL0ZpbHRl" +
  "ciAvRmxhdGVEZWNvZGUKL0xlbmd0aCAyNTYKPj4Kc3RyZWFtCnicXZDPasQgEMbvPsUct4clm2S7oRCEsr3k0D807QMYnWSFRsWY" +
  "Q96+OoYtVFD5zcyn801x7V46owMUH97KHgOM2iiPi129RBhw0oaVFSgtw050ylk4VkRxvy0B586MFtqWARSfMb0Ev8HhWdkBH1Ls" +
  "3Sv02kxw+L72FOlX535wRhPgxDgHhWN87lW4NzEjFCQ9dirmddiOUfVX8bU5hIq4zC1Jq3BxQqIXZkLWnuLi7RgXZ2jUv3STRcMo" +
  "b8JTcckhXueSE1VElyZTTdQ8ZToTVadMj0T1rrtkqjI1mWrqYP8r9ZLmdvcpV++jRRoueUuutMH7/J11SZX2L+bggD0KZW5kc3Ry" +
  "ZWFtCmVuZG9iagoKeHJlZgowIDExCjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNiAwMDAwMCBuIAowMDAwMDAwMDc2IDAw" +
  "MDAwIG4gCjAwMDAwMDAxMjYgMDAwMDAgbiAKMDAwMDAwMDU5NiAwMDAwMCBuIAowMDAwMDAwNzM3IDAwMDAwIG4gCjAwMDAwMDA5" +
  "MjkgMDAwMDAgbiAKMDAwMDAwMTA5NyAwMDAwMCBuIAowMDAwMDA5MjQ3IDAwMDAwIG4gCjAwMDAwMDk1MTMgMDAwMDAgbiAKMDAw" +
  "MDAwOTgwNyAwMDAwMCBuIAoKdHJhaWxlcgo8PAovU2l6ZSAxMQovUm9vdCAyIDAgUgovSW5mbyAzIDAgUgo+PgoKc3RhcnR4cmVm" +
  "CjEwMTM3CiUlRU9G";

let cached: Promise<CanaryResult> | null = null;

export function runPdfCanary(): Promise<CanaryResult> {
  if (typeof window === "undefined") return Promise.resolve({ ok: true, ink: 0 });
  if (!cached) cached = doRun();
  return cached;
}

async function doRun(): Promise<CanaryResult> {
  try {
    const pdfjs = await loadBrowserPdfJs();
    if (!pdfjs) return { ok: false, ink: 0, error: "pdfjs-yok" };
    const data = Uint8Array.from(atob(CANARY_B64), (c) => c.charCodeAt(0));
    const worker = (await getSharedPdfWorker(pdfjs)) as never;
    const params: Parameters<typeof pdfjs.getDocument>[0] & { isEvalSupported?: boolean } = {
      data,
      worker,
      cMapUrl: PDFJS_CMAPS,
      cMapPacked: true,
      standardFontDataUrl: PDFJS_FONTS,
      wasmUrl: PDFJS_WASM,
      iccUrl: PDFJS_ICCS,
      isEvalSupported: false,
    };
    const task = pdfjs.getDocument(params);
    const doc = await task.promise;
    try {
      const page = await doc.getPage(1);
      const vp = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(vp.width);
      canvas.height = Math.ceil(vp.height);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return { ok: false, ink: 0, error: "canvas-2d-yok" };
      await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
      const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let ink = 0;
      for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 0 && px[i] < 100 && px[i + 1] < 100 && px[i + 2] < 100) ink++;
      canvas.width = 0;
      canvas.height = 0;
      return { ok: ink >= MIN_INK, ink };
    } finally {
      void task.destroy();
    }
  } catch (err) {
    return { ok: false, ink: 0, error: err instanceof Error ? err.message : String(err) };
  }
}
