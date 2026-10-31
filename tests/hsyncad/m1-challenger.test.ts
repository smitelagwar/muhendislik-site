import assert from "node:assert/strict";
import { test, describe } from "node:test";
import * as React from "react";
import fs from "node:fs";
import path from "node:path";

import { PRODUCT_RIBBON_TABS } from "../../src/lib/hsyncad/product-ribbon";
import { NATIVE_RIBBON_TABS, type NativeRibbonCommand } from "../../src/lib/hsyncad/ribbon-layout";
import { createDemoModel, createEmptyModel, type CadModel, type ColumnElement, type BeamElement } from "../../src/lib/hsyncad/model";
import { addStairToModel, calculateStairGeometry, DEFAULT_STAIR_PARAMS } from "../../src/lib/hsyncad/stairs";
import { addPadFootingToColumn, addStripFootingToBeam, addRaftFoundation, calculateSoilPressure } from "../../src/lib/hsyncad/foundations";
import { useDrawingSession } from "../../src/components/hsyncad/use-drawing-session";

// Helper: recursively extract all commands from a hierarchy
function crawlAllCommands(commands: NativeRibbonCommand[]): NativeRibbonCommand[] {
  const list: NativeRibbonCommand[] = [];
  for (const cmd of commands) {
    list.push(cmd);
    if (cmd.children && Array.isArray(cmd.children) && cmd.children.length > 0) {
      list.push(...crawlAllCommands(cmd.children));
    }
  }
  return list;
}

