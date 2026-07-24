// Renders a full composition to MP4.
// Usage: node scripts/render-walkthrough.mjs [compId] [out]
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const compId = process.argv[2] || "walkthrough";
const out =
  process.argv[3] || `/mnt/documents/is-he-ok-${compId}.mp4`;

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
  id: compId,
  puppeteerInstance: browser,
});

console.log(
  `Rendering "${compId}" (${composition.durationInFrames} frames) -> ${out}`,
);
const t0 = Date.now();
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: out,
  puppeteerInstance: browser,
  muted: true,
  concurrency: 2,
  imageFormat: "jpeg",
  jpegQuality: 82,
  onProgress: ({ progress }) => {
    if (Math.random() < 0.03) console.log(`  ${(progress * 100).toFixed(1)}%`);
  },
});
console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

await browser.close({ silent: false });
