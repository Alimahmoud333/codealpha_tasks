import fs from "node:fs/promises";
import path from "node:path";
import env from "../config/env.js";

/*
 * Deletes a file we previously saved under /uploads (avatar, post image...).
 * - Only paths that start with "/uploads/" are touched (never seed assets).
 * - The resolved path must stay inside the uploads folder (blocks "../" tricks).
 * - Failures are ignored: a leftover file must never break an API response.
 */
export async function deleteUpload(urlPath) {
  if (typeof urlPath !== "string" || !urlPath.startsWith("/uploads/")) return;

  const target = path.resolve(env.uploadsDir, urlPath.slice("/uploads/".length));

  if (!target.startsWith(env.uploadsDir + path.sep)) return;

  await fs.unlink(target).catch(() => {});
}
