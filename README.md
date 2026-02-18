# OzzCompressor

Target-size image compression directly in your browser. Drop an image, set a KB target, and download the result. No uploads.

Live demo: https://omyaaa1.github.io/ozzcompressor/

## Features

- Drag-and-drop, click-to-select, and paste from clipboard
- Targets a specific file size in KB
- Multi-pass compression for tighter sizing
- Optional max-width resize
- Auto-download toggle
- Size tolerance and quality floor controls
- Format support detection per browser

## Supported formats

The app will enable only what your browser can encode:

- JPEG
- WebP
- PNG (lossless)
- AVIF (modern browsers only)

## How to use

1. Open the app in a browser.
2. Drop an image (or click to select / paste from clipboard).
3. Enter the target size in KB.
4. Adjust advanced controls if needed.
5. Click Compress, then download.

## Format notes

- JPEG / WebP: best for hitting exact size targets.
- PNG: lossless, may not reach small targets.
- AVIF: excellent compression when supported.

## Development

This is a static site. Just open `index.html` or serve the folder with any static server.

## License

MIT
