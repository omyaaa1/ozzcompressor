import { blobFromCanvas, getCanvasForImage } from "./utils.js";

export async function binarySearchQuality(canvas, mime, targetBytes, qualityFloor) {
  let minQ = qualityFloor;
  let maxQ = 0.95;
  let best = null;

  for (let i = 0; i < 10; i += 1) {
    const q = (minQ + maxQ) / 2;
    const blob = await blobFromCanvas(canvas, mime, q);
    if (!blob) break;

    if (!best || Math.abs(blob.size - targetBytes) < Math.abs(best.size - targetBytes)) {
      best = blob;
    }

    if (blob.size > targetBytes) {
      maxQ = q;
    } else {
      minQ = q;
    }
  }

  return best;
}

export async function compressToTarget(img, targetBytes, options, statusCb) {
  const { mime, maxWidth, tolerance, qualityFloor } = options;
  let scale = 1;
  if (maxWidth && maxWidth > 0) {
    scale = Math.min(scale, maxWidth / img.naturalWidth);
  }

  let canvas = getCanvasForImage(img, scale);
  let bestBlob = null;

  if (mime === "image/png") {
    const blob = await blobFromCanvas(canvas, mime);
    return { blob, scale };
  }

  for (let attempt = 0; attempt < 7; attempt += 1) {
    statusCb?.(`Optimizing... pass ${attempt + 1}`);
    const blob = await binarySearchQuality(canvas, mime, targetBytes, qualityFloor);
    if (blob) bestBlob = blob;

    if (blob && blob.size <= targetBytes * tolerance) {
      return { blob, scale };
    }

    if (!blob) break;

    const ratio = Math.sqrt(targetBytes / blob.size) * 0.92;
    scale = Math.max(0.1, scale * ratio);
    canvas = getCanvasForImage(img, scale);
  }

  return { blob: bestBlob, scale };
}
