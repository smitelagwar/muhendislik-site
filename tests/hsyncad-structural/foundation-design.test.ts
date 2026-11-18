import test from "node:test";
import assert from "node:assert/strict";
import {runRaftFoundationCase,type RaftPunchingRequest} from "../../src/lib/hsyncad/structural/foundation-design";
import {syntheticRaftFixture} from "./foundation-fixtures";
import {foundationNodeTributaryAreas} from "../../src/lib/hsyncad/structural/foundation-model";

test("P06 raft submodel solves compression-only contact and recovers reaction, q envelope, cut forces and identity",()=>{
 const input=syntheticRaftFixture(2),result=runRaftFoundationCase(input);
 assert.equal(result.status,"solved_limited_profile",JSON.stringify(result));
 if(result.status!=="solved_limited_profile")return;
 assert.equal(result.solver.status,"solved");assert.ok(Math.max(...result.solver.balance.map(Math.abs))<1e-6);
 assert.equal(result.bearing.criterionApplicability,"unknown");assert.equal(result.bearing.comparison,"not_accepted_without_normative_limit_applicability_review");
 assert.ok(result.bearing.qmaxKpa!>0);assert.ok(result.bearing.qaverageKpa!>0);
 assert.equal(result.shellSectionActions.length,1);assert.equal(result.shellSectionActions[0].status,"actual_signed_FE_demand_face_and_capacity_mapping_not_yet_accepted");
 assert.equal(result.analysisApproved,false);assert.equal(result.engineeringAcceptance,false);
 assert.notEqual(result.analysisIdentity.resolvedFoundationFingerprint,input.analysisIdentity.sourceStiffnessFingerprint);
 assert.match(result.localWinklerDisplacements.meaning,/not geotechnical settlement/);
});

test("P12 interior punching receives Fa from current FE Winkler pressure, while its action packet stays source-stamped",()=>{
 const makeRequest=(input:ReturnType<typeof syntheticRaftFixture>):RaftPunchingRequest=>({id:"C1",supportReactionId:"column-C1",boundary:{outer:[[0,0],[2,0],[2,2],[0,2]],openings:[]},
  support:{id:"C1",kind:"column",footprint:[[.85,.85],[1.15,.85],[1.15,1.15],[.85,1.15]],origin:[1,1]},effectiveDepthM:.2,
  effectiveDepthSource:"synthetic explicitly-derived d=0.2m",action:{modelRevision:`${input.project.projectId}@${input.project.revision}`,stiffnessSet:input.analysisIdentity.sourceStiffnessFingerprint,analysisStamp:input.combination.id,
    source:"synthetic current support force packet",NaboveKn:0,NbelowKn:120,MxAdjacentKnM:[0,0],MyAdjacentKnM:[0,0]},
  material:{fctdMPa:1.2,source:"synthetic material",evidence:"source-backed test value"}});
 const input=syntheticRaftFixture(2);input.punching=[makeRequest(input)];
 const result=runRaftFoundationCase(input);assert.equal(result.status,"solved_limited_profile");if(result.status!=="solved_limited_profile")return;
 const check=result.punching[0];assert.equal(check.status,"passed");assert.ok(check.FaKn>0);assert.ok(check.FaAreaM2>0);assert.match(check.FaSource,/current compression-only P06/);
 const stale=syntheticRaftFixture(2);stale.punching=input.punching!.map(p=>({...p,action:{...p.action,stiffnessSet:"R1-old-stiffness"}}));
 const staleResult=runRaftFoundationCase(stale);assert.equal(staleResult.status,"solved_limited_profile");if(staleResult.status==="solved_limited_profile")assert.equal(staleResult.punching[0].status,"stale_action");
 const gap=syntheticRaftFixture(2);gap.punching=[makeRequest(gap)];gap.foundationShellIds=gap.foundationShellIds.filter(id=>id!=="s1_0");
 const gapResult=runRaftFoundationCase(gap);assert.equal(gapResult.status,"solved_limited_profile");if(gapResult.status==="solved_limited_profile")assert.equal(gapResult.punching[0].status,"incomplete_Fa_mesh");
 const tooDeep=syntheticRaftFixture(2);tooDeep.punching=[{...makeRequest(tooDeep),effectiveDepthM:2}];
 const depthResult=runRaftFoundationCase(tooDeep);assert.equal(depthResult.status,"solved_limited_profile");if(depthResult.status==="solved_limited_profile")assert.equal(depthResult.punching[0].status,"unsupported");
 const wrongColumn=syntheticRaftFixture(2);wrongColumn.punching=[{...makeRequest(wrongColumn),support:{...makeRequest(wrongColumn).support,origin:[.9,1]}}];
 const wrongResult=runRaftFoundationCase(wrongColumn);assert.equal(wrongResult.status,"solved_limited_profile");if(wrongResult.status==="solved_limited_profile")assert.equal(wrongResult.punching[0].status,"support_geometry_mismatch");
});

