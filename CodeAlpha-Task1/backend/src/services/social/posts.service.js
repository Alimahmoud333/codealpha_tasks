import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { USER_ROLES } from "../../utils/constants.js";
import { deleteUpload } from "../../utils/files.js";
import { serializePost } from "../../utils/serializers.js";

/*
 * Counts are computed with sub-queries, so like and comment numbers are always
 * exactly what is stored in MySQL. The FIRST "?" is the viewer's id (for likedByMe).
 */
const POST_SELECT = `
  SELECT p.id, p.content, p.image_url, p.created_at, p.updated_at,
         u.id AS author_id, u.username, u.name AS author_name, u.avatar_url,
         (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) AS like_count,
         (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
         EXISTS(SELECT 1 FROM post_likes me WHERE me.post_id = p.id AND me.user_id = ?) AS liked_by_me
  FROM posts p
  JOIN users u ON u.id = p.user_id`;

/*
 * Feed with cursor ("keyset") pagination: "give me posts older than id X".
 * Unlike OFFSET pages, nothing is skipped or repeated when new posts arrive.
 * scope "following" = posts by people I follow, plus my own.
 */
export async function listPosts(viewerId, { scope, userId, cursor, limit }) {
  const where = [];
  const params = [viewerId];

  if (cursor) {
    where.push("p.id < ?");
    params.push(cursor);
  }

  if (userId) {
    where.push("p.user_id = ?");
    params.push(userId);
  }

  if (scope === "following") {
    where.push("(p.user_id = ? OR p.user_id IN (SELECT f.following_id FROM follows f WHERE f.follower_id = ?))");
    params.push(viewerId, viewerId);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // `limit` is a validated integer. One extra row tells us whether another page exists.
  const [rows] = await pool.execute(`${POST_SELECT} ${whereSql} ORDER BY p.id DESC LIMIT ${limit + 1}`, params);

  const hasMore = rows.length > limit;
  const pageRows = rows.slice(0, limit);

  return {
    items: pageRows.map(serializePost),
    meta: { limit, nextCursor: hasMore ? pageRows[pageRows.length - 1].id : null },
  };
}

export async function getPost(viewerId, postId) {
  const [rows] = await pool.execute(`${POST_SELECT} WHERE p.id = ?`, [viewerId, postId]);

  if (!rows[0]) throw new AppError(404, "Post not found.");
  return serializePost(rows[0]);
}

/* The author is ALWAYS the authenticated user; a userId in the body is never read. */
export async function createPost(user, { content }, imageUrl) {
  const [result] = await pool.execute("INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)", [
    user.id,
    content,
    imageUrl ?? null,
  ]);

  return getPost(user.id, result.insertId);
}

/* Only the author may edit. Not even an admin can edit someone else's words. */
export async function updatePost(user, postId, { content, removeImage }, newImageUrl) {
  const [rows] = await pool.execute("SELECT id, user_id, image_url FROM posts WHERE id = ?", [postId]);

  if (!rows[0]) throw new AppError(404, "Post not found.");
  if (rows[0].user_id !== user.id) throw new AppError(403, "You can only edit your own posts.");

  const oldImage = rows[0].image_url;
  let imageUrl = oldImage;

  if (newImageUrl) imageUrl = newImageUrl;
  else if (removeImage) imageUrl = null;

  await pool.execute("UPDATE posts SET content = ?, image_url = ? WHERE id = ? AND user_id = ?", [
    content,
    imageUrl,
    postId,
    user.id,
  ]);

  if (imageUrl !== oldImage) await deleteUpload(oldImage);

  return getPost(user.id, postId);
}

/* The author or an administrator (moderation) may delete. */
export async function deletePost(user, postId) {
  const [rows] = await pool.execute("SELECT id, user_id, image_url FROM posts WHERE id = ?", [postId]);

  if (!rows[0]) throw new AppError(404, "Post not found.");

  if (rows[0].user_id !== user.id && user.role !== USER_ROLES.ADMIN) {
    throw new AppError(403, "You can only delete your own posts.");
  }

  // Comments and likes are removed by ON DELETE CASCADE.
  await pool.execute("DELETE FROM posts WHERE id = ?", [postId]);
  await deleteUpload(rows[0].image_url);
}
