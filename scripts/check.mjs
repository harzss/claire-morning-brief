import { access, readFile } from "node:fs/promises";
import worker from "../src/index.js";

const files = [
  "public/index.html",
  "public/2026/index.html",
  "public/2026/08/index.html",
  "public/2026/08/07/index.html",
  "public/2026/08/07/brief.md",
  "public/2026/08/07/og.png",
  "public/2026/08/07/aveiro.png",
  "public/2026/08/07/shootclip.png",
  "data/issues/2026/08/07.json",
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
  "2026.08.07",
  "往期 ↗",
  "今日思考",
  "04 / THINK",
  'grid-template-areas:',
  '"number"',
  '"title"',
  '"note"',
  "white-space: nowrap",
  "flex: 0 0 11px",
  "align-items: start",
  "padding-top: 4px",
  "repo-star",
  "45,744",
  "17,030",
  "22,437",
  "13,564",
  "product-heading",
  "product-icon",
  'src="./aveiro.png"',
  'src="./shootclip.png"',
  "开源项目精选",
  "GitHub Trending + HelloGitHub",
  "Product Hunt 今日精选",
  "10 分钟读完 · 10 条精选",
  "不按榜单照搬",
  "CLAIRE'S MORNING SIGNALS",
  "更新于 2026.08.07 · 榜单数据以发布时为准",
]) {
  if (!html.includes(required)) {
    throw new Error(`Missing required production metadata: ${required}`);
  }
}
for (const forbidden of ["12 分钟读完", "14 条精选", "JabRef/jabref", "Cloudflare OS", "Soloop", "UCP Radar", "玉婷", "GitHub Trending 精选", "HelloGitHub 中文精选", "repo-today", "repo-period", " clicks", "开源雷达", "Product Hunt 今日上榜", "今日延伸选题", "source-strip", "product-mark", ">AV<", ">CF<", "Fri · 07 Aug 2026", "数据截取：2026-08-07 09:57 CST", "CLAIRE'S PARLOR · MORNING SIGNALS · SAMPLE 01", "translateY(-1px)"]) {
  if (html.includes(forbidden)) {
    throw new Error(`Published issue contains forbidden wording or markup: ${forbidden}`);
  }
}

const markdown = await readFile(new URL("../public/2026/08/07/brief.md", import.meta.url), "utf8");
for (const required of ["# CLAIRE'S MORNING SIGNALS · 2026.08.07", "10 分钟读完 · 10 条精选", "## 04 / THINK · 今日思考"]) {
  if (!markdown.includes(required)) throw new Error(`Missing Markdown edition content: ${required}`);
}

const structuredIssue = JSON.parse(await readFile(new URL("../data/issues/2026/08/07.json", import.meta.url), "utf8"));
if (structuredIssue.signals.length !== 4 || structuredIssue.repositories.length !== 4 || structuredIssue.products.length !== 2) {
  throw new Error("Structured issue history must preserve the 4/4/2 ten-item composition");
}

if (!/<section class="section thought-section">[\s\S]*?<div class="section-head">[\s\S]*?04 \/ THINK[\s\S]*?<h2>今日思考<\/h2>[\s\S]*?<aside class="action-box">\s*<p>/u.test(html)) {
  throw new Error("04 / THINK heading must sit outside the thought content card");
}
if (/<aside class="action-box">[\s\S]*?(?:04 \/ THINK|<h2>今日思考<\/h2>)/u.test(html)) {
  throw new Error("Thought card must contain only the topic content");
}
const dedupeKeys = [...structuredIssue.signals, ...structuredIssue.repositories, ...structuredIssue.products].map((item) => item.dedupe_key);
if (dedupeKeys.some((key) => !key) || new Set(dedupeKeys).size !== 10) {
  throw new Error("Structured issue history requires ten unique dedupe keys");
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
