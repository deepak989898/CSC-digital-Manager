import sharp from "sharp";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const source = path.join(publicDir, "logo.png");
const bg = { r: 15, g: 31, b: 69, alpha: 1 }; // #0f1f45

const sizes = [
  { name: "favicon-32.png", size: 32 },
  { name: "favicon-16.png", size: 16 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
];

await mkdir(publicDir, { recursive: true });

for (const { name, size } of sizes) {
  await sharp(source)
    .resize(size, size, { fit: "contain", background: bg })
    .png()
    .toFile(path.join(publicDir, name));
  console.log(`Created ${name}`);
}

// Multi-size favicon.ico substitute: browsers also accept PNG favicon
console.log("PWA icons generated from logo.png");
