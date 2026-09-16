// Builds a single self-contained holding page (fonts and icon inlined) at
// holding/heywire-holding.html, for hosts other than Railway. Run after `npm run build`.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const html = readFileSync("dist/soon/index.html", "utf8");
const b64 = (p) => readFileSync(p).toString("base64");

let out = html
  .replace('url("/assets/fonts/Archivo-Regular.ttf")', `url("data:font/ttf;base64,${b64("src/assets/fonts/Archivo-Regular.ttf")}")`)
  .replace('url("/assets/fonts/Archivo-Medium.ttf")', `url("data:font/ttf;base64,${b64("src/assets/fonts/Archivo-Medium.ttf")}")`)
  .replace('url("/assets/fonts/Archivo-Black.ttf")', `url("data:font/ttf;base64,${b64("src/assets/fonts/Archivo-Black.ttf")}")`)
  .replace('<link rel="icon" href="/favicon.ico" sizes="any">\n', "")
  .replace('href="/assets/icons/heywire-app-icon.svg"', `href="data:image/svg+xml;base64,${b64("src/assets/icons/heywire-app-icon.svg")}"`)
  .replace('href="/assets/icons/heywire-app-icon-180.png"', `href="data:image/png;base64,${b64("src/assets/icons/heywire-app-icon-180.png")}"`);

mkdirSync("holding", { recursive: true });
writeFileSync("holding/heywire-holding.html", out);
console.log(`holding/heywire-holding.html (${Math.round(out.length / 1024)} KB)`);
