import mysql from "mysql2/promise";
import env from "../../src/config/env.js";
import { hashPassword } from "../../src/utils/password.js";

/*
 * Creates the first administrator from environment variables, so no admin
 * credentials ever live in source code or in Git:
 *
 *   ADMIN_EMAIL, ADMIN_PASSWORD   (required)
 *   ADMIN_NAME, ADMIN_USERNAME    (optional; default "Administrator" / "admin")
 *   (put them in your local .env)
 *
 * If the email already exists, that account is promoted to admin.
 * Public registration can never create an admin.
 */

const name = process.env.ADMIN_NAME?.trim() || "Administrator";
const username = process.env.ADMIN_USERNAME?.trim().toLowerCase() || "admin";
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (and optionally ADMIN_NAME) in your .env, then run again.");
  process.exit(1);
}

if (!/^[a-z0-9_]{3,30}$/.test(username)) {
  console.error("ADMIN_USERNAME must be 3-30 characters: lowercase letters, numbers, underscores.");
  process.exit(1);
}

if (password.length < 12) {
  console.error("ADMIN_PASSWORD must be at least 12 characters.");
  process.exit(1);
}

const connection = await mysql.createConnection({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
});

try {
  const [existing] = await connection.execute("SELECT id FROM users WHERE email = ?", [email]);

  if (existing[0]) {
    await connection.execute("UPDATE users SET role = 'admin' WHERE id = ?", [existing[0].id]);
    console.log(`Existing account ${email} is now an administrator.`);
  } else {
    await connection.execute(
      "INSERT INTO users (username, name, email, password_hash, role) VALUES (?, ?, ?, ?, 'admin')",
      [username, name, email, await hashPassword(password)],
    );
    console.log(`Administrator ${email} (@${username}) created.`);
  }
} catch (error) {
  const taken = error.code === "ER_DUP_ENTRY" ? " (that username is already taken: set ADMIN_USERNAME)" : "";
  console.error(`Could not create administrator: ${error.message}${taken}`);
  process.exitCode = 1;
} finally {
  await connection.end();
}
