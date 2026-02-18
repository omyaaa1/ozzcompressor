# OzzCompressor

Target-size image compression directly in your browser. Drop an image, set a KB target, and download the result. No uploads, no server.

Live demo: https://omyaaa1.github.io/ozzcompressor/

## Why

Most compressors give you quality sliders, not outcomes. OzzCompressor targets a size so you can ship assets that meet strict limits.

## Features

- Drag-and-drop, click-to-select, and paste from clipboard
- Targets a specific file size in KB
- Multi-pass compression for tighter sizing
- Optional max-width resize
- Auto-download toggle
- Size tolerance and quality floor controls
- Format support detection per browser

## Supported formats

The app enables only what your browser can encode:

- JPEG
- WebP
- PNG (lossless)
- AVIF (modern browsers only)

## Usage

1. Open the app in a browser.
2. Drop an image (or click to select / paste from clipboard).
3. Enter the target size in KB.
4. Adjust advanced controls if needed.
5. Click Compress, then download.

## Limitations

- PNG is lossless and may not reach small targets.
- AVIF availability depends on browser support.
- Exact targeting is best-effort and may vary by content.

## Development

The static site lives in `docs/`. Open `docs/index.html` or serve `docs/` with any static server.

Commands:

- `npm run test`
- `npm run lint`
- `npm run format`

## License

MIT
