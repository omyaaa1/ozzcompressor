const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const targetKbInput = document.getElementById("targetKb");
const maxWidthInput = document.getElementById("maxWidth");
const formatSelect = document.getElementById("format");
const compressBtn = document.getElementById("compressBtn");
const originalMeta = document.getElementById("originalMeta");
const compressedMeta = document.getElementById("compressedMeta");
const originalPreview = document.getElementById("originalPreview");
const compressedPreview = document.getElementById("compressedPreview");
const downloadLink = document.getElementById("downloadLink");

let currentFile = null;
let currentImage = null;

const kb = (bytes) => (bytes / 1024).toFixed(1);

function setOriginal(file, img) {
  currentFile = file;
  currentImage = img;
  originalPreview.src = img.src;
  originalMeta.textContent = `${file.name} · ${kb(file.size)} KB · ${img.naturalWidth}x${img.naturalHeight}`;
  compressedMeta.textContent = "Not processed";
  compressedPreview.removeAttribute("src");
  downloadLink.classList.remove("show");
  compressBtn.disabled = false;
}

function loadFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => setOriginal(file, img);
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function handleFiles(files) {
  if (!files || !files.length) return;
  loadFile(files[0]);
}

function getCanvasForImage(img, scale) {
  const canvas = document.createElement("canvas");
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

function blobFromCanvas(canvas, mime, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      mime,
      quality
    );
  });
}

async function binarySearchQuality(canvas, mime, targetBytes) {
  let minQ = 0.2;
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

async function compressToTarget(img, targetBytes, options) {
  const { mime, maxWidth } = options;
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

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const blob = await binarySearchQuality(canvas, mime, targetBytes);
    if (blob) bestBlob = blob;

    if (blob && blob.size <= targetBytes * 1.02) {
      return { blob, scale };
    }

    if (!blob) break;

    const ratio = Math.sqrt(targetBytes / blob.size) * 0.95;
    scale = Math.max(0.1, scale * ratio);
    canvas = getCanvasForImage(img, scale);
  }

  return { blob: bestBlob, scale };
}

async function compressCurrent() {
  if (!currentImage || !currentFile) return;

  compressBtn.disabled = true;
  compressBtn.textContent = "Compressing...";

  const targetKb = parseFloat(targetKbInput.value || "0");
  const targetBytes = Math.max(10, targetKb) * 1024;
  const maxWidth = parseInt(maxWidthInput.value, 10) || 0;
  const mime = formatSelect.value;

  try {
    const { blob } = await compressToTarget(currentImage, targetBytes, { mime, maxWidth });
    if (!blob) throw new Error("Compression failed");

    const blobUrl = URL.createObjectURL(blob);
    compressedPreview.src = blobUrl;

    const ratio = ((blob.size / currentFile.size) * 100).toFixed(1);
    compressedMeta.textContent = `${kb(blob.size)} KB · ${ratio}% of original`;

    const ext = mime === "image/webp" ? "webp" : mime === "image/png" ? "png" : "jpg";
    downloadLink.href = blobUrl;
    downloadLink.download = `${currentFile.name.replace(/\.[^/.]+$/, "")}-compressed.${ext}`;
    downloadLink.classList.add("show");
  } catch (err) {
    compressedMeta.textContent = "Compression failed. Try a larger target size.";
  } finally {
    compressBtn.textContent = "Compress";
    compressBtn.disabled = false;
  }
}

["dragenter", "dragover"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
  });
});

dropzone.addEventListener("drop", (e) => {
  handleFiles(e.dataTransfer.files);
});

dropzone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => handleFiles(e.target.files));
compressBtn.addEventListener("click", compressCurrent);
