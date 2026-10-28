import { FRAME_SPAN, LEVEL_HEIGHT, LEVELS, SLAB_LIFT, makeBlueprint, type Blueprint, type V3 } from "./motion";
import type { ScenarioId } from "./scenarios";

/** Structurally distinct regular teaching reference, not a safety assessment. */
export function makeReferenceBlueprint(scenario:ScenarioId):Blueprint {
  const template=makeBlueprint("B1");
  const segments=template.segments.filter(s=>s.kind!=="highlight")
    .map(s=>({...s,a:[...s.a] as V3,b:[...s.b] as V3}));
  const slabs=template.slabs.map(s=>({...s}));
  if(scenario==="A1"){
    for(let floor=1;floor<=LEVELS;floor++){
      const y0=(floor-1)*LEVEL_HEIGHT,y1=floor*LEVEL_HEIGHT;
      for(const x of [-FRAME_SPAN,FRAME_SPAN])
        segments.push({a:[x,y0,-FRAME_SPAN/2],b:[x,y1,-FRAME_SPAN/2],kind:"wall",storey:floor});
    }
  }
  if(scenario==="B2"){
    for(let floor=1;floor<=LEVELS;floor++){
      const y0=(floor-1)*LEVEL_HEIGHT,y1=floor*LEVEL_HEIGHT;
      segments.push({a:[0,y0,-FRAME_SPAN/2],b:[0,y1,-FRAME_SPAN/2],kind:"wall",storey:floor});
    }
  }
  return {segments,slabs,bounds:template.bounds};
}
/** Level-proportional regular sway, with neither A1 torsion nor B2 soft storey. */
export function referenceJointAt(base:V3,phase:number,strength=1):V3 {
  const [x,y,z]=base;
  const level=Math.max(0,Math.min(LEVELS,y/LEVEL_HEIGHT));
  if(level===0||strength<=0)return [x,y,z];
  const sway=.075*(level/LEVELS)*Math.sin(phase)*strength;
  return [x+sway,y,z+sway*.15];
}
export function referenceSlabPose(center:V3,phase:number,strength=1) {
  const p=referenceJointAt(center,phase,strength);
  return {position:[p[0],p[1]+SLAB_LIFT,p[2]] as V3,yaw:0};
}
