import { z } from "zod";
import { booleanish, cursorQuery, idParams, optionalInt } from "./common.js";

const postContent = z
  .string({ required_error: "Write something first." })
  .trim()
  .min(1, "Write something first.")
  .max(1000, "Posts can be at most 1000 characters.");

const commentContent = z
  .string({ required_error: "Write a comment first." })
  .trim()
  .min(1, "Write a comment first.")
  .max(500, "Comments can be at most 500 characters.");

const page = z.coerce.number().int().min(1).default(1);
const listLimit = z.coerce.number().int().min(1).max(50).default(20);

/* ---- posts ---- */
export const listPostsSchema = {
  query: z.object({
    scope: z.enum(["all", "following"]).default("all"),
    userId: optionalInt,
    ...cursorQuery,
    limit: z.coerce.number().int().min(1).max(20).default(10),
  }),
};

export const postIdSchema = { params: idParams };
export const createPostSchema = { body: z.object({ content: postContent }) };
export const updatePostSchema = {
  params: idParams,
  body: z.object({ content: postContent, removeImage: booleanish }),
};

/* ---- comments ---- */
export const listCommentsSchema = {
  params: idParams,
  query: z.object({ ...cursorQuery, limit: listLimit }),
};
export const createCommentSchema = { params: idParams, body: z.object({ content: commentContent }) };
export const updateCommentSchema = { params: idParams, body: z.object({ content: commentContent }) };
export const commentIdSchema = { params: idParams };

/* ---- users / profiles / follows ---- */
export const userIdSchema = { params: idParams };

export const updateProfileSchema = {
  body: z.object({
    name: z.string({ required_error: "Name is required." }).trim().min(2, "Name must be at least 2 characters.").max(80),
    bio: z.string().trim().max(300, "Bio can be at most 300 characters.").default(""),
    removeAvatar: booleanish,
  }),
};

export const searchUsersSchema = {
  query: z.object({ q: z.string().trim().max(50).optional(), page, limit: listLimit }),
};

export const userListSchema = {
  params: idParams,
  query: z.object({ page, limit: listLimit }),
};
