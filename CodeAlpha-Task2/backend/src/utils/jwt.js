import jwt from "jsonwebtoken";
import env, { assertJwtSecret } from "../config/env.js";

/* The token only carries the user id (`sub`). Role is always read from the DB. */
export function signToken(userId) {
  assertJwtSecret();
  return jwt.sign({ sub: String(userId) }, env.jwt.secret, {
    algorithm: "HS256",
    expiresIn: env.jwt.expiresIn,
  });
}

export function verifyToken(token) {
  assertJwtSecret();
  return jwt.verify(token, env.jwt.secret, { algorithms: ["HS256"] });
}
