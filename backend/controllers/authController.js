// backend/controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../models/db.js";
import dotenv from "dotenv";

dotenv.config();

// LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: "Email không tồn tại" });
    }
    const user = userRes.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Sai mật khẩu" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi hệ thống khi đăng nhập:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
};

// REGISTER
export const register = async (req, res) => {
  const { email, password, username, phone } = req.body;
  if (!email || !password || !username || !phone) {
    return res.status(400).json({ error: "Thiếu thông tin đăng ký" });
  }

  try {
    const userRes = await pool.query("SELECT 1 FROM users WHERE email = $1", [email]);
    if (userRes.rows.length > 0) {
      return res.status(400).json({ error: "Email đã được sử dụng" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      "INSERT INTO users (email, password, username, phone) VALUES ($1, $2, $3, $4) RETURNING id, email, username, phone",
      [email, hashedPassword, username, phone]
    );

    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    return res.status(201).json({
      token,
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error("❌ Lỗi hệ thống khi đăng ký:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
};



export const loginWithGoogle = async (req, res) => {
  try {
    const { email, name, picture } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Thiếu email người dùng Google" });
    }

    // Kiểm tra user đã tồn tại chưa
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    let user;

    if (userRes.rows.length === 0) {
      // Nếu chưa có user -> tạo mới
      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
      const username = email.split("@")[0];

      const newUserRes = await pool.query(
        `INSERT INTO users (email, password, username, full_name, avatar_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, username, full_name, avatar_url`,
        [email, randomPassword, username, name, picture]
      );

      user = newUserRes.rows[0];
    } else {
      // Nếu đã có user -> đăng nhập
      user = userRes.rows[0];
    }

    // Tạo token riêng của bạn
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error("❌ Lỗi khi đăng nhập Google:", error.message);
    return res.status(500).json({ error: "Server error" });
  }
};