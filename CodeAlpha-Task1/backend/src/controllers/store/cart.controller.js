import asyncHandler from "../../utils/asyncHandler.js";
import * as cartService from "../../services/store/cart.service.js";

/* The user always comes from the verified token (req.user), never from the request body. */

export const show = asyncHandler(async (req, res) => {
  res.json({ data: await cartService.getCart(req.user.id) });
});

export const addItem = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await cartService.addItem(req.user.id, req.valid.body) });
});

export const updateItem = asyncHandler(async (req, res) => {
  res.json({ data: await cartService.updateItem(req.user.id, req.valid.params.id, req.valid.body) });
});

export const removeItem = asyncHandler(async (req, res) => {
  res.json({ data: await cartService.removeItem(req.user.id, req.valid.params.id) });
});
