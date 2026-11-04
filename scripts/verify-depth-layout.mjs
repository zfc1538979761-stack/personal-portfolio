import assert from "node:assert/strict";
import { depthLayout } from "../src/components/depthLayout.ts";
import { destinations } from "../src/media-data.ts";
for (const [width, height] of [
  [900, 1000],
  [1286, 1080],
  [1286, 1440],
]) {
  const stageHeights = new Set();
  for (const destination of destinations) {
    for (const image of destination.photos) {
      const result = depthLayout(width, height, image.width, image.height);
      stageHeights.add(result.stageHeight);
      assert.ok(
        Math.abs(
          (result.cardWidth - 2) / (result.cardHeight - 2) -
            image.width / image.height,
        ) < 1e-9,
      );
      assert.ok(result.cardWidth <= width - 180 + 1e-6);
      assert.ok(result.stageHeight > result.cardHeight);
      if (image.width < image.height) assert.ok(result.cardHeight - 2 >= 560);
    }
  }
  assert.equal(stageHeights.size, 1, 'stage height must not change with photo aspect ratio');
}
console.log(
  "PASS: 45 photos × 3 sizes; fixed stage, full front image ratio, large portraits, depth rail clearance.",
);
