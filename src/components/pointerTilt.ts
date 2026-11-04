export type TiltKind = 'geo' | 'dolla' | 'strength';
export type PointerCoordinates = {nx:number;ny:number;proximity:number;angle:number};
export function tiltAllowed(width:number, hover:boolean, fine:boolean, reduced:boolean) { return width>=1024&&hover&&fine&&!reduced; }
export function pointerCoordinates(rect:{left:number;top:number;width:number;height:number},x:number,y:number):PointerCoordinates {
  if(rect.width<=0||rect.height<=0)return {nx:0,ny:0,proximity:0,angle:90};
  const dx=x-rect.left-rect.width/2,dy=y-rect.top-rect.height/2;
  const nx=Math.max(-1,Math.min(1,dx/(rect.width/2))),ny=Math.max(-1,Math.min(1,dy/(rect.height/2)));
  return {nx,ny,proximity:Math.max(Math.abs(nx),Math.abs(ny))*100,angle:(Math.atan2(dy,dx)*180/Math.PI+450)%360};
}
export function tiltPose(kind:TiltKind,p:PointerCoordinates) {
  const max=kind==='geo'?4:2;
  const layers=kind==='geo'?[{max:6,z:20},{max:12,z:40}]:kind==='dolla'?[{max:6,z:0}]:[];
  return {rx:-p.ny*max,ry:p.nx*max,lift:kind==='strength'?-4:0,
    layers:layers.map(l=>({...l,x:-p.nx*l.max,y:-p.ny*l.max}))};
}
