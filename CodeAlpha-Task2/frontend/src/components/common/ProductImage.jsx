import { useState } from "react";
import { API_ORIGIN } from "../../api/axios.js";
import { resolveImageUrl } from "../../utils/images.js";

const PLACEHOLDER = `${API_ORIGIN}/assets/placeholder.svg`;


/* Falls back to a local placeholder if the image is missing or fails to load. */
export default function ProductImage({ src, alt = "", className = "" }) {
  const [failed, setFailed] = useState(false);

  return (
    <img
      className={className}
      src={failed ? PLACEHOLDER : (resolveImageUrl(src) ?? PLACEHOLDER)}
      alt={alt}
      width="800"
      height="800"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
