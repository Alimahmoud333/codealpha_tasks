import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import env from "../../src/config/env.js";
import { hashPassword } from "../../src/utils/password.js";
import { sampleComments, sampleFollows, sampleLikes, samplePosts, sampleUsers } from "./social-seed-data.js";

/*
 * Loads sample data. Safe to run again: each part is skipped if it already exists.
 *   1. Store: categories + products (database/seed.sql)
 *   2. Social: sample accounts, posts, comments, likes, follows
 *      (needs SEED_DEMO_PASSWORD in .env: it becomes every sample account's password)
 */

const connection = await mysql.createConnection({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  multipleStatements: true,
});

async function seedCatalog() {
  const [[{ total }]] = await connection.query("SELECT COUNT(*) AS total FROM products");

  if (total > 0) {
    console.log("Products already exist: catalog skipped.");
    return;
  }

  const sql = await fs.readFile(path.join(env.rootDir, "database", "seed.sql"), "utf8");
  await connection.query(sql);
  console.log("Sample categories and products inserted.");
}

async function seedSocial() {
  const password = process.env.SEED_DEMO_PASSWORD;

  if (!password) {
    console.log("SEED_DEMO_PASSWORD is not set: sample accounts and social data skipped.");
    return;
  }

  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error("SEED_DEMO_PASSWORD needs at least 8 characters, including a letter and a number.");
  }

  const passwordHash = await hashPassword(password);
  const ids = new Map();

  for (const user of sampleUsers) {
    await connection.execute(
      "INSERT IGNORE INTO users (username, name, email, password_hash, bio) VALUES (?, ?, ?, ?, ?)",
      [user.username, user.name, user.email, passwordHash, user.bio],
    );

    const [[row]] = await connection.execute("SELECT id FROM users WHERE username = ?", [user.username]);
    ids.set(user.username, row.id);
  }
  console.log(`${sampleUsers.length} sample accounts ready (demo login: demo.customer@example.com).`);

  const [[{ total }]] = await connection.query("SELECT COUNT(*) AS total FROM posts");

  if (total > 0) {
    console.log("Posts already exist: sample posts, comments, likes and follows skipped.");
    return;
  }

  const postIds = [];

  for (const post of samplePosts) {
    const [result] = await connection.execute(
      "INSERT INTO posts (user_id, content, created_at, updated_at) VALUES (?, ?, NOW() - INTERVAL ? HOUR, NOW() - INTERVAL ? HOUR)",
      [ids.get(post.by), post.content, post.hoursAgo, post.hoursAgo],
    );
    postIds.push(result.insertId);
  }

  for (const comment of sampleComments) {
    await connection.execute(
      "INSERT INTO comments (post_id, user_id, content, created_at, updated_at) VALUES (?, ?, ?, NOW() - INTERVAL ? HOUR, NOW() - INTERVAL ? HOUR)",
      [postIds[comment.post], ids.get(comment.by), comment.content, comment.hoursAgo, comment.hoursAgo],
    );
  }

  for (const like of sampleLikes) {
    for (const username of like.users) {
      await connection.execute("INSERT IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)", [
        postIds[like.post],
        ids.get(username),
      ]);
    }
  }

  for (const [follower, following] of sampleFollows) {
    await connection.execute("INSERT IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)", [
      ids.get(follower),
      ids.get(following),
    ]);
  }

  console.log("Sample posts, comments, likes and follows inserted.");
}

try {
  await seedCatalog();
  await seedSocial();
} catch (error) {
  console.error(`Seeding failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await connection.end();
}
