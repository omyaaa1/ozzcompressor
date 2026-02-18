export const kb = (bytes) => (bytes / 1024).toFixed(1);

export function getCanvasForImage(img, scale) {
  const canvas = document.createElement("canvas");
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

export function blobFromCanvas(canvas, mime, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
