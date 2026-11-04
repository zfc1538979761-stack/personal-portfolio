import assert from 'node:assert/strict';
import { preloadChapterImage } from '../src/components/chapterImage.ts';

// A controlled Image double exercises cancellation and retry without network timing.
const images = [];
globalThis.Image = class {
  complete = false;
  naturalWidth = 0;
  onload = null;
  onerror = null;
  constructor() { images.push(this); }
  set src(value) { this.url = value; }
  decode() { return Promise.resolve(); }
};
const ready = preloadChapterImage('/first.webp', new AbortController().signal);
images.at(-1).naturalWidth = 800;
images.at(-1).onload();
await ready;
assert.equal(images.at(-1).onload, null);

const abort = new AbortController();
const cancelled = preloadChapterImage('/cancel.webp', abort.signal);
abort.abort();
await assert.rejects(cancelled, { name: 'AbortError' });
assert.equal(images.at(-1).onload, null);
assert.equal(images.at(-1).onerror, null);

const failed = preloadChapterImage('/retry.webp', new AbortController().signal);
images.at(-1).onerror();
await assert.rejects(failed, /加载/);
const retry = preloadChapterImage('/retry.webp', new AbortController().signal);
images.at(-1).naturalWidth = 800;
images.at(-1).onload();
await retry;

const timeout = preloadChapterImage('/slow.webp', new AbortController().signal, 5);
await assert.rejects(timeout, /超时/);
assert.equal(images.at(-1).onload, null);
console.log('PASS: preload, cancellation cleanup, failed-image retry, timeout.');
