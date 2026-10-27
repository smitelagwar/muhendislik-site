import { FRAME_SPAN, LEVEL_HEIGHT, SLAB_LIFT, jointAt, type V3 } from "./motion";
import { referenceJointAt } from "./reference-model";
import type { ScenarioId } from "./scenarios";

export type TeachingSide = "irregular" | "reference";
export type TeachingCueKind = "arrow" | "line" | "displacement";

export interface TeachingCue {
  id: string;
  side: TeachingSide;
  kind: TeachingCueKind;
  start: V3;
  end?: V3;
  lift?: number;
}

export interface TeachingLesson {
  label: string;
  reference: string;
  irregular: string;
  watch: string;
  caution: string;
  cues: readonly TeachingCue[];
}

const H = LEVEL_HEIGHT;
const S = FRAME_SPAN;
const top = 4 * H;

/**
 * Scenario-specific illustrative annotations; not computed stress, strength,
 * force, member damage, or compliance checks. Guides follow the SAME moving
 * joints as the structural geometry, so markers cannot float away from it.
 */
export const TEACHING: Record<ScenarioId, TeachingLesson> = {
  A1: {
    label: "Karşılıklı kenar hareketi",
    reference: "Karşılıklı perdeler daha dengeli yerleşmiştir; örnekte katlar dönmeden ötelenir.",
    irregular: "Perde tek taraftadır. İki üst köşenin yer değiştirmesi farklılaşır.",
    watch: "Turuncu iki köşe oku ile referanstaki eşit yönlü mavi okları karşılaştır. Kat dönmesine odaklan.",
    caution: "Köşe ötelenmesi ve dönme temsili gösterilir; A1 katsayısı hesaplanmaz.",
    cues: [
      {id:"near-edge",side:"irregular",kind:"displacement",start:[S,top,-S],lift:SLAB_LIFT+.2},
      {id:"far-edge",side:"irregular",kind:"displacement",start:[S,top,S],lift:SLAB_LIFT+.2},
      {id:"edge-link",side:"irregular",kind:"line",start:[S,top,-S],end:[S,top,S],lift:SLAB_LIFT+.19},
      {id:"regular-edge-a",side:"reference",kind:"displacement",start:[S,top,-S],lift:SLAB_LIFT+.2},
      {id:"regular-edge-b",side:"reference",kind:"displacement",start:[S,top,S],lift:SLAB_LIFT+.2},
    ],
  },
  A2: {
    label: "Döşeme boşluğu ve diyafram yolu",
    reference: "Üçüncü kat döşemesi kesintisizdir.",
    irregular: "Üçüncü kattaki geniş boşluk, diyaframın sürekliliğini değiştirir.",
    watch: "Boşluk çevresindeki dört kısa turuncu yönlendirmeyi incele; mavi referansta döşeme kesintisizdir.",
    caution: "Oklar yük aktarımı için şematiktir; gerçek kuvvet yönü veya büyüklüğü değildir.",
    cues: [
      {id:"hole-west",side:"irregular",kind:"arrow",start:[-2.13,3*H,0],end:[-3.02,3*H,0],lift:.25},
      {id:"hole-east",side:"irregular",kind:"arrow",start:[2.13,3*H,0],end:[3.02,3*H,0],lift:.25},
      {id:"hole-north",side:"irregular",kind:"arrow",start:[0,3*H,-2.13],end:[0,3*H,-3.02],lift:.25},
      {id:"hole-south",side:"irregular",kind:"arrow",start:[0,3*H,2.13],end:[0,3*H,3.02],lift:.25},
      {id:"continuous-slab",side:"reference",kind:"line",start:[-S,3*H,0],end:[S,3*H,0],lift:.23},
    ],
  },
  A3: {
    label: "L planındaki iç köşe",
    reference: "Dikdörtgen plan, bu örnekte yeniden giren köşe içermez.",
    irregular: "L biçimli çıkıntının birleştiği iç köşede geometrik süreksizlik bulunur.",
    watch: "İç köşeden iki kanada uzanan turuncu işaretleri üst görünüşte izle.",
    caution: "Köşe vurgusu gerilme veya hasar tahmini değildir.",
    cues: [
      {id:"wing-x",side:"irregular",kind:"arrow",start:[S,3*H,0],end:[5.3,3*H,0],lift:.24},
      {id:"wing-z",side:"irregular",kind:"arrow",start:[S,3*H,0],end:[S,3*H,-2.1],lift:.24},
      {id:"continuous-plan",side:"reference",kind:"line",start:[-S,3*H,0],end:[S,3*H,0],lift:.23},
    ],
  },
  B1: {
    label: "Birinci kat taşıyıcı kesiti",
    reference: "Referans modelin birinci kat kolonları normal şematik kesittedir.",
    irregular: "İlk kat kolonları daha küçük şematik kesitle çizilmiştir.",
    watch: "İşaretli ilk kat kolonunu iki modelde karşılaştır. Bu örnek dayanım farkını kavramsal anlatır.",
    caution: "Kesit boyutu tek başına dayanım hesabı değildir; zayıf katı aşırı ötelenmeyle tanımlama.",
    cues: [
      {id:"lower-column",side:"irregular",kind:"line",start:[-S-.38,0,-S-.38],end:[-S-.38,H,-S-.38]},
      {id:"regular-column",side:"reference",kind:"line",start:[-S-.38,0,-S-.38],end:[-S-.38,H,-S-.38]},
    ],
  },
  B2: {
    label: "Katlar arası göreli ötelenme",
    reference: "Perde zemine kadar devam eder; hareket katlar boyunca daha dengeli dağılır.",
    irregular: "Zemin katın göreli yatay ötelenmesi diğer katlardan daha fazladır.",
    watch: "Birinci ve ikinci katın başlangıç konumuna göre yer değiştirme oklarına bak.",
    caution: "Oklar görsel örnektir; yönetmelik drift oranı veya göreli kat ötelemesi hesabı değildir.",
    cues: [
      {id:"ground-storey-drift",side:"irregular",kind:"displacement",start:[S,H,S],lift:.16},
      {id:"upper-storey-drift",side:"irregular",kind:"displacement",start:[S,2*H,S],lift:.16},
      {id:"regular-ground-drift",side:"reference",kind:"displacement",start:[S,H,S],lift:.16},
      {id:"regular-upper-drift",side:"reference",kind:"displacement",start:[S,2*H,S],lift:.16},
    ],
  },
  B3: {
    label: "Düşey yük yolunun sürekliliği",
    reference: "Orta kolon kesintisiz olarak temele devam eder.",
    irregular: "Üst kolondan gelen yük, birinci kat aktarma kirişiyle yan mesnetlere yönlendirilir.",
    watch: "Düzende turuncu okların aktarma kirişinden iki dış kolona yönelmesini izle.",
    caution: "Oklar yalnız temsili yük yoludur; gerçek iç kuvvet veya göçme hesabı değildir.",
    cues: [
      {id:"upper-column",side:"irregular",kind:"arrow",start:[0,2*H,S],end:[0,H+.20,S]},
      {id:"transfer-left",side:"irregular",kind:"arrow",start:[0,H+.20,S],end:[-S,H+.20,S]},
      {id:"transfer-right",side:"irregular",kind:"arrow",start:[0,H+.20,S],end:[S,H+.20,S]},
      {id:"support-left",side:"irregular",kind:"arrow",start:[-S,H,S],end:[-S,.18,S]},
      {id:"support-right",side:"irregular",kind:"arrow",start:[S,H,S],end:[S,.18,S]},
      {id:"continuous-column",side:"reference",kind:"arrow",start:[0,2*H,S],end:[0,.18,S]},
    ],
  },
};

