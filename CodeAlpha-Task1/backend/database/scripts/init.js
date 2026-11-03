import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import env from "../../src/config/env.js";

/*
 * Creates the database (if missing) and runs database/schema.sql.
 *   npm run db:init    -> create what is missing, keep existing data
 *   npm run db:reset   -> DROP the database and rebuild it (deletes all data!)
 */
export async function initDatabase({ reset = false } = {}) {
  const dbName = env.db.database;

  if (!/^[A-Za-z0-9_]+$/.test(dbName)) {
    throw new Error("DB_NAME may only contain letters, numbers and underscores.");
  }
  if (reset && env.nodeEnv === "production") {
    throw new Error("Refusing to reset the database in production.");
  }

  const schema = await fs.readFile(path.join(env.rootDir, "database", "schema.sql"), "utf8");

  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  });

  try {
    if (reset) await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await connection.query(`USE \`${dbName}\``);
    await connection.query(schema);
  } finally {
    await connection.end();
  }
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  const reset = process.argv.includes("--reset");

  try {
    await initDatabase({ reset });
    console.log(`Database "${env.db.database}" is ready${reset ? " (reset)" : ""}.`);
  } catch (error) {
    console.error(`Database setup failed: ${error.message}`);
    process.exit(1);
  }
}
