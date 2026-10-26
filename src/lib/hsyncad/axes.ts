import type { AxisElement, CadElement, Point } from "./model";

export type AxisDirection = "horizontal" | "vertical" | "free";
export type AxisLabelSide = "both" | "start" | "end";
export type AxisDrawingOptions = {
  direction: AxisDirection;
  /** Empty means the next unused automatic name. */
  name: string;
  extension: number;
  labelSide: AxisLabelSide;
};
export type AxisGridInput = {
  origin: Point;
  xSpacings: number[];
  ySpacings: number[];
  extension: number;
  labelSide: AxisLabelSide;
  floorId: string;
  materialId: string;
  layer?: string;
};
export type AxisInput = Omit<AxisGridInput, "origin" | "xSpacings" | "ySpacings"> & {
  start: Point;
  end: Point;
  direction: AxisDirection;
  name?: string;
};

const EPSILON = 1e-6;
const MAX_COORDINATE = 1_000_000;
const clean = (value: number) => Math.round(value * 1e9) / 1e9;

function assertNumber(value: number, label: string, positive = false) {
  if (!Number.isFinite(value) || Math.abs(value) > MAX_COORDINATE || (positive && value <= 0)) {
    throw new Error(`${label}: ${positive ? "sıfırdan büyük " : ""}sonlu bir metre değeri girin (en çok 1.000.000 m).`);
  }
}

function letterIndex(label: string): bigint {
  let index = BigInt(0);
  for (const character of label) index = index * BigInt(26) + BigInt(character.charCodeAt(0) - 64);
  return index;
}

function letterName(index: bigint): string {
  let result = "";
  while (index > BigInt(0)) {
    index -= BigInt(1);
    result = String.fromCharCode(65 + Number(index % BigInt(26))) + result;
    index /= BigInt(26);
  }
  return result;
}

/** Name sequences belong to a floor. Numeric sorting is numeric (2, 10 → 11). */
export function nextAxisName(elements: CadElement[], direction: AxisDirection, floorId: string): string {
  const labels = elements.filter((element) => element.type === "axis" && element.floorId === floorId).map((axis) => axis.name.trim().toUpperCase());
  let greatest = BigInt(0);
  for (const label of labels) {
    const valid = direction === "vertical" ? /^\d+$/.test(label) : /^[A-Z]+$/.test(label);
    if (!valid) continue;
    const index = direction === "vertical" ? BigInt(label) : letterIndex(label);
    if (index > greatest) greatest = index;
  }
  return direction === "vertical" ? (greatest + BigInt(1)).toString() : letterName(greatest + BigInt(1));
}

export function constrainAxisPoint(start: Point, end: Point, direction: AxisDirection): Point {
  if (direction === "horizontal") return { x: end.x, y: start.y };
  if (direction === "vertical") return { x: start.x, y: end.y };
  return { ...end };
}

/** Axes identify support lines; drawing the same line with different endpoints is a duplicate. */
export function sameAxisLine(a: Pick<AxisElement, "start" | "end">, b: Pick<AxisElement, "start" | "end">): boolean {
  const dx = a.end.x - a.start.x, dy = a.end.y - a.start.y;
  const length = Math.hypot(dx, dy);
  if (length < EPSILON) return false;
  const distance = (point: Point) => Math.abs(dx * (point.y - a.start.y) - dy * (point.x - a.start.x)) / length;
  return distance(b.start) < EPSILON && distance(b.end) < EPSILON;
}

export function createAxisElement(input: AxisInput, existing: CadElement[]): AxisElement {
  for (const point of [input.start, input.end]) {
    assertNumber(point.x, "Aks X"); assertNumber(point.y, "Aks Y");
  }
  assertNumber(input.extension, "Uç uzatma");
  if (input.extension < 0) throw new Error("Uç uzatma sıfır veya pozitif olmalıdır.");
  const start = { x: clean(input.start.x), y: clean(input.start.y) };
  const constrained = constrainAxisPoint(start, input.end, input.direction);
  const end = { x: clean(constrained.x), y: clean(constrained.y) };
  if (Math.hypot(end.x - start.x, end.y - start.y) < EPSILON) throw new Error("Aks uzunluğu sıfır olamaz; farklı bir bitiş noktası belirtin.");
  const name = input.name?.trim() || nextAxisName(existing, input.direction, input.floorId);
  if (name.length > 160) throw new Error("Aks adı en fazla 160 karakter olabilir.");
  const onFloor = existing.filter((element): element is AxisElement => element.type === "axis" && element.floorId === input.floorId);
  if (onFloor.some((axis) => axis.name.trim().toUpperCase() === name.toUpperCase())) throw new Error(`Bu katta “${name}” adlı aks zaten var. Başka ad girin veya otomatik adı kullanın.`);
  const coincident = onFloor.find((axis) => sameAxisLine({ start, end }, axis));
  if (coincident) throw new Error(`Bu doğru üzerinde ${coincident.name} aksı zaten var. Yeni bir konum seçin.`);
  return {
    id: `axis-${crypto.randomUUID()}`, type: "axis", name,
    floorId: input.floorId, materialId: input.materialId, layer: input.layer ?? "Akslar",
    start, end, orientation: input.direction, labelSide: input.labelSide, extension: input.extension,
  };
}

