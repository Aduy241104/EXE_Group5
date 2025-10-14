import { API } from "@/lib/api";
const ABS = /^https?:\/\//i;

export function buildImg(raw) {
  if (!raw) return "/logo.png";
  if (ABS.test(raw)) return raw;
  if (raw.startsWith("/uploads/")) return `${API}${raw}`;
  if (raw.startsWith("uploads/")) return `${API}/${raw}`;
  if (!raw.startsWith("/")) return `${API}/uploads/${raw}`;
  return `${API}${raw}`;
}
