import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type {
  ArcSegment3Mm,
  CameraPresetId,
  ConcreteVolumePart,
  DetailModel,
  DimensionMarkerMm,
  LayerVisibilityMask,
  Point3Mm,
  RebarPathPart,
  SimulationLayerId,
} from "../core/types";
import {
  DEFAULT_LAYER_VISIBILITY,
  DEFAULT_SECTION_ELEVATION_Z_MM,
  type SimulationSectionState,
} from "../state/view-reducer";

const MM_TO_M = 0.001;

/**
 * Domain koordinatlarını (X, Y yatay; Z düşey; mm)
 * Three.js sahne koordinatlarına (X sağ, Y yukarı, Z öne; metre) dönüştürür.
 */
export function domainMmToThreeMeters(pointMm: Point3Mm): THREE.Vector3 {
  return new THREE.Vector3(
    pointMm.x * MM_TO_M,
    pointMm.z * MM_TO_M,
    -pointMm.y * MM_TO_M,
  );
}

/**
 * Yay segmentini düz çizgi dilimlerine dönüştürür (hem 3B instanced render hem de doğrulama için).
 */
export function sampleArcSegment3Mm(
  arc: ArcSegment3Mm,
  subdivisions = 6,
): Array<{ start: Point3Mm; end: Point3Mm }> {
  const steps = Math.max(subdivisions, 3);
  const delta = (arc.endAngleRad - arc.startAngleRad) / steps;
  const chords: Array<{ start: Point3Mm; end: Point3Mm }> = [];

  const pointAt = (angle: number): Point3Mm => {
    const c = Math.cos(angle) * arc.radiusMm;
    const s = Math.sin(angle) * arc.radiusMm;
    if (arc.plane === "xz") {
      return {
        x: arc.center.x + c,
        y: arc.center.y,
        z: arc.center.z + s,
      };
    }
    if (arc.plane === "yz") {
      return {
        x: arc.center.x,
        y: arc.center.y + c,
        z: arc.center.z + s,
      };
    }
    return {
      x: arc.center.x + c,
      y: arc.center.y + s,
      z: arc.center.z,
    };
  };

  let prev = pointAt(arc.startAngleRad);
  for (let i = 1; i <= steps; i++) {
    const next = pointAt(arc.startAngleRad + delta * i);
    chords.push({ start: prev, end: next });
    prev = next;
  }
  return chords;
}

export type SimulationQualityProfile = "balanced" | "light";

export interface SimulationProfileGeometryMetrics {
  qualityProfile: SimulationQualityProfile;
  logicalPartCount: number;
  cylinderRadialSegments: number;
  arcSubdivisions: number;
  totalInstancedSegments: number;
  estimatedTriangles: number;
  maxAllowedParts: number;
  maxAllowedTrianglesLight: number;
  maxAllowedDrawCalls: number;
  withinPartBudget: boolean;
  withinTriangleBudget: boolean;
}

export function estimateSceneProfileGeometryMetrics(
  model: DetailModel,
  qualityProfile: SimulationQualityProfile = "balanced",
): SimulationProfileGeometryMetrics {
  const cylinderRadialSegments = qualityProfile === "light" ? 8 : 14;
  const arcSubdivisions = qualityProfile === "light" ? 4 : 6;

  let totalInstancedSegments = 0;
  let concreteBoxCount = 0;

  for (const part of model.parts) {
    if (part.kind === "concrete") {
      concreteBoxCount += 1;
    } else {
      for (const seg of part.segments) {
        if (seg.kind === "line") {
          totalInstancedSegments += 1;
        } else {
          totalInstancedSegments += Math.max(arcSubdivisions, 3);
        }
      }
    }
  }

  // Bir birim silindirde yan yüzey 2*radial + alt/üst kapaklar 2*radial = 4*radial üçgen
  const trianglesPerCylinder = cylinderRadialSegments * 4;
  const estimatedTriangles =
    concreteBoxCount * 12 + totalInstancedSegments * trianglesPerCylinder;

  const maxAllowedParts = 2_000;
  const maxAllowedTrianglesLight = 150_000;
  const maxAllowedDrawCalls = 150;

  return {
    qualityProfile,
    logicalPartCount: model.counts.totalParts,
    cylinderRadialSegments,
    arcSubdivisions,
    totalInstancedSegments,
    estimatedTriangles,
    maxAllowedParts,
    maxAllowedTrianglesLight,
    maxAllowedDrawCalls,
    withinPartBudget: model.counts.totalParts <= maxAllowedParts,
    withinTriangleBudget: estimatedTriangles <= maxAllowedTrianglesLight,
  };
}

