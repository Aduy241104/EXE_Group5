import { useContext, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "@/context/AuthContext";
import api from "@/lib/api";
import {
  MapPin, Pencil, Trash2, Plus, Loader2, Save, X, Home, CheckCircle2,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";

export default function ProfileAddress() {
  const { user } = useContext(AuthContext);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState({ show: false, id: null });

  // Load danh sách địa chỉ
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const { data } = await api.get(`/api/users/${user.id}/addresses`);
        setAddresses(Array.isArray(data) ? data : data.items || []);
      } catch (err) {
        console.error(err);
        setToast({ type: "error", message: "Không thể tải danh sách địa chỉ." });
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const resetForm = () => {
    setForm({ name: "", phone: "", address: "" });
    setEditing(null);
  };

  const handleEdit = (a) => {
    setEditing(a.id);
    setForm({ name: a.full_name || a.name, phone: a.phone, address: a.address_line || a.address });
  };

  const handleSave = async () => {
    if (!form.name || !form.address) {
      return setToast({ type: "error", message: "Vui lòng nhập đầy đủ thông tin." });
    }
    try {
      setSending(true);
      let res;
      if (editing && editing !== "new") {
        res = await api.put(`/api/addresses/${editing}`, form);
        setAddresses((prev) => prev.map((a) => (a.id === editing ? res.data : a)));
        setToast({ type: "success", message: "Đã cập nhật địa chỉ!" });
      } else {
        res = await api.post(`/api/addresses`, form);
        setAddresses((prev) => [res.data, ...prev]);
        setToast({ type: "success", message: "Đã thêm địa chỉ mới!" });
      }
      resetForm();
    } catch {
      setToast({ type: "error", message: "Không thể lưu địa chỉ." });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConfirm = (id) => setConfirm({ show: true, id });
  const handleDelete = async () => {
    try {
      await api.delete(`/api/addresses/${confirm.id}`);
      setAddresses((prev) => prev.filter((x) => x.id !== confirm.id));
      setToast({ type: "success", message: "Đã xoá địa chỉ!" });
    } catch {
      setToast({ type: "error", message: "Không thể xoá địa chỉ." });
    } finally {
      setConfirm({ show: false, id: null });
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/api/addresses/${id}/default`);
      setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
      setToast({ type: "success", message: "Đặt làm mặc định thành công!" });
    } catch {
      setToast({ type: "error", message: "Không thể đặt mặc định." });
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Đang tải địa chỉ...
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Địa chỉ giao hàng</h1>
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition"
        >
          <Plus className="w-4 h-4" /> Thêm địa chỉ
        </button>
      </div>

      {/* Form nhập */}
      <AnimatePresence>
        {(editing === "new" || editing !== null) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border border-blue-100 bg-blue-50/60 p-4 rounded-xl mb-6 shadow-sm"
          >
            <h2 className="font-semibold mb-3 text-blue-700">
              {editing ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
            </h2>
            <div className="grid md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Tên người nhận"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              />
              <input
                type="text"
                placeholder="Số điện thoại"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400"
              />
              <input
                type="text"
                placeholder="Địa chỉ chi tiết"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400 md:col-span-3"
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={resetForm}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg"
              >
                <X className="w-4 h-4" /> Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={sending}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-60"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Danh sách địa chỉ */}
      {addresses.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-20">Chưa có địa chỉ nào. Hãy thêm địa chỉ mới!</p>
      ) : (
        <motion.div layout className="grid md:grid-cols-2 gap-4">
          <AnimatePresence>
            {addresses.map((a) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`relative border rounded-xl p-5 shadow-sm hover:shadow-md transition bg-white ${
                  a.is_default ? "ring-2 ring-blue-500 border-blue-200" : "border-gray-100"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" /> {a.full_name || a.name}
                    {a.is_default && (
                      <span className="flex items-center gap-1 text-blue-600 text-xs font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                        <Home className="w-3 h-3" /> Mặc định
                      </span>
                    )}
                  </h3>
                  <div className="flex gap-2">
                    {!a.is_default && (
                      <button
                        onClick={() => handleSetDefault(a.id)}
                        className="text-green-600 hover:text-green-700 transition"
                        title="Đặt làm mặc định"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleEdit(a)} className="text-blue-600 hover:text-blue-700 transition">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteConfirm(a.id)}
                      className="text-red-600 hover:text-red-700 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">{a.address_line || a.address}</p>
                {a.phone && <p className="text-gray-500 text-sm mt-1">📞 {a.phone}</p>}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal & Toast */}
      <ConfirmModal
        show={confirm.show}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ show: false, id: null })}
        title="Xóa địa chỉ"
        message="Bạn có chắc chắn muốn xóa địa chỉ này không?"
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </motion.div>
  );
}
