import * as THREE from "three";

export interface BustPlacementRect {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

/**
 * Klasik mermer büst görselini en-boy oranını koruyarak kare hedef tuvalin
 * alt kenarına oturtur; saç tepesi üzerinde arama çubuğu için ferah boşluk bırakır.
 */
export function computeBustPlacementRect(
  srcWidth: number,
  srcHeight: number,
  targetSize: number,
  verticalFill: number = 0.965,
): BustPlacementRect {
  const safeW = Math.max(1, srcWidth);
  const safeH = Math.max(1, srcHeight);
  const aspect = safeW / safeH;

  let dh = targetSize * verticalFill;
  let dw = dh * aspect;

  if (dw > targetSize * 0.98) {
    dw = targetSize * 0.98;
    dh = dw / aspect;
  }

  const dx = (targetSize - dw) * 0.5;
  const dy = targetSize - dh;
  return { dx, dy, dw, dh };
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * Klasik mermer filozof büstü için saf fotografik halftone ön işleme hattı:
 * 1. Dış siyah stüdyo arka planını 4-komşulu BFS flood-fill ile ayırır (göz çukuru,
 *    çene altı ve derin toga kıvrımları alpha=1 olarak tamamen korunur).
 * 2. Çok ölçekli kenar-duyarlı keskinleştirme (r=1 ve r=2) ile saç bukleleri, göz
 *    kapakları, burun köprüsü, sakal ve toga katlarını netleştirir.
 * 3. Müze chiaroscuro ton eğrisi ile koyu/kızıl ve açık/beyaz gravür modlarına
 *    yüksek dinamik aralık hazırlar.
 */
export function processBustImageBuffer(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const count = width * height;
  const out = new Uint8ClampedArray(count * 4);
  const rawLum = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const off = i * 4;
    const a = rgba[off + 3] / 255;
    rawLum[i] =
      ((0.2126 * rgba[off] + 0.7152 * rgba[off + 1] + 0.0722 * rgba[off + 2]) / 255) * a;
  }

  // 1) Dört kenardan dış arka plan flood-fill
  const exterior = new Uint8Array(count);
  const queue = new Int32Array(count);
  let head = 0;
  let tail = 0;
  const bgThreshold = 0.048;

  const enqueueIfBg = (idx: number) => {
    if (exterior[idx] === 0 && rawLum[idx] <= bgThreshold) {
      exterior[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < width; x++) {
    enqueueIfBg(x);
    enqueueIfBg((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y++) {
    enqueueIfBg(y * width);
    enqueueIfBg(y * width + (width - 1));
  }

  while (head < tail) {
    const idx = queue[head++];
    const x = idx % width;
    const y = (idx - x) / width;
    if (x > 0) enqueueIfBg(idx - 1);
    if (x < width - 1) enqueueIfBg(idx + 1);
    if (y > 0) enqueueIfBg(idx - width);
    if (y < height - 1) enqueueIfBg(idx + width);
  }

  // Yumuşak 1 piksellik siluet alfa maskesi
  const alphaMask = new Float32Array(count);
  for (let y = 0; y < height; y++) {
    const yOff = y * width;
    for (let x = 0; x < width; x++) {
      const idx = yOff + x;
      if (exterior[idx] === 1) {
        alphaMask[idx] = 0;
        continue;
      }
      let extNeighbors = 0;
      if (x > 0 && exterior[idx - 1] === 1) extNeighbors++;
      if (x < width - 1 && exterior[idx + 1] === 1) extNeighbors++;
      if (y > 0 && exterior[idx - width] === 1) extNeighbors++;
      if (y < height - 1 && exterior[idx + width] === 1) extNeighbors++;

      if (extNeighbors > 0) {
        alphaMask[idx] = clamp01((rawLum[idx] - 0.025) / 0.14);
      } else {
        alphaMask[idx] = 1.0;
      }
    }
  }

  // 2) İç bölgeye maskeli ayrılabilir bulanıklaştırma geçişleri
  const separableBlur = (src: Float32Array, radius: number): Float32Array => {
    const tmp = new Float32Array(count);
    const dst = new Float32Array(count);

    for (let y = 0; y < height; y++) {
      const yOff = y * width;
      for (let x = 0; x < width; x++) {
        const idx = yOff + x;
        if (exterior[idx] === 1) continue;
        let sum = 0;
        let wSum = 0;
        const x0 = Math.max(0, x - radius);
        const x1 = Math.min(width - 1, x + radius);
        for (let sx = x0; sx <= x1; sx++) {
          const sIdx = yOff + sx;
          if (exterior[sIdx] === 1) continue;
          const w = radius + 1 - Math.abs(sx - x);
          sum += src[sIdx] * w;
          wSum += w;
        }
        tmp[idx] = wSum > 0 ? sum / wSum : src[idx];
      }
    }

    for (let y = 0; y < height; y++) {
      const yOff = y * width;
      const y0 = Math.max(0, y - radius);
      const y1 = Math.min(height - 1, y + radius);
      for (let x = 0; x < width; x++) {
        const idx = yOff + x;
        if (exterior[idx] === 1) continue;
        let sum = 0;
        let wSum = 0;
        for (let sy = y0; sy <= y1; sy++) {
          const sIdx = sy * width + x;
          if (exterior[sIdx] === 1) continue;
          const w = radius + 1 - Math.abs(sy - y);
          sum += tmp[sIdx] * w;
          wSum += w;
        }
        dst[idx] = wSum > 0 ? sum / wSum : tmp[idx];
      }
    }
    return dst;
  };

  const blurFine = separableBlur(rawLum, 1);
  const blurMed = separableBlur(rawLum, 2);

  // 3) Kenar-duyarlı mikro kontrast + müze chiaroscuro ton kalibrasyonu
  for (let i = 0; i < count; i++) {
    const off = i * 4;
    const a = alphaMask[i];
    if (a <= 0.001) {
      out[off] = 0;
      out[off + 1] = 0;
      out[off + 2] = 0;
      out[off + 3] = 0;
      continue;
    }

    const base = rawLum[i];
    const fineDetail = base - blurFine[i];
    const medDetail = base - blurMed[i];
    const sharpened = clamp01(base + fineDetail * 0.62 + medDetail * 0.44);

    const sCurve = sharpened * sharpened * (3 - 2 * sharpened);
    const chiaroscuro = clamp01(sharpened * 0.68 + sCurve * 0.32);

    const calibrated = clamp01(0.055 + Math.pow(chiaroscuro, 0.92) * 0.945);
    const byteVal = Math.round(calibrated * 255);

    out[off] = byteVal;
    out[off + 1] = byteVal;
    out[off + 2] = byteVal;
    out[off + 3] = Math.round(a * 255);
  }

  return out;
}

/**
 * Klasik büst fotoğrafını 768x768 çözünürlükte ön işleyerek WebGL halftone dokusu üretir.
 */
export function createEnhancedBustTexture(
  imageUrl: string,
  onReady?: () => void,
): { texture: THREE.CanvasTexture; dispose: () => void } {
  const size = 768;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  let disposed = false;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";

  img.onload = () => {
    if (disposed) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const rect = computeBustPlacementRect(
      img.naturalWidth || img.width,
      img.naturalHeight || img.height,
      size,
      0.965,
    );
    ctx.drawImage(img, rect.dx, rect.dy, rect.dw, rect.dh);

    const imgData = ctx.getImageData(0, 0, size, size);
    const processed = processBustImageBuffer(imgData.data, size, size);
    imgData.data.set(processed);
    ctx.putImageData(imgData, 0, 0);

    texture.needsUpdate = true;
    onReady?.();
  };

  img.src = imageUrl;

  return {
    texture,
    dispose: () => {
      disposed = true;
      texture.dispose();
    },
  };
}
