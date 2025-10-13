// src/services/voucherApi.js
import api from "@/lib/api";

export function listMyVouchers() {
  return api.get("/api/my/vouchers").then(r => r.data);
}

export function previewFee({ category_id, voucher_code }) {
  return api.post("/api/my/vouchers/preview", { category_id, voucher_code }).then(r => r.data);
}

/* Admin */
export function adminListVouchers(params = {}) {
  return api.get("/api/vouchers", { params }).then(r => r.data);
}

export function adminCreateVoucher(payload) {
  return api.post("/api/vouchers", payload).then(r => r.data);
}

export function adminUpdateVoucher(id, payload) {
  return api.put(`/api/vouchers/${id}`, payload).then(r => r.data);
}

export function adminDeleteVoucher(id) {
  return api.delete(`/api/vouchers/${id}`).then(r => r.data);
}

export function adminAssignVoucher(id, { seller_id, issued_count }) {
  return api.post(`/api/vouchers/${id}/assign`, { seller_id, issued_count }).then(r => r.data);
}
