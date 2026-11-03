import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { deleteUpload } from "../../utils/files.js";
import { serializePublicUser, serializeUser } from "../../utils/serializers.js";

export async function getProfile(viewerId, userId) {
  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.name, u.bio, u.avatar_url, u.created_at,
            (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS post_count,
            (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count,
            (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count,
            EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) AS is_following
     FROM users u
     WHERE u.id = ?`,
    [viewerId, userId],
  );

  const row = rows[0];
  if (!row) throw new AppError(404, "User not found.");

  return {
    ...serializePublicUser(row),
    joinedAt: row.created_at,
    stats: {
      posts: Number(row.post_count),
      followers: Number(row.follower_count),
      following: Number(row.following_count),
    },
    isFollowing: Boolean(Number(row.is_following)),
    isSelf: row.id === viewerId,
  };
}

/*
 * Edits the CURRENT user only (id from the token). Username, email and role
 * are not editable here, so extra fields in the request can't change them.
 */
export async function updateProfile(user, { name, bio, removeAvatar }, newAvatarUrl) {
  const oldAvatar = user.avatar_url;
  let avatarUrl = oldAvatar;

  if (newAvatarUrl) avatarUrl = newAvatarUrl;
  else if (removeAvatar) avatarUrl = null;

  await pool.execute("UPDATE users SET name = ?, bio = ?, avatar_url = ? WHERE id = ?", [
    name,
    bio || null,
    avatarUrl,
    user.id,
  ]);

  if (avatarUrl !== oldAvatar) await deleteUpload(oldAvatar);

  const [rows] = await pool.execute(
    "SELECT id, username, name, email, role, bio, avatar_url, created_at FROM users WHERE id = ?",
    [user.id],
  );

  return serializeUser(rows[0]);
}

const escapeLike = (value) => value.replace(/[\\%_]/g, "\\$&");

/*
 * Without a search term: suggestions = people you don't follow yet, most followed first.
 * With a term: matches username or display name (including people you already follow).
 */
export async function searchUsers(viewerId, { q, page, limit }) {
  const where = ["u.id <> ?"];
  const whereParams = [viewerId];

  if (q) {
    const pattern = `%${escapeLike(q)}%`;
    where.push("(u.username LIKE ? OR u.name LIKE ?)");
    whereParams.push(pattern, pattern);
  } else {
    where.push("NOT EXISTS (SELECT 1 FROM follows x WHERE x.follower_id = ? AND x.following_id = u.id)");
    whereParams.push(viewerId);
  }

  const whereSql = where.join(" AND ");
  const offset = (page - 1) * limit;

  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM users u WHERE ${whereSql}`, whereParams);

  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.name, u.bio, u.avatar_url,
            (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS follower_count,
            EXISTS(SELECT 1 FROM follows mine WHERE mine.follower_id = ? AND mine.following_id = u.id) AS is_following
     FROM users u
     WHERE ${whereSql}
     ORDER BY follower_count DESC, u.id ASC
     LIMIT ${limit} OFFSET ${offset}`,
    [viewerId, ...whereParams],
  );

  return {
    items: rows.map((row) => ({
      ...serializePublicUser(row),
      followerCount: Number(row.follower_count),
      isFollowing: Boolean(Number(row.is_following)),
    })),
    meta: { page, limit, total: Number(total), totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}
