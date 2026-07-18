import axios from "axios";
import { API_BASE } from "../config/apiConfig";

const api = axios.create({
  baseURL: API_BASE.BASE_URL,
});

api.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    const token = JSON.parse(storedUser).token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle 401 (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Let the caller or a higher-level interceptor handle 401 (do not auto-redirect here)
    if (error.response?.status === 401) {
      console.warn("api.ts: received 401 — letting AuthContext handle refresh");
    }
    return Promise.reject(error);
  }
);

export default api; // 🚨 MUST be here

