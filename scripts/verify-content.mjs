import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { destinations, performanceRecords, geoEvidence } from '../src/media-data.ts';
const expected=[[3,1,2,4],[5,6,8,9,11,33],[15,16,13,14,12],[19,20,21],[18,36,22,17],[24,25,23],[41,26,28,27],[32,31,30,29],[34,35],[40,39,37,38,47],[45,42,46,43,44]];
assert.equal(destinations.length,11);
assert.deepEqual(destinations.map(d=>d.photos.map(p=>p.sourceIndex)),expected);
const indices=destinations.flatMap(d=>d.photos.map(p=>p.sourceIndex));
assert.equal(indices.length,45);assert.equal(new Set(indices).size,45);assert.ok(!indices.includes(7)&&!indices.includes(10));
assert.equal(performanceRecords.length,13);assert.ok(performanceRecords.every(p=>p.metrics.likes>1000));
assert.deepEqual(performanceRecords.map(p=>p.metrics.likes),[230000,8732,7185,6549,6439,4346,3215,2863,2727,2332,1897,1385,1057]);
assert.equal(geoEvidence.length,8);assert.ok(geoEvidence.every(p=>p.src.includes('geo-real-')));
for(const media of [...destinations.flatMap(d=>d.photos),...performanceRecords,...geoEvidence]) {assert.ok(existsSync(resolve('public'+media.src)),media.src);assert.ok(media.width>0&&media.height>0);}
const source=readFileSync('src/App.tsx','utf8');assert.ok(source.includes('170<span>万+</span>'));assert.ok(!source.includes('150<span>万+</span>'));
const css=readFileSync('src/App.css','utf8');assert.ok(!/saturate\(|brightness\(/.test(css));
console.log('PASS: 11 destinations / 45 ordered photos / 13 records / 8 real GEO frames / source paths / restored color styling.');
