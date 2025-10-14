import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

const BASE_POST_FEE = 10000; // phí đăng 1 bài (đ) — chỉnh theo chính sách của bạn

export default function CreatePost() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    title: "", description: "", price: 0, category: "", quantity: 1,
  });
  const [images, setImages] = useState([]);
  const [voucherCode, setVoucherCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null); // {valid, final_fee, message, voucher}

  const canSubmit = useMemo(() =>
    form.title.trim() && Number(form.price) >= 0 && Number(form.quantity) > 0
  , [form]);

  // Preview phí khi nhập voucher
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!voucherCode) { setCheckResult(null); return; }
      setChecking(true);
      try {
        const { data } = await api.post("/api/vouchers/check", {
          code: voucherCode.trim(),
          context: "post_fee",
          base_fee: BASE_POST_FEE,
        });
        if (!ignore) setCheckResult({ ...data, message: "Áp dụng voucher thành công (preview)." });
      } catch (e) {
        if (!ignore) setCheckResult({ valid: false, message: e?.response?.data?.message || "Voucher không hợp lệ" });
      } finally {
        if (!ignore) setChecking(false);
      }
    })();
    return () => { ignore = true; };
  }, [voucherCode]);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    // 1) tạo bài đăng
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("price", String(form.price));
    fd.append("category", form.category);
    fd.append("quantity", String(form.quantity));
    [...images].forEach((f) => fd.append("images", f));

    const { data } = await api.post("/api/posts/create", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // 2) trừ voucher sau khi tạo thành công (nếu có)
    if (voucherCode) {
      try {
        await api.post("/api/vouchers/apply", {
          code: voucherCode.trim(),
          context: "post_fee",
        });
      } catch (e) {
        // Không chặn flow; chỉ báo cho người dùng
        console.warn("Apply voucher failed", e?.response?.data || e);
      }
    }

    alert("Đăng tin thành công!");
    nav("/posts/my");
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Đăng tin mới</h1>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Tiêu đề</label>
          <input className="w-full border rounded-lg px-3 py-2"
                 value={form.title}
                 onChange={(e)=>setForm(f=>({...f,title:e.target.value}))}/>
        </div>

        <div>
          <label className="block text-sm mb-1">Mô tả</label>
          <textarea className="w-full border rounded-lg px-3 py-2"
                    rows={4}
                    value={form.description}
                    onChange={(e)=>setForm(f=>({...f,description:e.target.value}))}/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Giá (đ)</label>
            <input type="number" min="0"
                   className="w-full border rounded-lg px-3 py-2"
                   value={form.price}
                   onChange={(e)=>setForm(f=>({...f,price:Number(e.target.value)}))}/>
          </div>
          <div>
            <label className="block text-sm mb-1">Số lượng</label>
            <input type="number" min="1"
                   className="w-full border rounded-lg px-3 py-2"
                   value={form.quantity}
                   onChange={(e)=>setForm(f=>({...f,quantity:Number(e.target.value)}))}/>
          </div>
          <div>
            <label className="block text-sm mb-1">Danh mục</label>
            <input className="w-full border rounded-lg px-3 py-2"
                   value={form.category}
                   onChange={(e)=>setForm(f=>({...f,category:e.target.value}))}/>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Hình ảnh (tối đa 6)</label>
          <input type="file" multiple accept="image/*"
                 onChange={(e)=>setImages([...e.target.files].slice(0,6))}
                 className="w-full border rounded-lg px-3 py-2"/>
          {!!images.length && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {Array.from(images).map((f, idx)=>(
                <div key={idx} className="text-xs truncate">{f.name}</div>
              ))}
            </div>
          )}
        </div>

        <div className="border rounded-xl p-3 bg-amber-50">
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <label className="block text-sm mb-1">Voucher (tuỳ chọn)</label>
              <input className="w-full border rounded-lg px-3 py-2"
                     placeholder="Nhập mã voucher"
                     value={voucherCode}
                     onChange={(e)=>setVoucherCode(e.target.value)}/>
            </div>
            <div className="min-w-[180px] text-sm">
              <div>Phí gốc: <b>{BASE_POST_FEE.toLocaleString("vi-VN")} đ</b></div>
              {checking && <div className="text-gray-500">Đang kiểm tra…</div>}
              {checkResult && (
                <div className={checkResult.valid ? "text-green-700" : "text-red-600"}>
                  {checkResult.message}
                  {checkResult.valid && (
                    <div>Phí sau giảm: <b>{Number(checkResult.final_fee).toLocaleString("vi-VN")} đ</b></div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button disabled={!canSubmit}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl disabled:opacity-50">
            Đăng tin
          </button>
        </div>
      </form>
    </div>
  );
}
