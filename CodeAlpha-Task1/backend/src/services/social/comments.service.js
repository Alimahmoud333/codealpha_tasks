import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { USER_ROLES } from "../../utils/constants.js";
import { serializeComment } from "../../utils/serializers.js";

const COMMENT_SELECT = `
  SELECT c.id, c.post_id, c.content, c.created_at, c.updated_at,
         u.id AS author_id, u.username, u.name AS author_name, u.avatar_url
  FROM comments c
  JOIN users u ON u.id = c.user_id`;

async function assertPostExists(postId) {
  const [rows] = await pool.execute("SELECT id FROM posts WHERE id = ?", [postId]);
  if (!rows[0]) throw new AppError(404, "Post not found.");
}

async function countComments(postId) {
  const [[{ total }]] = await pool.execute("SELECT COUNT(*) AS total FROM comments WHERE post_id = ?", [postId]);
  return Number(total);
}

async function loadComment(commentId) {
  const [rows] = await pool.execute(`${COMMENT_SELECT} WHERE c.id = ?`, [commentId]);
  return serializeComment(rows[0]);
}

/* Oldest first, paged with a cursor ("comments newer than id X"). */
export async function listComments(postId, { cursor, limit }) {
  await assertPostExists(postId);

  const params = [postId];
  let cursorSql = "";

  if (cursor) {
    cursorSql = "AND c.id > ?";
    params.push(cursor);
  }

  const [rows] = await pool.execute(
    `${COMMENT_SELECT} WHERE c.post_id = ? ${cursorSql} ORDER BY c.id ASC LIMIT ${limit + 1}`,
    params,
  );

  const hasMore = rows.length > limit;
  const pageRows = rows.slice(0, limit);

  return {
    items: pageRows.map(serializeComment),
    meta: { limit, nextCursor: hasMore ? pageRows[pageRows.length - 1].id : null },
  };
}

export async function createComment(user, postId, { content }) {
  await assertPostExists(postId);

  const [result] = await pool.execute("INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)", [
    postId,
    user.id,
    content,
  ]);

  return { comment: await loadComment(result.insertId), commentCount: await countComments(postId) };
}

export async function updateComment(user, commentId, { content }) {
  const [rows] = await pool.execute("SELECT id, user_id FROM comments WHERE id = ?", [commentId]);

  if (!rows[0]) throw new AppError(404, "Comment not found.");
  if (rows[0].user_id !== user.id) throw new AppError(403, "You can only edit your own comments.");

  await pool.execute("UPDATE comments SET content = ? WHERE id = ? AND user_id = ?", [content, commentId, user.id]);

  return loadComment(commentId);
}

/* Author or administrator (moderation). */
export async function deleteComment(user, commentId) {
  const [rows] = await pool.execute("SELECT id, post_id, user_id FROM comments WHERE id = ?", [commentId]);

  if (!rows[0]) throw new AppError(404, "Comment not found.");

  if (rows[0].user_id !== user.id && user.role !== USER_ROLES.ADMIN) {
    throw new AppError(403, "You can only delete your own comments.");
  }

  await pool.execute("DELETE FROM comments WHERE id = ?", [commentId]);

  return { commentCount: await countComments(rows[0].post_id) };
}