test("ks mutation changes actual raft displacement/contact response and mesh tributaries conserve area",()=>{
 const low=runRaftFoundationCase(syntheticRaftFixture(2,15_000)),high=runRaftFoundationCase(syntheticRaftFixture(2,60_000));
 assert.equal(low.status,"solved_limited_profile");assert.equal(high.status,"solved_limited_profile");
 if(low.status!=="solved_limited_profile"||high.status!=="solved_limited_profile")return;
 assert.notEqual(low.localWinklerDisplacements.maximumAbsoluteM,high.localWinklerDisplacements.maximumAbsoluteM);
 assert.notEqual(low.bearing.qmaxKpa,high.bearing.qmaxKpa);
 const refined=syntheticRaftFixture(4),areas=foundationNodeTributaryAreas(refined.nodes,refined.shells,refined.foundationShellIds);
 assert.ok(Math.abs(Object.values(areas).reduce((a,b)=>a+b,0)-4)<1e-12);
 const totalSpringK=Object.entries(areas).reduce((sum,[,area])=>sum+area*(refined.project.settings.subgrade.value as number),0);
 assert.ok(Math.abs(totalSpringK-4*(refined.project.settings.subgrade.value as number))<1e-8);
 const coarse=syntheticRaftFixture(2),coarseAreas=foundationNodeTributaryAreas(coarse.nodes,coarse.shells,coarse.foundationShellIds);
 const coarseK=Object.values(coarseAreas).reduce((sum,area)=>sum+area*(coarse.project.settings.subgrade.value as number),0);
 assert.ok(Math.abs(totalSpringK-coarseK)<1e-8);
});

test("thickness and interaction settings change actual stiffness/constraints; enlarged connection changes load footprint",()=>{
 const thin=syntheticRaftFixture(2),thick=syntheticRaftFixture(2);
 thin.project.settings.thicknessFactor={value:1,source:"user_input",evidence:"synthetic mutation"};
 thick.project.settings.thicknessFactor={value:2,source:"user_input",evidence:"synthetic mutation"};
 const a=runRaftFoundationCase(thin),b=runRaftFoundationCase(thick);
 assert.equal(a.status,"solved_limited_profile");assert.equal(b.status,"solved_limited_profile");
 if(a.status!=="solved_limited_profile"||b.status!=="solved_limited_profile")return;
 assert.notEqual(a.localWinklerDisplacements.maximumAbsoluteM,b.localWinklerDisplacements.maximumAbsoluteM);
 const uncoupled=syntheticRaftFixture(2);uncoupled.project.settings.interaction={value:"disabled",source:"user_input",evidence:"synthetic mutation"};
 const c=runRaftFoundationCase(uncoupled);assert.equal(c.status,"solved_limited_profile");if(c.status==="solved_limited_profile"){
  assert.ok(c.bearing.qmaxKpa!>0);assert.equal(c.superstructureInteraction.represented,false);
 }
 const incompatible=syntheticRaftFixture(2);incompatible.project.settings.interaction={value:"disabled",source:"user_input",evidence:"synthetic mutation"};incompatible.modelMode="shared_model";
 assert.equal(runRaftFoundationCase(incompatible).status,"blocked");
 const enlarged=syntheticRaftFixture(4);enlarged.project.settings.connection={value:"enlarged",source:"user_input",evidence:"synthetic geometry option"};
 enlarged.project.settings.enlargementRatio={value:.5,source:"user_input",evidence:"explicit .5h synthetic parameter"};
 enlarged.supportReactions[0].footprint={...enlarged.supportReactions[0].footprint,enlargementReferenceM:1,enlargementReferenceSource:"synthetic explicitly-selected h reference"};
 const d=runRaftFoundationCase(enlarged);assert.equal(d.status,"solved_limited_profile");if(d.status==="solved_limited_profile"){
  const footprint=d.connectionFootprints[0] as {widthM:number;signedFoundationLoadKn:number};assert.equal(footprint.widthM,1.3);assert.equal(footprint.signedFoundationLoadKn,-120);
 }
});

test("old reaction identity and mismatched load case are blocked before assembly",()=>{
 const stale=syntheticRaftFixture(2);stale.supportReactions[0].sourceIdentity.projectId="old-project";
 assert.equal(runRaftFoundationCase(stale).status,"blocked");
 const wrongCase=syntheticRaftFixture(2);wrongCase.combination.id="OTHER";
 assert.equal(runRaftFoundationCase(wrongCase).status,"blocked");
});
