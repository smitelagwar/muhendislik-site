import type { CadModel, ColumnElement, BeamElement, SlabElement, Point } from "./model";

export interface SoilBearingCheck {
  qMaxKpa: number;
  qMinKpa: number;
  qSafeKpa: number;
  pass: boolean;
  statusText: string;
}

export function calculateSoilPressure(
  axialKn: number,
  momentKnm: number,
  widthM: number,
  depthM: number,
  qSafeKpa = 200
): SoilBearingCheck {
  const areaM2 = widthM * depthM;
  const sectionModulusM3 = (widthM * Math.pow(depthM, 2)) / 6;
  const qAvg = axialKn / areaM2;
  const qDiff = Math.abs(momentKnm) / Math.max(1e-4, sectionModulusM3);

  const qMaxKpa = qAvg + qDiff;
  const qMinKpa = Math.max(0, qAvg - qDiff);
  const pass = qMaxKpa <= qSafeKpa;

  return {
    qMaxKpa,
    qMinKpa,
    qSafeKpa,
    pass,
    statusText: pass
      ? `Zemin emniyet gerilmesi sağlandı (qmax = ${qMaxKpa.toFixed(1)} kPa ≤ ${qSafeKpa} kPa)`
      : `Zemin emniyet gerilmesi aşıldı (qmax = ${qMaxKpa.toFixed(1)} kPa > ${qSafeKpa} kPa)`,
  };
}

export function addPadFootingToColumn(
  model: CadModel,
  column: ColumnElement,
  widthM = 1.5,
  depthM = 1.5,
  heightM = 0.5
): CadModel {
  const footingId = `footing-${column.id}`;
  // Avoid duplicate footing
  const filtered = model.elements.filter(e => e.id !== footingId);

  const footing: ColumnElement = {
    id: footingId,
    name: `TK-${column.name}`,
    type: "column",
    floorId: column.floorId,
    materialId: column.materialId,
    layer: "Temeller",
    position: { ...column.position },
    width: widthM,
    depth: depthM,
    height: heightM,
    baseOffset: -heightM,
    topOffset: 0,
    rotation: column.rotation ?? 0,
  };

  return {
    ...model,
    elements: [...filtered, footing],
  };
}

export function addStripFootingToBeam(
  model: CadModel,
  beam: BeamElement,
  widthM = 0.8,
  heightM = 0.6
): CadModel {
  const footingId = `strip-${beam.id}`;
  const filtered = model.elements.filter(e => e.id !== footingId);

  const footing: BeamElement = {
    id: footingId,
    name: `ST-${beam.name}`,
    type: "beam",
    floorId: beam.floorId,
    materialId: beam.materialId,
    layer: "Temeller",
    start: { ...beam.start },
    end: { ...beam.end },
    width: widthM,
    height: heightM,
    topOffset: -(beam.height ?? 0.5),
  };

  return {
    ...model,
    elements: [...filtered, footing],
  };
}

export function addRaftFoundation(
  model: CadModel,
  floorId: string,
  corners: Point[],
  thicknessM = 0.5
): CadModel {
  const raftId = `raft-${crypto.randomUUID().slice(0, 8)}`;
  const raft: SlabElement = {
    id: raftId,
    name: `RAD-1`,
    type: "slab",
    floorId,
    materialId: model.materials[0]?.id ?? "concrete",
    layer: "Temeller",
    points: corners.map(p => ({ ...p })),
    thickness: thicknessM,
    topOffset: 0,
  };

  return {
    ...model,
    elements: [...model.elements, raft],
  };
}
