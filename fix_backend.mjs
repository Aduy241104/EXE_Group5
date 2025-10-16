import fs from "fs";
import path from "path";

const root = process.argv[2];
if (!root) { console.error("Usage: node fix_backend.mjs <backend_dir>"); process.exit(1); }

const read = p => fs.existsSync(p) ? fs.readFileSync(p,"utf8") : null;
const write = (p,s) => { fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,s,"utf8"); };

const pkgPath = path.join(root, "package.json");
const pkg = read(pkgPath);
const data = pkg ? JSON.parse(pkg) : { name:"unitrade-backend" };
data.type = "module";
data.scripts = { ...(data.scripts||{}), dev:"nodemon server.js", start:"node server.js" };
data.dependencies = { ...(data.dependencies||{}),
  express:"^4.21.2", cors:"^2.8.5", helmet:"^8.1.0", "express-rate-limit":"^8.1.0",
  "cookie-parser":"^1.4.7", dotenv:"^16.6.1", jsonwebtoken:"^9.0.2", multer:"^2.0.2",
  pg:"^8.16.3", "socket.io":"^4.8.1", zod:"^4.1.12", "express-validator":"^7.2.1", bcrypt:"^6.0.0"
};
delete data.dependencies?.["bcryptjs"];
delete data.dependencies?.["mongoose"];
delete data.dependencies?.["socket.io-client"];
data.devDependencies = { ...(data.devDependencies||{}), nodemon:"^3.1.10" };
write(pkgPath, JSON.stringify(data,null,2));

// server.js – chèn CORS/helmet/body sớm
const serverPath = path.join(root, "server.js");
let server = read(serverPath) || "";
if (server && !/allowedOrigins/.test(server)) {
  server = server.replace(/const app = express\(\);\s*/m, `const app = express();

// ====== CORS (allow FE) ======
const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
  "http://localhost:5173,http://127.0.0.1:55000,http://localhost:5500"
).split(",");

import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const corsOptions = {
  origin(origin, cb) { if (!origin || allowedOrigins.includes(origin)) return cb(null, true); return cb(new Error("Not allowed by CORS")); },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use((req,res,next)=>{ res.header("Vary","Origin"); next(); });

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 500 }));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

`);
  write(serverPath, server);
}

// validators.js → ESM named exports
const valPath = path.join(root, "middleware", "validators.js");
let val = read(valPath);
if (val && (/module\.exports|exports\.|require\(/.test(val))) {
  write(valPath, `import { body, validationResult } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
  const errs = validationResult(req);
  if (errs.isEmpty()) return next();
  return res.status(400).json({ errors: errs.array().map(e => ({ field: e.path, msg: e.msg })) });
};

export const validateRegister = [
  body("email").isEmail(),
  body("password").isString().isLength({ min: 6 }),
  body("username").isString().isLength({ min: 2 }),
  body("phone").isString().notEmpty(),
  handleValidationErrors,
];

export const validateLogin = [
  body("email").isEmail(),
  body("password").isString().notEmpty(),
  handleValidationErrors,
];

export const validateProductCreate = [
  body("name").isString().isLength({ min: 2 }),
  body("price").isFloat({ min: 0 }),
  body("category_id").isInt({ min: 1 }),
  body("description").isString().notEmpty(),
  handleValidationErrors,
];

export const validateProductUpdate = [
  body("name").optional().isString().isLength({ min: 2 }),
  body("price").optional().isFloat({ min: 0 }),
  body("category_id").optional().isInt({ min: 1 }),
  body("description").optional().isString().isLength({ max: 2000 }),
  handleValidationErrors,
];
`);
}

// Quét & sửa: bcryptjs → bcrypt, thêm .js vào import nội bộ, convert require phổ biến
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (name === "node_modules") continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (p.endsWith(".js")) {
      let s = fs.readFileSync(p,"utf8"); let orig = s;
      s = s.replace(/from\s+['"]bcryptjs['"]/g, 'from "bcrypt"');
      s = s.replace(/require\(['"]bcryptjs['"]\)/g, 'require("bcrypt")');
      s = s.replace(/from\s+['"](\.\.?\/[^'"]+)['"]/g, (m, g1) => (g1.endsWith(".js")||g1.endsWith(".json"))? m : m.replace(g1, g1+".js"));
      s = s.replace(/^const\s+\{([^}]+)\}\s*=\s*require\(['"](.+?)['"]\);?/gm, 'import {$1} from "$2";');
      s = s.replace(/^const\s+([A-Za-z0-9_$]+)\s*=\s*require\(['"](.+?)['"]\);?/gm, 'import $1 from "$2";');
      if (s !== orig) fs.writeFileSync(p, s, "utf8");
    }
  }
}
walk(root);
console.log("✔ backend fixed at", root);
