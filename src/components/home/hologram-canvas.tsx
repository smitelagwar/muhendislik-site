"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  createHalftoneSpringField,
  DEFAULT_SCATTER_BOOST,
  HOLOGRAM_GRID_SIZE,
  type HologramAtmosphere,
  type HologramSubject,
  stepHalftoneSpringField,
  triggerSpringShockwave,
} from "@/lib/home/hologram-engine";
import { createEnhancedBustTexture } from "@/lib/home/bust-halftone-texture";
import { HOLOGRAM_IMAGE_URLS } from "@/lib/home/home-studio-data";

interface HologramCanvasProps {
  subject: HologramSubject;
  atmosphere: HologramAtmosphere;
  scatterBoost?: number;
  containerRef: React.RefObject<HTMLElement | null>;
}

const VERTEX_SHADER = `
  attribute vec2 aGridUv;
  attribute vec4 aDynOffset; // xyz: yay-sönümleme yer değiştirmesi, w: kinetik enerji (0..1)

  uniform sampler2D uMapA;
  uniform sampler2D uMapB;
  uniform float uModeA; // 0 = yapı, 1 = klasik mermer filozof büstü, 2 = cami
  uniform float uModeB;
  uniform float uMorph;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uCellPx;
  uniform float uCameraZ;
  uniform float uLightMode; // 0 = koyu/kızıl, 1 = beyaz müze gravür / mimari baskı

  varying float vLum;
  varying float vMask;
  varying float vAccent;
  varying float vEdge;
  varying float vSilEdge;
  varying float vIsBust;
  varying float vEnergy;
  varying float vDepth;
  varying float vScan;

  struct SampleResult {
    float lum;
    float mask;
    float zDepth;
    float accent;
    float edge;
    float silEdge;
    float isBust;
  };

  float getLuma(vec3 rgb) {
    return dot(rgb, vec3(0.299, 0.587, 0.114));
  }

  SampleResult sampleSubject(sampler2D tex, float mode, vec2 uv) {
    vec4 c = texture2D(tex, uv);
    float rawLum = getLuma(c.rgb);

    float eps = 0.0028;
    vec4 cL = texture2D(tex, uv + vec2(-eps, 0.0));
    vec4 cR = texture2D(tex, uv + vec2(eps, 0.0));
    vec4 cU = texture2D(tex, uv + vec2(0.0, eps));
    vec4 cD = texture2D(tex, uv + vec2(0.0, -eps));

    float lL = getLuma(cL.rgb);
    float lR = getLuma(cR.rgb);
    float lU = getLuma(cU.rgb);
    float lD = getLuma(cD.rgb);
    float edge = clamp(length(vec2(lR - lL, lD - lU)) * 2.8, 0.0, 1.0);
    float silEdge = clamp(length(vec2(cR.a - cL.a, cD.a - cU.a)) * 1.75, 0.0, 1.0);

    SampleResult res;
    res.edge = edge;
    res.silEdge = silEdge;

    if (mode > 0.5 && mode < 1.5) {
      // 768x768 ön işlenmiş klasik mermer filozof büstü (flood-fill silueti c.a içinde)
      res.mask = smoothstep(0.08, 0.32, c.a);
      res.lum = clamp(pow(max(0.0, (rawLum - 0.03) / 0.97), 0.92), 0.0, 1.0);
      res.accent = 0.0;
      res.zDepth = 0.0;
      res.isBust = 1.0;
    } else if (mode >= 1.5) {
      // Sultanahmet Camii stüdyo modeli
      res.mask = smoothstep(0.032, 0.12, rawLum);
      res.lum = clamp(pow(rawLum, 0.85) * 1.15 + edge * 0.14, 0.0, 1.0);
      float upperCrown = smoothstep(0.54, 0.84, uv.y);
      res.accent = clamp(edge * 0.40 + upperCrown * res.lum * 0.58, 0.0, 1.0);
      float domeDepth = max(0.0, 1.0 - length((uv - vec2(0.5, 0.56)) * 2.2));
      res.zDepth = domeDepth * 0.52 + res.lum * 0.28 - 0.34;
      res.isBust = 0.0;
    } else {
      // İzometrik betonarme taşıyıcı yapı modeli
      res.mask = smoothstep(0.032, 0.12, rawLum);
      res.lum = clamp(pow(rawLum, 0.85) * 1.15 + edge * 0.14, 0.0, 1.0);
      float topRebar = smoothstep(0.70, 0.85, uv.y);
      res.accent = clamp(topRebar * 0.94 + edge * 0.28, 0.0, 1.0);
      float cornerPrism = max(0.0, 1.0 - abs(uv.x - 0.5) * 2.1) * 0.62;
      res.zDepth = cornerPrism + res.lum * 0.28 - 0.38;
      res.isBust = 0.0;
    }
    return res;
  }

  void main() {
    float m = uMorph * uMorph * (3.0 - 2.0 * uMorph);
    SampleResult sB = sampleSubject(uMapB, uModeB, aGridUv);

    float mask = sB.mask;
    float lum = sB.lum;
    float zDepth = sB.zDepth;
    float accent = sB.accent;
    float edge = sB.edge;
    float silEdge = sB.silEdge;
    float isBust = sB.isBust;

    if (m < 0.999) {
      SampleResult sA = sampleSubject(uMapA, uModeA, aGridUv);
      mask = mix(sA.mask, sB.mask, m);
      lum = mix(sA.lum, sB.lum, m);
      zDepth = mix(sA.zDepth, sB.zDepth, m);
      accent = mix(sA.accent, sB.accent, m);
      edge = mix(sA.edge, sB.edge, m);
      silEdge = mix(sA.silEdge, sB.silEdge, m);
      isBust = mix(sA.isBust, sB.isBust, m);
    }

    if (mask < 0.04) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vLum = 0.0;
      vMask = 0.0;
      vAccent = 0.0;
      vEdge = 0.0;
      vSilEdge = 0.0;
      vIsBust = 0.0;
      vEnergy = 0.0;
      vDepth = 1.0;
      vScan = 0.0;
      return;
    }

    vec3 basePos = vec3(position.xy, zDepth);

    // Modeller arası geçişte zarif kinetik girdap
    float morphWave = sin(uMorph * 3.14159265);
    if (morphWave > 0.001) {
      float ang = (aGridUv.x * 9.0 + aGridUv.y * 7.0) + uTime * 2.4;
      basePos += vec3(cos(ang), sin(ang * 1.15), sin(ang * 0.8)) * morphWave * 0.32;
    }

    vec3 disp = aDynOffset.xyz;
    float energy = clamp(aDynOffset.w, 0.0, 1.0);
    vec3 finalPos = basePos + disp;

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    vDepth = clamp((-mvPosition.z - 3.2) / 6.5, 0.0, 1.0);
    vLum = lum;
    vMask = mask;
    vAccent = accent;
    vEdge = edge;
    vSilEdge = silEdge;
    vIsBust = isBust;
    vEnergy = energy;

    // İnce dikey holografik nefes tarama bandı
    float shimmerWaveY = sin(uTime * 0.85) * 2.05;
    float waveProximity = 1.0 - smoothstep(0.0, 0.36, abs(finalPos.y - shimmerWaveY));
    float cellSeed = fract(sin(dot(aGridUv * 228.0, vec2(127.1, 311.7))) * 43758.5453);
    vScan = waveProximity * step(0.56, cellSeed) * 0.12;

    float darkRatio = 0.20 + pow(lum, 0.78) * 0.73;

    // Beyaz (Alabaster) modda filozof büstü için pozitif gravür tonlaması:
    // Derin gölgeler ve oyulmuş kenarlar dolgun mürekkep kareleri, parlak mermer tepeleri zarif mikro-nokta olur.
    float bustShadow = clamp(1.0 - lum, 0.0, 1.0);
    float bustEngrave = clamp(pow(bustShadow, 0.94) * 0.85 + edge * 0.28 + silEdge * 0.22, 0.0, 1.0);
    float bustLightRatio = 0.24 + pow(bustEngrave, 0.86) * 0.67;

    // Beyaz modda mimari modeller (Yapı & Cami) için teknik blueprint çizgi ağırlığı
    float archLightRatio = 0.22 + pow(lum, 0.84) * 0.66 + edge * 0.08;
    float lightRatio = mix(archLightRatio, bustLightRatio, isBust);

    float cellRatio = mix(darkRatio, lightRatio, uLightMode);

    float scatterScale = mix(1.0, 0.72, clamp(energy * 0.88, 0.0, 1.0));
    float perspectiveRatio = uCameraZ / max(1.4, -mvPosition.z);
    float ptSize = uCellPx * cellRatio * scatterScale * perspectiveRatio * uPixelRatio;

    gl_PointSize = clamp(ptSize, 0.90 * uPixelRatio, uCellPx * 0.94 * uPixelRatio);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 uHighlightColor;
  uniform vec3 uMidColor;
  uniform vec3 uShadowColor;
  uniform vec3 uAccentColor;
  uniform vec3 uScatterColor;
  uniform float uLightMode;
  uniform float uCrimsonMode;

  varying float vLum;
  varying float vMask;
  varying float vAccent;
  varying float vEdge;
  varying float vSilEdge;
  varying float vIsBust;
  varying float vEnergy;
  varying float vDepth;
  varying float vScan;

  void main() {
    if (vMask < 0.04) discard;

    vec2 p = abs(gl_PointCoord - vec2(0.5)) * 2.0;
    float boxDist = max(p.x, p.y);
    float circleDist = length(p);
    float roundness = mix(0.0, 0.50, clamp(vEnergy * 1.1, 0.0, 1.0));
    float shapeDist = mix(boxDist, circleDist, roundness);
    if (shapeDist > 0.99) discard;

    float cellAlpha = 1.0 - smoothstep(0.90, 1.00, shapeDist);

    vec3 tonal;
    float visAlpha;

    if (uCrimsonMode > 0.5) {
      float k = clamp(vLum + vScan * 0.45, 0.0, 1.0);
      vec3 c0 = vec3(0.902, 0.510, 0.396);
      vec3 c1 = vec3(0.961, 0.675, 0.557);
      vec3 c2 = vec3(0.988, 0.824, 0.737);
      vec3 c3 = vec3(1.000, 0.945, 0.902);
      vec3 c4 = vec3(1.000, 0.992, 0.973);

      tonal = mix(c0, c1, smoothstep(0.03, 0.26, k));
      tonal = mix(tonal, c2, smoothstep(0.24, 0.52, k));
      tonal = mix(tonal, c3, smoothstep(0.50, 0.78, k));
      tonal = mix(tonal, c4, smoothstep(0.76, 0.97, k));

      visAlpha = mix(0.24, 1.0, pow(k, 0.76));
    } else {
      // Koyu (Obsidyen) ve Beyaz mimari modeller için temel tonlama
      float lightInkKey = clamp(pow(vLum, 0.94) + vEdge * 0.14, 0.0, 1.0);
      float toneKey = mix(clamp(vLum + vScan * 0.45, 0.0, 1.0), lightInkKey, uLightMode);
      vec3 baseTonal = mix(uShadowColor, uMidColor, smoothstep(0.10, 0.54, toneKey));
      baseTonal = mix(baseTonal, uHighlightColor, smoothstep(0.50, 0.92, toneKey));

      float darkVis = 0.26 + pow(vLum, 0.76) * 0.74;
      float archLightVis = 0.26 + pow(vLum, 0.86) * 0.70;
      float baseVis = mix(darkVis, archLightVis, uLightMode);

      // Beyaz (Alabaster) modda Filozof Büstü: negatif görüntü yerine müze gravürü / sıcak bronz-grafit oyma tonlaması
      float bustShadow = clamp(1.0 - vLum, 0.0, 1.0);
      float engraveKey = clamp(
        pow(bustShadow, 0.95) * 0.87 + vEdge * 0.28 + vSilEdge * 0.24 - vScan * 0.16,
        0.0,
        1.0
      );
      vec3 e0 = vec3(0.765, 0.725, 0.678); // #C3B9AD aydınlık mermer yüzey mikro-stipple
      vec3 e1 = vec3(0.545, 0.506, 0.467); // #8B8177 sıcak taş orta-açık ton
      vec3 e2 = vec3(0.333, 0.302, 0.275); // #554D46 heykelsi orta gölge
      vec3 e3 = vec3(0.176, 0.157, 0.145); // #2D2825 derin göz/sakal oyuğu
      vec3 e4 = vec3(0.098, 0.086, 0.082); // #191615 en keskin gravür mürekkebi

      vec3 bustTonal = mix(e0, e1, smoothstep(0.05, 0.30, engraveKey));
      bustTonal = mix(bustTonal, e2, smoothstep(0.28, 0.56, engraveKey));
      bustTonal = mix(bustTonal, e3, smoothstep(0.52, 0.80, engraveKey));
      bustTonal = mix(bustTonal, e4, smoothstep(0.78, 0.98, engraveKey));

      // Oyulmuş kontur ve belirgin kat çizgilerine çok zarif sıcak terakota/bronz nüans
      float bronzeCrease = smoothstep(0.36, 0.88, vEdge) * (1.0 - smoothstep(0.55, 0.90, engraveKey)) * 0.26;
      bustTonal = mix(bustTonal, vec3(0.565, 0.286, 0.161), bronzeCrease);

      float bustLightVis = mix(0.22, 0.95, pow(engraveKey, 0.80));

      float bustLightWeight = uLightMode * vIsBust;
      tonal = mix(baseTonal, bustTonal, bustLightWeight);
      visAlpha = mix(baseVis, bustLightVis, bustLightWeight);
    }

    float accentMix = mix(vAccent * 0.68, smoothstep(0.38, 0.86, vAccent) * 0.88, uLightMode);
    vec3 col = mix(tonal, uAccentColor, accentMix);

    float scatterMix = clamp(vEnergy * 0.85, 0.0, 0.90);
    col = mix(col, uScatterColor, scatterMix);
    if (uCrimsonMode > 0.5 && vEnergy > 0.12) {
      visAlpha = mix(visAlpha, mix(0.64, 0.34, vEnergy), clamp(vEnergy * 1.2, 0.0, 1.0));
    }

    float depthFade = 1.0 - vDepth * mix(0.12, 0.06, uLightMode);
    float alpha = cellAlpha * vMask * (visAlpha + vEnergy * 0.08 * (1.0 - uCrimsonMode)) * depthFade;

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement("canvas");
    const gl = probeCanvas.getContext("webgl2") || probeCanvas.getContext("webgl");
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? "");
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function getPaletteUniforms(atmosphere: HologramAtmosphere, subject: HologramSubject) {
  if (atmosphere === "crimson") {
    return {
      highlight: new THREE.Color("#FFFDF8"),
      mid: new THREE.Color("#FCD2BC"),
      shadow: new THREE.Color("#E68265"),
      accent: new THREE.Color("#F59E0B"),
      scatter: new THREE.Color("#FFE8CA"),
      gridColor: new THREE.Color("#F6C3A4"),
      lightMode: 0.0,
      crimsonMode: 1.0,
    };
  }
  if (atmosphere === "alabaster") {
    if (subject === "building") {
      return {
        highlight: new THREE.Color("#0F1E3D"),
        mid: new THREE.Color("#2563EB"),
        shadow: new THREE.Color("#93B4E8"),
        accent: new THREE.Color("#C2410C"),
        scatter: new THREE.Color("#EA580C"),
        gridColor: new THREE.Color("#2563EB"),
        lightMode: 1.0,
        crimsonMode: 0.0,
      };
    }
    if (subject === "mosque") {
      return {
        highlight: new THREE.Color("#0C223B"),
        mid: new THREE.Color("#0369A1"),
        shadow: new THREE.Color("#7FB3D5"),
        accent: new THREE.Color("#B45309"),
        scatter: new THREE.Color("#D97706"),
        gridColor: new THREE.Color("#0369A1"),
        lightMode: 1.0,
        crimsonMode: 0.0,
      };
    }
    return {
      highlight: new THREE.Color("#1D1B1A"),
      mid: new THREE.Color("#504942"),
      shadow: new THREE.Color("#BEB4A8"),
      accent: new THREE.Color("#C2410C"),
      scatter: new THREE.Color("#C2410C"),
      gridColor: new THREE.Color("#504942"),
      lightMode: 1.0,
      crimsonMode: 0.0,
    };
  }
  return {
    highlight: new THREE.Color("#FAF6EE"),
    mid: new THREE.Color("#C4BCB0"),
    shadow: new THREE.Color("#534D45"),
    accent: new THREE.Color("#F59E0B"),
    scatter: new THREE.Color("#FDE68A"),
    gridColor: new THREE.Color("#F59E0B"),
    lightMode: 0.0,
    crimsonMode: 0.0,
  };
}

function subjectToMode(s: HologramSubject): number {
  if (s === "bust") return 1;
  if (s === "mosque") return 2;
  return 0;
}

function createPlaceholderTexture(): THREE.DataTexture {
  const size = 32;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x / size - 0.5) * 2;
      const dy = (y / size - 0.5) * 2;
      const r = Math.hypot(dx, dy);
      const val = r < 0.65 && (x % 3 === 0 || y % 3 === 0) ? Math.round((1 - r) * 180) : 0;
      const off = (y * size + x) * 4;
      data[off] = val;
      data[off + 1] = val;
      data[off + 2] = val;
      data[off + 3] = val > 0 ? 255 : 0;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}

export function HologramCanvas({
  subject,
  atmosphere,
  scatterBoost = DEFAULT_SCATTER_BOOST,
  containerRef,
}: HologramCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const subjectRef = useRef<HologramSubject>(subject);
  const atmosphereRef = useRef<HologramAtmosphere>(atmosphere);
  const scatterBoostRef = useRef<number>(scatterBoost);
  const wakeRef = useRef<(() => void) | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    subjectRef.current = subject;
    atmosphereRef.current = atmosphere;
    scatterBoostRef.current = scatterBoost;
    wakeRef.current?.();
  }, [subject, atmosphere, scatterBoost]);

  useEffect(() => {
    const mountNode = mountRef.current;
    if (!mountNode) return;
    const mount: HTMLDivElement = mountNode;

    const isSoftwareGl = detectSoftwareWebGL();
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: "default",
      });
    } catch {
      queueMicrotask(() => {
        setWebglUnavailable(true);
      });
      return;
    }

    const pixelRatio = isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(pixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.setAttribute("aria-hidden", "true");
    mount.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
    camera.position.set(0, 0, 6.72);

    let disposed = false;
    const bustAsset = createEnhancedBustTexture(HOLOGRAM_IMAGE_URLS.bust, () => {
      if (!disposed) {
        mount.setAttribute("data-bust-ready", "true");
        colorTransitionTimer = Math.max(colorTransitionTimer, 0.35);
        scheduleTick(false);
      }
    });

    const placeholderTex = createPlaceholderTexture();
    const subjectMaps: Record<HologramSubject, THREE.Texture> = {
      building: placeholderTex,
      bust: bustAsset.texture,
      mosque: placeholderTex,
    };
    const loadedTextures: THREE.Texture[] = [];
    const requestedArchTextures = new Set<"building" | "mosque">();

    const texLoader = new THREE.TextureLoader();
    const ensureArchitecturalTexture = (key: "building" | "mosque") => {
      if (requestedArchTextures.has(key)) return;
      requestedArchTextures.add(key);
      texLoader.load(HOLOGRAM_IMAGE_URLS[key], (tex) => {
        if (disposed) {
          tex.dispose();
          return;
        }
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        subjectMaps[key] = tex;
        loadedTextures.push(tex);
        mount.setAttribute(`data-${key}-ready`, "true");

        if (currentSubject === key) {
          material.uniforms.uMapB.value = tex;
          if (morphProgress >= 0.99) {
            material.uniforms.uMapA.value = tex;
          }
          colorTransitionTimer = Math.max(colorTransitionTimer, 0.35);
          scheduleTick(false);
        }
      });
    };

    const WORLD_SPAN = 4.1;
    const springField = createHalftoneSpringField(HOLOGRAM_GRID_SIZE, WORLD_SPAN);
    const pointCount = springField.count;
    const basePositions = new Float32Array(pointCount * 3);
    const gridUvs = new Float32Array(pointCount * 2);

    let idx = 0;
    for (let gy = 0; gy < HOLOGRAM_GRID_SIZE; gy++) {
      const uvY = 1.0 - (gy + 0.5) / HOLOGRAM_GRID_SIZE;
      for (let gx = 0; gx < HOLOGRAM_GRID_SIZE; gx++) {
        const uvX = (gx + 0.5) / HOLOGRAM_GRID_SIZE;
        basePositions[idx * 3] = springField.baseXY[idx * 2];
        basePositions[idx * 3 + 1] = springField.baseXY[idx * 2 + 1];
        basePositions[idx * 3 + 2] = 0;

        gridUvs[idx * 2] = uvX;
        gridUvs[idx * 2 + 1] = uvY;
        idx++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(basePositions, 3));
    geometry.setAttribute("aGridUv", new THREE.BufferAttribute(gridUvs, 2));
    const dynOffsetAttr = new THREE.BufferAttribute(springField.dynOffset, 4);
    dynOffsetAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("aDynOffset", dynOffsetAttr);

    const initialSubject = subjectRef.current;
    if (initialSubject === "building" || initialSubject === "mosque") {
      ensureArchitecturalTexture(initialSubject);
    }
    const initialPalette = getPaletteUniforms(atmosphereRef.current, initialSubject);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uMapA: { value: subjectMaps[initialSubject] },
        uMapB: { value: subjectMaps[initialSubject] },
        uModeA: { value: subjectToMode(initialSubject) },
        uModeB: { value: subjectToMode(initialSubject) },
        uMorph: { value: 1.0 },
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uCellPx: { value: 3.25 },
        uCameraZ: { value: 6.72 },
        uLightMode: { value: initialPalette.lightMode },
        uCrimsonMode: { value: initialPalette.crimsonMode },
        uHighlightColor: { value: initialPalette.highlight.clone() },
        uMidColor: { value: initialPalette.mid.clone() },
        uShadowColor: { value: initialPalette.shadow.clone() },
        uAccentColor: { value: initialPalette.accent.clone() },
        uScatterColor: { value: initialPalette.scatter.clone() },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const holoGroup = new THREE.Group();
    const pointsMesh = new THREE.Points(geometry, material);
    pointsMesh.frustumCulled = false;
    holoGroup.add(pointsMesh);

    const gridLines: number[] = [];
    const gridExtent = 2.0;
    const gridStep = 0.5;
    const gridY = -1.65;
    for (let v = -gridExtent; v <= gridExtent + 0.001; v += gridStep) {
      gridLines.push(-gridExtent, gridY, v, gridExtent, gridY, v);
      gridLines.push(v, gridY, -gridExtent, v, gridY, gridExtent);
    }
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute("position", new THREE.Float32BufferAttribute(gridLines, 3));
    const gridMat = new THREE.LineBasicMaterial({
      color: initialPalette.gridColor.clone(),
      transparent: true,
      opacity: initialSubject === "bust" ? 0.0 : 0.14,
      depthWrite: false,
    });
    const datumGrid = new THREE.LineSegments(gridGeo, gridMat);
    datumGrid.rotation.y = -0.68;
    datumGrid.rotation.x = 0.34;
    holoGroup.add(datumGrid);

    scene.add(holoGroup);

    let currentSubject: HologramSubject = initialSubject;
    let prevSubject: HologramSubject = initialSubject;
    let morphProgress = 1.0;
    let colorTransitionTimer = 0.0;

    const triggerMorphTo = (target: HologramSubject) => {
      if (target === "building" || target === "mosque") {
        ensureArchitecturalTexture(target);
      }
      prevSubject = currentSubject;
      currentSubject = target;
      material.uniforms.uMapA.value = subjectMaps[prevSubject];
      material.uniforms.uMapB.value = subjectMaps[currentSubject];
      material.uniforms.uModeA.value = subjectToMode(prevSubject);
      material.uniforms.uModeB.value = subjectToMode(currentSubject);
      morphProgress = 0.0;
      material.uniforms.uMorph.value = 0.0;
      colorTransitionTimer = 0.9;
    };

    const raycaster = new THREE.Raycaster();
    const ndcPointer = new THREE.Vector2(99, 99);
    const interactPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const planeHit = new THREE.Vector3();
    const localHit = new THREE.Vector3();
    const invMatrix = new THREE.Matrix4();

    const targetPointer = { x: 0, y: 0, active: false };
    let hasPrevLocal = false;
    let prevLocalX = 0;
    let prevLocalY = 0;
    let smoothPtrVx = 0;
    let smoothPtrVy = 0;

    let lastAtmosphere = atmosphereRef.current;
    let lastPaletteSubject = currentSubject;
    let targetPalette = getPaletteUniforms(lastAtmosphere, lastPaletteSubject);
    let bustFlushY = -0.26;
    let archCenterY = -0.22;

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      const aspect = width / height;
      camera.aspect = aspect;

      // Genişletilmiş omuzların 320px–1920px arası hiçbir ekranda yatay kesilmemesi ve mobilde heybetli durması için kamera mesafesi
      const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
      const minZForWidth = (WORLD_SPAN * 0.485) / Math.max(0.25, tanHalfFov * aspect);

      if (width < 640) {
        camera.position.z = Math.min(8.4, Math.max(6.15, minZForWidth));
        camera.position.y = 0.0;
      } else if (width < 1024) {
        camera.position.z = Math.max(6.75, minZForWidth);
        camera.position.y = 0.0;
      } else {
        camera.position.z = Math.max(6.95, minZForWidth);
        camera.position.y = 0.0;
      }
      camera.updateProjectionMatrix();

      const visibleWorldH = 2 * camera.position.z * tanHalfFov;
      // Mobilde büst geniş ekrana göre daha uzun tuvalde nefes alsın; alt kaideye yakın dengeli yerleşim
      bustFlushY =
        width < 640
          ? -visibleWorldH * 0.5 + WORLD_SPAN * 0.5 + 0.08
          : -visibleWorldH * 0.5 + WORLD_SPAN * 0.5 - 0.04;

      // Yapı donatı filizleri ve Sultanahmet minareleri üst arama çubuğunun temiz altında kalacak şekilde dengelenir
      archCenterY = width < 640 ? -0.14 : -0.28;

      const cellPx = (WORLD_SPAN / HOLOGRAM_GRID_SIZE) * (height / Math.max(0.01, visibleWorldH));
      material.uniforms.uCellPx.value = Math.max(1.5, cellPx);
      material.uniforms.uCameraZ.value = camera.position.z;

      holoGroup.position.set(0, currentSubject === "bust" ? bustFlushY : archCenterY, 0);
      holoGroup.updateMatrixWorld();
    };
    resize();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      renderer.render(scene, camera);
      colorTransitionTimer = Math.max(colorTransitionTimer, 0.25);
      scheduleTick(false);
    });
    resizeObserver.observe(mount);

    const interactionTarget = containerRef.current ?? mount;

    const updatePointerFromClient = (clientX: number, clientY: number) => {
      const rect = mount.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);
      if (nx >= -1.12 && nx <= 1.12 && ny >= -1.12 && ny <= 1.12) {
        ndcPointer.set(nx, ny);
        targetPointer.x = nx;
        targetPointer.y = ny;
        targetPointer.active = true;
      } else {
        targetPointer.active = false;
        hasPrevLocal = false;
      }
    };

    const onPointerMove = (ev: PointerEvent) => {
      if (ev.pointerType === "touch") return;
      const targetEl = ev.target as HTMLElement | null;
      if (targetEl && targetEl.closest('button, a, input, label, [role="region"]')) {
        targetPointer.active = false;
        hasPrevLocal = false;
        return;
      }
      updatePointerFromClient(ev.clientX, ev.clientY);
      scheduleTick(false);
    };

    const onPointerDown = (ev: PointerEvent) => {
      const targetEl = ev.target as HTMLElement | null;
      if (targetEl && targetEl.closest('button, a, input, label, [role="region"]')) {
        return;
      }
      updatePointerFromClient(ev.clientX, ev.clientY);
      if (targetPointer.active) {
        raycaster.setFromCamera(ndcPointer, camera);
        if (raycaster.ray.intersectPlane(interactPlane, planeHit)) {
          invMatrix.copy(holoGroup.matrixWorld).invert();
          localHit.copy(planeHit).applyMatrix4(invMatrix);
          triggerSpringShockwave(springField, localHit.x, localHit.y, 0.72);
          scheduleTick(false);
        }
        if (ev.pointerType === "touch") {
          targetPointer.active = false;
          hasPrevLocal = false;
        }
      }
    };

    const onPointerLeave = () => {
      targetPointer.active = false;
      hasPrevLocal = false;
    };

    interactionTarget.addEventListener("pointermove", onPointerMove, { passive: true });
    interactionTarget.addEventListener("pointerdown", onPointerDown, { passive: true });
    interactionTarget.addEventListener("pointerleave", onPointerLeave, { passive: true });
    interactionTarget.addEventListener("pointercancel", onPointerLeave, { passive: true });

    const onContextLost = (e: Event) => {
      e.preventDefault();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    let isInViewport = true;
    let isTabVisible = typeof document !== "undefined" ? !document.hidden : true;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isInViewport = entry ? entry.isIntersecting || entry.boundingClientRect.height === 0 : true;
        if (isInViewport && isTabVisible) {
          lastTime = performance.now();
          scheduleTick(false);
        }
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(interactionTarget);

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isInViewport && isTabVisible) {
        lastTime = performance.now();
        scheduleTick(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    let rafId = 0;
    let timerId = 0;
    let isScheduled = false;
    let isThrottledWait = false;
    let lastTime = performance.now();
    let elapsedTotal = 0;
    let lastAttrUpdate = 0;
    let hadKineticMotion = false;

    function clearPendingTimers() {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      rafId = 0;
      timerId = 0;
      isScheduled = false;
      isThrottledWait = false;
    }

    function afterDraw(cb: () => void, delayMs: number) {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === "function") {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        let polls = 0;
        const poll = () => {
          if (disposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          polls++;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED && polls < 18) {
            timerId = window.setTimeout(poll, 6);
          } else {
            if (sync) gl.deleteSync(sync);
            timerId = window.setTimeout(cb, delayMs);
          }
        };
        timerId = window.setTimeout(poll, 6);
      } else {
        timerId = window.setTimeout(cb, delayMs);
      }
    }

    function scheduleTick(idleThrottle: boolean = false) {
      if (disposed) return;
      if (!isInViewport || !isTabVisible) return;
      if (isScheduled) {
        if (!idleThrottle && isThrottledWait) {
          clearPendingTimers();
        } else {
          return;
        }
      }
      isScheduled = true;
      isThrottledWait = idleThrottle;
      if (isSoftwareGl) {
        afterDraw(runTick, idleThrottle ? 120 : 40);
      } else if (idleThrottle) {
        timerId = window.setTimeout(() => {
          if (!disposed) {
            isThrottledWait = false;
            rafId = window.requestAnimationFrame(runTick);
          }
        }, 42);
      } else {
        rafId = window.requestAnimationFrame(runTick);
      }
    }

    function runTick() {
      isScheduled = false;
      isThrottledWait = false;
      if (disposed || !isInViewport || !isTabVisible) return;

      const now = performance.now();
      const rawDt = Math.min((now - lastTime) / 1000, 0.25);
      const dt = Math.min(rawDt, 0.05);
      lastTime = now;
      elapsedTotal += rawDt;

      if (subjectRef.current !== currentSubject) {
        triggerMorphTo(subjectRef.current);
      }
      if (morphProgress < 1.0) {
        morphProgress = Math.min(1.0, morphProgress + Math.min(rawDt, 0.16) * 2.25);
        material.uniforms.uMorph.value = morphProgress;
      }

      if (atmosphereRef.current !== lastAtmosphere || currentSubject !== lastPaletteSubject) {
        lastAtmosphere = atmosphereRef.current;
        lastPaletteSubject = currentSubject;
        targetPalette = getPaletteUniforms(lastAtmosphere, lastPaletteSubject);
        colorTransitionTimer = 0.85;
      }

      if (colorTransitionTimer > 0) {
        colorTransitionTimer = Math.max(0, colorTransitionTimer - rawDt);
        const colorBlend = 1 - Math.exp(-8.5 * rawDt);
        material.uniforms.uHighlightColor.value.lerp(targetPalette.highlight, colorBlend);
        material.uniforms.uMidColor.value.lerp(targetPalette.mid, colorBlend);
        material.uniforms.uShadowColor.value.lerp(targetPalette.shadow, colorBlend);
        material.uniforms.uAccentColor.value.lerp(targetPalette.accent, colorBlend);
        material.uniforms.uScatterColor.value.lerp(targetPalette.scatter, colorBlend);
        material.uniforms.uLightMode.value +=
          (targetPalette.lightMode - material.uniforms.uLightMode.value) * colorBlend;
        material.uniforms.uCrimsonMode.value +=
          (targetPalette.crimsonMode - material.uniforms.uCrimsonMode.value) * colorBlend;
        gridMat.color.lerp(targetPalette.gridColor, colorBlend);

        const targetGridOpacity = currentSubject === "bust" ? 0.0 : 0.14;
        const currentGridOpacity = gridMat.opacity ?? 0;
        gridMat.opacity = currentGridOpacity + (targetGridOpacity - currentGridOpacity) * colorBlend;

        const targetHoloY = currentSubject === "bust" ? bustFlushY : archCenterY;
        holoGroup.position.y += (targetHoloY - holoGroup.position.y) * colorBlend;
      } else {
        holoGroup.position.y = currentSubject === "bust" ? bustFlushY : archCenterY;
      }

      holoGroup.position.x = 0;
      holoGroup.rotation.set(0, 0, 0);
      holoGroup.updateMatrixWorld();

      let ptrActive = false;
      let ptrX = 0;
      let ptrY = 0;

      if (targetPointer.active) {
        raycaster.setFromCamera(ndcPointer, camera);
        if (raycaster.ray.intersectPlane(interactPlane, planeHit)) {
          invMatrix.copy(holoGroup.matrixWorld).invert();
          localHit.copy(planeHit).applyMatrix4(invMatrix);
          ptrX = localHit.x;
          ptrY = localHit.y;
          ptrActive = true;

          if (hasPrevLocal) {
            const rawVx = (ptrX - prevLocalX) / Math.max(dt, 0.012);
            const rawVy = (ptrY - prevLocalY) / Math.max(dt, 0.012);
            const velBlend = 1 - Math.exp(-16 * dt);
            smoothPtrVx += (THREE.MathUtils.clamp(rawVx, -12, 12) - smoothPtrVx) * velBlend;
            smoothPtrVy += (THREE.MathUtils.clamp(rawVy, -12, 12) - smoothPtrVy) * velBlend;
          } else {
            smoothPtrVx = 0;
            smoothPtrVy = 0;
            hasPrevLocal = true;
          }
          prevLocalX = ptrX;
          prevLocalY = ptrY;
        }
      } else {
        smoothPtrVx *= Math.exp(-10 * dt);
        smoothPtrVy *= Math.exp(-10 * dt);
      }

      const peakEnergy = stepHalftoneSpringField(
        springField,
        {
          x: ptrX,
          y: ptrY,
          vx: smoothPtrVx,
          vy: smoothPtrVy,
          active: ptrActive,
        },
        dt,
        scatterBoostRef.current,
        elapsedTotal,
        prefersReducedMotion,
      );
      if (peakEnergy > 0 || ptrActive || hadKineticMotion) {
        dynOffsetAttr.needsUpdate = true;
        hadKineticMotion = peakEnergy > 0;
      }

      material.uniforms.uTime.value = prefersReducedMotion ? 0 : elapsedTotal;

      if (now - lastAttrUpdate > 180) {
        lastAttrUpdate = now;
        mount.setAttribute("data-subject", currentSubject);
        mount.setAttribute("data-atmosphere", atmosphereRef.current);
        mount.setAttribute("data-dispersion", peakEnergy.toFixed(4));
        mount.setAttribute("data-rotation", "static");
      }

      renderer.render(scene, camera);

      const isActiveMotion =
        peakEnergy > 0 || ptrActive || morphProgress < 1.0 || colorTransitionTimer > 0;
      if (!prefersReducedMotion || isActiveMotion) {
        scheduleTick(!isActiveMotion);
      }
    }

    wakeRef.current = () => {
      colorTransitionTimer = Math.max(colorTransitionTimer, 0.85);
      scheduleTick(false);
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    runTick();

    return () => {
      disposed = true;
      wakeRef.current = null;
      clearPendingTimers();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      resizeObserver.disconnect();
      interactionTarget.removeEventListener("pointermove", onPointerMove);
      interactionTarget.removeEventListener("pointerdown", onPointerDown);
      interactionTarget.removeEventListener("pointerleave", onPointerLeave);
      interactionTarget.removeEventListener("pointercancel", onPointerLeave);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      geometry.dispose();
      material.dispose();
      gridGeo.dispose();
      gridMat.dispose();
      bustAsset.dispose();
      placeholderTex.dispose();
      for (const tex of loadedTextures) {
        tex.dispose();
      }
      renderer.dispose();
      if (canvas.parentNode === mount) {
        mount.removeChild(canvas);
      }
    };
  }, [containerRef]);

  if (webglUnavailable) {
    return (
      <div
        data-testid="hologram-fallback"
        className="flex h-full w-full items-center justify-center bg-[var(--hp-bg-page)]"
      >
        <div className="max-w-sm px-4 text-center text-sm text-[var(--hp-ink-secondary)]">
          Hologram görünümü için tarayıcınızda WebGL desteği gereklidir.
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      data-testid="hologram-canvas"
      data-subject={subject}
      data-atmosphere={atmosphere}
      data-dispersion="0.0000"
      data-rotation="static"
      className="h-full w-full touch-pan-y select-none"
    />
  );
}
