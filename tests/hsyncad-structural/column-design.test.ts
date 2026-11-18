import {test} from "node:test";
import assert from "node:assert/strict";
import {columnFixture,columnForce,jointFixture} from "./column-fixtures";
import {designColumn,columnMemberShear} from "../../src/lib/hsyncad/structural/column-design";
import {frameStability,effectiveColumnLength,magnifyColumnCase} from "../../src/lib/hsyncad/structural/column-stability";
import {columnTieGeometry,circleColumnBars,automatedColumnTie} from "../../src/lib/hsyncad/structural/column-detailing";
import {designColumnsAndJoints} from "../../src/lib/hsyncad/structural/beam-column-joint";
import {combineBeamCases} from "../../src/lib/hsyncad/structural/beam-forces";

test("P10 Euler, minimum eccentricity, sway classification and k follow independent equations",()=>{
 const c=columnFixture(),l=c.loads[0],r=magnifyColumnCase(c.shape,c.bars,c.material,l.force,l.stability),a=r.axes[0];
 assert.ok(Math.abs(a.minimumEccentricityMm-30)<1e-10);assert.ok(Math.abs(a.minimumMomentKnm-24)<1e-10);
 const I=500**4/12,EI=.4*30000*I/1.6,Nk=Math.PI**2*EI/3000**2/1000;assert.ok(Math.abs(a.NkKn/Nk-1)<1e-10);assert.equal(a.factor,1);
 const e=structuredClone(l.stability.frame[0]);e.driftMm=2;e.shearKn=10;const f=frameStability(e,l.force.analysisStamp);assert.equal(f.sway,true);assert.ok(Math.abs(f.phi-.08)<1e-10);
 assert.ok(Math.abs(effectiveColumnLength({method:"joint_ratios",alphaBottom:{value:2,source:"actual"},alphaTop:{value:2,source:"actual"},oneEndHinged:false},false).k-.9)<1e-12);
 assert.ok(Math.abs(effectiveColumnLength({method:"joint_ratios",alphaBottom:{value:2,source:"actual"},alphaTop:{value:2,source:"actual"},oneEndHinged:false},true).k-.9*Math.sqrt(2))<1e-10);
 assert.throws(()=>effectiveColumnLength({method:"nonsway_default",source:"bad"},true));
});
test("P10 slenderness amplification once, general-method and stale-frame gates",()=>{
 const c=columnFixture(),l=c.loads[0];l.force=columnForce(800,100,100,0,0,7000);for(const e of l.stability.frame)e.characteristicMembers[0].lengthMm=7000;
 const r=magnifyColumnCase(c.shape,c.bars,c.material,l.force,l.stability);assert.ok(r.axes.some(a=>a.factor>1));
 l.stability.providedDesignBounds={analysisStamp:l.force.analysisStamp,axis1Knm:r.axes[0].designBoundKnm,axis2Knm:r.axes[1].designBoundKnm};assert.deepEqual(magnifyColumnCase(c.shape,c.bars,c.material,l.force,l.stability).designCorners,r.designCorners);
 l.stability.providedDesignBounds.axis1Knm*=2;assert.throws(()=>magnifyColumnCase(c.shape,c.bars,c.material,l.force,l.stability));l.stability.providedDesignBounds=null;
 l.force=columnForce(800,0,0,0,0,18000);assert.throws(()=>magnifyColumnCase(c.shape,c.bars,c.material,l.force,l.stability),/100/);
 l.stability.frame[0].analysisStamp="old";assert.throws(()=>magnifyColumnCase(c.shape,c.bars,c.material,l.force,l.stability),/snapshot/);
});
test("P10 actual cross-tie incidence, restraint gap, lost and duplicate legs cannot pass",()=>{
 const c=columnFixture(),p=columnTieGeometry(c.shape,c.bars,c.tie);assert.equal(p.legsU,4);assert.equal(p.legsV,4);assert.equal(p.restrainedBarIds.length,12);
 c.tie.crossTies.pop();assert.throws(()=>columnTieGeometry(c.shape,c.bars,c.tie));
 const d=columnFixture();d.tie.crossTies.push(d.tie.crossTies[0]);assert.throws(()=>columnTieGeometry(d.shape,d.bars,d.tie));
});
test("P10 column actual loads/detailing and demand growth; no lap or missing-data approval",()=>{
 const c=columnFixture(),r=designColumn(c);assert.equal(r.status,"design_ready",JSON.stringify(r));assert.equal(r.engineeringAcceptance,false);
 c.loads[0].force=columnForce(800,3000,-3000);assert.equal(designColumn(c).status,"failed");
 const m=columnFixture();m.qualityReviewed.value=false;assert.equal(designColumn(m).status,"incomplete");
 const lap=columnFixture();lap.laps=[{barIds:lap.bars.map(b=>b.id),startMm:1000,lengthMm:1000,addedSteelAreaMm2:1000,spacingMm:75,source:"scalar only lap"}];assert.notEqual(designColumn(lap).status,"design_ready");
});
test("P10 circle numerical section does not manufacture a verified shear area",()=>{
 const c=columnFixture();c.shape={kind:"circle",diameter:500,source:"explicit circle"};c.bars=circleColumnBars(c.shape,20,12,30,10);c.tie=automatedColumnTie(c.shape,c.bars,{...c.tie,kind:"circular_hoop"});assert.equal(columnMemberShear(c,c.bars).status,"unsupported");
});
test("P10 interior, edge, corner and single-sided physical joints; confinement depends on geometry",()=>{
 for(const faces of [["U+","U-","V+","V-"],["U+","U-","V+"],["U+","V+"],["U+"]] as const){const r=designColumnsAndJoints(jointFixture([...faces]));assert.equal(r.status,"column_joint_ready",JSON.stringify(r));if("joints" in r){assert.equal(r.joints[0].status,"joint_ready");assert.equal("confined" in r.joints[0]?r.joints[0].confined:null,faces.length===4);}}
});
test("P10 missing joint, omitted attached beam, stale analysis and transition fail closed",()=>{
 const missing=jointFixture();missing.joints=[];const r=designColumnsAndJoints(missing);assert.equal(r.status,"incomplete");assert.deepEqual("missingJoints" in r?r.missingJoints:[],["J1"]);
 const omitted=jointFixture();omitted.joints[0].beams.pop();assert.equal(designColumnsAndJoints(omitted).status,"incomplete");
 const stale=jointFixture();stale.columns[1].loads[0].force.analysisStamp="old";assert.equal(designColumnsAndJoints(stale).status,"incomplete");
 const transition=jointFixture();transition.columns[1].bars[0].diameter=22;assert.equal(designColumnsAndJoints(transition).status,"incomplete");
});
test("P10 strong-column ratio responds to actual selected beam steel; no fixed 1.45",()=>{
 const input=jointFixture();for(const b of input.beams){b.mode="existing_reinforcement";b.existing={top:{diameter:20,count:8,rows:2},bottom:{diameter:20,count:8,rows:2},stirrupDiameter:10,legs:2,spacingEnd:75,spacingMiddle:100,sideDiameter:12,sideEach:0};}
 const r=designColumnsAndJoints(input);assert.equal(r.status,"incomplete");assert.ok("beams" in r&&r.beams.every(b=>b.status==="design_ready"));
 const j="joints" in r?r.joints[0]:null;assert.ok(j&&"directions" in j&&j.directions?.some(d=>d.signs.some(s=>!s.strongColumnPassed&&s.strongColumnRatio!==null&&s.strongColumnRatio<1.2)));
});
test("P10 physical roof exception preserves panel shear and tie checks",()=>{
 const input=jointFixture(["U+"]);input.columns.pop();input.joints[0].upperColumnId=null;input.joints[0].roofTermination.value=true;
 assert.equal(designColumnsAndJoints(input).status,"column_joint_ready");input.joints[0].tie.endSpacingMm=300;
 const r=designColumnsAndJoints(input);assert.equal(r.status,"incomplete");const j="joints" in r?r.joints[0]:null;assert.ok(j&&"directions" in j&&j.directions?.every(d=>d.signs.every(s=>s.exception==="roof_termination"))&&j.panelTie?.passed===false);
});
test("P10 capacity shear retains actual Vd/D bounds and conditional zero concrete contribution",()=>{
 const c=columnFixture("C1",200),G=columnForce(150),E=columnForce(50,20,-20);G.id="G";E.id="E";
 c.loads[0].force=combineBeamCases("ULS",[{factor:1,load:G},{factor:1,load:E}]);c.seismic={D:2,analysisStamp:G.analysisStamp,ductility:"high",source:"explicit synthetic seismic factors",pairs:[{gravity:G,earthquake:E}]};
 const r=columnMemberShear(c,c.bars);assert.equal(r.status,"passed");const axis=r.result.find(r=>r.direction==="M3")!;
 assert.ok(Math.abs(axis.VdKn-40/3)<1e-10);assert.ok(Math.abs(axis.DcapKn-80/3)<1e-10);assert.equal(axis.VdesignKn,axis.DcapKn);assert.equal(axis.VcKn,0);
 c.seismic.pairs[0].earthquake.endForces=c.seismic.pairs[0].earthquake.endForces.map(v=>-v);const reversed=columnMemberShear(c,c.bars);assert.ok(reversed.result.every(r=>r.VdesignKn>=r.VdKn));
});
test("P10 redesign bounded catalogue and actual storey registry cannot hide missing members",()=>{
 const c=columnFixture();c.mode="redesign";assert.equal(designColumn(c).status,"design_ready");c.catalog.maxCandidates=1;assert.equal(designColumn(c).status,"budget_exhausted");
 const input=jointFixture();input.columns[1].storeyId=input.columns[0].storeyId;const r=designColumnsAndJoints(input);assert.equal(r.status,"incomplete");assert.ok("frameIssues" in r&&r.frameIssues.length>0);
});
test("P10 sway member product branch uses 1.3 Euler denominator and all-storey betaS",()=>{
 const c=columnFixture("C1",1600),l=c.loads[0];l.force=columnForce(1600,50,50,0,0,10000);for(const e of l.stability.frame)e.driftMm=2;l.stability.axes=[{method:"verified_k",k:{value:1,source:"ideal fixed-fixed sway eigen-buckling benchmark"}},{method:"verified_k",k:{value:1,source:"ideal fixed-fixed sway eigen-buckling benchmark"}}];
 const r=magnifyColumnCase(c.shape,c.bars,c.material,l.force,l.stability);
 for(const a of r.axes){assert.equal(a.combination,"product");const expected=1/(1-1.3*1600/a.NkKn);assert.ok(Math.abs(a.beta-expected)<1e-9);assert.ok(Math.abs(a.betaS-expected)<1e-9);assert.ok(Math.abs(a.factor-expected**2)<1e-9);}
});
test("P10 rotated rectangular member shear rotates force components with the section",()=>{
 const a=columnFixture(),b=structuredClone(a),angle=.37,c=Math.cos(angle),s=Math.sin(angle);a.loads[0].force=columnForce(800,20,-20);b.shape={kind:"rectangle",b:500,h:500,angleRad:angle,source:"physical rotation"};b.bars=a.bars.map(p=>({...p,u:c*p.u-s*p.v,v:s*p.u+c*p.v}));b.loads[0].force=columnForce(800,20*c,-20*c,-20*s,20*s);
 const x=columnMemberShear(a,a.bars),y=columnMemberShear(b,b.bars);assert.equal(x.status,y.status);for(let i=0;i<x.result.length;i++){assert.ok(Math.abs(x.result[i].VdKn-y.result[i].VdKn)<1e-8);assert.ok(Math.abs(x.result[i].capacityShearKn-y.result[i].capacityShearKn)<1e-6);}
});
test("P10 every ULS shear case is checked alongside capacity earthquake pairs",()=>{
 const c=columnFixture("C1",200),G=columnForce(150),E=columnForce(50,20,-20);G.id="G";E.id="E";c.seismic={D:2,analysisStamp:G.analysisStamp,ductility:"high",source:"explicit synthetic seismic",pairs:[{gravity:G,earthquake:E}]};
 c.loads.push({...c.loads[0],force:{...columnForce(200,1000,-1000),id:"other-ULS"}});const r=columnMemberShear(c,c.bars);assert.equal(r.status,"failed");assert.ok(r.result.some(r=>r.caseId==="other-ULS"&&!r.passed));
});
test("P10 beam anchorage must fit the actual joint pocket and a physical vertical continuation",()=>{
 const straight=jointFixture(["U+"]);straight.beams[0].anchors.left={kind:"straight",availableMm:2000,coverMm:30,clearSpacingMm:40,source:"scalar length exceeds actual 500mm column"};
 assert.equal(designColumnsAndJoints(straight).status,"incomplete");
 const overflow=jointFixture(["U+"]);const anchor=overflow.beams[0].anchors.left;if(anchor.kind!=="hook90")throw Error("Kanca fixture gerekli.");anchor.horizontalMm=600;
 assert.equal(designColumnsAndJoints(overflow).status,"incomplete");
 const roof=jointFixture(["U+"]);roof.columns.pop();roof.joints[0].upperColumnId=null;roof.joints[0].roofTermination.value=true;roof.joints[0].beams[0].anchorVerticalDirection="up";
 assert.equal(designColumnsAndJoints(roof).status,"incomplete");
});
