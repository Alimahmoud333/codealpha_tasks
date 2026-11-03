import asyncHandler from "../utils/asyncHandler.js";
import * as authService from "../services/auth.service.js";
import { serializeUser } from "../utils/serializers.js";

export const register = asyncHandler(async (req, res) => {
  const data = await authService.registerUser(req.valid.body);
  res.status(201).json({ data });
});

export const login = asyncHandler(async (req, res) => {
  const data = await authService.loginUser(req.valid.body);
  res.json({ data });
});

export const me = (req, res) => {
  res.json({ data: { user: serializeUser(req.user) } });
};
