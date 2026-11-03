import { useState } from "react";
import { resolveImageUrl } from "../../utils/images.js";

const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

/*
 * Profile picture, or the person's initials on a muted colour when there is none
 * (or the image fails to load). The colour depends on the user id, so it stays the same everywhere.
 * It is decorative: the person's name always appears next to it.
 */
export default function Avatar({ user, size = "md" }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : resolveImageUrl(user.avatarUrl);

  if (src) {
    return <img className={`avatar avatar--${size}`} src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
  }

  return (
    <span className={`avatar avatar--${size} avatar--tone-${Number(user.id) % 5}`} aria-hidden="true">
      {initialsOf(user.name)}
    </span>
  );
}
