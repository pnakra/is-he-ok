import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadSerif } from "@remotion/google-fonts/SourceSerif4";

loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
loadSerif("normal", { weights: ["400"], style: "italic", subsets: ["latin"] });
loadSerif("normal", { weights: ["400"], subsets: ["latin"] });