export function teachingCueSegment(
  cue:TeachingCue, scenario:ScenarioId, phase:number, intensity:number,
): readonly [V3,V3] {
  const move=(point:V3):V3=>cue.side==="reference"
    ? referenceJointAt(point,phase,intensity)
    : jointAt(point,scenario,phase,intensity);
  const lifted=(point:V3):V3=>[point[0],point[1]+(cue.lift??0),point[2]];
  if(cue.kind==="displacement")return [lifted(cue.start),lifted(move(cue.start))];
  return [lifted(move(cue.start)),lifted(move(cue.end??cue.start))];
}

/** Three line segments: shaft and two arrowhead edges (or a simple line). */
export function teachingStroke(start:V3,end:V3,arrow:boolean):Float32Array {
  const [ax,ay,az]=start,[bx,by,bz]=end;
  const dx=bx-ax,dy=by-ay,dz=bz-az;
  const length=Math.hypot(dx,dy,dz);
  const result=new Float32Array(18);
  result.set([ax,ay,az,bx,by,bz]);
  if(!arrow||length<.035){
    result.set([bx,by,bz,bx,by,bz,bx,by,bz,bx,by,bz],6);
    return result;
  }
  const scale=Math.min(.28,Math.max(.12,length*.23));
  let px=-dz,pz=dx;
  const plen=Math.hypot(px,pz);
  if(plen<1e-7){px=1;pz=0;}else{px/=plen;pz/=plen;}
  const back=scale/length;
  result.set([
    bx,by,bz,bx-dx*back+px*scale*.42,by-dy*back,bz-dz*back+pz*scale*.42,
    bx,by,bz,bx-dx*back-px*scale*.42,by-dy*back,bz-dz*back-pz*scale*.42,
  ],6);
  return result;
}
