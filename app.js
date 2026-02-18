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
const statusLine = document.getElementById("status");

let currentFile = null;
let currentImage = null;
let currentBlobUrl = null;

const QUALITY_FLOOR = 0.35;
const QUALITY_CEIL = 0.95;

const kb = (bytes) => (bytes / 1024).toFixed(1);

function resetOutput() {
  compressedMeta.textContent = "Not processed";
  compressedPreview.removeAttribute("src");
  downloadLink.classList.remove("show");
  statusLine.textContent = "Ready";
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
}

function setOriginal(file, img) {
  currentFile = file;
  currentImage = img;
  originalPreview.src = img.src;
  originalMeta.textContent = `${file.name} · ${kb(file.size)} KB · ${img.naturalWidth}x${img.naturalHeight}`;
  resetOutput();
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
  ctx.imageSmoothingQuality = "high";
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
  let minQ = QUALITY_FLOOR;
  let maxQ = QUALITY_CEIL;
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

  for (let attempt = 0; attempt < 7; attempt += 1) {
    statusLine.textContent = `Optimizing... pass ${attempt + 1}`;
    const blob = await binarySearchQuality(canvas, mime, targetBytes);
    if (blob) bestBlob = blob;

    if (blob && blob.size <= targetBytes * 1.02) {
      return { blob, scale };
    }

    if (!blob) break;

    const ratio = Math.sqrt(targetBytes / blob.size) * 0.92;
    scale = Math.max(0.1, scale * ratio);
    canvas = getCanvasForImage(img, scale);
  }

  return { blob: bestBlob, scale };
}

async function compressCurrent() {
  if (!currentImage || !currentFile) return;

  compressBtn.disabled = true;
  compressBtn.textContent = "Compressing...";
  statusLine.textContent = "Preparing...";

  const targetKb = parseFloat(targetKbInput.value || "0");
  const targetBytes = Math.max(10, targetKb) * 1024;
  const maxWidth = parseInt(maxWidthInput.value, 10) || 0;
  const mime = formatSelect.value;

  try {
    const sameFormat = currentFile.type === mime && maxWidth === 0;
    if (sameFormat && currentFile.size <= targetBytes * 1.02) {
      const blobUrl = URL.createObjectURL(currentFile);
      if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
      currentBlobUrl = blobUrl;
      compressedPreview.src = blobUrl;
      compressedMeta.textContent = `${kb(currentFile.size)} KB · already under target`;
      downloadLink.href = blobUrl;
      downloadLink.download = currentFile.name;
      downloadLink.classList.add("show");
      statusLine.textContent = "Done";
      return;
    }

    const { blob } = await compressToTarget(currentImage, targetBytes, { mime, maxWidth });
    if (!blob) throw new Error("Compression failed");

    const blobUrl = URL.createObjectURL(blob);
    if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = blobUrl;
    compressedPreview.src = blobUrl;

    const ratio = ((blob.size / currentFile.size) * 100).toFixed(1);
    let extra = "";
    if (mime === "image/png" && blob.size > targetBytes * 1.05) {
      extra = " · PNG may not hit target";
    }
    compressedMeta.textContent = `${kb(blob.size)} KB · ${ratio}% of original${extra}`;

    const ext = mime === "image/webp" ? "webp" : mime === "image/png" ? "png" : "jpg";
    downloadLink.href = blobUrl;
    downloadLink.download = `${currentFile.name.replace(/\.[^/.]+$/, "")}-compressed.${ext}`;
    downloadLink.classList.add("show");
    statusLine.textContent = "Done";
  } catch (err) {
    compressedMeta.textContent = "Compression failed. Try a larger target size.";
    statusLine.textContent = "Failed";
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

window.addEventListener("paste", (e) => {
  const item = Array.from(e.clipboardData?.items || []).find((i) => i.type.startsWith("image/"));
  if (item) {
    const file = item.getAsFile();
    if (file) loadFile(file);
  }
});
