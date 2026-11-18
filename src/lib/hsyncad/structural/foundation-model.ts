import type { FrameNode } from "./frame-element";
import type { ShellRect } from "./shell-rect";
import type { FoundationEffectiveSettings } from "./foundation-contact";
import type { V3 } from "./frame-element";

export type FoundationLoad = { id: string; kind: "superstructure_reaction" | "soil_overburden" | "self_weight";
  xM: number; yM: number; verticalKn: number; source: string };

/** Exact Q4 area/4 tributaries from the same physical shell mesh used by P06. */
export function foundationNodeTributaryAreas(nodes:readonly FrameNode[],shells:readonly ShellRect[],foundationShellIds:readonly string[]):Record<string,number>{
  const index=new Map(nodes.map(n=>[n.id,n])),areas=new Map<string,number>(),ids=new Set(foundationShellIds);
  if(!ids.size||ids.size!==foundationShellIds.length||[...ids].some(id=>!shells.some(s=>s.id===id)))throw new Error("Foundation mesh scope must be unique and complete.");
  for(const shell of shells.filter(s=>ids.has(s.id))){
    const p=shell.nodes.map(id=>index.get(id)?.position);if(p.some(v=>!v))throw new Error(`Foundation mesh node missing for ${shell.id}.`);
    const a=[p[1]![0]-p[0]![0],p[1]![1]-p[0]![1],p[1]![2]-p[0]![2]] as V3,b=[p[3]![0]-p[0]![0],p[3]![1]-p[0]![1],p[3]![2]-p[0]![2]] as V3;
    const c=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]] as V3,area=Math.hypot(...c);
    if(!Number.isFinite(area)||area<=0)throw new Error(`Foundation shell ${shell.id} has no area.`);
    for(const id of shell.nodes)areas.set(id,(areas.get(id)??0)+area/4);
  }
  return Object.fromEntries(areas);
}

/** Add concrete and soil overburden as actual vertical pressure on the shell model (positive pressure acts +local Z). */
export function applyFoundationDeadLoads(input: {
  shells: ShellRect[]; nodes: readonly FrameNode[]; foundationShellIds: readonly string[]; concreteUnitWeightKnm3: number;
  concreteSelfWeightAlreadyIncluded:boolean;deadFactor:number;overburdenFactor:number;factorSource:string;
  soilUnitWeightKnm3: number | null; soilUnitWeightSource: string | null; overburdenDepthM: number | null; overburdenDepthSource: string | null;
}): ShellRect[] {
  if (!Number.isFinite(input.concreteUnitWeightKnm3) || input.concreteUnitWeightKnm3 <= 0 || typeof input.concreteSelfWeightAlreadyIncluded!=="boolean"
    || !Number.isFinite(input.deadFactor)||input.deadFactor<0||!Number.isFinite(input.overburdenFactor)||input.overburdenFactor<0||!input.factorSource.trim()) throw new Error("Temel beton birim ağırlığı, yük kombinasyonu katsayıları ve kaynakları açıkça belirtilmelidir.");
  const ids = new Set(input.foundationShellIds);
  if (!ids.size || ids.size !== input.foundationShellIds.length || [...ids].some(id => !input.shells.some(s => s.id === id))) throw new Error("Temel kabuk kapsamı benzersiz ve mevcut olmalıdır.");
  if (input.overburdenDepthM === null || !input.overburdenDepthSource?.trim()) throw new Error("Örtü derinliği ve kaynağı bilinmiyor; açıkça sıfır girilebilir.");
  const hasDepth = input.overburdenDepthM > 0;
  if (hasDepth && (input.soilUnitWeightKnm3 === null || !Number.isFinite(input.soilUnitWeightKnm3) || input.soilUnitWeightKnm3 <= 0 || !input.soilUnitWeightSource?.trim())) throw new Error("Örtü yükü için kaynaklı zemin birim ağırlığı gerekir.");
  if (!Number.isFinite(input.overburdenDepthM) || input.overburdenDepthM < 0) throw new Error("Örtü derinliği geçersiz.");
  const nodeMap = new Map(input.nodes.map(n=>[n.id,n]));
  return input.shells.map(shell => {
    if (!ids.has(shell.id)) return shell;
    const p = shell.nodes.map(id=>nodeMap.get(id)?.position);
    if (p.some(v=>!v)) throw new Error(`Kabuk ${shell.id} için düğüm konumu eksik.`);
    const a = [p[1]![0]-p[0]![0],p[1]![1]-p[0]![1],p[1]![2]-p[0]![2]], b = [p[3]![0]-p[0]![0],p[3]![1]-p[0]![1],p[3]![2]-p[0]![2]];
    const normalZ = a[0]*b[1]-a[1]*b[0];
    if (Math.abs(normalZ) < 1e-12) throw new Error(`Kabuk ${shell.id} yatay değil veya normal yönü belirsiz.`);
    const deadPressure = -((input.concreteSelfWeightAlreadyIncluded?0:input.deadFactor*input.concreteUnitWeightKnm3 * shell.thickness)
      + (hasDepth ? input.overburdenFactor*input.soilUnitWeightKnm3! * input.overburdenDepthM! : 0));
    // Existing ShellRect pressure is positive along its local normal; invert dead load for reversed node winding.
    return { ...shell, pressure: shell.pressure + (normalZ > 0 ? deadPressure : -deadPressure) };
  });
}

