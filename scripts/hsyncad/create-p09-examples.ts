import {writeFileSync,mkdirSync} from "node:fs";
import path from "node:path";
import {beamDesignFixture} from "../../tests/hsyncad-structural/beam-fixtures";
const out=process.argv[2];if(!out||!path.isAbsolute(out))throw Error("Yeni mutlak örnek klasörü gerekli.");mkdirSync(out);
const missing=beamDesignFixture();missing.service=null;
const failed=beamDesignFixture(40);failed.mode="existing_reinforcement";failed.existing={top:{diameter:12,count:2,rows:1},bottom:{diameter:12,count:2,rows:1},stirrupDiameter:8,legs:2,spacingEnd:150,spacingMiddle:250,sideDiameter:12,sideEach:0};
const budget=beamDesignFixture(25);budget.catalog.maxCandidates=1;
for(const [name,beams]of Object.entries({ready:[beamDesignFixture(6)],higher:[beamDesignFixture(25)],missing:[missing],failed:[failed],budget:[budget],twelve:Array.from({length:12},(_,i)=>({...beamDesignFixture(6),id:`B${i}`}))}))writeFileSync(path.join(out,`${name}-input.json`),JSON.stringify({beams},null,2)+"\n",{flag:"wx"});
