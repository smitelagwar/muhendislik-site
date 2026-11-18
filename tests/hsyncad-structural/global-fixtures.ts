import type {GlobalReviewInput} from "../../src/lib/hsyncad/structural/global-review";
import type {WallGroup} from "../../src/lib/hsyncad/structural/global-demand";
import {emptyEngineeringReviews} from "../../src/lib/hsyncad/structural/global-control-types";
export function globalWallFixture(strongWall=true):GlobalReviewInput{
 const f=<T>(value:T|null)=>({value,source:"explicit synthetic physical fixture"}),nodes:GlobalReviewInput["structure"]["nodes"]=[],shells:GlobalReviewInput["structure"]["shells"]=[],walls:{X:WallGroup[];Y:WallGroup[]}={X:[],Y:[]},pairs:[string,string][]=[];
 for(const direction of ["X","Y"] as const)for(const [j,coordinate]of [-4,-2,2,4].entries()){
  const id=`${direction}${j}`,positions=direction==="X"?[[-1,coordinate,0],[1,coordinate,0],[1,coordinate,3],[-1,coordinate,3]]:[[coordinate,-1,0],[coordinate,1,0],[coordinate,1,3],[coordinate,-1,3]],ids=positions.map((_p,i)=>`${id}:${i}`);
  positions.forEach((p,i)=>nodes.push({id:ids[i],position:p as [number,number,number],load:[0,0,0,0,0,0],prescribed:i<2?[0,0,0,0,0,0]:[null,null,null,null,null,null],springs:[0,0,0,0,0,0]}));pairs.push([ids[0],ids[3]],[ids[1],ids[2]]);
  shells.push({id,nodes:ids as [string,string,string,string],E:3e7*(strongWall&&direction==="X"&&j===0?4:1),nu:.2,thickness:.2,shearCorrection:5/6,drillPenalty:.01,modifiers:{membrane:1,bending:1,shear:1},pressure:0});
  walls[direction].push({id,role:"lateral_wall",kind:"solid",cuts:[{shellId:id,nodeIds:ids.slice(0,2)}],origin:direction==="X"?[0,coordinate,0]:[coordinate,0,0],edgeIds:j===0?["minus"]:j===3?["plus"]:[],source:"actual rectangular shell base cut",coupledPair:null});
 }
 const reviews=emptyEngineeringReviews();for(const id of ["A2","A3","B3"] as const)reviews[id]={present:false,reviewer:"synthetic fixture reviewer",reason:"explicit regular fixture geometry; not native review",transfer:id==="B3"?"none":null,verticalAnalysisRef:null};
 const missing=f<number>(null),neighbor={neighborDisplacement:missing,neighborCannotBeAnalyzed:f(false),sameFloorLevels:f(true),providedM:missing,source:"isolated benchmark, not applicable"};
 return {modelRevision:"physical-wall-fixture-r1",structure:{nodes,frames:[],shells,foundation:null,inertias:nodes.map(n=>({nodeId:n.id,values:n.position[2]===0?[0,0,0,0,0,0]:[1,1,1,0,0,0],source:"explicit"})),rotationOrigin:[0,0,0],directions:[{id:"X",requiredFraction:.99},{id:"Y",requiredFraction:.99},{id:"RZ",requiredFraction:.99}],rigidDiaphragms:[{id:"roof",nodeIds:nodes.filter(n=>n.position[2]===3).map(n=>n.id),centerXY:[0,0],decisionSource:"explicit ideal rigid in-plane fixture diaphragm",accidental:null}]},
  bks:f(3),dd2:{hazard:"DD-2",ss:1,s1:.3,soil:"ZC",dataSource:"synthetic hazard, not a site query"},dd3:{hazard:"DD-3",ss:.5,s1:.15,soil:"ZC",dataSource:"separate synthetic DD3 hazard"},levels:[{id:"foundation",elevationM:0,role:"foundation",source:"physical fixture"},{id:"roof",elevationM:3,role:"roof",source:"physical fixture"}],
  basement:{hasBasement:f(false),enclosingRigidSides:missing,basementTopM:missing,wholePeriod:f(null),upperMassOnlyPeriod:f(null)},nodeParts:nodes.map(n=>({nodeId:n.id,part:n.position[2]===0?"excluded":"upper",reason:"fixture support/roof role"})),roofExtensionExclusion:f<boolean>(null),
  systems:{X:{enteredR:f(6),declaredCode:f("A13"),traits:f({frameDuctility:"none",wallDuctility:"high",wallKind:"solid",slab:"beam_slab"})},Y:{enteredR:f(6),declaredCode:f("A13"),traits:f({frameDuctility:"none",wallDuctility:"high",wallKind:"solid",slab:"beam_slab"})}},reviews,
  floorGeometry:[{id:"roof",geometry:f({outline:[{x:-5,y:-5},{x:5,y:-5},{x:5,y:5},{x:-5,y:5}],holes:[]}),projections:f({Lx:10,Ly:10,projections:[]}),model:"rigid"}],
  storeys:[{id:"storey1",bottomM:0,topM:3,part:"upper",pairs,coverage:f("all_vertical_lines"),source:"all explicit wall vertical lines"}],
  shearAreas:[{id:"storey1",X:{columnAreas:[],wallAreas:[.4,.4,.4,.4],infillArea:0,infillType:"attached",source:"actual wall-base thickness*length"},Y:{columnAreas:[],wallAreas:[.4,.4,.4,.4],infillArea:0,infillType:"attached",source:"actual wall-base thickness*length"}}],
  walls,edgeAxes:{X:f(["minus","plus"]),Y:f(["minus","plus"])},diaphragmDimensions:[{diaphragmId:"roof",widthX:10,widthY:10}],equivalentPeriod:{X:missing,Y:missing},empiricalCt:{X:missing,Y:missing},infill:f("attached"),separatedCapacitySource:null,adjacent:{required:f(false),X:neighbor,Y:neighbor},maxCoefficientIterations:4};
}

