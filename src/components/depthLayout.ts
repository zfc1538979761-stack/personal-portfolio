export function depthLayout(
  availableWidth: number,
  viewportHeight: number,
  photoWidth: number,
  photoHeight: number,
) {
  const ratio = photoWidth / photoHeight;
  const targetHeight = Math.min(900, Math.max(560, viewportHeight * 0.72));
  const imageWidth = Math.min(
    targetHeight * ratio,
    Math.max(1, availableWidth - 182),
  );
  const imageHeight = imageWidth / ratio;
  return {
    cardWidth: imageWidth + 2,
    cardHeight: imageHeight + 2,
    stageHeight: targetHeight + 50,
  };
}
