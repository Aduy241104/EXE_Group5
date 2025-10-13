// fix_frontend_all.mjs
import fs from "fs";
import path from "path";

const FRONTEND_DIR = process.argv[2] || path.resolve("Frontend");
const SRC = path.join(FRONTEND_DIR, "src");

// Những file bạn đã sửa tay, bỏ qua để không đè
const EXCLUDE = new Set([
  path.join(SRC, "components", "layout", "Sidebar.jsx").toLowerCase(),
  path.join(SRC, "components", "product", "ProductGrid.jsx").toLowerCase(),
  path.join(SRC, "context", "AuthContext.jsx").toLowerCase(),
]);

const read = p => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null);
const write = (p, s) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s, "utf8");
};

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (name === "node_modules" || name.startsWith(".")) continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(jsx?|tsx?)$/.test(name)) out.push(p);
  }
  return out;
}

/* ---------- 1) api.js ---------- */
const API_PATH = path.join(SRC, "lib", "api.js");
write(
  API_PATH,
  `import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
});

export default api;
`
);

/* ---------- 2) vite alias ---------- */
const VITE_CFG = path.join(FRONTEND_DIR, "vite.config.js");
write(
  VITE_CFG,
  `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) }
  }
});
`
);

/* ---------- 3) package.json ensure axios ---------- */
const FE_PKG = path.join(FRONTEND_DIR, "package.json");
const fePkg = read(FE_PKG);
const feData = fePkg ? JSON.parse(fePkg) : { name: "unitrade-frontend", private: true, version: "0.0.0" };
feData.dependencies = { ...(feData.dependencies || {}), axios: feData.dependencies?.axios || "^1.7.7" };
write(FE_PKG, JSON.stringify(feData, null, 2));

/* ---------- 4) codemod axios -> api ---------- */
function ensureApiImport(code) {
  // đã có import api?
  if (/from\s+["']@\/lib\/api["']/.test(code)) return code;

  // thay import axios -> api
  let next = code.replace(
    /import\s+axios\s+from\s+["']axios["'];?/g,
    'import api from "@/lib/api";'
  );

  // nếu còn axios.* mà chưa có import api -> chèn vào đầu file (sau dòng 'use client' nếu có)
  if (/axios\./.test(next) && !/from\s+["']@\/lib\/api["']/.test(next)) {
    const lines = next.split(/\r?\n/);
    const insertAt = lines[0].match(/['"]use client['"];?/) ? 1 : 0;
    lines.splice(insertAt, 0, 'import api from "@/lib/api";');
    next = lines.join("\n");
  }

  // đổi axios.* -> api.*
  next = next.replace(/\baxios\./g, "api.");

  // chuẩn hoá import ../lib/api -> @/lib/api
  next = next.replace(
    /from\s+["'](\.\.\/)+lib\/api["']/g,
    'from "@/lib/api"'
  );

  return next;
}

function fixFile(p) {
  if (EXCLUDE.has(p.toLowerCase())) return { p, changed: false, reason: "EXCLUDED" };
  let s = read(p);
  if (!s) return { p, changed: false };

  const orig = s;
  s = ensureApiImport(s);

  // Nếu import axios mà không dùng -> cũng thay
  s = s.replace(/import\s+axios\s+from\s+["']axios["'];?/g, 'import api from "@/lib/api";');

  // normalize CRLF
  if (s !== orig) write(p, s);
  return { p, changed: s !== orig };
}

const files = walk(SRC);
const results = files.map(f => fixFile(f));
const changedCount = results.filter(r => r.changed).length;

/* ---------- 5) Chuẩn hoá AuthContext & consumer ---------- */

function tryFixAuthContext() {
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

    // export function AuthProvider( -> function AuthProvider(
    s = s.replace(/export\s+function\s+AuthProvider\s*\(/, "function AuthProvider(");

    // Nếu chưa có default export -> thêm
    if (!/export\s+default\s+AuthProvider/.test(s) && /function\s+AuthProvider\s*\(/.test(s)) {
      s = s + "\nexport default AuthProvider;\n";
    }
    if (s !== orig) write(p, s);
  }
}

function fixImportAuthProviderIn(file) {
  if (!fs.existsSync(file)) return;
  let s = read(file);
  const orig = s;
  // import { AuthProvider } from "...AuthContext" -> default import
  s = s.replace(
    /import\s*\{\s*AuthProvider\s*\}\s*from\s*["'](@?\/?\.{0,2}\/.*AuthContext)["'];?/,
    'import AuthProvider from "$1";'
  );
  // Ưu tiên alias @/context/AuthContext
  s = s.replace(
    /from\s*["'](\.?\.?\/)+context\/AuthContext["']/,
    'from "@/context/AuthContext"'
  );
  if (s !== orig) write(file, s);
}

tryFixAuthContext();
fixImportAuthProviderIn(path.join(SRC, "App.jsx"));
fixImportAuthProviderIn(path.join(SRC, "main.jsx"));

/* ---------- 6) Báo cáo ---------- */
const report = {
  frontendDir: FRONTEND_DIR,
  totalFiles: files.length,
  changed: changedCount,
  skipped: results.filter(r => r.reason === "EXCLUDED").map(r => r.p),
};
console.log(JSON.stringify(report, null, 2));
