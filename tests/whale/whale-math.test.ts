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
import { sampleWhaleMotion } from "../../src/lib/whale/whale-motion";

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
      assert(Math.abs(bankAngle) <= 1.2, `Bank angle must stay within a controlled turn at t=${t}`);
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

  // İki bağımsız rota boşluklara yayılır, derinlik değiştirir ve kadrajdan çıkar.
  {
    for (const [w, h] of [[768, 1024], [1024, 768], [1366, 768], [1920, 1080], [2560, 1400]]) {
      for (const actor of [0, 1] as const) {
        const config: WhaleConfig = { length: Math.min(w * 0.8, h * 1.17, 1220) * (actor ? 0.88 : 1),
          swimSpeed: actor ? 0.145 : 0.17, loopPeriod: 112, cameraFocalLength: 1500, actor };
        const period = config.loopPeriod * (actor ? 1.19 : 1);
        let near = Infinity, far = -Infinity, left = false, right = false, margins = 0;
        for (let t = 0; t < period; t += 2) {
          const motion = sampleWhaleMotion(t, w, h, config);
          near = Math.min(near, motion.pos.z); far = Math.max(far, motion.pos.z);
          const mesh = generateWhaleMesh(t, w, h, config);
          const points = [...mesh.ribs.flatMap(r => r.points), ...mesh.flukes.outline,
            ...mesh.leftFlipper.leadingEdge, ...mesh.leftFlipper.trailingEdge,
            ...mesh.rightFlipper.leadingEdge, ...mesh.rightFlipper.trailingEdge, ...mesh.dorsalFin.outline];
          assert(points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.scale > 0 && p.scale < 4),
            `${w}×${h}, t=${t}: yakın planda kamera veya geometri patlamamalı`);
          left ||= points.every(p => p.x < 0);
          right ||= points.every(p => p.x > w);
          if (points.some(p => (p.x > 0 && p.x < w * 0.15 || p.x > w * 0.85 && p.x < w) && p.y > h * 0.15 && p.y < h)) margins++;
          const next = generateWhaleMesh(t + 0.001, w, h, config);
          assert(Math.hypot(next.spine[0].x - mesh.spine[0].x, next.spine[0].y - mesh.spine[0].y) < 2,
            `${w}×${h}, t=${t}: görünür yüzüş kesintisiz olmalı`);
        }
        assert(left && right, `${actor}: bütün anatomi her iki yandan da kadraj dışına çıkmalı`);
        assert(margins >= 12, `${actor}: boş yan koridorlarda uzun süre görünmeli`);
        assert((1500 + far) / (1500 + near) > 1.55, `${actor}: yaklaşma ve uzaklaşma belirgin perspektif farkı üretmeli`);
        // Koordinat sarılması sadece bütün gövde görünmezken yapılabilir.
        const wrap = period * (1 - (actor ? 0.28 : 0.23));
        for (const time of [wrap - 0.001, wrap + 0.001]) {
          const mesh = generateWhaleMesh(time, w, h, config);
          const points = [...mesh.silhouettePolygon, ...mesh.flukes.outline, ...mesh.leftFlipper.leadingEdge, ...mesh.rightFlipper.leadingEdge];
          assert(points.every(p => p.x < -20) || points.every(p => p.x > w + 20), "Yeniden giriş ekranda ışınlanma üretmemeli");
        }
      }
    }
    console.log("  ✓ İki rota, boş koridorlar, perspektif ve görünmez kadraj sarılması doğrulandı");
  }

  // Esneme, gövde boyunu değiştirmeden omurganın gerisine yayılmalıdır.
  {
    const config: WhaleConfig = { length: 1100, swimSpeed: 0.17, loopPeriod: 112, cameraFocalLength: 1500 };
    let minBend = 1, maxBend = -1;
    for (let time = 0; time < 14; time += 0.25) {
      const nodes = computeSpineNodes(time, 1920, 1080, config, 64);
      let length = 0;
      for (let i = 1; i < nodes.length; i++) {
        const a = nodes[i].pos, b = nodes[i - 1].pos;
        length += Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      }
      assert(Math.abs(length - config.length) < 0.001, "Yüzüşte omurga uzayıp kısalmamalı");
      const bend = vDot(nodes.at(-1)!.tangent, nodes[0].normal);
      minBend = Math.min(minBend, bend); maxBend = Math.max(maxBend, bend);
    }
    assert(maxBend - minBend > 0.5, "Kuyruk baştan bağımsız aşağı-yukarı bükülmeli");
    const a = sampleWhaleMotion(9, 1920, 1080, config);
    const b = sampleWhaleMotion(9, 1920, 1080, { ...config, actor: 1 });
    assert(Math.abs(a.phase - b.phase) > 1, "İki bireyin vuruşları aynı fazda olmamalı");
    console.log("  ✓ Sabit omurga boyu, bağımsız kuyruk vuruşu ve farklı birey ritimleri doğrulandı");
  }

  console.log("🎉 ALL Whale Math & Kinematics Tests PASSED successfully!");
}

runTests();
