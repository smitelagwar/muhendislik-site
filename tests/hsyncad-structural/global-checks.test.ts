import test from "node:test";
import assert from "node:assert/strict";
import {torsionalIrregularity,softStorey,slabDiscontinuity,planProjection,verticalDiscontinuity,weakStoreys,storeyDriftCheck,secondOrder,seismicGap} from "../../src/lib/hsyncad/structural/global-checks";
import {emptyEngineeringReviews,validateEngineeringReviews,type EngineeringReview} from "../../src/lib/hsyncad/structural/global-control-types";
const f=<T>(value:T|null)=>({value,source:"independent fixture"}),review:EngineeringReview={present:false,reviewer:"fixture engineer",reason:"explicit assessed conditions",transfer:null,verticalAnalysisRef:null};
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-9+1e-6*Math.abs(b),`${a} != ${b}`);
test("A1/B2 strict thresholds and missing excitation/eccentricity never become no-irregularity",()=>{
 assert.equal(torsionalIrregularity("s",[.008,.012],"case",true).finding,false);assert.equal(torsionalIrregularity("s",[.0079,.0121],"case",true).finding,true);assert.equal(torsionalIrregularity("s",[1,2],"case",false).status,"missing_data");assert.throws(()=>torsionalIrregularity("s",[0,0],"case",true));
 assert.equal(softStorey("s",{drift:2,height:3},[{drift:1,height:3}],false,"case").finding,false);assert.equal(softStorey("s",{drift:2.01,height:3},[{drift:1,height:3}],false,"case").finding,true);assert.equal(softStorey("s",{drift:99,height:3},[],true,"case").status,"not_applicable");
});
test("A2 area detection cannot be erased by no-review; other cases await II/III engineering",()=>{
 const outline=[{x:0,y:0},{x:6,y:0},{x:6,y:6},{x:0,y:6}],holes=[[{x:1,y:1},{x:5,y:1},{x:5,y:5},{x:1,y:5}]];
 const c=slabDiscontinuity("s",f({outline,holes}),review,"rigid");assert.equal(c.result.finding,true);assert.equal(c.modeling.status,"fail");
 assert.equal(slabDiscontinuity("s",f({outline,holes:[]}),emptyEngineeringReviews().A2,"shell").result.status,"requires_engineering");
});
test("A3 requires both projections, B3 forbidden transfer and unknown review are preserved",()=>{
 assert.equal(planProjection("s",f({Lx:10,Ly:10,projections:[{ax:2.01,ay:2.01}]}),review,"rigid").result.finding,true);assert.equal(planProjection("s",f({Lx:10,Ly:10,projections:[{ax:3,ay:2}]}),review,"rigid").result.finding,false);
 assert.equal(verticalDiscontinuity("p",emptyEngineeringReviews().B3).status,"requires_engineering");assert.equal(verticalDiscontinuity("p",{...review,present:true,transfer:"wall_on_column"}).status,"fail");
 assert.equal(verticalDiscontinuity("p",{...review,present:true,transfer:"column_on_simple_beam",verticalAnalysisRef:"unverified text"}).status,"requires_engineering");
 assert.equal(slabDiscontinuity("s",f({outline:[{x:0,y:0},{x:6,y:0},{x:6,y:6},{x:0,y:6}],holes:[]}),{...review,present:true},"shell").modeling.status,"requires_engineering");
 const r=emptyEngineeringReviews();r.A2.present=false;assert.throws(()=>validateEngineeringReviews(r));
});
test("B1 omits infill in BOTH levels when lower infill is larger, and applies a common R factor",()=>{
 const area=(c:number,infill:number)=>({columnAreas:[c],wallAreas:[],infillArea:infill,infillType:"attached" as const,source:"fixture sections"});
 const result=weakStoreys([{id:"lower",X:area(.65,10),Y:area(1,0)},{id:"upper",X:area(1,1),Y:area(1,0)}]);close(result.minimumEta,.65);close(result.factor!,1.25*.65);assert.equal((result.checks[0].observed as {omitInfill:boolean}).omitInfill,true);
 assert.equal(weakStoreys([{id:"a",X:area(.59,0),Y:area(1,0)},{id:"b",X:area(1,0),Y:area(1,0)}]).factor,null);
});
test("drift DD3/DD2 ratio and infill verification are separate from second-order amplification",()=>{
 const dd2={hazard:"DD-2" as const,ss:1,s1:.3,soil:"ZA" as const,dataSource:"fixture"},dd3={...dd2,hazard:"DD-3" as const,ss:.5,s1:.15};
 const c=storeyDriftCheck("s",{rawMaxM:.006,heightM:3,R:6,I:1,dominantPeriod:1,dd2,dd3,infill:"attached",separatedCapacitySource:null,driftScale:1,source:"actual demand fixture"});assert.equal(c.status,"pass");
 const o=secondOrder([{id:"s",averageDriftM:.01,weightAboveKn:1000,shearKn:10,heightM:3,part:"upper"}],6,2.5,false,"fixture");close(o.max,.01*1000/(10*3));close(o.betaII,.88+.5*6/2.5*o.max);assert.equal(o.control.finding,true);
});
test("gap compares dynamic demand and height minimum, unknown neighbor never defaults to zero",()=>{
 const input={heightM:9,ownDisplacementM:.01,neighborDisplacement:f<number>(null),neighborCannotBeAnalyzed:f(false),sameFloorLevels:f(true),R:6,I:1,providedM:f(.05),source:"fixture"};assert.equal(seismicGap(input).status,"missing_data");
 const c=seismicGap({...input,neighborCannotBeAnalyzed:f(true)});assert.equal(c.status,"pass");close((c.observed as {requiredM:number}).requiredM,.04);
});
