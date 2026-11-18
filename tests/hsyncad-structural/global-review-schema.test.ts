import test from "node:test";
import assert from "node:assert/strict";
import {createDemoModel} from "../../src/lib/hsyncad/model";
import {createStructuralProject,updateProjectSettings,readStructuralProject} from "../../src/lib/hsyncad/structural/project-schema";
import {emptyEngineeringReviews} from "../../src/lib/hsyncad/structural/global-control-types";
test("review roundtrip retains unknown and explicit reasons, invalidates coefficients, isolates projects",()=>{
 const p=createStructuralProject(createDemoModel(),"review-a"),other=createStructuralProject(createDemoModel(),"review-b"),reviews=emptyEngineeringReviews();
 assert.deepEqual(p.engineeringReviews,reviews);reviews.A2={present:false,reviewer:"engineer",reason:"actual reviewed plan",transfer:null,verticalAnalysisRef:null};
 p.coefficients.r.used=7;p.coefficients.r.recommended=7;p.coefficients.r.reason="old snapshot";
 const next=updateProjectSettings(p,p.settings,reviews),reopened=readStructuralProject(JSON.parse(JSON.stringify(next)));
 assert.deepEqual(reopened.engineeringReviews,reviews);assert.equal(next.revision,p.revision+1);assert.equal(next.coefficients.r.used,null);assert.equal(next.coefficients.r.reason,null);
 assert.equal(other.engineeringReviews!.A2.present,null);assert.equal(p.engineeringReviews!.A2.present,null);
 const old=structuredClone(p);delete old.engineeringReviews;assert.deepEqual(readStructuralProject(old).engineeringReviews,emptyEngineeringReviews());
 reviews.B3.present=false;assert.throws(()=>updateProjectSettings(next,next.settings,reviews));
});
