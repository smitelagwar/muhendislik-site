import {writeFileSync} from "node:fs";
import path from "node:path";
import {cantileverModal} from "../../tests/hsyncad-structural/modal-fixtures";
const output=process.argv[2];if(!path.isAbsolute(output))throw Error("Absolute existing output directory required.");
const input={operation:"spectrum",modelRevision:"explicit-cantilever-r1",maxModes:4,structure:cantileverModal(),spectrum:{hazard:"DD-2",ss:1,s1:.3,soil:"ZC",dataSource:"synthetic independent mechanics fixture"},direction:{id:"X",reduction:{R:4,D:2,I:1},orientation:"horizontal",equivalentCheck:{shearKn:1,irregularity:{A1:false,B2:false,B3:false,decisionSource:"explicit benchmark"}}},method:"CQC",damping:.05};
writeFileSync(path.join(output,"ready-input.json"),JSON.stringify(input,null,2)+"\n",{flag:"wx"});
const missing=structuredClone(input);missing.structure.inertias.pop();writeFileSync(path.join(output,"missing-input.json"),JSON.stringify(missing,null,2)+"\n",{flag:"wx"});console.log("Created explicit ready/missing dynamic input fixtures.");
