"use client";

import { useEffect, useRef, useState } from "react";

interface HomePhilosopherHologramProps {
  /** Ana hero kapsayıcısında fare hareketini izlemek için CSS seçicisi */
  hostSelector?: string;
}

interface ParticleCloud {
  count: number;
  hx: Float32Array;
  hy: Float32Array;
  hz: Float32Array;
  ox: Float32Array;
  oy: Float32Array;
  oz: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  vz: Float32Array;
  size: Float32Array;
  seed: Float32Array;
  baseBucket: Uint8Array;
  projX: Float32Array;
  projY: Float32Array;
  projS: Float32Array;
  nextIdx: Int32Array;
  bustWidth: number;
  bustHeight: number;
}

// Klasik mermer büstün derin kızıl arka planda oluşturduğu 8 kademeli halftone ton paleti
// + fare ile hafif dağılan parçacıklar için 2 havadar hologram tozu katmanı
const PARTICLE_PALETTE = [
  "rgba(232, 134, 106, 0.30)", // 0: en derin gölge oyukları
  "rgba(242, 162, 134, 0.46)", // 1: koyu geçiş
  "rgba(248, 188, 162, 0.62)", // 2: düşük orta ton
  "rgba(252, 210, 188, 0.76)", // 3: orta ton
  "rgba(255, 228, 210, 0.86)", // 4: aydınlık mermer
  "rgba(255, 240, 228, 0.93)", // 5: yüksek vurgu
  "rgba(255, 248, 240, 0.97)", // 6: parlak sırtlar
  "rgba(255, 253, 248, 1.0)",  // 7: tepe ışığı
  "rgba(255, 232, 202, 0.62)", // 8: hafifçe dağılan parçacık
  "rgba(255, 206, 162, 0.34)", // 9: uzağa savrulan ince toz
] as const;

const BUCKET_COUNT = PARTICLE_PALETTE.length;
const SOURCE_IMAGE_PATH = "/home/philosopher-bust-source.webp";

