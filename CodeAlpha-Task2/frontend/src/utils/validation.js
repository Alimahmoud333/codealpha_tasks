/*
 * Client-side checks give instant feedback. They mirror the backend rules,
 * but the server validates again: these checks are for convenience only.
 * Every validator returns an object { fieldName: "message" } (empty = valid).
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9_]+$/;
const PHONE_PATTERN = /^\+?[\d\s().-]{7,20}$/;

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "../constants/appConfig.js";

export const hasErrors = (errors) => Object.keys(errors).length > 0;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = "Enter your email address.";
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  return errors;
}

export function validateRegister({ username, name, email, password, confirmPassword }) {
  const errors = {};
  const handle = username.trim().toLowerCase();

  if (handle.length < 3) errors.username = "Username must be at least 3 characters.";
  else if (handle.length > 30) errors.username = "Username must be at most 30 characters.";
  else if (!USERNAME_PATTERN.test(handle)) errors.username = "Use only letters, numbers and underscores.";

  if (name.trim().length < 2) errors.name = "Name must be at least 2 characters.";

  if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Enter a valid email address.";

  if (password.length < 8) errors.password = "Password must be at least 8 characters.";
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = "Password must contain a letter and a number.";

  if (confirmPassword !== password) errors.confirmPassword = "Passwords do not match.";

  return errors;
}

export function validateCheckout(values) {
  const errors = {};
  const check = (field, label, min, max) => {
    const length = values[field].trim().length;
    if (length === 0) errors[field] = `${label} is required.`;
    else if (length < min) errors[field] = `${label} must be at least ${min} characters.`;
    else if (length > max) errors[field] = `${label} must be at most ${max} characters.`;
  };

  check("fullName", "Full name", 2, 100);
  check("address", "Address", 5, 255);
  check("city", "City", 2, 100);
  check("postalCode", "Postal code", 2, 20);
  check("country", "Country", 2, 100);

  if (!values.phone.trim()) errors.phone = "Phone is required.";
  else if (!PHONE_PATTERN.test(values.phone.trim())) errors.phone = "Enter a valid phone number.";

  if (values.notes.trim().length > 500) errors.notes = "Notes must be at most 500 characters.";

  return errors;
}

export function validateProduct({ name, description, price, stock, categoryId }) {
  const errors = {};

  if (name.trim().length < 2) errors.name = "Name must be at least 2 characters.";
  if (description.length > 5000) errors.description = "Description is too long.";

  const priceNumber = Number(price);
  if (price === "" || Number.isNaN(priceNumber) || priceNumber < 0.01) errors.price = "Enter a price of at least 0.01.";
  else if (Math.abs(priceNumber * 100 - Math.round(priceNumber * 100)) > 1e-6) errors.price = "Price can have at most 2 decimals.";

  const stockNumber = Number(stock);
  if (stock === "" || !Number.isInteger(stockNumber) || stockNumber < 0) errors.stock = "Stock must be a whole number, 0 or more.";

  if (!categoryId) errors.categoryId = "Choose a category.";

  return errors;
}

/* Returns an error message for an unsuitable image file, or "" when it is fine. */
export function validateImageFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "Choose a JPEG, PNG or WebP image.";
  if (file.size > MAX_IMAGE_BYTES) return "The image must be 2 MB or smaller.";
  return "";
}
