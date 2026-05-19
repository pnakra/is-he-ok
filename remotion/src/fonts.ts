import { continueRender, delayRender } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadSerif } from "@remotion/google-fonts/SourceSerif4";

const interHandle = delayRender("Loading Inter");
const serifHandle = delayRender("Loading Source Serif 4");
const serifItalicHandle = delayRender("Loading Source Serif 4 italic");

loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] })
  .waitUntilDone()
  .then(() => continueRender(interHandle))
  .catch(() => continueRender(interHandle));

loadSerif("normal", { weights: ["400"], subsets: ["latin"] })
  .waitUntilDone()
  .then(() => continueRender(serifHandle))
  .catch(() => continueRender(serifHandle));

loadSerif("italic", { weights: ["400"], subsets: ["latin"] })
  .waitUntilDone()
  .then(() => continueRender(serifItalicHandle))
  .catch(() => continueRender(serifItalicHandle));