describe("Milestone 1 Adversarial Verification - Challenger 1", () => {

  // =========================================================================
  // 1. NON-RC ELEMENT BUTTONS PRUNING ORACLE
  // =========================================================================
  describe("1. Deep Non-RC Element Buttons Pruning Oracle", () => {
    const forbiddenKeywords = [
      "çelik", "celik",
      "kazık", "kazik",
      "kubbe",
      "tonoz",
      "aşık", "asik",
      "iskele",
      "steel", "pile", "dome", "vault", "purlin", "scaffold"
    ];

    const forbiddenSymbolRegex = /STEEL|PILE|DOME|VAULT|PURLIN|SCAFFOLD/i;

    const allProductCommands = PRODUCT_RIBBON_TABS.flatMap(tab =>
      tab.panels.flatMap(panel => crawlAllCommands(panel.commands))
    );

    test("PRODUCT_RIBBON_TABS contains strictly 0 non-RC element buttons across all tabs, panels, and subcommands", () => {
      const violations: { id: string | number; label: string; symbol?: string; reason: string }[] = [];

      for (const cmd of allProductCommands) {
        // Exception: Beam-column joint commands are RC safety checks
        if (cmd.commandId === 12260 || cmd.commandId === 11910) continue;

        const rawLabel = cmd.label || "";
        const trLower = rawLabel.toLocaleLowerCase("tr-TR");
        const enLower = rawLabel.toLowerCase();
        const symbol = cmd.symbol || "";

        for (const kw of forbiddenKeywords) {
          if (trLower.includes(kw) || enLower.includes(kw)) {
            violations.push({
              id: cmd.commandId ?? cmd.id,
              label: rawLabel,
              symbol,
              reason: `Label contains forbidden non-RC keyword '${kw}'`
            });
          }
        }

        if (forbiddenSymbolRegex.test(symbol)) {
          violations.push({
            id: cmd.commandId ?? cmd.id,
            label: rawLabel,
            symbol,
            reason: `Symbol matches forbidden non-RC pattern '${symbol}'`
          });
        }
      }

      assert.equal(
        violations.length,
        0,
        `Found ${violations.length} non-RC command buttons in PRODUCT_RIBBON_TABS:\n` +
        violations.map(v => ` - ID: ${v.id}, Label: "${v.label}", Symbol: "${v.symbol}", Reason: ${v.reason}`).join("\n")
      );
    });

    test("Excluded tabs 'Çelik' and 'Birleşim' are absent from PRODUCT_RIBBON_TABS", () => {
      const tabLabels = PRODUCT_RIBBON_TABS.map(t => t.label);
      assert.ok(!tabLabels.includes("Çelik"), "Tab 'Çelik' must be excluded");
      assert.ok(!tabLabels.includes("Birleşim"), "Tab 'Birleşim' must be excluded");
    });

    test("Oracle verification against NATIVE_RIBBON_TABS: confirmed non-RC commands in native layout are pruned", () => {
      const allNativeCommands = NATIVE_RIBBON_TABS.flatMap(tab =>
        tab.panels.flatMap(panel => crawlAllCommands(panel.commands))
      );

      const nativeSteelOrScaffold = allNativeCommands.filter(c => {
        if (c.commandId === 12260 || c.commandId === 11910) return false;
        const l = (c.label || "").toLocaleLowerCase("tr-TR");
        const s = c.symbol || "";
        return l.includes("çelik") || l.includes("kazık") || l.includes("kubbe") ||
               l.includes("tonoz") || l.includes("aşık") || l.includes("iskele") ||
               forbiddenSymbolRegex.test(s);
      });

      assert.ok(nativeSteelOrScaffold.length > 30, `Native layout should have contained > 30 non-RC buttons (found ${nativeSteelOrScaffold.length})`);

      // Verify that none of these native non-RC commands exist in PRODUCT_RIBBON_TABS
      const productIds = new Set(allProductCommands.map(c => c.id));
      for (const nonRc of nativeSteelOrScaffold) {
        assert.ok(!productIds.has(nonRc.id), `Non-RC command '${nonRc.label}' (${nonRc.id}) should have been pruned from PRODUCT_RIBBON_TABS`);
      }
    });
  });

  // =========================================================================
  // 2. BEAM-COLUMN JOINT COMMANDS PRESERVATION
  // =========================================================================
  describe("2. Beam-Column Joint Commands Preservation (TBDY 2018 §7.5)", () => {
    const allProductCommands = PRODUCT_RIBBON_TABS.flatMap(tab =>
      tab.panels.flatMap(panel => crawlAllCommands(panel.commands))
    );

    test("Command 12260 (CM_COLBEAM_JOIN_REPORT) is preserved and intact", () => {
      const cmd12260 = allProductCommands.find(c => c.commandId === 12260);
      assert.ok(cmd12260, "Command 12260 must exist in PRODUCT_RIBBON_TABS");
      assert.equal(cmd12260.commandId, 12260);
      assert.match(cmd12260.label, /birleşim/i, "Label must describe joint safety");
      assert.match(cmd12260.label, /kolon.*kiriş/i, "Label must mention column-beam");
    });

    test("Command 11910 (CM_HORIZONTAL_COLBEAM_JOINT_SECTION) is preserved and intact", () => {
      const cmd11910 = allProductCommands.find(c => c.commandId === 11910);
      assert.ok(cmd11910, "Command 11910 must exist in PRODUCT_RIBBON_TABS");
      assert.equal(cmd11910.commandId, 11910);
      assert.match(cmd11910.label, /birleşim/i, "Label must describe joint");
      assert.match(cmd11910.label, /kesit/i, "Label must mention section");
    });

    test("Both joint commands are wired in workbench.tsx ribbonActions", () => {
      const workbenchFile = fs.readFileSync(path.resolve(__dirname, "../../src/components/hsyncad/workbench.tsx"), "utf8");
      assert.ok(/\b12260\s*:/.test(workbenchFile), "workbench.tsx must have handler for 12260");
      assert.ok(/\b11910\s*:/.test(workbenchFile), "workbench.tsx must have handler for 11910");
    });
  });

  // =========================================================================
  // 3. WORKBENCH MAPPED ACTIONS & STRUCTURAL EXECUTION
  // =========================================================================
  describe("3. Workbench Mapped Actions & Structural Execution Stress Test", () => {
    const workbenchFile = fs.readFileSync(path.resolve(__dirname, "../../src/components/hsyncad/workbench.tsx"), "utf8");

    test("Every required RC command ID is registered in ribbonActions", () => {
      const requiredIds = [
        12576, // Radye Temel
        12430, // Radye Temel (alias)
        14351, // Radye Kenarı
        14611, // Radye Kenarı Ayarları
        13135, // Radye Boşluğu
        13110, // Döşeme Boşluğu
        1823,  // Eğrisel Kiriş
        1824,  // Yay Kiriş
        1825,  // Dairesel Kiriş
        1829,  // Sürekli Yay Kiriş
        13812, // Subasman Perdesi
        40074, // Eğrisel Perde
        40071, // Yay Aks
        40072, // 3 Noktadan Yay Aks
        40350, // Yarı Rijit Diyafram
        12710, // Tekil Temel
        12750, // Tekil Temel parametreleri
        12690, // Sürekli Temel
        12700, // Sürekli Temel parametreleri
        11940, // Tekil Temel aplikasyon
        11980, // Sürekli Temel aplikasyon
        13830, // Merdiven
        13840, // Merdiven parametreleri
        62790, // Merdiven
        62791, // Merdiven
        11910, // Kolon-Kiriş Birleşim Kesiti
        12260, // Kolon-Kiriş Birleşim Güvenliği
      ];

      for (const id of requiredIds) {
        assert.ok(new RegExp(`\\b${id}\\s*:`).test(workbenchFile), `workbench.tsx ribbonActions must include ID ${id}`);
      }
    });

    test("Radye Foundation generation (12576): executes cleanly under standard, empty, and irregular column layouts", () => {
      // 1. Standard demo model (4 columns)
      const demo = createDemoModel();
      const floor0 = demo.floors[0].id;
      const initialCount = demo.elements.length;

      const demoCols = demo.elements.filter(e => e.type === "column" && e.floorId === floor0) as ColumnElement[];
      const xs = demoCols.map(c => c.position.x);
      const ys = demoCols.map(c => c.position.y);
      const corners = [
        { x: Math.min(...xs) - 1.0, y: Math.min(...ys) - 1.0 },
        { x: Math.max(...xs) + 1.0, y: Math.min(...ys) - 1.0 },
        { x: Math.max(...xs) + 1.0, y: Math.max(...ys) + 1.0 },
        { x: Math.min(...xs) - 1.0, y: Math.max(...ys) + 1.0 },
      ];

      const withRaft = addRaftFoundation(demo, floor0, corners, 0.50);
      assert.equal(withRaft.elements.length, initialCount + 1);
      const raft = withRaft.elements.at(-1);
      assert.ok(raft && raft.type === "slab");
      assert.equal(raft.layer, "Temeller");
      assert.equal(raft.thickness, 0.50);

      // 2. Empty model (0 columns) - must not throw or divide by zero
      const empty = createEmptyModel();
      const emptyCols = empty.elements.filter(e => e.type === "column");
      const emptyXs = emptyCols.length ? emptyCols.map(c => c.position.x) : [0, 4];
      const emptyYs = emptyCols.length ? emptyCols.map(c => c.position.y) : [0, 4];
      const emptyCorners = [
        { x: Math.min(...emptyXs) - 1.0, y: Math.min(...emptyYs) - 1.0 },
        { x: Math.max(...emptyXs) + 1.0, y: Math.min(...emptyYs) - 1.0 },
        { x: Math.max(...emptyXs) + 1.0, y: Math.max(...emptyYs) + 1.0 },
        { x: Math.min(...emptyXs) - 1.0, y: Math.max(...emptyYs) + 1.0 },
      ];
      const emptyRaft = addRaftFoundation(empty, empty.floors[0].id, emptyCorners, 0.50);
      assert.equal(emptyRaft.elements.length, 1);

      // 3. Negative coordinates model
      const negCorners = [{ x: -10, y: -20 }, { x: -2, y: -20 }, { x: -2, y: -5 }, { x: -10, y: -5 }];
      const negRaft = addRaftFoundation(demo, floor0, negCorners, 0.60);
      const raftNeg = negRaft.elements.at(-1);
      assert.ok(raftNeg && raftNeg.type === "slab");
      assert.equal(raftNeg.thickness, 0.60);
    });

    test("Pad Footing (12710/11940) idempotence and precision", () => {
      const demo = createDemoModel();
      const col = demo.elements.find(e => e.type === "column") as ColumnElement;
      assert.ok(col);

      // Step 1: Add footing
      const step1 = addPadFootingToColumn(demo, col, 1.8, 1.8, 0.6);
      const footing1 = step1.elements.find(e => e.id === `footing-${col.id}`) as ColumnElement;
      assert.ok(footing1);
      assert.equal(footing1.width, 1.8);
      assert.equal(footing1.depth, 1.8);
      assert.equal(footing1.height, 0.6);
      assert.equal(footing1.baseOffset, -0.6);

      // Step 2: Idempotence test - adding again updates dimensions, does NOT duplicate
      const step2 = addPadFootingToColumn(step1, col, 2.0, 2.0, 0.7);
      const footings = step2.elements.filter(e => e.id === `footing-${col.id}`);
      assert.equal(footings.length, 1, "Must not create duplicate footing elements for the same column");
      assert.equal((footings[0] as ColumnElement).width, 2.0);
      assert.equal((footings[0] as ColumnElement).height, 0.7);
    });

    test("Strip Footing (12690) along beam execution and idempotence", () => {
      const demo = createDemoModel();
      const beam = demo.elements.find(e => e.type === "beam") as BeamElement;
      assert.ok(beam);

      const step1 = addStripFootingToBeam(demo, beam, 0.9, 0.7);
      const footing1 = step1.elements.find(e => e.id === `strip-${beam.id}`) as BeamElement;
      assert.ok(footing1);
      assert.equal(footing1.width, 0.9);
      assert.equal(footing1.height, 0.7);
      assert.equal(footing1.layer, "Temeller");

      // Idempotence
      const step2 = addStripFootingToBeam(step1, beam, 1.0, 0.8);
      const strips = step2.elements.filter(e => e.id === `strip-${beam.id}`);
      assert.equal(strips.length, 1, "Must not duplicate strip footings");
    });

    test("Soil bearing calculation stress test", () => {
      // Safe scenario
      const safe = calculateSoilPressure(500, 50, 2.0, 2.0, 200);
      assert.ok(safe.pass);
      assert.ok(safe.qMaxKpa <= 200);

      // Overstressed scenario
      const failed = calculateSoilPressure(1200, 200, 1.5, 1.5, 200);
      assert.ok(!failed.pass);
      assert.ok(failed.qMaxKpa > 200);
    });

    test("Stair geometry calculation and Blondel comfort formula verification", () => {
      const start = { x: 0, y: 0 };
      const end = { x: 4.8, y: 0 };
      const calc = calculateStairGeometry(DEFAULT_STAIR_PARAMS, start, end);

      assert.equal(calc.totalRunM, 4.8);
      assert.equal(calc.totalHeightM, 16 * 0.175); // 2.80 m
      assert.equal(calc.treadDepthM, 4.8 / 16); // 0.30 m
      // Blondel: 2 * 0.175 + 0.30 = 0.65 m (within comfort range 0.58 .. 0.66)
      assert.ok(calc.comfortFormulaCheck);
      assert.ok(calc.concreteVolumeM3 > 0);
      assert.ok(calc.formworkAreaM2 > 0);
    });
  });

  // =========================================================================
  // 4. DRAWING SESSION STATE TRANSITIONS (STAIR & FOOTING INTERACTIVE MODES)
  // =========================================================================
  describe("4. Drawing Session State Transitions & Adversarial Sequences", () => {

    // Setup React 19 Hook Runner for useDrawingSession
    function createSessionRunner(initialModel = createDemoModel()) {
      let currentModel = initialModel;
      const messages: string[] = [];
      const revealedLayers: string[] = [];
      let commitsCount = 0;

      const states: any[] = [];
      const refs: any[] = [];

      function runHook(tool = "column", activeType: any = "column") {
        let stateIdx = 0;
        let refIdx = 0;

        const internals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
        internals.H = {
          useState: (init: any) => {
            const idx = stateIdx++;
            if (states.length <= idx) {
              states.push(typeof init === "function" ? init() : init);
            }
            const setState = (val: any) => {
              states[idx] = typeof val === "function" ? val(states[idx]) : val;
            };
            return [states[idx], setState];
          },
          useRef: (init: any) => {
            const idx = refIdx++;
            if (refs.length <= idx) {
              refs.push({ current: init });
            }
            return refs[idx];
          },
          useMemo: (f: any) => f(),
          useCallback: (f: any) => f(),
        };

        const defaults = {
          column: { width: 0.3, depth: 0.3, height: 3, thickness: 0 },
          beam: { width: 0.25, depth: 0, height: 0.5, thickness: 0 },
          wall: { width: 0.25, depth: 0, height: 3, thickness: 0 },
          slab: { width: 0, depth: 0, height: 0, thickness: 0.15 },
          dimension: { width: 0, depth: 0, height: 0, thickness: 0 },
        };

        return useDrawingSession({
          model: currentModel,
          floor: currentModel.floors[0],
          tool: tool as any,
          activeType,
          defaults: defaults as any,
          axisOptions: { direction: "horizontal", name: "1", bubbleRadius: 0.5, offset: 0, extension: 0.5, labelPosition: "both" } as any,
          onAxisOptions: () => {},
          commit: (next: CadModel, msg: string) => {
            currentModel = next;
            commitsCount++;
            messages.push(msg);
            return true;
          },
          onSelect: () => {},
          onMessage: (msg: string) => {
            messages.push(msg);
          },
          onFit: () => {},
          onReveal: (layer: string) => {
            revealedLayers.push(layer);
          },
        });
      }

      return {
        getModel: () => currentModel,
        getMessages: () => messages,
        getRevealed: () => revealedLayers,
        getCommits: () => commitsCount,
        runHook,
      };
    }

    test("2-Click Stair: Normal valid sequence creates stair slab and returns to default mode", () => {
      const runner = createSessionRunner();
      let session = runner.runHook();

      // Step 1: startStair
      session.startStair();
      session = runner.runHook();
      assert.equal(session.interactiveMode, "stair");
      assert.equal(session.pending.length, 0);

      // Step 2: Click 1 (start point)
      session.placePoint({ x: 1.0, y: 1.0 });
      session = runner.runHook();
      assert.equal(session.interactiveMode, "stair");
      assert.equal(session.pending.length, 1);
      assert.deepEqual(session.pending[0], { x: 1.0, y: 1.0 });

      // Verify preview is generated
      assert.ok(session.preview, "Preview must be rendered after 1st click in stair mode");
      assert.equal(session.preview?.layer, "Merdivenler");
      assert.equal(session.preview?.type, "slab");

      // Step 3: Click 2 (end point)
      session.placePoint({ x: 5.8, y: 1.0 });
      session = runner.runHook();

      // Postcondition: mode returns to default, pending cleared, layer revealed
      assert.equal(session.interactiveMode, "default");
      assert.equal(session.pending.length, 0);
      assert.ok(runner.getRevealed().includes("Merdivenler"));
      assert.equal(runner.getCommits(), 1);

      // Verify model element
      const model = runner.getModel();
      const stair = model.elements.find(e => e.layer === "Merdivenler");
      assert.ok(stair);
      assert.equal(stair.type, "slab");
      if (stair.type === "slab") {
        assert.equal(stair.points.length, 4);
      }
    });

    test("2-Click Stair: Degenerate distance (< 0.10 m) is rejected and does not corrupt state", () => {
      const runner = createSessionRunner();
      let session = runner.runHook();

      session.startStair();
      session = runner.runHook();

      // Click 1
      session.placePoint({ x: 2.0, y: 2.0 });
      session = runner.runHook();
      assert.equal(session.pending.length, 1);

      // Click 2 with distance = 0.05 m (< 0.10 m)
      session.placePoint({ x: 2.04, y: 2.03 });
      session = runner.runHook();

      // Must reject, keep pending[0], stay in stair mode, 0 commits
      assert.equal(session.interactiveMode, "stair");
      assert.equal(session.pending.length, 1);
      assert.equal(runner.getCommits(), 0);
      assert.ok(runner.getMessages().some(m => m.includes("en az 0.10 m")));

      // Now valid click 3
      session.placePoint({ x: 6.0, y: 2.0 });
      session = runner.runHook();

      assert.equal(session.interactiveMode, "default");
      assert.equal(session.pending.length, 0);
      assert.equal(runner.getCommits(), 1);
    });

    test("2-Click Stair: Cancel mid-draft via clearDraft() cleanly aborts", () => {
      const runner = createSessionRunner();
      let session = runner.runHook();

      session.startStair();
      session = runner.runHook();

      session.placePoint({ x: 3.0, y: 3.0 });
      session = runner.runHook();
      assert.equal(session.pending.length, 1);

      // Simulate Escape key cancel
      session.clearDraft();
      session = runner.runHook();

      assert.equal(session.interactiveMode, "default");
      assert.equal(session.pending.length, 0);
      assert.equal(runner.getCommits(), 0);
    });

    test("1-Click Footing: Snapping to valid column creates pad footing and resets mode", () => {
      const runner = createSessionRunner();
      let session = runner.runHook();

      const model = runner.getModel();
      const col = model.elements.find(e => e.type === "column") as ColumnElement;
      assert.ok(col);

      session.startFooting();
      session = runner.runHook();
      assert.equal(session.interactiveMode, "footing");

      // Click within snap distance of column
      session.placePoint({ x: col.position.x + 0.2, y: col.position.y + 0.2 });
      session = runner.runHook();

      assert.equal(session.interactiveMode, "default");
      assert.ok(runner.getRevealed().includes("Temeller"));
      assert.equal(runner.getCommits(), 1);

      const updatedModel = runner.getModel();
      const footing = updatedModel.elements.find(e => e.id === `footing-${col.id}`);
      assert.ok(footing);
    });

    test("1-Click Footing: Click on empty space (no column) is rejected and retains footing mode", () => {
      const runner = createSessionRunner();
      let session = runner.runHook();

      session.startFooting();
      session = runner.runHook();
      assert.equal(session.interactiveMode, "footing");

      // Click far away from any column
      session.placePoint({ x: 999.0, y: 999.0 });
      session = runner.runHook();

      assert.equal(session.interactiveMode, "footing", "Mode must remain footing when no column hit");
      assert.equal(runner.getCommits(), 0);
      assert.ok(runner.getMessages().some(m => m.includes("kolon düğüm noktasına tıklayın")));
    });

    test("Footing Mode: Enter key triggers batch footing creation on lowest floor", () => {
      const runner = createSessionRunner();
      let session = runner.runHook();

      session.startFooting();
      session = runner.runHook();
      assert.equal(session.interactiveMode, "footing");

      const handled = session.handleKey({ key: "Enter", preventDefault: () => {} } as any);
      session = runner.runHook();

      assert.ok(handled);
      assert.equal(session.interactiveMode, "default");
      assert.equal(runner.getCommits(), 1);
      assert.ok(runner.getMessages().some(m => m.includes("tekil temel oluşturuldu")));
    });

    test("Footing Mode: Enter key on model with 0 columns fails gracefully", () => {
      const emptyModel = createEmptyModel();
      const runner = createSessionRunner(emptyModel);
      let session = runner.runHook();

      session.startFooting();
      session = runner.runHook();

      const handled = session.handleKey({ key: "Enter", preventDefault: () => {} } as any);
      session = runner.runHook();

      assert.ok(handled);
      assert.equal(runner.getCommits(), 0);
      assert.ok(runner.getMessages().some(m => m.includes("Temel eklenecek kolon bulunamadı")));
    });

    test("Adversarial Input Hardening: NaN and Infinity coordinate injection", () => {
      const runner = createSessionRunner();
      let session = runner.runHook();

      session.startStair();
      session = runner.runHook();

      session.placePoint({ x: NaN, y: 0 });
      session = runner.runHook();
      assert.equal(session.pending.length, 0);
      assert.ok(runner.getMessages().some(m => m.includes("Geçerli X/Y girin")));

      session.placePoint({ x: 1, y: Infinity });
      session = runner.runHook();
      assert.equal(session.pending.length, 0);
      assert.ok(runner.getMessages().some(m => m.includes("Geçerli X/Y girin")));
    });

    test("Mode Switching: Switching from stair to footing directly without cancel clears intermediate state", () => {
      const runner = createSessionRunner();
      let session = runner.runHook();

      // Start stair and place point 1
      session.startStair();
      session = runner.runHook();
      session.placePoint({ x: 2, y: 2 });
      session = runner.runHook();
      assert.equal(session.pending.length, 1);

      // Direct switch to footing
      session.startFooting();
      session = runner.runHook();
      assert.equal(session.interactiveMode, "footing");
      assert.equal(session.pending.length, 0, "Pending points from stair mode must be cleared");
    });
  });
});
