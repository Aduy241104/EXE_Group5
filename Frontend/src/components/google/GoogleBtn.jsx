import React, { useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import api, { API } from "@/lib/api"; // ✅ dùng axios instance & base URL

const GOOGLE_CLIENT_ID =
    "1085883031350-7ihbulo2h3oure1c75sv8rc939b89rl4.apps.googleusercontent.com";

export default function GoogleBtn() {

    const navigate = useNavigate();
    const { logingg } = useContext(AuthContext);

    useEffect(() => {
        if (window.google) {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
            });

            window.google.accounts.id.renderButton(
                document.getElementById("googleBtn"),
                { theme: "outline", size: "large", text: "signin_with" }
            );
        } else {
            console.error("⚠️ Google script chưa được load. Kiểm tra index.html nhé!");
        }
    }, []);

    const handleCredentialResponse = async (response) => {
        const token = response.credential; // Google ID Token (JWT)

        // 🔹 Giải mã phần payload (không dùng jwt-decode)
        const payload = JSON.parse(atob(token.split(".")[1]));

        console.log("🟢 GOOGLE ID TOKEN:", token);
        console.log("👤 USER INFO:", payload);

        alert(`Xin chào ${payload.name}! Đang gửi thông tin lên server...`);

        try {
            const { data } = await api.post("/api/auth/google", {
              id_token: token,                // ✅ gửi đúng id_token (Google JWT)
              // Nếu BE của bạn đang nhận email/name/picture như cũ, vẫn có thể gửi kèm:
              email: payload.email,
              name: payload.name,
              picture: payload.picture,
            });
            if (data?.token) {
              await logingg(data);           // ✅ đẩy vào AuthContext (giữ logic cũ)
              navigate("/");
            } else {
              alert(`❌ Lỗi: ${data?.error || "Đăng nhập thất bại"}`);
            }
        } catch (err) {
            console.error("❌ Google login error:", err?.response?.data || err);
            alert(err?.response?.data?.error || "Không thể đăng nhập Google");
        }
    };

    return (
        <div
            style={ {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: 50,
            } }
        >
            <div id="googleBtn"></div>
        </div>
    );
}