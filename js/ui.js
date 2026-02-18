import { kb, clamp } from "./utils.js";
import { state, resetState } from "./state.js";
import { compressToTarget } from "./compressor.js";

export function initUi(elements) {
  const {
    dropzone,
    fileInput,
    targetKbInput,
    maxWidthInput,
    formatSelect,
    toleranceInput,
    qualityFloorInput,
    autoDownloadInput,
    compressBtn,
    originalMeta,
    compressedMeta,
    originalPreview,
    compressedPreview,
    downloadLink,
    statusLine
  } = elements;

  function setStatus(text) {
    statusLine.textContent = text;
  }

  function resetOutput() {
    compressedMeta.textContent = "Not processed";
    compressedPreview.removeAttribute("src");
    downloadLink.classList.remove("show");
    setStatus("Ready");
    resetState();
  }

  function setOriginal(file, img) {
    state.file = file;
    state.image = img;
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

  async function compressCurrent() {
    if (!state.image || !state.file) return;

    compressBtn.disabled = true;
    compressBtn.textContent = "Compressing...";
    setStatus("Preparing...");

    const targetKb = parseFloat(targetKbInput.value || "0");
    const targetBytes = Math.max(10, targetKb) * 1024;
    const maxWidth = parseInt(maxWidthInput.value, 10) || 0;
    const mime = formatSelect.value;
    const tolerance = 1 + clamp(parseFloat(toleranceInput.value || "2"), 0, 10) / 100;
    const qualityFloor = clamp(parseFloat(qualityFloorInput.value || "35"), 10, 95) / 100;

    try {
      const sameFormat = state.file.type === mime && maxWidth === 0;
      if (sameFormat && state.file.size <= targetBytes * tolerance) {
        const blobUrl = URL.createObjectURL(state.file);
        resetState();
        state.blobUrl = blobUrl;
        compressedPreview.src = blobUrl;
        compressedMeta.textContent = `${kb(state.file.size)} KB · already under target`;
        downloadLink.href = blobUrl;
        downloadLink.download = state.file.name;
        downloadLink.classList.add("show");
        if (autoDownloadInput.checked) downloadLink.click();
        setStatus("Done");
        return;
      }

      const { blob } = await compressToTarget(
        state.image,
        targetBytes,
        { mime, maxWidth, tolerance, qualityFloor },
        setStatus
      );

      if (!blob) throw new Error("Compression failed");

      const blobUrl = URL.createObjectURL(blob);
      resetState();
      state.blobUrl = blobUrl;
      compressedPreview.src = blobUrl;

      const ratio = ((blob.size / state.file.size) * 100).toFixed(1);
      let extra = "";
      if (mime === "image/png" && blob.size > targetBytes * 1.05) {
        extra = " · PNG may not hit target";
      }
      compressedMeta.textContent = `${kb(blob.size)} KB · ${ratio}% of original${extra}`;

      const ext =
        mime === "image/webp"
          ? "webp"
          : mime === "image/png"
          ? "png"
          : mime === "image/avif"
          ? "avif"
          : "jpg";

      downloadLink.href = blobUrl;
      downloadLink.download = `${state.file.name.replace(/\.[^/.]+$/, "")}-compressed.${ext}`;
      downloadLink.classList.add("show");
      if (autoDownloadInput.checked) downloadLink.click();
      setStatus("Done");
    } catch (err) {
      compressedMeta.textContent = "Compression failed. Try a larger target size.";
      setStatus("Failed");
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

  dropzone.addEventListener("drop", (e) => handleFiles(e.dataTransfer.files));
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
}
