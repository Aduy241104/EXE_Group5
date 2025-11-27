// controllers/favorite.controller.js
import {
    toggleFavorite,
    getFavorites,
} from "../services/favorite.service.js";

export const toggleFavoriteController = async (req, res) => {
    try {
        const result = await toggleFavorite(req.user.id, req.params.id);
        return res.json({
            success: true,
            isFavorite: result.isFavorite,
        });
    } catch (err) {
        console.error("toggleFavorite:", err);
        res.status(500).json({ error: "Server error" });
    }
};

export const getFavoritesController = async (req, res) => {
    try {
        const list = await getFavorites(req.user.id);
        res.json(list);
    } catch (err) {
        console.error("getFavorites:", err);
        res.status(500).json({ error: "Server error" });
    }
};
