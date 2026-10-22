// Turns the single-file Vite build into a hostable page fragment:
// keeps <title>, metas, <style> and <script>, drops the doctype/html/head/body wrappers
// (the artifact host supplies its own document skeleton).
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("dist-single/index.html", "utf8");
const out = src
  .replace(/<!doctype html>/i, "")
  .replace(/<\/?html[^>]*>/gi, "")
  .replace(/<\/?head>/gi, "")
  .replace(/<\/?body[^>]*>/gi, "")
  .replace(/<meta charset="UTF-8"\s*\/?>/i, "")
  .replace(/<meta name="viewport"[^>]*>/i, "")
  // module scripts are deferred; keep them after #root so DOM order is preserved
  .trim();

// move the title + claude meta to the very top so the host finds them in the first 8KB
const title = out.match(/<title>[\s\S]*?<\/title>/)[0];
const meta = out.match(/<meta name="claude:viewport-fit-sides"[^>]*>/)[0];
const rest = out.replace(title, "").replace(meta, "");
writeFileSync("dist-single/supplychain-ai.html", `${title}\n${meta}\n${rest}\n`);
console.log("wrote dist-single/supplychain-ai.html", (Buffer.byteLength(rest) / 1024).toFixed(0), "KB");
