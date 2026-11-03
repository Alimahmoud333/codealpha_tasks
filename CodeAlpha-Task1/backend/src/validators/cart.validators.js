import { z } from "zod";
import { idParams } from "./common.js";

const quantity = z.coerce
  .number({ invalid_type_error: "Quantity must be a number." })
  .int("Quantity must be a whole number.")
  .min(1, "Quantity must be at least 1.")
  .max(99, "Quantity cannot exceed 99.");

export const addCartItemSchema = {
  body: z.object({
    productId: z.coerce.number({ invalid_type_error: "Invalid product." }).int().positive("Invalid product."),
    quantity,
  }),
};

export const updateCartItemSchema = { params: idParams, body: z.object({ quantity }) };
export const cartItemIdSchema = { params: idParams };
