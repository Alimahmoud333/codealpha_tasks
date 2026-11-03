import asyncHandler from "../../utils/asyncHandler.js";
import * as productsService from "../../services/store/products.service.js";

export const listCategories = asyncHandler(async (req, res) => {
  res.json({ data: await productsService.listCategories() });
});

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await productsService.listProducts(req.valid.query);
  res.json({ data: items, meta });
});

export const show = asyncHandler(async (req, res) => {
  res.json({ data: await productsService.getProduct(req.valid.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  const product = await productsService.createProduct(req.valid.body, req.uploadedImageUrl);
  res.status(201).json({ data: product });
});

export const update = asyncHandler(async (req, res) => {
  const product = await productsService.updateProduct(req.valid.params.id, req.valid.body, req.uploadedImageUrl);
  res.json({ data: product });
});

export const remove = asyncHandler(async (req, res) => {
  await productsService.deleteProduct(req.valid.params.id);
  res.status(204).end();
});
