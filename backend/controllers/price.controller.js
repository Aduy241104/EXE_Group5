// controllers/price.controller.js
import {
    suggestPrice,
    marketPrice,
    priceRange,
} from "../services/price.service.js";

export const suggestPriceController = async (req, res) => {
    try {
        const data = await suggestPrice(req.body);
        res.json(data);
    } catch (err) {
        console.error("suggestPrice:", err);
        res.status(500).json({ error: "Không thể gợi ý giá lúc này" });
    }
};

export const marketPriceController = async (req, res) => {
    try {
        const data = await marketPrice(req.body);
        res.json(data);
    } catch (err) {
        console.error("price-from-market:", err);
        res.status(500).json({ error: "Không thể lấy giá thị trường" });
    }
};

export const priceRangeController = async (req, res) => {
    try {
        const months = req.query.months || 3;
        const data = await priceRange(req.params.id, months);
        res.json(data);
    } catch (err) {
        console.error("price-range:", err);
        res.status(500).json({ error: "Server error" });
    }
};
