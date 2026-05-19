// Renders a single frame range. Usage: node scripts/render-chunk.mjs <start> <end> <out>
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const start = parseInt(process.argv[2], 10);
const end = parseInt(process.argv[3], 10);
const out = process.argv[4];

if (Number.isNaN(start) || Number.isNaN(end) || !out) {
  console.error("usage: render-chunk.mjs <start> <end> <out>");
  process.exit(1);
}

console.log(`Bundling…`);
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (c) => c,
});

console.log(`Opening browser…`);
const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: {
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  },
  chromeMode: "chrome-for-testing",
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: "main",
  puppeteerInstance: browser,
});

console.log(`Rendering frames ${start}-${end} -> ${out}`);
const t0 = Date.now();
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: out,
  puppeteerInstance: browser,
  muted: true,
  concurrency: 2,
  frameRange: [start, end],
  imageFormat: "jpeg",
  jpegQuality: 80,
  onProgress: ({ progress }) => {
    if (Math.random() < 0.05) console.log(`  ${(progress * 100).toFixed(1)}%`);
  },
});
const dur = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`Done in ${dur}s`);

await browser.close({ silent: false });
