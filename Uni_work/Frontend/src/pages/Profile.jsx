import api from '../lib/api';
// src/pages/Profile.jsx
import { useContext, useState, useEffect, useMemo } from "react";

import { AuthContext } from "../context/AuthContext";
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
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  if (r === "admin") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-emerald-50 text-emerald-700 border border-emerald-100">
        <BadgeCheck className="w-4 h-4" />
        Admin
      </span>
    );
  }
  if (r === "seller") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-orange-50 text-orange-700 border border-orange-100">
        <Store className="w-4 h-4" />
        Người bán
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-sky-50 text-sky-700 border border-sky-100">
      <UserRound className="w-4 h-4" />
      Người dùng
    </span>
  );
}

export default function Profile() {
  const { user, token, updateProfile, changePassword } = useContext(AuthContext);

  // form/state
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState(user || {});
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  // admin
  const [searchEmail, setSearchEmail] = useState("");
  const [targetUser, setTargetUser] = useState(null);
  const [newRole, setNewRole] = useState("buyer");
  const [adminMsg, setAdminMsg] = useState("");

  // avatar upload
  const [avatarFile, setAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const role = (profile?.role || user?.role || "buyer").toLowerCase();

  useEffect(() => {
    setProfile(user || {});
  }, [user]);

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProfile(res.data))
      .catch((err) => console.error("❌ Lỗi khi lấy user:", err));
  }, [token]);

  const infoLeft = useMemo(
    () => [
      { icon: UserRound, label: "Họ và tên", key: "name" },
      { icon: IdCard, label: "Mã số sinh viên", key: "student_id" },
      { icon: GraduationCap, label: "Trường", key: "school" },
      { icon: Calendar, label: "Tuổi", key: "age" },
    ],
    []
  );
  const infoRight = useMemo(
    () => [
      { icon: Phone, label: "Số điện thoại", key: "phone" },
      { icon: MapPin, label: "Địa chỉ", key: "address" },
      { icon: Mail, label: "Email", key: "email" },
    ],
    []
  );

  if (!profile) {
    return <p className="text-center mt-10">Đang tải...</p>;
  }

  // update profile
  const handleUpdateProfile = async () => {
    const ok = await updateProfile(profile);
    if (ok) {
      alert("✅ Thông tin đã được cập nhật!");
      setEditMode(false);
    } else {
      alert("❌ Lỗi khi cập nhật profile");
    }
  };

  // change password
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage("❌ Mật khẩu mới không khớp!");
      return;
    }
    const ok = await changePassword(oldPassword, newPassword);
    if (ok) {
      setMessage("✅ Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setMessage("❌ Lỗi khi đổi mật khẩu");
    }
  };

  // admin find user
  const adminFindUser = async () => {
    setAdminMsg("");
    setTargetUser(null);
    try {
      const r = await api.get(`${API}/api/users/admin/find`, {
        params: { email: searchEmail.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });
      setTargetUser(r.data);
      setNewRole(r.data.role || "buyer");
    } catch (e) {
      setAdminMsg(e?.response?.data?.error || "Không tìm thấy người dùng");
    }
  };

  // admin update role
  const adminUpdateRole = async () => {
    if (!targetUser?.id) return;
    setAdminMsg("");
    try {
      await api.put(
        `${API}/api/users/role/${targetUser.id}`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAdminMsg("✅ Cập nhật quyền thành công");
      if (targetUser.id === user?.id) {
        const me = await api.get(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(me.data);
      }
    } catch (e) {
      setAdminMsg(e?.response?.data?.error || "❌ Không thể cập nhật role");
    }
  };

  // upload avatar
  const doUploadAvatar = async () => {
    if (!avatarFile) return;
    try {
      setUploadingAvatar(true);
      const fd = new FormData();
      fd.append("avatar", avatarFile);
      const r = await api.put(`${API}/api/users/avatar`, fd, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile((p) => ({ ...p, avatar_url: r.data.user.avatar_url }));
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
    ? profile.avatar_url.startsWith("http")
      ? profile.avatar_url
      : `http://localhost:5000/${profile.avatar_url}`
    : "/default-avatar.png";

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <img
            src={avatarSrc}
            alt="avatar"
            className="w-14 h-14 rounded-full object-cover border"
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">
                Hồ sơ chi tiết
              </h1>
              {role === "admin" && (
                <span
                  title="Tài khoản đã xác thực quyền quản trị"
                  className="text-emerald-600"
                >
                  <ShieldCheck className="w-6 h-6" />
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-1">
              Quản lý thông tin tài khoản và bảo mật của bạn
            </p>
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

      {role === "admin" && (
        <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-800">
          <div className="flex items-start gap-2">
            <BadgeCheck className="w-5 h-5 mt-0.5" />
            <div className="text-sm">
              <b>Quyền quản trị:</b> Bạn có thể tìm người dùng theo email và cập nhật{" "}
              <i>role</i>.
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                  { key: "age", label: "Tuổi", type: "number" },
                  { key: "phone", label: "Số điện thoại", type: "text" },
                  { key: "address", label: "Địa chỉ", type: "text" },
                ].map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-600">
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      value={profile[f.key] ?? ""}
                      onChange={(e) =>
                        setProfile({ ...profile, [f.key]: e.target.value })
                      }
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
                  <Field
                    key={f.key}
                    icon={f.icon}
                    label={f.label}
                    value={profile[f.key]}
                  />
                ))}
                {infoRight.map((f) => (
                  <Field
                    key={f.key}
                    icon={f.icon}
                    label={f.label}
                    value={profile[f.key]}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Upload Avatar */}
          <div className="px-6 pb-6">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h3 className="font-semibold mb-3">Ảnh đại diện</h3>
              <div className="flex flex-wrap items-center gap-3">
                <img
                  src={avatarSrc}
                  alt="avatar-preview"
                  className="w-14 h-14 rounded-full object-cover border"
                />
                <label className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg cursor-pointer">
                  <Camera className="w-4 h-4" />
                  Chọn ảnh
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      setAvatarFile((e.target.files && e.target.files[0]) || null)
                    }
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
                  <span className="text-sm text-gray-500">
                    Đã chọn: <b>{avatarFile.name}</b>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bảo mật tài khoản */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Bảo mật tài khoản</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Đổi mật khẩu định kỳ để bảo vệ tài khoản tốt hơn
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Mật khẩu cũ
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full rounded-lg border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                placeholder="Tối thiểu 8 ký tự"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            {message && (
              <p
                className={`text-sm ${
                  message.includes("✅") ? "text-green-600" : "text-red-500"
                }`}
              >
                {message}
              </p>
            )}

            <button
              onClick={handleChangePassword}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2.5 rounded-lg transition"
            >
              Đổi mật khẩu
            </button>
          </div>
        </div>
      </div>

      {/* Admin section */}
      {role === "admin" && (
        <div className="mt-8 rounded-2xl border border-indigo-100 bg-white shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              Quản trị: Cập nhật quyền người dùng
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600">
                  Email người dùng
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="w-full rounded-lg border-gray-200 focus:border-indigo-400 focus:ring-indigo-400 pr-10"
                    placeholder="vd: user@example.com"
                  />
                  <MailSearch className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <button
                onClick={adminFindUser}
                className="h-[42px] md:self-end bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 rounded-lg"
              >
                Tìm
              </button>
            </div>

            {targetUser && (
              <div className="rounded-lg border p-4 bg-gray-50">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-gray-700">
                    <b>User:</b> {targetUser.email} ({targetUser.username || "—"})
                  </span>
                  <span className="text-sm text-gray-500">/ id: {targetUser.id}</span>
                  <RoleBadge role={targetUser.role} />
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <label className="text-sm text-gray-600">Đổi sang:</label>
                  <select
                    className="rounded-lg border-gray-200"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="buyer">Người mua</option>
                    <option value="seller">Người bán</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    onClick={adminUpdateRole}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Cập nhật
                  </button>
                </div>
              </div>
            )}

            {adminMsg && (
              <p
                className={`text-sm ${
                  adminMsg.startsWith("✅") ? "text-green-600" : "text-red-500"
                }`}
              >
                {adminMsg}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
