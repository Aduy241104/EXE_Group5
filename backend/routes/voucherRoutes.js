// backend/routes/voucherRoutes.js (ESM)
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import {
  adminCreateVoucher,
  adminUpdateVoucher,
  adminDeleteVoucher,
  assignVoucher,
  listVouchersAdmin,
  getVoucherRedemptions,
  listMyVouchers,
} from "../repositories/voucherRepo.js";
import { computeFeeForSeller } from "../services/feeService.js";

const router = express.Router();

/* ===== Admin ===== */
router.post("/api/vouchers", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const payload = { ...req.body, created_by: req.user.id };
    const row = await adminCreateVoucher(payload);
    res.status(201).json(row);
  } catch (e) {
    console.error("POST /api/vouchers", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/api/vouchers/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const row = await adminUpdateVoucher(req.params.id, req.body);
    res.json(row);
  } catch (e) {
    console.error("PUT /api/vouchers/:id", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/api/vouchers/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await adminDeleteVoucher(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/vouchers/:id", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/api/vouchers/:id/assign", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { seller_id, issued_count = 1 } = req.body || {};
    await assignVoucher(Number(req.params.id), seller_id, issued_count);
    res.json({ ok: true });
  } catch (e) {
    console.error("POST /api/vouchers/:id/assign", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/api/vouchers", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const items = await listVouchersAdmin({
      q: req.query.q || "",
      active: req.query.active === undefined ? undefined : req.query.active === "true",
      type: req.query.type || undefined,
      date_from: req.query.date_from || undefined,
      date_to: req.query.date_to || undefined,
    });
    res.json({ items });
  } catch (e) {
    console.error("GET /api/vouchers", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/api/vouchers/:id/redemptions", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const items = await getVoucherRedemptions(req.params.id);
    res.json({ items });
  } catch (e) {
    console.error("GET /api/vouchers/:id/redemptions", e);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===== Seller ===== */
router.get("/api/my/vouchers", authMiddleware, async (req, res) => {
  try {
    const items = await listMyVouchers(req.user.id);
    // Tùy chọn: tính remaining_for_seller bằng cách đếm redemptions hiện tại
    res.json({ items });
  } catch (e) {
    console.error("GET /api/my/vouchers", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/api/my/vouchers/preview", authMiddleware, async (req, res) => {
  try {
    const { category_id: categoryId, voucher_code: voucherCode } = req.body || {};
    const result = await computeFeeForSeller({
      sellerId: req.user.id,
      categoryId,
      voucherCode,
    });
    res.json(result);
  } catch (e) {
    console.error("POST /api/my/vouchers/preview", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