/** Semicolons separate bays; decimal comma is allowed: 4,5;3;6. */
export function parseAxisSpacings(text: string): number[] {
  const tokens = text.trim().split(";").map((token) => token.trim());
  if (!text.trim() || tokens.some((token) => !token)) throw new Error("Açıklıkları noktalı virgülle ayırın; boş aralık bırakmayın (örnek: 4;4,5;3).");
  if (tokens.length > 100) throw new Error("Bir yönde en fazla 100 açıklık oluşturabilirsiniz.");
  return tokens.map((token) => {
    if (!/^\d+(?:[.,]\d+)?$/.test(token)) throw new Error(`“${token}” geçerli bir açıklık değil. Metre cinsinden pozitif sayı girin.`);
    const value = Number(token.replace(",", "."));
    assertNumber(value, "Aks açıklığı", true);
    if (value < EPSILON) throw new Error("Aks açıklığı en az 0,000001 m olmalıdır.");
    return value;
  });
}

function cumulative(spacings: number[], origin: number): number[] {
  if (!spacings.length || spacings.length > 100) throw new Error("Her yönde 1–100 pozitif açıklık girin.");
  assertNumber(origin, "Başlangıç koordinatı");
  const positions = [origin];
  for (const span of spacings) {
    assertNumber(span, "Aks açıklığı", true);
    if (span < EPSILON) throw new Error("Aks açıklığı en az 0,000001 m olmalıdır.");
    const next = clean(positions[positions.length - 1] + span);
    assertNumber(next, "Aks konumu");
    positions.push(next);
  }
  return positions;
}

/** All-or-nothing grid generation. Call the application commit exactly once for the result. */
export function buildAxisGrid(input: AxisGridInput, existing: CadElement[]): AxisElement[] {
  const xs = cumulative(input.xSpacings, input.origin.x), ys = cumulative(input.ySpacings, input.origin.y);
  const result: AxisElement[] = [];
  const add = (start: Point, end: Point, direction: AxisDirection) => {
    result.push(createAxisElement({ ...input, start, end, direction }, [...existing, ...result]));
  };
  for (const x of xs) add({ x, y: ys[0] }, { x, y: ys[ys.length - 1] }, "vertical");
  for (const y of ys) add({ x: xs[0], y }, { x: xs[xs.length - 1], y }, "horizontal");
  return result;
}

/** Positive distance is +Y for horizontal, +X for vertical, left-normal for free axes. */
export function createParallelAxis(source: AxisElement, distance: number, existing: CadElement[], name?: string): AxisElement {
  assertNumber(distance, "Paralel aks mesafesi");
  if (Math.abs(distance) < EPSILON) throw new Error("Paralel aks mesafesi sıfır olamaz.");
  const dx = source.end.x - source.start.x, dy = source.end.y - source.start.y, length = Math.hypot(dx, dy);
  if (length < EPSILON) throw new Error("Kaynak aksın uzunluğu sıfır olamaz.");
  const direction: AxisDirection = Math.abs(dy) < EPSILON ? "horizontal" : Math.abs(dx) < EPSILON ? "vertical" : "free";
  const offset = direction === "horizontal" ? { x: 0, y: distance } : direction === "vertical" ? { x: distance, y: 0 } : { x: -dy / length * distance, y: dx / length * distance };
  return createAxisElement({
    start: { x: source.start.x + offset.x, y: source.start.y + offset.y },
    end: { x: source.end.x + offset.x, y: source.end.y + offset.y },
    direction, name, floorId: source.floorId, materialId: source.materialId, layer: source.layer,
    extension: source.extension ?? 1, labelSide: source.labelSide ?? "both",
  }, existing);
}

/** Visible tails are presentation only; original anchor endpoints remain the model geometry. */
export function extendedAxisEndpoints(axis: AxisElement): [Point, Point] {
  const dx = axis.end.x - axis.start.x, dy = axis.end.y - axis.start.y, length = Math.hypot(dx, dy);
  const extension = axis.extension ?? 0;
  if (length < EPSILON) return [{ ...axis.start }, { ...axis.end }];
  return [
    { x: axis.start.x - dx / length * extension, y: axis.start.y - dy / length * extension },
    { x: axis.end.x + dx / length * extension, y: axis.end.y + dy / length * extension },
  ];
}
