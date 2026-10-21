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

  export class Matrix4 {
    makeTranslation(x: number, y: number, z: number): this;
  }

  export class Group {
    constructor();
    add(...object: any[]): this;
    remove(...object: any[]): this;
    position: Vector3;
    children: any[];
    userData: Record<string, any>;
    visible: boolean;
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
    getContext(): WebGLRenderingContext | WebGL2RenderingContext;
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

  export class InstancedBufferGeometry extends BufferGeometry {
    instanceCount: number;
  }

  export class Texture {
    isTexture: true;
    image?: { data?: ArrayBufferView; width?: number; height?: number };
    dispose(): void;
  }

  export class DataTexture extends Texture {
    constructor(data: ArrayBufferView, width: number, height: number, format?: number, type?: number);
    minFilter: number;
    magFilter: number;
    generateMipmaps: boolean;
    flipY: boolean;
    needsUpdate: boolean;
  }

  export class Material {
    dispose(): void;
    transparent?: boolean;
    opacity?: number;
    userData?: Record<string, any>;
    fragmentShader?: string;
    [key: string]: any;
  }

  export class ShaderMaterial extends Material {
    constructor(parameters?: {
      transparent?: boolean;
      depthTest?: boolean;
      depthWrite?: boolean;
      glslVersion?: string;
      uniforms?: Record<string, { value: unknown }>;
      vertexShader?: string;
      fragmentShader?: string;
    });
    uniforms: Record<string, { value: any }>;
    vertexShader: string;
    fragmentShader: string;
  }

  export class BufferAttribute {
    constructor(array: ArrayLike<number>, itemSize: number, normalized?: boolean);
    array: ArrayLike<number>;
    itemSize: number;
    count: number;
    normalized: boolean;
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
    userData?: Record<string, any>;
    needsUpdate?: boolean;
    dispose(): void;
  }

  export class LineDashedMaterial extends LineBasicMaterial {
    constructor(parameters?: {
      color?: number | Color;
      linewidth?: number;
      transparent?: boolean;
      opacity?: number;
      depthTest?: boolean;
      depthWrite?: boolean;
      dashSize?: number;
      gapSize?: number;
      scale?: number;
    });
    dashSize: number;
    gapSize: number;
    scale: number;
  }

  export class LineSegments {
    constructor(geometry?: BufferGeometry, material?: LineBasicMaterial | Material);
    position: Vector3;
    name: string;
    visible: boolean;
    geometry: BufferGeometry;
    material: LineBasicMaterial | Material;
    renderOrder: number;
    userData: Record<string, any>;
  }

  export class MeshBasicMaterial extends Material {
    constructor(parameters?: {
      color?: number | Color;
      side?: number;
      transparent?: boolean;
      opacity?: number;
      depthTest?: boolean;
      depthWrite?: boolean;
    });
    color: Color;
    side?: number;
    transparent?: boolean;
    opacity?: number;
    needsUpdate?: boolean;
    userData?: Record<string, any>;
    dispose(): void;
  }

  export class Mesh {
    constructor(geometry?: BufferGeometry, material?: Material);
    position: Vector3;
    name: string;
    visible: boolean;
    geometry: BufferGeometry;
    material: Material;
    renderOrder: number;
    userData: Record<string, any>;
    frustumCulled: boolean;
  }

  export class BatchedMesh extends Mesh {
    setMatrixAt(instanceId: number, matrix: Matrix4): this;
    setColorAt(instanceId: number, color: Color): this;
    setVisibleAt(instanceId: number, visible: boolean): this;
  }

  export const DoubleSide: number;
  export const RGBAFormat: number;
  export const FloatType: number;
  export const NearestFilter: number;
  export const GLSL3: string;
  export const SRGBColorSpace: string;
}

declare module "three/src/objects/BatchedMesh.js" {
  export const BatchedMesh: any;
}
