import { access, readFile, readdir } from "node:fs/promises";
import worker from "../src/index.js";

const publicDir = new URL("../public/", import.meta.url);

async function directoryNames(path, pattern) {
  const entries = await readdir(path, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory() && pattern.test(entry.name)).map((entry) => entry.name);
}

const issues = [];
for (const year of await directoryNames(publicDir, /^\d{4}$/u)) {
  for (const month of await directoryNames(new URL(`${year}/`, publicDir), /^(?:0[1-9]|1[0-2])$/u)) {
    for (const day of await directoryNames(new URL(`${year}/${month}/`, publicDir), /^(?:0[1-9]|[12]\d|3[01])$/u)) {
      issues.push({ year, month, day, date: `${year}-${month}-${day}`, route: `/${year}/${month}/${day}/` });
    }
  }
}
issues.sort((a, b) => a.date.localeCompare(b.date));
if (!issues.length) throw new Error("No dated issues found");

await Promise.all([
  "public/index.html",
  "public/robots.txt",
  "src/index.js",
  "wrangler.jsonc",
  ...new Set(issues.flatMap(({ year, month }) => [`public/${year}/index.html`, `public/${year}/${month}/index.html`])),
].map((file) => access(new URL(`../${file}`, import.meta.url))));

const archive = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
for (const required of ["晨报档案馆", "noindex,nofollow,noarchive", ...issues.map(({ route }) => `href="${route}"`)]) {
  if (!archive.includes(required)) throw new Error(`Missing required archive content: ${required}`);
}

for (const issue of issues) {
  const issueDirectory = new URL(`../public${issue.route}`, import.meta.url);
  const structuredPath = new URL(`../data/issues/${issue.year}/${issue.month}/${issue.day}.json`, import.meta.url);
  const [html, markdown, structuredIssue] = await Promise.all([
    readFile(new URL("index.html", issueDirectory), "utf8"),
    readFile(new URL("brief.md", issueDirectory), "utf8"),
    readFile(structuredPath, "utf8").then(JSON.parse),
    access(new URL("og.png", issueDirectory)),
  ]);

  const canonical = `https://brief.clairesparlor.com${issue.route}`;
  const displayDate = issue.date.replaceAll("-", ".");
  for (const required of [
    canonical,
    `${canonical}og.png`,
    "noindex,nofollow,noarchive",
    displayDate,
    "往期 ↗",
    "今日思考",
    "04 / THINK",
    "repo-star",
    "product-heading",
    "product-icon",
    "开源项目精选",
    "GitHub Trending + HelloGitHub",
    "Product Hunt 今日精选",
    "10 分钟读完 · 10 条精选",
    "不按榜单照搬",
    `更新于 ${displayDate} · 榜单数据以发布时为准`,
  ]) {
    if (!html.includes(required)) throw new Error(`${issue.date} is missing: ${required}`);
  }
  if (!/CLAIRE(?:'|&#39;)S MORNING SIGNALS/u.test(html)) {
    throw new Error(`${issue.date} is missing the canonical brand name`);
  }

  for (const forbidden of [
    "玉婷",
    "repo-today",
    "repo-period",
    " clicks",
    "开源雷达",
    "今日延伸选题",
    "source-strip",
    "product-mark",
    "数据截取：",
    "CLAIRE'S PARLOR",
    "CLAIRE&#39;S PARLOR",
    "SAMPLE 01",
    "translateY(-1px)",
  ]) {
    if (html.includes(forbidden)) throw new Error(`${issue.date} contains forbidden wording or markup: ${forbidden}`);
  }

  if (!markdown.includes(`# CLAIRE'S MORNING SIGNALS · ${displayDate}`) || !markdown.includes("## 04 / THINK · 今日思考")) {
    throw new Error(`${issue.date} Markdown edition is incomplete`);
  }
  if (structuredIssue.signals.length !== 4 || structuredIssue.repositories.length !== 4 || structuredIssue.products.length !== 2) {
    throw new Error(`${issue.date} must preserve the 4/4/2 ten-item composition`);
  }
  const dedupeKeys = [...structuredIssue.signals, ...structuredIssue.repositories, ...structuredIssue.products].map((item) => item.dedupe_key);
  if (dedupeKeys.some((key) => !key) || new Set(dedupeKeys).size !== 10) {
    throw new Error(`${issue.date} requires ten unique dedupe keys`);
  }
  for (const product of structuredIssue.products) {
    await access(new URL(product.icon.replace(/^\.\//u, ""), issueDirectory));
  }

  if (!/<section class="section thought-section">[\s\S]*?<div class="section-head">[\s\S]*?04 \/ THINK[\s\S]*?<h2>今日思考<\/h2>[\s\S]*?<aside class="action(?:-box)?">\s*<p>/u.test(html)) {
    throw new Error(`${issue.date} must place the 04 / THINK heading outside its card`);
  }
  if (/<aside class="action(?:-box)?">[\s\S]*?(?:04 \/ THINK|<h2>今日思考<\/h2>)/u.test(html)) {
    throw new Error(`${issue.date} thought card must contain only the topic`);
  }

  for (const [legacyPath, expected] of [
    [`/${issue.date}/`, canonical],
    [`/${issue.date}/og.png`, `${canonical}og.png`],
  ]) {
    const response = await worker.fetch(new Request(`https://brief.clairesparlor.com${legacyPath}`), {});
    if (response.status !== 301 || response.headers.get("location") !== expected) {
      throw new Error(`Invalid legacy redirect for ${legacyPath}`);
    }
  }
}

const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
if (!robots.includes("Allow: /")) {
  throw new Error("Link-preview crawlers must be allowed; rely on page-level noindex instead");
}

const workerSource = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
if (!workerSource.includes("Response.redirect") || !workerSource.includes("legacyIssue")) {
  throw new Error("Missing permanent redirect for legacy date URLs");
}

console.log(`brief site check passed for ${issues.length} issues`);
