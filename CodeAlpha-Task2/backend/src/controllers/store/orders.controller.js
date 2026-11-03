import asyncHandler from "../../utils/asyncHandler.js";
import * as ordersService from "../../services/store/orders.service.js";

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await ordersService.createOrder(req.user.id, req.valid.body) });
});

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await ordersService.listOrdersForUser(req.user.id, req.valid.query);
  res.json({ data: items, meta });
});

export const show = asyncHandler(async (req, res) => {
  res.json({ data: await ordersService.getOrderForUser(req.user, req.valid.params.id) });
});

/* Admin */

export const adminList = asyncHandler(async (req, res) => {
  const { items, meta } = await ordersService.listAllOrders(req.valid.query);
  res.json({ data: items, meta });
});

export const updateStatus = asyncHandler(async (req, res) => {
  res.json({ data: await ordersService.updateOrderStatus(req.valid.params.id, req.valid.body.status) });
});
