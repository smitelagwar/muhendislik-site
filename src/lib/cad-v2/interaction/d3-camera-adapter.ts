// ============================================================================
// DWG/DXF MOTOR V2 — D3 CAMERA & 2D GESTURE ADAPTER (d3-zoom 3.0.0)
// ============================================================================
// Sözleşme: motor_v2/28_PAN_ZOOM_FIT_SOZLESMESI.md
// Matematiksel doğrulamalar: N01–N23
// Tek giriş yüzeyi, Float64 kamera durumu, Three.js OrthographicCamera köprüsü

import * as d3Zoom from "d3-zoom";
import * as d3Selection from "d3-selection";
import type { OrthographicCamera } from "three";
import type { CadBBox2D, CadPoint2D } from "../canonical/types";

export interface CadCameraState {
  worldOrigin: CadPoint2D; // [Ox, Oy] - model alanı merkezi
  center: CadPoint2D; // [Cx, Cy] - o anki kamera odak noktası (dünya koordinatı)
  unitsPerCssPixel: number; // u > 0
  width: number; // W - drawable CSS genişliği
  height: number; // H - drawable CSS yüksekliği
}

export interface D3CameraAdapterOptions {
  inputElement: HTMLElement;
  initialBBox: CadBBox2D;
  threeCamera: OrthographicCamera;
  onCameraChange?: (camera: CadCameraState) => void;
  onInvalidate?: () => void;
  isPanToolActive?: () => boolean;
  onPanToolChange?: (active: boolean) => void;
}

export class D3CameraAdapter {
  private inputElement: HTMLElement;
  private threeCamera: OrthographicCamera;
  private onCameraChange?: (camera: CadCameraState) => void;
  private onInvalidate?: () => void;
  private isPanToolActive: () => boolean;
  private onPanToolChange?: (active: boolean) => void;
  private panToolActive = true;

  private state: CadCameraState;
  private fitBBox: CadBBox2D;
  private zoomBehavior: d3Zoom.ZoomBehavior<HTMLElement, unknown>;
  private selection: d3Selection.Selection<HTMLElement, unknown, null, undefined>;
  private isDisposed = false;
  private inputGeneration = 1;
  private uMin: number;
  private uMax: number;
  private isSpaceDown = false;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundBlur: () => void;
  private boundWheelGuard: (e: WheelEvent) => void;
  private boundMouseDown: (e: MouseEvent) => void;

