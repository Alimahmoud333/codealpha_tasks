import asyncHandler from "../../utils/asyncHandler.js";
import * as posts from "../../services/social/posts.service.js";
import * as comments from "../../services/social/comments.service.js";
import * as likes from "../../services/social/likes.service.js";

/* Every handler acts as req.user (from the verified token). Ids in the body are never trusted. */

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await posts.listPosts(req.user.id, req.valid.query);
  res.json({ data: items, meta });
});

export const show = asyncHandler(async (req, res) => {
  res.json({ data: await posts.getPost(req.user.id, req.valid.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await posts.createPost(req.user, req.valid.body, req.uploadedImageUrl) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ data: await posts.updatePost(req.user, req.valid.params.id, req.valid.body, req.uploadedImageUrl) });
});

export const remove = asyncHandler(async (req, res) => {
  await posts.deletePost(req.user, req.valid.params.id);
  res.status(204).end();
});

/* Comments that belong to a post: /posts/:id/comments */

export const listComments = asyncHandler(async (req, res) => {
  const { items, meta } = await comments.listComments(req.valid.params.id, req.valid.query);
  res.json({ data: items, meta });
});

export const createComment = asyncHandler(async (req, res) => {
  const data = await comments.createComment(req.user, req.valid.params.id, req.valid.body);
  res.status(201).json({ data });
});

/* Likes: /posts/:id/like */

export const like = asyncHandler(async (req, res) => {
  res.json({ data: await likes.likePost(req.user.id, req.valid.params.id) });
});

export const unlike = asyncHandler(async (req, res) => {
  res.json({ data: await likes.unlikePost(req.user.id, req.valid.params.id) });
});
