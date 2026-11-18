import {buildingFixture} from "./p06-fixtures";
import type {ModalStructureInput} from "../../src/lib/hsyncad/structural/modal-structure";
export function dynamicBuilding(width=6,levels=22):ModalStructureInput{
 const f=buildingFixture(width,levels,true);return {...f,inertias:f.nodes.map(n=>({nodeId:n.id,values:n.position[2]===0?[0,0,0,0,0,0]:[10,10,10,0,0,0],source:"explicit"})),rotationOrigin:[(width-1)*2.5,(width-1)*2.5,0],directions:[{id:"X",requiredFraction:.97000001},{id:"Y",requiredFraction:.97000001},{id:"RZ",requiredFraction:.95}]};
}
