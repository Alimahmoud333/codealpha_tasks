import mysql from "mysql2/promise";
import env from "./env.js";

/*
 * One shared connection pool for the whole app.
 * - Queries use placeholders (?) so user input is never concatenated into SQL.
 * - Every connection is switched to UTC so timestamps are consistent.
 */

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "Z",
});

pool.pool.on("connection", (connection) => {
  connection.query("SET time_zone = '+00:00'");
});

/*
 * Runs `work(connection)` inside a transaction.
 * Commits if it resolves, rolls back if it throws, always releases the connection.
 */
export async function withTransaction(work) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;
