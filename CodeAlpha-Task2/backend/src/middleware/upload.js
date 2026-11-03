import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import env from "../config/env.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";

/*
 * Safe image uploads, in two steps so we never keep files for rejected requests:
 *  1. parseImage(field): multer reads the multipart body into memory (2 MB max).
 *  2. saveImage(folder): runs AFTER validation. It checks the file's real
 *     signature ("magic bytes"), ignores the client's filename/MIME type,
 *     and writes it under a random name with a fixed extension.
 */

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
});

function detectImageExtension(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buffer.length >= 8 && pngSignature.every((byte, i) => buffer[i] === byte)) {
    return "png";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

export const parseImage = (fieldName) => parser.single(fieldName);

export const saveImage = (folder) =>
  asyncHandler(async (req, res, next) => {
    if (!req.file) return next();

    const extension = detectImageExtension(req.file.buffer);
    if (!extension) {
      throw new AppError(422, "Please correct the highlighted fields.", {
        image: "Only JPEG, PNG or WebP images are allowed.",
      });
    }

    const directory = path.join(env.uploadsDir, folder);
    await fs.mkdir(directory, { recursive: true });

    const filename = `${crypto.randomUUID()}.${extension}`;
    await fs.writeFile(path.join(directory, filename), req.file.buffer);

    req.uploadedImageUrl = `/uploads/${folder}/${filename}`;
    next();
  });
