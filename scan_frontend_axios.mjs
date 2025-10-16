// scan_frontend_axios.mjs
import fs from "fs";
import path from "path";

const FRONTEND_DIR = process.argv[2] || path.resolve("Frontend");
const SRC = path.join(FRONTEND_DIR, "src");

function walk(dir, out=[]) {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    if (n === "node_modules" || n.startsWith(".")) continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(jsx?|tsx?)$/.test(n)) out.push(p);
  }
  return out;
}

const files = fs.existsSync(SRC) ? walk(SRC) : [];
const hits = [];
for (const f of files) {
  const s = fs.readFileSync(f,"utf8");
  if (/axios\./.test(s) || /import\s+axios\s+from\s+['"]axios['"]/.test(s))
    hits.push(f);
}
console.log("Axios left in:", hits.length);
console.log(hits.join("\n"));
