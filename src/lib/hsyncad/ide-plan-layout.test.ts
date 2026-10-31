import test from "node:test";
import assert from "node:assert/strict";
import { axisEndLabels, fitPlanView, hitPlanElement, insidePlanArea, memberLabel, planFontPixels, planGridStep, slabLabelAnchor } from "./ide-plan-layout";
import type { IdeElement } from "./ide-import";

const element = (data: Partial<IdeElement>): IdeElement => ({ id: "a", nativeId: 1, name: "A", type: "axis", floorId: "f", points: [], sourceOffset: 1, primitiveType: 6, layerId: 1, nativeZ: 0, lateralOffset: 0, rotation: 0, ...data });
const rectangle = (x: number, y: number, w: number, h: number) => [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];

test("axis annotation is bound to two original endpoints, never to the centre", () => {
  const axis = element({ points: [{ x: -4, y: 8 }, { x: 36, y: 8 }] });
  assert.deepEqual(axisEndLabels(axis), [{ x: -4, y: 8 }, { x: 36, y: 8 }]);
  assert.deepEqual(axisEndLabels(element({ type: "beam", points: axis.points })), []);
  assert.deepEqual(axis.points, [{ x: -4, y: 8 }, { x: 36, y: 8 }]);
});

test("fit reserves screen room for endpoint circles and recentres for a new viewport", () => {
  const axis = element({ points: [{ x: -5, y: -4 }, { x: 45, y: 32 }] });
  for (const [width, height] of [[900, 1000], [1800, 900], [300, 390]]) {
    const fit = fitPlanView([axis], width, height)!;
    assert.equal(fit.x, 20); assert.equal(fit.y, 14);
    for (const p of axis.points) {
      const x = width / 2 + (p.x - fit.x) * fit.scale, y = height / 2 - (p.y - fit.y) * fit.scale;
      assert.ok(x >= 15 && x <= width - 15); assert.ok(y >= 15 && y <= height - 15);
    }
  }
  assert.equal(fitPlanView([], 900, 900), undefined);
});

test("drawing labels grow with the model instead of staying at a constant UI font", () => {
  assert.equal(planFontPixels(50), 2 * planFontPixels(25));
  assert.ok(planFontPixels(10) < 3);
  assert.ok(planFontPixels(100) > 10);
  for (const scale of [2, 10, 20, 30, 50, 100, 200]) assert.ok(planGridStep(scale) * scale >= 55 && planGridStep(scale) * scale <= 130, "reference grid remains sparse at every zoom");
});

test("member labels remain upright and keep native gross section dimensions instead of clear footprint lengths", () => {
  const horizontal = element({ name: "P2", type: "wall", structural: true, points: [{ x: 0, y: 0 }, { x: 4.6, y: 0 }], footprint: rectangle(0, 0, 4.6, .25), width: .25, planAnnotation: { section: "485/25" } });
  assert.equal(memberLabel(horizontal)!.text, "P2  485/25");
  assert.ok(memberLabel(horizontal)!.anchor.x < .2, "native member labels begin near the readable member end, not at its midpoint");
  assert.equal(memberLabel({ ...horizontal, planAnnotation: undefined })!.text, "P2", "an unverified size must not be invented from the clipped outline");
  const vertical = element({ name: "P35", type: "wall", structural: true, points: [{ x: 1, y: 5 }, { x: 1, y: 3.5 }], footprint: [{ x: .75, y: 5 }, { x: .75, y: 3.5 }, { x: 1, y: 3.5 }, { x: 1, y: 5 }], width: .25, planAnnotation: { section: "25/150" } });
  const label = memberLabel(vertical)!;
  assert.equal(label.text, "P35  25/150");
  assert.equal(label.angle, -Math.PI / 2);
  const ring = vertical.footprint!;
  assert.deepEqual(memberLabel({ ...vertical, points: [...vertical.points].reverse(), footprint: [ring[1], ring[0], ring[3], ring[2]] }), label, "reversing the source endpoints must not flip text reading direction or move its anchor");
  const diagonal = element({ name: "K1", type: "beam", sectionLabel: "25/50", points: [{ x: 2, y: 2 }, { x: -2, y: -2 }] });
  assert.equal(memberLabel(diagonal)!.text, "K1  25/50");
  assert.ok(Math.abs(memberLabel(diagonal)!.angle) <= Math.PI / 2);
});

test("slab labels fit inside a concave filled area and cannot cross a narrow opening", () => {
  const slab = element({ type: "slab", points: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 8 }, { x: 0, y: 8 }], holes: [rectangle(.7, 6.8, .15, .8)] });
  const anchor = slabLabelAnchor(slab, 1.8, .5)!;
  assert.ok(anchor);
  const rect = { x: anchor.x, y: anchor.y - .5, width: 1.8, height: .5 };
  for (let x = rect.x; x <= rect.x + rect.width; x += .03) for (let y = rect.y; y <= rect.y + rect.height; y += .03) assert.ok(insidePlanArea({ x, y }, slab.points, slab.holes));
  assert.ok(anchor.x >= .85 || anchor.y - .5 >= 7.6 || anchor.y <= 6.8, "annotation cannot bridge the thin opening");
  assert.equal(slabLabelAnchor(element({ type: "slab", points: rectangle(0, 0, .2, .2) }), 1, .5), undefined);
});

test("pointer selection accepts filled slabs, rejects holes and prioritises physical members", () => {
  const slab = element({ id: "slab", type: "slab", points: rectangle(0, 0, 8, 6), holes: [rectangle(3, 2, 2, 2)] });
  const beam = element({ id: "beam", type: "beam", points: [{ x: 0, y: 1 }, { x: 8, y: 1 }], footprint: rectangle(0, .85, 8, .3) });
  const axis = element({ id: "axis", points: [{ x: -1, y: 1 }, { x: 9, y: 1 }] });
  const elements = [axis, slab, beam];
  assert.equal(hitPlanElement(elements, { x: 6, y: 4 }, .1)?.id, "slab", "interior selection does not require finding a polygon edge");
  assert.equal(hitPlanElement(elements, { x: 4, y: 3 }, .1), undefined, "the opening is empty space");
  assert.equal(hitPlanElement(elements, { x: 4, y: 1 }, .1)?.id, "beam", "the slab and axis below cannot steal the member click");
  assert.equal(hitPlanElement(elements, { x: -1, y: 1.18 }, .03)?.id, "axis", "the endpoint bubble remains selectable outside the line tolerance");
});