  constructor(options: D3CameraAdapterOptions) {
    this.inputElement = options.inputElement;
    this.threeCamera = options.threeCamera;
    this.onCameraChange = options.onCameraChange;
    this.onInvalidate = options.onInvalidate;
    this.isPanToolActive = options.isPanToolActive || (() => this.panToolActive);
    this.onPanToolChange = options.onPanToolChange;
    this.fitBBox = options.initialBBox;

    const W = Math.max(10, this.inputElement.clientWidth || 800);
    const H = Math.max(10, this.inputElement.clientHeight || 600);

    const [minX, minY, maxX, maxY] = options.initialBBox;
    const Ox = (minX + maxX) / 2;
    const Oy = (minY + maxY) / 2;

    const bW = Math.max(1e-6, maxX - minX);
    const bH = Math.max(1e-6, maxY - minY);
    const m = Math.min(32, 0.1 * Math.min(W, H));
    const u0 = Math.max(bW / Math.max(1, W - 2 * m), bH / Math.max(1, H - 2 * m));

    const coordinateMagnitude = Math.max(1, Math.abs(minX), Math.abs(maxX), Math.abs(minY), Math.abs(maxY));
    this.uMin = Math.max(u0 / Math.pow(2, 20), 32 * Number.EPSILON * coordinateMagnitude);
    this.uMax = u0 * Math.pow(2, 6);

    this.state = {
      worldOrigin: [Ox, Oy],
      center: [Ox, Oy],
      unitsPerCssPixel: u0,
      width: W,
      height: H,
    };

    const kMin = 1 / this.uMax;
    const kMax = 1 / this.uMin;

    // d3-zoom davranışı yapılandırması
    this.zoomBehavior = d3Zoom
      .zoom<HTMLElement, unknown>()
      .extent([
        [0, 0],
        [W, H],
      ])
      .scaleExtent([kMin, kMax])
      .duration(0)
      .clickDistance(4)
      .filter((event: MouseEvent | TouchEvent) => {
        if (this.isDisposed) return false;
        // Button 1 (orta tuş) her zaman pan
        if ("button" in event && event.button === 1) return true;
        // Button 0 (sol tuş) yalnız Pan aracı veya Space basılı iken pan
        if ("button" in event && event.button === 0) {
          return this.isSpaceDown || this.isPanToolActive();
        }
        // Button 2 (sağ tuş) asla pan yapmaz (3D rotasyon yasağı)
        if ("button" in event && event.button === 2) return false;
        // Tekerlek ve dokunma olayları kabul
        return true;
      });

    // 28_PAN_ZOOM_FIT_SOZLESMESI (N02): Tanımlı wheel dönüşümü
    this.zoomBehavior.wheelDelta((event: any) => {
      const deltaPx =
        (event.deltaY || 0) * (event.deltaMode === 0 ? 1 : event.deltaMode === 1 ? 16 : this.state.height);
      const factor = -deltaPx * 0.002 * (event.ctrlKey ? 10 : 1);
      return Math.max(-1, Math.min(1, factor));
    });

    // Mouse bulunan dokunmatik dizüstü bilgisayarlarda dokunma desteği
    this.zoomBehavior.touchable(() => true);

    this.selection = d3Selection.select(this.inputElement);
    this.selection.call(this.zoomBehavior);

    // Çift tıklama yakınlaştırmasını devre dışı bırak
    this.selection.on("dblclick.zoom", null);

    // Passive:false wheel guard (çizim üzerinde sayfa scroll engeli)
    this.boundWheelGuard = (e: WheelEvent) => {
      if (this.isDisposed) return;
      e.preventDefault();
    };
    this.inputElement.addEventListener("wheel", this.boundWheelGuard, { capture: true, passive: false });

    // Orta tuş tarayıcı auto-scroll engeli ve pan için odak alma
    this.boundMouseDown = (e: MouseEvent) => {
      if (this.isDisposed) return;
      if (e.button === 1) {
        e.preventDefault();
        try {
          this.inputElement.focus({ preventScroll: true });
        } catch {}
      } else if (e.button === 0 && (this.isSpaceDown || this.isPanToolActive())) {
        try {
          this.inputElement.focus({ preventScroll: true });
        } catch {}
      }
    };
    this.inputElement.addEventListener("mousedown", this.boundMouseDown);

    // Zoom event dinleyicisi
    this.zoomBehavior.on("zoom", (event: d3Zoom.D3ZoomEvent<HTMLElement, unknown>) => {
      if (this.isDisposed) return;
      this.handleD3Transform(event.transform);
    });

    // Klavye kısayolları dinleyicisi
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundBlur = () => {
      this.isSpaceDown = false;
    };
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.boundKeyDown, { passive: false });
      window.addEventListener("keyup", this.boundKeyUp, { passive: true });
      window.addEventListener("blur", this.boundBlur);
    }

    // İlk kamera durumunu uygula
    this.applyCameraState();
  }

  public getState(): CadCameraState {
    return {
      ...this.state,
      worldOrigin: [this.state.worldOrigin[0], this.state.worldOrigin[1]],
      center: [this.state.center[0], this.state.center[1]],
    };
  }

  /**
   * Ekran pikselinden dünya koordinatına dönüşüm
   */
  public worldAt(px: number, py: number): CadPoint2D {
    const { center, unitsPerCssPixel: u, width: W, height: H } = this.state;
    return [center[0] + (px - W / 2) * u, center[1] - (py - H / 2) * u];
  }

  /**
   * D3 Transform'undan Float64 Dünya Kamerasına Matematiksel Dönüşüm
   */
  private handleD3Transform(t: d3Zoom.ZoomTransform): void {
    if (!Number.isFinite(t.k) || !Number.isFinite(t.x) || !Number.isFinite(t.y) || t.k <= 0) {
      return;
    }

    let u = 1 / t.k;
    u = Math.max(this.uMin, Math.min(this.uMax, u));

    const { worldOrigin, width: W, height: H } = this.state;
    const [Ox, Oy] = worldOrigin;

    // Cx = Ox + (W/2 - tx) * u
    // Cy = Oy - (H/2 - ty) * u
    const Cx = Ox + (W / 2 - t.x) * u;
    const Cy = Oy - (H / 2 - t.y) * u;

    this.state.center = [Cx, Cy];
    this.state.unitsPerCssPixel = u;

    this.applyCameraState();
  }

  /**
   * Three.js OrthographicCamera parametrelerini ve view matrix'ini günceller
   */
  public applyCameraState(): void {
    const { unitsPerCssPixel: u, width: W, height: H } = this.state;

    this.threeCamera.left = (-W * u) / 2;
    this.threeCamera.right = (W * u) / 2;
    this.threeCamera.top = (H * u) / 2;
    this.threeCamera.bottom = (-H * u) / 2;
    this.threeCamera.near = 0.1;
    this.threeCamera.far = 10;
    this.threeCamera.position.set(0, 0, 1);
    this.threeCamera.lookAt(0, 0, 0);
    this.threeCamera.updateProjectionMatrix();

    if (this.onCameraChange) {
      this.onCameraChange(this.getState());
    }
    if (this.onInvalidate) {
      this.onInvalidate();
    }
  }

  /**
   * Çizimi sığdır (Fit View - F kısayolu)
   */
  /**
   * Çizimi sığdır (Fit View - F kısayolu)
   */
  public fit(bbox?: CadBBox2D): void {
    const targetBBox = bbox || this.fitBBox;
    const [minX, minY, maxX, maxY] = targetBBox;

    if (
      !Number.isFinite(minX) ||
      !Number.isFinite(maxX) ||
      !Number.isFinite(minY) ||
      !Number.isFinite(maxY) ||
      maxX < minX ||
      maxY < minY
    ) {
      // Geçersiz / boş sınır kutusu: önceki geçerli kamera korunur (28_PAN_ZOOM_FIT_SOZLESMESI)
      return;
    }

    const W = this.state.width;
    const H = this.state.height;

    const bW = Math.max(1e-6, maxX - minX);
    const bH = Math.max(1e-6, maxY - minY);
    const m = Math.min(32, 0.1 * Math.min(W, H));

    const uFit = Math.max(bW / Math.max(1, W - 2 * m), bH / Math.max(1, H - 2 * m));
    const Cx = (minX + maxX) / 2;
    const Cy = (minY + maxY) / 2;

    this.state.center = [Cx, Cy];
    this.state.unitsPerCssPixel = Math.max(this.uMin, Math.min(this.uMax, uFit));

    // D3 transformunu güncelle
    const [Ox, Oy] = this.state.worldOrigin;
    const u = this.state.unitsPerCssPixel;
    const k = 1 / u;
    const tx = W / 2 - (Cx - Ox) * k;
    const ty = H / 2 + (Cy - Oy) * k;

    this.selection.call(this.zoomBehavior.transform, d3Zoom.zoomIdentity.translate(tx, ty).scale(k));
    this.applyCameraState();
  }

  public setFitBBox(bbox: CadBBox2D): void {
    this.fitBBox = bbox;
  }

  /**
   * Merkez noktaya göre zoom in (+)
   */
  public zoomIn(): void {
    this.selection.call(this.zoomBehavior.scaleBy, 1.25);
  }

  /**
   * Merkez noktaya göre zoom out (-)
   */
  public zoomOut(): void {
    this.selection.call(this.zoomBehavior.scaleBy, 1 / 1.25);
  }

  public setPanToolActive(active: boolean): void {
    this.panToolActive = active;
    if (this.onPanToolChange) {
      this.onPanToolChange(active);
    }
  }

  /**
   * D3 Transform'unu güncel Float64 kamera durumuna göre senkronize eder
   */
  public syncD3Transform(): void {
    if (this.isDisposed) return;
    const { center, worldOrigin, unitsPerCssPixel: u, width: W, height: H } = this.state;
    const [Ox, Oy] = worldOrigin;
    const [Cx, Cy] = center;
    const k = 1 / u;
    const tx = W / 2 - (Cx - Ox) * k;
    const ty = H / 2 + (Cy - Oy) * k;
    this.selection.call(this.zoomBehavior.transform, d3Zoom.zoomIdentity.translate(tx, ty).scale(k));
  }

  /**
   * Pencere/ekran boyutu değiştiğinde çağrılır
   */
  public resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.state.width = width;
    this.state.height = height;
    this.zoomBehavior.extent([
      [0, 0],
      [width, height],
    ]);
    this.syncD3Transform();
    this.applyCameraState();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const targetTag = (e?.target as { tagName?: string } | null | undefined)?.tagName?.toLowerCase?.();
    if (
      targetTag === "input" ||
      targetTag === "textarea" ||
      (typeof HTMLInputElement !== "undefined" && e.target instanceof HTMLInputElement) ||
      (typeof HTMLTextAreaElement !== "undefined" && e.target instanceof HTMLTextAreaElement)
    ) {
      return;
    }

    if (e.code === "Space" && !this.isSpaceDown) {
      this.isSpaceDown = true;
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      this.zoomIn();
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      this.zoomOut();
    } else if (e.key === "f" || e.key === "F") {
      e.preventDefault();
      this.fit(this.fitBBox);
    } else if (e.key === "h" || e.key === "H") {
      e.preventDefault();
      this.setPanToolActive(!this.panToolActive);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.panDelta(0, e.shiftKey ? 160 : 40);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      this.panDelta(0, e.shiftKey ? -160 : -40);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      this.panDelta(e.shiftKey ? 160 : 40, 0);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      this.panDelta(e.shiftKey ? -160 : -40, 0);
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (e.code === "Space") {
      this.isSpaceDown = false;
    }
  }

  private panDelta(dxPx: number, dyPx: number): void {
    const u = this.state.unitsPerCssPixel;
    this.state.center[0] -= dxPx * u;
    this.state.center[1] += dyPx * u;
    this.syncD3Transform();
    this.applyCameraState();
  }

  /**
   * Yaşam döngüsü temizliği: tüm dinleyicileri serbest bırak
   */
  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.inputGeneration++;

    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.boundKeyDown);
      window.removeEventListener("keyup", this.boundKeyUp);
      if (this.boundBlur) {
        window.removeEventListener("blur", this.boundBlur);
      }
    }

    if (this.inputElement) {
      if (this.boundWheelGuard) {
        this.inputElement.removeEventListener("wheel", this.boundWheelGuard, { capture: true } as any);
      }
      if (this.boundMouseDown) {
        this.inputElement.removeEventListener("mousedown", this.boundMouseDown);
      }
    }

    this.selection.on(".zoom", null);
  }
}
