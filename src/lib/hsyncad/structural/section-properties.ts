import {polygonLamina} from "./mass-properties";
/** Exact polygon area integrals. Torsion/shear constants must be supplied separately. */
export function polygonPrincipalSection(rings:readonly (readonly (readonly[number,number])[])[]){
 if(!rings.length||!rings[0].length)throw Error("Missing section boundary.");
 const points=rings.map(r=>r.map(p=>({x:p[0],y:p[1]})));polygonLamina(points[0],1,points.slice(1));
 const origin=rings[0][0];rings=rings.map(r=>r.map(p=>[p[0]-origin[0],p[1]-origin[1]] as const));
 let A=0,Sy=0,Sz=0,Iy0=0,Iz0=0,Iyz0=0;
 for(let ringIndex=0;ringIndex<rings.length;ringIndex++){
  const ring=rings[ringIndex];if(ring.length<3||ring.some(p=>p.length!==2||p.some(v=>!Number.isFinite(v))))throw Error("Invalid section ring.");
  let a=0,sy=0,sz=0,iy=0,iz=0,iyz=0;
  for(let i=0;i<ring.length;i++){const[y,z]=ring[i],[Y,Z]=ring[(i+1)%ring.length],c=y*Z-Y*z;a+=c/2;sy+=(y+Y)*c/6;sz+=(z+Z)*c/6;iy+=(z*z+z*Z+Z*Z)*c/12;iz+=(y*y+y*Y+Y*Y)*c/12;iyz+=(2*y*z+y*Z+Y*z+2*Y*Z)*c/24;}
  if(a===0)throw Error("Zero-area section ring.");const sign=(ringIndex===0?1:-1)*Math.sign(a);A+=sign*a;Sy+=sign*sy;Sz+=sign*sz;Iy0+=sign*iy;Iz0+=sign*iz;Iyz0+=sign*iyz;
 }
 const cy=Sy/A,cz=Sz/A,Iy=Iy0-A*cz*cz,Iz=Iz0-A*cy*cy,Iyz=Iyz0-A*cy*cz;
 const mean=(Iy+Iz)/2,radius=Math.hypot((Iy-Iz)/2,Iyz),principalMin=mean-radius,principalMax=mean+radius;
 if(![A,Iy,Iz,principalMin,principalMax].every(v=>Number.isFinite(v)&&v>0))throw Error("Nonphysical section area/inertia.");
 // Rotation of y,z axes giving Iy'=principalMin, Iz'=principalMax.
 const principalRollRad=.5*Math.atan2(2*Iyz,Iz-Iy);
 return {area:A,centroid:[cy+origin[0],cz+origin[1]] as const,Iy,Iz,Iyz,principalMin,principalMax,principalRollRad,torsionConstant:null,shearAreas:null};
}
