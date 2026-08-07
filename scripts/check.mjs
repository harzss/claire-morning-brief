import { access, readFile } from "node:fs/promises";
import worker from "../src/index.js";

const files = [
  "public/index.html",
  "public/2026/index.html",
  "public/2026/08/index.html",
  "public/2026/08/07/index.html",
  "public/2026/08/07/og.png",
  "public/robots.txt",
  "src/index.js",
  "wrangler.jsonc",
];

await Promise.all(files.map((file) => access(new URL(`../${file}`, import.meta.url))));

const archive = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
for (const required of [
  "晨报档案馆",
  "https://brief.clairesparlor.com/2026/08/07/",
  "href=\"/2026/\"",
  "href=\"/2026/08/\"",
  "AI 不再只争谁会聊天",
  "noindex,nofollow,noarchive",
]) {
  if (!archive.includes(required)) {
    throw new Error(`Missing required archive content: ${required}`);
  }
}

const yearArchive = await readFile(new URL("../public/2026/index.html", import.meta.url), "utf8");
const monthArchive = await readFile(new URL("../public/2026/08/index.html", import.meta.url), "utf8");
if (!yearArchive.includes("2026 年归档") || !yearArchive.includes("/2026/08/")) {
  throw new Error("Year archive is incomplete");
}
if (!monthArchive.includes("2026 年 8 月") || !monthArchive.includes("/2026/08/07/")) {
  throw new Error("Month archive is incomplete");
}

const html = await readFile(new URL("../public/2026/08/07/index.html", import.meta.url), "utf8");
for (const required of [
  "https://brief.clairesparlor.com/2026/08/07/",
  "https://brief.clairesparlor.com/2026/08/07/og.png",
  "noindex,nofollow,noarchive",
  "全部往期",
  "今日延伸选题",
]) {
  if (!html.includes(required)) {
    throw new Error(`Missing required production metadata: ${required}`);
  }
}
if (html.includes("玉婷")) {
  throw new Error("Published issue contains reader-private wording");
}

const workerSource = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
if (!workerSource.includes("Response.redirect") || !workerSource.includes("legacyIssue")) {
  throw new Error("Missing permanent redirect for legacy date URLs");
}

for (const [legacyPath, expected] of [
  ["/2026-08-07/", "https://brief.clairesparlor.com/2026/08/07/"],
  ["/2026-08-07/og.png", "https://brief.clairesparlor.com/2026/08/07/og.png"],
]) {
  const response = await worker.fetch(new Request(`https://brief.clairesparlor.com${legacyPath}`), {});
  if (response.status !== 301 || response.headers.get("location") !== expected) {
    throw new Error(`Invalid legacy redirect for ${legacyPath}`);
  }
}

const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
if (!robots.includes("Allow: /")) {
  throw new Error("Link-preview crawlers must be allowed; rely on the page-level noindex directive instead");
}

console.log("brief site check passed");
