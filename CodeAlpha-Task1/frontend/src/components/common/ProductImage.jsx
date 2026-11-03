import { useState } from "react";
import { API_ORIGIN } from "../../api/axios.js";

const PLACEHOLDER = `${API_ORIGIN}/assets/placeholder.svg`;

/* Image URLs from the API are relative ("/assets/..."), so they are prefixed with the API origin. */
const resolve = (url) => (url ? (url.startsWith("http") ? url : `${API_ORIGIN}${url}`) : PLACEHOLDER);

/* Falls back to a local placeholder if the image is missing or fails to load. */
export default function ProductImage({ src, alt = "", className = "" }) {
  const [failed, setFailed] = useState(false);

  return (
    <img
      className={className}
      src={failed ? PLACEHOLDER : resolve(src)}
      alt={alt}
      width="800"
      height="800"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
