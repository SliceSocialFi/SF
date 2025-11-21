// rename-hey-to-slice.js
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const exts = [
  // Core
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",

  // Config & Data
  ".json",
  ".yaml",
  ".yml",

  // Lock files
  ".lock", // cho yarn.lock

  // Styles
  ".css",
  ".scss",
  ".module.css",

  // Docs & Text
  ".md",
  ".mdx",
  ".env"
];
const oldPrefix = "@slice/";
const newPrefix = "@slice/";

function replaceInFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  if (!content.includes(oldPrefix)) return;
  const updated = content.replaceAll(oldPrefix, newPrefix);
  fs.writeFileSync(filePath, updated, "utf8");
  console.log("✅ Updated:", filePath);
}

function walk(dir) {
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Bỏ qua node_modules
      if (item === "node_modules" || item.startsWith(".")) continue;
      walk(fullPath);
    } else if (exts.some((ext) => item.endsWith(ext))) {
      replaceInFile(fullPath);
    }
  }
}

console.log("🚀 Starting rename @slice → @slice ...");
walk(rootDir);
console.log("🎉 Done!");