export interface SimulationEngineDiagnostics {
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  renderedFrames: number;
  ownedGeometryCount: number;
  ownedMaterialCount: number;
  qualityProfile: SimulationQualityProfile;
  concreteVisible: boolean;
  layerVisibility: LayerVisibilityMask;
  selectedPartId: string | null;
  sectionEnabled: boolean;
  sectionElevationZMm: number;
  concreteCapVisible: boolean;
  explodePercent: number;
  cameraPreset: CameraPresetId;
  orbitPolarRad: number;
  orbitAzimuthRad: number;
  cameraDistanceM: number;
  canvasCount: number;
  rafPending: boolean;
  instancedPartMapSize: number;
  isDisposed: boolean;
}

export interface SimulationThreeController {
  setConcreteVisible: (visible: boolean) => void;
  setLayerVisibility: (layers: LayerVisibilityMask) => void;
  setSelectedPartId: (partId: string | null) => void;
  setSectionState: (section: SimulationSectionState) => void;
  setExplodePercent: (explodePercent: number) => void;
  focusSelectedPart: () => void;
  pickPartAtClientPoint: (clientX: number, clientY: number) => string | null;
  resolveInstancePartId: (layerId: SimulationLayerId, instanceId: number) => string | null;
  setCameraPreset: (preset: CameraPresetId) => void;
  fitToModel: () => void;
  zoomByStep: (direction: "in" | "out") => void;
  resetView: () => void;
  setThemeMode: (isDark: boolean) => void;
  simulateContextLossForTest: () => void;
  getDiagnostics: () => SimulationEngineDiagnostics;
  dispose: () => void;
}

