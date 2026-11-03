import { z } from "zod";
import { idParams, optionalInt, paginationQuery } from "./common.js";

/* Form data (multipart) sends everything as text, so numbers use z.coerce. */
const price = z.coerce
  .number({ invalid_type_error: "Price must be a number." })
  .min(0.01, "Price must be at least 0.01.")
  .max(99999999.99, "Price is too large.")
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, "Price can have at most 2 decimals.");

const productBody = z.object({
  name: z.string({ required_error: "Name is required." }).trim().min(2, "Name must be at least 2 characters.").max(150),
  description: z.string().trim().max(5000).default(""),
  price,
  stock: z.coerce.number({ invalid_type_error: "Stock must be a number." }).int("Stock must be a whole number.").min(0, "Stock cannot be negative.").max(1000000),
  categoryId: z.coerce.number({ invalid_type_error: "Choose a category." }).int().positive("Choose a category."),
});

export const listProductsSchema = {
  query: z.object({
    search: z.string().trim().max(100).optional(),
    category: optionalInt,
    sort: z.enum(["newest", "price_asc", "price_desc", "name_asc"]).default("newest"),
    ...paginationQuery,
  }),
};

export const productIdSchema = { params: idParams };
export const createProductSchema = { body: productBody };
export const updateProductSchema = { params: idParams, body: productBody };
