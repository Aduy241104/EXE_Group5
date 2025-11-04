import api from "@/lib/api";
import axios from "axios";
import { useContext, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { AuthContext } from "@/context/AuthContext";
import {
  UserRound,
  IdCard,
  GraduationCap,
  Phone,
  MapPin,
  Mail,
  Pencil,
  X,
  ShieldCheck,
  Store,
  BadgeCheck,
  Camera,
  Landmark,
} from "lucide-react";

/* ---------------- CONFIG ---------------- */
const ENV_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const FALLBACK_PORT = String(import.meta.env.VITE_PORT || "55000");

function getBases() {
  const list = new Set([
    ENV_BASE,
    ENV_BASE.replace("localhost", "127.0.0.1"),
    `http://127.0.0.1:${FALLBACK_PORT}`,
    `http://localhost:${FALLBACK_PORT}`,
  ]);
  return [...list];
}

async function tryMulti({ paths, method = "get", data, headers }) {
  const bases = getBases();
  let lastErr;
  for (const p of paths) {
    for (const b of bases) {
      const url = `${b}${p}`;
      try {
        const res = await axios({ url, method, data, withCredentials: true, headers });
        return res;
      } catch (e) {
        lastErr = e;
        const code = e?.response?.status;
        if (code && code !== 404) throw e;
      }
    }
  }
  throw lastErr || new Error("All endpoints 404");
}

/* ---------------- SMALL COMPONENTS ---------------- */
const Field = ({ icon: Icon, label, value }) => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-blue-300 shadow-sm transition"
  >
    <div className="mt-0.5 shrink-0 rounded-md bg-blue-50 p-2 text-blue-600">
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p className="font-medium text-gray-900 truncate">{value ?? "-"}</p>
    </div>
  </motion.div>
);

function RoleBadge({ role }) {
  const r = (role || "").toLowerCase();
  if (r === "admin")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-emerald-50 text-emerald-700 border border-emerald-100">
        <BadgeCheck className="w-4 h-4" /> Admin
      </span>
    );
  if (r === "seller")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-orange-50 text-orange-700 border border-orange-100">
        <Store className="w-4 h-4" /> Người bán
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-sky-50 text-sky-700 border border-sky-100">
      <UserRound className="w-4 h-4" /> Người dùng
    </span>
  );
}