function hash2D(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

/**
 * Tek renkli klasik filozof büstü görüntüsünü düzenli halftone nokta matrisine
 * ve iki geçişli kenar-uzaklık dönüşümüyle gerçek 3B rölyef bulutuna çevirir.
 */
function buildParticleCloud(
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
): ParticleCloud {
  const isCompact = canvasWidth < 600;
  const isMedium = canvasWidth >= 600 && canvasWidth < 1024;
  const cols = isCompact ? 76 : isMedium ? 102 : 128;
  const aspect = image.naturalHeight > 0 ? image.naturalHeight / image.naturalWidth : 1.207;
  const rows = Math.round(cols * aspect);

  // Büst ölçeği: dikey anıtsal portre; yanlardaki tipografiye temiz nefes alanı bırakır
  const maxBustH = isCompact ? canvasHeight * 0.96 : canvasHeight * 0.93;
  const maxBustW = isCompact ? canvasWidth * 0.84 : Math.min(canvasWidth * 0.41, 560);
  let bustW = maxBustH / aspect;
  let bustH = maxBustH;
  if (bustW > maxBustW) {
    bustW = maxBustW;
    bustH = bustW * aspect;
  }

  const offscreen = document.createElement("canvas");
  offscreen.width = cols;
  offscreen.height = rows;
  const octx = offscreen.getContext("2d", { willReadFrequently: true });
  if (!octx) {
    return createEmptyCloud(bustW, bustH);
  }

  octx.clearRect(0, 0, cols, rows);
  octx.drawImage(image, 0, 0, cols, rows);
  const { data } = octx.getImageData(0, 0, cols, rows);

  const totalCells = cols * rows;
  const lumGrid = new Float32Array(totalCells);
  const distGrid = new Float32Array(totalCells);
  const INF = 1e6;

  // 1. Parlaklık ve siluet maskesi
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const idx = y * cols + x;
      const lum = data[idx * 4] / 255;
      lumGrid[idx] = lum;
      distGrid[idx] = lum >= 0.068 ? INF : 0;
    }
  }

  // 2. İki geçişli Chamfer mesafe dönüşümü (siluetten içe doğru 3B hacim kubbesi)
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const idx = y * cols + x;
      let d = distGrid[idx];
      if (d === 0) continue;
      if (x === 0 || y === 0) {
        d = Math.min(d, 1);
      } else {
        d = Math.min(d, distGrid[idx - 1] + 1);
        d = Math.min(d, distGrid[idx - cols] + 1);
        d = Math.min(d, distGrid[idx - cols - 1] + 1.414);
        if (x + 1 < cols) {
          d = Math.min(d, distGrid[idx - cols + 1] + 1.414);
        }
      }
      distGrid[idx] = d;
    }
  }

  for (let y = rows - 1; y >= 0; y -= 1) {
    for (let x = cols - 1; x >= 0; x -= 1) {
      const idx = y * cols + x;
      let d = distGrid[idx];
      if (d === 0) continue;
      // Alt omuz kesitini kenar gibi içe bükmüyoruz; doğal sütun devamlılığı korunur
      if (x === cols - 1) {
        d = Math.min(d, 1);
      } else {
        d = Math.min(d, distGrid[idx + 1] + 1);
        if (y + 1 < rows) {
          d = Math.min(d, distGrid[idx + cols] + 1);
          d = Math.min(d, distGrid[idx + cols + 1] + 1.414);
          if (x > 0) {
            d = Math.min(d, distGrid[idx + cols - 1] + 1.414);
          }
        }
      }
      distGrid[idx] = d;
    }
  }

  // Aktif nokta sayısını hesapla
  let activeCount = 0;
  for (let i = 0; i < totalCells; i += 1) {
    if (lumGrid[i] >= 0.068) activeCount += 1;
  }

  const hx = new Float32Array(activeCount);
  const hy = new Float32Array(activeCount);
  const hz = new Float32Array(activeCount);
  const ox = new Float32Array(activeCount);
  const oy = new Float32Array(activeCount);
  const oz = new Float32Array(activeCount);
  const vx = new Float32Array(activeCount);
  const vy = new Float32Array(activeCount);
  const vz = new Float32Array(activeCount);
  const size = new Float32Array(activeCount);
  const seed = new Float32Array(activeCount);
  const baseBucket = new Uint8Array(activeCount);
  const projX = new Float32Array(activeCount);
  const projY = new Float32Array(activeCount);
  const projS = new Float32Array(activeCount);
  const nextIdx = new Int32Array(activeCount);

  const cellStep = bustW / cols;
  const depthScale = bustW * 0.34;
  const maxDistNorm = cols * 0.27;
  let ptr = 0;

  for (let y = 0; y < rows; y += 1) {
    const ny = y / (rows - 1) - 0.5;
    for (let x = 0; x < cols; x += 1) {
      const idx = y * cols + x;
      const rawLum = lumGrid[idx];
      if (rawLum < 0.068) continue;

      const nx = x / (cols - 1) - 0.5;
      const normLum = Math.min(1, Math.max(0, Math.pow((rawLum - 0.055) / 0.945, 0.9)));
      const edgeDepth = Math.min(1, distGrid[idx] / maxDistNorm);
      const dome = Math.sqrt(edgeDepth);

      hx[ptr] = nx * bustW;
      hy[ptr] = ny * bustH;
      // 3B derinlik: siluet kubbesi + mermer ışık rölyefi (burun, kaş, sakal bukleleri önde)
      hz[ptr] = (dome * 0.72 + (normLum - 0.34) * 0.44 - 0.34) * depthScale;

      // Halftone kare boyutu: parlak mermer alanlarda dolgun, gölgelerde zarif mikro nokta
      size[ptr] = Math.max(0.9, cellStep * (0.25 + Math.pow(normLum, 0.76) * 0.67));
      seed[ptr] = hash2D(x, y);
      baseBucket[ptr] = Math.min(7, Math.floor(normLum * 7.99));

      ptr += 1;
    }
  }

  return {
    count: activeCount,
    hx,
    hy,
    hz,
    ox,
    oy,
    oz,
    vx,
    vy,
    vz,
    size,
    seed,
    baseBucket,
    projX,
    projY,
    projS,
    nextIdx,
    bustWidth: bustW,
    bustHeight: bustH,
  };
}

