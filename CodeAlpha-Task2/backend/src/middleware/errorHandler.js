import multer from "multer";
import env from "../config/env.js";
import AppError from "../utils/AppError.js";
import { deleteUpload } from "../utils/files.js";

/*
 * Single place where every error becomes a JSON response:
 *   { "error": { "message": "...", "details": { "field": "..." } } }
 * Unknown errors are logged on the server but the client only sees a generic
 * message, so stack traces and SQL details never leak.
 */
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = 500;
  let message = "Something went wrong. Please try again later.";
  let details;

  if (err instanceof AppError) {
    status = err.statusCode;
    message = err.message;
    details = err.details ?? undefined;
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "The request body is not valid JSON.";
  } else if (err.type === "entity.too.large") {
    status = 413;
    message = "The request body is too large.";
  } else if (err instanceof multer.MulterError) {
    status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "The image must be 2 MB or smaller." : "Invalid file upload.";
  } else if (err.code === "ER_DUP_ENTRY") {
    status = 409;
    message = "This record already exists.";
  }

  // The request failed after its image was saved (e.g. 403 on someone else's post): don't keep the file.
  if (req.uploadedImageUrl) {
    deleteUpload(req.uploadedImageUrl);
  }

  if (status === 500 && env.nodeEnv !== "test") {
    console.error(err);
  }

  res.status(status).json({ error: { message, ...(details && { details }) } });
}
