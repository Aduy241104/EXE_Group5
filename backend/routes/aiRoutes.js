// backend/routes/aiRoutes.js
import express from "express";
import pool from "../models/db.js";
import OpenAI from "openai";

const router = express.Router();

/* ==============================
   OPENAI CLIENT (SAFE MODE)
============================== */

const apiKey = process.env.OPENAI_API_KEY;
let openai = null;

if (apiKey) {
    openai = new OpenAI({ apiKey });
    console.log("✅ OpenAI client initialized.");
} else {
    console.warn(
        "⚠️ WARNING: OPENAI_API_KEY is missing. AI freeform pricing will be disabled."
    );
}

/* ==============================
   HELPER: Lấy sản phẩm tương tự trong DB
============================== */

async function getSimilarProductsFromDB(title) {
    if (!title || !title.trim()) return [];

    const q = `%${title.trim()}%`;
    const sql = `
    SELECT id, name, price, category_id
    FROM products
    WHERE (name ILIKE $1 OR description ILIKE $1)
      AND price IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 50
  `;
    const { rows } = await pool.query(sql, [q]);
    return rows
        .map((r) => ({
            id: r.id,
            name: r.name,
            price: Number(r.price),
            category_id: r.category_id,
        }))
        .filter((x) => x.price > 0);
}

/* ==============================
   HELPER: Stats
============================== */

function computeStats(prices) {
    const arr = prices
        .map((p) => Number(p))
        .filter((v) => !Number.isNaN(v) && v > 0)
        .sort((a, b) => a - b);

    if (!arr.length) return null;

    const n = arr.length;
    const min = arr[0];
    const max = arr[n - 1];
    const median =
        n % 2 ? arr[(n - 1) / 2] : (arr[n / 2 - 1] + arr[n / 2]) / 2;

    return { min, max, median, count: n, values: arr };
}

/* ==============================
   🧠 AI Freeform Pricing
============================== */

router.post("/price-freeform", async (req, res) => {
    try {
        // Nếu chưa có key -> không crash server, chỉ trả lỗi 503
        if (!openai) {
            return res.status(503).json({
                error:
                    "AI nâng cao chưa khả dụng: OPENAI_API_KEY chưa được cấu hình trên server.",
            });
        }

        const { title, condition, extra, original_price } = req.body || {};
        const qTitle = String(title || "").trim();

        if (!qTitle) {
            return res.status(400).json({
                error: "Vui lòng nhập tên sản phẩm để AI có thể gợi ý giá.",
            });
        }

        // 1. Lấy dữ liệu tham chiếu từ DB
        const similars = await getSimilarProductsFromDB(qTitle);
        const stats = computeStats(similars.map((s) => s.price));

        // 2. Chuẩn bị context gửi vào AI
        const context = {
            product: {
                title: qTitle,
                condition: condition || "used",
                extra: extra || "",
                original_price: original_price ? Number(original_price) : null,
            },
            local_market: {
                stats: stats || null,
                examples: similars.slice(0, 10),
            },
        };

        // 3. Gọi OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content:
                        "Bạn là trợ lý định giá đồ cũ cho sinh viên Việt Nam. " +
                        "Hãy dựa vào thông tin sản phẩm + dữ liệu tham chiếu để đề xuất khoảng giá bán lại hợp lý. " +
                        "Luôn trả lời JSON với các trường: " +
                        "suggested_price, range_min, range_max, confidence, reason, used_local_data, note_for_student.",
                },
                {
                    role: "user",
                    content:
                        "Đây là dữ liệu sản phẩm & giá tham chiếu:\n" +
                        JSON.stringify(context),
                },
            ],
        });

        let parsed;
        try {
            parsed = JSON.parse(completion.choices[0].message.content || "{}");
        } catch (e) {
            console.error("❌ JSON parse error:", e);
            return res.status(500).json({
                error:
                    "AI trả về dữ liệu không hợp lệ. Vui lòng thử lại (JSON parse error).",
            });
        }

        // 4. Trả kết quả
        return res.json({
            ok: true,
            from: "ai-price-freeform",
            input: context.product,
            local_market: context.local_market,
            ai: parsed,
        });
    } catch (error) {
        console.error("❌ AI freeform error:", error);
        return res.status(500).json({
            error: "Không thể gợi ý giá bằng AI nâng cao lúc này.",
        });
    }
});

export default router;
