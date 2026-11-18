import {mkdirSync,writeFileSync} from "node:fs";
import path from "node:path";
import {jointFixture} from "../../tests/hsyncad-structural/column-fixtures";
const output=process.argv[2];if(!path.isAbsolute(output??""))throw Error("Yeni mutlak çıktı klasörü gerekli.");mkdirSync(output);
const ready=jointFixture(),missing=jointFixture(),stale=jointFixture(),failed=jointFixture(),weak=jointFixture();missing.joints=[];stale.columns[1].loads[0].force.analysisStamp="old";
failed.joints[0].tie.endSpacingMm=300;
for(const b of weak.beams){b.mode="existing_reinforcement";b.existing={top:{diameter:20,count:8,rows:2},bottom:{diameter:20,count:8,rows:2},stirrupDiameter:10,legs:2,spacingEnd:75,spacingMiddle:100,sideDiameter:12,sideEach:0};}
const twelve=jointFixture();twelve.columns=[];twelve.beams=[];twelve.joints=[];twelve.boundaryNodes.value=[];
for(let i=0;i<12;i++){
 const group=jointFixture(),prefix=`group${i}:`,key=(s:string)=>prefix+s;
 for(const c of group.columns){c.id=key(c.id);c.storeyId=key(c.storeyId);c.baseJoint=key(c.baseJoint);c.topJoint=key(c.topJoint);for(const load of c.loads){load.stability.memberId=c.id;for(const f of load.stability.frame){for(const m of f.characteristicMembers)m.id=key(m.id);for(const m of f.ultimateMembers)m.id=key(m.id);}}}
 for(const b of group.beams){b.id=key(b.id);b.geometry.leftJoint=key(b.geometry.leftJoint);b.geometry.rightJoint=key(b.geometry.rightJoint);}
 for(const j of group.joints){j.id=key(j.id);j.lowerColumnId=key(j.lowerColumnId);j.upperColumnId=j.upperColumnId?key(j.upperColumnId):null;for(const b of j.beams)b.beamId=key(b.beamId);}
 if(!twelve.boundaryNodes.value||!group.boundaryNodes.value)throw Error("Örnek dış mesnet kapsamı eksik.");
 twelve.columns.push(...group.columns);twelve.beams.push(...group.beams);twelve.joints.push(...group.joints);twelve.boundaryNodes.value.push(...group.boundaryNodes.value.map(key));
}
for(const [name,value]of Object.entries({ready,missing,stale,failed,weak,twelve}))writeFileSync(path.join(output,`${name}-input.json`),JSON.stringify(value,null,2)+"\n",{flag:"wx"});
console.log("6 explicit physical column/joint examples including 12 joints created; no native fixed-value oracle");
