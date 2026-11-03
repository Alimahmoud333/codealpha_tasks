import rateLimit from "express-rate-limit";
import env from "../config/env.js";

/* Slows down password guessing on login/register. Disabled in tests. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => env.nodeEnv === "test",
  message: { error: { message: "Too many attempts. Please try again in a few minutes." } },
});
