import fs from "fs";
import path from "path";

const root = process.argv[2];
if (!root) { console.error("Usage: node fix_frontend.mjs <frontend_dir>"); process.exit(1); }

const read = p => fs.existsSync(p) ? fs.readFileSync(p,"utf8") : null;
const write = (p,s) => { fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,s,"utf8"); };

// api.js
const apiPath = path.join(root, "src", "lib", "api.js");
write(apiPath, `import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
});
export default api;`);

// vite alias
const viteCfg = path.join(root, "vite.config.js");
write(viteCfg, `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } }
});`);

// package.json ensure axios
const pkgPath = path.join(root,"package.json");
const pkg = read(pkgPath);
const data = pkg ? JSON.parse(pkg) : { name:"unitrade-frontend", private:true, version:"0.0.0" };
data.dependencies = { ...(data.dependencies||{}), axios:"^1.7.7" };
write(pkgPath, JSON.stringify(data,null,2));

// Scan & replace axios -> api, inject import when cần
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (name === "node_modules") continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(jsx?|tsx?)$/.test(p)) {
      let s = fs.readFileSync(p,"utf8"); let orig = s;
      s = s.replace(/import\s+axios\s+from\s+['"]axios['"];?/g, 'import api from "@/lib/api";');
      if (/axios\./.test(s) && !/from\s+['"]@\/lib\/api['"]/.test(s)) {
        s = `import api from "@/lib/api";\n` + s;
      }
      s = s.replace(/axios\./g, "api.");
      if (s !== orig) fs.writeFileSync(p, s, "utf8");
    }
  }
}
const src = path.join(root,"src"); if (fs.existsSync(src)) walk(src);

// AuthContext → default export (để import không ngoặc)
function fixAuthContext() {
  function tryFile(p) {
    if (!fs.existsSync(p)) return;
    let s = fs.readFileSync(p,"utf8");
    if (!/export\s+default\s+function\s+AuthProvider/.test(s) && !/export\s+default\s+AuthProvider/.test(s)) {
      const s2 = s.replace(/export\s+function\s+AuthProvider\s*\(/, "function AuthProvider(");
      if (s2 !== s) {
        fs.writeFileSync(p, s2 + "\nexport default AuthProvider;\n", "utf8");
      }
    }
  }
  tryFile(path.join(src, "context", "AuthContext.jsx"));
  tryFile(path.join(src, "contexts", "AuthContext.jsx"));
  tryFile(path.join(src, "context", "AuthContext.js"));
  tryFile(path.join(src, "contexts", "AuthContext.js"));
}
if (fs.existsSync(src)) fixAuthContext();

console.log("✔ frontend fixed at", root);
