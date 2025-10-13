// src/hooks/useVouchers.js
import { useEffect, useState } from "react";
import { listMyVouchers, previewFee } from "@/services/voucherApi";

export function useMyVouchers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { items } = await listMyVouchers();
        if (mounted) setItems(items || []);
      } catch (e) {
        setErr(e?.response?.data?.error || "Lỗi tải voucher");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  return { items, loading, err };
}

export function usePreviewFee({ categoryId }) {
  const [voucherCode, setVoucherCode] = useState("");
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function runPreview(code) {
    try {
      setLoading(true);
      setErr(null);
      const data = await previewFee({ category_id: categoryId || null, voucher_code: code || "" });
      setFee(data);
    } catch (e) {
      setErr(e?.response?.data?.error || "Không preview được phí");
      setFee(null);
    } finally {
      setLoading(false);
    }
  }

  return { voucherCode, setVoucherCode, fee, loading, err, runPreview };
}
