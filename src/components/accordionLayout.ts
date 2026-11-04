// Fit the expanded panel to the actual photo, not a fixed percentage of the row.
export function accordionLayout(
  availableWidth: number,
  viewportHeight: number,
  count: number,
  photoWidth: number,
  photoHeight: number,
  gap: number,
) {
  const ratio = photoWidth / photoHeight;
  const targetImageHeight = Math.min(900, Math.max(560, viewportHeight * 0.72));
  const siblings = Math.max(0, count - 1);
  const gapWidth = gap * siblings;
  const maxImageWidth = Math.max(
    1,
    availableWidth - gapWidth - siblings * 56 - 2,
  );
  const imageWidth = Math.min(targetImageHeight * ratio, maxImageWidth);
  const imageHeight = imageWidth / ratio;
  const activeWidth = imageWidth + 2;
  const remaining = Math.max(0, availableWidth - activeWidth - gapWidth);
  const previewWidth = siblings
    ? Math.min(remaining / siblings, count === 2 ? activeWidth * 0.88 : 180)
    : 0;
  return {
    activeWidth,
    previewWidth,
    rowHeight: imageHeight + 46,
    imageHeight,
  };
}