export function globalBasementFixture():GlobalReviewInput{
 const input=globalWallFixture(false),f=<T>(value:T|null)=>({value,source:"explicit two-storey shell fixture"}),bottomPairs:[string,string][]=[];
 const baseNodes=input.structure.nodes.filter(n=>n.position[2]===0),lowerNodes=baseNodes.map(n=>({...n,id:`${n.id}:foundation`,position:[n.position[0],n.position[1],-3] as const}));
 for(const n of baseNodes){n.prescribed=[null,null,null,null,null,null];bottomPairs.push([`${n.id}:foundation`,n.id]);}
 const lowerShells=input.structure.shells.map(s=>({...s,id:`${s.id}:basement`,nodes:[`${s.nodes[0]}:foundation`,`${s.nodes[1]}:foundation`,s.nodes[1],s.nodes[0]] as const,E:s.E*1000}));
 input.structure.nodes.push(...lowerNodes);input.structure.shells.push(...lowerShells);
 input.structure.inertias=input.structure.nodes.map(n=>({nodeId:n.id,values:n.position[2]===-3?[0,0,0,0,0,0]:n.position[2]===0?[.1,.1,.1,0,0,0]:[1,1,1,0,0,0],source:"explicit"}));
 input.structure.rigidDiaphragms!.push({id:"basement-top",nodeIds:baseNodes.map(n=>n.id),centerXY:[0,0],decisionSource:"explicit ideal basement-top rigid diaphragm",accidental:null});
 input.basement={hasBasement:f(true),enclosingRigidSides:f(3),basementTopM:f(0),wholePeriod:f(null),upperMassOnlyPeriod:f(null)};
 input.levels.unshift({id:"basement",elevationM:0,role:"basement",source:"physical two-storey fixture"});input.levels.find(l=>l.id==="foundation")!.elevationM=-3;
 input.nodeParts=input.structure.nodes.map(n=>({nodeId:n.id,part:n.position[2]===-3?"excluded":n.position[2]===0?"basement":"upper",reason:"elevations and explicit top-slab mass exclusion"}));
 input.storeys.unshift({id:"basement-storey",bottomM:-3,topM:0,part:"basement",pairs:bottomPairs,coverage:f("all_vertical_lines"),source:"actual basement shell lines"});
 input.shearAreas.unshift({...structuredClone(input.shearAreas[0]),id:"basement-storey"});
 input.floorGeometry.unshift({...structuredClone(input.floorGeometry[0]),id:"basement"});
 input.diaphragmDimensions=[...input.diaphragmDimensions,{diaphragmId:"basement-top",widthX:10,widthY:10}];input.modelRevision="physical-two-storey-r1";return input;
}
