import { z } from "zod";
import { idParams } from "./common.js";
import { ORDER_STATUSES } from "../utils/constants.js";

const text = (label, min, max) =>
  z
    .string({ required_error: `${label} is required.` })
    .trim()
    .min(min, `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be at most ${max} characters.`);

/*
 * Only delivery details are accepted. Prices, totals, status and payment method
 * are never read from the client; the server decides them.
 */
export const createOrderSchema = {
  body: z.object({
    fullName: text("Full name", 2, 100),
    phone: text("Phone", 7, 20).regex(/^\+?[\d\s().-]{7,20}$/, "Enter a valid phone number."),
    address: text("Address", 5, 255),
    city: text("City", 2, 100),
    postalCode: text("Postal code", 2, 20),
    country: text("Country", 2, 100),
    notes: z.string().trim().max(500).optional().default(""),
  }),
};

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
};

export const listOrdersSchema = { query: z.object(pagination) };
export const orderIdSchema = { params: idParams };

export const adminListOrdersSchema = {
  query: z.object({
    status: z.enum(ORDER_STATUSES).optional(),
    ...pagination,
  }),
};

export const updateOrderStatusSchema = {
  params: idParams,
  body: z.object({ status: z.enum(ORDER_STATUSES, { errorMap: () => ({ message: "Invalid status." }) }) }),
};
