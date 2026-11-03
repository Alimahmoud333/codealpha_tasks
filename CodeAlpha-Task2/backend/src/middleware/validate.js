import AppError from "../utils/AppError.js";

/*
 * validate({ params, query, body }) checks each part with a zod schema.
 * On success the cleaned values are placed in `req.valid.<part>` (controllers
 * only read from there). On failure it responds 422 with one message per field.
 */
export default function validate(schemas) {
  return (req, res, next) => {
    const valid = {};
    const details = {};

    for (const part of ["params", "query", "body"]) {
      if (!schemas[part]) continue;

      const result = schemas[part].safeParse(req[part] ?? {});

      if (result.success) {
        valid[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          const field = issue.path.join(".") || part;
          if (!details[field]) details[field] = issue.message;
        }
      }
    }

    if (Object.keys(details).length > 0) {
      return next(new AppError(422, "Please correct the highlighted fields.", details));
    }

    req.valid = valid;
    next();
  };
}
