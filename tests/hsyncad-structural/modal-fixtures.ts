import type {ModalStructureInput} from "../../src/lib/hsyncad/structural/modal-structure";
export function cantileverModal():ModalStructureInput{
 const E=3e7,I=.01,L=3,m=10;
 return {nodes:[{id:"base",position:[0,0,0],load:[0,0,0,0,0,0],prescribed:[0,0,0,0,0,0],springs:[0,0,0,0,0,0]},{id:"top",position:[0,0,L],load:[0,0,0,0,0,0],prescribed:[null,0,0,0,null,0],springs:[0,0,0,0,0,0]}],frames:[{id:"c",nodes:["base","top"],offsets:[[0,0,0],[0,0,0]],up:[1,0,0],rollRad:0,E,G:1.25e7,section:{area:.2,Iy:I,Iz:I,J:.02,shearAreaY:.16,shearAreaZ:.16},modifiers:{axial:1,bendingY:1,bendingZ:1,torsion:1,shearY:1,shearZ:1},theory:"euler_bernoulli",releases:Array(12).fill(false),uniformLocal:[0,0,0]}],shells:[],foundation:null,inertias:[{nodeId:"base",values:[0,0,0,0,0,0],source:"explicit"},{nodeId:"top",values:[m,m,m,0,0,0],source:"explicit"}],rotationOrigin:[0,0,0],directions:[{id:"X",requiredFraction:1}]};
}
