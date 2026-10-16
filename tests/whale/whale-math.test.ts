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
      assert(Math.abs(bankAngle) <= 0.8, `Bank angle must stay within a gentle bank at t=${t}`);
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

    assert(mesh.ribs.length >= 36, "Anatomical curves need sufficient longitudinal resolution");
    assert(mesh.streamlines.length >= 24, "Surface needs enough angular resolution for smooth contours");
    assert(mesh.ventralPleats.length >= 12, "Throat grooves must remain distinct from the surface grid");
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
    mesh.featureLines.forEach((line) => line.points.forEach((pt) => checkPt(pt, line.kind)));
    mesh.surface.forEach((patch) => patch.points.forEach((pt) => checkPt(pt, "Surface")));
    mesh.etching.forEach((mark) => mark.points.forEach((pt) => checkPt(pt, "Gravür")));
    mesh.nodules.forEach((nodule) => nodule.outline.forEach((pt) => checkPt(pt, "Tüberkül")));
    mesh.pleatHighlights.forEach((line) => line.forEach((pt) => checkPt(pt, "Oluk kenarı")));
    mesh.eyes.forEach((pt) => checkPt(pt, "Eye"));
    checkPt(mesh.flukes.notch, "FlukesNotch");

    console.log("  ✓ Full 3D to 2D projection and mesh integrity verified (0 NaN, 0 Infinity)");
  }

  // Önceki parçalı yarıçap profilindeki sıçramalara ve açık yüzgeç uçlarına karşı regresyon.
  {
    for (const s of [0.025, 0.075, 0.15, 0.2, 0.23, 0.32, 0.43, 0.44, 0.56, 0.68, 0.7, 0.8, 0.91, 0.94]) {
      const a = computeRadii(s - 1e-5, 1000), b = computeRadii(s + 1e-5, 1000);
      assert(Math.abs(a.rx - b.rx) < 0.04 && Math.abs(a.ry - b.ry) < 0.04,
        `Kesit profili s=${s} birleşiminde sıçramamalı`);
    }
    const mesh = generateWhaleMesh(3, 1440, 960, { length: 1000, swimSpeed: 0.135, loopPeriod: 76, cameraFocalLength: 1200 });
    for (const f of [mesh.leftFlipper, mesh.rightFlipper]) {
      const lead = f.leadingEdge.at(-1)!, trail = f.trailingEdge.at(-1)!;
      assert(Math.hypot(lead.x - trail.x, lead.y - trail.y) < 1e-5, "Yüzgeç ucu kapalı olmalı");
    }
    assert(mesh.featureLines.some(l => l.kind === "jaw") && mesh.eyes.length === 2,
      "Baş anatomisi çene çizgilerini ve iki gözü içermeli");
    assert(mesh.surface.every(p => p.light >= 0 && p.light <= 1), "Yüzey aydınlatması geçerli olmalı");
    console.log("  ✓ Sürekli anatomi, kapalı yüzgeçler ve baş detayları doğrulandı");
  }

  // Kadraj sınaması yalnız başı değil tüm gövdeyi, kanatları ve kuyruğu kapsar.
  {
    for (const [w, h] of [[320, 720], [390, 844], [768, 1024], [1366, 768], [1920, 1080], [844, 390]]) {
      const config = { length: Math.min(w * 0.78, h * 1.05, 1060), swimSpeed: 0.135, loopPeriod: 76, cameraFocalLength: 1200 };
      for (let t = 0; t < 76; t += 2) {
        const mesh = generateWhaleMesh(t, w, h, config);
        const points = [...mesh.ribs.flatMap(r => r.points), ...mesh.flukes.outline,
          ...mesh.leftFlipper.leadingEdge, ...mesh.leftFlipper.trailingEdge,
          ...mesh.rightFlipper.leadingEdge, ...mesh.rightFlipper.trailingEdge, ...mesh.dorsalFin.outline];
        assert(points.every(p => p.x >= 0 && p.x <= w && p.y >= 0 && p.y <= h), `${w}×${h}, t=${t}: bütün anatomi kadrajda kalmalı`);
        const next = generateWhaleMesh(t + 0.001, w, h, config);
        assert(Math.hypot(next.spine[0].x - mesh.spine[0].x, next.spine[0].y - mesh.spine[0].y) < 1,
          `${w}×${h}, t=${t}: yüzüş kesintisiz olmalı`);
      }
    }
    console.log("  ✓ Tam yüzüş turunda tüm anatomi ve hareket sürekliliği doğrulandı");
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
