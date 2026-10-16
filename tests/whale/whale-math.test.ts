import {
  computeRadii,
  computeSpineNodes,
  computeTrajectoryPosition,
  generateWhaleMesh,
  vCross,
  vDot,
  vLen,
  vec3,
} from "../../src/lib/whale/whale-math";
import type { WhaleConfig } from "../../src/lib/whale/whale-types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runTests() {
  console.log("🌊 Starting Whale Geometry & Kinematics Test Suite...");

  // 1. Vector Math & Orthonormality Check
  {
    const a = vec3(1, 0, 0);
    const b = vec3(0, 1, 0);
    const c = vCross(a, b);
    assert(Math.abs(vDot(a, b)) < 1e-6, "Orthogonal dot product should be 0");
    assert(Math.abs(c.z - 1.0) < 1e-6, "Cross product should equal (0,0,1)");
    assert(Math.abs(vLen(c) - 1.0) < 1e-6, "Unit length should be 1.0");
    console.log("  ✓ Vector3 operations verified");
  }

  // 2. Anatomical Profile Radii Test
  {
    const L = 650;
    const sValues = [0, 0.05, 0.15, 0.28, 0.35, 0.50, 0.65, 0.80, 0.95, 1.0];

    for (const s of sValues) {
      const { rx, ry, ventralBias } = computeRadii(s, L);
      assert(!Number.isNaN(rx) && Number.isFinite(rx), `rx must be finite at s=${s}`);
      assert(!Number.isNaN(ry) && Number.isFinite(ry), `ry must be finite at s=${s}`);
      assert(rx >= 0 && ry >= 0, `Radii must be non-negative at s=${s}`);
      assert(ventralBias >= 0, `Ventral bias must be non-negative at s=${s}`);
    }

    const head = computeRadii(0.05, L);
    const thorax = computeRadii(0.32, L);
    const peduncle = computeRadii(0.85, L);

    assert(thorax.rx > head.rx, "Thorax must be wider than rostrum");
    assert(thorax.ry > head.ry, "Thorax must be deeper than rostrum");
    assert(peduncle.rx < thorax.rx * 0.4, "Peduncle must taper significantly from thorax");
    assert(thorax.ventralBias > 0, "Thorax must have positive ventral pleat pouch bias");
    console.log("  ✓ Anatomical profile radii (Megaptera) verified");
  }

  // 3. Viewport 3D Trajectory Test
  {
    const times = [0, 5, 13.5, 27, 40.5, 54, 80];
    const width = 1440;
    const height = 900;

    for (const t of times) {
      const { pos, tangent, bankAngle } = computeTrajectoryPosition(t, width, height, 54);
      assert(Number.isFinite(pos.x) && Number.isFinite(pos.y) && Number.isFinite(pos.z), `Trajectory pos finite at t=${t}`);
      const tLen = vLen(tangent);
      assert(Math.abs(tLen - 1.0) < 0.05, `Trajectory tangent must be unit length (got ${tLen}) at t=${t}`);
      assert(Math.abs(bankAngle) <= 0.5, `Bank angle must be within [-0.5, 0.5] at t=${t}`);
    }
    console.log("  ✓ 3D viewport trajectory loop verified");
  }

  // 4. Spine Kinematics & Orthonormal Frame Test
  {
    const config: WhaleConfig = {
      length: 680,
      swimSpeed: 0.22,
      loopPeriod: 54,
      cameraFocalLength: 850,
    };

    const nodes = computeSpineNodes(12.5, 1920, 1080, config, 28);
    assert(nodes.length === 28, "Should produce 28 spine nodes");

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      assert(Number.isFinite(node.pos.x) && Number.isFinite(node.pos.y) && Number.isFinite(node.pos.z), `Node ${i} pos is finite`);
      assert(Math.abs(vLen(node.tangent) - 1.0) < 1e-4, `Node ${i} tangent unit length`);
      assert(Math.abs(vLen(node.normal) - 1.0) < 1e-4, `Node ${i} normal unit length`);
      assert(Math.abs(vLen(node.binormal) - 1.0) < 1e-4, `Node ${i} binormal unit length`);
      assert(Math.abs(vDot(node.tangent, node.normal)) < 1e-3, `Node ${i} tangent-normal orthogonality`);
      assert(Math.abs(vDot(node.tangent, node.binormal)) < 1e-3, `Node ${i} tangent-binormal orthogonality`);
      assert(Math.abs(vDot(node.normal, node.binormal)) < 1e-3, `Node ${i} normal-binormal orthogonality`);
    }
    console.log("  ✓ Spine kinematics and orthonormal frame verified");
  }

  // 5. Mesh Generation & 2D Projection Integrity Test
  {
    const config: WhaleConfig = {
      length: 640,
      swimSpeed: 0.20,
      loopPeriod: 54,
      cameraFocalLength: 850,
    };

    const mesh = generateWhaleMesh(25.0, 1280, 800, config);

    assert(mesh.ribs.length === 28, "Must generate 28 ribs");
    assert(mesh.streamlines.length === 20, "Must generate 20 streamlines");
    assert(mesh.ventralPleats.length === 10, "Must generate 10 ventral pleats");
    assert(mesh.leftFlipper.leadingEdge.length > 0, "Left flipper leading edge exists");
    assert(mesh.rightFlipper.leadingEdge.length > 0, "Right flipper leading edge exists");
    assert(mesh.leftFlipper.tubercles.length >= 4, "Must have tubercles on left flipper");
    assert(mesh.flukes.outline.length > 0, "Flukes outline exists");
    assert(mesh.flukes.tips.length === 2, "Flukes tips exist");
    assert(mesh.technicalMarkers.length === 4, "4 technical markers exist");

    // Check all projected points for NaN
    const checkPt = (p: { x: number; y: number; z: number; scale: number; alpha: number }, label: string) => {
      assert(!Number.isNaN(p.x) && Number.isFinite(p.x), `${label} x must be finite (got ${p.x})`);
      assert(!Number.isNaN(p.y) && Number.isFinite(p.y), `${label} y must be finite (got ${p.y})`);
      assert(!Number.isNaN(p.z) && Number.isFinite(p.z), `${label} z must be finite (got ${p.z})`);
      assert(p.scale > 0 && Number.isFinite(p.scale), `${label} scale must be positive finite`);
      assert(p.alpha >= 0 && p.alpha <= 1.0, `${label} alpha must be in [0, 1]`);
    };

    mesh.spine.forEach((pt, i) => checkPt(pt, `Spine[${i}]`));
    mesh.ribs.forEach((rib, r) => rib.points.forEach((pt, p) => checkPt(pt, `Rib[${r}][${p}]`)));
    mesh.streamlines.forEach((sl, s) => sl.forEach((pt, p) => checkPt(pt, `Streamline[${s}][${p}]`)));
    mesh.ventralPleats.forEach((vp, v) => vp.forEach((pt, p) => checkPt(pt, `Pleat[${v}][${p}]`)));
    mesh.leftFlipper.leadingEdge.forEach((pt, p) => checkPt(pt, `LeftFlipperLead[${p}]`));
    mesh.rightFlipper.leadingEdge.forEach((pt, p) => checkPt(pt, `RightFlipperLead[${p}]`));
    mesh.flukes.outline.forEach((pt, p) => checkPt(pt, `FlukesOutline[${p}]`));
    checkPt(mesh.flukes.notch, "FlukesNotch");

    console.log("  ✓ Full 3D to 2D projection and mesh integrity verified (0 NaN, 0 Infinity)");
  }

  // 6. Mobile 320px & Multi-Viewport Trajectory Framing Test
  {
    const viewports = [
      { w: 320, h: 568, name: "Mobile 320px" },
      { w: 390, h: 844, name: "Mobile 390px" },
      { w: 768, h: 1024, name: "Tablet 768px" },
      { w: 1440, h: 900, name: "Desktop 1440px" },
    ];

    for (const vp of viewports) {
      for (let t = 0; t <= 54; t += 3) {
        const { pos } = computeTrajectoryPosition(t, vp.w, vp.h, 54);
        const focal = 850;
        const scale = focal / (pos.z + focal);
        const xScreen = vp.w * 0.5 + pos.x * scale;
        const yScreen = vp.h * 0.5 + pos.y * scale;

        // Ensure trajectory head remains framed within viewport bounds with gentle margin
        assert(
          xScreen >= -vp.w * 0.25 && xScreen <= vp.w * 1.25,
          `${vp.name} trajectory x (${xScreen.toFixed(1)}) must stay within reasonable viewport margin at t=${t}`
        );
        assert(
          yScreen >= -vp.h * 0.25 && yScreen <= vp.h * 1.25,
          `${vp.name} trajectory y (${yScreen.toFixed(1)}) must stay within reasonable viewport margin at t=${t}`
        );
      }
    }
    console.log("  ✓ Mobile & multi-viewport trajectory framing bounds verified");
  }

  console.log("🎉 ALL Whale Math & Kinematics Tests PASSED successfully!");
}

runTests();
