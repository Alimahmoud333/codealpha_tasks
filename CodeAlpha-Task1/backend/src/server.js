import app from "./app.js";
import pool from "./config/database.js";
import env, { assertJwtSecret } from "./config/env.js";

assertJwtSecret(); // stop right away, with a clear message, if the .env file is incomplete

try {
  await pool.query("SELECT 1");
} catch (error) {
  console.error(
    `Could not connect to MySQL database "${env.db.database}": ${error.message}`,
  );
  console.error("Check your .env values and that you ran `npm run db:init`.");
  process.exit(1);
}

const server = app.listen(env.port, () => {
  console.log(`API running on http://localhost:${env.port} (${env.nodeEnv})`);
});

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
