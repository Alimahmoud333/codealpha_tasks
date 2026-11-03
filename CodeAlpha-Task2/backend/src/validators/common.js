import { z } from "zod";

export const idParams = z.object({
  id: z.coerce.number({ invalid_type_error: "Invalid id." }).int().positive("Invalid id."),
});

/* Query strings arrive as text; an empty value (?category=) means "not set". */
export const optionalInt = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().int().positive().optional(),
);

export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
};

/* Multipart forms send booleans as the text "true"/"false"; JSON clients send real booleans. */
export const booleanish = z.preprocess(
  (value) => (value === "true" ? true : value === "false" ? false : value),
  z.boolean().optional().default(false),
);

export const cursorQuery = {
  cursor: optionalInt,
};
