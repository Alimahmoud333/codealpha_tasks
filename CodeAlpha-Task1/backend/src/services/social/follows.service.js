import pool from "../../config/database.js";
import AppError from "../../utils/AppError.js";

async function assertUserExists(userId) {
  const [rows] = await pool.execute("SELECT id FROM users WHERE id = ?", [userId]);
  if (!rows[0]) throw new AppError(404, "User not found.");
}

async function followState(targetId, viewerId) {
  const [[{ total }]] = await pool.execute("SELECT COUNT(*) AS total FROM follows WHERE following_id = ?", [targetId]);
  const [mine] = await pool.execute("SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?", [viewerId, targetId]);

  return { following: mine.length > 0, followerCount: Number(total) };
}

export async function followUser(viewerId, targetId) {
  // Enforced here (not with a CHECK constraint, which MySQL forbids with cascading foreign keys).
  if (viewerId === targetId) throw new AppError(400, "You can't follow yourself.");

  await assertUserExists(targetId);

  // The composite primary key blocks duplicates; a repeat request is a harmless no-op.
  await pool.execute(
    "INSERT INTO follows (follower_id, following_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE follower_id = follower_id",
    [viewerId, targetId],
  );

  return followState(targetId, viewerId);
}

export async function unfollowUser(viewerId, targetId) {
  await assertUserExists(targetId);

  await pool.execute("DELETE FROM follows WHERE follower_id = ? AND following_id = ?", [viewerId, targetId]);

  return followState(targetId, viewerId);
}

/*
 * direction "followers": people who follow `userId`  (join column = follower_id)
 * direction "following": people `userId` follows     (join column = following_id)
 * The column names come from this fixed map, never from user input.
 */
const DIRECTIONS = {
  followers: { join: "f.follower_id", filter: "f.following_id" },
  following: { join: "f.following_id", filter: "f.follower_id" },
};

export async function listConnections(viewerId, userId, direction, { page, limit }) {
  await assertUserExists(userId);

  const { join, filter } = DIRECTIONS[direction];
  const offset = (page - 1) * limit;

  const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM follows f WHERE ${filter} = ?`, [userId]);

  const [rows] = await pool.execute(
    `SELECT u.id, u.username, u.name, u.bio, u.avatar_url,
            EXISTS(SELECT 1 FROM follows mine WHERE mine.follower_id = ? AND mine.following_id = u.id) AS is_following
     FROM follows f
     JOIN users u ON u.id = ${join}
     WHERE ${filter} = ?
     ORDER BY f.created_at DESC, u.id DESC
     LIMIT ${limit} OFFSET ${offset}`,
    [viewerId, userId],
  );

  return {
    items: rows.map((row) => ({
      id: row.id,
      username: row.username,
      name: row.name,
      bio: row.bio ?? "",
      avatarUrl: row.avatar_url ?? null,
      isFollowing: Boolean(Number(row.is_following)),
      isSelf: row.id === viewerId,
    })),
    meta: { page, limit, total: Number(total), totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}
