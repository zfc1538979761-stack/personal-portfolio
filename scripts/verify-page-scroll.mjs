import assert from 'node:assert/strict';
// Losing coalescing would run layout/reset work once per raw scroll event.
const queue=new Map();let next=0, adds=0, removes=0, passive=false;
globalThis.requestAnimationFrame=fn=>{queue.set(++next,fn);return next;};
globalThis.cancelAnimationFrame=id=>queue.delete(id);
const target=new EventTarget();
globalThis.window={
  addEventListener(type,fn,options){adds++;passive=options?.passive;target.addEventListener(type,fn);},
  removeEventListener(type,fn){removes++;target.removeEventListener(type,fn);},
};
const {subscribePageScroll}=await import('../src/components/pageScroll.ts');
let a=0,b=0;
const offA=subscribePageScroll(()=>a++),offB=subscribePageScroll(()=>b++);
assert.equal(adds,1);assert.equal(passive,true);
for(let i=0;i<30;i++)target.dispatchEvent(new Event('scroll'));
assert.equal(queue.size,1);assert.equal(a,0);
for(const [id,fn] of queue){queue.delete(id);fn();}
assert.equal(a,1);assert.equal(b,1);
offA();target.dispatchEvent(new Event('scroll'));
for(const [id,fn] of queue){queue.delete(id);fn();}
assert.equal(a,1);assert.equal(b,2);
target.dispatchEvent(new Event('scroll'));offB();
assert.equal(removes,1);assert.equal(queue.size,0);
const again=subscribePageScroll(()=>a++);assert.equal(adds,2);again();
console.log('PASS: one passive scroll listener / 30 events coalesced / unsubscribe / pending frame cleanup / remount.');
