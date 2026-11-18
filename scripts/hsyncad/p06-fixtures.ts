import type {FrameElement,FrameNode} from "../../src/lib/hsyncad/structural/frame-element";
import type {ShellRect} from "../../src/lib/hsyncad/structural/shell-rect";
/** Synthetic size benchmark, not a native project or a code-compliance oracle. */
export function buildingFixture(width=8,levels=25,includeShells=true){
 const nodes:FrameNode[]=[],frames:FrameElement[]=[],shells:ShellRect[]=[];
 const id=(x:number,y:number,z:number)=>`${z}:${y}:${x}`;
 for(let z=0;z<levels;z++)for(let y=0;y<width;y++)for(let x=0;x<width;x++){
  nodes.push({id:id(x,y,z),position:[5*x,5*y,3*z],load:z===levels-1?[1,0,-10,0,0,0]:[0,0,-10,0,0,0],prescribed:z===0?[0,0,0,0,0,0]:[null,null,null,null,null,null],springs:[0,0,0,0,0,0]});
  const add=(other:string,vertical:boolean)=>frames.push({id:`${id(x,y,z)}-${other}`,nodes:[id(x,y,z),other],offsets:[[0,0,0],[0,0,0]],up:vertical?[1,0,0]:[0,0,1],rollRad:0,E:3e7,G:1.25e7,section:{area:.25,Iy:.005208333333333333,Iz:.005208333333333333,J:.0088,shearAreaY:.20833333333333333,shearAreaZ:.20833333333333333},modifiers:{axial:1,bendingY:1,bendingZ:1,torsion:1,shearY:1,shearZ:1},theory:"timoshenko",releases:Array(12).fill(false),uniformLocal:[0,0,0]});
  if(z>0)add(id(x,y,z-1),true);if(x>0&&z>0)add(id(x-1,y,z),false);if(y>0&&z>0)add(id(x,y-1,z),false);
  if(includeShells&&z>0&&x<width-1&&y<width-1)shells.push({id:`slab:${z}:${y}:${x}`,nodes:[id(x,y,z),id(x+1,y,z),id(x+1,y+1,z),id(x,y+1,z)],E:3e7,nu:.2,thickness:.15,shearCorrection:5/6,drillPenalty:.01,modifiers:{membrane:1,bending:1,shear:1},pressure:0});
 }
 return {nodes,frames,shells,foundation:null};
}
