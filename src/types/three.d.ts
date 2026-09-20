// ============================================================================
// THREE.JS 0.172.0 TYPE DEFINITION SHIM FOR CAD V2
// ============================================================================

declare module "three" {
  export class Scene {
    constructor();
    add(...object: any[]): this;
    remove(...object: any[]): this;
    clear(): this;
    position: Vector3;
  }

  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): this;
  }

  export class Group {
    constructor();
    add(...object: any[]): this;
    remove(...object: any[]): this;
    position: Vector3;
    children: any[];
  }

  export class OrthographicCamera {
    constructor(
      left: number,
      right: number,
      top: number,
      bottom: number,
      near?: number,
      far?: number
    );
    left: number;
    right: number;
    top: number;
    bottom: number;
    near: number;
    far: number;
    position: Vector3;
    lookAt(x: number | Vector3, y?: number, z?: number): void;
    updateProjectionMatrix(): void;
  }

  export class WebGLRenderer {
    constructor(parameters?: {
      canvas?: HTMLCanvasElement | OffscreenCanvas;
      antialias?: boolean;
      alpha?: boolean;
      premultipliedAlpha?: boolean;
      preserveDrawingBuffer?: boolean;
      stencil?: boolean;
      depth?: boolean;
      powerPreference?: string;
    });
    setPixelRatio(value: number): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
    setClearColor(color: number | Color, alpha?: number): void;
    render(scene: Scene, camera: OrthographicCamera): void;
    dispose(): void;
    sortObjects: boolean;
    outputColorSpace: string;
    domElement: HTMLCanvasElement;
  }

  export class Color {
    constructor(r?: number | string, g?: number, b?: number);
    r: number;
    g: number;
    b: number;
    set(value: number | string): this;
    setHex(hex: number): this;
  }

  export class BufferGeometry {
    constructor();
    setAttribute(name: string, attribute: any): this;
    getAttribute(name: string): any;
    attributes: Record<string, any>;
    dispose(): void;
  }

  export class Material {
    dispose(): void;
    transparent?: boolean;
    opacity?: number;
    fragmentShader?: string;
    [key: string]: any;
  }

  export class BufferAttribute {
    constructor(array: ArrayLike<number>, itemSize: number);
    array: ArrayLike<number>;
    itemSize: number;
    count: number;
    needsUpdate: boolean;
  }

  export class Float32BufferAttribute {
    constructor(array: ArrayLike<number>, itemSize: number);
  }

  export class LineBasicMaterial {
    constructor(parameters?: {
      color?: number | Color;
      linewidth?: number;
      vertexColors?: boolean;
      transparent?: boolean;
      opacity?: number;
      depthTest?: boolean;
      depthWrite?: boolean;
    });
    color: Color;
    linewidth?: number;
    vertexColors?: boolean;
    transparent?: boolean;
    opacity?: number;
    needsUpdate?: boolean;
    dispose(): void;
  }

  export class LineSegments {
    constructor(geometry?: BufferGeometry, material?: LineBasicMaterial | Material);
    position: Vector3;
    name: string;
    visible: boolean;
    geometry: BufferGeometry;
    material: LineBasicMaterial | Material;
  }

  export const SRGBColorSpace: string;
}