export function isWebGLAvailable(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  try {
    const testCanvas = document.createElement("canvas");
    const gl =
      testCanvas.getContext("webgl2") ||
      testCanvas.getContext("webgl") ||
      testCanvas.getContext("experimental-webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}

interface InstanceSegmentRecord {
  partId: string;
  layerId: Exclude<SimulationLayerId, "concrete" | "dimensions">;
  baseColorHex: string;
  startM: THREE.Vector3;
  endM: THREE.Vector3;
  radiusM: number;
}

export function createSimulationThreeScene(options: {
  container: HTMLElement;
  model: DetailModel;
  qualityProfile?: SimulationQualityProfile;
  initialLayers?: LayerVisibilityMask;
  initialSelectedPartId?: string | null;
  initialSection?: SimulationSectionState;
  initialExplodePercent?: number;
  isDarkTheme?: boolean;
  onDiagnosticsChange?: (diag: SimulationEngineDiagnostics) => void;
  onPartPicked?: (partId: string | null) => void;
  onContextLost?: () => void;
}): SimulationThreeController {
  const {
    container,
    model,
    qualityProfile: requestedQualityProfile,
    initialLayers = DEFAULT_LAYER_VISIBILITY,
    initialSelectedPartId = null,
    initialSection = {
      enabled: false,
      elevationZMm: DEFAULT_SECTION_ELEVATION_Z_MM,
    },
    initialExplodePercent = 0,
    isDarkTheme = true,
    onDiagnosticsChange,
    onPartPicked,
    onContextLost,
  } = options;

  // Radye gibi yoğun ızgaralı sahnelerde veya bütçe kontrolünde Hafif profil seçeneği
  const qualityProfile: SimulationQualityProfile =
    requestedQualityProfile ??
    (model.slug === "radye-temel" ? "light" : "balanced");
  const profileMetrics = estimateSceneProfileGeometryMetrics(model, qualityProfile);

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const ownedGeometries = new Set<THREE.BufferGeometry>();
  const ownedMaterials = new Set<THREE.Material>();

  const trackGeometry = <T extends THREE.BufferGeometry>(geo: T): T => {
    ownedGeometries.add(geo);
    return geo;
  };
  const trackMaterial = <T extends THREE.Material>(mat: T): T => {
    ownedMaterials.add(mat);
    return mat;
  };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(isDarkTheme ? 0x0b0a18 : 0xf4f5f8);

  const width = Math.max(container.clientWidth || 640, 120);
  const height = Math.max(container.clientHeight || 480, 120);

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.04, 80);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.localClippingEnabled = true;
  const maxDpr =
    qualityProfile === "light"
      ? 1
      : Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(maxDpr);
  renderer.setSize(width, height, false);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  renderer.domElement.setAttribute("data-testid", "simulation-3d-canvas");
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.screenSpacePanning = true;
  controls.minDistance = 0.25;
  controls.maxDistance = 18;
  controls.maxPolarAngle = Math.PI * 0.95;

  const ambientLight = new THREE.AmbientLight(0xffffff, isDarkTheme ? 0.88 : 0.96);
  scene.add(ambientLight);

  const dirLightMain = new THREE.DirectionalLight(0xffffff, isDarkTheme ? 1.18 : 1.08);
  dirLightMain.position.set(5, 8, 6);
  scene.add(dirLightMain);

  const dirLightFill = new THREE.DirectionalLight(0x93c5fd, 0.48);
  dirLightFill.position.set(-5, 3, -4);
  scene.add(dirLightFill);

  const gridHelper = new THREE.GridHelper(
    2.4,
    12,
    isDarkTheme ? 0x4c1d95 : 0x94a3b8,
    isDarkTheme ? 0x1e1b4b : 0xcbd5e1,
  );
  if (Array.isArray(gridHelper.material)) {
    gridHelper.material.forEach((m: THREE.Material) => trackMaterial(m));
  } else {
    trackMaterial(gridHelper.material);
  }
  trackGeometry(gridHelper.geometry);
  scene.add(gridHelper);

  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const layerGroups: Record<SimulationLayerId, THREE.Group> = {
    concrete: new THREE.Group(),
    longitudinal: new THREE.Group(),
    stirrup: new THREE.Group(),
    dowel: new THREE.Group(),
    crosstie: new THREE.Group(),
    dimensions: new THREE.Group(),
  };

  (Object.keys(layerGroups) as SimulationLayerId[]).forEach((layerKey) => {
    layerGroups[layerKey].name = `layer-${layerKey}`;
    rootGroup.add(layerGroups[layerKey]);
  });

  const isHorizontalBeam =
    model.slug === "kiris-detayi" || model.primaryAxis === "x";

  // Kesit düzlemi: Kolonda Three.js Y ekseni (domain Z düşey ekseni), kirişte Three.js X ekseni (domain X açıklık ekseni) boyunca keser
  const horizontalClippingPlane = new THREE.Plane(
    isHorizontalBeam ? new THREE.Vector3(-1, 0, 0) : new THREE.Vector3(0, -1, 0),
    initialSection.elevationZMm * MM_TO_M,
  );

  const concreteBodyMaterial = trackMaterial(
    new THREE.MeshPhysicalMaterial({
      color: isDarkTheme ? 0x94a3b8 : 0x64748b,
      transparent: true,
      opacity: isDarkTheme ? 0.22 : 0.25,
      roughness: 0.45,
      metalness: 0.05,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );

  const concreteEdgeMaterial = trackMaterial(
    new THREE.LineBasicMaterial({
      color: isDarkTheme ? 0xcbd5e1 : 0x475569,
      transparent: true,
      opacity: 0.58,
    }),
  );

  // Kesilen beton yüzünü açık boş kabuk bırakmamak için kapatan basit prizma kapağı
  const concreteCapMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: isDarkTheme ? 0x475569 : 0x94a3b8,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.14,
      roughness: 0.55,
      metalness: 0.1,
      side: THREE.DoubleSide,
    }),
  );

  const concreteCapRingMaterial = trackMaterial(
    new THREE.LineBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.95,
    }),
  );

  const unitCylinderGeo = trackGeometry(
    new THREE.CylinderGeometry(
      1,
      1,
      1,
      profileMetrics.cylinderRadialSegments,
      1,
      false,
    ),
  );

  const instancedBarMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.34,
      metalness: 0.62,
    }),
  );

  const partBoundsMap = new Map<string, { min: THREE.Vector3; max: THREE.Vector3 }>();

  const registerPointForPartBounds = (partId: string, pt: THREE.Vector3, padM = 0.015) => {
    const existing = partBoundsMap.get(partId);
    if (!existing) {
      partBoundsMap.set(partId, {
        min: new THREE.Vector3(pt.x - padM, pt.y - padM, pt.z - padM),
        max: new THREE.Vector3(pt.x + padM, pt.y + padM, pt.z + padM),
      });
      return;
    }
    existing.min.x = Math.min(existing.min.x, pt.x - padM);
    existing.min.y = Math.min(existing.min.y, pt.y - padM);
    existing.min.z = Math.min(existing.min.z, pt.z - padM);
    existing.max.x = Math.max(existing.max.x, pt.x + padM);
    existing.max.y = Math.max(existing.max.y, pt.y + padM);
    existing.max.z = Math.max(existing.max.z, pt.z + padM);
  };

  let concreteMeshRef: THREE.Mesh | null = null;
  let concreteCapGroupRef: THREE.Group | null = null;
  const concreteMeshes: THREE.Mesh[] = [];

  function addConcretePart(part: ConcreteVolumePart) {
    const sx = part.sizeMm.widthX * MM_TO_M;
    const sy = part.sizeMm.heightZ * MM_TO_M;
    const sz = part.sizeMm.depthY * MM_TO_M;

    const boxGeo = trackGeometry(new THREE.BoxGeometry(sx, sy, sz));
    const mesh = new THREE.Mesh(boxGeo, concreteBodyMaterial);
    const center = domainMmToThreeMeters(part.centerMm);
    mesh.position.copy(center);
    mesh.userData = { partId: part.id, layerId: "concrete" };
    mesh.renderOrder = 3;
    concreteMeshes.push(mesh);

    const isPrimaryConcreteBody =
      part.id === "concrete-column-body" ||
      part.id === "concrete-beam-body" ||
      part.id === "concrete-footing-body";
    if (isPrimaryConcreteBody || !concreteMeshRef) {
      concreteMeshRef = mesh;
    }

    const edgesGeo = trackGeometry(new THREE.EdgesGeometry(boxGeo));
    const wireframe = new THREE.LineSegments(edgesGeo, concreteEdgeMaterial);
    wireframe.position.copy(center);
    wireframe.renderOrder = 4;

    if (isPrimaryConcreteBody) {
      // Kesik beton yüzü kapak prizması (kalınlık 4 mm)
      const capThicknessM = 0.004;
      const capGeo = trackGeometry(
        isHorizontalBeam
          ? new THREE.BoxGeometry(capThicknessM, sy, sz)
          : new THREE.BoxGeometry(sx, capThicknessM, sz),
      );
      const capMesh = new THREE.Mesh(capGeo, concreteCapMaterial);
      capMesh.userData = { partId: part.id, isConcreteSectionCap: true };

      const capEdgesGeo = trackGeometry(new THREE.EdgesGeometry(capGeo));
      const capOutline = new THREE.LineSegments(capEdgesGeo, concreteCapRingMaterial);

      const capGroup = new THREE.Group();
      capGroup.name = "concrete-section-cap";
      capGroup.add(capMesh);
      capGroup.add(capOutline);
      capGroup.visible = false;
      concreteCapGroupRef = capGroup;
      layerGroups.concrete.add(capGroup);
    }

    layerGroups.concrete.add(mesh);
    layerGroups.concrete.add(wireframe);

    partBoundsMap.set(part.id, {
      min: new THREE.Vector3(center.x - sx / 2, center.y - sy / 2, center.z - sz / 2),
      max: new THREE.Vector3(center.x + sx / 2, center.y + sy / 2, center.z + sz / 2),
    });
  }

  function addDimensionMarkers(markers: DimensionMarkerMm[]) {
    for (const marker of markers) {
      const start = domainMmToThreeMeters(marker.startMm);
      const end = domainMmToThreeMeters(marker.endMm);
      const positions = new Float32Array([
        start.x,
        start.y,
        start.z,
        end.x,
        end.y,
        end.z,
      ]);
      const geo = trackGeometry(new THREE.BufferGeometry());
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      const mat = trackMaterial(
        new THREE.LineBasicMaterial({
          color: new THREE.Color(marker.colorHex),
          transparent: true,
          opacity: 0.85,
        }),
      );
      const line = new THREE.LineSegments(geo, mat);
      layerGroups.dimensions.add(line);
    }
  }

  const segmentsByLayer: Record<
    Exclude<SimulationLayerId, "concrete" | "dimensions">,
    InstanceSegmentRecord[]
  > = {
    longitudinal: [],
    stirrup: [],
    dowel: [],
    crosstie: [],
  };

  function collectRebarSegments(part: RebarPathPart) {
    const radiusM = (part.diameterMm / 2) * MM_TO_M;
    const bucket = segmentsByLayer[part.layerId];

    for (const seg of part.segments) {
      if (seg.kind === "line") {
        const startM = domainMmToThreeMeters(seg.start);
        const endM = domainMmToThreeMeters(seg.end);
        if (new THREE.Vector3().subVectors(endM, startM).length() <= 1e-6) continue;
        bucket.push({
          partId: part.id,
          layerId: part.layerId,
          baseColorHex: part.colorHex,
          startM,
          endM,
          radiusM,
        });
        registerPointForPartBounds(part.id, startM, radiusM * 2);
        registerPointForPartBounds(part.id, endM, radiusM * 2);
      } else if (seg.kind === "arc") {
        const chords = sampleArcSegment3Mm(seg, profileMetrics.arcSubdivisions);
        for (const chord of chords) {
          const startM = domainMmToThreeMeters(chord.start);
          const endM = domainMmToThreeMeters(chord.end);
          if (new THREE.Vector3().subVectors(endM, startM).length() <= 1e-6) continue;
          bucket.push({
            partId: part.id,
            layerId: part.layerId,
            baseColorHex: part.colorHex,
            startM,
            endM,
            radiusM,
          });
          registerPointForPartBounds(part.id, startM, radiusM * 2);
          registerPointForPartBounds(part.id, endM, radiusM * 2);
        }
      }
    }
  }

  for (const part of model.parts) {
    if (part.kind === "concrete") {
      addConcretePart(part);
    } else {
      collectRebarSegments(part);
    }
  }
  addDimensionMarkers(model.dimensionMarkers);

  const upAxis = new THREE.Vector3(0, 1, 0);
  const instancedMeshByLayer = new Map<
    Exclude<SimulationLayerId, "concrete" | "dimensions">,
    THREE.InstancedMesh
  >();
  const instanceRecordsByLayer = new Map<
    Exclude<SimulationLayerId, "concrete" | "dimensions">,
    InstanceSegmentRecord[]
  >();

  let totalInstancedSegments = 0;

  (Object.keys(segmentsByLayer) as Array<
    Exclude<SimulationLayerId, "concrete" | "dimensions">
  >).forEach((layerId) => {
    const records = segmentsByLayer[layerId];
    instanceRecordsByLayer.set(layerId, records);
    if (records.length === 0) return;

    totalInstancedSegments += records.length;
    const instMesh = new THREE.InstancedMesh(
      unitCylinderGeo,
      instancedBarMaterial,
      records.length,
    );
    instMesh.userData = { layerId, isInstancedRebar: true };

    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();

    records.forEach((rec, idx) => {
      const delta = new THREE.Vector3().subVectors(rec.endM, rec.startM);
      const length = delta.length();
      const mid = new THREE.Vector3()
        .addVectors(rec.startM, rec.endM)
        .multiplyScalar(0.5);

      const dir = delta.clone().normalize();
      if (Math.abs(dir.dot(upAxis)) > 0.9999) {
        if (dir.y < 0) {
          quaternion.setFromUnitVectors(upAxis, new THREE.Vector3(0, -1, 0));
        } else {
          quaternion.setFromUnitVectors(upAxis, upAxis);
        }
      } else {
        quaternion.setFromUnitVectors(upAxis, dir);
      }

      scale.set(rec.radiusM, length, rec.radiusM);
      matrix.compose(mid, quaternion, scale);
      instMesh.setMatrixAt(idx, matrix);

      color.set(rec.baseColorHex);
      instMesh.setColorAt(idx, color);
    });

    instMesh.instanceMatrix.needsUpdate = true;
    if (instMesh.instanceColor) {
      instMesh.instanceColor.needsUpdate = true;
    }
    instMesh.computeBoundingSphere();

    instancedMeshByLayer.set(layerId, instMesh);
    layerGroups[layerId].add(instMesh);
  });

  let layerVisibility: LayerVisibilityMask = { ...initialLayers };
  let selectedPartId: string | null = initialSelectedPartId;
  let sectionState: SimulationSectionState = { ...initialSection };
  let explodePercent: number = Math.max(0, Math.min(100, Math.round(initialExplodePercent)));

  function syncLayerVisibility() {
    (Object.keys(layerGroups) as SimulationLayerId[]).forEach((layerKey) => {
      layerGroups[layerKey].visible = Boolean(layerVisibility[layerKey]);
    });
  }

  function syncExplodeTransform() {
    const f = Math.max(0, Math.min(100, explodePercent)) / 100;
    // Patlatma yalnız görsel layerGroup ötelemesidir; modelin gerçek mm ölçü hesabına asla karışmaz.
    layerGroups.concrete.position.set(-0.34 * f, 0, -0.22 * f);
    layerGroups.longitudinal.position.set(0, 0, 0);
    layerGroups.stirrup.position.set(0.32 * f, 0, 0.2 * f);
    layerGroups.crosstie.position.set(0.48 * f, 0, -0.22 * f);
    layerGroups.dowel.position.set(0, 0.24 * f, 0);
    layerGroups.dimensions.position.set(0, 0, 0);
  }

  function syncSectionClipping() {
    const cutCoordM = sectionState.elevationZMm * MM_TO_M;
    horizontalClippingPlane.constant = cutCoordM;

    const activePlanes = sectionState.enabled ? [horizontalClippingPlane] : null;
    concreteBodyMaterial.clippingPlanes = activePlanes;
    concreteEdgeMaterial.clippingPlanes = activePlanes;
    instancedBarMaterial.clippingPlanes = activePlanes;
    concreteBodyMaterial.needsUpdate = true;
    concreteEdgeMaterial.needsUpdate = true;
    instancedBarMaterial.needsUpdate = true;

    if (concreteCapGroupRef) {
      const inConcreteSpan =
        sectionState.elevationZMm > 0 &&
        sectionState.elevationZMm < model.dimensionsMm.concreteHeightZ;
      concreteCapGroupRef.visible =
        sectionState.enabled && layerVisibility.concrete && inConcreteSpan;
      if (isHorizontalBeam) {
        const beamMidYM = (model.dimensionsMm.depthY * 0.5) * MM_TO_M;
        concreteCapGroupRef.position.set(cutCoordM - 0.002, beamMidYM, 0);
      } else {
        concreteCapGroupRef.position.set(0, cutCoordM - 0.002, 0);
      }
    }
  }

  function syncSelectionHighlight() {
    const selectedColor = new THREE.Color("#f43f5e");
    const normalColor = new THREE.Color();

    instancedMeshByLayer.forEach((instMesh, layerId) => {
      const records = instanceRecordsByLayer.get(layerId) ?? [];
      records.forEach((rec, idx) => {
        if (selectedPartId && rec.partId === selectedPartId) {
          instMesh.setColorAt(idx, selectedColor);
        } else {
          normalColor.set(rec.baseColorHex);
          instMesh.setColorAt(idx, normalColor);
        }
      });
      if (instMesh.instanceColor) {
        instMesh.instanceColor.needsUpdate = true;
      }
    });

    if (concreteMeshRef) {
      const isConcreteSelected =
        selectedPartId === "concrete-column-body" ||
        selectedPartId === "concrete-beam-body" ||
        selectedPartId === "concrete-joint-beam" ||
        selectedPartId === "concrete-footing-body" ||
        selectedPartId === "concrete-lean-layer" ||
        selectedPartId === "concrete-support-left" ||
        selectedPartId === "concrete-support-right";
      concreteBodyMaterial.color.setHex(
        isConcreteSelected ? 0xf43f5e : isDarkTheme ? 0x94a3b8 : 0x64748b,
      );
      concreteBodyMaterial.opacity = isConcreteSelected
        ? 0.38
        : isDarkTheme
          ? 0.22
          : 0.25;
    }
  }

  syncLayerVisibility();
  syncExplodeTransform();
  syncSectionClipping();
  syncSelectionHighlight();

  let currentCameraPreset: CameraPresetId = "isometric";
  let rafId: number | null = null;
  let isDisposed = false;
  let renderedFrames = 0;

  const modelMin = domainMmToThreeMeters(model.boundsMm.min);
  const modelMax = domainMmToThreeMeters(model.boundsMm.max);
  const modelCenter = new THREE.Vector3(
    (modelMin.x + modelMax.x) * 0.5,
    (modelMin.y + modelMax.y) * 0.5,
    (modelMin.z + modelMax.z) * 0.5,
  );
  const modelSize = new THREE.Vector3(
    Math.abs(modelMax.x - modelMin.x),
    Math.abs(modelMax.y - modelMin.y),
    Math.abs(modelMax.z - modelMin.z),
  );
  const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z, 1.0);

  function computeDiagnostics(): SimulationEngineDiagnostics {
    const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    return {
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      renderedFrames,
      ownedGeometryCount: ownedGeometries.size,
      ownedMaterialCount: ownedMaterials.size,
      qualityProfile,
      concreteVisible: layerVisibility.concrete,
      layerVisibility: { ...layerVisibility },
      selectedPartId,
      sectionEnabled: sectionState.enabled,
      sectionElevationZMm: sectionState.elevationZMm,
      concreteCapVisible: Boolean(concreteCapGroupRef?.visible),
      explodePercent,
      cameraPreset: currentCameraPreset,
      orbitPolarRad: Number(spherical.phi.toFixed(4)),
      orbitAzimuthRad: Number(spherical.theta.toFixed(4)),
      cameraDistanceM: Number(spherical.radius.toFixed(3)),
      canvasCount: container.querySelectorAll("canvas").length,
      rafPending: rafId !== null,
      instancedPartMapSize: totalInstancedSegments,
      isDisposed,
    };
  }

  function renderFrame() {
    rafId = null;
    if (isDisposed || document.hidden) return;
    renderer.render(scene, camera);
    renderedFrames += 1;
    onDiagnosticsChange?.(computeDiagnostics());
  }

  function requestRender() {
    if (isDisposed || rafId !== null || document.hidden) return;
    rafId = window.requestAnimationFrame(renderFrame);
  }

  function applyCameraPreset(preset: CameraPresetId) {
    currentCameraPreset = preset;
    controls.target.copy(modelCenter);

    const dist = maxDim * 1.15;
    switch (preset) {
      case "front":
        camera.position.set(modelCenter.x, modelCenter.y, modelCenter.z + dist);
        break;
      case "right":
        camera.position.set(modelCenter.x + dist, modelCenter.y, modelCenter.z);
        break;
      case "top":
        camera.position.set(
          modelCenter.x,
          modelCenter.y + dist * 1.1,
          modelCenter.z + 0.01,
        );
        break;
      case "isometric":
      default:
        camera.position.set(
          modelCenter.x + dist * 0.62,
          modelCenter.y + dist * 0.35,
          modelCenter.z + dist * 0.72,
        );
        break;
    }

    camera.lookAt(modelCenter);
    controls.update();
    requestRender();
  }

  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();

  function pickPartAtClientPoint(clientX: number, clientY: number): string | null {
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    pointerNdc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointerNdc, camera);

    const cutCoordM = sectionState.enabled
      ? sectionState.elevationZMm * MM_TO_M
      : Infinity;

    const rebarPickTargets: THREE.InstancedMesh[] = [];
    instancedMeshByLayer.forEach((mesh, layerId) => {
      if (layerVisibility[layerId]) {
        rebarPickTargets.push(mesh);
      }
    });

    const rebarHits = raycaster.intersectObjects(rebarPickTargets, false);
    for (const hit of rebarHits) {
      const hitCoord = isHorizontalBeam ? hit.point.x : hit.point.y;
      if (hitCoord > cutCoordM + 1e-4) continue;
      const layerId = hit.object?.userData?.layerId as
        | Exclude<SimulationLayerId, "concrete" | "dimensions">
        | undefined;
      if (layerId && typeof hit.instanceId === "number") {
        const records = instanceRecordsByLayer.get(layerId);
        const rec = records?.[hit.instanceId];
        if (rec) {
          return rec.partId;
        }
      }
    }

    if (layerVisibility.concrete && concreteMeshes.length > 0) {
      const concreteHits = raycaster.intersectObjects(concreteMeshes, false);
      for (const hit of concreteHits) {
        const hitCoord = isHorizontalBeam ? hit.point.x : hit.point.y;
        if (hitCoord <= cutCoordM + 1e-4) {
          const pid = hit.object?.userData?.partId as string | undefined;
          return pid ?? (isHorizontalBeam ? "concrete-beam-body" : "concrete-column-body");
        }
      }
    }

    return null;
  }

  let pointerDownPos: { x: number; y: number } | null = null;
  const handlePointerDown = (ev: PointerEvent) => {
    if (ev.button !== 0 && ev.pointerType === "mouse") return;
    pointerDownPos = { x: ev.clientX, y: ev.clientY };
  };
  const handlePointerUp = (ev: PointerEvent) => {
    if (!pointerDownPos) return;
    const dx = ev.clientX - pointerDownPos.x;
    const dy = ev.clientY - pointerDownPos.y;
    pointerDownPos = null;
    if (Math.hypot(dx, dy) > 5) return;

    const picked = pickPartAtClientPoint(ev.clientX, ev.clientY);
    onPartPicked?.(picked);
  };

  renderer.domElement.addEventListener("pointerdown", handlePointerDown);
  renderer.domElement.addEventListener("pointerup", handlePointerUp);

  const handleControlsChange = () => {
    requestRender();
  };
  controls.addEventListener("change", handleControlsChange);

  const handleVisibilityChange = () => {
    if (!document.hidden) {
      requestRender();
    } else if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);

  const handleContextLost = (event: Event) => {
    event.preventDefault();
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
    onContextLost?.();
  };
  renderer.domElement.addEventListener("webglcontextlost", handleContextLost, false);

  const resizeObserver = new ResizeObserver((entries) => {
    if (isDisposed) return;
    const entry = entries[0];
    if (!entry) return;
    const nextW = Math.max(Math.floor(entry.contentRect.width), 120);
    const nextH = Math.max(Math.floor(entry.contentRect.height), 120);
    camera.aspect = nextW / nextH;
    camera.updateProjectionMatrix();
    renderer.setSize(nextW, nextH, false);
    requestRender();
  });
  resizeObserver.observe(container);

  applyCameraPreset("isometric");
  if (rafId !== null) {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }
  renderer.render(scene, camera);
  renderedFrames += 1;
  onDiagnosticsChange?.(computeDiagnostics());

  return {
    setConcreteVisible(visible: boolean) {
      layerVisibility = { ...layerVisibility, concrete: visible };
      syncLayerVisibility();
      syncSectionClipping();
      requestRender();
    },
    setLayerVisibility(layers: LayerVisibilityMask) {
      layerVisibility = { ...layers };
      syncLayerVisibility();
      syncSectionClipping();
      requestRender();
    },
    setSelectedPartId(partId: string | null) {
      selectedPartId = partId;
      syncSelectionHighlight();
      requestRender();
    },
    setSectionState(section: SimulationSectionState) {
      sectionState = { ...section };
      syncSectionClipping();
      requestRender();
    },
    setExplodePercent(nextExplode: number) {
      explodePercent = Math.max(
        0,
        Math.min(100, Math.round(Number.isFinite(nextExplode) ? nextExplode : 0)),
      );
      syncExplodeTransform();
      requestRender();
    },
    focusSelectedPart() {
      if (!selectedPartId) return;
      const bounds = partBoundsMap.get(selectedPartId);
      if (!bounds) return;
      const foundPart = model.parts.find((item) => item.id === selectedPartId);
      const layerOffset = foundPart
        ? layerGroups[foundPart.layerId].position
        : new THREE.Vector3(0, 0, 0);
      const center = new THREE.Vector3()
        .addVectors(bounds.min, bounds.max)
        .multiplyScalar(0.5)
        .add(layerOffset);
      const size = new THREE.Vector3().subVectors(bounds.max, bounds.min);
      const span = Math.max(size.x, size.y, size.z, 0.35);
      const dist = Math.max(span * 1.65, 0.75);

      controls.target.copy(center);
      camera.position.set(
        center.x + dist * 0.72,
        center.y + dist * 0.45,
        center.z + dist * 0.75,
      );
      camera.lookAt(center);
      controls.update();
      requestRender();
    },
    pickPartAtClientPoint,
    resolveInstancePartId(layerId: SimulationLayerId, instanceId: number): string | null {
      if (layerId === "concrete") {
        return instanceId === 0 ? "concrete-column-body" : null;
      }
      if (layerId === "dimensions") return null;
      const records = instanceRecordsByLayer.get(layerId);
      return records?.[instanceId]?.partId ?? null;
    },
    setCameraPreset(preset: CameraPresetId) {
      applyCameraPreset(preset);
    },
    fitToModel() {
      applyCameraPreset(currentCameraPreset);
    },
    zoomByStep(direction: "in" | "out") {
      const factor = direction === "in" ? 0.84 : 1.18;
      const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
      const nextLen = THREE.MathUtils.clamp(
        offset.length() * factor,
        controls.minDistance,
        controls.maxDistance,
      );
      offset.setLength(nextLen);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      requestRender();
    },
    resetView() {
      layerVisibility = { ...DEFAULT_LAYER_VISIBILITY };
      selectedPartId = null;
      sectionState = {
        enabled: false,
        elevationZMm: DEFAULT_SECTION_ELEVATION_Z_MM,
      };
      explodePercent = 0;
      syncLayerVisibility();
      syncExplodeTransform();
      syncSectionClipping();
      syncSelectionHighlight();
      applyCameraPreset("isometric");
    },
    setThemeMode(dark: boolean) {
      scene.background = new THREE.Color(dark ? 0x0b0a18 : 0xf4f5f8);
      concreteCapMaterial.color.setHex(dark ? 0x475569 : 0x94a3b8);
      syncSelectionHighlight();
      concreteEdgeMaterial.color.setHex(dark ? 0xcbd5e1 : 0x475569);
      requestRender();
    },
    simulateContextLossForTest() {
      const lostEvent = new Event("webglcontextlost", { cancelable: true });
      renderer.domElement.dispatchEvent(lostEvent);
    },
    getDiagnostics() {
      return computeDiagnostics();
    },
    dispose() {
      if (isDisposed) return;
      isDisposed = true;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      controls.removeEventListener("change", handleControlsChange);
      controls.dispose();

      instancedMeshByLayer.forEach((mesh) => mesh.dispose());
      instancedMeshByLayer.clear();

      ownedGeometries.forEach((geo) => geo.dispose());
      ownedGeometries.clear();

      ownedMaterials.forEach((mat) => mat.dispose());
      ownedMaterials.clear();

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