function createEmptyCloud(bustWidth: number, bustHeight: number): ParticleCloud {
  return {
    count: 0,
    hx: new Float32Array(0),
    hy: new Float32Array(0),
    hz: new Float32Array(0),
    ox: new Float32Array(0),
    oy: new Float32Array(0),
    oz: new Float32Array(0),
    vx: new Float32Array(0),
    vy: new Float32Array(0),
    vz: new Float32Array(0),
    size: new Float32Array(0),
    seed: new Float32Array(0),
    baseBucket: new Uint8Array(0),
    projX: new Float32Array(0),
    projY: new Float32Array(0),
    projS: new Float32Array(0),
    nextIdx: new Int32Array(0),
    bustWidth,
    bustHeight,
  };
}

export function HomePhilosopherHologram({
  hostSelector = '[data-testid="home-hero"]',
}: HomePhilosopherHologramProps) {
  const visualRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const visualEl = visualRef.current;
    const canvas = canvasRef.current;
    if (!visualEl || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = reducedMotionQuery.matches;

    const hostEl = (visualEl.closest(hostSelector) as HTMLElement | null) ?? visualEl;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let centerX = 0;
    let centerY = 0;
    let sourceImage: HTMLImageElement | null = null;
    let cloud: ParticleCloud | null = null;
    let rafId = 0;
    let isVisible = true;
    let isDocumentVisible = !document.hidden;
    let disposed = false;

    // İmleç ve 3B bakış paralaksı durumu
    const pointer = {
      active: false,
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      vx: 0,
      vy: 0,
      normX: 0,
      normY: 0,
    };

    // Tıklama / dokunma holografik dalga durumu
    const pulse = {
      active: false,
      x: 0,
      y: 0,
      radius: 0,
      maxRadius: 260,
      strength: 0,
    };

    let rotY = 0;
    let rotX = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let lastTime = performance.now();
    let elapsed = 0;
    let hasInteracted = false;

    const bucketHead = new Int32Array(BUCKET_COUNT);

    function syncCanvasMetrics() {
      if (!visualEl || !canvas) return;
      const rect = visualEl.getBoundingClientRect();
      const nextW = Math.max(240, Math.round(rect.width));
      const nextH = Math.max(260, Math.round(rect.height));
      if (nextW === width && nextH === height && cloud) return;

      width = nextW;
      height = nextH;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      centerX = width * 0.5;
      // Büst omuzları alt kenara zarifçe oturur (referans kompozisyondaki anıtsal duruş)
      centerY = width < 600 ? height * 0.54 : height * 0.545;

      if (sourceImage && sourceImage.complete && sourceImage.naturalWidth > 0) {
        cloud = buildParticleCloud(sourceImage, width, height);
        // Büst omuzlarının alt kenara doğal biçimde oturması için dikey hizalama
        centerY = height - cloud.bustHeight * 0.485;
        setReady(true);
        if (reducedMotion) {
          renderFrame(0, true);
        }
      }
    }

    function renderFrame(dtSeconds: number, staticOnly = false) {
      if (!ctx || !cloud || cloud.count === 0) return;

      const dt = Math.min(0.04, Math.max(0.004, dtSeconds));
      const dtFactor = dt * 60;
      if (!staticOnly) {
        elapsed += dt;
      }

      // 3B bakış açısını yumuşakça hedefe yaklaştır
      if (staticOnly) {
        rotY = 0;
        rotX = 0;
      } else {
        const idleSwayY = pointer.active ? 0 : Math.sin(elapsed * 0.55) * 0.028;
        const idleSwayX = pointer.active ? 0 : Math.cos(elapsed * 0.42) * 0.014;
        const goalY = (pointer.active ? targetRotY : 0) + idleSwayY;
        const goalX = (pointer.active ? targetRotX : 0) + idleSwayX;
        const lerp = 1 - Math.pow(0.915, dtFactor);
        rotY += (goalY - rotY) * lerp;
        rotX += (goalX - rotX) * lerp;
      }

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const {
        count,
        hx,
        hy,
        hz,
        ox,
        oy,
        oz,
        vx,
        vy,
        vz,
        size,
        seed,
        baseBucket,
        projX,
        projY,
        projS,
        nextIdx,
        bustWidth,
      } = cloud;

      const focal = Math.max(760, bustWidth * 2.25);
      // Lokalize dağılma yarıçapı: yüz genişliğinin ~%24'ü kadar zarif, yumuşak geçişli etkileşim alanı
      const hoverRadius = Math.max(78, Math.min(134, bustWidth * 0.24));
      const hoverRadiusSq = hoverRadius * hoverRadius;

      // Yay ve sönümleme sabitleri: hafifçe dağılıp ipeksi biçimde geri toplanma
      const springK = 0.068 * dtFactor;
      const damping = Math.pow(0.84, dtFactor);

      // İmleç hızını sönümle
      pointer.vx *= Math.pow(0.74, dtFactor);
      pointer.vy *= Math.pow(0.74, dtFactor);

      // Tıklama dalgasını ilerlet
      if (pulse.active && !staticOnly) {
        pulse.radius += 340 * dt;
        pulse.strength *= Math.pow(0.91, dtFactor);
        if (pulse.radius > pulse.maxRadius || pulse.strength < 0.04) {
          pulse.active = false;
        }
      }

      bucketHead.fill(-1);

      // Hafif nefes alan tarama ışığı dalgası (dinlenme halinde canlı hologram hissi)
      const shimmerWaveY = !staticOnly ? Math.sin(elapsed * 0.9) * (cloud.bustHeight * 0.55) : -9999;

      for (let i = 0; i < count; i += 1) {
        const bx = hx[i];
        const by = hy[i];
        const bz = hz[i];

        // 1. Önce ev konumunu 3B döndür (bakış paralaksı)
        const rx1 = bx * cosY + bz * sinY;
        const rz1 = -bx * sinY + bz * cosY;
        const ry2 = by * cosX - rz1 * sinX;
        const rz2 = by * sinX + rz1 * cosX;

        let curOx = ox[i];
        let curOy = oy[i];
        let curOz = oz[i];

        if (!staticOnly) {
          let curVx = vx[i];
          let curVy = vy[i];
          let curVz = vz[i];

          // Mevcut ekrandaki konum
          const baseScale = focal / (focal - (rz2 + curOz));
          const screenX = centerX + (rx1 + curOx) * baseScale;
          const screenY = centerY + (ry2 + curOy) * baseScale;

          // 2. Fare dağılma fiziği (lokalize itme + organik toz savrulması + imleç akıntısı)
          if (pointer.active) {
            const dx = screenX - pointer.x;
            const dy = screenY - pointer.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < hoverRadiusSq) {
              const dist = Math.sqrt(distSq) || 0.001;
              const norm = 1 - dist / hoverRadius;
              const falloff = norm * norm * (0.45 + 0.55 * norm);
              const dirX = dx / dist;
              const dirY = dy / dist;

              // Parçacığa özgü organik savrulma açısı: sert boşluk yerine yumuşak hologram sisi üretir
              const pSeed = seed[i];
              const swirlAngle = pSeed * 6.283185 + elapsed * 1.45;
              const radialWeight = 0.42 + pSeed * 0.35;
              const swirlX = Math.cos(swirlAngle) * 0.72;
              const swirlY = Math.sin(swirlAngle) * 0.72;

              // Nazik, zarif itki kuvveti ("hafiften dağılma")
              const push = (1.12 + pSeed * 0.95) * falloff * dtFactor;
              curVx += (dirX * radialWeight + swirlX) * push + pointer.vx * 0.13 * falloff;
              curVy += (dirY * radialWeight + swirlY) * push + pointer.vy * 0.13 * falloff;
              curVz += (1.35 + pSeed * 1.4) * falloff * dtFactor;
            }
          }

          // 3. Tıklama holografik dalgası
          if (pulse.active) {
            const pdx = screenX - pulse.x;
            const pdy = screenY - pulse.y;
            const pDist = Math.sqrt(pdx * pdx + pdy * pdy) || 0.001;
            const ringDelta = Math.abs(pDist - pulse.radius);
            if (ringDelta < 46) {
              const ringFactor = (1 - ringDelta / 46) * pulse.strength * dtFactor;
              curVx += (pdx / pDist) * ringFactor * 2.1;
              curVy += (pdy / pDist) * ringFactor * 2.1;
              curVz += ringFactor * 3.1;
            }
          }

          // 4. Kritik sönümlü yay geri dönüşü
          curVx = (curVx - curOx * springK) * damping;
          curVy = (curVy - curOy * springK) * damping;
          curVz = (curVz - curOz * springK) * damping;

          curOx += curVx * dtFactor;
          curOy += curVy * dtFactor;
          curOz += curVz * dtFactor;

          // Mikro titreşimleri sıfırla
          if (
            Math.abs(curOx) < 0.012 &&
            Math.abs(curOy) < 0.012 &&
            Math.abs(curOz) < 0.012 &&
            Math.abs(curVx) < 0.012 &&
            Math.abs(curVy) < 0.012
          ) {
            curOx = 0;
            curOy = 0;
            curOz = 0;
            curVx = 0;
            curVy = 0;
            curVz = 0;
          }

          ox[i] = curOx;
          oy[i] = curOy;
          oz[i] = curOz;
          vx[i] = curVx;
          vy[i] = curVy;
          vz[i] = curVz;
        }

        // 5. Nihai perspektif izdüşümü
        const finalZ = rz2 + curOz;
        const scale = focal / (focal - finalZ);
        const px = centerX + (rx1 + curOx) * scale;
        const py = centerY + (ry2 + curOy) * scale;

        const dispSq = curOx * curOx + curOy * curOy;
        let bucket = baseBucket[i];
        let dotSize = size[i] * scale;

        if (dispSq > 9) {
          // Dağılan noktalar hafifçe incelip havadar hologram tozuna dönüşür
          const disp = Math.sqrt(dispSq);
          const scatterRatio = Math.min(1, disp / 30);
          dotSize = Math.max(0.85, dotSize * (1 - scatterRatio * 0.28));
          bucket = disp > 14 ? 9 : 8;
        } else if (!staticOnly && Math.abs(by - shimmerWaveY) < 26 && bucket < 7) {
          // Çok zarif holografik ışık taraması
          if (seed[i] > 0.55) {
            bucket += 1;
          }
        }

        projX[i] = px - dotSize * 0.5;
        projY[i] = py - dotSize * 0.5;
        projS[i] = dotSize;

        // O(1) kovaya ekleme (sıfır çöp toplama yükü)
        nextIdx[i] = bucketHead[bucket];
        bucketHead[bucket] = i;
      }

      // 6. Tek geçişli kova bazlı çizim (kare başına en fazla 10 fillStyle değişimi)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      for (let b = 0; b < BUCKET_COUNT; b += 1) {
        let idx = bucketHead[b];
        if (idx === -1) continue;
        ctx.fillStyle = PARTICLE_PALETTE[b];
        while (idx !== -1) {
          const s = projS[idx];
          ctx.fillRect(projX[idx], projY[idx], s, s);
          idx = nextIdx[idx];
        }
      }
    }

    function tick(now: number) {
      if (disposed) return;
      rafId = 0;
      if (reducedMotion || !isVisible || !isDocumentVisible) return;

      const dt = (now - lastTime) / 1000;
      lastTime = now;
      renderFrame(dt, false);
      rafId = window.requestAnimationFrame(tick);
    }

    function ensureRunning() {
      if (disposed || reducedMotion || !isVisible || !isDocumentVisible || rafId !== 0) return;
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(tick);
    }

    function stopLoop() {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }

    function updatePointerFromClient(clientX: number, clientY: number, isMouse: boolean) {
      if (!visualEl) return;
      const bounds = visualEl.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;

      const relX = clientX - bounds.left;
      const relY = clientY - bounds.top;

      // Mevcut hero tarama çizgisi sözleşmesini koru
      if (isMouse && !reducedMotion) {
        const pctX = Math.min(94, Math.max(6, (relX / bounds.width) * 100));
        visualEl.style.setProperty("--hero-scan-x", `${pctX.toFixed(2)}%`);
      }

      if (reducedMotion) return;

      const normX = Math.max(-1, Math.min(1, (relX / bounds.width) * 2 - 1));
      const normY = Math.max(-1, Math.min(1, (relY / bounds.height) * 2 - 1));

      if (pointer.active) {
        pointer.vx = Math.max(-28, Math.min(28, relX - pointer.prevX));
        pointer.vy = Math.max(-28, Math.min(28, relY - pointer.prevY));
      } else {
        pointer.vx = 0;
        pointer.vy = 0;
      }

      pointer.prevX = relX;
      pointer.prevY = relY;
      pointer.x = relX;
      pointer.y = relY;
      pointer.normX = normX;
      pointer.normY = normY;
      pointer.active = true;

      // 3B bakış eğimi: büst imleç konumuna doğru zarifçe yönelir
      targetRotY = normX * 0.24;
      targetRotX = -normY * 0.13;

      // Çevredeki telemetri etiketlerine ince ters paralaks aktar
      hostEl.style.setProperty("--hero-tilt-x", `${(-normX * 7).toFixed(2)}px`);
      hostEl.style.setProperty("--hero-tilt-y", `${(-normY * 5).toFixed(2)}px`);

      if (!hasInteracted) {
        hasInteracted = true;
        hostEl.setAttribute("data-hologram-interacted", "true");
      }

      ensureRunning();
    }

    function handlePointerMove(event: PointerEvent) {
      updatePointerFromClient(event.clientX, event.clientY, event.pointerType === "mouse");
    }

    function handlePointerLeave() {
      pointer.active = false;
      pointer.vx = 0;
      pointer.vy = 0;
      targetRotY = 0;
      targetRotX = 0;
      visualEl?.style.setProperty("--hero-scan-x", "42%");
      hostEl.style.setProperty("--hero-tilt-x", "0px");
      hostEl.style.setProperty("--hero-tilt-y", "0px");
    }

    function handlePointerDown(event: PointerEvent) {
      if (reducedMotion || !visualEl) return;
      // Buton veya bağlantı tıklamalarında etkileşimi gölgeleme
      const target = event.target as HTMLElement | null;
      if (target?.closest("a, button, input")) return;

      const bounds = visualEl.getBoundingClientRect();
      pulse.x = event.clientX - bounds.left;
      pulse.y = event.clientY - bounds.top;
      pulse.radius = 12;
      pulse.maxRadius = Math.max(220, (cloud?.bustWidth ?? 420) * 0.72);
      pulse.strength = 1.15;
      pulse.active = true;
      updatePointerFromClient(event.clientX, event.clientY, event.pointerType === "mouse");
      ensureRunning();
    }

    function handleReducedMotionChange(event: MediaQueryListEvent) {
      reducedMotion = event.matches;
      if (reducedMotion) {
        stopLoop();
        pointer.active = false;
        pulse.active = false;
        renderFrame(0, true);
      } else {
        ensureRunning();
      }
    }

    function handleVisibilityChange() {
      isDocumentVisible = !document.hidden;
      if (!isDocumentVisible) {
        stopLoop();
      } else {
        ensureRunning();
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      syncCanvasMetrics();
    });
    resizeObserver.observe(visualEl);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisible = entries.some((entry) => entry.isIntersecting);
        if (!isVisible) {
          stopLoop();
        } else {
          ensureRunning();
        }
      },
      { threshold: 0.02 },
    );
    intersectionObserver.observe(hostEl);

    hostEl.addEventListener("pointermove", handlePointerMove, { passive: true });
    hostEl.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    hostEl.addEventListener("pointerdown", handlePointerDown, { passive: true });
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Kaynak klasik mermer büst görselini yükle
    const img = new window.Image();
    img.decoding = "async";
    img.src = SOURCE_IMAGE_PATH;
    img.onload = () => {
      if (disposed) return;
      sourceImage = img;
      syncCanvasMetrics();
      if (!reducedMotion) {
        ensureRunning();
      } else {
        renderFrame(0, true);
      }
    };

    syncCanvasMetrics();

    return () => {
      disposed = true;
      stopLoop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      hostEl.removeEventListener("pointermove", handlePointerMove);
      hostEl.removeEventListener("pointerleave", handlePointerLeave);
      hostEl.removeEventListener("pointerdown", handlePointerDown);
      reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hostSelector]);

  return (
    <div
      ref={visualRef}
      data-testid="home-hero-visual"
      className="home-hero-visual relative h-full w-full overflow-hidden select-none"
      style={{ touchAction: "pan-y" }}
      aria-hidden
    >
      {/* Büst arkasında yumuşak müze galerisi ışık halesi */}
      <div className="home-hologram-halo pointer-events-none absolute inset-0" aria-hidden />

      {/* Azaltılmış harekette gizlenen çok ince holografik kalibrasyon çizgisi */}
      <div className="home-hero-scan-line pointer-events-none absolute inset-y-0" aria-hidden />

      {/* Etkileşimli 3B halftone nokta-matrisi filozof heykel tuvali */}
      <canvas
        ref={canvasRef}
        data-testid="home-philosopher-canvas"
        className={`relative block h-full w-full transition-opacity duration-500 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
