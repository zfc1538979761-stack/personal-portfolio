import assert from 'node:assert/strict';
const { canvasBudget, frameDue } = await import('../src/components/renderBudget.ts');
const large = canvasBudget(3840,2160,2,1300000);
assert.ok(large.width*large.height<=1300000);
assert.ok(Math.abs(large.width/large.height-16/9)<.005);
assert.deepEqual(canvasBudget(390,844,1,1300000),{width:390,height:844,ratio:1});
assert.ok(!frameDue(116,100,30));assert.ok(frameDue(134,100,30));
assert.ok(frameDue(1,0,30));assert.ok(frameDue(500,100,30));
console.log('PASS: large canvas pixel budget / natural aspect / small screen resolution / render cadence.');
