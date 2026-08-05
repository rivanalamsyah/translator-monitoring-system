/**
 * PWA Icon Generator — Corrected PNG Encoder
 * Produces fully spec-compliant PNG files (RGBA, deflate IDAT, proper CRC)
 * Run: node scripts/generate-pwa-icons.cjs
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = path.join(__dirname, '../public/icons');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// ── CRC-32 ──────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG Chunk builder ────────────────────────────────────────────────────────
function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(d.length, 0);
  const crcInput = Buffer.concat([t, d]);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, t, d, crcBuf]);
}

// ── Build raw RGBA buffer for icon ──────────────────────────────────────────
function buildIconBuffer(size, maskable) {
  const pixels = Buffer.allocUnsafe(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;

  // Colors: pink gradient
  const c1 = [244, 114, 182]; // pink-400
  const c2 = [219,  39, 119]; // pink-600
  const c3 = [255, 255, 255]; // white (text)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;

      // Shape: circle (normal) or squircle (maskable)
      let inShape = false;
      let edgeAlpha = 255;

      if (maskable) {
        // Squircle with safe-zone (80% of size)
        const r = size * 0.42;
        const n = 4;
        const v = Math.pow(Math.abs(dx / r), n) + Math.pow(Math.abs(dy / r), n);
        inShape = v <= 1.0;
        // No AA needed for squircle background fill in maskable icons
      } else {
        // Circle with 1.5px anti-aliasing
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = size * 0.46;
        if (dist <= radius - 1.5) {
          inShape = true;
        } else if (dist <= radius) {
          inShape = true;
          edgeAlpha = Math.round(255 * (radius - dist) / 1.5);
        }
      }

      if (!inShape) {
        // Transparent outside shape
        pixels[idx]     = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
        continue;
      }

      // Gradient: diagonal pink
      const t = Math.max(0, Math.min(1, (x / size + y / size) / 2));
      const bg = [
        Math.round(c1[0] + (c2[0] - c1[0]) * t),
        Math.round(c1[1] + (c2[1] - c1[1]) * t),
        Math.round(c1[2] + (c2[2] - c1[2]) * t),
      ];

      // Draw "MT" text
      const textA = renderMT(x, y, size);
      let fr, fg, fb;
      if (textA > 0) {
        fr = Math.round(bg[0] * (1 - textA) + c3[0] * textA);
        fg = Math.round(bg[1] * (1 - textA) + c3[1] * textA);
        fb = Math.round(bg[2] * (1 - textA) + c3[2] * textA);
      } else {
        [fr, fg, fb] = bg;
      }

      pixels[idx]     = fr;
      pixels[idx + 1] = fg;
      pixels[idx + 2] = fb;
      pixels[idx + 3] = edgeAlpha;
    }
  }
  return pixels;
}

// ── Render "MT" lettermark (normalized to 192px space) ──────────────────────
function renderMT(px, py, size) {
  const scale = size / 192;
  const cx = size / 2;
  const cy = size / 2;
  const nx = (px - cx) / scale;
  const ny = (py - cy) / scale;

  const sw = 11;   // stroke width
  const lh = 68;   // letter height
  const lw = 54;   // letter width
  const gap = 8;   // gap between M and T

  // ── Letter M (centered left) ──
  const mL = -lw - gap / 2;
  const mR = -gap / 2;
  const mMid = (mL + mR) / 2;
  const mTop = -lh / 2;
  const mBot = lh / 2;

  // Left vertical
  if (nx >= mL && nx <= mL + sw && ny >= mTop && ny <= mBot) return 1;
  // Right vertical
  if (nx >= mR - sw && nx <= mR && ny >= mTop && ny <= mBot) return 1;
  // Left diagonal (top-left down to center-mid)
  {
    const xStart = mL + sw / 2, yStart = mTop;
    const xEnd   = mMid,        yEnd   = mBot * 0.35;
    const len    = Math.sqrt((xEnd - xStart) ** 2 + (yEnd - yStart) ** 2);
    const ux = (xEnd - xStart) / len, uy = (yEnd - yStart) / len;
    const proj = (nx - xStart) * ux + (ny - yStart) * uy;
    const perp = Math.abs((nx - xStart) * uy - (ny - yStart) * ux);
    if (proj >= 0 && proj <= len && perp < sw * 0.65) return 1;
  }
  // Right diagonal (center-mid up to top-right)
  {
    const xStart = mMid,        yStart = mBot * 0.35;
    const xEnd   = mR - sw / 2, yEnd   = mTop;
    const len    = Math.sqrt((xEnd - xStart) ** 2 + (yEnd - yStart) ** 2);
    const ux = (xEnd - xStart) / len, uy = (yEnd - yStart) / len;
    const proj = (nx - xStart) * ux + (ny - yStart) * uy;
    const perp = Math.abs((nx - xStart) * uy - (ny - yStart) * ux);
    if (proj >= 0 && proj <= len && perp < sw * 0.65) return 1;
  }

  // ── Letter T (centered right) ──
  const tL = gap / 2;
  const tR = gap / 2 + lw;
  const tCX = (tL + tR) / 2;

  // Horizontal bar
  if (nx >= tL && nx <= tR && ny >= -lh / 2 && ny <= -lh / 2 + sw) return 1;
  // Vertical stem
  if (nx >= tCX - sw / 2 && nx <= tCX + sw / 2 && ny >= -lh / 2 && ny <= lh / 2) return 1;

  return 0;
}

// ── Encode RGBA buffer → valid PNG ──────────────────────────────────────────
function encodePNG(width, height, rgbaBuffer) {
  // Build raw image data (filter byte 0 per scanline + RGBA row)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.allocUnsafe(height * rowSize);
  for (let y = 0; y < height; y++) {
    rawData[y * rowSize] = 0; // None filter
    rgbaBuffer.copy(rawData, y * rowSize + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });

  // IHDR
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(width,  0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 6; // color type: RGBA
  ihdr[10] = 0; // compression: deflate
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace: none

  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  return Buffer.concat([
    PNG_SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Generate all icons ───────────────────────────────────────────────────────
console.log('Generating PWA icons (fixed encoder)...\n');

for (const size of SIZES) {
  const rgba = buildIconBuffer(size, false);
  const png  = encodePNG(size, size, rgba);
  const file = path.join(OUT_DIR, `icon-${size}x${size}.png`);
  fs.writeFileSync(file, png);
  console.log(`  ✓ icon-${size}x${size}.png  (${(png.length / 1024).toFixed(1)} KB)`);
}

// Maskable
const mRgba = buildIconBuffer(512, true);
const mPng  = encodePNG(512, 512, mRgba);
fs.writeFileSync(path.join(OUT_DIR, 'icon-512x512-maskable.png'), mPng);
console.log(`  ✓ icon-512x512-maskable.png  (${(mPng.length / 1024).toFixed(1)} KB)`);

console.log('\nDone! All icons valid.');
