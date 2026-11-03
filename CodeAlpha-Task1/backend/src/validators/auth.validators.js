import { z } from "zod";

/* bcrypt only uses the first 72 BYTES of a password, so longer ones are rejected. */
const password = z
  .string({ required_error: "Password is required." })
  .min(8, "Password must be at least 8 characters.")
  .refine((value) => Buffer.byteLength(value) <= 72, "Password is too long.")
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), "Password must contain a letter and a number.");

const email = z
  .string({ required_error: "Email is required." })
  .trim()
  .toLowerCase()
  .max(255)
  .email("Enter a valid email address.");

/* Unknown keys (for example "role") are stripped by zod, so clients can't set them. */
const username = z
  .string({ required_error: "Username is required." })
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters.")
  .max(30, "Username must be at most 30 characters.")
  .regex(/^[a-z0-9_]+$/, "Use only letters, numbers and underscores.");

export const registerSchema = {
  body: z.object({
    username,
    name: z.string({ required_error: "Name is required." }).trim().min(2, "Name must be at least 2 characters.").max(80),
    email,
    password,
  }),
};

export const loginSchema = {
  body: z.object({
    email,
    password: z.string({ required_error: "Password is required." }).min(1, "Password is required."),
  }),
};
