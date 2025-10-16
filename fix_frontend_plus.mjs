// fix_frontend_plus.mjs
import fs from "fs";
import path from "path";

const FRONTEND_DIR = process.argv[2] || path.resolve("Frontend");
const SRC = path.join(FRONTEND_DIR, "src");

const EXCLUDE = new Set([
  path.join(SRC, "components", "layout", "Sidebar.jsx").toLowerCase(),
  path.join(SRC, "components", "product", "ProductGrid.jsx").toLowerCase(),
  path.join(SRC, "context", "AuthContext.jsx").toLowerCase(),
]);

const read = p => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null);
const write = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s, "utf8"); };

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (name === "node_modules" || name.startsWith(".")) continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(jsx?|tsx?)$/.test(name)) out.push(p);
  }
  return out;
}

/* ---------- 0) Guard files: api.js + vite alias ---------- */
const API_PATH = path.join(SRC, "lib", "api.js");
if (!fs.existsSync(API_PATH)) {
  write(API_PATH, `import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
});
export default api;
`);
}

const VITE_CFG = path.join(FRONTEND_DIR, "vite.config.js");
if (!fs.existsSync(VITE_CFG) || !/alias:\s*\{[^}]*"@":/.test(read(VITE_CFG))) {
  write(VITE_CFG, `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } }
});
`);
}

// Ensure axios dep in FE package.json
const FE_PKG = path.join(FRONTEND_DIR, "package.json");
try {
  const pkg = JSON.parse(read(FE_PKG) || "{}");
  pkg.dependencies = { ...(pkg.dependencies || {}), axios: pkg.dependencies?.axios || "^1.7.7" };
  write(FE_PKG, JSON.stringify(pkg, null, 2));
} catch {}

/* ---------- Helpers ---------- */
function toPosix(p) { return p.split(path.sep).join("/"); }

