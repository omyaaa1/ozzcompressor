import { initFormatOptions } from "./formats.js";
import { initUi } from "./ui.js";

const elements = {
  dropzone: document.getElementById("dropzone"),
  fileInput: document.getElementById("fileInput"),
  targetKbInput: document.getElementById("targetKb"),
  maxWidthInput: document.getElementById("maxWidth"),
  formatSelect: document.getElementById("format"),
  toleranceInput: document.getElementById("tolerance"),
  qualityFloorInput: document.getElementById("qualityFloor"),
  autoDownloadInput: document.getElementById("autoDownload"),
  compressBtn: document.getElementById("compressBtn"),
  originalMeta: document.getElementById("originalMeta"),
  compressedMeta: document.getElementById("compressedMeta"),
  originalPreview: document.getElementById("originalPreview"),
  compressedPreview: document.getElementById("compressedPreview"),
  downloadLink: document.getElementById("downloadLink"),
  statusLine: document.getElementById("status"),
  formatHint: document.getElementById("formatHint")
};

initUi(elements);
initFormatOptions(elements.formatSelect, elements.formatHint);
