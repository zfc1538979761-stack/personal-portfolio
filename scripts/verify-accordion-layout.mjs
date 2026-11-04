import assert from "node:assert/strict";
import { accordionLayout } from "../src/components/accordionLayout.ts";
import { destinations } from "../src/media-data.ts";

for (const [available, viewportHeight] of [
  [900, 1000],
  [1286, 1080],
  [1286, 1440],
]) {
  for (const destination of destinations) {
    for (const photo of destination.photos) {
      const count = destination.photos.length;
      const layout = accordionLayout(
        available,
        viewportHeight,
        count,
        photo.width,
        photo.height,
        10,
      );
      // The inside frame must match the original ratio, leaving no letterbox bands.
      assert.ok(
        Math.abs(
          (layout.activeWidth - 2) / (layout.rowHeight - 46) -
            photo.width / photo.height,
        ) < 1e-9,
      );
      assert.ok(
        layout.activeWidth + (count - 1) * (layout.previewWidth + 10) <=
          available + 0.01,
      );
      assert.ok(layout.previewWidth >= 56);
      if (photo.width < photo.height) {
        const previousHeight =
          Math.min(620, Math.max(420, viewportHeight * 0.55)) - 46;
        assert.ok(layout.imageHeight >= previousHeight * 1.3, photo.src);
      }
    }
  }
}
console.log(
  "PASS: 45 photos × 3 desktop sizes; exact frame ratios, no overflow, portrait images at least 30% taller.",
);