/** Thickness multiplier is local to the declared support footprint, with a strict geometric selection. */
export function applyFoundationThicknessFactor(input: {
  shells: ShellRect[]; nodes: readonly FrameNode[]; foundationShellIds: readonly string[];
  settings: FoundationEffectiveSettings; supportFootprints: readonly { xM: number; yM: number; widthM: number; lengthM: number; enlargementReferenceM?:number }[];
}): ShellRect[] {
  const factor = input.settings.thicknessFactor;
  if (factor === null) return input.shells;
  if (!Number.isFinite(factor) || factor <= 0) throw new Error("Temel kalınlık çarpanı pozitif olmalıdır.");
  const index = new Map(input.nodes.map(n => [n.id, n]));
  const foundationIds = new Set(input.foundationShellIds);
  let affected = 0;
  const result = input.shells.map(shell => {
    if (!foundationIds.has(shell.id)) return shell;
    const corners = shell.nodes.map(id => index.get(id)?.position);
    if (corners.some(p => !p)) throw new Error(`Kabuk ${shell.id} için düğüm konumu eksik.`);
    const cx = corners.reduce((s,p) => s + p![0], 0) / 4, cy = corners.reduce((s,p) => s + p![1], 0) / 4;
    const localSupport = input.supportFootprints.some(p => {
      const add=input.settings.connection==="enlarged"?(input.settings.enlargementRatio??0)*(p.enlargementReferenceM??0):0;
      return Math.abs(cx-p.xM) <= (p.widthM+2*add)/2 + 1e-10 && Math.abs(cy-p.yM) <= (p.lengthM+2*add)/2 + 1e-10;
    });
    if (!localSupport) return shell;
    affected++;
    return { ...shell, thickness: shell.thickness * factor };
  });
  if (input.supportFootprints.length && affected === 0) throw new Error("Kalınlık çarpanı hiçbir temel kabuğuna uygulanmadı; ağ/ayak izi eşleşmiyor.");
  return result;
}

/** Distributes an actual column/wall reaction over a connection footprint using explicit nodal tributary areas.
 * The normalized first moments must equal the declared footprint centre so the operation cannot invent a couple.
 */
