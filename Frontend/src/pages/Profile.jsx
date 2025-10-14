import api from "@/lib/api";
import axios from "axios";
import { useContext, useState, useEffect, useMemo } from "react";
import { AuthContext } from "@/context/AuthContext";
import {
  UserRound,
  IdCard,
  GraduationCap,
  Phone,
  MapPin,
  Mail,
  Calendar,
  Pencil,
  X,
  ShieldCheck,
  Store,
  BadgeCheck,
  MailSearch,
  Camera,
  Landmark,
} from "lucide-react";

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

const Field = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/70 border border-gray-100 hover:border-orange-200 transition">
    <div className="mt-0.5 shrink-0 rounded-md bg-orange-50 p-2 text-orange-600">
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p className="font-medium text-gray-900 truncate">{value ?? "-"}</p>
    </div>
  </div>
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

export default function Profile() {
  const { user, token, updateProfile, changePassword } = useContext(AuthContext);

  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState(user || {});
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  // admin tools
  const [searchEmail, setSearchEmail] = useState("");
  const [targetUser, setTargetUser] = useState(null);
  const [newRole, setNewRole] = useState("buyer");
  const [adminMsg, setAdminMsg] = useState("");

  // avatar upload
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

  if (!profile) return <p className="text-center mt-10">Đang tải...</p>;

  const handleUpdateProfile = async () => {
    const ok = await updateProfile(profile);
    if (ok) {
      alert("✅ Thông tin đã được cập nhật!");
      setEditMode(false);
    } else alert("❌ Lỗi khi cập nhật profile");
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) return setMessage("❌ Mật khẩu mới không khớp!");
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

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <img src={avatarSrc} alt="avatar" className="w-14 h-14 rounded-full object-cover border" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">
                Hồ sơ chi tiết
              </h1>
              {role === "admin" && (
                <span title="Tài khoản quản trị" className="text-emerald-600">
                  <ShieldCheck className="w-6 h-6" />
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-1">Quản lý thông tin và bảo mật tài khoản</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RoleBadge role={role} />
          <button
            onClick={() => setEditMode((v) => !v)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              editMode
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-orange-600 hover:bg-orange-700 text-white"
            }`}
          >
            {editMode ? <><X className="w-4 h-4" /> Hủy</> : <><Pencil className="w-4 h-4" /> Chỉnh sửa</>}
          </button>
        </div>
      </div>

      {/* Thông tin cá nhân */}
      <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/40 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100">
          <h2 className="text-lg font-semibold text-gray-800">Thông tin cá nhân</h2>
        </div>

        <div className="p-6">
          {editMode ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "name", label: "Họ và tên", type: "text" },
                { key: "student_id", label: "Mã số sinh viên", type: "text" },
                { key: "school", label: "Trường", type: "text" },
                { key: "phone", label: "Số điện thoại", type: "text" },
                { key: "address", label: "Địa chỉ", type: "text" },
                { key: "bank_account", label: "Số tài khoản", type: "text" },
                { key: "bank_name", label: "Tên ngân hàng", type: "text" },
              ].map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-600">{f.label}</label>
                  <input
                    type={f.type}
                    value={profile[f.key] ?? ""}
                    onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
                    className="w-full rounded-lg border-gray-200 focus:border-orange-400 focus:ring-orange-400"
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
            </div>
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
                className="bg-orange-600 text-white px-4 py-2 rounded-lg disabled:opacity-60"
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

      {/* Bảo mật tài khoản */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm mt-8 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Đổi mật khẩu</h2>
        <div className="space-y-4">
          <input type="password" placeholder="Mật khẩu cũ" value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)} className="w-full rounded-lg border-gray-200 focus:border-orange-400 focus:ring-orange-400" />
          <input type="password" placeholder="Mật khẩu mới" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border-gray-200 focus:border-orange-400 focus:ring-orange-400" />
          <input type="password" placeholder="Xác nhận mật khẩu mới" value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-lg border-gray-200 focus:border-orange-400 focus:ring-orange-400" />
          {message && <p className={`text-sm ${message.includes("✅") ? "text-green-600" : "text-red-500"}`}>{message}</p>}
          <button onClick={handleChangePassword}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2.5 rounded-lg transition">
            Đổi mật khẩu
          </button>
        </div>
      </div>
    </div>
  );
}
