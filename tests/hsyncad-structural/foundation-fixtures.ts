import {createDemoModel} from "../../src/lib/hsyncad/model";
import {createStructuralProject} from "../../src/lib/hsyncad/structural/project-schema";
import type {FrameNode} from "../../src/lib/hsyncad/structural/frame-element";
import type {ShellRect} from "../../src/lib/hsyncad/structural/shell-rect";
import type {RaftFoundationCaseInput} from "../../src/lib/hsyncad/structural/foundation-design";

/** Synthetic only: isolated Q4 plate-on-Winkler patch, never part of production calculation code. */
export function syntheticRaftFixture(subdivisions=2,ksKnm3=30_204.482):RaftFoundationCaseInput{
  if(!Number.isSafeInteger(subdivisions)||subdivisions<2||subdivisions%2!==0||!Number.isFinite(ksKnm3)||ksKnm3<=0)throw new Error("Synthetic mesh needs an even subdivision count and positive ks.");
  const side=2,step=side/subdivisions,nodes:FrameNode[]=[];
  for(let j=0;j<=subdivisions;j++)for(let i=0;i<=subdivisions;i++){
    const origin=i===0&&j===0,rotationAnchor=i===1&&j===0;
    nodes.push({id:`n${i}_${j}`,position:[i*step,j*step,0],load:[0,0,0,0,0,0],
      prescribed:[origin?0:null,origin||rotationAnchor?0:null,null,null,null,0],springs:[0,0,0,0,0,0]});
  }
  const shells:ShellRect[]=[];
  for(let j=0;j<subdivisions;j++)for(let i=0;i<subdivisions;i++)shells.push({id:`s${i}_${j}`,nodes:[`n${i}_${j}`,`n${i+1}_${j}`,`n${i+1}_${j+1}`,`n${i}_${j+1}`],
    E:30_000_000,nu:.2,thickness:.3,shearCorrection:5/6,drillPenalty:.01,modifiers:{membrane:1,bending:1,shear:1},pressure:0});
  const project=createStructuralProject(createDemoModel(),`synthetic-raft-${subdivisions}`);
  const value=(key:keyof typeof project.settings,v:number|string)=>{project.settings[key]={value:v,source:"user_input",evidence:"synthetic independent P06 fixture"};};
  value("qt",55*9.80665);value("subgrade",ksKnm3);value("raftCriterion","maximum");value("raftEarthquake","include");
  value("raftNegativeContact","check");value("interaction","enabled");value("connection","straight");value("thicknessFactor",1.5);value("soilMethod","winkler");
  const sourceStiffnessFingerprint=`synthetic-upper-K-${subdivisions}`;
  return {project,combination:{id:"SYN-GQ",seismic:false,limitState:"ultimate"},selectedLimitBasis:"qt_design_resistance",
    modelMode:"raft_submodel",analysisIdentity:{projectId:project.projectId,projectRevision:project.revision,sourceStiffnessFingerprint,loadCaseId:"SYN-GQ",reactionEvidence:"independently-defined 120 kN downwards column action"},
    nodes,frames:[],shells,foundationShellIds:shells.map(s=>s.id),
    supportReactions:[{id:"column-C1",xM:1,yM:1,verticalKnOnSuperstructure:120,
      sourceIdentity:{projectId:project.projectId,projectRevision:project.revision,loadCaseId:"SYN-GQ",stiffnessFingerprint:sourceStiffnessFingerprint},
      supportGeometry:{kind:"column",widthM:.3,lengthM:.3,source:"synthetic 0.3 x 0.3 m column geometry"},
      thicknessRegion:{widthM:1.5,lengthM:1.5,source:"synthetic 1.5 x 1.5 m thickened region"},
      footprint:{widthM:.3,lengthM:.3,supportDepthM:.3}}],
    concreteUnitWeightKnm3:25,concreteUnitWeightSource:"synthetic test input: 25 kN/m3",concreteSelfWeightAlreadyIncluded:false,
    soilUnitWeightKnm3:18,soilUnitWeightSource:"synthetic test input: 18 kN/m3",
    overburdenDepthM:0,overburdenDepthSource:"explicit synthetic zero depth",
    foundationLoadFactors:{loadCaseId:"SYN-GQ",deadFactor:1,overburdenFactor:1,source:"explicit synthetic unit factors for independently defined test combination"},
    shellPressureLoadCaseId:"SYN-GQ",shellPressureSource:"synthetic shell pressure zero in the stamped SYN-GQ case",
    cuts:[{id:"x-mid-negative",cut:{axis:"X",coordinateM:1,spanStartM:0,spanEndM:2,side:"negative"}}]};
}
