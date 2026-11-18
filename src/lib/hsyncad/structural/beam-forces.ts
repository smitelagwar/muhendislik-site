import type {FrameElement,FrameNode} from "./frame-element";
import {compileFrameElement} from "./frame-element";
export type BeamCase={id:string;modelRevision:string;stiffnessSet:string;analysisStamp:string;source:string;kind:"deterministic";lengthMm:number;endForces:readonly number[];uniformKnM:readonly[number,number,number];terms?:{caseId:string;factor:number}[]};
export function validateBeamCase(c:BeamCase){
 if(c.kind!=="deterministic"||!c.id||!c.modelRevision||!c.stiffnessSet||!c.analysisStamp||!c.source?.trim()||!Number.isFinite(c.lengthMm)||c.lengthMm<=0||c.endForces.length!==12||c.endForces.some(v=>!Number.isFinite(v))||c.uniformKnM.length!==3||c.uniformKnM.some(v=>!Number.isFinite(v)))throw Error("İmzalı deterministik kiriş kuvvet takımı gerekli; modal maksimum/kovaryans fiziksel takım değildir.");
 const f=c.endForces,L=c.lengthMm/1000,[qx,qy,qz]=c.uniformKnM,residual=[f[0]+f[6]+qx*L,f[1]+f[7]+qy*L,f[2]+f[8]+qz*L,f[3]+f[9],f[4]+f[10]-L*f[8]-qz*L*L/2,f[5]+f[11]+L*f[7]+qy*L*L/2];
 const scale=[Math.max(1,Math.abs(f[0]),Math.abs(f[6]),Math.abs(qx*L)),Math.max(1,Math.abs(f[1]),Math.abs(f[7]),Math.abs(qy*L)),Math.max(1,Math.abs(f[2]),Math.abs(f[8]),Math.abs(qz*L)),Math.max(1,Math.abs(f[3]),Math.abs(f[9])),Math.max(1,Math.abs(f[4]),Math.abs(f[10]),Math.abs(L*f[8]),Math.abs(qz*L*L/2)),Math.max(1,Math.abs(f[5]),Math.abs(f[11]),Math.abs(L*f[7]),Math.abs(qy*L*L/2))];
 const tolerance=scale.map(s=>1e-7+1e-7*s);
 if([...residual,...scale].some(v=>!Number.isFinite(v))||residual.some((v,i)=>Math.abs(v)>tolerance[i]))throw Error("Kiriş uç kuvvetleri/yayılı yük statik dengesi sağlanmıyor.");return {residual,tolerance};
}
export function beamSectionForce(c:BeamCase,xMm:number){
 validateBeamCase(c);if(!Number.isFinite(xMm)||xMm<0||xMm>c.lengthMm)throw Error("Kuvvet istasyonu açıklık dışında.");const x=xMm/1000,f=c.endForces,[qx,qy,qz]=c.uniformKnM;
 return {caseId:c.id,xMm,NcompressionKn:f[0]+qx*x,Mknm:-f[5]+f[1]*x+qy*x*x/2,MweakKnm:-f[4]-f[2]*x-qz*x*x/2,Vkn:f[1]+qy*x,VweakKn:f[2]+qz*x,Tknm:-f[3]};
}
export function beamStations(cases:readonly BeamCase[],extra:readonly number[]=[]){
 if(!cases.length||new Set(cases.map(c=>c.id)).size!==cases.length)throw Error("Benzersiz yük durumları gerekli.");
 cases.forEach(validateBeamCase);const first=cases[0];if(cases.some(c=>c.modelRevision!==first.modelRevision||c.stiffnessSet!==first.stiffnessSet||c.analysisStamp!==first.analysisStamp||c.lengthMm!==first.lengthMm))throw Error("Eski revizyon/rijitlik veya açıklık karıştırılamaz.");
 const points=[0,first.lengthMm/2,first.lengthMm,...extra];for(const c of cases){const q=c.uniformKnM[1];if(q!==0){const x=-c.endForces[1]/q*1000;if(x>0&&x<c.lengthMm)points.push(x);}}
 if(points.some(x=>!Number.isFinite(x)||x<0||x>first.lengthMm))throw Error("Gerçek istasyon açıklık dışında.");
 return [...new Set(points)].sort((a,b)=>a-b).map(x=>({xMm:x,cases:cases.map(c=>beamSectionForce(c,x))}));
}
export function combineBeamCases(id:string,terms:readonly {factor:number;load:BeamCase}[]):BeamCase{
 if(!id||!terms.length||terms.some(t=>!Number.isFinite(t.factor)))throw Error("Kiriş birleşimi eksik/geçersiz.");beamStations(terms.map(t=>t.load));const base=terms[0].load;
 const result:BeamCase={...base,id,endForces:Array.from({length:12},(_,i)=>terms.reduce((s,t)=>s+t.factor*t.load.endForces[i],0)),uniformKnM:[0,1,2].map(i=>terms.reduce((s,t)=>s+t.factor*t.load.uniformKnM[i],0)) as [number,number,number],terms:terms.map(t=>({caseId:t.load.id,factor:t.factor})),source:terms.map(t=>t.load.source).join("; ")};validateBeamCase(result);return result;
}
/** P06 yerel uç kuvvetleri zaten salım/rijit kaçıklık geri kazanımını içerir. */
export function beamCaseFromLinear(id:string,revision:string,stiffnessSet:string,analysisStamp:string,element:FrameElement,nodes:FrameNode[],localEndForce:readonly number[],source:string):BeamCase{
 const a=nodes.find(n=>n.id===element.nodes[0]),b=nodes.find(n=>n.id===element.nodes[1]);if(!a||!b)throw Error("Kiriş düğümü eksik.");const compiled=compileFrameElement(element,[a.position,b.position]);
 const c:BeamCase={id,modelRevision:revision,stiffnessSet,analysisStamp,kind:"deterministic",lengthMm:compiled.frame.length*1000,endForces:[...localEndForce],uniformKnM:element.uniformLocal,source};validateBeamCase(c);return c;
}
