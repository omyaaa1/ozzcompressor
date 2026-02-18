import { blobFromCanvas } from "./utils.js";

export async function supportsMime(mime) {
  const canvas = document.createElement("canvas");
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 2, 2);
  const blob = await blobFromCanvas(canvas, mime, 0.8);
  return blob && blob.type === mime;
}

export async function initFormatOptions(formatSelect, formatHint) {
  const options = Array.from(formatSelect.options);
  const results = await Promise.all(options.map((opt) => supportsMime(opt.value)));
  const supported = [];
  options.forEach((opt, idx) => {
    const ok = results[idx];
    opt.disabled = !ok;
    if (!ok) {
      opt.textContent = `${opt.textContent} (not supported)`;
    } else {
      supported.push(opt.textContent);
    }
  });
  if (formatSelect.selectedOptions[0]?.disabled) {
    const firstSupported = options.find((opt) => !opt.disabled);
    if (firstSupported) formatSelect.value = firstSupported.value;
  }
  formatHint.textContent = `Available formats: ${supported.join(", ")}`;
}
