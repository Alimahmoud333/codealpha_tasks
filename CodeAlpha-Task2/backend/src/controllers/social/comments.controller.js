import asyncHandler from "../../utils/asyncHandler.js";
import * as comments from "../../services/social/comments.service.js";

export const update = asyncHandler(async (req, res) => {
  res.json({ data: await comments.updateComment(req.user, req.valid.params.id, req.valid.body) });
});

export const remove = asyncHandler(async (req, res) => {
  res.json({ data: await comments.deleteComment(req.user, req.valid.params.id) });
});
