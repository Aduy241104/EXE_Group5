// src/services/postApi.js
import api from "@/lib/api";

/**
 * Tạo bài đăng (Create Product)
 * BE yêu cầu: multipart/form-data với các field:
 *  - name, price, description, category_id, voucher_code (tùy chọn), image (single)
 *
 * @param {FormData} formData  FormData đã append đúng tên field
 * @param {{ idempotencyKey?: string, onUploadProgress?: (e:ProgressEvent)=>void }} opts
 * @returns {Promise<any>}     Payload sản phẩm vừa tạo
 */
export function createPostFD(formData, opts = {}) {
  const { idempotencyKey, onUploadProgress } = opts;
  const key = idempotencyKey || (crypto?.randomUUID?.() ? crypto.randomUUID() : String(Date.now()));

  return api
    .post("/api/products", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Idempotency-Key": key,
      },
      onUploadProgress,
    })
    .then((r) => r.data);
}

/**
 * (tuỳ chọn) Cập nhật bài đăng (nếu bạn cần ở màn edit)
 * @param {string|number} id
 * @param {FormData} formData  (có thể chứa image mới)
 */
export function updatePostFD(id, formData, opts = {}) {
  const { idempotencyKey } = opts;
  const key = idempotencyKey || (crypto?.randomUUID?.() ? crypto.randomUUID() : String(Date.now()));

  return api
    .put(`/api/products/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Idempotency-Key": key,
      },
    })
    .then((r) => r.data);
}

/** (tuỳ chọn) Lấy danh sách bài đăng của tôi */
export function getMyPosts(params = {}) {
  return api.get("/api/products/mine", { params }).then((r) => r.data);
}

/** (tuỳ chọn) Lấy chi tiết sản phẩm */
export function getProductDetail(id) {
  return api.get(`/api/products/${id}`).then((r) => r.data);
}
