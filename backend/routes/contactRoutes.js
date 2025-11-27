import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { addContact, getAllContacts, deleteContact } from "../models/contactModel.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();
const recentSenders = new Map();
const SPAM_WINDOW_MS = 10_000;

/* 📨 Gửi liên hệ */
router.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;
  const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  if (!name || !email || !message)
    return res.status(400).json({ message: "Thiếu thông tin liên hệ." });

  const last = recentSenders.get(ip);
  if (last && Date.now() - last < SPAM_WINDOW_MS)
    return res.status(429).json({ message: "Gửi quá nhanh, vui lòng thử lại sau vài giây." });

  recentSenders.set(ip, Date.now());

  try {
    // ✅ Lưu vào database
    const saved = await addContact({ name, email, message });

    // ✅ Gửi mail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // Mail tới admin
    await transporter.sendMail({
      from: `"Liên hệ UniTrade" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_USER,
      subject: `📩 Liên hệ mới từ ${name}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f8ff;padding:25px">
          <div style="max-width:600px;margin:auto;background:white;border-radius:12px;padding:20px;border:1px solid #e0e7ff;">
            <h2 style="color:#2563eb;">📬 Liên hệ mới từ ${name}</h2>
            <p><b>Email:</b> ${email}</p>
            <p><b>Nội dung:</b></p>
            <div style="background:#f9fafb;padding:12px;border-radius:8px;border:1px solid #e5e7eb;margin-top:5px;">
              ${message.replace(/\n/g, "<br>")}
            </div>
            <p style="font-size:13px;color:#6b7280;margin-top:15px;">
              📍 UniTrade - 600 Nguyễn Văn Cừ Nối Dài, An Bình, Bình Thủy, Cần Thơ
            </p>
          </div>
        </div>
      `,
    });

    // Mail phản hồi cho khách
    await transporter.sendMail({
      from: `"UniTrade Support" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "✅ UniTrade đã nhận được liên hệ của bạn",
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f8ff;padding:25px">
          <div style="max-width:600px;margin:auto;background:white;border-radius:12px;padding:25px;border:1px solid #dbeafe;">
            <div style="text-align:center;margin-bottom:15px;">
              <img src="https://i.ibb.co/kMByXrX/logo.png" alt="UniTrade" width="80"/>
              <h2 style="color:#2563eb;">Cảm ơn bạn đã liên hệ UniTrade 💙</h2>
            </div>
            <p style="color:#374151;font-size:15px;">
              Xin chào <b>${name}</b>,<br/>
              Chúng tôi đã nhận được phản hồi của bạn và sẽ liên hệ lại trong vòng <b>24 giờ</b>.
            </p>
            <div style="background:#f9fafb;padding:15px;border-radius:10px;border:1px solid #e5e7eb;margin:15px 0;">
              <b>Nội dung bạn đã gửi:</b><br/>
              <p style="color:#374151;margin-top:5px">${message.replace(/\n/g, "<br>")}</p>
            </div>
            <p style="text-align:center;font-size:13px;color:#6b7280;">
              © ${new Date().getFullYear()} UniTrade. Mọi quyền được bảo lưu.
            </p>
          </div>
        </div>
      `,
    });

    console.log(`✅ Liên hệ mới từ ${name} (${email})`);
    res.json({ success: true, message: "Gửi liên hệ thành công!", contact: saved });
  } catch (err) {
    console.error("❌ Lỗi gửi liên hệ:", err);
    res.status(500).json({ message: "Không thể gửi liên hệ." });
  }
});

/* 📜 Admin xem danh sách liên hệ */
router.get("/admin/contacts", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const list = await getAllContacts();
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Không thể tải danh sách liên hệ." });
  }
});

/* ❌ Admin xóa liên hệ */
router.delete("/admin/contacts/:id", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    await deleteContact(req.params.id);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Không thể xóa liên hệ." });
  }
});

/* 📊 Thống kê số liên hệ theo tuần */
router.get("/admin/contacts/stats", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(created_at, 'IYYY-IW') AS week,
        COUNT(*) AS total
      FROM contacts
      GROUP BY week
      ORDER BY week DESC
      LIMIT 6
    `);
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Không thể lấy thống kê." });
  }
});


export default router;
