const fs = require('fs');
const path = require('path');
const out = path.join(__dirname, 'mnt', 'user-data', 'outputs', 'client', 'public', 'favicon.ico');
const width = 16;
const height = 16;
const header = Buffer.from([0, 0, 1, 0, 1, 0]);
const entry = Buffer.alloc(16);
entry.writeUInt8(width === 256 ? 0 : width, 0);
entry.writeUInt8(height === 256 ? 0 : height, 1);
entry.writeUInt8(0, 2);
entry.writeUInt8(0, 3);
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);
const dibSize = 40;
const pixelBytes = width * height * 4;
const maskRowBytes = Math.ceil(width / 32) * 4;
const maskSize = maskRowBytes * height;
const imageSize = dibSize + pixelBytes + maskSize;
entry.writeUInt32LE(imageSize, 8);
entry.writeUInt32LE(header.length + entry.length, 12);
const dib = Buffer.alloc(dibSize);
dib.writeUInt32LE(dibSize, 0);
dib.writeInt32LE(width, 4);
dib.writeInt32LE(height * 2, 8);
dib.writeUInt16LE(1, 12);
dib.writeUInt16LE(32, 14);
dib.writeUInt32LE(0, 16);
dib.writeUInt32LE(pixelBytes + maskSize, 20);
dib.writeInt32LE(0, 24);
dib.writeInt32LE(0, 28);
dib.writeUInt32LE(0, 32);
dib.writeUInt32LE(0, 36);
const pixels = Buffer.alloc(pixelBytes);
const cx = 7.5;
const cy = 7.5;
const radius = 6.2;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const dy = y - cy;
    const dx = x - cx;
    const idx = ((height - 1 - y) * width + x) * 4;
    if (dx * dx + dy * dy <= radius * radius) {
      pixels[idx] = 0x1f;
      pixels[idx + 1] = 0x7a;
      pixels[idx + 2] = 0xff;
      pixels[idx + 3] = 0xff;
    } else {
      pixels[idx] = 0;
      pixels[idx + 1] = 0;
      pixels[idx + 2] = 0;
      pixels[idx + 3] = 0;
    }
  }
}
const mask = Buffer.alloc(maskSize, 0);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.concat([header, entry, dib, pixels, mask]));
console.log('favicon created at', out);
