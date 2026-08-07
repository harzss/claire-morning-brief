import { access, readFile } from "node:fs/promises";

const files = [
  "public/2026-08-07/index.html",
  "public/og.png",
  "public/robots.txt",
  "src/index.js",
  "wrangler.jsonc",
];

await Promise.all(files.map((file) => access(new URL(`../${file}`, import.meta.url))));

const html = await readFile(new URL("../public/2026-08-07/index.html", import.meta.url), "utf8");
for (const required of [
  "https://brief.clairesparlor.com/2026-08-07/",
  "https://brief.clairesparlor.com/og.png",
  "noindex,nofollow,noarchive",
]) {
  if (!html.includes(required)) {
    throw new Error(`Missing required production metadata: ${required}`);
  }
}

console.log("brief site check passed");
