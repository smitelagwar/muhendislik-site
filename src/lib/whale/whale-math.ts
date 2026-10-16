import type {
  Point2D,
  ProjectedPoint,
  Vector3,
  WhaleConfig,
  WhaleDorsalFin,
  WhaleFlipper,
  WhaleFlukes,
  WhaleMarker,
  WhaleMesh,
  WhaleRib,
  WhaleSpineNode,
} from "./whale-types";

// ─── 3D Vector Math Primitives ──────────────────────────────────────────────

export function vec3(x = 0, y = 0, z = 0): Vector3 {
  return { x, y, z };
}

export function vAdd(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function vSub(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function vScale(v: Vector3, s: number): Vector3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function vDot(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function vCross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function vLen(v: Vector3): number {
  return Math.hypot(v.x, v.y, v.z);
}

export function vNormalize(v: Vector3): Vector3 {
  const l = vLen(v);
  if (l < 1e-6) return { x: 0, y: 1, z: 0 };
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

export function vLerp(a: Vector3, b: Vector3, t: number): Vector3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

/**
 * Rodrigues' rotation formula: rotate vector v around unit axis by angle radians.
 */
export function rotateAroundAxis(v: Vector3, axis: Vector3, angle: number): Vector3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const k = vNormalize(axis);
  const dot = vDot(k, v);
  const cross = vCross(k, v);

  return {
    x: v.x * cos + cross.x * sin + k.x * dot * (1 - cos),
    y: v.y * cos + cross.y * sin + k.y * dot * (1 - cos),
    z: v.z * cos + cross.z * sin + k.z * dot * (1 - cos),
  };
}

// ─── 3D to 2D Perspective Projection ─────────────────────────────────────────

export function projectPoint(
  p: Vector3,
  width: number,
  height: number,
  focalLength = 850
): ProjectedPoint {
  // Center camera at (width / 2, height / 2, -focalLength) looking towards +Z
  const zCam = p.z + focalLength;
  const safeZ = Math.max(zCam, 40);
  const scale = focalLength / safeZ;

  const xScreen = width * 0.5 + p.x * scale;
  const yScreen = height * 0.5 + p.y * scale;

  // Depth attenuation factor: closer elements are sharper, deeper elements are faint
  const depthFactor = Math.max(0.25, Math.min(1.0, 1.0 - (p.z / 900) * 0.55));

  return {
    x: xScreen,
    y: yScreen,
    z: p.z,
    scale,
    alpha: depthFactor,
  };
}

// ─── Global 3D Viewport Oceanic Trajectory ───────────────────────────────────

/**
 * Computes an autonomous, continuous, organic 3D orbit through the viewport space.
 * Follows a smooth 54-second loop entering from bottom-right, gliding behind cards
 * towards top-left, banking, diving into deep Z, and sweeping back around.
 */
export function computeTrajectoryPosition(
  timeSec: number,
  viewportWidth: number,
  viewportHeight: number,
  period = 54
): { pos: Vector3; tangent: Vector3; bankAngle: number } {
  const phase = ((timeSec % period) + period) % period;
  const u = (phase / period) * 2 * Math.PI;

  // Dynamically scale trajectory to viewport size so whale remains well-framed on both 320px mobile and 4K desktop
  const xSpan = Math.min(viewportWidth * 0.36, 540);
  const ySpan = Math.min(viewportHeight * 0.28, 300);
  const zSpan = Math.min(Math.max(viewportWidth * 0.12, 100), 170);

  // Position function: smooth Lissajous path with organic harmonics
  const calcPos = (rad: number): Vector3 => {
    const x = Math.sin(rad) * xSpan + Math.sin(2 * rad) * (xSpan * 0.22);
    const y = Math.cos(rad) * (ySpan * 0.72) + Math.sin(2 * rad) * (ySpan * 0.28);
    // Depth oscillation: dives between near surface and oceanic depth
    const z = Math.sin(rad + 0.9) * zSpan + Math.cos(2 * rad) * (zSpan * 0.41);
    return { x, y, z };
  };

  const pos = calcPos(u);

  // Numerical tangent (velocity direction) with tiny step
  const dt = 0.015;
  const posNext = calcPos(u + dt);
  const posPrev = calcPos(u - dt);
  const vel = vSub(posNext, posPrev);
  const tangent = vNormalize(vel);

  // Acceleration / Curvature for banking roll:
  const velNext = vSub(calcPos(u + dt * 2), pos);
  const velPrev = vSub(pos, calcPos(u - dt * 2));
  const acc = vSub(velNext, velPrev);
  // Roll proportional to horizontal lateral acceleration
  const bankAngle = Math.max(-0.45, Math.min(0.45, (acc.x * vel.y - acc.y * vel.x) * 0.000008));

  return { pos, tangent, bankAngle };
}

// ─── Humpback Whale Anatomical Profile (Megaptera novaeangliae) ─────────────

export interface WhaleSectionDimensions {
  rx: number;
  ry: number;
  ventralBias: number;
  isHead: boolean;
  isThoracic: boolean;
  isPeduncle: boolean;
}

/**
 * Computes transverse radius (rx), vertical radius (ry), and ventral throat groove
 * pouch depth for parameter s in [0, 1] (0 = rostrum snout, 1 = fluke notch).
 */
export function computeRadii(s: number, length: number): WhaleSectionDimensions {
  const t = Math.max(0, Math.min(1, s));
  let rx = 0;
  let ry = 0;
  let ventralBias = 0;
  let isHead = false;
  let isThoracic = false;
  let isPeduncle = false;

  if (t < 0.20) {
    // ─── Rostrum (upper and lower jaws, tubercle knobs)
    isHead = true;
    const u = t / 0.20;
    const knob = 1.0 + 0.025 * Math.sin(u * Math.PI * 6);
    rx = (0.03 + 0.115 * Math.sqrt(u)) * length * knob;
    ry = (0.022 + 0.080 * Math.sqrt(u)) * length;
    ventralBias = 0.018 * u * length;
  } else if (t < 0.44) {
    // ─── Thorax & Ventral Throat Pleat Pouch (Maximum Girth)
    isThoracic = true;
    const u = (t - 0.20) / 0.24;
    const belly = Math.sin(u * Math.PI);
    rx = (0.145 + 0.015 * Math.cos(u * Math.PI * 0.5)) * length;
    ry = (0.102 + 0.022 * Math.cos(u * Math.PI * 0.5)) * length;
    ventralBias = (0.018 + 0.038 * belly) * length;
  } else if (t < 0.70) {
    // ─── Midbody & Dorsal Hump
    const u = (t - 0.44) / 0.26;
    // Characteristic humpback dorsal fin elevation around u ~ 0.8
    const dorsalHump = Math.exp(-Math.pow((u - 0.8) / 0.14, 2)) * 0.035 * length;
    rx = (0.14 - 0.075 * u) * length;
    ry = (0.10 - 0.050 * u) * length + dorsalHump;
    ventralBias = Math.max(0, 0.025 * (1 - u * 2.2)) * length;
  } else if (t < 0.94) {
    // ─── Caudal Peduncle (Laterally compressed submarine keel)
    isPeduncle = true;
    const u = (t - 0.70) / 0.24;
    rx = (0.065 - 0.046 * u) * length;
    ry = (0.050 - 0.028 * u) * length;
    ventralBias = 0;
  } else {
    // ─── Tail Wrist (Pre-Fluke insertion)
    isPeduncle = true;
    const u = (t - 0.94) / 0.06;
    rx = (0.019 - 0.007 * u) * length;
    ry = (0.022 - 0.009 * u) * length;
    ventralBias = 0;
  }

  return { rx, ry, ventralBias, isHead, isThoracic, isPeduncle };
}

// ─── Spine Kinematics & Wave Propagation ─────────────────────────────────────

export function computeSpineNodes(
  timeSec: number,
  viewportWidth: number,
  viewportHeight: number,
  config: WhaleConfig,
  numNodes = 28
): WhaleSpineNode[] {
  const { length, swimSpeed, loopPeriod } = config;

  // Global head trajectory
  const { pos: headPos, tangent: headTangent, bankAngle } = computeTrajectoryPosition(
    timeSec,
    viewportWidth,
    viewportHeight,
    loopPeriod
  );

  // Up vector with banking roll
  const nominalUp: Vector3 = { x: 0, y: -1, z: 0 };
  const rolledUp = rotateAroundAxis(nominalUp, headTangent, bankAngle);
  const rolledRight = vNormalize(vCross(headTangent, rolledUp));

  const nodes: WhaleSpineNode[] = [];

  for (let i = 0; i < numNodes; i++) {
    const s = i / (numNodes - 1);
    const dimensions = computeRadii(s, length);

    // Caudal wave amplitude envelope: rigid skull/chest (s <= 0.32), growing quadratic wave towards tail
    let waveAmp = 0;
    if (s > 0.32) {
      const u = (s - 0.32) / 0.68;
      waveAmp = Math.pow(u, 2.1) * (0.13 * length);
    }

    // Dorsoventral swimming undulation (vertical pitch heave)
    const wavePhase = 2 * Math.PI * (swimSpeed * timeSec - 1.25 * s);
    const verticalDisplacement = Math.sin(wavePhase) * waveAmp;

    // Subtle lateral sway out of phase during bank turns
    const lateralDisplacement = Math.cos(wavePhase) * (waveAmp * 0.25);

    // Spine distance back from head along local tangent
    const distBack = s * length;

    // Position along curved body axis:
    // Tail curves slightly into trajectory arc
    const nodePos = vAdd(
      headPos,
      vAdd(
        vScale(headTangent, -distBack),
        vAdd(
          vScale(rolledUp, verticalDisplacement),
          vScale(rolledRight, lateralDisplacement)
        )
      )
    );

    // Local Bishop / Orthonormal Frame
    // Tangent tilts with derivative of vertical wave
    const waveSlope = s > 0.32 ? Math.cos(wavePhase) * waveAmp * (2 * Math.PI * 1.25 / length) : 0;
    const localTangent = vNormalize(vAdd(headTangent, vScale(rolledUp, -waveSlope)));
    const localRight = vNormalize(vCross(localTangent, rolledUp));
    const localNormal = vNormalize(vCross(localRight, localTangent));

    nodes.push({
      s,
      pos: nodePos,
      tangent: localTangent,
      normal: localNormal,
      binormal: localRight,
      rx: dimensions.rx,
      ry: dimensions.ry,
      ventralBias: dimensions.ventralBias,
    });
  }

  return nodes;
}

// ─── 3D Mesh Generation & Perspective Projection ────────────────────────────

export function generateWhaleMesh(
  timeSec: number,
  viewportWidth: number,
  viewportHeight: number,
  config: WhaleConfig
): WhaleMesh {
  const numSpineNodes = 28;
  const numRibVertices = 20;
  const spineNodes = computeSpineNodes(timeSec, viewportWidth, viewportHeight, config, numSpineNodes);

  // 1. Projected Spine
  const projectedSpine: ProjectedPoint[] = spineNodes.map((n) =>
    projectPoint(n.pos, viewportWidth, viewportHeight, config.cameraFocalLength)
  );

  // 2. Ribs (Cross-Section Rings)
  const ribs: WhaleRib[] = [];
  const rib3DPoints: Vector3[][] = [];

  spineNodes.forEach((node) => {
    const ring3D: Vector3[] = [];
    const ringProjected: ProjectedPoint[] = [];

    for (let j = 0; j < numRibVertices; j++) {
      const theta = (j / numRibVertices) * 2 * Math.PI;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      // Ventral expansion: if sinT < 0 (underbelly), expand downwards by ventralBias
      const ventralOffset = sinT < 0 ? -node.ventralBias * (-sinT) : 0;
      const lateralDist = cosT * node.rx;
      const verticalDist = sinT * node.ry + ventralOffset;

      const p3D = vAdd(
        node.pos,
        vAdd(vScale(node.binormal, lateralDist), vScale(node.normal, verticalDist))
      );

      ring3D.push(p3D);
      ringProjected.push(
        projectPoint(p3D, viewportWidth, viewportHeight, config.cameraFocalLength)
      );
    }

    rib3DPoints.push(ring3D);

    const dims = computeRadii(node.s, config.length);
    ribs.push({
      s: node.s,
      points: ringProjected,
      normalPoints: ring3D,
      isThoracic: dims.isThoracic,
      isHead: dims.isHead,
      isPeduncle: dims.isPeduncle,
    });
  });

  // 3. Longitudinal Streamlines (Connecting constant angle theta across ribs)
  const streamlines: ProjectedPoint[][] = [];
  for (let j = 0; j < numRibVertices; j++) {
    const line: ProjectedPoint[] = [];
    for (let i = 0; i < ribs.length; i++) {
      line.push(ribs[i].points[j]);
    }
    streamlines.push(line);
  }

  // 4. Ventral Pleats (Throat Grooves)
  // Fine lines sampled along bottom underbelly between s = 0.08 and s = 0.44
  const ventralPleats: ProjectedPoint[][] = [];
  const pleatStartIdx = 2; // ~s = 0.07
  const pleatEndIdx = 12;  // ~s = 0.44
  const numPleats = 10;

  for (let p = 0; p < numPleats; p++) {
    const pleatLine: ProjectedPoint[] = [];
    // theta centered around ventral bottom (theta = -PI / 2, or 3*PI/2)
    const angleOffset = ((p / (numPleats - 1)) - 0.5) * 1.35; // spanning ~78 degrees
    const theta = -Math.PI * 0.5 + angleOffset;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    for (let i = pleatStartIdx; i <= pleatEndIdx; i++) {
      const node = spineNodes[i];
      const ventralOffset = -node.ventralBias * (-sinT);
      const p3D = vAdd(
        node.pos,
        vAdd(
          vScale(node.binormal, cosT * node.rx),
          vScale(node.normal, sinT * node.ry + ventralOffset)
        )
      );
      pleatLine.push(projectPoint(p3D, viewportWidth, viewportHeight, config.cameraFocalLength));
    }
    ventralPleats.push(pleatLine);
  }

  // 5. Pectoral Flippers (Megaptera Long Wing-like Flippers)
  // Attached at s ~ 0.28 (around node index 8)
  const attachIdx = 8;
  const attachNode = spineNodes[attachIdx];
  const flipperLength = config.length * 0.33;

  // Dynamic flipper wing-flex with wave phase
  const flipperFlex = Math.sin(2 * Math.PI * config.swimSpeed * timeSec - 0.7) * 0.12;

  const buildFlipper = (side: "left" | "right"): WhaleFlipper => {
    const sign = side === "left" ? -1 : 1;
    // Wing points outward, swept backward 40 degrees, drooped downward 24 degrees
    const sweepBack = 0.58;
    const droopDown = -0.38 + flipperFlex;
    const spanOut = 0.72;

    const basePos = vAdd(
      attachNode.pos,
      vAdd(
        vScale(attachNode.binormal, sign * attachNode.rx * 0.95),
        vScale(attachNode.normal, -attachNode.ry * 0.25)
      )
    );

    const wingDir = vNormalize(
      vAdd(
        vScale(attachNode.binormal, sign * spanOut),
        vAdd(vScale(attachNode.tangent, -sweepBack), vScale(attachNode.normal, droopDown))
      )
    );

    const wingChord = vNormalize(vCross(wingDir, attachNode.normal));

    const leadingEdge: ProjectedPoint[] = [];
    const trailingEdge: ProjectedPoint[] = [];
    const tubercles: ProjectedPoint[] = [];
    const internalSpars: ProjectedPoint[][] = [[], [], []];

    const numSpanSteps = 28;
    for (let k = 0; k <= numSpanSteps; k++) {
      const u = k / numSpanSteps;
      const spanPos = vAdd(basePos, vScale(wingDir, u * flipperLength));

      // Humpback tubercles: sinuous bumps along leading edge (Megaptera signature)
      const bump = u > 0.10 && u < 0.90 ? Math.sin(u * 8 * Math.PI) * 0.035 * flipperLength : 0;
      const chordWidth = (1.0 - u * 0.75) * (0.075 * config.length);

      // Leading edge point (with tubercles)
      const lead3D = vAdd(spanPos, vScale(wingChord, chordWidth * 0.5 + bump));
      const leadProj = projectPoint(lead3D, viewportWidth, viewportHeight, config.cameraFocalLength);
      leadingEdge.push(leadProj);

      if (bump > 0.015 * flipperLength) {
        tubercles.push(leadProj);
      }

      // Trailing edge point
      const trail3D = vAdd(spanPos, vScale(wingChord, -chordWidth * 0.5));
      trailingEdge.push(projectPoint(trail3D, viewportWidth, viewportHeight, config.cameraFocalLength));

      // Internal anatomical phalanges / structural spars
      internalSpars[0].push(
        projectPoint(vAdd(spanPos, vScale(wingChord, chordWidth * 0.2)), viewportWidth, viewportHeight, config.cameraFocalLength)
      );
      internalSpars[1].push(
        projectPoint(spanPos, viewportWidth, viewportHeight, config.cameraFocalLength)
      );
      internalSpars[2].push(
        projectPoint(vAdd(spanPos, vScale(wingChord, -chordWidth * 0.2)), viewportWidth, viewportHeight, config.cameraFocalLength)
      );
    }

    return {
      side,
      leadingEdge,
      trailingEdge,
      tubercles,
      internalSpars,
    };
  };

  const leftFlipper = buildFlipper("left");
  const rightFlipper = buildFlipper("right");

  // 6. Flukes (Bifurcated Tail Fin)
  const tailIdx = numSpineNodes - 1;
  const tailNode = spineNodes[tailIdx];
  const flukeSpan = config.length * 0.35;
  const flukeWidth = config.length * 0.11;

  // Tail fluke center notch (recessed forward)
  const notch3D = vAdd(tailNode.pos, vScale(tailNode.tangent, -flukeWidth * 0.45));
  const notchProj = projectPoint(notch3D, viewportWidth, viewportHeight, config.cameraFocalLength);

  // Left & right wingtips
  const leftTip3D = vAdd(
    tailNode.pos,
    vAdd(vScale(tailNode.binormal, -flukeSpan * 0.5), vScale(tailNode.tangent, -flukeWidth * 0.15))
  );
  const rightTip3D = vAdd(
    tailNode.pos,
    vAdd(vScale(tailNode.binormal, flukeSpan * 0.5), vScale(tailNode.tangent, -flukeWidth * 0.15))
  );

  const leftTipProj = projectPoint(leftTip3D, viewportWidth, viewportHeight, config.cameraFocalLength);
  const rightTipProj = projectPoint(rightTip3D, viewportWidth, viewportHeight, config.cameraFocalLength);

  // Fluke curved outline
  const flukeOutline: ProjectedPoint[] = [];
  const flukeRibLines: ProjectedPoint[][] = [];

  // Generate smooth curved perimeter
  const flukeSteps = 16;
  for (let step = 0; step <= flukeSteps; step++) {
    const u = (step / flukeSteps) * 2 - 1; // -1 to +1
    const absU = Math.abs(u);
    const spanOffset = u * (flukeSpan * 0.5);
    // Trailing edge concave notch curve
    const chordOffset = -(1 - Math.pow(absU, 1.8)) * flukeWidth * 0.85 - (absU * flukeWidth * 0.35);

    const pt3D = vAdd(
      tailNode.pos,
      vAdd(vScale(tailNode.binormal, spanOffset), vScale(tailNode.tangent, chordOffset))
    );
    flukeOutline.push(projectPoint(pt3D, viewportWidth, viewportHeight, config.cameraFocalLength));
  }

  // Radiating ray lines from fluke root to trailing edge
  for (let r = 0; r < 7; r++) {
    const endPt = flukeOutline[Math.floor((r / 6) * flukeSteps)];
    flukeRibLines.push([projectedSpine[projectedSpine.length - 2], endPt]);
  }

  const flukes: WhaleFlukes = {
    outline: flukeOutline,
    notch: notchProj,
    tips: [leftTipProj, rightTipProj],
    ribLines: flukeRibLines,
  };

  // 7. Dorsal Fin
  const dorsalIdx = 18; // ~s = 0.65
  const dNode = spineNodes[dorsalIdx];
  const dBaseA = projectPoint(
    vAdd(dNode.pos, vScale(dNode.normal, dNode.ry)),
    viewportWidth,
    viewportHeight,
    config.cameraFocalLength
  );
  const dTip = projectPoint(
    vAdd(
      dNode.pos,
      vAdd(vScale(dNode.normal, dNode.ry + config.length * 0.045), vScale(dNode.tangent, -config.length * 0.025))
    ),
    viewportWidth,
    viewportHeight,
    config.cameraFocalLength
  );
  const dBaseB = projectPoint(
    vAdd(
      spineNodes[Math.min(dorsalIdx + 2, numSpineNodes - 1)].pos,
      vScale(dNode.normal, dNode.ry * 0.85)
    ),
    viewportWidth,
    viewportHeight,
    config.cameraFocalLength
  );

  const dorsalFin: WhaleDorsalFin = {
    outline: [dBaseA, dTip, dBaseB],
  };

  // 8. Bounding Silhouette Hull (for subtle volumetric wash)
  // Gather perimeter points from ribs, head, and flippers
  const silhouettePolygon: Point2D[] = [];
  ribs.forEach((rib) => {
    // left-most point
    silhouettePolygon.push({ x: rib.points[0].x, y: rib.points[0].y });
  });
  // wrap around tail
  silhouettePolygon.push({ x: flukes.notch.x, y: flukes.notch.y });
  // right-most points
  for (let i = ribs.length - 1; i >= 0; i--) {
    const opp = ribs[i].points[Math.floor(numRibVertices / 2)];
    silhouettePolygon.push({ x: opp.x, y: opp.y });
  }

  // 9. Technical Blueprint Markers (Architectural Crosshairs & Dimensions)
  const technicalMarkers: WhaleMarker[] = [
    {
      pos: projectedSpine[0],
      label: "STA 0+00 ROSTRUM",
      type: "cross",
    },
    {
      pos: projectedSpine[attachIdx],
      label: "STA 3+15 THORAX / MEGAPTERA",
      type: "node",
    },
    {
      pos: projectedSpine[dorsalIdx],
      label: "STA 6+50 DORSAL",
      type: "datum",
    },
    {
      pos: projectedSpine[tailIdx],
      label: "STA 10+00 CAUDAL NOTCH",
      type: "cross",
    },
  ];

  return {
    spine: projectedSpine,
    ribs,
    streamlines,
    ventralPleats,
    leftFlipper,
    rightFlipper,
    flukes,
    dorsalFin,
    silhouettePolygon,
    technicalMarkers,
  };
}
