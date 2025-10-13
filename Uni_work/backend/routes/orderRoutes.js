import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getBuyerOrders,
  getSellerOrders,
  getOrderById,
  getOrderStats,
  createOrder,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

router.use(authMiddleware);

// Buyer xem đơn của mình
router.get("/buyer", getBuyerOrders);

// Seller xem đơn liên quan sản phẩm của mình
router.get("/seller", getSellerOrders);

// Thống kê cho seller
router.get("/stats", getOrderStats);

// Xem chi tiết đơn
router.get("/:id", getOrderById);

// Tạo đơn hàng (buyer)
router.post("/", createOrder);

// Cập nhật trạng thái đơn (seller/admin)
router.put("/:id/status", updateOrderStatus);

export default router;
