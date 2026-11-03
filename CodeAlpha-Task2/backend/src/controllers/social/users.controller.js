import asyncHandler from "../../utils/asyncHandler.js";
import * as follows from "../../services/social/follows.service.js";
import * as profiles from "../../services/social/profiles.service.js";

export const search = asyncHandler(async (req, res) => {
  const { items, meta } = await profiles.searchUsers(req.user.id, req.valid.query);
  res.json({ data: items, meta });
});

export const show = asyncHandler(async (req, res) => {
  res.json({ data: await profiles.getProfile(req.user.id, req.valid.params.id) });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await profiles.updateProfile(req.user, req.valid.body, req.uploadedImageUrl);
  res.json({ data: { user } });
});

export const followers = asyncHandler(async (req, res) => {
  const { items, meta } = await follows.listConnections(req.user.id, req.valid.params.id, "followers", req.valid.query);
  res.json({ data: items, meta });
});

export const following = asyncHandler(async (req, res) => {
  const { items, meta } = await follows.listConnections(req.user.id, req.valid.params.id, "following", req.valid.query);
  res.json({ data: items, meta });
});

export const follow = asyncHandler(async (req, res) => {
  res.json({ data: await follows.followUser(req.user.id, req.valid.params.id) });
});

export const unfollow = asyncHandler(async (req, res) => {
  res.json({ data: await follows.unfollowUser(req.user.id, req.valid.params.id) });
});
