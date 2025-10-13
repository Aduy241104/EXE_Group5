// src/lib/api.js
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API,
  withCredentials: false,
});

// Gắn token từ localStorage cho mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Nếu 401 thì xoá token để UI tự chuyển trạng thái
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(err);
  }
);

export default api;
export { API };
