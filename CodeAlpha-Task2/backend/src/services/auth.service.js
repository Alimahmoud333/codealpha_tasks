import pool from "../config/database.js";
import AppError from "../utils/AppError.js";
import { signToken } from "../utils/jwt.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { serializeUser } from "../utils/serializers.js";

/* A real hash, compared against when the email is unknown, so response time doesn't reveal which emails exist. */
const DUMMY_HASH = await hashPassword("not-a-real-password-1");

export async function registerUser({ username, name, email, password }) {
  const passwordHash = await hashPassword(password);

  try {
    // The role is NOT taken from the request: the column default ('customer') applies.
    const [result] = await pool.execute(
      "INSERT INTO users (username, name, email, password_hash) VALUES (?, ?, ?, ?)",
      [username, name, email, passwordHash],
    );

    const [rows] = await pool.execute(
      "SELECT id, username, name, email, role, bio, avatar_url, created_at FROM users WHERE id = ?",
      [result.insertId],
    );

    return { user: serializeUser(rows[0]), token: signToken(result.insertId) };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      // The error text names the violated unique key, so we can tell which field clashed.
      if (String(error.sqlMessage).includes("uq_users_username")) {
        throw new AppError(409, "This username is already taken.", { username: "This username is already taken." });
      }
      throw new AppError(409, "An account with this email already exists.", {
        email: "This email is already registered.",
      });
    }
    throw error;
  }
}

export async function loginUser({ email, password }) {
  const [rows] = await pool.execute(
    "SELECT id, username, name, email, role, bio, avatar_url, created_at, password_hash FROM users WHERE email = ?",
    [email],
  );

  const row = rows[0];
  const passwordMatches = await comparePassword(password, row ? row.password_hash : DUMMY_HASH);

  if (!row || !passwordMatches) {
    throw new AppError(401, "Invalid email or password.");
  }

  return { user: serializeUser(row), token: signToken(row.id) };
}
