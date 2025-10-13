// backend/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  try {
    let token;

    // Ưu tiên header Authorization: Bearer <token>
    const auth = req.headers.authorization || "";
    if (auth.startsWith("Bearer ")) token = auth.slice(7);

    // Nếu không có, thử cookie 'token'
    if (!token && req.cookies?.token) token = req.cookies.token;

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
