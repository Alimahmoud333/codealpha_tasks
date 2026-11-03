import axios from "axios";
import STORAGE_KEYS from "../constants/storageKeys.js";
import { getStorageItem, removeStorageItem } from "../utils/storage.js";

/*
 * The only place that knows the API address.
 * Every service imports this configured instance instead of calling axios directly.
 */

export const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || "http://localhost:5000").replace(/\/$/, "");

/* Fired when the server rejects a saved token (expired / user removed). AuthContext listens. */
export const AUTH_EXPIRED_EVENT = "auth:expired";

const API = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  timeout: 20000,
  headers: { Accept: "application/json" },
});

API.interceptors.request.use((config) => {
  const token = getStorageItem(STORAGE_KEYS.AUTH_TOKEN);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // For FormData the browser must set the multipart boundary itself.
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginAttempt = error.config?.url?.startsWith("/auth/login");

    if (error.response?.status === 401 && getStorageItem(STORAGE_KEYS.AUTH_TOKEN) && !isLoginAttempt) {
      removeStorageItem(STORAGE_KEYS.AUTH_TOKEN);
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  },
);

/* A readable message for any failed request. */
export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (error.response) {
    return error.response.data?.error?.message || fallback;
  }

  if (error.code === "ECONNABORTED") return "The request took too long. Please try again.";

  return "Cannot reach the server. Check your connection and that the API is running.";
}

/* Per-field messages from a 409/422 response, e.g. { email: "Already registered." } */
export function getFieldErrors(error) {
  const details = error.response?.data?.error?.details;
  const isFieldMap = details && typeof details === "object" && !Array.isArray(details);

  return isFieldMap && [409, 422].includes(error.response.status) ? details : {};
}

export default API;