/* ---------------- MAIN ---------------- */
export default function ProfileInfo() {
  const { user, token, updateProfile, changePassword } = useContext(AuthContext);

  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState(user || {});
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const role = (profile?.role || user?.role || "buyer").toLowerCase();

  useEffect(() => setProfile(user || {}), [user]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await tryMulti({
          paths: ["/api/auth/me", "/api/users/me", "/api/user/me", "/api/me"],
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(r.data);
      } catch (e) {
        console.error("❌ Lỗi khi lấy user:", e?.message || e);
      }
    })();
  }, [token]);

  const infoLeft = useMemo(
    () => [
      { icon: UserRound, label: "Họ và tên", key: "name" },
      { icon: IdCard, label: "Mã số sinh viên", key: "student_id" },
      { icon: GraduationCap, label: "Trường", key: "school" },
      { icon: Landmark, label: "Ngân hàng", key: "bank_name" },
    ],
    []
  );

  const infoRight = useMemo(
    () => [
      { icon: Phone, label: "Số điện thoại", key: "phone" },
      { icon: MapPin, label: "Địa chỉ", key: "address" },
      { icon: Mail, label: "Email", key: "email" },
      { icon: Landmark, label: "Số tài khoản", key: "bank_account" },
    ],
    []
  );

  /* ---------------- ACTIONS ---------------- */
  const handleUpdateProfile = async () => {
    const ok = await updateProfile(profile);
    if (ok) {
      alert("✅ Thông tin đã được cập nhật!");
      setEditMode(false);
    } else alert("❌ Lỗi khi cập nhật profile");
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword)
      return setMessage("❌ Mật khẩu mới không khớp!");
    const ok = await changePassword(oldPassword, newPassword);
    if (ok) {
      setMessage("✅ Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else setMessage("❌ Lỗi khi đổi mật khẩu");
  };

  const doUploadAvatar = async () => {
    if (!avatarFile) return;
    try {
      setUploadingAvatar(true);
      const fd = new FormData();
      fd.append("avatar", avatarFile);
      const r = await tryMulti({
        paths: ["/api/auth/avatar", "/api/users/avatar", "/api/user/avatar"],
        method: "put",
        data: fd,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      const newUrl = r?.data?.user?.avatar_url || r?.data?.avatar_url || r?.data?.avatar;
      setProfile((p) => ({ ...p, avatar_url: newUrl }));
      setAvatarFile(null);
      alert("✅ Cập nhật ảnh đại diện thành công");
    } catch (e) {
      console.error(e);
      alert("❌ Lỗi khi tải ảnh");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const avatarSrc = profile?.avatar_url
    ? (profile.avatar_url.startsWith("http")
        ? profile.avatar_url
        : `${ENV_BASE}/${profile.avatar_url.replace(/^\/+/, "")}`)
    : "/default-avatar.png";

  /* ---------------- UI ---------------- */
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.img
            src={avatarSrc}
            alt="avatar"
            className="w-16 h-16 rounded-full object-cover border-4 border-blue-100 shadow-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-sky-600">
              Hồ sơ cá nhân
            </h1>
            <p className="text-gray-500 mt-1">Quản lý thông tin & bảo mật tài khoản</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RoleBadge role={role} />
          <button
            onClick={() => setEditMode((v) => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              editMode
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow"
            }`}
          >
            {editMode ? (
              <>
                <X className="w-4 h-4" /> Hủy
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4" /> Chỉnh sửa
              </>
            )}
          </button>
        </div>
      </div>

      {/* Thông tin cá nhân */}
      <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-blue-50/30 shadow-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Thông tin cá nhân</h2>
        </div>

        <div className="p-6">
          {editMode ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {[...infoLeft, ...infoRight].map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-600">{f.label}</label>
                  <input
                    type="text"
                    value={profile[f.key] ?? ""}
                    onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
                    className="w-full rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                    placeholder={f.label}
                  />
                </div>
              ))}

              <div className="md:col-span-2">
                <button
                  onClick={handleUpdateProfile}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2.5 rounded-lg transition"
                >
                  Lưu thay đổi
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {infoLeft.map((f) => (
                <Field key={f.key} icon={f.icon} label={f.label} value={profile[f.key]} />
              ))}
              {infoRight.map((f) => (
                <Field key={f.key} icon={f.icon} label={f.label} value={profile[f.key]} />
              ))}
            </div>
          )}
        </div>

        {/* Upload Avatar */}
        <div className="px-6 pb-6">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <h3 className="font-semibold mb-3">Ảnh đại diện</h3>
            <div className="flex flex-wrap items-center gap-3">
              <img src={avatarSrc} alt="avatar-preview" className="w-14 h-14 rounded-full object-cover border" />
              <label className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg cursor-pointer">
                <Camera className="w-4 h-4" /> Chọn ảnh
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setAvatarFile((e.target.files && e.target.files[0]) || null)}
                />
              </label>
              <button
                disabled={!avatarFile || uploadingAvatar}
                onClick={doUploadAvatar}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-60"
              >
                {uploadingAvatar ? "Đang tải..." : "Cập nhật ảnh đại diện"}
              </button>
              {avatarFile && (
                <span className="text-sm text-gray-500">Đã chọn: <b>{avatarFile.name}</b></span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Đổi mật khẩu */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-gray-100 bg-white shadow-sm mt-8 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Đổi mật khẩu</h2>
        <div className="space-y-4">
          <input type="password" placeholder="Mật khẩu cũ" value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)} className="w-full rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400" />
          <input type="password" placeholder="Mật khẩu mới" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400" />
          <input type="password" placeholder="Xác nhận mật khẩu mới" value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400" />
          {message && <p className={`text-sm ${message.includes("✅") ? "text-green-600" : "text-red-500"}`}>{message}</p>}
          <button onClick={handleChangePassword}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg transition">
            Đổi mật khẩu
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
