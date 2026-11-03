import request from "supertest";
import app from "../src/app.js";
import pool from "../src/config/database.js";
import { hashPassword } from "../src/utils/password.js";

export const api = () => request(app);

let counter = 0;
export const uniqueEmail = (prefix = "user") => `${prefix}.${Date.now()}.${++counter}@example.com`;
export const uniqueUsername = (prefix = "user") => `${prefix}_${Date.now().toString(36)}${++counter}`;

export const PASSWORD = "Password123";

export async function registerUser(overrides = {}) {
  const email = overrides.email ?? uniqueEmail();
  const res = await api()
    .post("/api/auth/register")
    .send({ username: uniqueUsername(), name: "Test User", email, password: PASSWORD, ...overrides });

  return { email, token: res.body.data?.token, user: res.body.data?.user, res };
}

/* Admins can't be created through the API, so the test inserts one directly. */
export async function createAdmin() {
  const email = uniqueEmail("admin");
  await pool.execute("INSERT INTO users (username, name, email, password_hash, role) VALUES (?, ?, ?, ?, 'admin')", [
    uniqueUsername("admin"),
    "Test Admin",
    email,
    await hashPassword(PASSWORD),
  ]);

  const res = await api().post("/api/auth/login").send({ email, password: PASSWORD });
  return { email, token: res.body.data.token };
}

export async function createProduct({ name = "Test Product", price = 10, stock = 5 } = {}) {
  await pool.execute("INSERT IGNORE INTO categories (name) VALUES ('Test Category')");
  const [[category]] = await pool.execute("SELECT id FROM categories WHERE name = 'Test Category'");

  const [result] = await pool.execute(
    "INSERT INTO products (category_id, name, description, price, stock) VALUES (?, ?, 'Test description', ?, ?)",
    [category.id, name, price, stock],
  );

  return result.insertId;
}

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

export const shipping = {
  fullName: "Test Customer",
  phone: "+961 70 123 456",
  address: "12 Example Street",
  city: "Sidon",
  postalCode: "1600",
  country: "Lebanon",
};

export async function stockOf(productId) {
  const [[row]] = await pool.execute("SELECT stock FROM products WHERE id = ?", [productId]);
  return row.stock;
}
