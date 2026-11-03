import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

/*
 * Loads environment variables ONCE and exposes a validated config object.
 * Every other file imports `env` from here instead of reading process.env,
 * so a missing variable fails fast at startup with a clear message.
 */

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: path.join(rootDir, envFile) });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name} (see .env.example)`,
    );
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  rootDir,
  uploadsDir: path.join(rootDir, "uploads"),
  publicDir: path.join(rootDir, "public"),
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: required("DB_USER"),
    password: process.env.DB_PASSWORD ?? "",
    database: required("DB_NAME"),
  },
  jwt: {
    // Not required here: the database scripts (db:init, db:seed) don't use it.
    // The server and the token helpers check it through assertJwtSecret().
    secret: process.env.JWT_SECRET || "",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
};

export function assertJwtSecret() {
  if (env.jwt.secret.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or too short. Set a random value of at least 32 characters in your .env file (see .env.example).",
    );
  }
}

export default env;
