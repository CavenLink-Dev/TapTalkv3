/**
 * Creates 1×1 placeholder PNGs in asset/activities/ so Metro can bundle
 * activities.tsx while the real generated images are not yet in place.
 *
 * Run once from the project root:
 *   node scripts/gen-activity-placeholders.js
 *
 * Then drop your real ChatGPT images over the placeholders:
 *   asset/activities/shape-match.png
 *   asset/activities/memory-match.png
 *   asset/activities/picture-match.png
 *   asset/activities/count-along.png
 */

const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

// Build a minimal valid PNG for a given RGB colour.
function buildPNG(r, g, b) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: 1×1, 8-bit RGB, no interlace
  const ihdrData = Buffer.from([
    0, 0, 0, 1,   // width = 1
    0, 0, 0, 1,   // height = 1
    8,            // bit depth
    2,            // colour type = RGB
    0, 0, 0,      // compression, filter, interlace
  ]);
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw scanline: filter byte 0 + RGB pixel
  const raw = Buffer.from([0, r, g, b]);
  const compressed = zlib.deflateSync(raw);
  const idatChunk  = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcInput   = Buffer.concat([typeBuffer, data]);
  const crc        = Buffer.allocUnsafe(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuffer, data, crc]);
}

function crc32(buf) {
  const table = buildCRCTable();
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function buildCRCTable() {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
}

const placeholders = [
  { name: 'shape-match',   r: 232, g: 250, b: 232 }, // mint green  #E8FAE8
  { name: 'memory-match',  r: 230, g: 244, b: 253 }, // sky blue    #E6F4FD
  { name: 'picture-match', r: 243, g: 234, b: 255 }, // soft purple #F3EAFF
  { name: 'count-along',   r: 255, g: 244, b: 224 }, // warm amber  #FFF4E0
];

const outDir = path.join(__dirname, '..', 'asset', 'activities');
fs.mkdirSync(outDir, { recursive: true });

for (const { name, r, g, b } of placeholders) {
  const dest = path.join(outDir, `${name}.png`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 100) {
    console.log(`  skip  ${name}.png  (already has real image)`);
    continue;
  }
  fs.writeFileSync(dest, buildPNG(r, g, b));
  console.log(`  wrote ${name}.png  (${r},${g},${b})`);
}

console.log('\nDone. Drop your ChatGPT images over these files and they will load immediately.');
