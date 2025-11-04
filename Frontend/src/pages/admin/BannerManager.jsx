import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Upload } from "lucide-react";

const API = import.meta.env.VITE_API || "http://localhost:5000";

export default function BannerManager() {
  const [banners, setBanners] = useState([]);
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchBanners = async () => {
    const res = await fetch(`${API}/api/banner`);
    setBanners(await res.json());
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.append("image", file);
    form.append("link", link);
    form.append("active", "true");

    await fetch(`${API}/api/banner/upload`, { method: "POST", body: form });
    setFile(null);
    setLink("");
    setLoading(false);
    fetchBanners();
  };

  const handleDelete = async (id) => {
    await fetch(`${API}/api/banner/${id}`, { method: "DELETE" });
    fetchBanners();
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800">🖼️ Quản lý Banner</h2>
      </header>

      {/* Upload form */}
      <motion.form
        onSubmit={handleUpload}
        className="flex flex-wrap gap-4 items-center bg-white/60 p-5 rounded-2xl shadow-sm border border-slate-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-none file:bg-blue-600 file:text-white file:cursor-pointer file:hover:bg-blue-700"
          required
        />
        <input
          type="text"
          placeholder="Link khi nhấn vào banner"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          <Upload size={18} />
          {loading ? "Đang tải..." : "Tải lên"}
        </button>
      </motion.form>

      {/* Banner grid */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {banners.map((b, i) => (
          <motion.div
            key={b.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
            className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition-all"
          >
            <img
              src={`${API}${b.image_url}`}
              alt="banner"
              className="w-full h-40 object-cover"
            />
            <div className="p-3 flex justify-between items-center">
              <a
                href={b.link}
                target="_blank"
                className="text-blue-600 text-sm truncate hover:underline"
              >
                {b.link || "(Không có link)"}
              </a>
              <button
                onClick={() => handleDelete(b.id)}
                className="text-red-500 hover:text-red-600"
                title="Xóa banner"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
