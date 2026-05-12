import sharp from "sharp";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

// Brand colors
const BG = { r: 108, g: 49, b: 227 };   // #6c31e3 purple
const BORDER = { r: 26, g: 26, b: 46 };  // #1a1a2e dark navy

// Build a square SVG that sharp can rasterise
function buildSvg(size) {
  const borderW = Math.round(size * 0.045);  // ~4.5% border
  const radius  = Math.round(size * 0.22);   // rounded corners
  const fontSize = Math.round(size * 0.30);  // "FQ" text

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Shadow / border layer -->
  <rect x="${borderW}" y="${borderW}"
        width="${size - borderW}" height="${size - borderW}"
        rx="${radius}" ry="${radius}"
        fill="rgb(${BORDER.r},${BORDER.g},${BORDER.b})" />
  <!-- Main card -->
  <rect x="0" y="0"
        width="${size - borderW}" height="${size - borderW}"
        rx="${radius}" ry="${radius}"
        fill="rgb(${BG.r},${BG.g},${BG.b})" />
  <!-- "FQ" wordmark -->
  <text x="${(size - borderW) / 2}" y="${(size - borderW) / 2 + fontSize * 0.36}"
        font-family="Impact, Arial Black, sans-serif"
        font-weight="900"
        font-size="${fontSize}"
        fill="white"
        text-anchor="middle"
        letter-spacing="2">FQ</text>
</svg>`;
}

async function makeIcon(size, filename) {
  const svg = Buffer.from(buildSvg(size));
  await sharp(svg)
    .png()
    .toFile(path.join(publicDir, filename));
  console.log(`✅ Created ${filename} (${size}×${size})`);
}

await makeIcon(192, "icon-192.png");
await makeIcon(512, "icon-512.png");
console.log("Done.");
