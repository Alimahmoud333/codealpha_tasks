import pool from "../config/database.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyToken } from "../utils/jwt.js";

/*
 * Requires `Authorization: Bearer <token>`.
 * The user is re-loaded from MySQL on every request, so:
 *  - a deleted user's old token stops working,
 *  - the role always comes from the database, never from the token.
 */
export default asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError(401, "Authentication required.");
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError(401, "Your session is invalid or has expired. Please log in again.");
  }

  const [rows] = await pool.execute(
    "SELECT id, username, name, email, role, bio, avatar_url, created_at FROM users WHERE id = ?",
    [payload.sub],
  );

  if (!rows[0]) {
    throw new AppError(401, "Your session is invalid or has expired. Please log in again.");
  }

  req.user = rows[0];
  next();
});
