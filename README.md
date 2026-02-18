# OzzCompressor

Target-size image compression directly in your browser. Drop an image, set a KB target, and download the result. No uploads.

Live demo: https://omyaaa1.github.io/ozzcompressor/

## Features

- Drag-and-drop, click-to-select, and paste from clipboard
- Targets a specific file size in KB
- Multi-pass compression for tighter sizing
- JPEG and WebP quality control
- Optional max-width resize
- Works fully offline after load

## How to use

1. Open the app in a browser.
2. Drop an image (or click to select / paste from clipboard).
3. Enter the target size in KB.
4. Click Compress, then download.

## Format notes

- JPEG / WebP: best for hitting exact size targets.
- PNG: lossless, may not reach small targets.

## Development

This is a static site. Just open `index.html` or serve the folder with any static server.

## License

MIT
