/*
 * IMPORT THIS FIRST in every test file. It switches the app to .env.test,
 * refuses to touch any database whose name doesn't end in "_test",
 * and rebuilds that database from schema.sql.
 */
process.env.NODE_ENV = "test";

const { default: env } = await import("../src/config/env.js");

if (!env.db.database.endsWith("_test")) {
  throw new Error(`Refusing to run tests against "${env.db.database}". DB_NAME in .env.test must end with _test.`);
}

const { initDatabase } = await import("../database/scripts/init.js");
await initDatabase({ reset: true });
