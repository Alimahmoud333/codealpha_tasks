import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";

async function assertPostExists(postId) {
  const [rows] = await pool.execute("SELECT id FROM posts WHERE id = ?", [postId]);
  if (!rows[0]) throw new AppError(404, "Post not found.");
}

/* The response always carries the real numbers, so the UI can show the truth. */
async function likeState(postId, userId) {
  const [[{ total }]] = await pool.execute("SELECT COUNT(*) AS total FROM post_likes WHERE post_id = ?", [postId]);
  const [mine] = await pool.execute("SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?", [postId, userId]);

  return { likeCount: Number(total), likedByMe: mine.length > 0 };
}

/*
 * Liking twice is harmless: the composite primary key (post_id, user_id) makes
 * a duplicate row impossible, and ON DUPLICATE KEY turns the second attempt into a no-op.
 */
export async function likePost(userId, postId) {
  await assertPostExists(postId);

  await pool.execute(
    "INSERT INTO post_likes (post_id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE post_id = post_id",
    [postId, userId],
  );

  return likeState(postId, userId);
}

export async function unlikePost(userId, postId) {
  await assertPostExists(postId);

  await pool.execute("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?", [postId, userId]);

  return likeState(postId, userId);
}
