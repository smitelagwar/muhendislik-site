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
    background: Color | Texture | null;
  }

  export class Euler {
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number, order?: string): this;
  }

  export class Plane {
    constructor(normal?: Vector3, constant?: number);
    normal: Vector3;
    constant: number;
    set(normal: Vector3, constant: number): this;
  }

  export class Vector2 {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
    set(x: number, y: number): this;
    copy(v: Vector2): this;
    clone(): Vector2;
  }

  export interface Intersection {
    distance: number;
    point: Vector3;
    object: any;
    instanceId?: number;
    faceIndex?: number | null;
  }

  export class Raycaster {
    constructor(origin?: Vector3, direction?: Vector3, near?: number, far?: number);
    setFromCamera(coords: Vector2, camera: PerspectiveCamera | OrthographicCamera): void;
    intersectObjects(objects: any[], recursive?: boolean, optionalTarget?: Intersection[]): Intersection[];
  }

  export class Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;
    setFromUnitVectors(vFrom: Vector3, vTo: Vector3): this;
    copy(q: Quaternion): this;
  }

  export class Spherical {
    constructor(radius?: number, phi?: number, theta?: number);
    radius: number;
    phi: number;
    theta: number;
    setFromVector3(v: Vector3): this;
  }

  export const MathUtils: {
    clamp(value: number, min: number, max: number): number;
    degToRad(degrees: number): number;
    radToDeg(radians: number): number;
  };

  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): this;
    setScalar(scalar: number): this;
    copy(v: Vector3): this;
    clone(): Vector3;
    add(v: Vector3): this;
    addVectors(a: Vector3, b: Vector3): this;
    sub(v: Vector3): this;
    subVectors(a: Vector3, b: Vector3): this;
    multiplyScalar(scalar: number): this;
    length(): number;
    setLength(length: number): this;
    normalize(): this;
    dot(v: Vector3): number;
  }

  export class Matrix4 {
    constructor();
    makeTranslation(x: number, y: number, z: number): this;
    compose(position: Vector3, quaternion: Quaternion, scale: Vector3): this;
    identity(): this;
  }

  export class Group {
    constructor();
    add(...object: any[]): this;
    remove(...object: any[]): this;
    position: Vector3;
    rotation: Euler;
    scale: Vector3;
    quaternion: Quaternion;
    name: string;
    children: any[];
    userData: Record<string, any>;
    visible: boolean;
  }

  export class PerspectiveCamera {
    constructor(fov?: number, aspect?: number, near?: number, far?: number);
    fov: number;
    aspect: number;
    near: number;
    far: number;
    position: Vector3;
    lookAt(x: number | Vector3, y?: number, z?: number): void;
    updateProjectionMatrix(): void;
  }

  export class AmbientLight {
    constructor(color?: number | Color | string, intensity?: number);
    color: Color;
    intensity: number;
    position: Vector3;
  }

  export class DirectionalLight {
    constructor(color?: number | Color | string, intensity?: number);
    color: Color;
    intensity: number;
    position: Vector3;
  }

  export class GridHelper {
    constructor(
      size?: number,
      divisions?: number,
      color1?: number | Color | string,
      color2?: number | Color | string
    );
    geometry: BufferGeometry;
    material: Material | Material[];
    position: Vector3;
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
    render(scene: Scene, camera: OrthographicCamera | PerspectiveCamera): void;
    getContext(): WebGLRenderingContext | WebGL2RenderingContext;
    dispose(): void;
    sortObjects: boolean;
    localClippingEnabled: boolean;
    clippingPlanes: Plane[];
    outputColorSpace: string;
    domElement: HTMLCanvasElement;
    info: {
      render: {
        calls: number;
        triangles: number;
        points: number;
        lines: number;
      };
      memory: {
        geometries: number;
        textures: number;
      };
    };
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

  export class BoxGeometry extends BufferGeometry {
    constructor(
      width?: number,
      height?: number,
      depth?: number,
      widthSegments?: number,
      heightSegments?: number,
      depthSegments?: number
    );
  }

  export class CylinderGeometry extends BufferGeometry {
    constructor(
      radiusTop?: number,
      radiusBottom?: number,
      height?: number,
      radialSegments?: number,
      heightSegments?: number,
      openEnded?: boolean
    );
  }

  export class SphereGeometry extends BufferGeometry {
    constructor(
      radius?: number,
      widthSegments?: number,
      heightSegments?: number
    );
  }

  export class EdgesGeometry extends BufferGeometry {
    constructor(geometry?: BufferGeometry, thresholdAngle?: number);
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
    clippingPlanes?: Plane[] | null;
    clipShadows?: boolean;
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

  export class LineBasicMaterial extends Material {
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
    clippingPlanes?: Plane[] | null;
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

  export class MeshStandardMaterial extends Material {
    constructor(parameters?: {
      color?: number | Color | string;
      emissive?: number | Color | string;
      emissiveIntensity?: number;
      roughness?: number;
      metalness?: number;
      side?: number;
      transparent?: boolean;
      opacity?: number;
      depthTest?: boolean;
      depthWrite?: boolean;
    });
    color: Color;
    emissive: Color;
    emissiveIntensity: number;
    roughness: number;
    metalness: number;
    side?: number;
    transparent?: boolean;
    opacity?: number;
    needsUpdate?: boolean;
    dispose(): void;
  }

  export class MeshPhysicalMaterial extends MeshStandardMaterial {
    constructor(parameters?: {
      color?: number | Color | string;
      roughness?: number;
      metalness?: number;
      side?: number;
      transparent?: boolean;
      opacity?: number;
      depthTest?: boolean;
      depthWrite?: boolean;
    });
  }

  export class Mesh {
    constructor(geometry?: BufferGeometry, material?: Material);
    position: Vector3;
    rotation: Euler;
    scale: Vector3;
    quaternion: Quaternion;
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

  export class InstancedMesh extends Mesh {
    constructor(geometry: BufferGeometry, material: Material, count: number);
    count: number;
    instanceMatrix: BufferAttribute;
    instanceColor: BufferAttribute | null;
    setMatrixAt(index: number, matrix: Matrix4): void;
    getMatrixAt(index: number, matrix: Matrix4): void;
    setColorAt(index: number, color: Color): void;
    computeBoundingSphere(): void;
    dispose(): void;
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

declare module "three/examples/jsm/controls/OrbitControls.js" {
  import { PerspectiveCamera, OrthographicCamera, Vector3 } from "three";

  export class OrbitControls {
    constructor(
      object: PerspectiveCamera | OrthographicCamera,
      domElement?: HTMLElement | null
    );
    target: Vector3;
    enableDamping: boolean;
    dampingFactor: number;
    screenSpacePanning: boolean;
    minDistance: number;
    maxDistance: number;
    maxPolarAngle: number;
    minPolarAngle: number;
    rotateSpeed: number;
    zoomSpeed: number;
    panSpeed: number;
    update(): boolean;
    dispose(): void;
    addEventListener(type: string, listener: (event?: unknown) => void): void;
    removeEventListener(type: string, listener: (event?: unknown) => void): void;
  }
}