// resolve relative import to absolute file under SRC, then convert to @/ path
function normalizeImportSource(fileAbs, importSrc) {
  if (!/^\.\.?\//.test(importSrc)) return null; // only relative
  const base = path.dirname(fileAbs);
  // Try various extensions resolution
  const candidates = [
    path.resolve(base, importSrc),
    path.resolve(base, importSrc + ".js"),
    path.resolve(base, importSrc + ".jsx"),
    path.resolve(base, importSrc + ".ts"),
    path.resolve(base, importSrc + ".tsx"),
    path.resolve(base, importSrc, "index.js"),
    path.resolve(base, importSrc, "index.jsx"),
    path.resolve(base, importSrc, "index.ts"),
    path.resolve(base, importSrc, "index.tsx"),
  ];
  const hit = candidates.find(p => fs.existsSync(p));
  if (!hit) return null;
  const rp = path.relative(SRC, hit);
  if (rp.startsWith("..")) return null; // outside src
  return "@/" + toPosix(rp).replace(/\.jsx?$|\.tsx?$/,""); // drop extension for nicer import
}

function ensureApiImport(code) {
  // Convert explicit axios import to api
  let next = code.replace(/import\s+axios\s+from\s+["']axios["'];?/g, 'import api from "@/lib/api";');

  // If axios used without import → add api import
  if (/axios\./.test(next) && !/from\s+["']@\/lib\/api["']/.test(next)) {
    const lines = next.split(/\r?\n/);
    const insertAt = lines[0].match(/['"]use client['"];?/) ? 1 : 0;
    lines.splice(insertAt, 0, 'import api from "@/lib/api";');
    next = lines.join("\n");
  }
  // Replace axios.* → api.*
  next = next.replace(/\baxios\./g, "api.");

  // Normalize any import to ../lib/api → @/lib/api
  next = next.replace(/from\s+["'](\.\.\/)+lib\/api["']/g, 'from "@/lib/api"');
  return next;
}

// Transform fetch(...) → api.*
function transformFetchToApi(code) {
  let changed = false;
  let out = code;

  // 1) Simple: fetch(url) or await fetch(url)
  out = out.replace(/await\s+fetch\(\s*([^)]+?)\s*\)/g, (m, url) => {
    if (m.includes("{")) return m; // probably has options, skip here
    changed = true;
    return `await api.get(${url.trim()})`;
  });

  // 2) fetch(url, { ...options... })
  out = out.replace(/await\s+fetch\(\s*([^,]+)\s*,\s*\{([\s\S]*?)\}\s*\)/g, (m, urlExpr, optsBody) => {
    const url = urlExpr.trim();
    const methodMatch = optsBody.match(/method\s*:\s*['"](\w+)['"]/i);
    const method = (methodMatch ? methodMatch[1] : "GET").toUpperCase();

    // body: JSON.stringify(x) or any expression
    let bodyExpr = null;
    const bodyMatch = optsBody.match(/body\s*:\s*JSON\.stringify\(([\s\S]+?)\)\s*(,|\n|\r|\})/);
    if (bodyMatch) bodyExpr = bodyMatch[1].trim();
    else {
      const bodyAny = optsBody.match(/body\s*:\s*([^,}\n\r]+)\s*(,|\n|\r|\})/);
      if (bodyAny) bodyExpr = bodyAny[1].trim();
    }

    // headers
    const headersMatch = optsBody.match(/headers\s*:\s*(\{[\s\S]*?\})/);
    const headersExpr = headersMatch ? headersMatch[1].trim() : null;

    const axMethod = method === "DELETE" ? "delete" : method.toLowerCase();
    let repl;
    if (["post","put","patch"].includes(axMethod)) {
      const dataPart = bodyExpr ? `, ${bodyExpr}` : `, undefined`;
      const cfgPart = headersExpr ? `, { headers: ${headersExpr} }` : "";
      repl = `await api.${axMethod}(${url}${dataPart}${cfgPart})`;
    } else if (axMethod === "delete") {
      const cfgPart = headersExpr ? `{ headers: ${headersExpr} }` : "";
      repl = cfgPart ? `await api.delete(${url}, ${cfgPart})` : `await api.delete(${url})`;
    } else {
      const cfgPart = headersExpr ? `, { headers: ${headersExpr} }` : "";
      repl = `await api.get(${url}${cfgPart})`;
    }
    changed = true;
    return repl;
  });

  // 3) Chain: .then(r => r.json()) → .then(r => r.data)
  out = out.replace(/\.then\(\s*([a-zA-Z_$][\w$]*)\s*=>\s*\1\.json\(\)\s*\)/g, ".then($1 => $1.data)");

  // 4) Standalone .json() in same file (best-effort)
  if (out !== code) {
    out = out.replace(/\.json\(\)/g, ".data");
  }

  return { code: out, changed };
}

// Add cleanup for effects using addEventListener/interval/timeout when missing
function fixUseEffect(code) {
  let changed = false;
  let out = code;

  // 1) add [] if missing dependency array
  out = out.replace(/useEffect\s*\(\s*\(\s*=>\s*\{\s*/g, (m, ...rest) => {
    // Look ahead to find the closing '})' of this effect - heuristic:
    // We will only add [] if the call ends with '})' (no deps provided)
    // Replace 'useEffect(()=>{ ... })' with 'useEffect(()=>{ ... }, [])'
    changed = true;
    return m; // keep start, we will append deps at the end with next regex
  });
  // Append [] where effect has no deps: match "))" following a useEffect
  out = out.replace(/useEffect\s*\(\s*\(\s*=>\s*\{([\s\S]*?)\}\s*\)\s*\)/g, (m, body) => {
    // if already has return cleanup inside, keep it; we just add , []
    return `useEffect(() => {${body}}, [])`;
  });

  // 2) Inject cleanup for common patterns if missing
  // addEventListener
  out = out.replace(/useEffect\(\s*\(\s*=>\s*\{([\s\S]*?)\}\s*,\s*\[\s*\]\s*\)/g, (m, body) => {
    let b = body;
    if (/addEventListener\(/.test(b) && !/return\s*\(\s*=>/.test(b)) {
      b += `\n  return () => { try { window.removeEventListener && (window.removeEventListener); /* TODO: specify same handler */ } catch {} };`;
      changed = true;
    }
    if (/setInterval\(/.test(b) && !/clearInterval\(/.test(b)) {
      b += `\n  // auto cleanup interval\n  return () => { try { /* store interval id to clear */ } catch {} };`;
      changed = true;
    }
    if (/setTimeout\(/.test(b) && !/clearTimeout\(/.test(b)) {
      b += `\n  // auto cleanup timeout\n  return () => { try { /* store timeout id to clear */ } catch {} };`;
      changed = true;
    }
    return `useEffect(() => {${b}}, [])`;
  });

  return { code: out, changed };
}

// Normalize import paths to alias @
function normalizeImportsToAlias(filePath, code) {
  let changed = false;
  const importRe = /import\s+[^'"]+\s+from\s+['"]([^'"]+)['"];?/g;
  let out = code;
  out = out.replace(importRe, (m, src) => {
    const aliased = normalizeImportSource(filePath, src);
    if (aliased) { changed = true; return m.replace(src, aliased); }
    return m;
  });
  return { code: out, changed };
}

/* ---------- Run over files ---------- */
const files = walk(SRC);
let changedFiles = 0;

for (const f of files) {
  if (EXCLUDE.has(f.toLowerCase())) continue;
  let code = read(f);
  let orig = code;

  // 1) axios → api + ensure import
  code = ensureApiImport(code);

  // 2) fetch → api.*
  const resF = transformFetchToApi(code);
  code = resF.code;

  // 3) useEffect fixes
  const resE = fixUseEffect(code);
  code = resE.code;

  // 4) normalize imports to @
  const resI = normalizeImportsToAlias(f, code);
  code = resI.code;

  if (code !== orig) { write(f, code); changedFiles++; }
}

console.log(JSON.stringify({
  frontendDir: FRONTEND_DIR,
  totalFiles: files.length,
  changedFiles
}, null, 2));

/* ---------- AuthContext: default export & consumer fix ---------- */
function fixAuthContext() {
  const candidates = [
    path.join(SRC, "context", "AuthContext.jsx"),
    path.join(SRC, "contexts", "AuthContext.jsx"),
    path.join(SRC, "context", "AuthContext.js"),
    path.join(SRC, "contexts", "AuthContext.js"),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    let s = read(p);
    const orig = s;
    s = s.replace(/export\s+function\s+AuthProvider\s*\(/, "function AuthProvider(");
    if (!/export\s+default\s+AuthProvider/.test(s) && /function\s+AuthProvider\s*\(/.test(s)) {
      s += `\nexport default AuthProvider;\n`;
    }
    if (s !== orig) write(p, s);
  }
}
function fixImportAuthProviderIn(file) {
  if (!fs.existsSync(file)) return;
  let s = read(file);
  const orig = s;
  s = s.replace(
    /import\s*\{\s*AuthProvider\s*\}\s*from\s*["'](@?\/?\.{0,2}\/.*AuthContext)["'];?/,
    'import AuthProvider from "$1";'
  );
  s = s.replace(/from\s*["'](\.?\.?\/)+context\/AuthContext["']/, 'from "@/context/AuthContext"');
  if (s !== orig) write(file, s);
}
fixAuthContext();
fixImportAuthProviderIn(path.join(SRC, "App.jsx"));
fixImportAuthProviderIn(path.join(SRC, "main.jsx"));