export function distributeFoundationReaction(input: {
  nodes: readonly FrameNode[];
  reaction: { id: string; xM: number; yM: number; verticalKnOnSuperstructure: number };
  footprint: { widthM: number; lengthM: number; supportDepthM: number; enlargementReferenceM?:number; enlargementReferenceSource?:string };
  settings: FoundationEffectiveSettings;
  nodalTributaryAreaM2: Readonly<Record<string, number>>;
}): { nodes: FrameNode[]; footprint: { xM: number; yM: number; widthM: number; lengthM: number }; appliedVerticalKn: number; participatingNodeIds: string[];footprintBasis:string } {
  const ratio = input.settings.connection === "enlarged" ? input.settings.enlargementRatio : 0;
  if (!Number.isFinite(input.reaction.verticalKnOnSuperstructure) || !Number.isFinite(input.reaction.xM) || !Number.isFinite(input.reaction.yM)
    || !Number.isFinite(input.footprint.widthM) || !Number.isFinite(input.footprint.lengthM) || input.footprint.widthM <= 0 || input.footprint.lengthM <= 0
    || ratio===null || !Number.isFinite(ratio) || ratio < 0 || input.footprint.supportDepthM <= 0) throw new Error("Gerçek temel tepkisi, ayak izi, destek derinliği ve bağlantı oranı gerekir.");
  // The setting is applied only against a separately sourced, explicit h reference.
  if(input.settings.connection==="enlarged"&&(!input.footprint.enlargementReferenceM||input.footprint.enlargementReferenceM<=0||!input.footprint.enlargementReferenceSource?.trim()))
    throw new Error("Büyütülmüş bağlantı ayarı için referans h boyu ve fiziksel kaynağı açıkça verilmelidir; native eşdeğerlik varsayılmaz.");
  const addPerEdge = input.settings.connection === "enlarged" ? ratio * input.footprint.enlargementReferenceM! : 0;
  const footprint = { xM: input.reaction.xM, yM: input.reaction.yM, widthM: input.footprint.widthM + 2*addPerEdge, lengthM: input.footprint.lengthM + 2*addPerEdge };
  const selected = input.nodes.filter(n => Math.abs(n.position[0]-footprint.xM) <= footprint.widthM/2 + 1e-10 && Math.abs(n.position[1]-footprint.yM) <= footprint.lengthM/2 + 1e-10);
  if (!selected.length) throw new Error("Temel bağlantı alanında reaksiyonu taşıyacak ağ düğümü bulunamadı.");
  const weights = selected.map(n => {
    const area = input.nodalTributaryAreaM2[n.id];
    if (!Number.isFinite(area) || area <= 0) throw new Error(`Düğüm ${n.id} için pozitif tributary alanı gerekir.`);
    return area;
  });
  const totalArea = weights.reduce((a,b)=>a+b,0), cx = selected.reduce((s,n,i)=>s+n.position[0]*weights[i],0)/totalArea,
    cy = selected.reduce((s,n,i)=>s+n.position[1]*weights[i],0)/totalArea;
  if (Math.abs(cx-footprint.xM) > Math.max(1e-8, footprint.widthM*1e-6) || Math.abs(cy-footprint.yM) > Math.max(1e-8, footprint.lengthM*1e-6))
    throw new Error("Ağ düğüm tributary alanları bağlantı merkezinde kuvvet/moment dengesi sağlamıyor.");
  const load = -input.reaction.verticalKnOnSuperstructure; // action/reaction pair, preserve sign; no abs(N).
  const additions = new Map(selected.map((n,i)=>[n.id, load * weights[i] / totalArea]));
  const nodes = input.nodes.map(node => {
    const add = additions.get(node.id) ?? 0;
    return add === 0 ? node : { ...node, load: [node.load[0], node.load[1], node.load[2]+add, node.load[3], node.load[4], node.load[5]] as FrameNode["load"] };
  });
  return { nodes, footprint, appliedVerticalKn: load, participatingNodeIds: selected.map(n=>n.id),
    footprintBasis:input.settings.connection==="enlarged"?`h=${input.footprint.enlargementReferenceM}m (${input.footprint.enlargementReferenceSource})`:"straight connection footprint as explicit geometry" };
}

export function foundationUpperBaseReactions(input: { nodes: readonly FrameNode[]; footprint: { xM:number;yM:number;widthM:number;lengthM:number } }): { nodeIds:string[]; status:"reaction-export-scope"; note:string } {
  // This only identifies the upper-structure cut; foundation soil pressure is a separate model/result.
  const nodeIds = input.nodes.filter(n => Math.abs(n.position[0]-input.footprint.xM)<=input.footprint.widthM/2+1e-10
    && Math.abs(n.position[1]-input.footprint.yM)<=input.footprint.lengthM/2+1e-10).map(n=>n.id);
  return { nodeIds, status:"reaction-export-scope", note:"Cut reactions require a separate footing/raft equilibrium model; these nodes are not soil supports." };
}
