import {mkdirSync,writeFileSync} from "node:fs";
import path from "node:path";
import {globalWallFixture,globalBasementFixture} from "../../tests/hsyncad-structural/global-fixtures";
const target=process.argv[2];if(!target||!path.isAbsolute(target))throw Error("New absolute example directory required.");mkdirSync(target);
const missing=globalWallFixture(false);missing.reviews.A2={present:null,reviewer:null,reason:null,transfer:null,verticalAnalysisRef:null};
const bounded=globalWallFixture();bounded.maxCoefficientIterations=1;
for(const [name,input] of Object.entries({ready:globalWallFixture(),basement:globalBasementFixture(),missing,bounded}))writeFileSync(path.join(target,`${name}-input.json`),JSON.stringify({input,maxModes:100},null,2)+"\n",{flag:"wx"});
