import api from "@/lib/api";
const api = api.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
});
export default api;