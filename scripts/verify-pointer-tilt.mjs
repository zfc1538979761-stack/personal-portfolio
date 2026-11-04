import assert from 'node:assert/strict';
import { pointerCoordinates, tiltPose, tiltAllowed } from '../src/components/pointerTilt.ts';
assert.equal(tiltAllowed(1024,true,true,false),true);
for(const a of [[1023,true,true,false],[1920,false,true,false],[1920,true,false,false],[1920,true,true,true]])assert.equal(tiltAllowed(...a),false);
const rect={left:100,top:50,width:400,height:200};
assert.deepEqual(pointerCoordinates(rect,300,150),{nx:0,ny:0,proximity:0,angle:90});
const p=pointerCoordinates(rect,700,-40);assert.equal(p.nx,1);assert.equal(p.ny,-1);assert.equal(p.proximity,100);
for(const kind of ['geo','dolla','strength'])for(const [x,y]of [[100,50],[500,250],[9999,-9999],[300,150]]){
 const pose=tiltPose(kind,pointerCoordinates(rect,x,y));
 const max=kind==='geo'?4:2;
 assert.ok(Math.abs(pose.rx)<=max&&Math.abs(pose.ry)<=max);
 assert.equal(pose.lift,kind==='strength'?-4:0);
 for(const l of pose.layers)assert.ok(Math.abs(l.x)<=l.max&&Math.abs(l.y)<=l.max);
}
assert.deepEqual(tiltPose('geo',p).layers.map(l=>l.z),[20,40]);
for(const n of Object.values(pointerCoordinates({left:0,top:0,width:0,height:0},1,1)))assert.ok(Number.isFinite(n));
console.log('PASS: pointer bounds, stable coordinates, 4°/2° limits, depth layers and device policy.');
