import { API_ORIGIN } from "../api/axios.js";

/* The API returns image paths like "/uploads/avatars/x.jpg"; the browser needs the full address. */
export const resolveImageUrl = (url) => {
  if (!url) return null;
  return /^https?:\/\//.test(url) ? url : `${API_ORIGIN}${url}`;
};
